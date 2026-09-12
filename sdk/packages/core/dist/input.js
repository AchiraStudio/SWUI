import { onEvent } from './events';
export function onPointerMove(fn) {
    return onEvent('swui:pointerMove', fn);
}
export function onPointerPress(fn) {
    return onEvent('swui:pointerPress', fn);
}
export function onPointerRelease(fn) {
    return onEvent('swui:pointerRelease', fn);
}
export function onPointerWheel(fn) {
    return onEvent('swui:pointerWheel', fn);
}
export function onKeyDown(fn) {
    return onEvent('swui:keyDown', fn);
}
export function onKeyUp(fn) {
    return onEvent('swui:keyUp', fn);
}
export function onTextInput(fn) {
    return onEvent('swui:textInput', fn);
}
