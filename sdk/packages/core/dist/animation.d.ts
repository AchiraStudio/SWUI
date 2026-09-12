import { Unsubscribe, InterpolationOptions } from './types';
export declare function lerp(a: number, b: number, t: number): number;
export declare function damp(current: number, target: number, smoothing: number, dt: number): number;
export declare function createSpring(config?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
    initialValue?: number;
}): {
    readonly value: number;
    target: number;
    set(v: number): void;
    step(dt: number): number;
};
export declare function setActivity(key: string, active: boolean): void;
export declare const animation: {
    begin(id?: string): void;
    end(id?: string): void;
};
export declare function interpolate(key: string, callback: (currentValue: number) => void, options?: InterpolationOptions): Unsubscribe;
