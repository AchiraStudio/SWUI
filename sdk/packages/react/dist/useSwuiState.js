import { useState, useEffect } from 'react';
import { getState, subscribeState } from '@swui/core';
/**
 * React hook that subscribes to an Unreal Engine state key.
 * Returns the current value from the state snapshot and triggers re-renders on update.
 *
 * @param key The state key (e.g. 'Player.Health', 'Weapon.Ammo')
 * @param defaultValue Fallback value if the state is not yet initialized
 */
export function useSwuiState(key, defaultValue) {
    const [value, setValue] = useState(() => {
        const snap = getState(key);
        return snap !== undefined ? snap : defaultValue;
    });
    useEffect(() => {
        const snap = getState(key);
        if (snap !== undefined) {
            setValue(snap);
        }
        return subscribeState(key, (newVal) => {
            setValue(newVal);
        });
    }, [key]);
    return value;
}
