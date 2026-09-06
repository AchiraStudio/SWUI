# SWUI — Comprehensive Performance, Rendering & Feature Roadmap

> **Goal:** Evolve SWUI into a production-grade Unreal Engine UI framework where Chromium/HTML/CSS provides a powerful authoring experience without making the game feel like it is running a browser inside the frame loop.
>
> **Primary performance target:** Heavy CSS animation, large DOM trees, frequent state updates, and multiple animated UI elements should degrade gracefully rather than causing noticeable Unreal frame-time spikes or micro-stutter.

---

## 0. Executive Summary

SWUI already has a strong foundation:

- CEF/Chromium integration
- Unreal ↔ JavaScript bindings
- generated TypeScript support
- GameplayTag/event routing
- CPU paint handling
- accelerated/shared-texture rendering
- dirty-region/ROI concepts
- state-change detection
- input preprocessing/coalescing
- runtime diagnostics

The next stage should **not** be a complete rewrite. The priority is to turn SWUI's browser integration into a deliberately scheduled, measured, frame-budgeted rendering subsystem.

### Core architecture to aim for

```text
                         UNREAL ENGINE
                              │
              ┌───────────────┴───────────────┐
              │                               │
        Gameplay State                     Input
              │                               │
              └───────────────┬───────────────┘
                              ▼
                     SWUI STATE SCHEDULER
                     ┌────────────────────┐
                     │ On Change          │
                     │ 15/30/60/120 Hz   │
                     │ Event Driven       │
                     │ Batched Updates    │
                     └─────────┬──────────┘
                               │
                               ▼
                            CEF/JS
                               │
                  ┌────────────┴────────────┐
                  │                         │
             CSS/DOM work              Browser GPU
                  │                         │
                  └────────────┬────────────┘
                               ▼
                     SHARED GPU TEXTURE
                               │
                               ▼
                          UE RHI / Slate
                               │
                               ▼
                         GAME FRAME
```

When nothing needs updating:

```text
                 SWUI
                   │
                   ▼
                 SLEEP
                   │
          ┌────────┼────────┐
          │        │        │
       State     Input   Animation
       Change              Wake
          │        │        │
          └────────┼────────┘
                   ▼
                 ACTIVE
```

---

# 1. Objectives

## 1.1 Performance objectives

SWUI should aim for:

- minimal game-thread work
- minimal CPU pixel copying
- minimal GPU texture uploading
- minimal unnecessary CEF work
- no browser tick forced to match Unreal FPS
- no full-frame upload when only a small region changed
- no state serialization when state did not change
- no JS event dispatch when no consumer needs it
- graceful behavior when CSS becomes expensive
- predictable frame-time impact
- measurable dropped-frame behavior
- strong fallback behavior on hardware where accelerated rendering is unavailable

### Desired principle

> **A slow UI should make the UI less smooth before it makes the game less smooth.**

That principle should guide the scheduler and rendering pipeline.

---

# 2. Priority Roadmap

## Phase 1 — Instrumentation and Baseline

**Priority: P0**

Before changing rendering behavior, establish reliable measurements.

Implement:

- SWUI frame profiler
- CEF processing timing
- JS/state synchronization timing
- paint timing
- dirty-region statistics
- CPU copy timing
- GPU upload timing
- browser FPS
- presented UI FPS
- Unreal FPS
- dropped UI frames
- UI frame latency
- number of state changes
- number of serialized properties
- input events received/coalesced
- active browser count
- DOM/render diagnostics where available

### Example profiler

```text
┌─────────────────────────────────────────┐
│ SWUI PROFILER                            │
├─────────────────────────────────────────┤
│ Unreal FPS                 119.8         │
│ SWUI FPS                    60.0         │
│ Presented UI FPS            59.9         │
│ Dropped UI Frames              2         │
│                                         │
│ CEF Processing             0.31 ms      │
│ State Sync                 0.08 ms      │
│ JS Dispatch                0.12 ms      │
│ Paint                      0.22 ms      │
│ CPU Copy                   0.44 ms      │
│ GPU Upload                 0.71 ms      │
│ Present                    0.09 ms      │
│                                         │
│ Dirty Pixels              182K           │
│ Full Surface             2.07M          │
│ State Updates              31/s         │
│ Input Events              280/s         │
│ Input Coalesced           192/s         │
└─────────────────────────────────────────┘
```

Add a console command such as:

```text
swui.profiler 1
```

and optionally:

```text
swui.stats
swui.stats.verbose
swui.profile.capture
```

### Important

The profiler must distinguish:

1. time spent on the Unreal game thread
2. time spent inside CEF
3. time spent copying pixels
4. time spent uploading textures
5. time waiting for synchronization
6. time spent presenting a completed browser frame

Without this distinction, "SWUI is slow" is not actionable.

