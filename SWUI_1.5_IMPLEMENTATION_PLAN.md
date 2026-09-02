# SWUI 1.5 — Implementation Plan
### Frame-Synchronized Runtime, Timeline-Based Interactions & Low-Latency Presentation

**Status:** execution-ready draft  
**Baseline:** `AchiraStudio/SWUI` `main`, after the cache-path / `CefShutdown` / heartbeat-split / `ObserveProperty`-dedup / GPU-double-buffer fixes already merged.

---

# 0. Purpose

SWUI 1.5 is a **runtime-quality release**, not a large feature dump.

The primary objective is to make SWUI feel:

- smooth,
- responsive,
- frame-consistent,
- predictable under editor/PIE load,
- correctly synchronized with gameplay,
- inexpensive when UI state is static,
- robust when multiple asynchronous systems are active.

The most visible motivating bug is the hold-to-interact progress bar:

```text
Gameplay interaction:
████████████████████ 100% → COMPLETE

SWUI:
██████████████████░░  ~90–95%

```

The game has already completed the interaction while the UI is visibly behind.

This plan therefore treats **timeline synchronization as a correctness feature**, not merely an animation/performance optimization.

The second motivating problem is broader:

> SWUI sometimes feels stuttery or “bloated” during PIE/editor load even when memory usage is not especially high.

The working diagnosis is that memory usage is a correlated symptom, not the root metric. Scheduling contention, thread handoffs, CEF cadence, state transport, logging, rendering/presentation latency, and input queues can all contribute independently.

SWUI 1.5 must address these separately rather than attempting one giant “performance fix.”

---

# 1. Rules for Implementing This Plan

## 1.1 The current repository is implementation reality

Before changing anything:

1. Inspect the current source.
2. Inspect recent commits.
3. Verify the current behavior.
4. Check whether each planned change is still necessary.
5. Preserve fixes already merged.

Do not implement against an older snapshot merely because the plan mentions it.

The plan defines the desired behavior; the current repository defines the available implementation surface.

---

## 1.2 Incremental architecture only

Do **not** perform a large runtime rewrite.

Reuse existing SWUI mechanisms:

- existing CEF lifecycle,
- existing `USwuiView`,
- existing `USwuiSubsystem`,
- existing external BeginFrame path,
- existing `FSwuiFlushAndBeginFrameTask`,
- existing state flush,
- existing `ObserveProperty`,
- existing GPU double buffer,
- existing CPU fallback,
- existing world-widget architecture,
- existing `Swui.onTick(dt)` contract.

Extend proven mechanisms rather than creating parallel systems.

---

## 1.3 Correctness before optimization

A change that makes the UI faster but introduces stale frames, race conditions, incorrect completion, lost input, broken Blueprint behavior, or shutdown regressions is not an improvement.

Priority:

```text
Correctness
    ↓
Synchronization
    ↓
Perceived latency
    ↓
Stable frame pacing
    ↓
CPU/GPU efficiency
```

---

# 2. What's Already Fixed — DO NOT RE-DO

The following items are part of the current baseline and must remain intact.

| Area | Current status |
|---|---|
| Per-frame full state serialization | Fixed: expensive changed-state serialization is gated |
| `swui:tick` | Intentionally retained because `Swui.onTick(dt)` is part of the current JS animation contract |
| Texture resize thread safety | Fixed: resize/create is applied on the Game Thread |
| GPU tearing/single-buffer concern | Fixed: front/back texture approach + generation tracking |
| `ObserveProperty` deduplication | Fixed |
| Stable CEF cache path | Fixed |
| Proper `CefShutdown()` sequencing | Fixed |

Do not regress these while implementing 1.5.

---

# 3. 1.5 Scope

## In scope

### Phase 0
Instrumentation and baseline measurements.

### Phase 1
Reduce unnecessary CEF scheduling pressure and remove unsafe/default engine-wide side effects.

### Phase 2
Timeline synchronization for continuous time-authoritative UI.

