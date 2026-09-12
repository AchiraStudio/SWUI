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
export declare function postMessage(message: unknown): void;
export declare function query(message: unknown): Promise<string>;
export declare function emitNavigationEvent(tag: string, payload?: unknown): void;
export {};
