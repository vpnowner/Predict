class PredictionManager {
    static log = (t,m,d) => console.log(`[${t}]`,m,d||'');
    static latestHistoryData = [];
    static latestGameData = null;
    static updateInterval = null;
    static bodyObserver = null;
    static gameTimerIntervalId = null;
    static iconDebounceTimer = null;
    static predictor = null;
    static currentPredictedIssue = null;

    static stopPrediction() {
        ActivePredictionBarUI.hide();
        this.currentPredictedIssue = null;
        PredictionManagerUI.updateStartStopButtonState();
    }

    static handleStartStopClick() {
        if (ActivePredictionBarUI.barElement?.isConnected) {
            this.stopPrediction();
        } else {
            this.handleStartPredictionClick();
        }
    }

    static async handleStartPredictionClick() {
        PredictionManagerUI.setStartButtonLoading(true);
        try {
            this.log('IOS MODS', 'Start Prediction button clicked.');
            
            const tenantAccount = LoginManager.latestTenantAccount;
            if (!tenantAccount) {
                this.log('UserCheck', 'Tenant account not available from LoginManager. Cannot perform user check.');
                PredictionManagerUI.showPredictionFailedModal();
                return;
            }
            
            this.log('UserCheck', 'Retrieved tenantAccount for check:', tenantAccount);
            
            const isVerified = await SupabaseManager.isUserVerified(String(tenantAccount));
            if (isVerified) {
                this.log('UserCheck', `User ${tenantAccount} is VERIFIED (Our Member).`);
                
                // Check user balance
                const balance = LoginManager.latestUserBalance;
                this.log('BalanceCheck', 'Retrieved balance for check:', balance);
                
                if (balance === null || balance === undefined || isNaN(parseFloat(balance))) {
                    this.log('BalanceCheck', 'User balance not available or invalid. Cannot perform balance check. Balance value:', balance);
                    PredictionManagerUI.showPredictionFailedModal();
                    return;
                }
                
                const numericBalance = parseFloat(balance);
                if (numericBalance >= 500) {
                    this.log('BalanceCheck', `User ${tenantAccount} has SUFFICIENT balance: ${numericBalance}. Required: 500.`);
                    
                    // Close the prediction menu
                    PredictionManagerUI.hideMenu();
                    
                    // Clear the game timer interval
                    if (this.gameTimerIntervalId) {
                        clearInterval(this.gameTimerIntervalId);
                        this.gameTimerIntervalId = null;
                    }
                    
                    // Format timer string
                    let formattedTimer = "0:00";
                    const timeInSeconds = this.latestGameData?.timeRemaining;
                    if (typeof timeInSeconds === 'number' && timeInSeconds >= 0) {
                        const minutes = Math.floor(timeInSeconds / 60);
                        const seconds = timeInSeconds % 60;
                        formattedTimer = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    }
                    
                    const activeIssueNum = this.latestGameData?.issueNumber;
                    
                    // Get dynamic prediction
                    const fetchedPrediction = await this.predictor.getPrediction(
                        activeIssueNum,
                        this.latestHistoryData,
                        this.latestGameData?.gameType
                    ) || { number: null, size: 'N/A', color: 'grey' };
                    
                    // Show the active prediction bar with dynamic data
                    const predictionData = {
                        issue: activeIssueNum?.slice(-5) || "N/A",
                        timeLeft: formattedTimer,
                        gameType: this.latestGameData?.gameType,
                        prediction: fetchedPrediction
                    };
                    
                    ActivePredictionBarUI.show(predictionData);
                    this.currentPredictedIssue = activeIssueNum;
                    PredictionManagerUI.updateStartStopButtonState();
                    
                } else {
                    this.log('BalanceCheck', `User ${tenantAccount} has INSUFFICIENT balance: ${numericBalance}. Required: 500.`);
                    PredictionManagerUI.showInsufficientBalanceModal(numericBalance);
                    return;
                }
            } else {
                this.log('UserCheck', `User ${tenantAccount} is NOT VERIFIED (Not Our Member).`);
                
                // Determine brandName and userName for logout popup
                let determinedBrandName = 'OKWIN'; // Default brand name
                let userNameForPopup = tenantAccount; // Use tenantAccount as username for popup
                
                try {
                    const urlForBrandLookup = window.location.href;
                    if (LoginManager.brandConfigs && LoginManager.brandConfigs.length > 0) {
                        const { brandConfig } = LoginManager.identifyBrandAndAction(urlForBrandLookup);
                        if (brandConfig) {
                            determinedBrandName = brandConfig.brand_name;
                        }
                    }
                } catch (e) {
                    this.log('Error', 'Could not determine brand for logout popup:', e);
                }
                
                const inviteCode = LoginManager.getBrandInviteCode(determinedBrandName);
                LogoutManager.initiateForceLogoutAndShowPopup(String(userNameForPopup), inviteCode, determinedBrandName);
                return;
            }
        } catch (error) {
            this.log('Error', 'Error during start prediction click:', error);
            PredictionManagerUI.showPredictionFailedModal();
        } finally {
            PredictionManagerUI.setStartButtonLoading(false);
        }
    }

    static isWinGoGamePage = url => /\/#\/saasLottery\/WinGo\?gameCode=WinGo_/.test(url);

    static managePageIcons() {
        if (!document.body) return;
        const show = this.isWinGoGamePage(location.href);
        document.querySelector('img[data-origin*="icon_sevice"]')?.style?.setProperty('display','none');
        
        if (show) {
            PredictionManagerUI.createMovableIcon();
        } else {
            PredictionManagerUI.removeMovableIcon();
            // Hide menu and clear timer if it's open when navigating away
            if (PredictionManagerUI.menuElement?.isConnected) {
                PredictionManagerUI.hideMenu();
                if (this.gameTimerIntervalId) {
                    clearInterval(this.gameTimerIntervalId);
                    this.gameTimerIntervalId = null;
                    this.log('Debug', 'Cleared game timer due to page navigation while menu was open.');
                }
            }
            // Hide prediction bar if visible when navigating away from WinGo pages
            if (ActivePredictionBarUI.barElement?.isConnected) {
                ActivePredictionBarUI.hide();
            }
        }
    }

    static updateMenu() {
        // Get current brand name from URL
        const brandName = LoginManager.identifyBrandAndAction(window.location.href)?.brand || 'N/A';
        
        PredictionManagerUI.updateBrandNameInMenu(brandName);
        PredictionManagerUI.updateGameTypeInMenu(this.latestGameData?.gameType);
        this.updateTimerAndIssueInfo(this.latestGameData);
        PredictionManagerUI.renderHistoryInMenu(this.latestHistoryData);
        PredictionManagerUI.renderStatisticsChart(this.latestHistoryData);
        PredictionManagerUI.updateStartStopButtonState();
    }

    static updateTimerAndIssueInfo(data) {
        clearInterval(this.gameTimerIntervalId);
        if (!data?.timeRemaining) {
            PredictionManagerUI.updateCurrentIssueInMenu();
            PredictionManagerUI.updateTimeLeftInMenu();
            return;
        }
        PredictionManagerUI.updateCurrentIssueInMenu(data.issueNumber?.slice(-5));
        let time = data.timeRemaining;
        const updateTimer = () => {
            if (time < 0) {
                clearInterval(this.gameTimerIntervalId);
                PredictionManagerUI.updateTimeLeftInMenu('Next...');
                return;
            }
            PredictionManagerUI.updateTimeLeftInMenu(`${~~(time/60)}:${(time%60).toString().padStart(2,'0')}`);
            time--;
        };
        updateTimer();
        this.gameTimerIntervalId = setInterval(updateTimer, 1000);
    }

    static togglePredictionMenu() {
        if (PredictionManagerUI.menuElement?.isConnected) {
            PredictionManagerUI.hideMenu();
            clearInterval(this.gameTimerIntervalId);
        } else {
            PredictionManagerUI.showMenu();
            this.updateMenu();
        }
    }

    static handleMenuExplicitClose() {
        PredictionManagerUI.hideMenu();
        clearInterval(this.gameTimerIntervalId);
        if (ActivePredictionBarUI.barElement?.isConnected) {
            this.stopPrediction();
        }
    }

    static scrapeCurrentGameData() {
        try {
            const timeEl = document.querySelector('.TimeLeft__C-time');
            let time = 0;
            if (timeEl) {
                let [m,s] = ['',''], c = false;
                [...timeEl.children].forEach(el => {
                    const t = el.textContent.trim();
                    t === ':' ? c = true : !isNaN(t) && (c ? s += t : m += t);
                });
                time = (+m||0)*60 + (+s||0);
            }
            this.latestGameData = {
                gameType: document.querySelector('.TimeLeft__C-name')?.textContent?.trim(),
                issueNumber: document.querySelector('.TimeLeft__C-id')?.textContent?.trim(),
                timeRemaining: time
            };
            return this.latestGameData;
        } catch(e) {
            this.log('Error','Game data failed');
            return null;
        }
    }

    static scrapeHistoryData() {
        try {
            this.latestHistoryData = [...document.querySelectorAll('.record-body .van-row')].map(row => {
                const numEl = row.querySelector('.record-body-num');
                let color = numEl?.classList.contains('greenColor') ? 'green' :
                           numEl?.classList.contains('redColor') ? 'red' :
                           numEl?.classList.contains('violetColor') ? 'violet' :
                           numEl?.classList.contains('defaultColor') ? 'red' :
                           row.querySelector('.record-origin-I.green') ? 'green' :
                           row.querySelector('.record-origin-I.red') ? 'red' :
                           row.querySelector('.record-origin-I.violet') ? 'violet' : 'unknown';
                return {
                    issueNumber: row.querySelector('.van-col--10')?.textContent?.trim(),
                    number: numEl?.textContent?.trim(),
                    size: row.querySelector('.van-col--5 span')?.textContent?.trim(),
                    color
                };
            }).filter(i => i.issueNumber);
            return this.latestHistoryData;
        } catch(e) {
            this.log('Error','History failed');
            return [];
        }
    }

    static updateData = async () => {
        if (document.body && this.isWinGoGamePage(location.href)) {
            this.scrapeCurrentGameData();
            this.scrapeHistoryData();
            PredictionManagerUI.menuElement?.isConnected && this.updateMenu();
            
            if (ActivePredictionBarUI.barElement?.isConnected) {
                const timeInSeconds = this.latestGameData?.timeRemaining;
                const minutes = Math.floor(timeInSeconds / 60);
                const seconds = timeInSeconds % 60;
                const formattedTimer = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                if (this.latestGameData?.issueNumber !== this.currentPredictedIssue && this.latestGameData?.issueNumber) {
                    const newPrediction = await this.predictor.getPrediction(
                        this.latestGameData.issueNumber,
                        this.latestHistoryData,
                        this.latestGameData.gameType
                    ) || { number: null, size: 'N/A', color: 'grey' };
                    
                    this.currentPredictedIssue = this.latestGameData.issueNumber;
                    
                    ActivePredictionBarUI.update({
                        issue: this.latestGameData.issueNumber?.slice(-5),
                        timeLeft: formattedTimer,
                        gameType: this.latestGameData.gameType,
                        prediction: newPrediction
                    });
                } else {
                ActivePredictionBarUI.update({
                    issue: this.latestGameData?.issueNumber?.slice(-5),
                    timeLeft: formattedTimer,
                    gameType: this.latestGameData?.gameType
                });
                }
            }
        }
    }

    static startDataUpdates = () => {
        this.updateData();
        this.updateInterval ||= setInterval(this.updateData, 1000);
    }

    static init() {
        this.log('Init','Starting');
        this.predictor = new PredictionLogic();
        this.predictor.setPredictionMode('random');
        const setup = () => {
            this.managePageIcons();
            this.startDataUpdates();
            ['hashchange','popstate'].forEach(e => addEventListener(e, () => this.managePageIcons()));
            if (document.body) {
                this.bodyObserver?.disconnect();
                this.bodyObserver = new MutationObserver(() => {
                    clearTimeout(this.iconDebounceTimer);
                    this.iconDebounceTimer = setTimeout(() => this.managePageIcons(), 250);
                }).observe(document.body, {childList:true, subtree:true});
            }
            window.PredictionManager = this;
        };
        (document.readyState === 'loading' ? 
            addEventListener('DOMContentLoaded', setup, {once:true}) : setup());
    }
}

document.readyState === 'loading' ? 
    addEventListener('DOMContentLoaded', () => PredictionManager.init(), {once:true}) : 
    PredictionManager.init();