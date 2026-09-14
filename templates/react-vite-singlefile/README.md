# SWUI Modern React + Vite Single-File Starter Template

This template provides a battle-tested frontend development workflow for Unreal Engine and SimpleWebUI (SWUI).

## Key Architecture & Features

1. **CEF `file:///` Compatibility**: Uses `vite-plugin-singlefile` to bundle every document into a self-contained HTML file with scripts and styles fully inlined. This eliminates cross-origin module errors under CEF's local file schemes.
2. **Crash-Free In-DOM Controls**: Includes a custom `SelectDropdown` component that stays within the React DOM. This prevents Chromium Off-Screen Rendering (OSR) from firing native OS popups (`PET_POPUP`), preventing viewport texture destruction.
3. **Multi-Document Build Pipeline**: Pre-configured `build-all.js` script that compiles multiple independent pages (`hud.html`, `pause_menu.html`, etc.) into your Unreal project's `Content/UI/` directory with a single command.
4. **Reactive State & Events**: Pre-wired with `@swui/core` and `@swui/react` hooks (`useSwuiState`, `useSwuiEvent`, `postMessage`).

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
Run the Vite development server for rapid iteration in a standard desktop browser:
```bash
npm run dev
```

### 3. Build for Unreal Engine
Build all documents directly into your Unreal project's `Content/UI/` directory:
```bash
npm run build
```

The output bundles will be ready to load in your `USwuiDocument` components:
- `file:///.../Content/UI/hud.html`
- `file:///.../Content/UI/pause_menu.html`