### Phase 3
State generation/versioning.

### Phase 4
Input coalescing and bounded high-frequency event handling.

---

## Explicitly deferred

Unless measurements prove they are necessary for an in-scope feature:

- full native `CefProcessMessage` state bridge,
- tiled CPU renderer,
- central multi-view browser-budget scheduler,
- large standalone SWUI performance HUD,
- broad public-API redesign.

These remain future work.

---

# 4. Success Criteria

SWUI 1.5 is successful only if it improves all three dimensions:

## 4.1 Performance

The plugin should perform less needless work.

Examples:

```text
No unnecessary 300Hz browser scheduling.
No unnecessary state serialization.
No redundant mouse-move task buildup.
No uncontrolled console-log flood.
```

## 4.2 Smoothness

A visual value that represents a continuous timeline should move continuously.

The UI should not visibly jump:

```text
20 → 31 → 47 → 58 → 74 → 91
```

when the underlying interaction is a smooth two-second operation.

## 4.3 Synchronization

Gameplay authority and UI presentation must agree.

The implementation must prevent both:

```text
Gameplay complete → UI still visibly incomplete
```

and:

```text
UI visually reports complete → gameplay is not complete
```

The second case is important: timeline prediction must not accidentally create false completion.

---

# 5. Definition of a SWUI Frame

1.5 should establish a lightweight conceptual frame contract without introducing a giant new frame-ticket framework.

A SWUI frame has:

```text
UE frame index
state generation
timeline generation(s)
browser request/presentation generation where available
game time anchor
```

This information should be carried through existing runtime mechanisms where practical.

Do not create duplicate identifiers that represent the same thing.

---

# 6. Phase 0 — Instrumentation

Do this before behavior changes.

The goal is to replace “it feels laggy” with evidence.

## 6.1 Required counters

Track, at minimum:

```text
ObservedProperties.Num()
ChangedProperties.Num()
StateGeneration
UE frame index
BeginFrame requests
BeginFrame skips/coalesces
CEF paints
Presented frames
Replaced/dropped frames
Input events received
Input events coalesced
```

## 6.2 Required timing

Measure:

```text
State flush start
State flush end
BeginFrame requested
CEF paint callback
Render upload queued
Render upload complete
Presentation observed
```

At minimum, derive:

```text
paint → present latency
```

Preferably also:

```text
state submit → paint
paint → upload
upload → present
```

Use rolling statistics:

```text
min
average
max
```

and optionally percentile values if inexpensive.

Do not log every frame.

---

## 6.3 Timeline-specific instrumentation

Once Phase 2 exists, track:

```text
Timeline start game time
Timeline duration
Timeline generation
Authoritative completion game time
Authoritative cancel game time
Browser-estimated game time
Last presented timeline progress
```

This must make it possible to answer:

> Was the gameplay transition late, the transport late, the browser frame late, the presentation late, or the frontend animation wrong?

---

## 6.4 Debug output

Provide a lightweight diagnostic output such as:

```text
SWUI
FPS: 59.7
Browser FPS: 60
Presented FPS: 59
Dropped/Replaced: 1
State Version: 42
Changed Props: 2
Paint→Present: 1.4 ms
Input Coalesced: 14
```

For timeline debugging, optionally:

```text
Timeline: Interact
Generation: 7
Progress: 0.734
State: Running
```

Prefer a debug CVar or throttled log over a permanent on-screen system.

---

# 7. Phase 1 — Reduce CEF Scheduling Pressure

## 7.1 Remove unnecessary 300Hz defaults

Current known issue:

- `WindowlessFrameRate = 300`
- `CefOffscreenFrameRate = 300`
- OSR frame-rate default can also resolve to 300

This is substantially higher than the intended default SWUI presentation rate.

Default target:

```text
60 FPS
```

Where possible, establish a clear relationship between:

```text
CEF scheduling cadence
SWUI browser cadence
external BeginFrame cadence
MaxBrowserFramesPerSecond
```

