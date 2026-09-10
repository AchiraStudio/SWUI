// ── Debug Overlay ─────────────────────────────────────────────────────────

let _swuiDebugOverlay: HTMLDivElement | null = null;
let _swuiDebugOverlayTimeout: number | undefined;

function showSwuiDebugOverlay(tag: string, transport: string) {
  if (!_swuiDebugOverlay) {
    _swuiDebugOverlay = document.createElement('div');
    _swuiDebugOverlay.id = 'swui-debug-overlay';
    Object.assign(_swuiDebugOverlay.style, {
      position: 'fixed',
      top: '12px',
      right: '12px',
      zIndex: 99999,
      background: 'rgba(0,0,0,0.85)',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '14px',
      padding: '8px 16px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      pointerEvents: 'none',
      transition: 'opacity 0.3s',
      opacity: '1',
      maxWidth: '90vw',
    });
    document.body.appendChild(_swuiDebugOverlay);
  }
  _swuiDebugOverlay.textContent = `[SWUI NAV] tag: ${tag}  transport: ${transport}`;
  _swuiDebugOverlay.style.opacity = '1';
  if (_swuiDebugOverlayTimeout) window.clearTimeout(_swuiDebugOverlayTimeout);
  _swuiDebugOverlayTimeout = window.setTimeout(() => {
    if (_swuiDebugOverlay) _swuiDebugOverlay.style.opacity = '0.25';
  }, 2000);
}
/**
 * swui.ts — SimpleWebUI client runtime
 *
 * IIFE build  → window.Swui  (load via <script src="swui.js">)
 * ESM build   → import Swui from './swui.esm.js'
 *
 * State API:
 *   Swui.on(key, fn)   — subscribe; fires immediately if value already in snapshot.
 *                        Returns an unsubscribe function.
 *   Swui.get(key)      — one-shot snapshot read.
 *   Swui.getAll()      — full state snapshot.
 *
 * Navigation API (dot-separated event names match Gameplay Tags):
 *   Inbound:
 *     Swui.onEvent("swui.menu.open", fn)
 *     SwuiNavigationEvents.onMenuOpen(fn)
 *     Swui.onNavigate(fn)
 *     Swui.onConfirm(fn)
 *     Swui.onCancel(fn)
 *     Swui.onNextTab(fn)
 *     Swui.onPreviousTab(fn)
 *   Outbound:
 *     Swui.emitNavigationEvent("swui.menu.close")
 *     Swui.emitNavigationEvent("swui.menu.quit")
 *   Swui.onPointerMove(fn)         — pointer movement
 *   Swui.onPointerPress(fn)        — pointer button pressed
 *   Swui.onPointerRelease(fn)      — pointer button released
 *   Swui.onPointerWheel(fn)        — pointer wheel delta
 *   Swui.onKeyDown(fn)             — keyboard key pressed
 *   Swui.onKeyUp(fn)               — keyboard key released
 *   Swui.onTextInput(fn)           — text character input
 */

// ---------------------------------------------------------------------------
// SWUI JS→UE Native Message Bus (Navigation Only)
//
// Outbound messages from JS/React HUD to Unreal Engine use:
//   Swui.emitNavigationEvent(tag, payload?)
// which wraps:
//   Swui.postMessage({ type: "navigation", tag, payload: payload ?? {}, source: "js" })
//
// Transport:
//   - Uses window.cefQuery if available (preferred for CEF/Unreal)
//   - Falls back to window.__SWUI__?.postMessage if available
//   - Otherwise, safely no-ops (never throws)
//
// Only type="navigation" is routed to UE for now. Tag is mapped to FGameplayTag.
// Blueprint API and React HUD usage remain unchanged.
// ---------------------------------------------------------------------------

// ── Internal types ──────────────────────────────────────────────────────────

export type Unsubscribe = () => void;

type SwuiOutgoingMessage = {
  type: "navigation";
  tag: string;
  payload?: unknown;
};

type SwuiNativeMessage = {
  type: string;
  payload?: unknown;
  tag?: string;
  event?: string;
  id?: string;
  key?: string;
  active?: boolean;
  duration?: number;
  source?: 'js';
  [key: string]: unknown;
};
interface SwuiChromeWebview {
  postMessage: (message: unknown) => void;
}