---

# 3. Phase 2 — Make GPU Shared Texture the Preferred Rendering Path

**Priority: P0**

The current CPU path can become expensive:

```text
CEF frame
   ↓
CPU buffer
   ↓
Memcpy
   ↓
RHI UpdateTexture2D
   ↓
GPU
```

A 1920×1080 RGBA surface is approximately:

```text
1920 × 1080 × 4 = 8.3 MB/frame
```

At 60 updates/sec this can involve roughly:

```text
~498 MB/s of raw pixel data
```

before accounting for other work.

### Target architecture

```text
CEF Chromium GPU
        │
        ▼
Shared GPU texture
        │
        ▼
Unreal RHI
        │
        ▼
SWUI render target
```

### Rendering priority

Use:

```text
Automatic
    ↓
GPU Shared Texture
    ↓
CPU Dirty Region
    ↓
CPU Full Surface
```

GPU acceleration should be the normal production path.

CPU full-surface rendering should be a compatibility fallback, not the preferred path.

### User-facing render modes

Expose:

```text
SWUI Rendering Mode

[Automatic]
[GPU Shared Texture]
[CPU Dirty Regions]
[CPU Full Surface]
```

Do not require normal users to understand CEF internals.

---

# 4. Phase 3 — Decouple CEF Processing from Unreal Frame Rate

**Priority: P0**

Current architecture pumps CEF from the Unreal subsystem tick.

That is convenient, but potentially dangerous:

```text
Unreal Game Thread
    │
    ├── Gameplay
    ├── Physics
    ├── SWUI
    │    ├── CEF message processing
    │    ├── JS work
    │    └── paint handling
    └── Rendering
```

A browser spike can therefore become a game-frame spike.

## Target

Treat CEF as an independently scheduled subsystem.

Conceptually:

```text
Unreal
  │
  ├──────────────┐
  │              │
Game Thread    CEF/Browser
  │              │
  │              ▼
  │        Latest completed UI frame
  │              │
  └──────────────┘
```

The game should consume the **latest completed browser frame** instead of waiting for Chromium to finish rendering.

### Requirements

- avoid blocking the game thread
- avoid synchronous waits for browser paint
- queue completed frames
- use atomic/shared state where safe
- discard obsolete intermediate browser frames
- always prefer the newest completed frame
- keep a previous frame available while a new one is being rendered

### Double/triple buffering

Consider:

```text
Buffer A → currently displayed
Buffer B → browser rendering
Buffer C → optional pending frame
```

The exact number should be measured rather than assumed.

---

# 5. Phase 4 — Introduce a SWUI Frame Scheduler

**Priority: P0**

Do not assume:

```text
Game FPS == Browser FPS
```

Instead:

```text
Game: 165 FPS
SWUI: 60 FPS
```

or:

```text
Game: 165 FPS
SWUI: 30 FPS
```

or:

```text
Game: 165 FPS
SWUI: 120 FPS
```

depending on UI needs.

## Frame-rate modes

Implement:

```cpp
enum class ESwuiFrameRateMode
{
    MatchGame,
    Fixed15,
    Fixed30,
    Fixed60,
    Fixed90,
    Fixed120,
    Adaptive
};
```

Potentially allow custom FPS later.

## Recommended defaults

HUD:

```text
60 Hz
```

Menus:

```text
60 Hz while active
30 Hz when mostly static
```

Static interfaces:

```text
15–30 Hz or event-driven
```

Competitive/very animated HUD:

```text
120 Hz where appropriate
```

---

# 6. Adaptive UI Frame Rate

**Priority: P1**

Create an adaptive scheduler.

Example:

```text
Static UI
    ↓
15–30 Hz

Normal UI activity
    ↓
60 Hz

Interaction / animation
    ↓
90–120 Hz

Interaction stops
    ↓
30 Hz

Nothing changes
    ↓
SLEEP
```

The scheduler should consider:

- DOM animation activity
- active transitions
- user input
- state updates
- browser invalidation
- visibility
- focus
- UI layer
- performance budget
- recent dropped frames

### Avoid oscillation

Do not switch:

```text
30 → 60 → 30 → 60
```

every few frames.

Use hysteresis:

```text
enter 60 Hz after activity
remain at 60 Hz for N ms
return to 30 Hz only after sustained inactivity
```

---

# 7. Phase 5 — UI Sleep/Wake System

**Priority: P0/P1**

If a browser surface is not changing, it should not continuously consume rendering resources.

## Sleep conditions

A UI can enter sleep when:

- no relevant state changed
- no input occurred
- no active SWUI animation is known
- no browser invalidation is pending
- no scheduled high-frequency binding is due
- the UI is not visible
- the UI layer is inactive

```text
ACTIVE
  │
  │ inactivity
  ▼
SLEEP
```

