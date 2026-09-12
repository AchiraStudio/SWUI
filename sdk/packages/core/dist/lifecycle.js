import { onEvent } from './events';
export function onActivate(fn) {
    return onEvent('swui:activate', fn);
}
export function onDeactivate(fn) {
    return onEvent('swui:deactivate', fn);
}
export function onSleep(fn) {
    return onEvent('swui:sleep', fn);
}
export function onWake(fn) {
    return onEvent('swui:wake', fn);
}
