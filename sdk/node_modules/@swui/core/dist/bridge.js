// Native communication bridge between Unreal Engine and CEF/Chromium
export function postMessage(message) {
    const json = typeof message === 'string' ? message : JSON.stringify(message);
    if (typeof window !== 'undefined') {
        if (typeof window.cefQuery === 'function') {
            window.cefQuery({
                request: json,
                onSuccess: () => { },
                onFailure: (errCode, errMsg) => {
                    console.warn(`[SWUI] cefQuery failed (${errCode}): ${errMsg}`);
                },
            });
            return;
        }
        if (window.__SWUI__?.postMessage) {
            window.__SWUI__.postMessage(message);
            return;
        }
        if (window.__SWUI__?.send) {
            window.__SWUI__.send(json);
            return;
        }
        if (window.chrome?.webview?.postMessage) {
            window.chrome.webview.postMessage(message);
            return;
        }
    }
}
export function query(message) {
    const json = typeof message === 'string' ? message : JSON.stringify(message);
    return new Promise((resolve, reject) => {
        if (typeof window !== 'undefined' && typeof window.cefQuery === 'function') {
            window.cefQuery({
                request: json,
                onSuccess: (resp) => resolve(resp),
                onFailure: (errCode, errMsg) => reject(new Error(`[SWUI Query ${errCode}] ${errMsg}`)),
            });
        }
        else {
            resolve('');
        }
    });
}
export function emitNavigationEvent(tag, payload) {
    postMessage({
        type: 'navigation',
        tag,
        payload: payload ?? {},
        source: 'js',
    });
}