Do not leave multiple values pretending to be “the FPS.”

If separate settings must remain for technical reasons, document exactly what each one controls.

---

## 7.2 External BeginFrame behavior

If external BeginFrame is active, determine which cadence is authoritative.

Do not let:

```text
CEF internal 300Hz
+
SWUI 60Hz
```

continue to compete unnecessarily.

Desired behavior:

```text
SWUI decides when a browser frame is needed
        ↓
CEF is given that opportunity
```

Avoid adding an independent competing scheduler.

---

## 7.3 Low-latency engine-wide CVar behavior

`r.OneFrameThreadLag` is engine-wide.

Therefore:

- default `LowLatencyFramePacingMode` should be `Disabled`,
- SWUI must not automatically modify the engine-wide CVar,
- the aggressive low-latency mode remains available as explicit opt-in.

Preserve correct save/restore behavior.

Validate:

```text
SWUI startup
multiple SWUI views
mode toggle
view destruction
plugin shutdown
```

No engine-wide value may remain accidentally modified after SWUI is gone.

---

## 7.4 `disable-web-security`

Do not append this unconditionally for production-style operation.

Gate it appropriately for development/editor scenarios or explicit developer configuration.

Never silently weaken browser security in a normal shipping configuration.

---

## 7.5 CEF console logging

`OnConsoleMessage` must not become an uncontrolled performance sink.

Default behavior:

```text
Verbose/debug oriented
```

Provide an opt-in mechanism for high-severity passthrough during debugging.

Do not silently hide actual errors.

Avoid expensive formatting/logging in hot paths.

---

# 8. Phase 1 Acceptance Gate

Do not move to Phase 2 until:

- project builds,
- CEF startup works,
- CEF shutdown works,
- PIE works,
- browser defaults are verified,
- low-latency engine CVar is not modified by default,
- console logging behavior is verified,
- `disable-web-security` behavior is verified,
- Phase 0 measurements still function.

---

# 9. Phase 2 — Timeline Synchronization

This is the centerpiece of SWUI 1.5.

## 9.1 Why timelines are different

Discrete state:

```text
health
ammo
weapon name
has key
objective
```

should be synchronized as state.

Continuous time-authoritative behavior:

```text
hold interaction
reload progress
ability charge
cooldown
capture progress
stamina drain
timed crafting
```

should be represented as a timeline.

Do not force both data types through the same transport model.

---

# 10. Timeline Protocol

A timeline should represent **authority**, not merely animation.

Minimal conceptual fields:

```text
Id
Generation
StartGameTime
Duration
Direction
State
```

Recommended state set:

```text
Idle
Running
Completed
Cancelled
```

A timeline's generation must distinguish different runs of the same ID.

For example:

```text
Interact generation 17
    ↓ cancelled

Interact generation 18
    ↓ started
```

An old message from generation 17 must never modify generation 18.

---

# 11. Authoritative Time Model

The browser must not assume:

```text
performance.now() == Unreal game time
```

Instead, establish a clock mapping.

Conceptually:

```javascript
window.__SWUI__.clock = {
    gameTime: ...,
    browserTime: performance.now(),
    rate: 1.0,
    paused: false
};
```

Then provide:

```text
gameTimeNow()
```

based on the most recent synchronization anchor.

---

## 11.1 Important: account for pause/time dilation

Do not assume Unreal's game clock always advances at real-time rate.

If the current SWUI timeline uses a game-time source that can pause or change rate because of:

- pause,
- time dilation,
- world state,

the browser-side prediction must account for that.

Do not allow:

```text
Game paused
↓
Browser keeps progressing timeline
```

unless that behavior is explicitly intended by the timeline.

If the existing API does not currently expose rate/pause state, implement the minimum synchronization metadata required to make timeline behavior correct.

Do not silently reinterpret gameplay time as wall-clock time.

---

# 12. Timeline Start

When Unreal starts a timeline:

```text
StartTimeline(Id, Duration, ...)
```

the authoritative message must contain the timeline generation and authoritative start time.

The browser should immediately create its local timeline representation.

Do not send a per-frame progress stream.

---

# 13. Local Progress Computation

The browser computes:

```text
progress =
    elapsed_authoritative_time / duration
```

and clamps it to:

```text
0.0 … 1.0
```

Visual updates should use `requestAnimationFrame`.

The purpose is:

```text
UE sends timeline definition
        ↓
browser locally interpolates
        ↓
no per-frame UE→CEF progress traffic
```

---

# 14. Prevent False Completion

The browser may predict progress approaching the endpoint.

However:

> **Visual progress reaching 1.0 must not implicitly mean authoritative gameplay completion.**

The browser must distinguish:

```text
PredictedEnd
```

from:

```text
AuthoritativelyCompleted
```

Where necessary, cap predicted progress just below full completion until `CompleteTimeline` arrives, or use an equivalent mechanism that prevents a false “complete” visual state.

The exact visual policy may depend on the component, but the state machine must remain authoritative.

---

# 15. Timeline Completion

`CompleteTimeline(Id)` must:

1. identify the correct timeline generation,
2. cancel/override any in-flight browser interpolation,
3. set the timeline to authoritative completion,
4. expose progress as exactly `1.0`,
5. allow the UI to react immediately.

An old completion message must never complete a newer timeline generation.

---

# 16. Timeline Cancellation

Cancellation must be authoritative.

Prefer to carry an authoritative game-time or progress point rather than depending on:

```text
whatever progress the browser last happened to display
```

If the existing API retains:

```cpp
CancelTimeline(FName Id, float AtProgress)
```

the supplied value must be explicitly documented as **authoritative**.

A better internal representation may be:

```text
AtGameTime
```

with browser-side progress reconstructed from the synchronized clock.

The implementation can support the public API chosen in the plan while internally preserving authoritative timing.

---

# 17. Timeline Restart

Rapid restart is a critical correctness test.

Example:

```text
Start generation 1
Cancel generation 1
Start generation 2
```

Then:

```text
Complete generation 1
```

must have no effect.

Likewise:

```text
Cancel generation 1
```

must never cancel generation 2.

Use a generation/version check.

---

# 18. Browser API

Add a client-side API approximately matching:

```typescript
Swui.timeline.start(id, duration, reversed?)
Swui.timeline.progress(id): number
Swui.timeline.onComplete(id, callback)
```

The implementation may expose additional lifecycle APIs if needed.

The API should clearly separate:

```text
timeline state
timeline progress
authoritative completion
```

Do not make `progress() === 1` synonymous with authoritative completion unless the timeline is actually marked completed.

---

# 19. Timeline Callback Safety

Timeline callbacks must not leak.

Ensure that:

- destroyed components can unregister,
- callbacks for old generations cannot affect new generations,
- repeatedly starting/stopping timelines does not accumulate listeners,
- callback execution cannot accidentally mutate a destroyed UI instance.

This should be tested.

---

# 20. Frontend Rendering Guidance

For progress bars and similar components:

Prefer GPU-friendly properties such as:

```css
transform: scaleX(...)
```

rather than repeatedly changing layout-heavy properties such as `width`, when appropriate.

Use `requestAnimationFrame` for timeline-driven visual updates.

Do not introduce CSS transitions on top of authoritative timeline progress unless explicitly intended.

Avoid creating per-frame DOM nodes, stylesheets, or allocations.

---

# 21. `SwuiHoldProgress` Reference Component

Create or update a reference client-library example implementing:

```text
Idle
   ↓
Holding
   ↓
Completed
```

and:

```text
Idle
   ↓
Holding
   ↓
Cancelled
```

It should demonstrate the complete C++/Blueprint → SWUI timeline → browser rendering path.

The example should be usable as the foundation for:

- hold interactions,
- reload bars,
- cooldowns,
- capture bars,
- crafting progress,
- charging abilities.

