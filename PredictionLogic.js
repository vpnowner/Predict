class PredictionLogic {
    static currentActiveMethod = 'P1'; // Default active method

    constructor() {
        this.mode = 'random';
        this.availableSizes = ["BIG", "SMALL"];
        this.availableColors = ["RED", "GREEN"];
        this.jsonData = null;
        console.log('[PredictionLogic] Initialized. Default active method:', PredictionLogic.currentActiveMethod);
    }

    setPredictionMode(mode) {
        this.mode = mode;
    }

    async getPrediction(activeIssueNumber, gameHistory, currentGameType) {
        console.log('[GetPrediction] Called. Mode:', this.mode, 'ActiveIssue:', activeIssueNumber);
        
        if (this.mode === 'random') {
            console.log('[GetPrediction] Attempting Friend Strategy...');
            const friendPrediction = this._generateFriendStrategyPrediction(activeIssueNumber, gameHistory, currentGameType);
            console.log('[GetPrediction] Friend Strategy returned:', friendPrediction);
            
            if (friendPrediction) {
                console.log('[GetPrediction] Using Friend Strategy prediction.');
                return friendPrediction;
            } else {
                console.log('[GetPrediction] Friend Strategy failed or data insufficient, falling back to purely random prediction.');
                return this._generateRandomPrediction(activeIssueNumber, gameHistory, currentGameType);
            }
        } else if (this.mode === 'json') {
            return await this._getJsonPrediction(activeIssueNumber, gameHistory, currentGameType);
        } else {
            return { size: "PENDING", color: "PENDING" };
        }
    }

    _generateRandomPrediction(activeIssueNumber, gameHistory, currentGameType) {
        const color = this._getRandomColorPrediction();
        return {
            size: this.availableSizes[Math.floor(Math.random() * 2)],
            color: color
        };
    }

    _getRandomColorPrediction() {
        const primary = this.availableColors[Math.floor(Math.random() * 2)];
        console.log('[RandomColor] Primary color chosen:', primary);
        
        const addViolet = Math.random() < 0.2;
        console.log('[RandomColor] Violet added:', addViolet);
        
        const finalColor = primary + (addViolet ? ',VIOLET' : '');
        console.log('[RandomColor] Final color string:', finalColor);
        
        return finalColor;
    }

    _getLastTwoDigitsAsNumber(issueString) {
        console.log('[PredLogicHelpers] _getLastTwoDigitsAsNumber input issueString:', issueString);
        
        if (typeof issueString !== 'string' || issueString.length < 2) {
            console.error('[PredLogicHelpers] Invalid issueString: not a string or too short');
            return NaN;
        }
        
        const extractedChars = issueString.slice(-2);
        console.log('[PredLogicHelpers] Extracted last two chars:', extractedChars);
        
        const number = parseInt(extractedChars);
        console.log('[PredLogicHelpers] Converted last two digits to number:', number);
        
        return number;
    }

    _isEven(number) {
        console.log('[PredLogicHelpers] _isEven input number:', number);
        
        const result = number % 2 === 0;
        console.log('[PredLogicHelpers] Is number even?', result);
        
        return result;
    }

    _calculateP1Size(intermediateP1Result, isUpcomingPeriodLastTwoDigitsEven) {
        const isIntermediateResultEven = this._isEven(intermediateP1Result);
        console.log(`[P1Calc] Intermediate Result: ${intermediateP1Result} (isEven: ${isIntermediateResultEven}), Upcoming Period's Last Two Digits Even: ${isUpcomingPeriodLastTwoDigitsEven}`);
        
        let p1PredictedSize;
        if (!isUpcomingPeriodLastTwoDigitsEven) {
            console.log("[P1Calc] Upcoming is ODD. Applying Friend's Rule 1: If IntResult EVEN → BIG, If IntResult ODD → SMALL");
            p1PredictedSize = isIntermediateResultEven ? "BIG" : "SMALL";
        } else {
            console.log("[P1Calc] Upcoming is EVEN. Applying Friend's Rule 3: If IntResult EVEN → SMALL, If IntResult ODD → BIG");
            p1PredictedSize = isIntermediateResultEven ? "SMALL" : "BIG";
        }
        
        console.log("[P1Calc] P1 Predicted Size:", p1PredictedSize);
        return p1PredictedSize;
    }

    _getCalculatedP1AndP2SizesForTargetPeriod(targetIssueNumber, contextIssueNumber, contextIssueOutcomeNumber) {
        console.log('[P1P2Gen] Called with targetIssueNumber:', targetIssueNumber);
        console.log('[P1P2Gen] contextIssueNumber:', contextIssueNumber);
        console.log('[P1P2Gen] contextIssueOutcomeNumber:', contextIssueOutcomeNumber);
        
        const lastTwoDigitsOfContext = this._getLastTwoDigitsAsNumber(contextIssueNumber);
        if (isNaN(lastTwoDigitsOfContext)) {
            console.error('[P1P2Gen] Error: Could not parse last two digits from contextIssueNumber:', contextIssueNumber);
            return null;
        }
        
        const outcomeOfContext = parseInt(contextIssueOutcomeNumber);
        if (isNaN(outcomeOfContext)) {
            console.error('[P1P2Gen] Error: Could not parse contextIssueOutcomeNumber:', contextIssueOutcomeNumber);
            return null;
        }
        
        const intermediateP1Result = lastTwoDigitsOfContext - outcomeOfContext;
        console.log(`[P1P2Gen] Intermediate P1 Result = ${lastTwoDigitsOfContext} - ${outcomeOfContext} = ${intermediateP1Result}`);
        
        const lastTwoDigitsOfTarget = this._getLastTwoDigitsAsNumber(targetIssueNumber);
        if (isNaN(lastTwoDigitsOfTarget)) {
            console.error('[P1P2Gen] Error: Could not parse last two digits from targetIssueNumber:', targetIssueNumber);
            return null;
        }
        
        const isTargetPeriodEven = this._isEven(lastTwoDigitsOfTarget);
        console.log(`[P1P2Gen] Target Period (${targetIssueNumber}) last two digits: ${lastTwoDigitsOfTarget} (isEven: ${isTargetPeriodEven})`);
        
        const p1Size = this._calculateP1Size(intermediateP1Result, isTargetPeriodEven);
        const p2Size = (p1Size === "BIG" ? "SMALL" : "BIG");
        
        console.log(`[P1P2Gen] Calculated for ${targetIssueNumber} -> P1 Size: ${p1Size}, P2 Size: ${p2Size}`);
        
        return { p1Size: p1Size, p2Size: p2Size };
    }

    _generateFriendStrategyPrediction(activeIssueNumber, gameHistory, currentGameType) {
        console.log('[FriendStrategyL3] === Starting New Prediction Cycle ===');
        console.log('[FriendStrategyL3] Inputs - ActiveIssue:', activeIssueNumber, 'GameHistory Length:', gameHistory ? gameHistory.length : 0, 'GameType:', currentGameType);
        
        if (!gameHistory || gameHistory.length === 0) {
            console.log('[FriendStrategyL3] Error: gameHistory is empty. Cannot proceed.');
            return null;
        }
        
        const mostRecentCompleted = gameHistory[0];
        console.log('[FriendStrategyL3] Most recent completed issue:', mostRecentCompleted);
        
        const actualOutcomeNumberOfMostRecent = parseInt(mostRecentCompleted.number);
        if (isNaN(actualOutcomeNumberOfMostRecent) || actualOutcomeNumberOfMostRecent < 0 || actualOutcomeNumberOfMostRecent > 9) {
            console.log('[FriendStrategyL3] Error: Invalid outcome number for most recent completed issue:', mostRecentCompleted.number);
            return null;
        }
        
        const actualOutcomeSizeOfMostRecent = mostRecentCompleted.size ? String(mostRecentCompleted.size).toUpperCase() : null;
        if (actualOutcomeSizeOfMostRecent !== "BIG" && actualOutcomeSizeOfMostRecent !== "SMALL") {
            console.log('[FriendStrategyL3] Error: Invalid outcome size for most recent completed issue:', mostRecentCompleted.size, '. Parsed as:', actualOutcomeSizeOfMostRecent);
            return null;
        }
        
        console.log('[FriendStrategyL3] Valid most recent data - Number:', actualOutcomeNumberOfMostRecent, 'Size:', actualOutcomeSizeOfMostRecent);
        
        if (gameHistory.length >= 2) {
            console.log('[FriendStrategyL3] Evaluating previous round winner (needs gameHistory[0] and gameHistory[1]).');
            const contextForLastWinEval = gameHistory[1];
            console.log('[FriendStrategyL3] Context for last win evaluation:', contextForLastWinEval);
            
            const actualOutcomeNumForContext = parseInt(contextForLastWinEval.number);
            if (isNaN(actualOutcomeNumForContext) || actualOutcomeNumForContext < 0 || actualOutcomeNumForContext > 9) {
                console.log('[FriendStrategyL3] Warning: Invalid context number for winner evaluation:', contextForLastWinEval.number, '. Sticking with current active method:', PredictionLogic.currentActiveMethod);
            } else {
                console.log('[FriendStrategyL3] Calling _getCalculatedP1AndP2SizesForTargetPeriod to see what P1/P2 would have predicted for the issue that just completed:', mostRecentCompleted.issueNumber);
                const pastPredictions = this._getCalculatedP1AndP2SizesForTargetPeriod(mostRecentCompleted.issueNumber, contextForLastWinEval.issueNumber, actualOutcomeNumForContext);
                
                if (!pastPredictions) {
                    console.log('[FriendStrategyL3] Could not determine past P1/P2 predictions for winner evaluation. Sticking with current active method:', PredictionLogic.currentActiveMethod);
                } else {
                    console.log('[FriendStrategyL3] Past predictions for', mostRecentCompleted.issueNumber, 'were - P1:', pastPredictions.p1Size, ', P2:', pastPredictions.p2Size);
                    
                    const predictedSizeByActiveMethodForLastRound = (PredictionLogic.currentActiveMethod === 'P1') ? pastPredictions.p1Size : pastPredictions.p2Size;
                    console.log('[FriendStrategyL3] Last round, active method was:', PredictionLogic.currentActiveMethod, 'which predicted:', predictedSizeByActiveMethodForLastRound, 'Actual outcome was:', actualOutcomeSizeOfMostRecent);
                    
                    const activeMethodWasCorrect = (predictedSizeByActiveMethodForLastRound === actualOutcomeSizeOfMostRecent);
                    if (!activeMethodWasCorrect) {
                        const oldMethod = PredictionLogic.currentActiveMethod;
                        PredictionLogic.currentActiveMethod = (PredictionLogic.currentActiveMethod === 'P1' ? 'P2' : 'P1');
                        console.log('[FriendStrategyL3] Active method', oldMethod, 'was WRONG. Switched to new active method:', PredictionLogic.currentActiveMethod);
                    } else {
                        console.log('[FriendStrategyL3] Active method', PredictionLogic.currentActiveMethod, 'was CORRECT. Sticking with it.');
                    }
                }
            }
        } else {
            console.log('[FriendStrategyL3] Not enough history (need 2 previous results) to evaluate winner. Using current active method:', PredictionLogic.currentActiveMethod);
        }
        
        console.log('[FriendStrategyL3] Generating P1/P2 predictions for upcoming activeIssueNumber:', activeIssueNumber, 'using context from:', mostRecentCompleted.issueNumber);
        const upcomingPredictions = this._getCalculatedP1AndP2SizesForTargetPeriod(activeIssueNumber, mostRecentCompleted.issueNumber, actualOutcomeNumberOfMostRecent);
        
        if (!upcomingPredictions) {
            console.error('[FriendStrategyL3] CRITICAL: Could not generate P1/P2 predictions for upcoming issue. Fallback needed.');
            return null;
        }
        
        console.log('[FriendStrategyL3] Upcoming predictions - P1:', upcomingPredictions.p1Size, ', P2:', upcomingPredictions.p2Size);
        
        const finalPredictedSize = (PredictionLogic.currentActiveMethod === 'P1') ? upcomingPredictions.p1Size : upcomingPredictions.p2Size;
        console.log('[FriendStrategyL3] Final prediction will use method:', PredictionLogic.currentActiveMethod, 'resulting in size:', finalPredictedSize);
        
        const randomColor = this._getRandomColorPrediction();
        console.log('[FriendStrategyL3] Final combined prediction object:', { size: finalPredictedSize, color: randomColor });
        
        return { size: finalPredictedSize, color: randomColor };
    }

    async _getJsonPrediction(activeIssueNumber, gameHistory, currentGameType) {
        if (!this.jsonData) await this._loadPredictionsFromJson();
        return this.jsonData?.find(p => p.issueNumber === activeIssueNumber) || null;
    }

    async _loadPredictionsFromJson() {
        try {
            this.jsonData = await fetch(chrome.runtime.getURL('TRALALA LEYO/Prediction.json')).then(r => r.json());
        } catch {
            console.error('Failed to load Prediction.json');
            this.jsonData = [];
        }
    }
} 