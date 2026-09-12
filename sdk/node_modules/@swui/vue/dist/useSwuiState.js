import { ref, onMounted, onUnmounted } from 'vue';
import { getState, subscribeState } from '@swui/core';
/**
 * Vue 3 Composition API hook that returns a reactive Ref bound to an Unreal Engine state key.
 *
 * @param key The state key (e.g. 'Player.Health', 'Weapon.Ammo')
 * @param defaultValue Fallback value if the state is not yet initialized
 */
export function useSwuiState(key, defaultValue) {
    const initial = getState(key);
    const stateRef = ref(initial !== undefined ? initial : defaultValue);
    let unsub = null;
    onMounted(() => {
        unsub = subscribeState(key, (val) => {
            stateRef.value = val;
        });
    });
    onUnmounted(() => {
        if (unsub) {
            unsub();
            unsub = null;
        }
    });
    return stateRef;
}