## Wake events

Wake on:

- state change
- UI event
- input
- focus
- visibility change
- animation start
- navigation
- explicit `Wake()`
- timer requiring visual update

### Important CSS limitation

A browser can have internal CSS/JS animation that SWUI cannot perfectly predict from the Unreal side.

Therefore, the framework should provide explicit hints:

```typescript
swui.animation.begin();
swui.animation.end();
```

or:

```typescript
swui.setActivity("animated", true);
swui.setActivity("animated", false);
```

Later, SWUI can augment this with browser-side observation.

---

# 8. Heavy CSS Animation: The Main Goal

**Priority: P0**

This is a specific design goal:

> Heavy CSS animation must not automatically translate into heavy Unreal frame-time impact.

The key is to separate **browser rendering cost** from **Unreal game-frame cost**.

The architecture should aim for:

```text
Heavy CSS
   ↓
Chromium becomes busy
   ↓
UI frame rate may decrease
   ↓
latest completed UI frame is displayed
   ↓
Unreal gameplay continues smoothly
```

instead of:

```text
Heavy CSS
   ↓
Chromium busy
   ↓
CEF work blocks game thread
   ↓
Unreal frame spikes
   ↓
game micro-stutters
```

---

# 9. CSS Animation Optimization Strategy

SWUI cannot magically make expensive Chromium CSS free.

Instead, SWUI should make expensive CSS **isolated, measurable, and gracefully degraded**.

## 9.1 Prefer compositor-friendly CSS

Document recommended CSS practices:

### Prefer

```css
transform: translate3d(...);
opacity: 0;
filter: ...;
```

where Chromium can keep animation on compositor-friendly paths.

### Avoid animating expensive layout properties

Examples:

```css
width
height
top
left
margin
padding
font-size
```

when these cause repeated layout/reflow.

Prefer:

```css
transform: scale(...)
transform: translate(...)
opacity
```

where visually appropriate.

---

# 10. SWUI CSS Performance Guidelines

Create documentation called:

```text
SWUI_CSS_PERFORMANCE.md
```

Include:

### Tier A — cheap

- opacity
- transform
- simple color changes
- simple transitions

### Tier B — moderate

- shadows
- blur
- filters
- large translucent surfaces
- complex gradients

### Tier C — expensive

- large-area blur
- backdrop-filter
- massive box-shadow regions
- complex SVG filters
- continuously changing layout
- large DOM trees with frequent invalidation
- canvas/WebGL-heavy browser content
- huge numbers of independently animated elements

This documentation should teach developers how to write UI that performs well.

---

# 11. Animation Budgeting

Introduce a concept of:

```text
SWUI Animation Budget
```

Not as a hard CSS restriction initially, but as diagnostics.

Example:

```text
Active animated elements: 87
Estimated animated area: 62%
Layout invalidations: 18/frame
Paint invalidations: 42/frame
Compositor animations: 73
```

Warn in development builds:

```text
[SWUI] UI performance warning:
Large animated surface detected.
Estimated repaint area: 71%.
Consider transform/opacity animation.
```

Do not spam logs.

Use throttled warnings.

---

# 12. Browser-Side Performance Monitor

Inject a small optional SWUI performance monitor into development builds.

Collect:

```javascript
requestAnimationFrame rate
long tasks
layout duration
paint duration
script duration
animation count
```

Where supported.

Use:

```text
PerformanceObserver
requestAnimationFrame
document visibility
MutationObserver
```

carefully.

### Important

Do not run expensive diagnostics in Shipping builds.

Diagnostics should be:

```text
Development
Editor
Debug
Optional profiling
```

and effectively absent or disabled in Shipping.

---

# 13. Long Task Detection

Use browser-side long-task observation where available.

Example conceptual metric:

```text
JS Long Tasks

0–2 ms     normal
2–8 ms     moderate
8–16 ms    warning
16+ ms     severe
```

If the browser has repeated long tasks:

```text
SWUI browser workload is high
```

but do not block Unreal.

Expose it to the profiler:

```text
Browser JS Long Task:
18.4 ms
```

---

# 14. CSS/DOM Performance Isolation

Heavy UI should be isolated as much as possible.

Encourage:

```text
HUD root
 ├── static background
 ├── animated combat HUD
 ├── notifications
 └── minimap
```

rather than one giant DOM subtree where every update invalidates everything.

Use separate browser surfaces/layers when that produces measurable benefit.

Potential future feature:

```text
SWUI Layer
    ├── render target
    ├── frame rate
    ├── update policy
    └── visibility
```

This allows:

```text
Static background → 15 Hz
HUD → 60 Hz
Animated indicator → 120 Hz
Menu → 60 Hz
```

instead of forcing everything into one cadence.

---

# 15. DOM Update Batching

Avoid:

```javascript
element1.textContent = ...
element2.textContent = ...
element3.textContent = ...
element4.textContent = ...
```

as separate cross-boundary operations.

Instead:

```text
Unreal
   ↓
Batch state
   ↓
One JS message
   ↓
Apply updates
   ↓
One browser rendering cycle
```

Example conceptual payload:

```json
{
  "type": "state",
  "updates": {
    "player.health": 73,
    "player.ammo": 24,
    "player.stamina": 91
  }
}
```

The exact serialization format should be optimized later.

---

# 16. State Update Policies

Every binding should eventually support:

```text
Update Policy

[On Change]
[Event]
[15 Hz]
[30 Hz]
[60 Hz]
[120 Hz]
[Every Game Frame]
```

Potential metadata:

```cpp
UpdateRate
Priority
Interpolation
ReplicationPolicy
```

### Example

```text
Player.Health
On Change
High Priority
Interpolate: Smooth
```

```text
Player.Velocity
60 Hz
Normal Priority
Interpolate: Yes
```

```text
Player.AimSpread
120 Hz
High Priority
Interpolate: No
```

---

# 17. State Interpolation

For visual values, don't force Unreal to send every tiny change.

Instead:

```text
Unreal values:
0
27
52
80
```

Browser:

```text
0 → 27 → 52 → 80
```

with interpolation.

Useful for:

- health bars
- stamina
- progress bars
- XP
- weapon spread
- velocity indicators
- reticles

This reduces bridge traffic while preserving visual smoothness.

---

# 18. Priority-Based State Scheduler

Not every UI update has equal importance.

Introduce:

```cpp
enum class ESwuiUpdatePriority
{
    Critical,
    High,
    Normal,
    Low,
    Background
};
```

If the system is overloaded:

```text
Critical
    ↓
High
    ↓
Normal
    ↓
Low
    ↓
Background
```

For example:

```text
Health changed       → Critical
Ammo changed         → High
Compass rotation     → Normal
Animated background  → Low
Debug statistic      → Background
```

This is important for graceful degradation.

---

# 19. Backpressure

If the browser cannot consume updates fast enough, do not allow an unlimited queue to build up.

Bad:

```text
UE
 ↓
1000 state updates
 ↓
queue
 ↓
CEF
```

Better:

```text
Player.Health:
20
21
22
23
24
25

Only latest value matters:

25
```

Use coalescing for replaceable state.

Do not coalesce discrete events such as:

```text
WeaponFired
ButtonPressed
InventoryItemAdded
DamageReceived
```

unless the semantics explicitly permit it.

---

# 20. Input Coalescing

Mouse movement and analog input should be aggressively coalesced.

Instead of:

```text
Mouse:
1
2
3
4
5
6
7
8
9
10
```

send the latest position where possible.

Do not coalesce:

- clicks
- key down
- key up
- button presses
- gameplay actions

unless explicitly safe.

Track:

```text
InputEventsReceived
InputEventsCoalesced
InputEventsForwarded
```

---

# 21. Dirty Region Rendering

Continue improving the existing ROI/dirty rectangle system.

Target:

```text
Only changed pixels
        ↓
Only copy changed pixels
        ↓
Only upload changed regions
```

Maintain metrics:

```text
Surface Pixels
Dirty Pixels
Dirty %
Number of Rectangles
Merged Rectangles
Bytes Copied
Bytes Uploaded
```

### Rectangle optimization

Multiple overlapping dirty rectangles should be merged when doing so reduces overhead.

But do not blindly merge everything.

Example:

```text
100 tiny distant rectangles
```

might be worse than:

```text
1 giant rectangle
```

while:

```text
2 adjacent rectangles
```

should probably merge.

Create a measurable threshold.

---

# 22. Avoid Full-Surface Uploads

Add a profiler warning:

```text
SWUI: full-surface upload detected
```

only if it occurs repeatedly.

Example:

```text
Full surface:
8.3 MB

Dirty surface:
0.4 MB
```

If a UI is continuously invalidating the entire screen, identify it.

Potential causes:

- full-screen animation
- filters
- backdrop-filter
- large canvas
- layout invalidation
- DOM-wide style changes

---

# 23. Browser Surface Resolution Scaling

Consider allowing independent UI resolution.

Example:

```text
Game: 2560×1440
SWUI: 1920×1080
```

or:

```text
SWUI scale: 0.75
```

This can dramatically reduce browser rendering cost for expensive UI.

Provide:

```text
SWUI Resolution Scale
25%
50%
67%
75%
100%
125%
```

Do not automatically reduce resolution unless an adaptive mode is explicitly enabled.

---

# 24. Dynamic Resolution for UI

Future feature:

```text
Adaptive UI Resolution
```

If SWUI repeatedly exceeds its frame budget:

