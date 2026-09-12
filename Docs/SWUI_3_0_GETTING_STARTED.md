# Getting Started with SWUI 3.0

Welcome to **SWUI 3.0** — the Web Application Runtime for Unreal Engine.

SWUI allows game developers and UI designers to build fast, beautiful, responsive game user interfaces using **standard web technologies** (HTML, CSS, JavaScript, TypeScript, React, Vue, Svelte) and execute them natively inside Unreal Engine with per-document lifecycle management, game-thread frame budgeting, and high-performance GPU shared texture rendering.

---

## 1. Core Mental Model: The Multi-Document Architecture

In SWUI 2.x and earlier web UI plugins, games were built as a single monolithic `index.html` page loaded with infinite `if (level === ...)` statements.

**SWUI 3.0 replaces monolithic pages with Multi-Document UI:**

```
                        Unreal Engine (Viewport)
                                   ▲
       ┌───────────────────────────┼───────────────────────────┐
       │                           │                           │
  [Layer: Persistent]       [Layer: Level]             [Layer: Modal]
     Z-Order: 0               Z-Order: 10               Z-Order: 100
  ┌─────────────────┐      ┌─────────────────┐       ┌─────────────────┐
  │   Watermark /   │      │    Main HUD     │       │    Inventory    │
  │ Network Stats   │      │ (hud.html)      │       │(inventory.html) │
  └─────────────────┘      └─────────────────┘       └─────────────────┘
           │                        │                         │
           └────────────────────────┼─────────────────────────┘
                                    │
                                    ▼
                    USwuiDocumentManagerSubsystem
                     (Central Ticking, State Bus,
                     CEF Pumping, Input Hit-Testing)
```

- **Each UI is its own document**: Your HUD (`hud.html`), Inventory (`inventory.html`), Pause Menu (`pause_menu.html`), and Dialogue (`dialogue.html`) are completely isolated files.
- **Per-Document Lifecycle**: You can `Preload` an inventory in the background without hitches, `Activate` it on keypress, put it to `Sleep` when hidden to reclaim 100% of GPU/CPU budget, or `Unload` it when switching levels.
- **Central State Bus**: Unreal publishes state once (e.g. `PlayerHealth = 85`), and all active documents listening to that key update automatically in atomic batches.
- **Automated Input Routing**: When multiple documents are visible, SWUI automatically hit-tests clicks to the topmost visible document and routes keyboard typing to active text inputs.

---

## 2. Choosing Your Workflow

SWUI 3.0 is **100% framework-agnostic**. You have two first-class paths:

| Workflow | Best For | Prerequisites | Setup Time |
|---|---|---|---|
| **Path A: Vanilla HTML/CSS/JS** | Lightweight HUDs, fast prototyping, zero build complexity, artists/scripters | None (No Node.js, no npm) | 2 minutes |
| **Path B: Modern Frameworks (React, Vue, Svelte, Vite)** | Complex data-driven UI, component libraries (Radix, Tailwind, Lucide), design systems | Node.js & npm / pnpm | 5 minutes |

---

## 3. Path A: 5-Minute Quickstart with Vanilla HTML/CSS

No build tools, no package managers. Just plain HTML, CSS, and JS.

### Step 1: Create your HTML file
Inside your Unreal project, create a folder: `Content/UI/`.
Create a file named `hud.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 100vw; height: 100vh; overflow: hidden;
      background: transparent; user-select: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: white;
    }
    .hud-box {
      position: absolute; bottom: 30px; left: 30px;
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px; padding: 12px 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }
    .label { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: bold; }
    .value { font-size: 28px; font-weight: 800; color: #38bdf8; }
    .btn {
      margin-top: 8px; padding: 6px 12px; background: #0284c7;
      border: none; border-radius: 4px; color: white; cursor: pointer;
    }
    .btn:hover { background: #0369a1; }
  </style>
</head>
<body>
  <div class="hud-box">
    <div class="label">Shield Power</div>
    <div class="value" id="shield-text">100%</div>
    <button class="btn" id="btn-recharge">Recharge</button>
  </div>

  <script>
    // 1. Receive State from Unreal
    document.addEventListener('swui:stateChange', function(e) {
      if (e.detail && e.detail.key === 'PlayerShield') {
        document.getElementById('shield-text').textContent = Math.round(e.detail.value) + '%';
      }
    });

    // 2. Send GameplayTag Events to Unreal
    document.getElementById('btn-recharge').addEventListener('click', function() {
      window.__SWUI__.send(JSON.stringify({
        type: 'navigation',
        tag: 'Ability.ShieldRecharge',
        payload: { amount: 25 }
      }));
    });
  </script>
</body>
</html>
```

### Step 2: Create the `USwuiDocumentAsset` in Unreal
1. Open Unreal Editor.
2. In the Content Browser, right-click in `Content/UI/` -> **Miscellaneous** -> **SWUI UI Document**.
3. Name it `DA_HUD`.
4. Open `DA_HUD` and configure:
   - **Document Id**: `MainHUD`
   - **Entry URL**: `UI/hud.html`
   - **Layer**: `Level`
   - **Z-Order**: `10`
   - **Load Behavior**: `Eager`
   - **Is Transparent**: `true`

