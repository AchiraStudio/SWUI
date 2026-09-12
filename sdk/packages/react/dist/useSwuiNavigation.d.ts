import { SwuiNavigateEvent } from '@swui/core';
export interface SwuiNavigationHandlers {
    onNavigate?: (e: SwuiNavigateEvent) => void;
    onConfirm?: () => void;
    onCancel?: () => void;
    onNextTab?: () => void;
    onPreviousTab?: () => void;
}
/**
 * React hook that binds gamepad and menu directional navigation callbacks.
 */
export declare function useSwuiNavigation(handlers: SwuiNavigationHandlers): void;
