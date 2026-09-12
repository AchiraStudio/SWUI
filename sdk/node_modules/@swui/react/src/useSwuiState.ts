import { useState, useEffect } from 'react';
import { getState, subscribeState } from '@swui/core';

/**
 * React hook that subscribes to an Unreal Engine state key.
 * Returns the current value from the state snapshot and triggers re-renders on update.
 *
 * @param key The state key (e.g. 'Player.Health', 'Weapon.Ammo')
 * @param defaultValue Fallback value if the state is not yet initialized
 */
export function useSwuiState<T = unknown>(key: string, defaultValue?: T): T {
  const [value, setValue] = useState<T>(() => {
    const snap = getState<T>(key);
    return snap !== undefined ? snap : (defaultValue as T);
  });

  useEffect(() => {
    const snap = getState<T>(key);
    if (snap !== undefined) {
      setValue(snap);
    }
    return subscribeState<T>(key, (newVal) => {
      setValue(newVal);
    });
  }, [key]);

  return value;
}
