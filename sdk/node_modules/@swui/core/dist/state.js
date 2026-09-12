const stateSnapshot = {};
const subscribers = new Map();
const batchListeners = new Set();
const tickListeners = new Set();
let initialized = false;
function ensureInitialized() {
    if (initialized || typeof window === 'undefined')
        return;
    initialized = true;
    window.__SWUI__ = window.__SWUI__ || {};
    window.__SWUI__.state = window.__SWUI__.state || stateSnapshot;
    window.__SWUI__._notify = (key, value) => {
        stateSnapshot[key] = value;
        const keySubs = subscribers.get(key);
        if (keySubs) {
            keySubs.forEach((cb) => {
                try {
                    cb(value);
                }
                catch (e) {
                    console.error(`[SWUI] Error in subscriber for key "${key}":`, e);
                }
            });
        }
    };
    window.__SWUI__._batch = (batch, runtime) => {
        for (const k in batch) {
            stateSnapshot[k] = batch[k];
            const keySubs = subscribers.get(k);
            if (keySubs) {
                keySubs.forEach((cb) => {
                    try {
                        cb(batch[k]);
                    }
                    catch (e) {
                        console.error(`[SWUI] Error in subscriber for key "${k}":`, e);
                    }
                });
            }
        }
        batchListeners.forEach((cb) => {
            try {
                cb(batch, runtime);
            }
            catch (e) {
                console.error('[SWUI] Error in batch listener:', e);
            }
        });
    };
    document.addEventListener('swui:tick', (e) => {
        const customEvt = e;
        if (customEvt.detail) {
            tickListeners.forEach((cb) => {
                try {
                    cb(customEvt.detail);
                }
                catch (err) {
                    console.error('[SWUI] Error in tick listener:', err);
                }
            });
        }
    });
    document.addEventListener('swui:stateChange', (e) => {
        const customEvt = e;
        if (customEvt.detail) {
            const { key, value } = customEvt.detail;
            stateSnapshot[key] = value;
            const keySubs = subscribers.get(key);
            if (keySubs) {
                keySubs.forEach((cb) => cb(value));
            }
        }
    });
}
export function getState(key) {
    ensureInitialized();
    return stateSnapshot[key];
}
export function getAllState() {
    ensureInitialized();
    return { ...stateSnapshot };
}
export function subscribeState(key, fn) {
    ensureInitialized();
    let set = subscribers.get(key);
    if (!set) {
        set = new Set();
        subscribers.set(key, set);
    }
    const handler = fn;
    set.add(handler);
    // Immediately notify if value is already present in snapshot
    if (key in stateSnapshot) {
        try {
            fn(stateSnapshot[key]);
        }
        catch (e) {
            console.error(`[SWUI] Error invoking initial subscription for key "${key}":`, e);
        }
    }
    return () => {
        set?.delete(handler);
        if (set && set.size === 0) {
            subscribers.delete(key);
        }
    };
}
export function onState(key, fn) {
    return subscribeState(key, fn);
}
export function updateState(key, value) {
    ensureInitialized();
    stateSnapshot[key] = value;
    const set = subscribers.get(key);
    if (set) {
        set.forEach((cb) => cb(value));
    }
}
export function onBatch(fn) {
    ensureInitialized();
    batchListeners.add(fn);
    return () => batchListeners.delete(fn);
}
export function onTick(fn) {
    ensureInitialized();
    tickListeners.add(fn);
    return () => tickListeners.delete(fn);
}
