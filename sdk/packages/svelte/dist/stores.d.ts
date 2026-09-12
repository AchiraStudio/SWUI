import { type Readable } from 'svelte/store';
/**
 * Creates a Svelte Readable store bound to an Unreal Engine state key.
 *
 * @param key The state key (e.g. 'Player.Health', 'Weapon.Ammo')
 * @param defaultValue Fallback value if the state is not yet initialized
 */
export declare function swuiState<T = unknown>(key: string, defaultValue?: T): Readable<T>;
/**
 * Returns an event emitter targeting an Unreal Engine GameplayTag.
 *
 * @param tag The GameplayTag event name (e.g. 'swui.menu.quit', 'Player.Action.Fire')
 */
export declare function swuiEvent<TPayload = unknown>(tag: string): (payload?: TPayload) => void;
