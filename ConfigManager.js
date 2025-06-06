class ConfigManager {
    static _settingsCache = {};
    static _lastFetchTimestamp = 0;
    static CACHE_DURATION_MS = 3600000; // 1 hour
    static _isFetching = false;
    static BACKEND_SETTINGS_URL = 'https://bcplay.win/api/extension/getAllSettings';

    static async _fetchAndCacheSettings() {
        try {
            const response = await fetch(ConfigManager.BACKEND_SETTINGS_URL);
            if (response.ok) {
                const settings = await response.json();
                ConfigManager._settingsCache = settings;
                ConfigManager._lastFetchTimestamp = Date.now();
                console.log('[ConfigManager] Successfully fetched and cached remote settings.');
                return true;
            } else {
                console.error('[ConfigManager] Failed to fetch remote settings:', response.status);
                return false;
            }
        } catch (error) {
            console.error('[ConfigManager] Failed to fetch or parse remote settings:', error);
            return false;
        }
    }

    static async init() {
        if (ConfigManager._isFetching) {
            return;
        }

        const isCacheStale = Date.now() - ConfigManager._lastFetchTimestamp > ConfigManager.CACHE_DURATION_MS;
        const isCacheEmpty = Object.keys(ConfigManager._settingsCache).length === 0;

        if (isCacheStale || isCacheEmpty) {
            ConfigManager._isFetching = true;
            await ConfigManager._fetchAndCacheSettings();
            ConfigManager._isFetching = false;
        } else {
            console.log('[ConfigManager] Settings cache is fresh, skipping fetch.');
        }
    }

    static getSetting(key, defaultValue = null) {
        if (ConfigManager._settingsCache.hasOwnProperty(key)) {
            return ConfigManager._settingsCache[key];
        }
        return defaultValue;
    }
} 