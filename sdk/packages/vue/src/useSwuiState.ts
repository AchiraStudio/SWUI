import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import { getState, subscribeState, type Unsubscribe } from '@swui/core';

/**
 * Vue 3 Composition API hook that returns a reactive Ref bound to an Unreal Engine state key.
 *
 * @param key The state key (e.g. 'Player.Health', 'Weapon.Ammo')
 * @param defaultValue Fallback value if the state is not yet initialized
 */
export function useSwuiState<T = unknown>(key: string, defaultValue?: T): Ref<T> {
  const initial = getState<T>(key);
  const stateRef = ref<T>(initial !== undefined ? initial : (defaultValue as T)) as Ref<T>;
  let unsub: Unsubscribe | null = null;

  onMounted(() => {
    unsub = subscribeState<T>(key, (val) => {
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
