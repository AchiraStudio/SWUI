import { emitNavigationEvent } from '@swui/core';

/**
 * Vue 3 composable that returns an event emitter targeting an Unreal Engine GameplayTag.
 *
 * @param tag The GameplayTag event name (e.g. 'swui.menu.quit', 'Player.Action.Fire')
 */
export function useSwuiEvent<TPayload = unknown>(tag: string): (payload?: TPayload) => void {
  return (payload?: TPayload) => {
    emitNavigationEvent(tag, payload);
  };
}
