import { Unsubscribe } from './types';
import { onEvent } from './events';

export function onActivate(fn: () => void): Unsubscribe {
  return onEvent('swui:activate', fn);
}

export function onDeactivate(fn: () => void): Unsubscribe {
  return onEvent('swui:deactivate', fn);
}

export function onSleep(fn: () => void): Unsubscribe {
  return onEvent('swui:sleep', fn);
}

export function onWake(fn: () => void): Unsubscribe {
  return onEvent('swui:wake', fn);
}