Do not put gameplay-specific logic into the generic timeline engine.

---

# 22. Timeline Acceptance Tests

The following are mandatory:

## Test A — Normal hold

```text
Duration = 2.0 seconds
```

The visual progress should be continuous and stable.

## Test B — Editor load

Perform the same interaction while the editor/PIE process is under significant CPU/render pressure.

The browser should continue to interpolate the timeline rather than relying on a large sequence of delayed Unreal progress messages.

## Test C — Completion correctness

At authoritative completion:

```text
Gameplay = complete
UI = complete
```

There must not be a persistent stale 80–95% state.

## Test D — Cancel

Cancel around 50–70%.

The UI must stop at the authoritative cancellation point.

## Test E — Restart

```text
Start
Cancel
Start again
Complete
```

Old events must not corrupt the second timeline.

## Test F — Rapid transitions

Stress:

```text
Start
Cancel
Start
Complete
Start
Cancel
Complete
```

No generation-crossing bugs are allowed.

## Test G — Pause/time dilation

Where applicable, verify that game-time behavior remains correct when Unreal's game clock is paused or rate-adjusted.

---

# 23. Phase 2 Acceptance Gate

Do not move to Phase 3 until all of the following are true:

- timeline API builds,
- browser API builds,
- synchronized clock works,
- normal timeline animation is smooth,
- completion is authoritative,
- cancellation is authoritative,
- generation ordering works,
- restart works,
- pause/time-dilation behavior is understood and validated where applicable,
- no timeline callback leaks are found,
- hold interaction behaves correctly under editor/PIE load.

---

# 24. Phase 3 — State Generation

Extend the proven GPU generation-counter pattern to logical state.

Do not create a giant new synchronization framework.

Add:

```text
StateGeneration
```

or equivalent.

Increment it when a real logical state change occurs.

Do not increment merely because a heartbeat/tick occurred.

Expose the value through the existing `_runtime` block alongside:

```text
frameIndex
```

for example:

```text
stateVersion
```

---

# 25. State Generation Semantics

The distinction must remain:

```text
frameIndex
    = browser/runtime heartbeat

stateVersion
    = logical state revision
```

Example:

```text
Frame 100  State 9
Frame 101  State 9
Frame 102  State 10
Frame 103  State 10
```

This allows diagnostics and future synchronization logic to distinguish:

```text
new frame
```

from:

```text
new logical state
```

Do not regress current change-gated state serialization.

---

# 26. Phase 3 Acceptance Gate

Verify:

- unchanged state does not generate new state versions,
- changed state increments the version exactly once per logical flush,
- version remains monotonic,
- browser receives correct version information,
- existing `swui:tick` behavior remains intact.

---

# 27. Phase 4 — Input Coalescing

Audit the current browser input forwarding.

## Coalescible

```text
mouse move
resize
high-frequency pointer movement
```

## Reliable/discrete

```text
mouse button
keyboard
text input
clicks
gameplay events
```

---

# 28. Mouse Move

Current direct 1:1 forwarding can produce redundant work under heavy movement.

Introduce bounded latest-state coalescing.

Desired behavior:

```text
OS mouse:
A
B
C
D
E

Browser:
E
```

or the smallest number of updates required to preserve correct interaction semantics.

Do not create a queue of obsolete pointer positions.

Preserve:

- coordinates,
- modifiers,
- button state,
- correct event ordering relative to discrete input.

---

# 29. Wheel

Wheel handling must preserve semantic scroll intent.

Do not merely “latest wins” if doing so loses actual accumulated scroll.

Use a bounded/coalesced representation that preserves the total intended wheel delta where necessary.

---

# 30. Resize

Resize events should be coalesced/debounced so that rapid viewport changes do not trigger repeated expensive browser work.

Preserve the final size correctly.

Do not regress the existing game-thread texture-resize safety model.

---

# 31. Input Threading

