# SWUI 3.0: Vanilla Multi-Document Template

This template demonstrates how to build a complete multi-document game UI using **100% native HTML, CSS, and Vanilla JavaScript** — with **zero npm dependencies, zero Node.js, and zero build steps**.

---

## What is Included

1. **`hud.html`** (HUD / Gameplay Layer)
   - Semi-transparent, click-through gameplay HUD.
   - Listens to Unreal Engine state changes (`PlayerHealth`, `PlayerShield`, `Ammo`) via standard DOM events:
     ```js
     document.addEventListener('swui:stateChange', (e) => {
       const { key, value } = e.detail;
       // update DOM elements
     });
     ```
2. **`inventory.html`** (Modal / Window Layer)
   - Interactive modal window with item grid and search filter.
   - Demonstrates text input: typing in `<input type="text">` works seamlessly via SWUI's Win32 keyboard forwarder.
   - Emits navigation events back to Unreal:
     ```js
     window.__SWUI__.send(JSON.stringify({
       type: "navigation",
       tag: "UI.Inventory.EquipItem",
       payload: { itemId: "plasma_rifle" }
     }));
     ```
3. **`pause_menu.html`** (Modal / Menu Layer)
   - Full-screen pause menu with blur backdrop.
   - Buttons dispatch GameplayTags directly to Unreal Blueprint listeners.

---

## How to Use in Your Unreal Project

### 1. Copy Files
Copy the `.html` files into your project's Content directory:
```
YourProject/Content/UI/
├── hud.html
├── inventory.html
└── pause_menu.html
```

### 2. Create `USwuiDocumentAsset` Data Assets
In Unreal Engine Content Browser, right-click -> **Miscellaneous** -> **SWUI UI Document**:

| Asset Name | Document Id | Entry URL | Layer | Z-Order | Load Behavior |
|---|---|---|---|---|---|
| `DA_HUD` | `MainHUD` | `UI/hud.html` | `Level` | `10` | `Eager` |
| `DA_Inventory` | `Inventory` | `UI/inventory.html` | `Modal` | `100` | `Lazy` |
| `DA_PauseMenu` | `PauseMenu` | `UI/pause_menu.html` | `Modal` | `200` | `Lazy` |

### 3. Control in Blueprints or C++

#### Show / Hide Documents
In your GameMode, PlayerController, or Level Blueprint:
- **To Show HUD**: Call `USwuiDocumentManagerSubsystem -> ActivateDocument("MainHUD")`.
- **To Open Inventory**: Call `USwuiDocumentManagerSubsystem -> ActivateDocument("Inventory")`.
- **To Close Inventory**: Call `USwuiDocumentManagerSubsystem -> DeactivateDocument("Inventory")`.

#### Push State from Unreal
- Call `USwuiDocumentManagerSubsystem -> SetStateNumber("PlayerHealth", 85.0)`.
- Call `USwuiDocumentManagerSubsystem -> SetStateNumber("Ammo", 28.0)`.
- Any document listening for those keys automatically updates on the very next frame tick.

#### Listen for Navigation Events from HTML
- Bind an event to `USwuiDocumentManagerSubsystem -> OnNavigationEvent`.
- When the player clicks an item or button in HTML, your Blueprint event receives the `EventTag` (e.g. `UI.Inventory.EquipItem`) and `PayloadJson`!
