export type Unsubscribe = () => void;

export interface SwuiRuntimeData {
  fps: number;
  dt: number;
  time: number;
  frameIndex: number;
  stateVersion: number;
  cefFps: number;
  width: number;
  height: number;
  timeDilation: number;
  paused: boolean;
}

export type SwuiNavDirection = 'Up' | 'Down' | 'Left' | 'Right' | 'Next' | 'Previous';

export interface SwuiNavigateEvent {
  direction: SwuiNavDirection;
}

export interface SwuiPointerMoveEvent {
  x: number;
  y: number;
}

export interface SwuiPointerButtonEvent {
  x: number;
  y: number;
  button: 'Left' | 'Right' | 'Middle';
}

export interface SwuiWheelEvent {
  deltaX: number;
  deltaY: number;
}

export interface SwuiKeyEvent {
  key: string;
}

export interface SwuiTextEvent {
  character: string;
}

export interface SwuiClockSnapshot {
  gameTime: number;
  timeDilation: number;
  paused: boolean;
  receivedAtMonotonic: number;
}

export type SwuiTimelineState = 'idle' | 'running' | 'completed' | 'cancelled';

export interface SwuiTimelineData {
  id: string;
  generation: number;
  duration: number;
  reversed: boolean;
  state: SwuiTimelineState;
  startGameTime: number;
  completeGameTime: number;
  cancelGameTime: number;
  cancelProgress: number;
}

export interface InterpolationOptions {
  speed?: number;         // Smooth lerp factor per frame (default: 0.15)
  snapThreshold?: number; // Distance below which it snaps to target (default: 0.001)
  duration?: number;
  easing?: (t: number) => number;
  onUpdate?: (value: number) => void;
  onComplete?: () => void;
}

export type DocumentLifecycleState = 'unloaded' | 'loading' | 'preloaded' | 'active' | 'sleeping' | 'unloading';