```text
60 Hz @ 100%
       ↓
budget exceeded
       ↓
60 Hz @ 83%
       ↓
still expensive
       ↓
60 Hz @ 75%
```

The game should remain unaffected.

Restore quality gradually when performance recovers.

---

# 25. Separate UI Performance Budget from Game Performance Budget

SWUI should have its own target:

```text
SWUI Frame Budget

30 Hz  → 33.3 ms
60 Hz  → 16.7 ms
90 Hz  → 11.1 ms
120 Hz → 8.3 ms
```

But the more important target is:

> **Game-thread contribution should remain extremely small and bounded.**

Do not simply say "SWUI is under 16 ms."

A 10 ms browser workload that happens entirely outside the game thread is fundamentally different from a 10 ms game-thread stall.

---

# 26. UI Frame Dropping Strategy

If SWUI misses its target frame:

```text
Do NOT stall Unreal.
```

Instead:

```text
Old UI frame
     │
     ▼
still displayed
     │
     └── newest browser frame arrives later
```

This is preferable to forcing the game to wait.

Track:

```text
UI frames generated
UI frames presented
UI frames dropped
UI frames skipped
```

---

# 27. Frame Pacing

SWUI should avoid:

```text
frame
frame
frame
300 ms pause
frame
```

even if average FPS looks good.

Track frame intervals.

Expose:

```text
UI Frame Time:
average
P50
P95
P99
max
```

Micro-stutter is often a percentile problem rather than an average-FPS problem.

---

# 28. Triple Buffering / Latest-Frame Policy

For browser frames:

```text
Produced → Pending → Displayed
```

When a new frame arrives and an old pending frame has not been displayed:

```text
replace old pending frame
```

For real-time HUDs, stale frames are often worse than dropped frames.

---

# 29. UI Layer System

Add a first-class layer stack.

Example:

```text
System
Debug
HUD
Interaction
Dialogue
Menu
Modal
```

Each layer can have:

```text
ZOrder
Visibility
InputPolicy
UpdateRate
RenderMode
Priority
ResolutionScale
```

Potential API:

```cpp
ShowUI("HUD");
PushUI("Inventory");
PushUI("PauseMenu");
PopUI();
```

---

# 30. UI Ownership

Each interface should have an owner/context.

Conceptually:

```cpp
USwuiInterface
{
    Owner
    Layer
    InputPolicy
    Visibility
    UpdatePolicy
    RenderPolicy
}
```

This makes it possible to suspend inactive interfaces.

---

# 31. TypeScript API Improvements

Make the generated API feel native.

Target style:

```typescript
import { swui } from "./swui";

swui.state.Player.health.subscribe(value => {
    healthBar.value = value;
});

swui.events.Player.damaged.subscribe(event => {
    showDamage(event.amount);
});
```

Potential convenience API:

```typescript
const player = swui.bind("Player");

player.health.subscribe(...);
player.ammo.subscribe(...);
player.onDamaged(...);
```

The developer should not need to understand the CEF bridge internals.

---

# 32. Strongly Typed Generated API

Continue expanding TypeScript generation.

Generate:

```text
properties
events
enums
GameplayTags
RPC-like calls
interfaces
payload types
```

Example:

```typescript
interface PlayerDamagedEvent {
    amount: number;
    source: string;
}
```

This should eliminate runtime mistakes wherever possible.

---

# 33. CSS/JS Developer Tooling

Add an editor/development overlay that can show:

```text
DOM nodes
active animations
browser FPS
long tasks
layout activity
paint activity
dirty region
surface resolution
```

Potential command:

```text
swui.inspect
```

Could later expose a browser DevTools-style workflow.

---

# 34. Animation-Aware Scheduling

SWUI should eventually know whether the page is visually active.

Possible browser-side signals:

- Web Animations API
- CSS animation state
- CSS transition state
- requestAnimationFrame activity
- DOM mutation activity
- ResizeObserver
- IntersectionObserver

Do not constantly poll expensive APIs.

Prefer event/observer-driven signals.

---

# 35. CSS Animation Hints

Provide optional CSS classes or attributes:

```html
<div data-swui-animation="active">
```

or:

```css
.swui-heavy-animation {}
```

SWUI could use these as hints for diagnostics and scheduling.

Example:

```text
SWUI warning:
12 large-area elements marked as heavy animation.
```

This should be optional and developer-focused.

---

# 36. Heavy Animation Isolation

For complex interfaces, encourage separate visual layers:

```text
Browser Surface
 ├── Static UI
 ├── Animated HUD
 ├── VFX
 └── Modal
```

Potentially:

```text
Static Surface → 30 Hz
Animated Surface → 60 Hz
VFX Surface → 60/120 Hz
```

Composite these in Unreal.

This is especially useful when one small animated element would otherwise force a huge full-screen browser surface to repaint.