interface SwuiCefQueryRequest {
  request: string;
  onSuccess?: (response: string) => void;
  onFailure?: (errorCode: number, errorMessage: string) => void;
}

export interface SwuiRuntimeData {
  fps: number;
  dt: number;
  time?: number;
  frameIndex?: number;
  stateVersion?: number;
  cefFps: number;
  width: number;
  height: number;
  timeDilation?: number;
  paused?: boolean;
}




interface SwuiRuntime {
  state:    Record<string, unknown>;
  _runtime?: SwuiRuntimeData;
  _notify?: (key: string, value: unknown) => void;
  _batch?: (batch: Record<string, unknown>, runtime?: SwuiRuntimeData) => void;
  updateState?: (batch: Record<string, unknown>) => void;
  emitToUnreal?: (message: SwuiOutgoingMessage) => void;
  postMessage?: (message: SwuiOutgoingMessage) => void;
}


interface SwuiWindowExtensions {
  __SWUI__?: SwuiRuntime;
  cefQuery?: (request: SwuiCefQueryRequest) => void;
  chrome?: {
    webview?: SwuiChromeWebview;
  };
}

declare global {
  interface Window {
    cefQuery?: (args: SwuiCefQueryRequest) => void;
    __SWUI__?: SwuiRuntime & { postMessage?: (message: string) => void };
    [key: string]: unknown;
  }
}

function shouldLogSwuiClientDebug(): boolean {
  try {
    const dev = (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process?.env?.NODE_ENV === 'development');
    const metaDev = (typeof (globalThis as any).importMeta !== 'undefined') ? (globalThis as any).importMeta?.env?.DEV : false;
    const winFlag = typeof window !== 'undefined' && (window as any).__SWUI_DEBUG_NAV__;
    return Boolean(dev || metaDev || winFlag);
  } catch {
    return Boolean(typeof window !== 'undefined' && (window as any).__SWUI_DEBUG_NAV__);
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({
      type: 'error',
      payload: { message: 'Failed to serialize SWUI native message' },
      source: 'js',
    });
  }
}

function sendSwuiUrlBridge(raw: string, tag: string, debug: boolean): void {
  const encoded = encodeURIComponent(raw);
  const url = `swui://bus?payload=${encoded}&t=${Date.now()}`;

  let iframe = document.getElementById('__swui_native_bridge_iframe') as HTMLIFrameElement | null;

  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = '__swui_native_bridge_iframe';
    iframe.style.display = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    document.documentElement.appendChild(iframe);
  }

  iframe.src = url;

  if ((window as any).__SWUI_DEBUG_NAV__) {
    showSwuiDebugOverlay(tag, 'urlBridge');
  }
}

function postMessage(message: SwuiNativeMessage): void {
  if (typeof window === 'undefined') return;

  const raw = safeStringify(message);
  const debug = shouldLogSwuiClientDebug();

  try {
    let transport = 'none';
    const msgTag = (message as any).tag || '';
    if (typeof window.cefQuery === 'function') {
      transport = 'cefQuery';
      if (debug) console.log('[SWUI CLIENT] postMessage transport=cefQuery', message);
      window.cefQuery({
        request: raw,
        onSuccess: () => { },
        onFailure: (code: number, err: string) => {
          if (debug) console.warn('[SWUI CLIENT] cefQuery failed', code, err, message);
        },
      });
      if ((window as any).__SWUI_DEBUG_NAV__ && message.type === 'navigation') {
        showSwuiDebugOverlay(msgTag, transport);
      }
      return;
    }

    if (typeof window.__SWUI__?.postMessage === 'function') {
      transport = '__SWUI__.postMessage';
      if (debug) console.log('[SWUI CLIENT] postMessage transport=__SWUI__.postMessage', message);
      try { (window.__SWUI__ as any).postMessage(raw); } catch (e) { if (debug) console.warn('[SWUI CLIENT] __SWUI__.postMessage failed', e); }
      if ((window as any).__SWUI_DEBUG_NAV__ && message.type === 'navigation') {
        showSwuiDebugOverlay(msgTag, transport);
      }
      return;
    }

    const webview = (window as any).chrome?.webview;
    if (webview && typeof webview.postMessage === 'function') {
      transport = 'chrome.webview.postMessage';
      if (debug) console.log('[SWUI CLIENT] postMessage transport=chrome.webview.postMessage', message);
      try { webview.postMessage(raw); } catch (e) { if (debug) console.warn('[SWUI CLIENT] chrome.webview.postMessage failed', e); }
      if ((window as any).__SWUI_DEBUG_NAV__ && message.type === 'navigation') {
        showSwuiDebugOverlay(msgTag, transport);
      }
      return;
    }

    if (debug) console.log('[SWUI CLIENT] postMessage transport=urlBridge', message);
    sendSwuiUrlBridge(raw, msgTag, debug);
  } catch (error) {
    console.error('[SWUI CLIENT] postMessage failed', error, message);
  }
}

