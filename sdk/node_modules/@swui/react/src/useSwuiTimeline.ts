import { useState, useEffect } from 'react';
import { timeline, getTimelineProgress, SwuiTimelineState } from '@swui/core';

/**
 * React hook that binds to an authoritative SWUI timeline and updates progress in real time.
 *
 * @param id The unique identifier of the timeline
 */
export function useSwuiTimeline(id: string): { progress: number; state: SwuiTimelineState } {
  const [progress, setProgress] = useState(() => getTimelineProgress(id));
  const [state, setState] = useState<SwuiTimelineState>(() => timeline.getState(id));

  useEffect(() => {
    return timeline.onProgress(id, (p, s) => {
      setProgress(p);
      setState(s);
    });
  }, [id]);

  return { progress, state };
}
