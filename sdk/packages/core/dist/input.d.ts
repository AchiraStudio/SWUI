import { Unsubscribe, SwuiPointerMoveEvent, SwuiPointerButtonEvent, SwuiWheelEvent, SwuiKeyEvent, SwuiTextEvent } from './types';
export declare function onPointerMove(fn: (e: SwuiPointerMoveEvent) => void): Unsubscribe;
export declare function onPointerPress(fn: (e: SwuiPointerButtonEvent) => void): Unsubscribe;
export declare function onPointerRelease(fn: (e: SwuiPointerButtonEvent) => void): Unsubscribe;
export declare function onPointerWheel(fn: (e: SwuiWheelEvent) => void): Unsubscribe;
export declare function onKeyDown(fn: (e: SwuiKeyEvent) => void): Unsubscribe;
export declare function onKeyUp(fn: (e: SwuiKeyEvent) => void): Unsubscribe;
export declare function onTextInput(fn: (e: SwuiTextEvent) => void): Unsubscribe;
