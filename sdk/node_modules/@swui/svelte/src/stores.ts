import { readable, type Readable } from 'svelte/store';
import { getState, subscribeState, emitNavigationEvent } from '@swui/core';

/**
 * Creates a Svelte Readable store bound to an Unreal Engine state key.
 *
 * @param key The state key (e.g. 'Player.Health', 'Weapon.Ammo')
 * @param defaultValue Fallback value if the state is not yet initialized
 */
export function swuiState<T = unknown>(key: string, defaultValue?: T): Readable<T> {
  return readable<T>(getState<T>(key) ?? (defaultValue as T), (set) => {
    const initial = getState<T>(key);
    if (initial !== undefined) {
      set(initial);
    }
    return subscribeState<T>(key, (val) => {
      set(val);
    });
  });
}

/**
 * Returns an event emitter targeting an Unreal Engine GameplayTag.
 *
 * @param tag The GameplayTag event name (e.g. 'swui.menu.quit', 'Player.Action.Fire')
 */
export function swuiEvent<TPayload = unknown>(tag: string): (payload?: TPayload) => void {
  return (payload?: TPayload) => {
    emitNavigationEvent(tag, payload);
  };
}