---

# 37. Important Reality Check: CSS Cannot Be Made Free

SWUI should never promise:

> "Any amount of CSS animation will have zero performance cost."

That is impossible.

Chromium still has to:

- execute JavaScript
- calculate style
- perform layout
- paint
- rasterize
- composite
- execute GPU effects

The goal is:

> **Contain the cost and prevent browser workload from unnecessarily blocking the Unreal frame.**

This distinction should be explicit in the documentation.

---

# 38. Browser Rendering Recommendations

Create official SWUI guidance:

### Prefer

```css
transform
opacity
```

for animations.

### Be careful with

```css
filter
box-shadow
backdrop-filter
large gradients
SVG filters
```

### Avoid frequent layout changes

```css
width
height
top
left
margin
padding
font-size
```

when equivalent transform-based animation works.

### Avoid unnecessary full-screen effects

A full-screen blur/transparent layer can be dramatically more expensive than a small localized effect.

---

# 39. Shipping Build Rules

The following should be disabled or heavily reduced in Shipping:

- verbose SWUI logs
- profiler overlay
- expensive browser diagnostics
- long-task monitoring
- detailed DOM metrics
- debug serialization
- per-frame diagnostic strings

Use compile-time guards where appropriate.

---

# 40. Logging Policy

Runtime logging should be configurable.

Example:

```text
swui.log 0
swui.log 1
swui.log 2
```

Possible levels:

```text
0 = Off
1 = Errors
2 = Warnings
3 = Important events
4 = Verbose
5 = Trace
```

Do not construct expensive diagnostic strings if the level is disabled.

---

# 41. CEF Cache

Keep the persistent cache strategy.

A stable cache directory allows Chromium to reuse:

- HTTP/cache data
- compiled resources
- GPU/shader-related caches where applicable

Do not regress to process/PID-specific cache paths unless there is a deliberate isolation requirement.

---

# 42. Memory Management

Measure:

```text
Browser process memory
Renderer memory
GPU memory
SWUI textures
CPU frame buffers
pending frames
JS payload queues
```

Avoid retaining old browser frames.

A common target:

```text
Displayed frame
Latest pending frame
```

Anything older should generally be discarded.

---

# 43. Large UI Detection

Warn when:

```text
Surface > 4K
```

or:

```text
RGBA surface > configured MB threshold
```

Example:

```text
SWUI warning:
Browser surface is 3840×2160 (~31.6 MB/frame).
Consider reducing UI resolution.
```

Again, warnings should be throttled.

---

# 44. Multi-UI Scheduling

When multiple browser surfaces exist:

```text
HUD
Inventory
Map
Phone
Menu
```

do not give all of them equal priority.

Example:

```text
HUD        → 60 Hz
Map        → 60 Hz while visible
Inventory  → 30/60 Hz
Phone      → 30/60 Hz
Hidden UI  → Sleep
```

Scheduler should know:

```text
Visible
Focused
Input-active
Animating
Priority
```

---

# 45. UI Visibility Optimization

Hidden UI should ideally:

- stop unnecessary state synchronization
- stop unnecessary rendering
- reduce browser FPS
- enter sleep
- release/reuse expensive render resources where appropriate

For UI that will be shown again quickly, keep browser state alive but suspend visual work.

---

# 46. Preloading Without Continuous Rendering

For menus that need instant opening:

```text
Browser remains initialized
```

but:

```text
visual updates suspended
```

Then:

```text
Open Menu
   ↓
Wake browser
   ↓
render current state
   ↓
show immediately
```

This avoids both:

- expensive continuous background rendering
- slow browser recreation on every open

---

# 47. Micro-Stutter Test Suite

Create automated/manual benchmark scenes.

## Test A — Static HUD

```text
60/120/165 FPS game
Static browser UI
```

Expected:

```text
near-zero SWUI game-thread cost
```

## Test B — 100 animated elements

```text
100 CSS animations
```

Measure:

- Unreal frame time
- browser frame time
- dropped UI frames

## Test C — Full-screen expensive animation

Examples:

- blur
- backdrop-filter
- shadows
- gradients

Expected:

```text
UI degrades first
game remains stable
```

## Test D — High-frequency state

```text
100+ properties
60/120 Hz
```

Measure serialization and bridge cost.

## Test E — Multiple browser surfaces

```text
5–10 simultaneous UIs
```

Test scheduler behavior.

## Test F — CPU fallback

Compare:

```text
GPU shared texture
CPU dirty region
CPU full surface
```

---

# 48. Benchmark Targets

Use a representative 60 FPS target.

A useful initial goal:

```text
SWUI game-thread overhead:
< 0.5 ms typical
< 1.0 ms under normal load
```

These are engineering targets, not guarantees; measure on representative hardware.

For GPU mode:

```text
CPU pixel copying:
~0 for browser frames
```

For static UI:

```text
No unnecessary browser frame production
```

For overloaded UI:

```text
No synchronous game-thread wait
```

---

# 49. Profiling Workflow

When a user reports:

> "SWUI stutters."

The diagnostic flow should be:

```text
1. Check Unreal frame time
2. Check SWUI game-thread time
3. Check CEF processing
4. Check browser frame time
5. Check CPU copy
6. Check GPU upload
7. Check dirty pixel %
8. Check state update rate
9. Check input rate
10. Check JS long tasks
11. Check active animations
12. Check UI resolution
```

This turns vague complaints into actionable problems.

---

# 50. Feature: Performance Presets

Provide:

```text
SWUI Performance Preset

Ultra
High
Balanced
Low
Custom
```

Example:

### Ultra

```text
GPU rendering
120 Hz
full resolution
minimal throttling
```

### High

```text
GPU rendering
60–120 Hz adaptive
```

### Balanced

```text
GPU rendering
60 Hz
adaptive
sleep enabled
```

### Low

```text
GPU preferred
30–60 Hz
aggressive sleeping
reduced resolution
```

---

# 51. Feature: Per-UI Performance Profile

Each UI could specify:

```text
Performance Profile

Target FPS
Priority
Resolution Scale
Sleep Allowed
Animation Policy
State Update Rate
```

Example:

```text
HUD
Target: 60
Priority: High
Scale: 100%
Sleep: No

Inventory
Target: 60
Priority: Normal
Scale: 100%
Sleep: Yes

Background Menu
Target: 30
Priority: Low
Scale: 75%
Sleep: Yes
```

---

# 52. Feature: Automatic Performance Warnings

Examples:

```text
SWUI Performance Warning

Browser surface is repainting >90% of pixels
for 120 consecutive frames.

Possible causes:
- full-screen animation
- filter/backdrop-filter
- DOM-wide style invalidation
```

Another:

```text
SWUI Performance Warning

State binding "Player.Velocity"
is updating at 120 Hz.

Consider:
- interpolation
- 60 Hz
- event-driven updates
```

Another:

```text
SWUI Performance Warning

CEF renderer has produced repeated
>16 ms long tasks.
```

---

# 53. Feature: Performance Capture

Provide:

```text
swui.profile.start
swui.profile.stop
swui.profile.save
```

Generate a compact report:

```text
SWUI Performance Report
────────────────────────
Duration: 30 sec

Game FPS:
Avg: 119.4
P95 frame: 9.8 ms
P99 frame: 12.7 ms

SWUI:
Avg: 0.31 ms game-thread
P95: 0.62 ms
P99: 0.94 ms

Browser:
Avg: 7.2 ms
P95: 14.8 ms
P99: 21.4 ms

UI frames dropped: 8
Full-surface paints: 14
Dirty paints: 1,802
```

This would be extremely valuable for bug reports.

---

# 54. API Design Principles

SWUI APIs should favor:

### Declarative configuration

```cpp
UpdateRate = 60
Priority = High
SleepPolicy = Auto
```

over:

```cpp
Tick()
Tick()
Tick()
```

### Event-driven updates

Prefer:

```text
OnChanged
OnEvent
```

over polling.

### Latest-state semantics

For replaceable values:

```text
latest value wins
```

### Explicit high-frequency paths

Only request:

```text
Every Frame
120 Hz
```

when necessary.

---

# 55. Suggested Implementation Order

## Milestone 1 — "Measure Everything"

- [ ] SWUI profiler
- [ ] frame-time histograms
- [ ] CEF timing
- [ ] state sync timing
- [ ] paint timing
- [ ] CPU copy timing
- [ ] GPU upload timing
- [ ] dirty pixel metrics
- [ ] dropped UI frame metrics

---

## Milestone 2 — "Never Stall the Game"

- [ ] decouple CEF processing
- [ ] remove synchronous browser waits
- [ ] latest-frame policy
- [ ] frame queue
- [ ] double/triple buffering
- [ ] dropped intermediate frame handling

---

## Milestone 3 — "GPU First"

- [ ] stabilize shared texture path
- [ ] make GPU path default
- [ ] validate RHI synchronization
- [ ] handle device loss/recreation
- [ ] retain CPU fallback
- [ ] add GPU/CPU selection diagnostics

---

## Milestone 4 — "Smart Scheduling"

- [ ] fixed UI FPS
- [ ] adaptive UI FPS
- [ ] sleep/wake
- [ ] visibility throttling
- [ ] focus/input priority
- [ ] per-UI scheduler

---

## Milestone 5 — "Smart State"

- [ ] on-change updates
- [ ] update-rate policies
- [ ] batching
- [ ] coalescing
- [ ] priorities
- [ ] backpressure
- [ ] interpolation

