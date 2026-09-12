import { Unsubscribe, SwuiRuntimeData } from './types';

const stateSnapshot: Record<string, unknown> = {};
const subscribers: Map<string, Set<(value: unknown) => void>> = new Map();
const batchListeners: Set<(batch: Record<string, unknown>, runtime?: SwuiRuntimeData) => void> = new Set();
const tickListeners: Set<(runtime: SwuiRuntimeData) => void> = new Set();

let initialized = false;

function ensureInitialized(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.__SWUI__ = window.__SWUI__ || {};
  window.__SWUI__.state = window.__SWUI__.state || stateSnapshot;

  window.__SWUI__._notify = (key: string, value: unknown) => {
    stateSnapshot[key] = value;
    const keySubs = subscribers.get(key);
    if (keySubs) {
      keySubs.forEach((cb) => {
        try {
          cb(value);
        } catch (e) {
          console.error(`[SWUI] Error in subscriber for key "${key}":`, e);
        }
      });
    }
  };

  window.__SWUI__._batch = (batch: Record<string, unknown>, runtime?: unknown) => {
    for (const k in batch) {
      stateSnapshot[k] = batch[k];
      const keySubs = subscribers.get(k);
      if (keySubs) {
        keySubs.forEach((cb) => {
          try {
            cb(batch[k]);
          } catch (e) {
            console.error(`[SWUI] Error in subscriber for key "${k}":`, e);
          }
        });
      }
    }
    batchListeners.forEach((cb) => {
      try {
        cb(batch, runtime as SwuiRuntimeData);
      } catch (e) {
        console.error('[SWUI] Error in batch listener:', e);
      }
    });
  };

  document.addEventListener('swui:tick', (e: Event) => {
    const customEvt = e as CustomEvent<SwuiRuntimeData>;
    if (customEvt.detail) {
      tickListeners.forEach((cb) => {
        try {
          cb(customEvt.detail);
        } catch (err) {
          console.error('[SWUI] Error in tick listener:', err);
        }
      });
    }
  });

  document.addEventListener('swui:stateChange', (e: Event) => {
    const customEvt = e as CustomEvent<{ key: string; value: unknown }>;
    if (customEvt.detail) {
      const { key, value } = customEvt.detail;
      stateSnapshot[key] = value;
      const keySubs = subscribers.get(key);
      if (keySubs) {
        keySubs.forEach((cb) => cb(value));
      }
    }
  });
}

export function getState<T = unknown>(key: string): T | undefined {
  ensureInitialized();
  return stateSnapshot[key] as T;
}

export function getAllState(): Record<string, unknown> {
  ensureInitialized();
  return { ...stateSnapshot };
}

export function subscribeState<T = unknown>(key: string, fn: (value: T) => void): Unsubscribe {
  ensureInitialized();

  let set = subscribers.get(key);
  if (!set) {
    set = new Set();
    subscribers.set(key, set);
  }

  const handler = fn as (value: unknown) => void;
  set.add(handler);

  // Immediately notify if value is already present in snapshot
  if (key in stateSnapshot) {
    try {
      fn(stateSnapshot[key] as T);
    } catch (e) {
      console.error(`[SWUI] Error invoking initial subscription for key "${key}":`, e);
    }
  }

  return () => {
    set?.delete(handler);
    if (set && set.size === 0) {
      subscribers.delete(key);
    }
  };
}

export function onState<T = unknown>(key: string, fn: (value: T) => void): Unsubscribe {
  return subscribeState(key, fn);
}

export function updateState(key: string, value: unknown): void {
  ensureInitialized();
  stateSnapshot[key] = value;
  const set = subscribers.get(key);
  if (set) {
    set.forEach((cb) => cb(value));
  }
}

export function onBatch(fn: (batch: Record<string, unknown>, runtime?: SwuiRuntimeData) => void): Unsubscribe {
  ensureInitialized();
  batchListeners.add(fn);
  return () => batchListeners.delete(fn);
}

export function onTick(fn: (runtime: SwuiRuntimeData) => void): Unsubscribe {
  ensureInitialized();
  tickListeners.add(fn);
  return () => tickListeners.delete(fn);
}
