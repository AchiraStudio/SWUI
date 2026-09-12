# SWUI 3.0: Recipes, Workflows & Practical Guides

This guide provides tested, production-ready recipes for the most common game UI workflows in SWUI 3.0.

---

## Recipe 1: Building a Gameplay HUD + Modal Inventory

A common requirement is having an in-game HUD that stays visible during gameplay, and an Inventory screen that opens on keypress (`I`), captures mouse and keyboard input, and closes on `Escape`.

### 1. File Setup
Place two files in `Content/UI/`:
- `Content/UI/hud.html`
- `Content/UI/inventory.html`

### 2. Create the Data Assets
In Content Browser, create two `USwuiDocumentAsset` assets:

1. **`DA_MainHUD`**:
   - `DocumentId`: `MainHUD`
   - `EntryURL`: `UI/hud.html`
   - `Layer`: `Level`
   - `ZOrder`: `10`
   - `LoadBehavior`: `Eager`
   - `bIsTransparent`: `true`

2. **`DA_Inventory`**:
   - `DocumentId`: `Inventory`
   - `EntryURL`: `UI/inventory.html`
   - `Layer`: `Modal`
   - `ZOrder`: `100`
   - `LoadBehavior`: `Lazy` (or `Eager` for instant opening)
   - `bIsTransparent`: `true`
   - `bEnableSleep`: `true` (saves 100% of GPU/CPU when closed)

### 3. Blueprint Implementation (PlayerController)

```
[Event BeginPlay]
  │
  ├─► [Get SwuiDocumentManagerSubsystem]
  │     │
  │     ├─► [Load Document Asset (DA_MainHUD)]
  │     └─► [Activate Document ("MainHUD")]
  │
  └─► [Bind Event to OnNavigationEvent] (Connect to custom event: HandleUINavEvent)
```

```
[Input Action: ToggleInventory (Key: I or Tab)]
  │
  ├─► [Get SwuiDocumentManagerSubsystem]
  │     │
  │     └─► [Get Document ("Inventory")]
  │           │
  │           ├─► [Get State] == Active?
  │                 ├── TRUE:
  │                 │     ├─► [Deactivate Document ("Inventory")]
  │                 │     ├─► [Set Show Mouse Cursor: false]
  │                 │     └─► [Set Input Mode Game Only]
  │                 │
  │                 └── FALSE:
  │                       ├─► [Activate Document ("Inventory", OverrideZOrder: 100)]
  │                       ├─► [Set Show Mouse Cursor: true]
  │                       └─► [Set Input Mode Game and UI]
```

### 4. Handling Inventory Actions in Unreal
When the player clicks an item inside `inventory.html`, the HTML sends:
```js
window.__SWUI__.send(JSON.stringify({
  type: "navigation",
  tag: "UI.Inventory.UseItem",
  payload: { itemId: "health_potion", slot: 2 }
}));
```

Inside your `HandleUINavEvent` Blueprint event:
1. Check `EventTag == UI.Inventory.UseItem`.
2. Extract the `PayloadJson` using **Parse JSON** or your inventory function.
3. Apply health to the character.
4. Update the inventory state:
   ```
   [Get SwuiDocumentManagerSubsystem] -> [Set State ("InventoryData", NewInventoryJson)]
   ```
5. `inventory.html` updates its grid instantly!

---

## Recipe 2: Zero-Stutter Level Transitions (Preloading)

Loading heavy web bundles, 3D CSS animations, or high-res UI assets during level gameplay can cause micro-stutters. SWUI 3.0 provides zero-stutter background preloading.

### Workflow:
1. When your game enters a loading screen or level travel:
   ```cpp
   // C++
   USwuiDocumentManagerSubsystem* DocMgr = GetGameInstance()->GetSubsystem<USwuiDocumentManagerSubsystem>();
   DocMgr->PreloadDocument(FName("Level02HUD"));
   ```
   *In Blueprints: Call `Preload Document ("Level02HUD")`.*
