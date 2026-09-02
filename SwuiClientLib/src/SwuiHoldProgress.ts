import Swui, { type SwuiTimelineState, type Unsubscribe } from './swui';

export interface SwuiHoldProgressOptions {
  timelineId: string;
  onComplete?: (generation: number) => void;
  onCancel?: (generation: number, progress: number) => void;
  onProgress?: (progress: number, state: SwuiTimelineState) => void;
}

/**
 * SwuiHoldProgress
 *
 * Reference implementation for smooth client-side timeline presentation (e.g. hold-to-interact).
 * Operates purely on local RequestAnimationFrame interpolated against authoritative game time.
 * Enforces the PredictedEnd invariant: running progress is bounded to [0, 1.0) until authoritative completion.
 */
export class SwuiHoldProgress {
  private timelineId: string;
  private unsubs: Unsubscribe[] = [];
  private currentProgress = 0;
  private currentState: SwuiTimelineState = 'idle';

  constructor(options: SwuiHoldProgressOptions) {
    this.timelineId = options.timelineId;

    // Subscribe to progress ticks driven by requestAnimationFrame
    this.unsubs.push(
      Swui.timeline.onProgress(this.timelineId, (progress, state) => {
        this.currentProgress = progress;
        this.currentState = state;
        options.onProgress?.(progress, state);
      })
    );

    // Subscribe to authoritative completion
    this.unsubs.push(
      Swui.timeline.onComplete(this.timelineId, (generation) => {
        this.currentProgress = 1.0;
        this.currentState = 'completed';
        options.onComplete?.(generation);
      })
    );

    // Subscribe to authoritative cancellation
    this.unsubs.push(
      Swui.timeline.onCancel(this.timelineId, (generation, progress) => {
        this.currentProgress = progress;
        this.currentState = 'cancelled';
        options.onCancel?.(generation, progress);
      })
    );
  }

  public getProgress(): number {
    return Swui.timeline.progress(this.timelineId);
  }

  public getState(): SwuiTimelineState {
    return Swui.timeline.getState(this.timelineId);
  }

  public getGeneration(): number {
    return Swui.timeline.getGeneration(this.timelineId);
  }

  public destroy(): void {
    this.unsubs.forEach((unsub) => unsub());
    this.unsubs = [];
  }
}