// ── Subscriber map ──────────────────────────────────────────────────────────

const _subs: Record<string, Array<(v: unknown) => void>> = {};
const _batchSubs: Array<(batch: Record<string, unknown>) => void> = [];
const _tickSubs: Array<(runtime: SwuiRuntimeData) => void> = [];
let _patched = false;
let _warnedMissingOutboundBridge = false;
let _warnedOutboundSendFailure = false;

function _getWindow(): SwuiWindowExtensions {
  return window as unknown as SwuiWindowExtensions;
}

function _getRuntime(): SwuiRuntime | undefined {
  return _getWindow().__SWUI__;
}

function _warnMissingOutboundBridge(message: SwuiOutgoingMessage): void {
  if (_warnedMissingOutboundBridge) return;
  _warnedMissingOutboundBridge = true;
  console.warn("[SWUI] No outbound native bridge is available; dropped message.", message);
}

function _warnOutboundSendFailure(message: SwuiOutgoingMessage, error: unknown): void {
  if (_warnedOutboundSendFailure) return;
  _warnedOutboundSendFailure = true;
  console.warn("[SWUI] Failed to send outbound message to Unreal.", message, error);
}

function _notifyBatch(batch: Record<string, unknown>, runtime?: SwuiRuntimeData): void {
  const rt = _getRuntime();
  if (rt && batch) {
    for (const k in batch) {
      const v = batch[k];
      rt.state[k] = v;
      const listeners = _subs[k];
      if (listeners && listeners.length > 0) {
        for (let i = 0; i < listeners.length; ++i) {
          try {
            listeners[i](v);
          } catch (err) {
            console.error('[SWUI] Error in subscriber for', k, err);
          }
        }
      }
    }
    if (_batchSubs.length > 0) {
      for (let i = 0; i < _batchSubs.length; ++i) {
        try {
          _batchSubs[i](batch);
        } catch (err) {
          console.error('[SWUI] Error in batch subscriber', err);
        }
      }
    }
  }

  if (runtime) {
    if (rt) rt._runtime = runtime;
    if (typeof runtime.time === 'number') {
      updateClock(runtime.time, runtime.timeDilation ?? 1.0, runtime.paused ?? false);
    }
    if (_tickSubs.length > 0) {
      for (let i = 0; i < _tickSubs.length; ++i) {
        try {
          _tickSubs[i](runtime);
        } catch (err) {
          console.error('[SWUI] Error in tick subscriber', err);
        }
      }
    }
    window.dispatchEvent(new CustomEvent('swui:tick', { detail: runtime }));
  }
}


function _patch(): void {
  if (_patched) return;
  _patched = true;

  const rt  = (_getRuntime() as SwuiRuntime);
  const prev = rt._notify;

  rt._notify = (k: string, v: unknown) => {
    _subs[k]?.slice().forEach(fn => fn(v));
    prev?.(k, v);
  };

  rt._batch = (batch: Record<string, unknown>, runtime?: SwuiRuntimeData) => {
    _notifyBatch(batch, runtime);
  };

  rt.updateState = (batch: Record<string, unknown>) => {
    _notifyBatch(batch);
  };
}


