# SWUI 3.0: Systems & Runtime Architecture

This document provides a deep-dive reference for engineers, technical artists, and architects working with **SWUI 3.0**. It covers the internal mechanics of the multi-document engine, rendering pipelines, frame pacing, state synchronization, input forwarding, and memory management.

---

## 1. High-Level Architectural Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                          WEB APPLICATION TIER                          │
│                                                                        │
│   Document A (HUD)       Document B (Inventory)    Document C (Chat)   │
│   (HTML/CSS/React)         (Vue / Tailwind)           (Vanilla JS)     │
└───────────────┬──────────────────────┬──────────────────────┬──────────┘
                │                      │                      │
                ▼                      ▼                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        CEF / CHROMIUM PROCESSES                        │
│                                                                        │
│   Chromium Renderer A    Chromium Renderer B    Chromium Renderer C    │
│   (V8 JS Engine, DOM,    (V8 JS Engine, DOM,    (V8 JS Engine, DOM,    │
│    Blink Layout)          Blink Layout)          Blink Layout)         │
└───────────────┬──────────────────────┬──────────────────────┬──────────┘
                │ IPC (Shared Memory / GPU Direct Handles)    │
                ▼                      ▼                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          UNREAL ENGINE RUNTIME                         │
│                                                                        │
│                    USwuiDocumentManagerSubsystem                       │
│    ┌──────────────────────────────────────────────────────────────┐    │
│    │  • Central Tick & Bounded CEF Message Loop Work              │    │
│    │  • Atomic State Batch Flushing (_batch IPC)                  │    │
│    │  • Multi-Document Z-Order Hit-Testing & Input Routing        │    │
│    │  • Document Registry & Level Persistence Manager             │    │
│    └──────────────────────────────────────────────────────────────┘    │
│                                │                                       │
│          ┌─────────────────────┴─────────────────────┐                 │
│          ▼                                           ▼                 │
│     USwuiDocument A                             USwuiDocument B        │
│     ├─ USwuiView (Browser Host)                 ├─ USwuiView           │
│     ├─ FSwuiScheduler                           ├─ FSwuiScheduler      │
│     └─ UUserWidget (Slate Surface)              └─ UUserWidget         │
│                                                                        │
│                     FSwuiInputPreprocessor                             │
│                     (Global Slate Input Pump)                          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Rendering Pipelines: GPU Zero-Copy vs CPU Fallback

SWUI automatically negotiates the optimal rendering pipeline on initialization based on platform capabilities and driver support.

### 2.1 GPU Accelerated Direct3D 11 / DXGI Shared Textures (Primary)
On Windows platforms supporting Direct3D 11:
1. CEF renders directly to an off-screen DirectX surface.
2. Chromium allocates a shared NT handle for the texture (`HANDLE SharedHandle`).
3. `FSwuiGpuSharedTextureHelper` opens the shared handle on Unreal's RHI device (`ID3D11Device::OpenSharedResource`).
4. On every paint callback (`OnAcceleratedPaint`), Unreal copies or samples the shared texture directly in GPU memory using RHI command lists (`CopySharedTexture`).
5. **Zero CPU staging**: Frame pixels never touch system RAM or CPU caches, providing steady 60–120 FPS UI with near-zero CPU overhead.

### 2.2 CPU Full-Surface Renderer (Fallback & Cross-Platform)
If GPU shared handles are unavailable or CPU mode is forced (`CVarSwuiForceCpuRenderer = 1`):
1. Chromium writes pixel bytes into an off-screen memory buffer in BGRA8 format.
2. `FSwuiFullSurfaceCpuRenderer` stages the buffer across a double-buffered thread pool.
3. On the game thread tick (`TickDeferredUpload`), dirty regions are uploaded to Unreal's `UTexture2D` via `RHIUpdateTexture2D`.

---

## 3. Frame Pacing & compositing

Web browsers naturally want to render as fast as possible or match display refresh rates. To prevent Chromium from contending with Unreal's render thread, SWUI provides three frame-pacing mechanisms:

### 3.1 External Begin Frames (`bUseExternalBeginFrames = true`)
Instead of allowing Chromium to run its own unconstrained timer loop, Unreal controls Chromium's compositor:
- On every engine tick, `USwuiView::SendExternalBeginFrameIfDue(DeltaTime)` invokes `CefBrowserHost::SendExternalBeginFrame()`.
- Chromium executes layout and produces exactly one frame synchronized with Unreal's frame clock.
- Compositor dirty tracking is preserved, eliminating redundant repaints.

### 3.2 HUD ROI (Region of Interest) Partial Blitting
For HUDs where 90% of the screen is transparent and only small corner widgets update (e.g. minimap, health bar):
- Developers define rectangular Regions of Interest (`FSwuiHudRoiSettings`).
- `USwuiView` only uploads and blits pixels within active ROI boxes, skipping the upload of millions of unchanged pixels every frame.

### 3.3 True Chromium Sleep (`WasHidden`)
When a document is deactivated or minimized (e.g. Pause Menu closed):
- `USwuiView::SleepUI()` calls `CefBrowserHost::WasHidden(true)`.
- Chromium's renderer engine suspends `requestAnimationFrame`, pauses JavaScript timers (`setTimeout`/`setInterval`), and disables compositing.
- When reopened, `WakeUI()` calls `WasHidden(false)` and `Invalidate(PET_VIEW)` to restore execution instantly.