2. Unreal creates the CEF browser and loads HTML/assets **in the background**. The widget is not yet attached to the viewport, so no rendering happens on screen.
3. Once the level finishes loading and the screen fades in:
   ```cpp
   DocMgr->ActivateDocument(FName("Level02HUD"));
   ```
4. The HUD appears instantly at 60+ FPS with zero shader compilation or layout hitch!

---

## Recipe 3: Pause Menu with Game Pausing

When pausing a single-player game, you want the Unreal world to freeze, but the Web UI to remain fully interactive and animated.

### Blueprint Setup:
1. **On Pause Pressed (Escape)**:
   ```
   [Set Game Paused: true]
   [Get SwuiDocumentManagerSubsystem] -> [Activate Document ("PauseMenu", OverrideZOrder: 200)]
   [Set Show Mouse Cursor: true]
   [Set Input Mode UI Only (or Game and UI)]
   ```
2. **Inside `pause_menu.html`**:
   The Resume button emits:
   ```js
   window.__SWUI__.send(JSON.stringify({
     type: "navigation",
     tag: "UI.Menu.Resume"
   }));
   ```
3. **In Blueprint `OnNavigationEvent`**:
   ```
   When EventTag == UI.Menu.Resume:
   [Get SwuiDocumentManagerSubsystem] -> [Deactivate Document ("PauseMenu")]
   [Set Game Paused: false]
   [Set Show Mouse Cursor: false]
   [Set Input Mode Game Only]
   ```

*Note: Even though the Unreal Game World is paused, `USwuiDocumentManagerSubsystem` implements `FTickableGameObject` with `TickableWhenPaused = true`, so UI animations, buttons, and sounds continue playing smoothly!*

---

## Recipe 4: Using the `USwui` Actor Component Facade

If you have an in-world interactive screen (like a sci-fi computer terminal or cockpit dashboard attached to an actor in the 3D level):

1. Add a `USwui` component to your Actor.
2. In the Details panel, assign the `Document Asset` property to your `USwuiDocumentAsset` (e.g. `DA_TerminalScreen`).
3. Set `RenderMode` to `CpuCompatible` or `GpuAccelerated`.
4. The `USwui` component automatically registers and coordinates with `USwuiDocumentManagerSubsystem`, while applying the rendered `UTexture2D` directly to your actor's Dynamic Material Instance (`TextureParameterName`)!

---

## Recipe 5: Diagnostic Profiling & Troubleshooting

When troubleshooting UI performance or unexpected behavior:

### Useful Console Variables (CVars)

| Console Command | Value | Description |
|---|---|---|
| `swui.debug.Stats 1` | `1` / `0` | Prints periodic telemetry to Output Log: Browser FPS, Presented FPS, Paint-to-Present latency, state flushes. |
| `swui.verbosePaint 1` | `1` / `0` | Logs all OnPaint and texture upload dimensions. |
| `swui.hud.Lockstep 1` | `1` / `0` | Forces CEF frame production to lockstep with Unreal Engine frames. |
| `swui.hud.MaxBrowserFPS 60` | Number | Caps maximum browser rendering rate (defaults to 60 FPS). |
| `swui.cefMessageLoopBudgetMs 2` | Float | Maximum game-thread time (ms) allowed for pumping CEF per tick (default: 1.5ms). |

### Common Gotchas & Fixes

1. **Why is my UI background solid black or white instead of transparent?**
   - In CSS, ensure `body { background: transparent; }`.
   - On the `USwuiDocumentAsset`, ensure `bIsTransparent = true`.
2. **Why does my UI not receive keyboard typing in text fields?**
   - Ensure the document's widget has focus or pointer input is enabled (`SetPointerInputEnabled(true)`).
   - Ensure you clicked inside the `<input>` element to trigger focus.
3. **Why do I see a warning about "Development dev-server detected"?**
   - You loaded a URL pointing to `http://localhost:5173` or an unbundled dev server.
   - For shipping builds, run `npx swui build --production` to compile to static HTML/JS files in `Content/UI/`.
