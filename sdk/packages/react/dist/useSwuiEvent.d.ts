/**
 * React hook that returns an event emitter callback targeting an Unreal Engine GameplayTag.
 *
 * @param tag The GameplayTag event name (e.g. 'swui.menu.quit', 'Player.Action.Fire')
 */
export declare function useSwuiEvent<TPayload = unknown>(tag: string): (payload?: TPayload) => void;