function _whenReady(cb: () => void): void {
  if (_getRuntime()) { _patch(); cb(); return; }
  const t = setInterval(() => {
    if (_getRuntime()) { clearInterval(t); _patch(); cb(); }
  }, 50);
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Subscribe to a state key. Fires immediately if the value is already in the
 * snapshot (i.e. Unreal ticked before the page loaded). Returns `unsubscribe`.
 */
function on<T = unknown>(key: string, fn: (value: T) => void): Unsubscribe {
  (_subs[key] ??= []).push(fn as (v: unknown) => void);

  _whenReady(() => {
    const snap = _getRuntime()?.state?.[key];
    if (snap !== undefined) fn(snap as T);
  });

  return () => {
    _subs[key] = (_subs[key] ?? []).filter(f => f !== fn);
  };
}

/** One-shot read of a key from the current snapshot. */
function get<T = unknown>(key: string): T | undefined {
  return _getRuntime()?.state?.[key] as T | undefined;
}

/** Full state snapshot. */
function getAll(): Record<string, unknown> {
  return _getRuntime()?.state ?? {};
}

function emitNavigationEvent(tagName: string, payload: unknown = {}): void {
  if (shouldLogSwuiClientDebug()) console.log('[SWUI CLIENT] emitNavigationEvent tag=', tagName, 'payload=', payload);
  postMessage({ type: 'navigation', tag: tagName, payload, source: 'js' });
}

// ── Navigation types ────────────────────────────────────────────────────────

export type SwuiNavDirection =
  | "Up"
  | "Down"
  | "Left"
  | "Right"
  | "Next"
  | "Previous";

export interface SwuiNavigateEvent {
  direction: SwuiNavDirection;
}

export interface SwuiPointerMoveEvent {
  x: number;
  y: number;
}

export interface SwuiPointerButtonEvent {
  button: "Left" | "Right" | "Middle";
}

export interface SwuiWheelEvent {
  delta: number;
}

export interface SwuiKeyEvent {
  key: string;
}

export interface SwuiTextEvent {
  text: string;
}

// ── Navigation helpers (dot-separated event names) ──────────────────────────

/** Listen for a CustomEvent and return an unsubscribe function. */
function _listenEvent<T>(eventName: string, fn: (detail: T) => void): Unsubscribe {
  const handler = (e: Event) => fn((e as CustomEvent<T>).detail);
  window.addEventListener(eventName, handler);
  return () => window.removeEventListener(eventName, handler);
}

/** Subscribe to any dot-named navigation event by its full tag name. */
function onEvent<T = unknown>(tagName: string, fn: (detail: T) => void): Unsubscribe {
  return _listenEvent<T>(tagName, fn);
}

/** Subscribe to directional navigation. */
function onNavigate(fn: (event: SwuiNavigateEvent) => void): Unsubscribe {
  // Direction-specific tags all have {direction} in detail.
  // Listen to each direction tag individually.
  const unsubs = [
    _listenEvent<SwuiNavigateEvent>("swui.navigation.up", fn),
    _listenEvent<SwuiNavigateEvent>("swui.navigation.down", fn),
    _listenEvent<SwuiNavigateEvent>("swui.navigation.left", fn),
    _listenEvent<SwuiNavigateEvent>("swui.navigation.right", fn),
  ];
  return () => unsubs.forEach(u => u());
}

/** Subscribe to confirm action. */
function onConfirm(fn: (detail: unknown) => void): Unsubscribe {
  return _listenEvent("swui.navigation.confirm", fn);
}

/** Subscribe to cancel action. */
function onCancel(fn: (detail: unknown) => void): Unsubscribe {
  return _listenEvent("swui.navigation.cancel", fn);
}

/** Subscribe to next-tab action. */
function onNextTab(fn: (detail: unknown) => void): Unsubscribe {
  return _listenEvent("swui.navigation.nextTab", fn);
}

/** Subscribe to previous-tab action. */
function onPreviousTab(fn: (detail: unknown) => void): Unsubscribe {
  return _listenEvent("swui.navigation.previousTab", fn);
}

// ── Pointer helpers ─────────────────────────────────────────────────────────

function onPointerMove(fn: (event: SwuiPointerMoveEvent) => void): Unsubscribe {
  return _listenEvent<SwuiPointerMoveEvent>("swui.pointer.move", fn);
}

function onPointerPress(fn: (event: SwuiPointerButtonEvent) => void): Unsubscribe {
  const unsubs = [
    _listenEvent<SwuiPointerButtonEvent>("swui.pointer.leftDown", fn),
    _listenEvent<SwuiPointerButtonEvent>("swui.pointer.rightDown", fn),
    _listenEvent<SwuiPointerButtonEvent>("swui.pointer.middleDown", fn),
  ];
  return () => unsubs.forEach(u => u());
}

function onPointerRelease(fn: (event: SwuiPointerButtonEvent) => void): Unsubscribe {
  const unsubs = [
    _listenEvent<SwuiPointerButtonEvent>("swui.pointer.leftUp", fn),
    _listenEvent<SwuiPointerButtonEvent>("swui.pointer.rightUp", fn),
    _listenEvent<SwuiPointerButtonEvent>("swui.pointer.middleUp", fn),
  ];
  return () => unsubs.forEach(u => u());
}

function onPointerWheel(fn: (event: SwuiWheelEvent) => void): Unsubscribe {
  return _listenEvent<SwuiWheelEvent>("swui.pointer.wheel", fn);
}

// ── Keyboard helpers ────────────────────────────────────────────────────────

function onKeyDown(fn: (event: SwuiKeyEvent) => void): Unsubscribe {
  return _listenEvent<SwuiKeyEvent>("swui.keyboard.keyDown", fn);
}

function onKeyUp(fn: (event: SwuiKeyEvent) => void): Unsubscribe {
  return _listenEvent<SwuiKeyEvent>("swui.keyboard.keyUp", fn);
}

function onTextInput(fn: (event: SwuiTextEvent) => void): Unsubscribe {
  return _listenEvent<SwuiTextEvent>("swui.keyboard.textInput", fn);
}


/**
 * Subscribe to batched state changes in a single callback.
 */
function onBatch(fn: (batch: Record<string, unknown>) => void): Unsubscribe {
  _batchSubs.push(fn);
  _whenReady(() => {
    const snap = _getRuntime()?.state;
    if (snap && Object.keys(snap).length > 0) fn(snap);
  });
  return () => {
    const idx = _batchSubs.indexOf(fn);
    if (idx !== -1) _batchSubs.splice(idx, 1);
  };
}

/**
 * Subscribe to synchronized frame ticks from Unreal Engine.
 */
function onTick(fn: (runtime: SwuiRuntimeData) => void): Unsubscribe {
  _tickSubs.push(fn);
  _whenReady(() => {
    const r = _getRuntime()?._runtime;
    if (r) fn(r);
  });
  return () => {
    const idx = _tickSubs.indexOf(fn);
    if (idx !== -1) _tickSubs.splice(idx, 1);
  };
}

/**
 * Directly update state values locally or simulate game state.
 */
function updateState(batch: Record<string, unknown>): void {
  _notifyBatch(batch);
}

/**
 * Query Unreal Engine for read-only game state (e.g. IsTetherAttached, GetPlayerPing).
 * Returns a Promise that resolves with the parsed response.
 */
function query<T = unknown>(name: string, payload?: unknown): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const win = _getWindow();
    if (win.cefQuery) {
      win.cefQuery({
        request: JSON.stringify({ type: 'query', name, payload }),
        onSuccess: (response: string) => {
          try {
            resolve(JSON.parse(response));
          } catch {
            resolve(response as unknown as T);
          }
        },
        onFailure: (errorCode: number, errorMessage: string) => {
          reject(new Error(`[SWUI Query Error ${errorCode}] ${errorMessage}`));
        }
      });
    } else {
      reject(new Error('[SWUI] cefQuery bridge is not available in this environment'));
    }
  });
}

