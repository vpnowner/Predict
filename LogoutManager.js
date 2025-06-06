console.log('[ORION_DEBUG] LogoutManager.js execution started');
class LogoutManager {
  static log(type, message, data) {
      console.log(`[${type}] [${new Date().toISOString()}]`, message, data || '');
  }

  static getThemeStyles(brandName) {
    return brandName === 'TashanWin' ? {
      container: { bg: '#0B1E45', color: '#CBD5E1' },
      header: 'linear-gradient(180deg,#005CFF 0%,#00A9FF 100%)',
      inviteBox: { bg: '#132C57', border: '#00A9FF', color: '#E0F5FF' },
      btnPrimary: 'linear-gradient(90deg,#0066FF,#00C0FF)',
      btnSecondary: { bg: '#E2E8F0', color: '#1A365D' },
      timeColor: '#94A3B8'
    } : {
      container: { bg: '#fff', color: '#4A5568' },
      header: 'linear-gradient(180deg,#F25F5C 0%,#FCA49A 100%)',
      inviteBox: { bg: '#FEF3C7', border: '#FCD34D', color: '#78350F' },
      btnPrimary: 'linear-gradient(90deg,#E86B65,#EF9085)',
      btnSecondary: { bg: '#F3F4F6', color: '#374151' },
      timeColor: '#666'
    };
  }

  static getPopupHtml(theme) {
    return `
    <style id="logoutModalStyles">
      .logout-modal-overlay { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.70); padding:16px; z-index:2147483647; opacity:0; animation:modalFadeIn .25s forwards; }
      .logout-modal-container { background:${theme.container.bg}; color:${theme.container.color}; border-radius:12px; box-shadow:0 8px 25px rgba(0,0,0,.15); width:100%; max-width:300px; min-height:430px; overflow:hidden; transform:scale(.97); opacity:0; animation:modalScale .25s .05s forwards; }
      .logout-modal-header { background:${theme.header}; color:#fff; padding:18px 16px; text-align:center; }
      .logout-modal-header h2 { margin:0; font-size:18px; font-weight:600; letter-spacing:.3px; }
      .logout-modal-content { padding:24px 20px; display:flex; flex-direction:column; justify-content:space-between; min-height:360px; text-align:center; }
      .invite-code-box { background:${theme.inviteBox.bg}; border:1px solid ${theme.inviteBox.border}; color:${theme.inviteBox.color}; padding:14px 12px; border-radius:8px; margin:20px 0; }
      .modal-btn { font-weight:600; font-size:14px; padding:12px 0; width:100%; border-radius:9999px; margin:8px 0 0; border:none; cursor:pointer; transition:transform .1s,box-shadow .15s; }
      .modal-btn-primary { background:${theme.btnPrimary}; color:#fff; }
      .modal-btn-secondary { background:${theme.btnSecondary.bg}; color:${theme.btnSecondary.color}; }
      .modal-btn:hover { transform:translateY(-1px); box-shadow:0 2px 8px rgba(0,0,0,.12); }
      @keyframes modalFadeIn {to{opacity:1}}
      @keyframes modalScale {to{opacity:1;transform:scale(1)}}
    </style>
    <div id="logoutModal" class="logout-modal-overlay">
      <div class="logout-modal-container">
        <div class="logout-modal-header"><h2>Purchase Premium</h2></div>
        <div class="logout-modal-content">
          <div>
            <p style="font-size:13px;line-height:1.5;margin:0">You've been logged out. This site requires registration with an official invite code.</p>
            <div class="invite-code-box">
              <div style="font-size:12px;font-weight:500;margin-bottom:6px">Official Invite Code</div>
              <div id="officialInviteCodeDisplay" style="font-size:18px;font-weight:700;letter-spacing:.5px"></div>
            </div>
            <div style="font-size:11px;color:${theme.timeColor};margin-top:15px">Time (UTC):<br><span id="timeDisplay"></span></div>
          </div>
          <div>
            <button id="registerBtn" class="modal-btn modal-btn-primary">Register with official Code</button>
            <button id="confirmBtn" class="modal-btn modal-btn-secondary">Acknowledge & Close</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  static showLogoutPopup(code = '65276762590', brandName = 'TashanWin') {
      ['logoutModalStyles', 'logoutModal'].forEach(id => document.getElementById(id)?.remove());
      
      const temp = document.createElement('div');
      temp.innerHTML = this.getPopupHtml(this.getThemeStyles(brandName)).trim();

      const style = temp.querySelector('style');
      const popup = temp.querySelector('#logoutModal');
      if (!style || !popup) return;

      document.head.appendChild(style);
      document.body.appendChild(popup);

      popup.querySelector('#officialInviteCodeDisplay').textContent = code;
      popup.querySelector('#timeDisplay').textContent = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }).replace(',', '');

      const handleClick = (isRegister) => {
          try {
              this.log('Popup', isRegister ? 'Register clicked' : 'Acknowledge & Close clicked', isRegister ? { code } : undefined);
              style?.remove();
              popup?.remove();
              setTimeout(() => {
                  window.location.href = window.location.origin + '/#/register';
              }, 50);
          } catch (e) {
              this.log('Error', `Failed during ${isRegister ? 'Register' : 'Acknowledge'} button action:`, e);
          }
      };

      popup.querySelector('#registerBtn').onclick = () => handleClick(true);
      popup.querySelector('#confirmBtn').onclick = () => handleClick(false);
  }

  static clearAuthTokens() {
      const keysToClear = ['token', 'tokenHeader', 'userInfo', 'refreshToken', 'pendingInviteCode', 'awaitingLoginUserInfoCheck'];
      
      this.log('Logout', '---- Starting token clearance ----');
      keysToClear.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) {
              this.log('Logout', `Found ${key}:`, value);
              localStorage.removeItem(key);
              this.log('Logout', `Removed ${key}`);
          }
      });

      this.log('Logout', '---- Verification after clear ----');
      const remainingItems = {};
      keysToClear.forEach(key => {
          remainingItems[key] = localStorage.getItem(key);
      });
      this.log('Logout', 'Remaining values:', remainingItems);
      this.log('Logout', '---- Clear completed ----');
  }

  static initiateForceLogoutAndShowPopup(username, inviteCodeToShow, brandName = 'TashanWin') {
      this.log('Logout', 'Force logout initiated', { username, brandName });
      this.clearAuthTokens();
      
      if (inviteCodeToShow && inviteCodeToShow !== '65276762590') {
          try {
              sessionStorage.setItem('invitecode', inviteCodeToShow);
              this.log('Logout', 'Set invite code in sessionStorage for pre-fill:', inviteCodeToShow);
          } catch (e) {
              this.log('Logout', 'Failed to set invite code in sessionStorage:', e);
          }
      }
      
      this.showLogoutPopup(inviteCodeToShow || '65276762590', brandName);
  }

  static async forceShow() {
      try {
          const codes = await SupabaseManager.getOurInviteCodes();
          this.showLogoutPopup(codes?.[0]?.invite_code || 'TEST_CODE');
      } catch(e) {
          this.showLogoutPopup('TEST_CODE');
      }
  }
}