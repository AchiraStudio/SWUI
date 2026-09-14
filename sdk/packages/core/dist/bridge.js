// Native communication bridge between Unreal Engine and CEF/Chromium
function sendSwuiUrlBridge(raw) {
    if (typeof document === 'undefined')
        return;
    const encoded = encodeURIComponent(raw);
    const url = `swui://bus?payload=${encoded}&t=${Date.now()}`;
    let iframe = document.getElementById('__swui_native_bridge_iframe');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = '__swui_native_bridge_iframe';
        iframe.style.display = 'none';
        iframe.setAttribute('aria-hidden', 'true');
        document.documentElement.appendChild(iframe);
    }
    iframe.src = url;
    setTimeout(() => {
        if (iframe) {
            iframe.src = 'about:blank';
        }
    }, 100);
}
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
        sendSwuiUrlBridge(json);
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