/** Linear interpolation helper */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Frame-rate independent exponential damping helper */
function damp(current: number, target: number, smoothing: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-smoothing * dt));
}

/** Simple 1D spring physics simulation helper */
function createSpring(config: { stiffness?: number; damping?: number; mass?: number; initialValue?: number } = {}) {
  const stiffness = config.stiffness ?? 180;
  const damping = config.damping ?? 12;
  const mass = config.mass ?? 1;
  let value = config.initialValue ?? 0;
  let velocity = 0;
  let target = value;

  return {
    get value() { return value; },
    get target() { return target; },
    set target(v: number) { target = v; },
    set(v: number) { value = v; velocity = 0; },
    step(dt: number) {
      const force = -stiffness * (value - target) - damping * velocity;
      const accel = force / mass;
      velocity += accel * dt;
      value += velocity * dt;
      return value;
    }
  };
}

// ── Clock & Time Synchronization (SWUI 1.5 Phase 2) ─────────────────────────

export interface SwuiClockSnapshot {
  gameTime: number;
  timeDilation: number;
  paused: boolean;
  receivedLocalTime: number;
}

let _currentClock: SwuiClockSnapshot = {
  gameTime: 0,
  timeDilation: 1.0,
  paused: false,
  receivedLocalTime: typeof performance !== 'undefined' ? performance.now() : Date.now(),
};