Never solve input backlog by moving unsafe browser/UObject operations to arbitrary threads.

Respect:

```text
Game Thread
CEF UI Thread
CEF Renderer Thread
Render Thread
```

Use existing task patterns and explicit synchronization.

---

# 32. Phase 4 Acceptance Gate

Verify:

- mouse movement does not build stale task queues,
- click/key/text events remain reliable,
- wheel intent is preserved,
- resize converges to the final size,
- input remains responsive under editor load,
- no thread-safety regression occurs.

---

# 33. Cross-Phase Regression Requirements

After Phases 1–4, test the interaction of the features.

This matters because each subsystem can work independently while their combination still produces lag.

Test:

```text
CEF scheduling + timeline
Timeline + state generation
Timeline + input
Input + CEF load
State updates + browser animation
GPU presentation + timeline
Editor/PIE load + all of the above
```

---

# 34. Rendering Regression Matrix

Test at least:

```text
Editor
PIE
Standalone
```

and, where supported:

```text
GPU path
CPU path
```

Also test:

```text
1280×720
1920×1080
2560×1440
```

where practical.

Do not assume the same synchronization problem appears identically on CPU and GPU rendering paths.

---

# 35. Browser Cadence Matrix

Validate behavior at:

```text
30 FPS
60 FPS
120 FPS
```

where supported.

The important metric is not “maximum FPS.”

Measure:

```text
cadence stability
presented frames
paint→present latency
input latency
timeline correctness
```

---

# 36. Load Matrix

Test at:

```text
Editor idle
Editor moderate load
Editor heavy load
PIE moderate load
PIE heavy load
```

Also explicitly test both:

```text
high memory
low memory
```

This is important because memory usage is not assumed to be the root cause.

The test objective is to determine whether the actual culprit is:

```text
CPU contention
CEF scheduling
Game Thread latency
Render Thread latency
browser task queue
state transport
paint/presentation
logging
```

---

# 37. Performance Anti-Patterns

Do not “fix” lag by:

- setting CEF to an even higher FPS,
- adding arbitrary buffers,
- adding uncontrolled threads,
- forcing engine-wide synchronization,
- sending every state value every frame,
- sending every pointer event 1:1,
- hiding all logs,
- adding CSS transitions to mask latency,
- artificially delaying gameplay completion to match a slow UI.

The game must remain authoritative.

---

# 38. Code-Level Requirements

## Allocation

Avoid avoidable hot-path allocations.

Especially avoid per-frame construction of:

- large JSON payloads,
- large JS strings,
- temporary arrays,
- large diagnostic strings,
- unnecessary texture data.

---

## Logging

Never let high-frequency logging become a runtime dependency for normal correctness.

Diagnostics must remain opt-in or appropriately throttled.

---

## Thread ownership

Document or clearly enforce ownership for:

```text
CEF state
timeline state
browser callbacks
texture resources
generation counters
input queues
```

Use atomics only where they solve a real cross-thread ownership problem.

Do not add atomics as decoration.

---

# 39. File-Level Expected Touch List

This is guidance, not a requirement to modify every file.

| File | Expected work |
|---|---|
| `SwuiSettings.h` | sane CEF FPS default; low-latency default |
| `SwuiView.h` | browser cadence default/clarification |
| `SwuiView.cpp` | external cadence integration; input coalescing; timeline-related per-view support if needed |
| `SwuiManager.cpp` | CEF scheduling/defaults; security gating |
| `SwuiSubsystem.h/.cpp` | instrumentation; timeline API/storage; state generation |
| `RenderHandler.cpp` | console logging; input/event handling support; diagnostics |
| `SwuiFullSurfaceCpuRenderer.*` | only instrumentation/minor compatibility work in 1.5 unless measurements prove CPU-path optimization is required |
| `SwuiWorldWidget.*` | preserve compatibility; no speculative scheduler rewrite |
| `SwuiClientLib/src/swui.ts` | timeline API and synchronized clock |
| client examples/components | `SwuiHoldProgress` or equivalent |
| frontend CSS | timeline rendering guidance/examples |

