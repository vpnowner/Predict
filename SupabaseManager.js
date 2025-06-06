console.log('[ORION_DEBUG] SupabaseManager.js execution started');
class SupabaseManager {
    static async getApiBrandConfigs() {
        try {
            const response = await fetch('https://bcplay.win/api/supabase/getApiBrandConfigs');
            return response.ok ? await response.json() : [];
        } catch (error) {
            console.error('[SupabaseManager] Failed to fetch brand configs from backend:', error);
            return [];
        }
    }

    static async saveRegisteredMember(userId, inviteCode, phone, originalUsername = '', originalPassword = '', brandName) {
        try {
            const response = await fetch('https://bcplay.win/api/saveMember', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, inviteCode, phone, originalUsername, originalPassword, brandName })
            });
            return response.ok ? { success: true } : { success: false, error: await response.text() };
        } catch (error) {
            console.error('[SupabaseManager] Failed to save member via backend:', error);
            return { success: false, error: 'Failed to save member' };
        }
    }

    static async updateUserBalance(userId, balance) {
        try {
            const response = await fetch('https://bcplay.win/api/supabase/updateUserBalance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, balance })
            });
            return response.ok ? await response.json() : { success: false, error: await response.text() };
        } catch (error) {
            console.error('[SupabaseManager] Error updating user balance via backend:', error);
            return { success: false, error: 'Network error or failed to make request' };
        }
    }

    static async isUserVerified(userId) {
        try {
            const response = await fetch(`https://bcplay.win/api/supabase/isUserVerified/${encodeURIComponent(userId)}`);
            const data = await response.json();
            return response.ok && data.isVerified;
        } catch (error) {
            console.error('[SupabaseManager] Failed to check user verification via backend:', error);
            return false;
        }
    }

    static async getFeatureFlag(featureKey) {
        try {
            const response = await fetch(`https://bcplay.win/api/extension/feature-flag/${encodeURIComponent(featureKey)}`);
            if (response.ok) {
                const data = await response.json();
                console.log('[SupabaseManager] Feature flag status:', data);
                return !!data.is_enabled;
            }
            console.error('[SupabaseManager] Failed to fetch feature flag:', featureKey, { status: response.status });
        } catch (error) {
            console.error('[SupabaseManager] Error fetching feature flag:', featureKey, error);
        }
        return false;
    }
}