export function updateClock(gameTime: number, timeDilation: number = 1.0, paused: boolean = false): void {
  _currentClock = {
    gameTime,
    timeDilation: timeDilation > 0 ? timeDilation : 1.0,
    paused,
    receivedLocalTime: typeof performance !== 'undefined' ? performance.now() : Date.now(),
  };
}

export function gameTimeNow(): number {
  if (_currentClock.paused) {
    return _currentClock.gameTime;
  }
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const elapsedSeconds = (now - _currentClock.receivedLocalTime) / 1000.0;
  return _currentClock.gameTime + (elapsedSeconds * _currentClock.timeDilation);
}

// ── Timeline Synchronization (SWUI 1.5 Phase 2) ─────────────────────────────

export type SwuiTimelineState = 'idle' | 'running' | 'completed' | 'cancelled';

export interface SwuiTimelineData {
  id: string;
  generation: number;
  startGameTime: number;
  duration: number;
  reversed: boolean;
  state: SwuiTimelineState;
  cancelGameTime?: number;
  cancelProgress?: number;
  completeGameTime?: number;
}

const _timelines = new Map<string, SwuiTimelineData>();
const _timelineCompleteSubs = new Map<string, Array<(generation: number) => void>>();
const _timelineCancelSubs = new Map<string, Array<(generation: number, progress: number) => void>>();
const _timelineProgressSubs = new Map<string, Array<(progress: number, state: SwuiTimelineState) => void>>();

export function getTimeline(id: string): SwuiTimelineData | undefined {
  return _timelines.get(id);
}

export function getTimelineState(id: string): SwuiTimelineState {
  return _timelines.get(id)?.state ?? 'idle';
}

export function getTimelineGeneration(id: string): number {
  return _timelines.get(id)?.generation ?? 0;
}

/**
 * Evaluates the timeline progress.
 * Invariant: Running state strictly bounds progress to [0, 1.0) via PredictedEnd.
 * Only Completed state evaluates to exactly 1.0.
 */
export function getTimelineProgress(id: string): number {
  const tl = _timelines.get(id);
  if (!tl) return 0;
  if (tl.state === 'completed') return 1.0;
  if (tl.state === 'cancelled') return tl.cancelProgress ?? 0;
  if (tl.state === 'running') {
    if (tl.duration <= 0) return 0.99999;
    const now = gameTimeNow();
    const elapsed = now - tl.startGameTime;
    const raw = elapsed / tl.duration;
    // Bounded strictly to [0, 0.99999] during running to guarantee PredictedEnd invariant
    const clamped = Math.max(0, Math.min(0.99999, raw));
    return tl.reversed ? (1.0 - clamped) : clamped;
  }
  return 0;
}

function _onNativeTimelineStart(event: { id: string; generation: number; startGameTime: number; duration: number; reversed?: boolean }) {
  const existing = _timelines.get(event.id);
  if (existing && existing.generation > event.generation) {
    return; // Ignore stale generation start
  }
  const tl: SwuiTimelineData = {
    id: event.id,
    generation: event.generation,
    startGameTime: event.startGameTime,
    duration: event.duration,
    reversed: Boolean(event.reversed),
    state: 'running',
  };
  _timelines.set(event.id, tl);
  _ensureTimelineRaf();
}