---

## 4. The Global State Bus & Atomic State Batching

Synchronizing gameplay data to JavaScript can easily become a bottleneck if hundreds of `ExecuteJavaScript` calls are issued every frame.

### 4.1 The Problem with Naive IPC
```
Unreal: SetHealth(80) ──► ExecuteJavaScript("state.health = 80") ──► V8 parse/eval ──► DOM re-render
Unreal: SetAmmo(25)   ──► ExecuteJavaScript("state.ammo = 25")   ──► V8 parse/eval ──► DOM re-render
Unreal: SetShield(50) ──► ExecuteJavaScript("state.shield = 50") ──► V8 parse/eval ──► DOM re-render
Result: 3 separate IPC round-trips, 3 V8 microtask queues, layout thrashing.
```

### 4.2 SWUI 3.0 Atomic Frame Batching
In SWUI 3.0:
1. When gameplay code calls `SetState(Key, Value)` during a frame, values are recorded into `GlobalStateSnapshot` and buffered in `PendingDirtyState`.
2. At the start of `USwuiDocumentManagerSubsystem::Tick(DeltaTime)` (before visual frames are rendered), `FlushStateBatch()` aggregates all dirty properties into a **single JSON payload**:
   ```json
   { "PlayerHealth": 80, "Ammo": 25, "Shield": 50 }
   ```
3. A single atomic invocation evaluates in V8:
   ```javascript
   (function(){
     var s = window.__SWUI__ = window.__SWUI__ || {};
     var u = { "PlayerHealth": 80, "Ammo": 25, "Shield": 50 };
     if (s._batch) {
       s._batch(u);
     } else {
       for (var k in u) {
         s.state[k] = u[k];
         document.dispatchEvent(new CustomEvent('swui:stateChange', { detail: { key: k, value: u[k] } }));
       }
     }
   })();
   ```
4. **Benefits**:
   - 20+ state updates collapse into 1 IPC call per document.
   - All state updates apply in the same JavaScript microtask.
   - Frontend frameworks (React 18, Vue 3, Svelte) batch DOM updates into a single render cycle without visual tearing.

---

## 5. Multi-Document Input Routing & Hit-Testing

Handling input across multiple overlapping web documents requires deterministic layer routing.

### 5.1 Mouse & Pointer Routing
The engine registers `FSwuiInputPreprocessor` into Slate's global input pipeline (`FSlateApplication::RegisterInputPreProcessor`):
1. On mouse move, click, or wheel, the preprocessor queries:
   `USwuiDocumentManagerSubsystem::GetTopInteractiveViewAt(ScreenPosition)`
2. The subsystem iterates all active documents sorted in descending `ZOrder`.
3. For each document, it performs a hit-test via `USwuiView::ScreenToBrowserPixel`.
4. The highest Z-Order document that contains the cursor receives the pointer event via `CefBrowserHost::SendMouseMoveEvent` or `SendMouseClickEvent`.
5. If no document is hit, input falls through to Unreal gameplay.

### 5.2 Keyboard & IME Routing
HTML `<input>`, `<textarea>`, and searchable widgets require keyboard characters:
1. When an HTML input receives focus, the document notifies Unreal via `swui:focusInput`.
2. `USwuiDocumentManagerSubsystem::GetFocusedOrTopInteractiveView()` prioritizes whichever document currently holds text focus.
3. For printable keys, `FSwuiInputPreprocessor` uses Win32 `ToUnicode` to map virtual key codes and active modifier keys (Shift, Caps Lock, AltGr) into actual Unicode characters, dispatching both `KEYEVENT_RAWKEYDOWN` and `KEYEVENT_CHAR` to CEF.

---

## 6. Deterministic Lifecycle & Memory Management

Managing multiple embedded Chromium browser instances requires strict resource discipline.

### 6.1 Deterministic Destruction (`USwuiView::Shutdown`)
In previous versions, browser destruction relied on non-deterministic Unreal Garbage Collection (`BeginDestroy`), causing CEF instances to linger in memory for multiple frames after a document was closed.

In SWUI 3.0:
- Calling `USwuiDocument::Unload()` immediately invokes `USwuiView::Shutdown()`.
- `Shutdown()`:
  - Shuts down and resets `FSwuiGpuSharedTextureHelper`, closing DirectX shared NT handles.
  - Calls `CefBrowserHost::CloseBrowser(true)` synchronously.
  - Clears `Browser` and `Client` smart pointers.
  - Destroys the Slate UTexture2D.
- Reclaims GPU and CPU memory immediately on the game thread.

### 6.2 Level Travel Rules
When `FWorldDelegates::OnPreWorldFinishDestroy` triggers:
- `USwuiDocumentManagerSubsystem::UnloadNonPersistentDocuments()` executes.
- Documents with `Layer == ESwuiDocumentLayer::Level` or `Modal` are cleanly unloaded.
- Documents with `Layer == ESwuiDocumentLayer::Persistent` (e.g. Network HUD, chat overlay) survive map transitions without stutter.
