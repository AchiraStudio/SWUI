import { Unsubscribe } from './types';
export declare function onActivate(fn: () => void): Unsubscribe;
export declare function onDeactivate(fn: () => void): Unsubscribe;
export declare function onSleep(fn: () => void): Unsubscribe;
export declare function onWake(fn: () => void): Unsubscribe;