---

## Milestone 6 — "CSS Performance"

- [ ] browser-side animation detection
- [ ] long-task detection
- [ ] animation metrics
- [ ] layout/paint metrics
- [ ] performance warnings
- [ ] CSS optimization documentation
- [ ] heavy animation hints

---

## Milestone 7 — "Rendering Scale"

- [ ] UI resolution scale
- [ ] adaptive resolution
- [ ] per-layer surfaces
- [ ] layer-specific frame rates
- [ ] multi-surface scheduler

---

## Milestone 8 — "Framework UX"

- [ ] UI layer stack
- [ ] UI ownership
- [ ] navigation API
- [ ] improved TypeScript API
- [ ] strongly typed generated events
- [ ] developer tooling

---

# 56. Proposed Final Architecture

The mature version of SWUI should conceptually look like this:

```text
                    ┌────────────────────────┐
                    │      Unreal Game       │
                    │                        │
                    │ Gameplay / Input / RHI │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │    SWUI Scheduler      │
                    │                        │
                    │ Priority               │
                    │ FPS                    │
                    │ Sleep/Wake             │
                    │ Backpressure           │
                    │ State batching          │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │       CEF/JS           │
                    │                        │
                    │ DOM                    │
                    │ CSS                    │
                    │ JS                     │
                    │ Animation              │
                    └───────────┬────────────┘
                                │
                   ┌────────────┴────────────┐
                   │                         │
              CPU fallback              GPU preferred
                   │                         │
                   ▼                         ▼
            Dirty rectangles          Shared texture
                   │                         │
                   └────────────┬────────────┘
                                ▼
                         Unreal RHI
                                │
                                ▼
                         Final UI Frame
```

The crucial property is:

```text
                 BROWSER IS ALLOWED TO BE BUSY
                                │
                                ▼
                    WITHOUT BLOCKING GAMEPLAY
```

---

# 57. Definition of Success

SWUI should be considered successful when these scenarios behave well:

### Static UI

```text
SWUI is almost invisible in the frame-time profile.
```

### Normal animated HUD

```text
Stable 60/120 Hz UI
without meaningful game-thread impact.
```

### Extremely heavy CSS

```text
Browser/UI FPS drops before Unreal FPS does.
```

### Massive state traffic

```text
State scheduler coalesces and prioritizes updates.
```

### Hidden UI

```text
UI sleeps.
```

### Multiple UIs

```text
Scheduler allocates resources based on priority.
```

### CPU fallback

```text
Dirty-region rendering minimizes transfers.
```

---

# 58. The Most Important Design Rule

Everything in SWUI should ultimately follow this rule:

> **Never sacrifice the game's frame for the UI's frame.**

If Chromium needs:

```text
20 ms
```

for an expensive CSS frame, SWUI should prefer:

```text
Game: 16.7 ms
UI:    20 ms
```

with the previous UI frame displayed temporarily,

rather than:

```text
Game: 36.7 ms
UI:    20 ms
```

because the game thread waited for Chromium.

This is the core philosophy that will make SWUI feel native.

---

# 59. Recommended Documentation Structure

Add:

```text
/docs/
    architecture.md
    performance.md
    css-performance.md
    rendering.md
    state-synchronization.md
    input.md
    profiling.md
    troubleshooting.md
```

And especially:

```text
SWUI Performance Guide
```

covering:

1. rendering modes
2. frame rates
3. animation best practices
4. DOM optimization
5. state binding optimization
6. resolution scaling
7. profiling
8. interpreting profiler output
9. avoiding micro-stutters

---

# 60. Final Priority Summary

If development time is limited, do these first:

```text
P0
────────────────────────────────────
1. SWUI Profiler
2. GPU Shared Texture as default
3. Decouple CEF from game-frame blocking
4. Latest-frame / frame dropping policy
5. State batching + change detection
6. UI sleep/wake
7. Fixed/adaptive UI FPS
8. Dirty-region optimization
```

Then:

```text
P1
────────────────────────────────────
9. Priority-based state scheduler
10. Backpressure/coalescing
11. CSS/JS performance metrics
12. Long-task detection
13. Animation diagnostics
14. UI resolution scaling
15. Multi-UI scheduling
16. Per-UI performance profiles
```

Then:

```text
P2
────────────────────────────────────
17. UI layer system
18. Navigation system
19. Better TypeScript API
20. Strongly typed events
21. Performance capture/reporting
22. Advanced developer tooling
23. Adaptive resolution
24. Layer-specific browser surfaces
```

---

# 61. One-Sentence Vision

**SWUI should let developers build modern, beautiful HTML/CSS/TypeScript interfaces inside Unreal while making the browser behave like a subordinate rendering system—not a second game loop capable of stealing frame time from the actual game.**
