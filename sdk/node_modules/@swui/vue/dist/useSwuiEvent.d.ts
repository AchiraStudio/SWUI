/**
 * Vue 3 composable that returns an event emitter targeting an Unreal Engine GameplayTag.
 *
 * @param tag The GameplayTag event name (e.g. 'swui.menu.quit', 'Player.Action.Fire')
 */
export declare function useSwuiEvent<TPayload = unknown>(tag: string): (payload?: TPayload) => void;
