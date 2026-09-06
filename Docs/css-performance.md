# SWUI — CSS & Web Performance Engineering Guide

> **The Most Important Design Rule:**  
> **"Never sacrifice the game's frame for the UI's frame."**  
> If Chromium/CEF requires 25ms to calculate layout or rasterize an intensive visual effect, SWUI must degrade the browser's presentation rate and drop intermediate UI frames while Unreal Engine's gameplay and rendering threads remain completely smooth at 60 / 120 FPS (< 0.5ms typical game-thread overhead).

---

## 1. Architectural Foundation & Decoupling

In traditional web-in-game integrations, calling browser message pumps or texture updates synchronously on the main thread turns the browser engine into a parasitic second game loop. Heavy web workloads directly hitch the game.

SWUI eliminates this by decoupling Chromium from the Unreal game loop:

```
                  UNREAL GAME THREAD (60 / 120 Hz)
                                 │
                     ┌───────────┴───────────┐
                     │                       │
               Gameplay Logic          Input / Slate
                     │                       │
                     └───────────┬───────────┘
                                 │  (< 0.5ms budgeted pump)
                                 ▼
                     ┌───────────────────────┐
                     │  SWUI Message Router  │
                     └───────────┬───────────┘
                                 │
                  CEF WINDOWLESS RENDER PIPELINE
                                 │
                     ┌───────────┴───────────┐
                     │                       │
                JS / DOM Work           CSS / GPU
                     │                       │
                     └───────────┬───────────┘
                                 │
                   BOUNDED TRIPLE-FRAME BUFFER
             [Displayed]  ◄──  [Pending]  ◄──  [Rendering]
                                 │
                    (Latest-Frame Policy: stale
                     unconsumed frames discarded)
                                 │
                                 ▼
                    DIRECT GPU SHARED TEXTURE
                   (D3D11 / D3D12 Cross-API)
                                 │
                                 ▼
                        SLATE / UNREAL RHI
```

### Key Decoupling Guarantees
1. **Time-Budgeted CEF Pump (`swui.CefMessageLoopBudgetMs`, default 1.5ms):** CEF message processing will not stall the Unreal game thread even if heavy scripts or repaints are running.
2. **Bounded Triple Buffering & Latest-Frame Discard:** Chromium writes to the background staging buffer. The game thread atomically grabs the newest completed frame. If Chromium takes 30ms on a frame, Unreal keeps displaying the previous frame without waiting. If Chromium produces multiple frames before Unreal presents, stale intermediate frames are discarded immediately.
3. **Hardware-Resilient Dual-Backend Rendering:** On DirectX 11 RHI, direct DXGI shared textures stream Chromium GPU surfaces natively to Unreal RHI textures. On DirectX 12 RHI (Unreal Engine 5.7 default), SWUI automatically and safely routes through the optimized thread-safe CPU renderer (`RHIUpdateTexture2D`), completely eliminating cross-API GPU memory management (MMU) page faults and driver hangs (`DXGI_ERROR_DEVICE_HUNG`) while sustaining smooth 60–120 FPS.

---

## 2. CSS Property Performance Tiers

Every CSS property you animate falls into one of three distinct engine cost tiers in Chromium windowless rendering:

| Tier | Compositor Impact | Visual Cost | Recommended Usage |
|---|---|---|---|
| **Tier A (Green)** | Zero Reflow, GPU Compositor Only | Minimal (< 0.1ms) | Continuous animations, health bars, radar sweeps, pop-up dialogs, HUD reticles. |
| **Tier B (Yellow)** | Paint Only (Dirty Region Rasterized) | Moderate (0.5 – 2.0ms) | Hover states, color shifts, focus rings, occasional UI highlights. |
| **Tier C (Red)** | Layout Reflow / Full Surface Filter | Severe (> 10 – 30ms) | **FORBIDDEN** during live gameplay. Pre-bake or replace with Unreal native materials. |

### Tier A: Zero-Reflow / Hardware-Accelerated (Compositor-Only)
These properties do **not** trigger layout recalculation or CPU rasterization. They run directly on the GPU compositor thread:
- `transform: translate3d(x, y, z)`
- `transform: scale(x, y)`
- `transform: rotate(deg)`
- `opacity`

#### Best Practice: Animating Progress & Health Bars
```css
/* ❌ AVOID: Triggers full DOM layout reflow on every tick */
.bad-health-bar-fill {
    width: 65%;
    transition: width 0.15s ease-out;
}

/* ✅ RECOMMENDED: Zero reflow, pure GPU matrix transform */
.good-health-bar-fill {
    width: 100%;
    transform-origin: left center;
    transform: scaleX(0.65);
    will-change: transform;
    transition: transform 0.15s ease-out;
}
```

---

### Tier B: Repaint-Triggering Properties
These properties do not alter geometry, but require Chromium's rasterizer to redraw the dirty bounding box:
- `background-color`
- `color`
- `border-color`
- `box-shadow` (small radii)

