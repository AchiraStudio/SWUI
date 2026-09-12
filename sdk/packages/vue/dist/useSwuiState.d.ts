import { type Ref } from 'vue';
/**
 * Vue 3 Composition API hook that returns a reactive Ref bound to an Unreal Engine state key.
 *
 * @param key The state key (e.g. 'Player.Health', 'Weapon.Ammo')
 * @param defaultValue Fallback value if the state is not yet initialized
 */
export declare function useSwuiState<T = unknown>(key: string, defaultValue?: T): Ref<T>;
