import { readable } from 'svelte/store';
import { getState, subscribeState, emitNavigationEvent } from '@swui/core';
/**
 * Creates a Svelte Readable store bound to an Unreal Engine state key.
 *
 * @param key The state key (e.g. 'Player.Health', 'Weapon.Ammo')
 * @param defaultValue Fallback value if the state is not yet initialized
 */
export function swuiState(key, defaultValue) {
    return readable(getState(key) ?? defaultValue, (set) => {
        const initial = getState(key);
        if (initial !== undefined) {
            set(initial);
        }
        return subscribeState(key, (val) => {
            set(val);
        });
    });
}
/**
 * Returns an event emitter targeting an Unreal Engine GameplayTag.
 *
 * @param tag The GameplayTag event name (e.g. 'swui.menu.quit', 'Player.Action.Fire')
 */
export function swuiEvent(tag) {
    return (payload) => {
        emitNavigationEvent(tag, payload);
    };
}
