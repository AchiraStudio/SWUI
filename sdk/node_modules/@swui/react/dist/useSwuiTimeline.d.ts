import { SwuiTimelineState } from '@swui/core';
/**
 * React hook that binds to an authoritative SWUI timeline and updates progress in real time.
 *
 * @param id The unique identifier of the timeline
 */
export declare function useSwuiTimeline(id: string): {
    progress: number;
    state: SwuiTimelineState;
};
