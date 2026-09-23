# SWUI (SimpleWebUI) 3.0

[![Unreal Engine](https://img.shields.io/badge/Unreal%20Engine-5.8%2B-blue.svg)](https://www.unrealengine.com/)
[![Version](https://img.shields.io/badge/SWUI-3.0.0-orange.svg)](https://swui.pages.dev/)
[![Website](https://img.shields.io/badge/Website-swui.pages.dev-brightgreen.svg)](https://swui.pages.dev/)
[![License](https://img.shields.io/badge/License-MIT%20%2F%20BSD--3--Clause-blue.svg)](LICENSE)

**SWUI 3.0** is an enterprise-grade, high-performance Web UI framework for **Unreal Engine 5.8+** powered by the Chromium Embedded Framework (CEF) and Direct3D 11 GPU Shared Textures.

Build HUDs, modal inventories, pause menus, interactive sci-fi terminals, and game tools using modern web technologies—**TypeScript, React, Vue, Svelte, HTML5, CSS3, and Vite**—with native Unreal Engine gameplay wiring, zero-copy GPU compositing, and rock-solid frame pacing.

> **Official Website & Live Interactive Demos**: [https://swui.pages.dev/](https://swui.pages.dev/)

---

## 🌐 Explore the Live Website

Experience live interactive demonstrations of SWUI 3.0 directly in your browser:

| Section | Link | Description |
| :--- | :--- | :--- |
| 🚀 **Product Overview** | [swui.pages.dev/#/product](https://swui.pages.dev/#/product) | Architectural highlights, zero-copy D3D11 shared textures, true Chromium sleep mode, and input arbitration. |
| 🏛️ **Architecture & ADRs** | [swui.pages.dev/#/architecture](https://swui.pages.dev/#/architecture) | 5-layer engine stack, `USwuiDocumentManagerSubsystem`, level travel lifecycle, and architectural decision records. |
| 🎮 **Production Recipes** | [swui.pages.dev/#/examples](https://swui.pages.dev/#/examples) | Interactive playable demos: Modal HUD + Inventory, Paused-World menus, Zero-stutter level preloading, and 3D in-world mesh terminals. |
| 📦 **SDK & Physics Lab** | [swui.pages.dev/#/sdk](https://swui.pages.dev/#/sdk) | Searchable API explorer, live 2-way state publisher, game-time telemetry scope, and interactive spring physics canvas. |
| 📋 **Technical Reference** | [swui.pages.dev/#/reference](https://swui.pages.dev/#/reference) | Searchable reference covering C++ Subsystem methods, K2 Blueprint Nodes, Console Variables (CVars), and TypeScript hooks. |
| 📊 **Profiling & Diagnostics** | [swui.pages.dev/#/profiling](https://swui.pages.dev/#/profiling) | Real-time dual-curve oscilloscope, PCIe dirty-rect bandwidth calculator (98.5% savings), and copyable CVars workbench. |
| 📖 **Documentation** | [swui.pages.dev/#/docs/getting-started](https://swui.pages.dev/#/docs/getting-started) | 22 comprehensive guides spanning quickstart, input forwarding, delegate reflection, and multi-document workflows. |

---

## 💡 Why SWUI 3.0?

Traditional game UI authoring in Unreal Engine often requires cumbersome manual plumbing:
- Hand-crafting JSON strings and parsing payloads in Blueprints.
- Fragile stringly-typed event names between C++ and JavaScript.
- Micro-stutters and frame drops when heavy UI bundles are loaded during gameplay.
- Menus freezing when single-player games call `SetGamePaused(true)`.
- Wasted GPU and CPU rendering cycles on hidden or modal menus.

**SWUI 3.0 eliminates this plumbing:**

> **Build UI like a modern web application. Wire it like a native Unreal Engine system.**

```text
Unreal Engine (C++ / Blueprints / Subsystems)
   ▲                                 │
   │ [Typed Struct Pins]             │ [State Bus Atomic Batch]
   │ K2Node_SwuiNavigationEvent      │ UPROPERTY / Delegate Reflection
   │                                 ▼
   └─────────── SWUI 3.0 Subsystems & CEF Bridge ───────────┘
                                     │
                                     ▼
        Web UI: React · Vue · Svelte · TypeScript · HTML5 / CSS3
```

---

## ⚡ Key Architectural Highlights

### 1. Multi-Document Coordinator (`USwuiDocumentManagerSubsystem`)
Coordinate multiple independent web documents simultaneously across dedicated presentation layers:
- **`Level`**: Main gameplay HUDs, reticles, radar, dialogue boxes (Z-Order: 0–99).
- **`Modal`**: Inventory screens, skill trees, pause menus, popups with full input capture (Z-Order: 100–199).
- **`Persistent`**: Loading screens, transition overlays, and cross-level travel managers.
- **`World`**: Diegetic 3D in-world surfaces, vehicle cockpits, and interactive terminals.

### 2. Direct GPU Shared Texture Pipeline (Zero-Copy)
On Windows (x64 / ARM64), SWUI leverages Direct3D 11 shared texture handles via DXGI. The offscreen Chromium compositor writes directly to shared VRAM textures imported by Unreal's Slate renderer—**completely bypassing CPU memory copying** for minimal latency and maximum frame rates. A robust CPU memory fallback ensures cross-platform support.

### 3. Hybrid Dirty-Rect Rasterization (98.5% PCIe Bandwidth Savings)
Instead of transferring entire 1080p (8.3 MB) or 4K (33.2 MB) frames every tick, SWUI 3.0 subdivides the viewport into tiles. Only modified regions (e.g. crosshair spread or ammo counter updates) are uploaded to VRAM, reducing PCIe bandwidth usage to ~124 KB per frame.

### 4. Tickable When Paused
When pausing a single-player game with `UGameplayStatics::SetGamePaused(true)`, the 3D world, actors, and physics freeze. Because `USwuiDocumentManagerSubsystem` implements `FTickableGameObject` with `TickableWhenPaused = true`, web UI menus, audio, CSS animations, and gamepad navigation continue ticking smoothly at locked 60 FPS.

### 5. True Chromium Sleep Mode (`bEnableSleep`)
Modal documents (like inventories or quest logs) can enable `bEnableSleep = true` on their `USwuiDocumentAsset`. When deactivated, SWUI calls Chromium's `WasHidden()`, immediately halting JavaScript timers, requestAnimationFrame loops, and GPU rasterization—**reducing idle UI overhead to 0% GPU/CPU**.

### 6. Strongly-Typed Navigation & Delegate Reflection
- **`K2Node_SwuiNavigationEvent`**: Compile-time expanded Blueprint node that automatically deserializes incoming JavaScript JSON payloads into strongly-typed `UScriptStruct` pins.
- **`USwuiDelegateBridge`**: Overrides `UObject::ProcessEvent` to automatically serialize dynamic multicast delegate parameters into JSON `CustomEvent`s without manual bridge code.

### 7. Native Slate Keyboard & Input Preprocessor
`FSwuiInputPreprocessor` intercepts Slate input and transparently forwards keyboard keystrokes (`SendKeyEvent`) and character events (`KEYEVENT_CHAR`) into Chromium. HTML form controls (`<input>`, `<textarea>`, `<select>`) receive full keyboard typing, backspace, and text selection inside the game engine.

---

## 🚀 Quickstart: 5-Minute Setup

### 1. Place Web Assets in Content Folder
Place your compiled web assets or HTML files in `Content/UI/`:
```text
MyProject/
└── Content/
    └── UI/
        ├── hud.html
        └── inventory.html
```

### 2. Create a `USwuiDocumentAsset`
In Unreal Engine's Content Browser:
1. Right-click → **Miscellaneous** → **Data Asset** → select `USwuiDocumentAsset`.
2. Name it `DA_MainHUD`.
3. Configure the properties:
   - **DocumentId**: `MainHUD`
   - **EntryURL**: `UI/hud.html` (or `UI/dist/index.html`)
   - **Layer**: `Level`
   - **ZOrder**: `10`
   - **LoadBehavior**: `Eager`
   - **bIsTransparent**: `true`

### 3. Load & Activate via Blueprint or C++

```cpp
// In your PlayerController or GameMode:
USwuiDocumentManagerSubsystem* DocMgr = 
    GetGameInstance()->GetSubsystem<USwuiDocumentManagerSubsystem>();

// 1. Load Data Asset
DocMgr->LoadDocumentAsset(DA_MainHUD);

// 2. Activate into Viewport
DocMgr->ActivateDocument(FName("MainHUD"));
```

In Blueprints:
```text
[Event BeginPlay]
  │
  ├─► [Get SwuiDocumentManagerSubsystem]
  │     │
  │     ├─► [Load Document Asset (DA_MainHUD)]
  │     └─► [Activate Document ("MainHUD")]
```

### 4. Send & Receive Messages in JavaScript / TypeScript

```html
<!-- Inside Content/UI/hud.html -->
<!doctype html>
<html>
<head>
  <style>body { background: transparent; margin: 0; color: white; font-family: sans-serif; }</style>
</head>
<body>
  <h1>Health: <span id="hp">100</span></h1>
  <button id="useBtn">Use Medkit</button>

  <script>
    // 1. Listen to Unreal state changes
    swui.on('Player.Health', (newHealth) => {
      document.getElementById('hp').textContent = newHealth;
    });

    // 2. Send navigation command to Unreal
    document.getElementById('useBtn').addEventListener('click', () => {
      window.__SWUI__.send(JSON.stringify({
        type: 'navigation',
        tag: 'UI.Inventory.UseItem',
        payload: { itemId: 'medkit_01', slot: 1 }
      }));
    });
  </script>
</body>
</html>
```

---

## 🛠️ TypeScript SDK Monorepo (`@swui/*`)

For teams building complex applications with React, Vue, or Svelte, SWUI 3.0 provides a first-party TypeScript monorepo under `sdk/`:

```bash
# Install core runtime
npm i @swui/core

# Or install framework integrations
npm i @swui/react
npm i @swui/vue
npm i @swui/svelte

# Development CLI & build tool
npm i -D @swui/cli
```

### React Example
```tsx
import { useSwuiState, useSwuiEvent } from '@swui/react';

export function PlayerHUD() {
  const health = useSwuiState<number>('Player.Health', 100);
  const ammo   = useSwuiState<number>('Weapon.CurrentAmmo', 30);
  
  useSwuiEvent('Weapon.Reload', () => {
    console.log('Reload animation triggered!');
  });

  return (
    <div className="hud">
      <div className="hp-bar" style={{ width: `${health}%` }} />
      <span className="ammo-count">{ammo}</span>
    </div>
  );
}
```

---

## 💻 Platform Support (Unreal Engine 5.8+)

| Platform | Rendering Backend | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Windows x64** | Direct3D 11 Shared Texture | ✅ Supported | Primary target; zero-copy GPU shared texture pipeline. |
| **Windows ARM64** | Direct3D 11 Shared Texture | ✅ Supported | Supported on ARM64 Windows desktop devices. |
| **macOS (Apple Silicon / Intel)** | Off-screen CPU Blit | ✅ Supported | Native CEF desktop runtime. |
| **Linux (x86_64)** | Off-screen CPU Blit | ✅ Supported | Desktop CEF runtime for Linux clients. |
| **Consoles / Mobile** | — | ❌ Not Supported | Embedded CEF is not supported on console or mobile operating systems. |

---

## 📚 Complete In-Repository Documentation

- [**SWUI 3.0 Getting Started Guide**](Docs/SWUI_3_0_GETTING_STARTED.md) — Quickstart for Vanilla HTML/CSS, React, Vue, and Svelte.
- [**SWUI 3.0 Systems & Runtime Architecture**](Docs/SWUI_3_0_SYSTEMS_AND_ARCHITECTURE.md) — GPU Shared Textures, Frame Pacing, State Bus, and Multi-Document Coordinator.
- [**SWUI 3.0 Recipes & Practical Workflows**](Docs/SWUI_3_0_RECIPES_AND_WORKFLOWS.md) — HUD + Modal Inventory, Pause Menus, Zero-Stutter Level Preload, and CVars profiling.
- [**Making a Pause Menu Guide**](Docs/Making-a-Pause-Menu.md) — Step-by-step tutorial on building a responsive pause menu with page-aware Cancel behavior.
- [**CSS Performance & Chromium Best Practices**](Docs/css-performance.md) — Optimizing CSS animations and avoiding layout thrashing in Chromium.
- [**Architecture Decision Records (ADRs)**](Docs/adr/) — Design rationale behind reflection, typed structs, and serialization.

---

## 📄 License & Credits

SWUI is licensed under the MIT / BSD-3-Clause license. Original license notices and credits are preserved in [CREDITS.md](CREDITS.md) and [LICENSE](LICENSE).

Derived from the BLUI / SimpleWebUI lineage, evolved and modernized for Unreal Engine 5.8+ and modern frontend web engineering.
