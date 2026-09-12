import {
  Unsubscribe,
  SwuiPointerMoveEvent,
  SwuiPointerButtonEvent,
  SwuiWheelEvent,
  SwuiKeyEvent,
  SwuiTextEvent,
} from './types';
import { onEvent } from './events';

export function onPointerMove(fn: (e: SwuiPointerMoveEvent) => void): Unsubscribe {
  return onEvent<SwuiPointerMoveEvent>('swui:pointerMove', fn);
}

export function onPointerPress(fn: (e: SwuiPointerButtonEvent) => void): Unsubscribe {
  return onEvent<SwuiPointerButtonEvent>('swui:pointerPress', fn);
}

export function onPointerRelease(fn: (e: SwuiPointerButtonEvent) => void): Unsubscribe {
  return onEvent<SwuiPointerButtonEvent>('swui:pointerRelease', fn);
}

export function onPointerWheel(fn: (e: SwuiWheelEvent) => void): Unsubscribe {
  return onEvent<SwuiWheelEvent>('swui:pointerWheel', fn);
}

export function onKeyDown(fn: (e: SwuiKeyEvent) => void): Unsubscribe {
  return onEvent<SwuiKeyEvent>('swui:keyDown', fn);
}

export function onKeyUp(fn: (e: SwuiKeyEvent) => void): Unsubscribe {
  return onEvent<SwuiKeyEvent>('swui:keyUp', fn);
}

export function onTextInput(fn: (e: SwuiTextEvent) => void): Unsubscribe {
  return onEvent<SwuiTextEvent>('swui:textInput', fn);
}
