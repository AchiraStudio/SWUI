// Native communication bridge between Unreal Engine and CEF/Chromium

interface SwuiCefQueryRequest {
  request: string;
  onSuccess?: (response: string) => void;
  onFailure?: (errorCode: number, errorMessage: string) => void;
}

declare global {
  interface Window {
    cefQuery?: (request: SwuiCefQueryRequest) => void;
    cefQuery_cancel?: (request: unknown) => void;
    __SWUI__?: {
      state?: Record<string, unknown>;
      events?: Record<string, unknown>;
      send?: (msg: string) => void;
      _notify?: (key: string, value: unknown) => void;
      _batch?: (batch: Record<string, unknown>, runtime?: unknown) => void;
      postMessage?: (msg: unknown) => void;
    };
    chrome?: {
      webview?: {
        postMessage: (msg: unknown) => void;
      };
    };
  }
}

function sendSwuiUrlBridge(raw: string): void {
  if (typeof document === 'undefined') return;
  const encoded = encodeURIComponent(raw);
  const url = `swui://bus?payload=${encoded}&t=${Date.now()}`;

  let iframe = document.getElementById('__swui_native_bridge_iframe') as HTMLIFrameElement | null;
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

export function postMessage(message: unknown): void {
  const json = typeof message === 'string' ? message : JSON.stringify(message);

  if (typeof window !== 'undefined') {
    if (typeof window.cefQuery === 'function') {
      window.cefQuery({
        request: json,
        onSuccess: () => {},
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

export function query(message: unknown): Promise<string> {
  const json = typeof message === 'string' ? message : JSON.stringify(message);

  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && typeof window.cefQuery === 'function') {
      window.cefQuery({
        request: json,
        onSuccess: (resp) => resolve(resp),
        onFailure: (errCode, errMsg) => reject(new Error(`[SWUI Query ${errCode}] ${errMsg}`)),
      });
    } else {
      resolve('');
    }
  });
}

export function emitNavigationEvent(tag: string, payload?: unknown): void {
  postMessage({
    type: 'navigation',
    tag,
    payload: payload ?? {},
    source: 'js',
  });
}