While acceptable for discrete interactive states (e.g. mouse hover or button press), **avoid continuously animating Tier B properties with CSS `@keyframes`**.

---

### Tier C: Layout Reflows & High-Cost Filters (CRITICAL HAZARDS)

> [!WARNING]
> **Never animate Tier C properties at 60 Hz.**
> Animating layout properties (`width`, `height`, `margin`, `top`, `flex`) causes Chromium to recalculate the bounding box and text layout of ancestor and child DOM nodes.

#### The `backdrop-filter: blur()` Anti-Pattern
`backdrop-filter: blur(...)` is notoriously expensive in offscreen/windowless CEF. It forces Chromium to allocate offscreen surfaces, copy backbuffers, and run multi-pass Gaussian blur shaders on every frame.

```css
/* ❌ DO NOT USE IN WEBPAGE: Kills windowless rendering performance */
.bad-modal-backdrop {
    backdrop-filter: blur(12px);
    background: rgba(10, 15, 25, 0.5);
}

/* ✅ RECOMMENDED ALTERNATIVES:
   1. Use a pre-tinted semi-transparent dark background in CSS: */
.good-modal-backdrop {
    background: rgba(10, 15, 25, 0.85);
}
/* 2. Or enable Unreal's Slate BackgroundBlur widget or a PostProcess blur material 
   directly behind your USwuiView in UMG! */
```

---

## 3. DOM Layout Containment & Isolation

By default, an element's layout changes can invalidate the entire document layout tree. CSS containment restricts the scope of the browser's layout and paint work.

### Recommended CSS Containment Rules

Apply `contain` to modular HUD elements, inventory slots, chat windows, and cards:

```css
/* Independent HUD Card / Panel */
.swui-hud-panel {
    contain: layout paint;
    position: absolute;
}

/* Strict isolation for virtualized lists & inventory grids */
.swui-inventory-grid {
    contain: strict; /* Equivalent to: contain: size layout paint; */
    overflow: hidden;
}

/* Modern DOM off-screen rendering optimization */
.swui-offscreen-tab {
    content-visibility: auto;
}
```

### Element Budgets
- **DOM Node Count:** Keep total DOM elements under **800 nodes** per SWUI view (target < 400 nodes for HUDs).
- **Pruning vs Hiding:** Remove stale elements from the DOM or set `content-visibility: hidden` rather than stacking hundreds of invisible `display: none` or zero-opacity items.
- **`will-change` Policy:** Use `will-change: transform, opacity;` sparingly (only on continuously animated elements). Declaring `will-change` on every element exhausts GPU texture memory and slows down compositor layer tree updates.

---

## 4. State Synchronization & Update Policies

SWUI synchronizes Unreal Engine `UPROPERTY` values to the browser via `SwuiSubsystem`. Pumping high-frequency data without consideration wastes serialization and IPC bandwidth.

### Update Policies (`ESwuiStateUpdatePolicy`)

Configure policies in C++ or Project Settings:

```cpp
// UPROPERTY reflection policy configuration:
ESwuiStateUpdatePolicy::OnChange;    // (Default) Only sends when value diffs. Best for 90% of state.
ESwuiStateUpdatePolicy::EventDriven; // Only dispatched on explicit delegate/event trigger.
ESwuiStateUpdatePolicy::Fixed30Hz;   // Throttled to 30 FPS. Ideal for health, ammo, shields.
ESwuiStateUpdatePolicy::Fixed15Hz;   // Throttled to 15 FPS. Ideal for minimap icons, scores, timers.
ESwuiStateUpdatePolicy::EveryFrame;  // Dispatched every tick. AVOID unless doing custom manual lerp.
```

### State Priority Levels (`ESwuiUpdatePriority`)

When the bridge experiences backpressure or low framerate, high-priority state takes precedence:
1. `Critical`: Vital gameplay feedback (damage events, game-over trigger).
2. `High`: Health, player shields, equipped weapon ammo.
3. `Normal`: Score, inventory items, objective markers.
4. `Low`: Leaderboard standings, chat logs, ping stats.
5. `Background`: Version string, player profile metadata.

### Client-Side Interpolation (Anti-Pattern: 120Hz Raw Floats)
Instead of sending player velocity or health at 120 Hz across the JSON bridge, send the target value at 30/60 Hz and interpolate smoothly in the browser:

```typescript
// Client-side smooth interpolation hook (SwuiClientLib)
function useInterpolatedValue(targetValue: number, speed: number = 0.15) {
    const [current, setCurrent] = useState(targetValue);
    
    useEffect(() => {
        let animId: number;
        const tick = () => {
            setCurrent(prev => {
                const diff = targetValue - prev;
                if (Math.abs(diff) < 0.001) return targetValue;
                return prev + diff * speed;
            });
            animId = requestAnimationFrame(tick);
        };
        animId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animId);
    }, [targetValue, speed]);
    
    return current;
}
```

---

## 5. TypeScript Client Activity Hints & LongTask Detection

