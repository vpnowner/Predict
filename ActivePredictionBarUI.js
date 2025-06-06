class ActivePredictionBarUI {
    static barElement = null;
    static styleElement = null;

    static getCSS() {
        return `
            #newActivePredictionBar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                position: fixed;
                top: 10px;
                left: 50%;
                transform: translateY(-100%) translateX(-50%);
                padding: 8px 12px;
                background: linear-gradient(135deg, rgba(32, 32, 40, 0.95), rgba(20, 20, 28, 0.98));
                backdrop-filter: blur(12px);
                color: #fff;
                border-radius: 14px;
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.4),
                    0 1px 2px rgba(255, 215, 0, 0.15),
                    0 0 0 1px rgba(255, 215, 0, 0.1),
                    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
                    inset 0 1px rgba(255, 255, 255, 0.08);
                font-family: 'Poppins',-apple-system,system-ui,sans-serif;
                z-index: 2147483640;
                border: 1px solid rgba(255, 215, 0, 0.3);
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                max-width: 90%;
                width: auto;
                box-sizing: border-box;
            }
            #newActivePredictionBar * {
                box-sizing: border-box;
            }
            #newActivePredictionBar.visible {
                opacity: 1;
                transform: translateY(0) translateX(-50%);
            }
            .pred-wrapper {
                display: flex;
                align-items: center;
                flex-wrap: nowrap;
                gap: 2px;
                overflow: hidden;
                flex: 1;
                min-width: 0;
            }
            .live-indicator {
                display: flex;
                align-items: center;
                gap: 4px;
                padding-right: 8px;
                margin-right: 8px;
                border-right: 1px solid rgba(255, 215, 0, 0.15);
                flex-shrink: 0;
                position: relative;
            }
            .live-indicator::after {
                content: '';
                position: absolute;
                right: -1px;
                top: 50%;
                height: 70%;
                width: 1px;
                background: linear-gradient(to bottom, transparent, rgba(255, 215, 0, 0.4), transparent);
                transform: translateY(-50%);
            }
            .live-dot {
                width: 5px;
                height: 5px;
                background: #ff4757;
                box-shadow: 0 0 12px rgba(255, 71, 87, 0.8);
                border-radius: 50%;
                animation: pulse 1.5s infinite;
            }
            .live-text {
                font-size: 9px;
                font-weight: 700;
                color: #ff4757;
                letter-spacing: 0.3px;
                text-transform: uppercase;
                position: relative;
            }
            .live-text::after {
                content: '';
                position: absolute;
                bottom: -1px;
                left: 0;
                width: 100%;
                height: 1px;
                background: linear-gradient(to right, transparent, rgba(255, 71, 87, 0.5), transparent);
            }
            .game-info {
                display: flex;
                flex-direction: column;
                padding: 0 8px;
                line-height: 1.2;
                border-right: 1px solid rgba(255, 215, 0, 0.15);
                margin-right: 8px;
                white-space: nowrap;
                flex-shrink: 1;
                min-width: 0;
                max-width: 30%;
                position: relative;
            }
            .game-info::after {
                content: '';
                position: absolute;
                right: -1px;
                top: 50%;
                height: 70%;
                width: 1px;
                background: linear-gradient(to bottom, transparent, rgba(255, 215, 0, 0.4), transparent);
                transform: translateY(-50%);
            }
            .game-type {
                font-size: 9px;
                font-weight: 700;
                color: #fff;
                letter-spacing: 0.2px;
                text-transform: uppercase;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
            }
            .issue-number {
                font-size: 8px;
                font-weight: 400;
                color: rgba(255, 215, 0, 0.8);
                letter-spacing: 0.5px;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .timer {
                display: flex;
                align-items: center;
                padding: 0 5px;
                margin-right: 8px;
                border-right: 1px solid rgba(255, 215, 0, 0.15);
                gap: 2px;
                position: relative;
                flex-shrink: 0;
                max-width: 65px;
            }
            .timer::after {
                content: '';
                position: absolute;
                right: -1px;
                top: 50%;
                height: 70%;
                width: 1px;
                background: linear-gradient(to bottom, transparent, rgba(255, 215, 0, 0.4), transparent);
                transform: translateY(-50%);
            }
            .timer::before {
                content: '';
                position: absolute;
                top: -3px;
                bottom: -3px;
                left: -3px;
                right: -3px;
                background: linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(255, 215, 0, 0.04));
                border-radius: 10px;
                z-index: -1;
                box-shadow: inset 0 0 12px rgba(255, 215, 0, 0.08);
                border: 1px solid rgba(255, 215, 0, 0.15);
            }
            .timer-icon {
                width: 9px;
                height: 9px;
                fill: #ffffff;
                opacity: 1;
                filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
            }
            .time-left {
                font-size: 11px;
                font-weight: 700;
                color: #ffffff;
                letter-spacing: 0.3px;
                font-variant-numeric: tabular-nums;
                min-width: 30px;
                text-align: center;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
                position: relative;
            }
            .time-left::after {
                content: '';
                position: absolute;
                bottom: -1px;
                left: 50%;
                width: 70%;
                height: 1px;
                background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3), transparent);
                transform: translateX(-50%);
            }
            .timer-emphasis .time-left {
                animation: urgent 0.7s infinite;
                color: #ff6b6b;
                text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
            }
            .timer-emphasis .timer-icon {
                fill: #ff6b6b;
                animation: urgent 0.7s infinite;
                filter: drop-shadow(0 0 5px rgba(255, 107, 107, 0.3));
            }
            .prediction-details {
                display: flex;
                align-items: center;
                padding-left: 10px;
                gap: 6px;
                flex-grow: 1;
                flex-shrink: 1;
                min-width: 0;
                overflow: hidden;
            }
            .prediction-number {
                display: none !important;
            }
            .prediction-size {
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9px;
                font-weight: 600;
                color: #ffffff;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                padding: 3px 10px;
                background: linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(255, 215, 0, 0.08));
                border-radius: 10px;
                box-shadow: 
                    0 3px 6px rgba(0, 0, 0, 0.25),
                    inset 0 1px rgba(255, 255, 255, 0.15),
                    0 0 0 1px rgba(255, 215, 0, 0.2);
                border: 1px solid rgba(255, 215, 0, 0.2);
                white-space: nowrap;
                flex-shrink: 0;
                line-height: 1.1;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
            }
            .close-pred-bar {
                padding: 3px;
                margin-left: 8px;
                cursor: pointer;
                background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05));
                border: 1px solid rgba(255, 215, 0, 0.2);
                color: rgba(255, 255, 255, 0.8);
                line-height: 0;
                border-radius: 50%;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                box-shadow: 
                    0 2px 10px rgba(0, 0, 0, 0.2),
                    inset 0 1px rgba(255, 255, 255, 0.1);
                min-width: 16px;
                min-height: 16px;
                width: 16px;
                height: 16px;
            }
            .close-pred-bar:hover {
                color: #fff;
                background: linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(255, 215, 0, 0.1));
                transform: scale(1.1);
                box-shadow: 
                    0 2px 15px rgba(0, 0, 0, 0.3),
                    0 0 8px rgba(255, 215, 0, 0.3),
                    inset 0 1px rgba(255, 255, 255, 0.15);
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.6; transform: scale(1.3); }
            }
            @keyframes urgent {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.15); }
            }
            @media screen and (max-width: 480px) {
                #newActivePredictionBar {
                    padding: 6px 10px;
                    border-radius: 12px;
                }
                .live-indicator, .game-info, .timer {
                    padding-right: 6px;
                    margin-right: 6px;
                }
                .timer {
                    gap: 2px;
                    padding: 0 4px;
                    max-width: 55px;
                }
                .timer-icon {
                    width: 8px;
                    height: 8px;
                }
                .time-left {
                    min-width: 28px;
                    font-size: 10px;
                }
                .prediction-details {
                    gap: 4px;
                    padding-left: 6px;
                }
                .prediction-size {
                    padding: 2px 6px;
                    font-size: 8px;
                }
            }
            @media screen and (max-width: 374px) {
                #newActivePredictionBar {
                    padding: 5px 8px;
                    max-width: 95%;
                }
                .live-indicator {
                    padding-right: 4px;
                    margin-right: 4px;
                    gap: 3px;
                }
                .live-text {
                    font-size: 8px;
                }
                .live-dot {
                    width: 4px;
                    height: 4px;
                }
                .game-info {
                    padding: 0 4px;
                    margin-right: 4px;
                }
                .game-type {
                    font-size: 8px;
                }
                .issue-number {
                    font-size: 7px;
                }
                .timer {
                    padding: 0 3px;
                    margin-right: 4px;
                    gap: 2px;
                    max-width: 50px;
                }
                .timer-icon {
                    width: 8px;
                    height: 8px;
                }
                .time-left {
                    min-width: 26px;
                    font-size: 10px;
                }
                .prediction-details {
                    padding-left: 4px;
                    gap: 3px;
                }
                .prediction-size {
                    font-size: 7px;
                    padding: 2px 5px;
                }
                .close-pred-bar {
                    margin-left: 5px;
                    width: 14px;
                    height: 14px;
                    min-width: 14px;
                    min-height: 14px;
                    padding: 2px;
                }
                .close-pred-bar svg {
                    width: 8px;
                    height: 8px;
                }
            }
            /* Ultra-small screen support */
            @media screen and (max-width: 320px) {
                #newActivePredictionBar {
                    padding: 4px 6px;
                }
                .live-indicator, .game-info, .timer {
                    padding-right: 3px;
                    margin-right: 3px;
                }
                .game-info {
                    max-width: 25%;
                }
                .timer {
                    max-width: 45px;
                    padding: 0 2px;
                }
                .timer::before {
                    top: -2px;
                    bottom: -2px;
                    left: -2px;
                    right: -2px;
                }
                .prediction-details {
                    padding-left: 3px;
                    gap: 2px;
                }
                .prediction-size {
                    padding: 1px 4px;
                }
                .close-pred-bar {
                    margin-left: 3px;
                }
            }`;
    }

    static getHTML() {
        return `
            <div id="newActivePredictionBar">
                <div class="pred-wrapper">
                    <div class="live-indicator">
                        <span class="live-dot"></span>
                        <span class="live-text">LIVE</span>
                    </div>
                    <div class="game-info">
                        <span class="game-type">Game Type</span>
                        <span class="issue-number">#Issue</span>
                    </div>
                    <div class="timer">
                        <svg class="timer-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8zm-1-13h2v6h-2zm0 7h2v2h-2z"/></svg>
                        <span class="time-left">00:00</span>
                    </div>
                    <div class="prediction-details">
                        <span class="prediction-number">0</span>
                        <span class="prediction-size">BIG</span>
                    </div>
                </div>
                <button class="close-pred-bar">
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 1l8 8M1 9l8-8"/>
                    </svg>
                </button>
            </div>`;
    }

    static show(data = {}) {
        if (this.barElement) {
            this.update(data);
            return;
        }
        this.styleElement = document.createElement('style');
        this.styleElement.textContent = this.getCSS();
        document.head.appendChild(this.styleElement);
        const temp = document.createElement('div');
        temp.innerHTML = this.getHTML();
        this.barElement = temp.firstElementChild;
        document.body.appendChild(this.barElement);
        void this.barElement.offsetHeight;
        this.barElement.classList.add('visible');
        this.update(data);
        this.barElement.querySelector('.close-pred-bar').onclick = () => this.hide();
    }

    static update(data = {}) {
        if (!this.barElement) return;
        const bar = this.barElement;
        const { gameType, issue, timeLeft, prediction = {} } = data;
        if (gameType) {
            const displayText = gameType.toLowerCase().includes('wingo') ? 'IOSHACK' : gameType;
            bar.querySelector('.game-type').textContent = displayText;
        }
        if (issue) bar.querySelector('.issue-number').textContent = `#${issue}`;
        if (timeLeft) {
            const timeLeftSpan = bar.querySelector('.time-left');
            timeLeftSpan.textContent = timeLeft;
            const [min, sec] = timeLeft.split(':').map(Number);
            const totalSeconds = (min || 0) * 60 + (sec || 0);
            bar.querySelector('.timer').classList.toggle('timer-emphasis', totalSeconds <= 5 && totalSeconds > 0);
        }
        if (prediction.size || prediction.color) {
            const sizeEl = bar.querySelector('.prediction-size');
            let content = prediction.size || '';
            const emoji = prediction.color === 'RED' ? '🔴' :
                         prediction.color === 'GREEN' ? '🟢' :
                         prediction.color === 'RED,VIOLET' ? '🔴+🟣' :
                         prediction.color === 'GREEN,VIOLET' ? '🟢+🟣' : '';
            if (content && emoji) content += ' ';
            sizeEl.textContent = content + emoji;
        }
    }

    static hide() {
        if (!this.barElement) return;
        this.barElement.classList.remove('visible');
        setTimeout(() => {
            this.barElement?.remove();
            this.styleElement?.remove();
            this.barElement = this.styleElement = null;
        }, 300);
    }
}

window.ActivePredictionBarUI = ActivePredictionBarUI;