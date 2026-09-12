import { useEffect } from 'react';
import { onNavigate, onConfirm, onCancel, onNextTab, onPreviousTab, } from '@swui/core';
/**
 * React hook that binds gamepad and menu directional navigation callbacks.
 */
export function useSwuiNavigation(handlers) {
    useEffect(() => {
        const unsubs = [];
        if (handlers.onNavigate)
            unsubs.push(onNavigate(handlers.onNavigate));
        if (handlers.onConfirm)
            unsubs.push(onConfirm(handlers.onConfirm));
        if (handlers.onCancel)
            unsubs.push(onCancel(handlers.onCancel));
        if (handlers.onNextTab)
            unsubs.push(onNextTab(handlers.onNextTab));
        if (handlers.onPreviousTab)
            unsubs.push(onPreviousTab(handlers.onPreviousTab));
        return () => {
            unsubs.forEach((u) => u());
        };
    }, [
        handlers.onNavigate,
        handlers.onConfirm,
        handlers.onCancel,
        handlers.onNextTab,
        handlers.onPreviousTab,
    ]);
}