The SWUI client library (`SwuiClientLib`) interacts directly with the C++ `USwuiScheduler`. When the UI has no active user interaction or ongoing animations, SWUI puts the view into **Sleep (0 Hz)** to consume zero CPU/GPU cycles.

### Activity Hints API

Inform Unreal when an animation or interactive mode begins so the view stays at high frame rates:

```typescript
import { Swui } from '@achirastudio/swui';

// 1. Tagging active animations:
function openMenu() {
    Swui.animation.begin('menu_transition');
    
    // Perform CSS animation...
    setTimeout(() => {
        Swui.animation.end('menu_transition');
    }, 300);
}

// 2. Generic activity markers (e.g. video playback, particle canvas):
Swui.setActivity('hud_radar_active', true);
// When finished:
Swui.setActivity('hud_radar_active', false);
```

### Automatic Long-Task Detection
`SwuiClientLib` automatically configures a browser `PerformanceObserver` targeting `'longtask'` entries (> 16ms). Any script or layout blocking the browser main thread sends an automatic telemetry warning to Unreal:

```
LogSwuiRuntime: Warning: [SWUI Client LongTask] Detected browser thread stall: duration=28.4ms (Task name: self)
```

---

## 6. In-Engine Diagnostics & Profiling Workflow

SWUI provides a suite of console commands and a HUD profiler to isolate performance bottlenecks in seconds.

### Console Commands

| Console Command | Purpose |
|---|---|
| `swui.profiler 1` | Toggles the real-time Slate HUD overlay in the top-right viewport. |
| `swui.profiler 0` | Disables the HUD overlay with zero overhead. |
| `swui.stats` | Prints a single-line summary of current FPS, scopes, and dropped frames to the log. |
| `swui.stats.verbose` | Dumps a comprehensive snapshot with P50, P95, and P99 percentiles for all engine scopes. |
| `swui.profile.start` | Starts recording a time-stamped performance profiling session. |
| `swui.profile.stop` | Stops the active profiling session. |
| `swui.profile.save` | Generates and saves a detailed text capture report to `Saved/Profiling/SwuiReport_<date>.txt`. |
| `swui.benchmark [N]` | **Automated SLA Benchmark Suite.** Runs an N-frame test (default: 300 frames) and validates your UI against production SLA thresholds, outputting a PASS/FAIL scorecard. |

---

### Understanding the Profiler Overlay

When `swui.profiler 1` is enabled, the Slate HUD displays:

```
┌───────────────────────────────────────────────────────────┐
│ SWUI RUNTIME PROFILER         GPU (Direct Shared Texture) │
├───────────────────────────────────────────────────────────┤
│ Unreal: 120.0 FPS  |  SWUI Target:  60 Hz  |  Pres: 59.8 FPS│
│ Dropped Frames: 0  |  Skipped Requests: 0  |  Browsers:  1│
├───────────────────────────────────────────────────────────┤
│ Game-Thread SWUI:   0.14 ms  [P95:  0.28, Max:  0.51]     │
│ CEF Message Loop:   0.38 ms  [P95:  0.72, Max:  1.20]     │
│ State Sync & Diff:  0.04 ms                               │
│ JS Event Dispatch:  0.02 ms                               │
│ CEF Paint Callback: 0.85 ms                               │
│ CPU Staging Memcpy: 0.00 ms  (0 on Direct GPU path)       │
│ GPU Upload / Blit:  0.11 ms                               │
│ Paint->Pres Latency:7.20 ms  [P95: 12.40, Max: 16.50]     │
├───────────────────────────────────────────────────────────┤
│ Dirty Surface:      0 / 2073600 px (0.0% dirty)           │
│ Traffic: Updates=30/s | Input=60/s (Coalesced=45/s)       │
└───────────────────────────────────────────────────────────┘
```

---

### Step-by-Step Diagnostic Flow: "The UI Feels Stuttery"

Follow this diagnostic checklist to find the root cause:

```
[Diagnostic Step]                                [Probable Cause & Solution]
1. Run `swui.stats`                              
   └─ Is Unreal FPS dropping alongside UI?       -> Game thread issue or unbounded CEF pump.
   └─ Is Unreal FPS high, but UI FPS dropping?   -> Expected graceful degradation! The game is protected.

2. Check `Game-Thread SWUI`
   └─ Is it > 0.50 ms?                           -> Check `swui.CefMessageLoopBudgetMs` or state batch size.

3. Check `CPU Staging Memcpy`
   └─ Is it > 0.00 ms?                           -> View is running in CPU fallback. Ensure D3D11/D3D12 GPU 
                                                    acceleration is enabled in Project Settings.

4. Check `Dirty Surface %`
   └─ Is it repainting > 80% every frame?        -> Check for Tier C CSS (`backdrop-filter`, full-screen 
                                                    particle canvas, or non-contained CSS animations).

5. Run `swui.benchmark 300`
   └─ Review the automated scorecard in `Saved/Profiling/SwuiBenchmark_<timestamp>.txt`.
```