function _onNativeTimelineComplete(event: { id: string; generation: number; completeGameTime: number }) {
  const tl = _timelines.get(event.id);
  if (!tl || tl.generation !== event.generation) {
    return; // Ignore stale generation completion
  }
  tl.state = 'completed';
  tl.completeGameTime = event.completeGameTime;

  const listeners = _timelineCompleteSubs.get(event.id);
  if (listeners) {
    for (const fn of listeners) {
      try { fn(event.generation); } catch (e) { console.error('[SWUI Timeline] onComplete error', e); }
    }
  }
}

function _onNativeTimelineCancel(event: { id: string; generation: number; cancelGameTime: number; cancelProgress?: number }) {
  const tl = _timelines.get(event.id);
  if (!tl || tl.generation !== event.generation) {
    return; // Ignore stale generation cancellation
  }
  tl.state = 'cancelled';
  tl.cancelGameTime = event.cancelGameTime;
  if (event.cancelProgress !== undefined) {
    tl.cancelProgress = event.cancelProgress;
  } else {
    const elapsed = event.cancelGameTime - tl.startGameTime;
    tl.cancelProgress = tl.duration > 0 ? Math.max(0, Math.min(1.0, elapsed / tl.duration)) : 0;
  }

  const listeners = _timelineCancelSubs.get(event.id);
  if (listeners) {
    for (const fn of listeners) {
      try { fn(event.generation, tl.cancelProgress); } catch (e) { console.error('[SWUI Timeline] onCancel error', e); }
    }
  }
}

