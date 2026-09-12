/**
 * React hook that subscribes to an Unreal Engine state key.
 * Returns the current value from the state snapshot and triggers re-renders on update.
 *
 * @param key The state key (e.g. 'Player.Health', 'Weapon.Ammo')
 * @param defaultValue Fallback value if the state is not yet initialized
 */
export declare function useSwuiState<T = unknown>(key: string, defaultValue?: T): T;
