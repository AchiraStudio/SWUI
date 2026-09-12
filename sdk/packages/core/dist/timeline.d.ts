import { Unsubscribe, SwuiTimelineState, SwuiTimelineData } from './types';
export declare function updateClock(gameTime: number, timeDilation?: number, paused?: boolean): void;
export declare function gameTimeNow(): number;
export declare function getTimeline(id: string): SwuiTimelineData | undefined;
export declare function getTimelineState(id: string): SwuiTimelineState;
export declare function getTimelineGeneration(id: string): number;
export declare function getTimelineProgress(id: string): number;
export declare const timeline: {
    start(id: string, duration: number, reversed?: boolean): void;
    progress: typeof getTimelineProgress;
    getState: typeof getTimelineState;
    getGeneration: typeof getTimelineGeneration;
    onComplete(id: string, callback: (generation: number) => void): Unsubscribe;
    onCancel(id: string, callback: (generation: number, progress: number) => void): Unsubscribe;
    onProgress(id: string, callback: (progress: number, state: SwuiTimelineState) => void): Unsubscribe;
};
