class PredictionManagerUI {
    static movableIconElement = null;
    static menuElement = null;
    static menuStyleElement = null;
    static isDragging = false;
    static dragStart = { x: 0, y: 0, iconX: 0, iconY: 0 };
    static CLICK_THRESHOLD = 5;
    static _boundHandleIconDragMove = null;
    static _boundHandleIconDragEnd = null;
    static isExpanded = false;

    static getMovableIconSVG() {
        return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Prediction-panel logo">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FF6CAB"/>
                <stop offset="50%" stop-color="#9C6ADE"/>
                <stop offset="100%" stop-color="#7366FF"/>
              </linearGradient>
              <linearGradient id="innerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFFFFF"/>
                <stop offset="100%" stop-color="#F8FAFF"/>
              </linearGradient>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#7366FF" flood-opacity="0.4"/>
                <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#FF6CAB" flood-opacity="0.3"/>
              </filter>
            </defs>
            <g filter="url(#glow)">
              <circle cx="60" cy="60" r="44" fill="url(#grad)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
              <path d="M35 90 L20 110 L24 82 Z" fill="url(#grad)"/>
              <circle cx="60" cy="60" r="32" fill="url(#innerGrad)" stroke="rgba(115,102,255,0.1)" stroke-width="1"/>
              <polyline points="38 70 52 56 68 70 84 42" stroke="url(#grad)" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              <polygon points="84 42 94 40 92 50" fill="url(#grad)"/>
              <circle cx="52" cy="78" r="3" fill="url(#grad)"/>
              <circle cx="68" cy="78" r="3" fill="url(#grad)"/>
            </g>
        </svg>`;
    }

    static getMenuHTMLAndStyles() {
        return {
            css: `
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
                
                :root {
                    --primary-gradient: linear-gradient(135deg, #FF6CAB 0%, #7366FF 100%);
                    --primary-color: #FF6CAB;
                    --secondary-color: #7366FF;
                    --tertiary-color: #61DAFB;
                    --text-primary: #2D3748;
                    --text-secondary: #718096;
                    --green-color: #0ACF83;
                    --red-color: #F25F5C;
                    --purple-color: #9C6ADE;
                    --shadow-color: rgba(115, 102, 255, 0.15);
                    --border-radius: 14px;
                    --uiScale: 1;
                }
                
                @media (max-width: 420px) {
                    :root {
                        --uiScale: 0.85;
                    }
                }
                
                .prediction-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(12,15,29,.85);backdrop-filter:blur(5px);padding:16px;z-index:2147483646;opacity:0;animation:menuFadeIn .25s forwards;font-family:'Poppins',sans-serif}
                .prediction-container{background:#fff;color:var(--text-primary);border-radius:var(--border-radius);box-shadow:0 10px 30px var(--shadow-color), 0 0 0 1px rgba(220,220,250,0.1);width:100%;max-width:280px;overflow:hidden;transform:scale(.97);opacity:0;animation:menuScale .25s .05s forwards}
                .prediction-header{background:var(--primary-gradient);color:#fff;padding:10px;text-align:center;position:relative;border-bottom:1px solid rgba(255,255,255,0.1)}
                .prediction-header h2{margin:0;font-size:15px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px}
                .prediction-header svg{width:15px;height:15px}
                .prediction-header .close-btn{position:absolute;right:8px;top:8px;background:rgba(255,255,255,0.15);border:none;color:white;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;padding:0;transition:all 0.2s ease}
                .prediction-header .close-btn:hover{background:rgba(255,255,255,0.25);transform:rotate(90deg)}
                .prediction-content{padding:0}
                .prediction-section{padding:10px;background:linear-gradient(to bottom, rgba(249,250,255,1) 0%, rgba(255,255,255,1) 100%);border-bottom:1px solid #f0f6ff}
                .info-grid{display:grid;grid-template-columns:1fr 1fr;grid-gap:6px 10px}
                .info-item{display:flex;flex-direction:column;gap:2px}
                .info-label{color:var(--text-secondary);font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:0.3px}
                .info-value{color:var(--text-primary);font-weight:600;font-size:11px;display:flex;align-items:center}
                .info-tag{background:linear-gradient(135deg, #61DAFB 0%, #7366FF 100%);color:white;padding:1px 5px;border-radius:4px;font-size:8px;font-weight:500;margin-left:4px;box-shadow:0 2px 4px rgba(97,218,251,0.2);text-transform:uppercase;letter-spacing:0.3px}
                .prediction-timer{color:var(--primary-color);font-weight:600;font-size:11px;display:flex;align-items:center;gap:4px}
                .prediction-timer svg{width:13px;height:13px;color:var(--primary-color)}
                .prediction-btn{width:calc(100% - 20px);padding:8px;margin:10px auto;background:var(--primary-gradient);color:white;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px var(--shadow-color);transition:all 0.2s ease;position:relative;overflow:hidden;z-index:1}
                .prediction-btn::before{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg, #7366FF 0%, #FF6CAB 100%);opacity:0;transition:opacity 0.3s ease;z-index:-1}
                .prediction-btn:hover{transform:translateY(-2px);box-shadow:0 6px 16px var(--shadow-color)}
                .prediction-btn:hover::before{opacity:1}
                .prediction-btn:active{transform:translateY(0);box-shadow:0 2px 8px rgba(115,102,255,0.2)}
                .prediction-btn svg{width:13px;height:13px;filter:drop-shadow(0 1px 1px rgba(0,0,0,0.1))}
                .prediction-btn .btn-icon,
                .prediction-btn .btn-text{transition:opacity 0.2s}
                .prediction-btn.loading .btn-icon,
                .prediction-btn.loading .btn-text{opacity:0}
                .prediction-btn .btn-loader{width:16px;height:16px;border:2px solid rgba(255,255,255,0.5);border-top-color:#fff;border-radius:50%;display:none;box-sizing:border-box;animation:predBtnSpin 1s linear infinite;position:absolute;top:50%;left:50%;margin-top:-8px;margin-left:-8px}
                .prediction-btn:disabled{opacity:0.7;cursor:not-allowed}
                .prediction-btn:disabled:hover::before{opacity:0}
                
                .tab-container{display:flex;border-bottom:1px solid #f0f6ff;padding:0;background:#fff}
                .tab{padding:8px 10px;cursor:pointer;color:var(--text-secondary);font-size:11px;font-weight:500;position:relative;display:flex;align-items:center;gap:4px;transition:all 0.2s ease;flex:1;justify-content:center}
                .tab:hover{color:var(--primary-color)}
                .tab.active{color:var(--primary-color);font-weight:600;background:linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(249,250,255,1) 100%)}
                .tab.active::after{content:'';position:absolute;bottom:-1px;left:10%;width:80%;height:2px;background:var(--primary-gradient);border-radius:2px}
                .tab-content{padding:0 0 6px;background:#fff;max-height:40vh;overflow-y:auto}
                .tab-pane{display:none}
                .tab-pane.active{display:block}
                .results-table{width:100%;border-collapse:collapse;margin:0;table-layout:fixed}
                .results-table th,.results-table td{padding:6px 4px;font-size:11px;vertical-align:middle}
                .results-table th{color:var(--text-secondary);font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;padding-top:8px;padding-bottom:4px}
                .results-table td{border-bottom:1px solid #f8faff}
                .results-table tr:last-child td{border-bottom:none}
                .results-table th:first-child,.results-table td:first-child{width:40%;text-align:left;padding-left:12px}
                .results-table th:nth-child(2),.results-table td:nth-child(2){width:20%;text-align:center}
                .results-table th:last-child,.results-table td:last-child{width:40%;text-align:right;padding-right:12px}
                .results-table .issue{color:var(--text-secondary)}
                .results-table td.number{padding:0}
                .results-table td.number div{margin:auto}
                .result-tag{padding:3px 6px;border-radius:6px;font-size:9px;font-weight:600;display:inline-block;min-width:32px;text-align:center;box-shadow:0 2px 4px rgba(0,0,0,0.05);letter-spacing:0.3px}
                .result-tag.big{background:linear-gradient(135deg, #0ACF83 0%, #02AB63 100%);color:white}
                .result-tag.small{background:linear-gradient(135deg, #F25F5C 0%, #E93F3C 100%);color:white}
                .result-tag.premium{background:linear-gradient(135deg, #9C6ADE 0%, #7B52AB 100%);color:white}
                .result-tag.lock{background:#f5f6fa;color:#8E9CBC;display:flex;align-items:center;justify-content:center;gap:2px;box-shadow:none}
                .show-toggle-container{display:flex;justify-content:center;padding:2px 0 6px;background:#fff}
                .show-toggle{color:var(--text-secondary);font-size:10px;cursor:pointer;display:flex;align-items:center;gap:5px;padding:4px 8px;border-radius:4px;transition:all 0.2s ease;background:#f5f6fa;margin:0 auto}
                .show-toggle:hover{background:#eef0f7;color:var(--primary-color)}
                .show-toggle svg{transition:transform 0.2s;width:10px;height:10px}
                .show-toggle.less svg{transform:rotate(180deg)}
                .num-circle{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:11px;box-shadow:0 2px 4px rgba(0,0,0,0.05)}
                .current-badge{background:linear-gradient(135deg, #9C6ADE 0%, #7B52AB 100%);color:white;padding:1px 4px;border-radius:4px;font-size:8px;font-weight:500;margin-left:4px;text-transform:uppercase;letter-spacing:0.3px;box-shadow:0 2px 4px rgba(156,106,222,0.2)}
                .hidden-row{display:none}
                .stats-container{padding:15px 12px 10px;text-align:center}
                .stats-title{color:var(--text-secondary);font-size:11px;margin:0 0 12px;font-weight:500}
                .stats-chart{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-bottom:15px}
                .stats-dot{width:19px;height:19px;border-radius:50%;display:inline-block;position:relative}
                .stats-dot::after{content:attr(data-number);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:10px;font-weight:600;color:#fff;text-shadow:0 1px 1px rgba(0,0,0,0.2)}
                .stats-summary{display:flex;justify-content:center;gap:20px;margin-top:10px}
                .stats-count{display:flex;flex-direction:column;align-items:center;gap:5px}
                .stats-count-label{color:var(--text-secondary);font-size:10px;font-weight:500}
                .stats-count-value{font-size:14px;font-weight:600;color:var(--text-primary)}
                .stats-count-red .stats-count-value{color:var(--red-color)}
                .stats-count-green .stats-count-value{color:var(--green-color)}

                /* Generic Modal Component */
                .pred-modal-overlay{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,0.85);backdrop-filter:blur(2px);display:none;align-items:center;justify-content:center;z-index:10;padding:15px;border-radius:var(--border-radius);animation:modalFadeIn 0.2s ease forwards}
                .pred-modal-content{background:#FFFFFF;width:230px;padding:15px 18px;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.08);text-align:center;color:var(--text-primary);transform:scale(0.95);opacity:0;animation:modalScale 0.2s ease 0.05s forwards}
                .pred-modal-icon-wrapper{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:white}
                .pred-modal-icon-wrapper svg{width:18px;height:18px}
                .pred-modal-icon-error{background:var(--red-color);box-shadow:0 2px 10px rgba(242,95,92,0.15)}
                .pred-modal-icon-warning{background:#F59E0B;box-shadow:0 2px 10px rgba(245,158,11,0.15)}
                .pred-modal-icon-info{background:var(--primary-color);box-shadow:0 2px 10px rgba(255,108,171,0.15)}
                .pred-modal-content h3{margin:0 0 8px;font-size:15px;font-weight:600;color:var(--text-primary)}
                .pred-modal-message{margin-bottom:12px;font-size:12px;color:var(--text-secondary);line-height:1.4}
                .pred-modal-message:empty{margin-bottom:0}
                .pred-modal-custom-content{margin-bottom:12px}
                .pred-modal-custom-content:empty{display:none;margin:0}
                
                /* Balance details for insufficient balance modal */
                .balance-details{margin-bottom:10px}
                .balance-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #F0F0F0}
                .balance-row:last-child{border-bottom:none}
                .balance-row span{color:var(--text-secondary);font-size:12px}
                .balance-row strong{font-size:13px;font-weight:600}
                .info-box{background:#FFF9E7;border:1px solid #FFE4A0;border-radius:6px;padding:8px 10px;margin-bottom:10px}
                .info-box p{margin:0;color:#92400E;font-size:11px;line-height:1.4;text-align:left}
                
                /* Modal actions and buttons */
                .pred-modal-actions{display:flex;gap:8px;justify-content:center;margin-bottom:5px}
                .pred-modal-actions:empty{margin-bottom:0}
                .pred-modal-actions.stacked{flex-direction:column;gap:6px}
                .pred-modal-actions.full-width{flex-direction:row;gap:8px}
                .pred-modal-actions.full-width .pred-modal-btn{flex:1;min-width:0}
                .pred-modal-actions.full-width .pred-modal-btn:last-child{margin-left:auto}
                .pred-modal-btn{padding:7px 14px;border:none;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.2s ease;white-space:nowrap}
                .pred-modal-btn:active{transform:translateY(1px)}
                .pred-modal-btn.primary{background:var(--primary-gradient);color:white;box-shadow:0 2px 8px rgba(115,102,255,0.15)}
                .pred-modal-btn.primary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(115,102,255,0.2)}
                .pred-modal-btn.secondary{background:#F0F3F7;color:var(--text-primary);border:1px solid #DDE2E9}
                .pred-modal-btn.secondary:hover{background:#E5E7EB}
                .pred-modal-btn.text{background:none;border:none;color:var(--text-secondary);padding:5px;font-size:11px;margin-top:2px;text-decoration:underline}
                .pred-modal-btn.text:hover{color:var(--text-primary)}

                @keyframes menuFadeIn{to{opacity:1}}
                @keyframes menuScale{to{opacity:1;transform:scale(1)}}
                @keyframes predBtnSpin{to{transform:rotate(360deg)}}
                @keyframes modalFadeIn{from{opacity:0}to{opacity:1}}
                @keyframes modalScale{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}

                #predictionFloaterIcon:hover{transform:scale(1.1);box-shadow:0 0 40px rgba(115,102,255,0.8), 0 0 80px rgba(255,108,171,0.6), 0 12px 40px rgba(115,102,255,0.4), 0 0 0 3px rgba(255,255,255,1)}

                @media (max-width: 380px) {
                    .prediction-container{max-width:260px}
                    .prediction-section{padding:8px}
                    .info-label{font-size:9px}
                    .info-value{font-size:10px}
                    .results-table td,.results-table th{padding:5px 2px;font-size:10px}
                    .results-table th{font-size:8px}
                    .num-circle{width:18px;height:18px;font-size:10px}
                    .tab{font-size:10px;padding:6px 8px}
                    .prediction-header h2{font-size:14px}
                }
            `,
            html: `
                <div id="predictionMenu" class="prediction-overlay">
                    <div class="prediction-container">
                        <div class="prediction-header">
                            <h2>
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><path d="M12 3v3m0 4.5V12m0 4.5V18m-6-6H3m4.5-6L6 4.5M4.5 15L6 16.5m13.5-7.5H21m-4.5-6L18 4.5m-1.5 12L18 18" stroke-width="2" stroke-linecap="round"/></svg>
                                IOS Premium Hack
                            </h2>
                            <button class="close-btn" id="predMenuCloseBtn">×</button>
                        </div>
                        
                        <div class="prediction-content">
                            <div class="prediction-section">
                                <div class="info-grid">
                                    <div class="info-item">
                                        <div class="info-label">Brand</div>
                                        <div class="info-value" id="predMenuBrandName">OKWIN <span class="info-tag">Official</span></div>
                                        </div>
                                    <div class="info-item">
                                        <div class="info-label">Game Type</div>
                                        <div class="info-value" id="predMenuGameType">WinGo 30sec</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">Current Issue</div>
                                        <div class="info-value" id="predMenuCurrentIssue">50990</div>
                                        </div>
                                    <div class="info-item">
                                        <div class="info-label">Time Left</div>
                                        <div class="prediction-timer">
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8zm-1-13h2v6h-2zm0 7h2v2h-2z"/>
                                            <span id="predMenuTimer">0:08</span>
                                    </div>
                                    </div>
                                </div>
                            </div>
                            
                            <button id="predMenuStartButton" class="prediction-btn">
                                <svg class="btn-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke-width="2"/><path d="M10 8l6 4-6 4V8z" fill="white" stroke-width="2" stroke-linejoin="round"/></svg>
                                <span class="btn-text">IOSMODS PREMIUM</span>
                                <span class="btn-loader"></span>
                            </button>
                            
                            <div class="tab-container">
                                <div class="tab active" id="recentResultsTab">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    Recent Results
                                </div>
                                <div class="tab" id="statisticsTab">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"><path d="M8 16V4m0 12l3-3m-3 3l-3-3m8-6v12m0-12l3 3m-3-3l-3 3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    Statistics
                                </div>
                            </div>
                            
                            <div class="tab-content">
                                <div id="recentResultsPane" class="tab-pane active">
                                    <table class="results-table">
                                        <thead>
                                            <tr>
                                                <th>Issue</th>
                                                <th>Number</th>
                                                <th>Result</th>
                                            </tr>
                                        </thead>
                                        <tbody id="predMenuRecentChartContainer">
                                        </tbody>
                                    </table>
                                    <div class="show-toggle-container">
                                        <div class="show-toggle" id="predMenuToggleView">
                                            <span id="toggleText">Show more</span>
                                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                        </div>
                                    </div>
                                </div>
                                <div id="statisticsPane" class="tab-pane">
                                    <div class="stats-container">
                                        <div class="stats-title">Last 10 Game Color Chart</div>
                                        <div id="statsColorChart" class="stats-chart"></div>
                                        <div class="stats-summary">
                                            <div class="stats-count stats-count-red">
                                                <div class="stats-count-label">SMALL</div>
                                                <div id="statsSmallCount" class="stats-count-value">0</div>
                                            </div>
                                            <div class="stats-count stats-count-green">
                                                <div class="stats-count-label">BIG</div>
                                                <div id="statsBigCount" class="stats-count-value">0</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        };
    }

    static createMovableIcon() {
        if (!PredictionManagerUI.movableIconElement?.isConnected) {
            PredictionManagerUI.movableIconElement = document.createElement('div');
            PredictionManagerUI.movableIconElement.id = 'predictionFloaterIcon';
            PredictionManagerUI.movableIconElement.innerHTML = PredictionManagerUI.getMovableIconSVG();
            Object.assign(PredictionManagerUI.movableIconElement.style, {
                position: 'fixed',
                bottom: '30px',
                right: '30px',
                width: '48px',
                height: '48px',
                background: '#FFF',
                borderRadius: '50%',
                cursor: 'grab',
                userSelect: 'none',
                boxShadow: '0 0 30px rgba(115,102,255,0.6), 0 0 60px rgba(255,108,171,0.4), 0 8px 32px rgba(115,102,255,0.3), 0 0 0 2px rgba(255,255,255,0.9)',
                zIndex: '2147483647',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s'
            });

            const boundHandleStart = PredictionManagerUI.handleIconDragStart.bind(PredictionManagerUI);
            PredictionManagerUI.movableIconElement.addEventListener('mousedown', boundHandleStart);
            PredictionManagerUI.movableIconElement.addEventListener('touchstart', boundHandleStart, { passive: false });
            document.body.appendChild(PredictionManagerUI.movableIconElement);
        }
    }

    static removeMovableIcon() {
        PredictionManagerUI.movableIconElement?.remove();
        PredictionManagerUI.movableIconElement = null;
    }

    static handleIconDragStart(e) {
        if (e.type === 'touchstart') {
            e.preventDefault();
            e.stopPropagation();
        }
        const evt = e.touches?.[0] || e;
        const rect = PredictionManagerUI.movableIconElement.getBoundingClientRect();
        PredictionManagerUI.isDragging = true;
        PredictionManagerUI.dragStart = {
            x: evt.clientX,
            y: evt.clientY,
            iconX: evt.clientX - rect.left,
            iconY: evt.clientY - rect.top
        };
        PredictionManagerUI.movableIconElement.style.cursor = 'grabbing';

        // Store bound handlers
        PredictionManagerUI._boundHandleIconDragMove = PredictionManagerUI.handleIconDragMove.bind(PredictionManagerUI);
        PredictionManagerUI._boundHandleIconDragEnd = PredictionManagerUI.handleIconDragEnd.bind(PredictionManagerUI);

        // Add listeners with stored references
        document.addEventListener('mousemove', PredictionManagerUI._boundHandleIconDragMove);
        document.addEventListener('touchmove', PredictionManagerUI._boundHandleIconDragMove, { passive: false });
        document.addEventListener('mouseup', PredictionManagerUI._boundHandleIconDragEnd);
        document.addEventListener('touchend', PredictionManagerUI._boundHandleIconDragEnd);
    }

    static handleIconDragMove(e) {
        if (!PredictionManagerUI.isDragging) return;
        e.preventDefault();
        const evt = e.touches?.[0] || e;
        const left = Math.min(Math.max(0, evt.clientX - PredictionManagerUI.dragStart.iconX), window.innerWidth - 48);
        const top = Math.min(Math.max(0, evt.clientY - PredictionManagerUI.dragStart.iconY), window.innerHeight - 48);
        Object.assign(PredictionManagerUI.movableIconElement.style, { left: `${left}px`, top: `${top}px`, right: 'auto', bottom: 'auto' });
    }

    static handleIconDragEnd(e) {
        if (!PredictionManagerUI.isDragging) return;
        const evt = e.changedTouches?.[0] || e;
        if (Math.abs(evt.clientX - PredictionManagerUI.dragStart.x) < PredictionManagerUI.CLICK_THRESHOLD && 
            Math.abs(evt.clientY - PredictionManagerUI.dragStart.y) < PredictionManagerUI.CLICK_THRESHOLD) {
            window.PredictionManager?.togglePredictionMenu();
        }
        PredictionManagerUI.isDragging = false;
        PredictionManagerUI.movableIconElement.style.cursor = 'grab';

        // Remove listeners using stored references
        document.removeEventListener('mousemove', PredictionManagerUI._boundHandleIconDragMove);
        document.removeEventListener('touchmove', PredictionManagerUI._boundHandleIconDragMove, { passive: false });
        document.removeEventListener('mouseup', PredictionManagerUI._boundHandleIconDragEnd);
        document.removeEventListener('touchend', PredictionManagerUI._boundHandleIconDragEnd);
    }

    static showMenu() {
        if (!PredictionManagerUI.menuElement?.isConnected) {
            const { html, css } = PredictionManagerUI.getMenuHTMLAndStyles();
            PredictionManagerUI.menuStyleElement = document.createElement('style');
            PredictionManagerUI.menuStyleElement.id = 'predictionMenuStyles';
            PredictionManagerUI.menuStyleElement.textContent = css;
            document.head.appendChild(PredictionManagerUI.menuStyleElement);

            const temp = document.createElement('div');
            temp.innerHTML = html;
            PredictionManagerUI.menuElement = temp.firstElementChild;
            document.body.appendChild(PredictionManagerUI.menuElement);
            
            // Close button
            const closeBtn = document.getElementById('predMenuCloseBtn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => window.PredictionManager?.handleMenuExplicitClose());
            }
            
            // Start prediction button
            const startBtn = document.getElementById('predMenuStartButton');
            if (startBtn) {
                startBtn.addEventListener('click', () => window.PredictionManager?.handleStartStopClick());
            }
            
            // Show more/less toggle
            const toggleBtn = document.getElementById('predMenuToggleView');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', PredictionManagerUI.toggleResultsView);
            }
            
            // Tab switching
            const recentResultsTab = document.getElementById('recentResultsTab');
            const statisticsTab = document.getElementById('statisticsTab');
            
            if (recentResultsTab && statisticsTab) {
                recentResultsTab.addEventListener('click', () => PredictionManagerUI.handleTabSwitch('recentResultsPane'));
                statisticsTab.addEventListener('click', () => PredictionManagerUI.handleTabSwitch('statisticsPane'));
            }
            
            PredictionManagerUI.isExpanded = false;
        }
    }

    static hideMenu() {
        PredictionManagerUI.menuElement?.remove();
        PredictionManagerUI.menuStyleElement?.remove();
        PredictionManagerUI.menuElement = null;
        PredictionManagerUI.menuStyleElement = null;
    }

    static showInsufficientBalanceModal(currentBalance) {
        const formattedBalance = `₹ ${Number(currentBalance).toFixed(2)}`;
        const helpVideoUrl = ConfigManager.getSetting('insufficientBalanceHelpVideoUrl', null);
        
        const customHTML = `
            <div class="balance-details">
                <div class="balance-row">
                    <span>Total Winning</span>
                    <strong>${formattedBalance}</strong>
                </div>
                <div class="Per-Day">
                    <span>Premium Hack Plan</span>
                    <strong>₹2149.00</strong>
                </div>
            </div>
            <div class="info-box">
                <p>Purchase Premium Plan
                100 Prediction Daily
                30 Days Activated
                Big Small+Color-Number
                Contact For Premium
                Tap To Contact Button</p>
            </div>
        `;
        
        PredictionManagerUI.showGenericModal({
            iconType: 'warning',
            title: 'Purchase Premium',
            customHTML: customHTML,
            message: '',
            buttons: [
                { 
                    text: 'Contact', 
                    type: 'primary', 
                    action: () => {
                        PredictionManagerUI.hideGenericModal();
                        window.PredictionManager?.log('Navigation', 'Deposit button clicked from insufficient balance modal.');
                        window.location.href = 'http://t.me/iOSMods_69';
                    }
                },
                { 
                    text: 'Support', 
                    type: 'secondary', 
                    action: () => {
                        PredictionManagerUI.hideGenericModal();
                        window.PredictionManager?.log('Navigation', 'Help button clicked from insufficient balance modal.');
                        if (helpVideoUrl) {
                            window.open = 'http://t.me/iOSMods_69';
                        } else {
                            window.location.href = 'http://t.me/iOSMods_69';
                        }
                    }
                },
                { 
                    text: 'Dismiss', 
                    type: 'text', 
                    action: () => PredictionManagerUI.hideGenericModal() 
                }
            ],
            actionLayout: 'full-width'
        });
    }

    static showPredictionFailedModal() {
        PredictionManagerUI.showGenericModal({
            iconType: 'error',
            title: 'Prediction Failed',
            message: 'Prediction failed - please refresh your site.',
            buttons: [
                { 
                    text: 'Dismiss', 
                    type: 'secondary', 
                    action: () => PredictionManagerUI.hideGenericModal() 
                },
                { 
                    text: 'Refresh', 
                    type: 'primary', 
                    action: () => window.location.reload() 
                }
            ],
            actionLayout: 'full-width'
        });
    }

    static showGenericModal(config = {}) {
        try {
            // Step 1: Validate config object
            if (!config || typeof config !== 'object') {
                console.error('[PredictionManagerUI] Invalid config provided to showGenericModal:', config);
                return;
            }

            // Step 2: Remove any existing modal
            PredictionManagerUI.hideGenericModal();

            // Step 3: Destructure config with defaults
            const {
                iconType = 'warning',
                title = 'Notification',
                message = '',
                customHTML = '',
                buttons = [{ text: 'Dismiss', type: 'secondary', action: () => PredictionManagerUI.hideGenericModal() }],
                actionLayout = ''
            } = config;

            // Step 4: Create the modal structure from scratch
            const modalOverlay = document.createElement('div');
            modalOverlay.id = 'genericInfoModalOverlay';
            modalOverlay.className = 'pred-modal-overlay';
            
            // Set initial styles (hidden)
            modalOverlay.style.display = 'none';
            modalOverlay.style.opacity = '0';
            
            // Create the inner HTML structure of the modal
            const modalHTML = `
                <div class="pred-modal-content">
                    <div id="gmIconContainer" class="pred-modal-icon-wrapper"></div>
                    <h3 id="gmTitle"></h3>
                    <div id="gmMessage" class="pred-modal-message"></div>
                    <div id="gmCustomContent" class="pred-modal-custom-content"></div>
                    <div id="gmActions" class="pred-modal-actions"></div>
                </div>
            `;
            
            // Set the HTML to the new modal
            modalOverlay.innerHTML = modalHTML;
            
            // Find the parent container to append the modal
            const parentContainer = PredictionManagerUI.menuElement?.querySelector('.prediction-container');
            if (!parentContainer) {
                console.error('[PredictionManagerUI] Cannot find parent container for modal');
                return;
            }
            
            // Append the modal to the parent
            parentContainer.appendChild(modalOverlay);
            
            // Step 5: Get references to dynamic elements
            const modalContent = modalOverlay.querySelector('.pred-modal-content');
            const iconContainer = modalOverlay.querySelector('#gmIconContainer');
            const titleEl = modalOverlay.querySelector('#gmTitle');
            const messageEl = modalOverlay.querySelector('#gmMessage');
            const customContentEl = modalOverlay.querySelector('#gmCustomContent');
            const actionsEl = modalOverlay.querySelector('#gmActions');
            
            // Validate all elements
            if (!modalContent || !iconContainer || !titleEl || !messageEl || !customContentEl || !actionsEl) {
                console.error('[PredictionManagerUI] One or more modal elements could not be created');
                modalOverlay.remove();
                return;
            }

            // Step 6: Populate modal content
            try {
                // Set icon
                const iconClass = (() => {
                    let className = 'pred-modal-icon-wrapper';
                    if (iconType === 'error') className += ' pred-modal-icon-error';
                    else if (iconType === 'warning') className += ' pred-modal-icon-warning';
                    else if (iconType === 'info') className += ' pred-modal-icon-info';
                    return className;
                })();
                
                iconContainer.className = iconClass;
                const iconSVG = PredictionManagerUI.getModalIconSVG(iconType);
                if (iconSVG) iconContainer.innerHTML = iconSVG;
                
                // Set title and message
                titleEl.textContent = title;
                messageEl.textContent = message;
                
                // Set custom HTML
                if (customHTML) customContentEl.innerHTML = customHTML;
                
                // Configure actions layout
                if (actionLayout === 'stacked') actionsEl.classList.add('stacked');
                else if (actionLayout === 'full-width') actionsEl.classList.add('full-width');
                
                // Validate buttons array
                const validatedButtons = Array.isArray(buttons) && buttons.length > 0 
                    ? buttons 
                    : [{ text: 'OK', type: 'secondary', action: () => PredictionManagerUI.hideGenericModal() }];
                    
                // Separate buttons by type
                const textButtons = [];
                const regularButtons = [];
                validatedButtons.forEach(btn => {
                    if (btn && typeof btn === 'object') {
                        if (btn.type === 'text') textButtons.push(btn);
                        else regularButtons.push(btn);
                    }
                });
                
                // Create regular buttons
                regularButtons.forEach(btnConfig => {
                    if (!btnConfig.text) return;
                    
                    const button = document.createElement('button');
                    button.textContent = btnConfig.text;
                    button.className = `pred-modal-btn ${btnConfig.type || 'secondary'}`;
                    
                    // Add click handler
                    if (btnConfig.action && typeof btnConfig.action === 'function') {
                        button.onclick = function(e) {
                            try {
                                btnConfig.action(e);
                            } catch (actionError) {
                                console.error('[PredictionManagerUI] Error in button action:', actionError);
                                modalOverlay.remove();
                            }
                        };
                    } else {
                        button.onclick = function() {
                            modalOverlay.remove();
                        };
                    }
                    
                    actionsEl.appendChild(button);
                });
                
                // Create text buttons
                textButtons.forEach(btnConfig => {
                    if (!btnConfig.text) return;
                    
                    const button = document.createElement('button');
                    button.textContent = btnConfig.text;
                    button.className = 'pred-modal-btn text';
                    
                    // Add click handler
                    if (btnConfig.action && typeof btnConfig.action === 'function') {
                        button.onclick = function(e) {
                            try {
                                btnConfig.action(e);
                            } catch (actionError) {
                                console.error('[PredictionManagerUI] Error in text button action:', actionError);
                                modalOverlay.remove();
                            }
                        };
                    } else {
                        button.onclick = function() {
                            modalOverlay.remove();
                        };
                    }
                    
                    modalContent.appendChild(button);
                });
                
            } catch (populateError) {
                console.error('[PredictionManagerUI] Error populating modal content:', populateError);
                modalOverlay.remove();
                return;
            }
            
            // Step 7: Force reflow and show modal with special WebKit considerations
            // First position off-screen to allow rendering
            modalOverlay.style.position = 'absolute';
            modalOverlay.style.visibility = 'hidden';
            modalOverlay.style.left = '-9999px';
            modalOverlay.style.display = 'flex';
            
            // Force a reflow
            void modalContent.offsetHeight;
            
            // Use requestAnimationFrame and setTimeout for WebKit (Orion)
            setTimeout(() => {
                requestAnimationFrame(() => {
                    try {
                        // Position properly and make visible
                        modalOverlay.style.position = '';
                        modalOverlay.style.visibility = '';
                        modalOverlay.style.left = '';
                        modalOverlay.style.display = 'flex';
                        modalOverlay.style.opacity = '1';
                    } catch (showError) {
                        console.error('[PredictionManagerUI] Error showing modal:', showError);
                        modalOverlay.remove();
                    }
                });
            }, 0);
            
        } catch (error) {
            console.error('[PredictionManagerUI] Fatal error in showGenericModal:', error);
            // Clean up any partial modal
            const existingModal = document.getElementById('genericInfoModalOverlay');
            if (existingModal) existingModal.remove();
        }
    }

    static hideGenericModal() {
        const modalOverlay = document.getElementById('genericInfoModalOverlay');
        if (modalOverlay) {
            // Instead of hiding, completely remove from DOM
            modalOverlay.remove();
        }
    }

    static getModalIconSVG(type = 'warning') {
        const icons = {
            error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
            
            warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
            
            info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`
        };
        
        return icons[type] || icons.warning;
    }

    static handleTabSwitch(tabId) {
        // Remove active class from all tabs and hide all panes
        const tabs = document.querySelectorAll('.tab');
        const panes = document.querySelectorAll('.tab-pane');
        
        tabs.forEach(tab => tab.classList.remove('active'));
        panes.forEach(pane => pane.classList.remove('active'));
        
        // Activate selected tab and pane
        const selectedTab = tabId === 'recentResultsPane' ? 
            document.getElementById('recentResultsTab') : 
            document.getElementById('statisticsTab');
        const selectedPane = document.getElementById(tabId);
        
        if (selectedTab) selectedTab.classList.add('active');
        if (selectedPane) selectedPane.classList.add('active');
        
        // If switching to statistics tab, ensure chart is rendered
        if (tabId === 'statisticsPane' && window.PredictionManager?.latestHistoryData) {
            PredictionManagerUI.renderStatisticsChart(window.PredictionManager.latestHistoryData);
        }
    }

    static toggleResultsView(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        const container = document.getElementById('predMenuRecentChartContainer');
        const toggleText = document.getElementById('toggleText');
        const toggleBtn = document.getElementById('predMenuToggleView');
        
        if (!container || !toggleText || !toggleBtn) return;
        
        PredictionManagerUI.isExpanded = !PredictionManagerUI.isExpanded;
        
        // Ultra-fast DOM manipulation - completely synchronous
        const displayValue = PredictionManagerUI.isExpanded ? 'table-row' : 'none';
        
        // Get direct reference to rows for faster iteration
        const rows = Array.from(container.getElementsByClassName('hidden-row'));
        for (let i = 0; i < rows.length; i++) {
            rows[i].style.display = displayValue;
        }
        
        toggleText.textContent = PredictionManagerUI.isExpanded ? 'Show less' : 'Show more';
        toggleBtn.classList[PredictionManagerUI.isExpanded ? 'add' : 'remove']('less');
    }

    static renderHistoryInMenu(historyList = []) {
        const container = document.getElementById('predMenuRecentChartContainer');
        if (!container) return;

        const displayList = historyList.slice(0, 10);
        const initialItems = 3;
        
        const rows = displayList.map((item, index) => {
            const number = parseInt(item.number);
            const size = (number >= 5) ? 'BIG' : 'SMALL';
            const shortId = item.issueNumber?.slice(-5) || 'IOS';
            const isCurrent = item.current ? '<span class="current-badge">Current</span>' : '';
            const isLocked = item.locked;
            
            // Determine if the row should be part of the collapsible set
            const isCollapsible = index >= initialItems;
            // Determine initial visibility based on expanded state
            const initiallyHidden = isCollapsible && !PredictionManagerUI.isExpanded;
            
            let numberCell, resultCell;
            
            if (isLocked) {
                numberCell = `<div class="result-tag lock"><svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor"><path d="M5 7V5a3 3 0 016 0v2h1a1 1 0 011 1v5a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1h1zm1 0h4V5a2 2 0 00-4 0v2z"/></svg></div>`;
                resultCell = `<span class="result-tag premium">PREMIUM</span>`;
            } else {
                let bgColor, textColor;
                
                if (number === 0 || number === 5) {
                    bgColor = 'rgba(156,106,222,0.1)';
                    textColor = 'var(--purple-color)';
                } else if ([1,3,7,9].includes(number)) {
                    bgColor = '#E7F8EF';
                    textColor = 'var(--green-color)';
                } else if ([2,4,6,8].includes(number)) {
                    bgColor = '#FFF1F1';
                    textColor = 'var(--red-color)';
                } else {
                    bgColor = '#F5F6FA';
                    textColor = 'var(--text-primary)';
                }
                
                numberCell = `<div class="num-circle" style="background:${bgColor};color:${textColor}">${isNaN(number) ? '-' : number}</div>`;
                resultCell = `<span class="result-tag ${size.toLowerCase()}">${size}</span>`;
            }
            
            // Add 'hidden-row' class if it's a collapsible item
            // Control display with inline style based on initial state
            return `
                <tr class="${isCollapsible ? 'hidden-row' : ''}" style="display:${initiallyHidden ? 'none' : 'table-row'}">
                    <td class="issue">${shortId} ${isCurrent}</td>
                    <td class="number">${numberCell}</td>
                    <td class="result">${resultCell}</td>
                </tr>`;
        }).join('');
        
        container.innerHTML = rows || '<tr><td colspan="3" style="text-align:center;color:var(--text-secondary);padding:12px 0">No recent data</td></tr>';
        
        const toggleContainer = document.querySelector('.show-toggle-container');
        if (toggleContainer) {
            toggleContainer.style.display = displayList.length <= initialItems ? 'none' : 'flex';
        }
    }

    static renderStatisticsChart(historyList = []) {
        const chartContainer = document.getElementById('statsColorChart');
        const smallCountEl = document.getElementById('statsSmallCount');
        const bigCountEl = document.getElementById('statsBigCount');
        
        if (!chartContainer || !smallCountEl || !bigCountEl) return;
        
        chartContainer.innerHTML = '';
        
        // Take last 10 items
        const displayList = historyList.slice(0, 10).reverse();
        
        let smallCount = 0;
        let bigCount = 0;
        
        const chartHtml = displayList.map(item => {
            const number = parseInt(item.number);
            
            // Skip locked items
            if (item.locked) {
                return '<div class="stats-dot" style="background:#f5f6fa;color:#8E9CBC">?</div>';
            }
            
            // Count based on the rule: 0-4 is SMALL, 5-9 is BIG
            if (number >= 0 && number <= 4) {
                smallCount++;
            } else if (number >= 5 && number <= 9) {
                bigCount++;
            }
            
            // Get color based on number
            let bgColor, textColor;
            
            if (number === 0 || number === 5) {
                bgColor = 'var(--purple-color)';
            } else if ([1,3,7,9].includes(number)) {
                bgColor = 'var(--green-color)';
            } else if ([2,4,6,8].includes(number)) {
                bgColor = 'var(--red-color)';
            } else {
                bgColor = '#8E9CBC';
            }
            
            return `<div class="stats-dot" style="background:${bgColor}" data-number="${number}"></div>`;
        }).join('');
        
        chartContainer.innerHTML = chartHtml || 'No data available';
        smallCountEl.textContent = smallCount;
        bigCountEl.textContent = bigCount;
    }

    static updateTimeLeftInMenu(time) {
        const timerElement = document.getElementById('predMenuTimer');
        if (!timerElement) return;
        
        if (!time || time === '--:--' || time.includes('Next')) {
            timerElement.textContent = '--:--';
            return;
        }
        
        // Parse time string in MM:SS format and display directly
        timerElement.textContent = time;
    }

    static updateBrandNameInMenu(brandName) {
        const element = document.getElementById('predMenuBrandName');
        if (!element) return;
        
        // Update brand name while preserving the Official tag
        element.innerHTML = `${(brandName || 'IOS').toUpperCase()} <span class="info-tag">Premium</span>`;
    }

    static updateGameTypeInMenu(gameType) {
        const element = document.getElementById('predMenuGameType');
        if (element) element.textContent = gameType || 'Unknown';
    }

    static updateCurrentIssueInMenu(issue) {
        const element = document.getElementById('predMenuCurrentIssue');
        if (element) element.textContent = issue || '--';
    }

    static setStartButtonLoading(isLoading) {
        const startBtn = document.getElementById('predMenuStartButton');
        if (!startBtn) return;

        const loader = startBtn.querySelector('.btn-loader');
        const icon = startBtn.querySelector('.btn-icon');
        const text = startBtn.querySelector('.btn-text');

        if (isLoading) {
            startBtn.classList.add('loading');
            startBtn.disabled = true;
            if (loader) loader.style.display = 'inline-block';
        } else {
            startBtn.classList.remove('loading');
            startBtn.disabled = false;
            if (loader) loader.style.display = 'none';
            PredictionManagerUI.updateStartStopButtonState();
        }
    }

    static updateStartStopButtonState() {
        const startBtn = document.getElementById('predMenuStartButton');
        const btnText = startBtn?.querySelector('.btn-text');
        if (!startBtn || !btnText) return;
        
        const isActive = ActivePredictionBarUI.barElement?.isConnected;
        btnText.textContent = isActive ? 'STOP IOSMODS' : 'IOS PREDICTION';
    }
}
window.PredictionManagerUI = PredictionManagerUI;