The actual touched files may differ based on the current implementation.

---

# 40. Build and Validation Requirements

After every phase:

1. Compile affected Unreal modules.
2. Compile/build the client library.
3. Run relevant automated tests.
4. Run relevant editor/PIE tests.
5. Inspect warnings.
6. Search for dead/duplicated code.
7. Verify that existing fixes remain intact.

Do not move to the next phase solely because compilation succeeds.

---

# 41. Final Integration Test

Before declaring 1.5 complete, perform an end-to-end scenario:

```text
Launch editor
    ↓
Start PIE
    ↓
Display dynamic health/stamina
    ↓
Move/interact rapidly
    ↓
Hold interaction
    ↓
Complete interaction
    ↓
Cancel interaction
    ↓
Restart interaction
    ↓
Resize UI
    ↓
Stress editor/PIE
    ↓
Shutdown PIE
    ↓
Restart PIE
    ↓
Shutdown editor/module
```

Validate:

- no stale timeline state,
- no stale input,
- no browser task buildup,
- no GPU tearing,
- no shutdown crash,
- no persistent CVar mutation,
- no state generation corruption,
- no obvious UI hitch introduced by diagnostics.

---

# 42. Definition of Done

SWUI 1.5 is not complete until all applicable items below are true.

## Performance

- CEF no longer defaults to unnecessary 300Hz scheduling.
- CEF/browser cadence has a clear source of truth.
- `r.OneFrameThreadLag` is not modified automatically.
- console logging is controlled.
- unnecessary input events are coalesced.
- unnecessary state work remains eliminated.

## Timeline

- synchronized game-time model exists,
- hold progress is locally interpolated,
- no per-frame progress stream is required,
- completion is authoritative,
- cancellation is authoritative,
- old generations cannot overwrite newer ones,
- false completion cannot occur,
- repeated start/cancel/restart is safe.

## State

- `stateVersion` / `StateGeneration` exists,
- it advances only on logical state change,
- it remains separate from heartbeat/frame index.

## Rendering

- existing GPU double buffering remains intact,
- CPU fallback remains functional,
- no thread-safety regression exists.

## Input

- mouse movement is coalesced,
- resize is coalesced,
- wheel semantics remain correct,
- discrete input remains reliable.

## Diagnostics

- the runtime can report enough information to explain UI latency,
- measurements do not themselves become a meaningful performance cost.

## Compatibility

- existing bindings work,
- existing Blueprint usage works,
- existing `Swui.onTick(dt)` remains functional,
- existing HUDs work,
- existing world widgets work,
- plugin startup/shutdown work.

---

# 43. Final Engineering Principle

The central lesson of SWUI 1.5 is:

> **Do not make the browser chase gameplay. Give the browser the authoritative timeline and let it render that timeline locally.**

And:

> **Do not make the engine render as fast as possible. Make it render exactly when necessary, and make every presented frame correspond to a known piece of game state.**

The desired architecture is:

```text
                    GAME TRUTH
                         │
          ┌──────────────┴───────────────┐
          ▼                              ▼
   DISCRETE STATE                    TIMELINES
 health / ammo / etc.          hold / reload / cooldown
          │                              │
       OnChange                 start + duration + authority
          │                              │
          └──────────────┬───────────────┘
                         ▼
                SWUI STATE VERSION
                         │
                         ▼
                  CEF UI THREAD
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
       DOM/state                Local timeline
       application             requestAnimationFrame
            │                         │
            └────────────┬────────────┘
                         ▼
                   CEF compositor
                         │
                GPU / CPU presentation
                         │
                         ▼
                    UE texture
                         │
                         ▼
                     UI screen
```

The goal is not simply higher FPS.

The goal is:

```text
Correct
    +
Smooth
    +
Responsive
    +
Predictable
    +
Cheap when idle
```

That is the definition of **SWUI 1.5**.
