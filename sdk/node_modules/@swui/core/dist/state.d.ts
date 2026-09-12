import { Unsubscribe, SwuiRuntimeData } from './types';
export declare function getState<T = unknown>(key: string): T | undefined;
export declare function getAllState(): Record<string, unknown>;
export declare function subscribeState<T = unknown>(key: string, fn: (value: T) => void): Unsubscribe;
export declare function onState<T = unknown>(key: string, fn: (value: T) => void): Unsubscribe;
export declare function updateState(key: string, value: unknown): void;
export declare function onBatch(fn: (batch: Record<string, unknown>, runtime?: SwuiRuntimeData) => void): Unsubscribe;
export declare function onTick(fn: (runtime: SwuiRuntimeData) => void): Unsubscribe;
