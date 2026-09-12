# SWUI Documentation

## SWUI 3.0 Guides & Architecture (Current)

- [**SWUI 3.0 Getting Started Guide**](SWUI_3_0_GETTING_STARTED.md) — 5-minute quickstart for Vanilla HTML/CSS and Modern Frameworks (React, Vue, Svelte), core mental model, document layers, and lifecycle states.
- [**SWUI 3.0 Systems & Runtime Architecture**](SWUI_3_0_SYSTEMS_AND_ARCHITECTURE.md) — Deep dive into GPU shared texture rendering, external begin-frames, state bus atomic batching, multi-document Z-order hit-testing, and deterministic memory shutdown.
- [**SWUI 3.0 Recipes, Workflows & Practical Guides**](SWUI_3_0_RECIPES_AND_WORKFLOWS.md) — Production recipes: Gameplay HUD + Modal Inventory, zero-stutter background preloading, pause menus with game pausing, actor component facades, and troubleshooting.

---

## Legacy Reference & Architecture (v2.x Foundations)

## Directory map

| Path | Purpose |
|---|---|
| `architecture/` | How SWUI internals work (data flow, design decisions, tricky parts) |
| `usage/` | How a game project uses each feature (game-facing examples) |
| `adr/` | Architecture Decision Records — why we chose certain approaches |

## Performance & Architecture docs

- [CSS & Web Performance Guide](css-performance.md) — "Never sacrifice the game's frame", CSS tiers, DOM containment, profiler workflow & benchmark
- [Navigation events](architecture/navigation-events.md) — typed JS→UE command channel, GameplayTag identity, PayloadStruct schema
- [Delegate payloads](architecture/delegate-payloads.md) — serializing delegate params through ProcessEvent and SignatureFunction
- [CEF input forwarding](architecture/cef-input-forwarding.md) — making HTML form controls work via SendKeyEvent
- [Text input focus](architecture/text-input-focus.md) — DOM focus bridge for bTextInputFocused
- [Binding system](architecture/binding-system.md) — how SWUI discovers observed sources
- [Map travel and rebinding](architecture/map-travel-and-rebinding.md) — what survives and what needs re-binding

## Usage docs

- [Observed state](usage/observed-state.md) — syncing UPROPERTY values to React
- [Observed delegates](usage/observed-delegates.md) — UE delegate → React CustomEvent
- [Typed navigation payloads](usage/typed-navigation-payloads.md) — defining typed JS→UE commands
- [React input fields](usage/react-input-fields.md) — HTML form controls inside SWUI
- [Binding sources](usage/binding-sources.md) — configuring what SWUI observes

## The standard template

When adding a new doc, use this structure:

```markdown
# Feature name

## What this solves

## Mental model

## Source of truth

## Runtime flow

## Important files

## How to use it

## Gotchas

## Debug checklist
```
