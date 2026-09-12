import { emitNavigationEvent } from './bridge';
export function onEvent(name, fn) {
    if (typeof document === 'undefined')
        return () => { };
    const handler = (e) => {
        const custom = e;
        fn(custom.detail);
    };
    document.addEventListener(name, handler);
    return () => {
        document.removeEventListener(name, handler);
    };
}
export function emitEvent(name, detail) {
    if (typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent(name, { detail }));
    }
}
export function onNavigate(fn) {
    return onEvent('swui:navigate', fn);
}
export function onConfirm(fn) {
    return onEvent('swui:confirm', fn);
}
export function onCancel(fn) {
    return onEvent('swui:cancel', fn);
}
export function onNextTab(fn) {
    return onEvent('swui:nextTab', fn);
}
export function onPreviousTab(fn) {
    return onEvent('swui:previousTab', fn);
}
export { emitNavigationEvent };
