import { create } from 'zustand';
const registeredUrlStoreNames = new Set();
const registeredLocalStoreNames = new Set();
const registeredSessionStoreNames = new Set();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const debounce = (func, wait) => {
    let timeout = null;
    return (...args) => {
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
let cachedUrlSearch = '';
let cachedParams = null;
const getCachedParams = () => {
    const currentSearch = window.location.search;
    if (currentSearch !== cachedUrlSearch || !cachedParams) {
        cachedUrlSearch = currentSearch;
        cachedParams = new URLSearchParams(currentSearch);
    }
    return cachedParams;
};
const persistToUrl = (name, urlKeys, state, options, prevJsonStr) => {
    if (typeof window === 'undefined')
        return;
    const params = getCachedParams();
    const data = Object.fromEntries(urlKeys.map(k => [k, state[k]]).filter(([, v]) => v !== undefined));
    const dataStr = JSON.stringify(data);
    if (prevJsonStr === dataStr)
        return;
    const shouldEncode = options?.base64?.enabled && dataStr.length > (options.base64.threshold || 100);
    let finalDataStr = dataStr;
    if (shouldEncode) {
        finalDataStr = btoa(dataStr);
        params.set(`${name}_encoded`, '1');
    }
    else {
        params.delete(`${name}_encoded`);
    }
    params.set(name, finalDataStr);
    cachedUrlSearch = `?${params.toString()}`;
    cachedParams = params;
    const useHistory = options?.history && options.history.length > 0;
    if (useHistory) {
        window.history.pushState(null, '', cachedUrlSearch);
    }
    else {
        window.history.replaceState(null, '', cachedUrlSearch);
    }
};
const readFromUrl = (name, urlKeys) => {
    if (typeof window === 'undefined')
        return {};
    try {
        const params = getCachedParams();
        const raw = params.get(name);
        if (!raw)
            return {};
        const isEncoded = params.get(`${name}_encoded`) === '1';
        const parsed = isEncoded
            ? JSON.parse(atob(raw))
            : JSON.parse(raw);
        return Object.fromEntries(urlKeys.map(k => [k, parsed[k]]).filter(([, v]) => v !== undefined));
    }
    catch {
        return {};
    }
};
const persistToLocalStorage = (name, localKeys, state, prevJsonStr) => {
    if (typeof window === 'undefined')
        return;
    const data = Object.fromEntries(localKeys.map(k => [k, state[k]]).filter(([, v]) => v !== undefined));
    const dataStr = JSON.stringify(data);
    if (prevJsonStr === dataStr)
        return;
    try {
        localStorage.setItem(name, dataStr);
    }
    catch (error) {
        console.warn(`Failed to write to localStorage (${name}):`, error);
    }
};
const readFromLocalStorage = (name, localKeys) => {
    if (typeof window === 'undefined')
        return {};
    try {
        const raw = localStorage.getItem(name);
        if (!raw)
            return {};
        const parsed = JSON.parse(raw);
        return Object.fromEntries(localKeys.map(k => [k, parsed[k]]).filter(([, v]) => v !== undefined));
    }
    catch {
        return {};
    }
};
const persistToSessionStorage = (name, sessionKeys, state, prevJsonStr) => {
    if (typeof window === 'undefined')
        return;
    const data = Object.fromEntries(sessionKeys.map(k => [k, state[k]]).filter(([, v]) => v !== undefined));
    const dataStr = JSON.stringify(data);
    if (prevJsonStr === dataStr)
        return;
    try {
        sessionStorage.setItem(name, dataStr);
    }
    catch (error) {
        console.warn(`Failed to write to sessionStorage (${name}):`, error);
    }
};
const readFromSessionStorage = (name, sessionKeys) => {
    if (typeof window === 'undefined')
        return {};
    try {
        const raw = sessionStorage.getItem(name);
        if (!raw)
            return {};
        const parsed = JSON.parse(raw);
        return Object.fromEntries(sessionKeys.map(k => [k, parsed[k]]).filter(([, v]) => v !== undefined));
    }
    catch {
        return {};
    }
};
export const createPersistStore = (name, keys, initializer, options) => {
    const urlKeys = keys.urlKeys;
    const localKeys = keys.localKeys;
    const sessionKeys = keys.sessionKeys;
    if (urlKeys?.length && registeredUrlStoreNames.has(name)) {
        throw new Error(`URL store name conflict: "${name}" is already in use. Please choose a different name.`);
    }
    if (localKeys?.length && registeredLocalStoreNames.has(name)) {
        throw new Error(`localStorage store name conflict: "${name}" is already in use. Please choose a different name.`);
    }
    if (sessionKeys?.length && registeredSessionStoreNames.has(name)) {
        throw new Error(`sessionStorage store name conflict: "${name}" is already in use. Please choose a different name.`);
    }
    if (urlKeys?.length)
        registeredUrlStoreNames.add(name);
    if (localKeys?.length)
        registeredLocalStoreNames.add(name);
    if (sessionKeys?.length)
        registeredSessionStoreNames.add(name);
    const hasAnyStorage = (urlKeys?.length || localKeys?.length || sessionKeys?.length);
    if (!hasAnyStorage) {
        return initializer ? create(initializer) : create(() => ({}));
    }
    const store = initializer ? create(initializer) : create(() => ({}));
    const priority = options?.priority || ['url', 'session', 'local'];
    const initialData = {};
    // Tüm key'leri topla
    const allKeys = new Set();
    if (urlKeys?.length)
        urlKeys.forEach(k => allKeys.add(k));
    if (localKeys?.length)
        localKeys.forEach(k => allKeys.add(k));
    if (sessionKeys?.length)
        sessionKeys.forEach(k => allKeys.add(k));
    // Her key için priority sırasına göre ilk bulunan storage'dan oku
    for (const key of allKeys) {
        // Bu key hangi storage'larda tanımlı?
        const keyInUrl = urlKeys?.includes(key) ?? false;
        const keyInLocal = localKeys?.includes(key) ?? false;
        const keyInSession = sessionKeys?.includes(key) ?? false;
        // Priority sırasına göre kontrol et
        for (const storageType of priority) {
            if (storageType === 'url' && keyInUrl) {
                const urlData = readFromUrl(name, [key]);
                if (urlData[key] !== undefined) {
                    initialData[key] = urlData[key];
                    break; // Bu key için bulundu, diğer storage'ları kontrol etme
                }
            }
            else if (storageType === 'session' && keyInSession) {
                const sessionData = readFromSessionStorage(name, [key]);
                if (sessionData[key] !== undefined) {
                    initialData[key] = sessionData[key];
                    break; // Bu key için bulundu
                }
            }
            else if (storageType === 'local' && keyInLocal) {
                const localData = readFromLocalStorage(name, [key]);
                if (localData[key] !== undefined) {
                    initialData[key] = localData[key];
                    break; // Bu key için bulundu
                }
            }
        }
    }
    if (Object.keys(initialData).length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store.setState(initialData);
    }
    const historyKeys = options?.history || [];
    const useHistory = historyKeys.length > 0 && urlKeys?.length ? true : false;
    const debounceDelay = options?.debounceDelay ?? 100;
    const prev = {};
    const prevJsonStr = {};
    if (urlKeys?.length) {
        prev.url = Object.fromEntries(urlKeys.map(k => [k, store.getState()[k]]));
        prevJsonStr.url = JSON.stringify(prev.url);
    }
    if (localKeys?.length) {
        prev.local = Object.fromEntries(localKeys.map(k => [k, store.getState()[k]]));
        prevJsonStr.local = JSON.stringify(prev.local);
    }
    if (sessionKeys?.length) {
        prev.session = Object.fromEntries(sessionKeys.map(k => [k, store.getState()[k]]));
        prevJsonStr.session = JSON.stringify(prev.session);
    }
    const checkChanges = (curr) => {
        const changes = {};
        if (urlKeys?.length) {
            const urlCurr = Object.fromEntries(urlKeys.map(k => [k, curr[k]]));
            changes.url = JSON.stringify(prev.url) !== JSON.stringify(urlCurr);
        }
        if (localKeys?.length) {
            const localCurr = Object.fromEntries(localKeys.map(k => [k, curr[k]]));
            changes.local = JSON.stringify(prev.local) !== JSON.stringify(localCurr);
        }
        if (sessionKeys?.length) {
            const sessionCurr = Object.fromEntries(sessionKeys.map(k => [k, curr[k]]));
            changes.session = JSON.stringify(prev.session) !== JSON.stringify(sessionCurr);
        }
        let hasHistoryChange = false;
        if (urlKeys?.length && historyKeys.length) {
            for (const k of historyKeys) {
                if (prev.url?.[k] !== curr[k]) {
                    hasHistoryChange = true;
                    break;
                }
            }
        }
        return { changes, hasHistoryChange };
    };
    const debouncedPersist = debounce((currentState, historyChanged) => {
        if (urlKeys?.length && prev.url) {
            const urlCurr = Object.fromEntries(urlKeys.map(k => [k, currentState[k]]));
            persistToUrl(name, urlKeys, urlCurr, {
                ...options,
                history: historyChanged && useHistory ? historyKeys : []
            }, prevJsonStr.url);
            prev.url = urlCurr;
            prevJsonStr.url = JSON.stringify(urlCurr);
        }
        if (localKeys?.length && prev.local) {
            const localCurr = Object.fromEntries(localKeys.map(k => [k, currentState[k]]));
            persistToLocalStorage(name, localKeys, localCurr, prevJsonStr.local);
            prev.local = localCurr;
            prevJsonStr.local = JSON.stringify(localCurr);
        }
        if (sessionKeys?.length && prev.session) {
            const sessionCurr = Object.fromEntries(sessionKeys.map(k => [k, currentState[k]]));
            persistToSessionStorage(name, sessionKeys, sessionCurr, prevJsonStr.session);
            prev.session = sessionCurr;
            prevJsonStr.session = JSON.stringify(sessionCurr);
        }
    }, debounceDelay);
    let handlePopState = null;
    if (useHistory && typeof window !== 'undefined' && urlKeys?.length) {
        handlePopState = () => {
            cachedUrlSearch = '';
            cachedParams = null;
            const urlData = readFromUrl(name, urlKeys);
            if (Object.keys(urlData).length) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                store.setState(urlData);
                if (prev.url) {
                    prev.url = Object.fromEntries(urlKeys.map(k => [k, store.getState()[k]]));
                    prevJsonStr.url = JSON.stringify(prev.url);
                }
            }
        };
        window.addEventListener('popstate', handlePopState);
    }
    const unsubscribe = store.subscribe((state) => {
        const s = state;
        const { changes, hasHistoryChange } = checkChanges(s);
        if (Object.values(changes).some(Boolean)) {
            debouncedPersist(s, hasHistoryChange);
        }
    });
    store.destroy = () => {
        if (handlePopState) {
            window.removeEventListener('popstate', handlePopState);
        }
        unsubscribe();
    };
    return store;
};
