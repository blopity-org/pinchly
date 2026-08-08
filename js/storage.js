import { getCurrentUser } from './auth.js';
import { STORAGE_KEYS } from './auth.js';

export function getAppStorageKey(appId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return null;
    return `${STORAGE_KEYS.appPrefix}${currentUser}:${appId}:data`;
}

export function loadAppData(appId, defaultData = {}) {
    const storageKey = getAppStorageKey(appId);
    if (!storageKey) {
        return structuredClone(defaultData);
    }

    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return structuredClone(defaultData);
        return JSON.parse(raw);
    } catch {
        return structuredClone(defaultData);
    }
}

export function saveAppData(appId, data) {
    const storageKey = getAppStorageKey(appId);
    if (!storageKey) return false;

    try {
        localStorage.setItem(storageKey, JSON.stringify(data));
        return true;
    } catch {
        return false;
    }
}