### Step 3: Activate in Blueprints
In your **Level Blueprint** or **PlayerController**:
1. Get Subsystem: **Get SwuiDocumentManagerSubsystem**.
2. Call **Load Document Asset** (pass `DA_HUD`).
3. Call **Activate Document** (`MainHUD`).
4. To update shield: Call **Set State Number** (`Key: "PlayerShield"`, `NumberValue: 75.0`).
5. To react to the button: Bind an event to **On Navigation Event**. When `EventTag` equals `Ability.ShieldRecharge`, run your gameplay logic!

Press **Play in Editor (PIE)** — your HTML HUD appears immediately, with crisp rendering and full click interaction!

---

## 4. Path B: Modern Framework Quickstart (React, Vue, Svelte)

For large production games, SWUI provides the `@swui/*` SDK monorepo and CLI.

### Step 1: Install the SWUI SDK
In your web project directory (e.g. `WebUI/`):

```bash
# Core framework-agnostic client
npm install @swui/core

# If using React:
npm install @swui/react

# If using Vue:
npm install @swui/vue

# If using Svelte:
npm install @swui/svelte
```

### Step 2: Build a Reactive React HUD
```tsx
import React from 'react';
import { useSwuiState, useSwuiEvent } from '@swui/react';

export function HUD() {
  // Automatically hydrates from Unreal and re-renders on frame sync
  const health = useSwuiState<number>('PlayerHealth', 100);
  const ammo = useSwuiState<number>('Ammo', 30);

  // Helper to emit GameplayTags to Unreal
  const reload = useSwuiEvent('Weapon.Reload');

  return (
    <div className="hud-root">
      <div className="vitals">
        <span>HP: {health}</span>
        <div className="bar" style={{ width: `${health}%` }} />
      </div>

      <div className="weapon">
        <span>AMMO: {ammo}</span>
        <button onClick={() => reload({ fast: true })}>RELOAD</button>
      </div>
    </div>
  );
}
```

### Step 3: Production Build
Compile your web project using Vite or the SWUI CLI:
```bash
npx swui build --production
```
Point your `USwuiDocumentAsset`'s `EntryURL` to the built `dist/index.html` file (e.g. `UI/MyReactApp/dist/index.html`).

---

## 5. Document Layers & Z-Ordering

SWUI 3.0 organizes web documents across three distinct functional layers:

| Layer | Enum Value | Intended Usage | Persistence |
|---|---|---|---|
| **Persistent** | `ESwuiDocumentLayer::Persistent` | Watermarks, Network/Ping monitors, global notifications, persistent chat | **Survives map travel** (retained across level loads) |
| **Level** | `ESwuiDocumentLayer::Level` | In-game HUD, minimap, crosshairs, objective trackers | **Unloaded automatically** on level transition |
| **Modal** | `ESwuiDocumentLayer::Modal` | Pause menu, inventory, skill trees, settings screens, dialogue | **Unloaded automatically** on level transition |

### Recommended Z-Order Convention:
- `0 - 9`: Background / persistent overlays
- `10 - 49`: Gameplay HUD elements (vitals, hotbar, radar)
- `50 - 99`: Floating markers / contextual prompts
- `100 - 199`: Interactive game windows (Inventory, Character Sheet, Map)
- `200 - 299`: System menus (Pause Menu, Options, Confirm Dialogs)
- `300+`: Critical system modals (Fatal error popups, connection dropped)

---

## 6. Document Lifecycle State Machine

Each document progresses through deterministic lifecycle states:

```
[Unloaded]
    │
    ▼ (Load / Preload)
[Preloaded] ◄──────────────┐
    │                      │
    ▼ (Activate)           │ (Deactivate)
 [Active] ─────────────► [Sleeping]
    │                      │
    └──────────┬───────────┘
               ▼ (Unload)
          [Unloaded]
```

- **`Load(World)` / `Preload()`**: Initializes the CEF Chromium instance and loads the HTML/JS into memory. Does *not* add the widget to the viewport.
- **`Activate(OverrideZOrder)`**: Mounts the document's widget to the viewport, wakes Chromium's renderer loop (`WasHidden(false)`), and immediately pushes current global state.
- **`Deactivate()`**: Removes the widget from the viewport. If sleep is enabled, freezes Chromium ticking.
- **`Sleep()`**: Calls Chromium's `WasHidden(true)` and pauses scheduler timers to reclaim 100% of CPU and GPU rendering time.
- **`Wake()`**: Calls `WasHidden(false)` and forces a visual repaint (`PET_VIEW`).
- **`Unload()`**: Explicitly destroys the CEF browser host, releases GPU DirectX shared textures, and deletes the Slate widget.

---

## 7. Key Best Practices for Game Web UI

1. **Always use transparent backgrounds**: Add `background: transparent;` in CSS and set `bIsTransparent = true` on your `USwuiDocumentAsset`.
2. **Prevent page scrolling**: Set `overflow: hidden; width: 100vw; height: 100vh;` on `body`.
3. **Disable text selection**: Set `user-select: none;` on elements that are not text inputs to prevent accidental blue highlight drag-boxes during fast gameplay.
4. **Use `rem` or flexbox for responsive scaling**: Unreal viewports can range from 1080p to 4K Ultrawide; avoid rigid absolute pixel positions where proportional layout is appropriate.
5. **Always build for production before shipping**: Never ship development bundles with hot-module reloaders (`localhost:5173`) in packaged game builds. Always run `swui build --production` to eliminate development server overhead.
