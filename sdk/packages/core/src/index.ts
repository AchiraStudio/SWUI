import * as Types from './types';
import * as Bridge from './bridge';
import * as State from './state';
import * as Events from './events';
import * as Input from './input';
import * as Lifecycle from './lifecycle';
import * as Timeline from './timeline';
import * as Animation from './animation';

export * from './types';
export * from './bridge';
export * from './state';
export * from './events';
export * from './input';
export * from './lifecycle';
export * from './timeline';
export * from './animation';

export const swui = {
  // State API
  state: {
    get: State.getState,
    getAll: State.getAllState,
    subscribe: State.subscribeState,
    on: State.onState,
    update: State.updateState,
    onBatch: State.onBatch,
    onTick: State.onTick,
  },

  // Events API
  events: {
    on: Events.onEvent,
    emit: Events.emitEvent,
    emitNavigation: Events.emitNavigationEvent,
    emitNavigationEvent: Events.emitNavigationEvent,
  },

  // Navigation API
  navigation: {
    onNavigate: Events.onNavigate,
    onConfirm: Events.onConfirm,
    onCancel: Events.onCancel,
    onNextTab: Events.onNextTab,
    onPreviousTab: Events.onPreviousTab,
  },

  // Input API
  input: {
    onPointerMove: Input.onPointerMove,
    onPointerPress: Input.onPointerPress,
    onPointerRelease: Input.onPointerRelease,
    onPointerWheel: Input.onPointerWheel,
    onKeyDown: Input.onKeyDown,
    onKeyUp: Input.onKeyUp,
    onTextInput: Input.onTextInput,
  },

  // Lifecycle API (SWUI 3.0)
  lifecycle: {
    onActivate: Lifecycle.onActivate,
    onDeactivate: Lifecycle.onDeactivate,
    onSleep: Lifecycle.onSleep,
    onWake: Lifecycle.onWake,
  },

  // Timeline & Clock API
  timeline: Timeline.timeline,
  clock: {
    now: Timeline.gameTimeNow,
    update: Timeline.updateClock,
    getTimeline: Timeline.getTimeline,
    getTimelineState: Timeline.getTimelineState,
    getTimelineGeneration: Timeline.getTimelineGeneration,
    getTimelineProgress: Timeline.getTimelineProgress,
  },

  // Animation API
  animation: {
    lerp: Animation.lerp,
    damp: Animation.damp,
    createSpring: Animation.createSpring,
    interpolate: Animation.interpolate,
    begin: Animation.animation.begin,
    end: Animation.animation.end,
    setActivity: Animation.setActivity,
  },

  // Native Bridge
  postMessage: Bridge.postMessage,
  query: Bridge.query,
  emitNavigationEvent: Bridge.emitNavigationEvent,

  // Direct backward-compatibility shortcuts
  on: State.onState,
  get: State.getState,
  getAll: State.getAllState,
  onBatch: State.onBatch,
  onTick: State.onTick,
  onEvent: Events.onEvent,
  onNavigate: Events.onNavigate,
  onConfirm: Events.onConfirm,
  onCancel: Events.onCancel,
  onNextTab: Events.onNextTab,
  onPreviousTab: Events.onPreviousTab,
  onPointerMove: Input.onPointerMove,
  onPointerPress: Input.onPointerPress,
  onPointerRelease: Input.onPointerRelease,
  onPointerWheel: Input.onPointerWheel,
  onKeyDown: Input.onKeyDown,
  onKeyUp: Input.onKeyUp,
  onTextInput: Input.onTextInput,
  gameTimeNow: Timeline.gameTimeNow,
  updateClock: Timeline.updateClock,
  lerp: Animation.lerp,
  damp: Animation.damp,
  createSpring: Animation.createSpring,
  interpolate: Animation.interpolate,
  setActivity: Animation.setActivity,
};

export default swui;
