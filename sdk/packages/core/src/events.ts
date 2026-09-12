import { Unsubscribe, SwuiNavigateEvent } from './types';
import { emitNavigationEvent } from './bridge';

export function onEvent<T = unknown>(name: string, fn: (detail: T) => void): Unsubscribe {
  if (typeof document === 'undefined') return () => {};

  const handler = (e: Event) => {
    const custom = e as CustomEvent<T>;
    fn(custom.detail);
  };

  document.addEventListener(name, handler);
  return () => {
    document.removeEventListener(name, handler);
  };
}

export function emitEvent(name: string, detail?: unknown): void {
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

export function onNavigate(fn: (e: SwuiNavigateEvent) => void): Unsubscribe {
  return onEvent<SwuiNavigateEvent>('swui:navigate', fn);
}

export function onConfirm(fn: () => void): Unsubscribe {
  return onEvent('swui:confirm', fn);
}

export function onCancel(fn: () => void): Unsubscribe {
  return onEvent('swui:cancel', fn);
}

export function onNextTab(fn: () => void): Unsubscribe {
  return onEvent('swui:nextTab', fn);
}

export function onPreviousTab(fn: () => void): Unsubscribe {
  return onEvent('swui:previousTab', fn);
}

export { emitNavigationEvent };