let _timelineRafId: number | null = null;
function _ensureTimelineRaf() {
  if (_timelineRafId !== null) return;
  const loop = () => {
    let hasRunning = false;
    for (const [id, tl] of _timelines) {
      if (tl.state === 'running') {
        hasRunning = true;
        const prog = getTimelineProgress(id);
        const subs = _timelineProgressSubs.get(id);
        if (subs) {
          for (const fn of subs) {
            try { fn(prog, tl.state); } catch (e) { console.error('[SWUI Timeline] onProgress error', e); }
          }
        }
      }
    }
    if (hasRunning && typeof requestAnimationFrame !== 'undefined') {
      _timelineRafId = requestAnimationFrame(loop);
    } else {
      _timelineRafId = null;
    }
  };
  if (typeof requestAnimationFrame !== 'undefined') {
    _timelineRafId = requestAnimationFrame(loop);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('swui:timelineStart', (e: Event) => _onNativeTimelineStart((e as CustomEvent).detail));
  window.addEventListener('swui:timelineComplete', (e: Event) => _onNativeTimelineComplete((e as CustomEvent).detail));
  window.addEventListener('swui:timelineCancel', (e: Event) => _onNativeTimelineCancel((e as CustomEvent).detail));
}

export const timeline = {
  start(id: string, duration: number, reversed: boolean = false): void {
    _onNativeTimelineStart({
      id,
      generation: (_timelines.get(id)?.generation ?? 0) + 1,
      startGameTime: gameTimeNow(),
      duration,
      reversed,
    });
  },
  progress: getTimelineProgress,
  getState: getTimelineState,
  getGeneration: getTimelineGeneration,
  onComplete(id: string, callback: (generation: number) => void): Unsubscribe {
    let list = _timelineCompleteSubs.get(id);
    if (!list) { list = []; _timelineCompleteSubs.set(id, list); }
    list.push(callback);
    return () => {
      const arr = _timelineCompleteSubs.get(id);
      if (arr) _timelineCompleteSubs.set(id, arr.filter(f => f !== callback));
    };
  },
  onCancel(id: string, callback: (generation: number, progress: number) => void): Unsubscribe {
    let list = _timelineCancelSubs.get(id);
    if (!list) { list = []; _timelineCancelSubs.set(id, list); }
    list.push(callback);
    return () => {
      const arr = _timelineCancelSubs.get(id);
      if (arr) _timelineCancelSubs.set(id, arr.filter(f => f !== callback));
    };
  },
  onProgress(id: string, callback: (progress: number, state: SwuiTimelineState) => void): Unsubscribe {
    let list = _timelineProgressSubs.get(id);
    if (!list) { list = []; _timelineProgressSubs.set(id, list); }
    list.push(callback);
    _ensureTimelineRaf();
    return () => {
      const arr = _timelineProgressSubs.get(id);
      if (arr) _timelineProgressSubs.set(id, arr.filter(f => f !== callback));
    };
  },
};

// ── Activity & Animation Hints (Phase 13) ──────────────────────────────────

function setActivity(key: string, active: boolean): void {
  postMessage({
    type: 'swui:activity',
    key,
    active,
  });
}

const animation = {
  begin(id: string = 'generic'): void {
    postMessage({
      type: 'swui:animation',
      key: id,
      active: true,
    });
  },
  end(id: string = 'generic'): void {
    postMessage({
      type: 'swui:animation',
      key: id,
      active: false,
    });
  },
};

// ── Client-Side State Interpolation (Phase 17) ─────────────────────────────

export interface InterpolationOptions {
  speed?: number;         // Smooth lerp factor per frame (default: 0.15)
  snapThreshold?: number; // Distance below which it snaps to target (default: 0.001)
}

function interpolate(
  key: string,
  callback: (currentValue: number) => void,
  options?: InterpolationOptions
): Unsubscribe {
  const speed = options?.speed ?? 0.15;
  const snapThreshold = options?.snapThreshold ?? 0.001;

  let current = typeof get(key) === 'number' ? (get(key) as number) : 0;
  let target = current;
  let rafId: number | null = null;
  let active = false;

  const step = () => {
    const diff = target - current;
    if (Math.abs(diff) <= snapThreshold) {
      current = target;
      callback(current);
      active = false;
      rafId = null;
      return;
    }

    current += diff * speed;
    callback(current);
    rafId = requestAnimationFrame(step);
  };

  const unsub = on(key, (val) => {
    if (typeof val === 'number') {
      target = val;
      if (!active) {
        active = true;
        rafId = requestAnimationFrame(step);
      }
    }
  });

  // Initial callback
  callback(current);

  return () => {
    unsub();
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    active = false;
  };
}

// ── Long Task Detection (Phase 13) ──────────────────────────────────────────
let _lastLongTaskPostTime = 0;

if (typeof window !== 'undefined' && typeof PerformanceObserver !== 'undefined') {
  // Guard long task observer so shipping builds or embedded contexts can disable it
  const isEnabled = (window as unknown as { __SWUI_ENABLE_LONGTASK_MONITOR__?: boolean }).__SWUI_ENABLE_LONGTASK_MONITOR__ !== false;
  if (isEnabled) {
    try {
      const _longTaskObserver = new PerformanceObserver((list) => {
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        // Rate-limit reports across the IPC bridge to prevent spamming the Unreal game thread
        if (now - _lastLongTaskPostTime < 250) {
          return;
        }

        for (const entry of list.getEntries()) {
          if (entry.duration > 16) {
            _lastLongTaskPostTime = now;
            postMessage({
              type: 'swui:longtask',
              duration: entry.duration,
            });
            break;
          }
        }
      });
      _longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch {
      // Unsupported or restricted environment, ignore safely
    }
  }
}

// ── Export ──────────────────────────────────────────────────────────────────

const Swui = {
  // State & Sync
  on, onBatch, onTick, get, getAll, updateState, query,
  // Client-Side Interpolation (Phase 17)
  interpolate,
  // Time & Clock (Phase 2)
  gameTimeNow, updateClock,
  // Timeline (Phase 2)
  timeline,
  // Activity & Animation hints (Phase 13)
  setActivity,
  animation,
  // Animation math helpers
  lerp, damp, createSpring,
  // Navigation — subscribe
  onEvent, onNavigate, onConfirm, onCancel, onNextTab, onPreviousTab,
  postMessage,
  emitNavigationEvent,
  // Pointer
  onPointerMove, onPointerPress, onPointerRelease, onPointerWheel,
  // Keyboard
  onKeyDown, onKeyUp, onTextInput,
};

export { SwuiHoldProgress } from './SwuiHoldProgress';
export default Swui;
export { postMessage, emitNavigationEvent, onBatch, onTick, updateState, query, lerp, damp, createSpring, setActivity, animation, interpolate };




