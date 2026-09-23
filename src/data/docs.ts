export interface DocItem {
  id: string
  title: string
}

export interface DocCategory {
  category: string
  items: DocItem[]
}

export interface DocContent {
  t: string
  m: string
  h: string
}

export const DOCNAV: [string, [string, string][]][] = [
  ['GETTING STARTED', [
    ['getting-started', 'Quickstart (UE 5.8.3)'],
    ['installation', 'Installation & Setup'],
    ['vanilla', 'Vanilla HTML/CSS Path'],
  ]],
  ['CORE CONCEPTS', [
    ['documents', 'Multi-Document Engine'],
    ['lifecycle', 'Document Lifecycle & States'],
    ['state', 'State Bus & Atomic Batching'],
    ['events', 'Two-Way Events & Tags'],
    ['delegate-payloads', 'Delegate Payloads & C++ Bridge'],
  ]],
  ['RUNTIME & HARDWARE', [
    ['rendering', 'Direct3D 11 GPU Shared Textures'],
    ['pacing', 'Frame Pacing & Compositing'],
    ['memory-cleanup', 'Deterministic Lifecycle & Cleanup'],
  ]],
  ['INPUT & INTERACTION', [
    ['input-routing', 'Input Preprocessing & Focus'],
    ['react-input-fields', 'React Input Controls'],
    ['navigation', 'Gamepad & Menu Navigation'],
  ]],
  ['FRAMEWORKS & SDK', [
    ['react', 'React 18 Integration'],
    ['vue-svelte', 'Vue 3 & Svelte Stores'],
    ['cli', 'SWUI CLI & Production Build'],
  ]],
  ['PRACTICAL RECIPES', [
    ['recipe-hud-inventory', 'HUD + Modal Inventory'],
    ['recipe-pause-menu', 'Pause Menu with World Paused'],
    ['recipe-preloading', 'Zero-Stutter Level Preloading'],
    ['recipe-in-world-screens', '3D In-World Mesh Screens'],
  ]],
  ['TOOLS & PROFILING', [
    ['profiling', 'Diagnostic CVars & Profiling'],
    ['troubleshooting', 'Troubleshooting & Gotchas'],
  ]],
];

export const DOCS: Record<string, DocContent> = {
  'getting-started': {
    t: 'Getting Started with SWUI 3.0',
    m: '5 min · Unreal Engine 5.8.3',
    h: `
<p>SWUI is a high-performance web UI layer for Unreal Engine 5.8.3. It allows you to build game interfaces using standard browser technologies (HTML, CSS, JavaScript, TypeScript, React, Vue, Svelte) while keeping gameplay state, event dispatching, and runtime control firmly inside Unreal.</p>

<h2>Two Core Paths</h2>
<div class="table-wrap">
  <table style="width:100%;border-collapse:collapse;margin:16px 0;font:400 13px var(--mono)">
    <thead>
      <tr style="border-bottom:2px solid var(--ln);text-align:left">
        <th style="padding:8px">Path</th>
        <th style="padding:8px">Target Audience</th>
        <th style="padding:8px">Tooling</th>
        <th style="padding:8px">Setup Time</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom:1px solid var(--ln2)">
        <td style="padding:8px;color:var(--acc);font-weight:600">Path A: Vanilla HTML/CSS</td>
        <td style="padding:8px">Lightweight HUDs, prototyping, scripters</td>
        <td style="padding:8px">Zero (No Node.js, no npm)</td>
        <td style="padding:8px">2 minutes</td>
      </tr>
      <tr>
        <td style="padding:8px;color:var(--acc);font-weight:600">Path B: Modern Frameworks</td>
        <td style="padding:8px">Complex reactive UIs, design systems (React, Vue, Svelte, Vite)</td>
        <td style="padding:8px">Node.js + @swui/* SDK</td>
        <td style="padding:8px">5 minutes</td>
      </tr>
    </tbody>
  </table>
</div>

<h2>Path A: 5-Minute Vanilla Quickstart</h2>
<ol>
  <li><b>Create your HTML file</b>: In your project's <code>Content/UI/</code> folder, create <code>hud.html</code>.</li>
  <li><b>Create the USwuiDocumentAsset</b>: Right-click in Content Browser &rarr; <b>Miscellaneous</b> &rarr; <b>SWUI UI Document</b>. Name it <code>DA_HUD</code>.</li>
  <li><b>Configure DA_HUD</b>:
    <ul>
      <li><code>Document Id</code>: <code>MainHUD</code></li>
      <li><code>Entry URL</code>: <code>UI/hud.html</code></li>
      <li><code>Layer</code>: <code>Level</code></li>
      <li><code>Z-Order</code>: <code>10</code></li>
      <li><code>Load Behavior</code>: <code>Eager</code></li>
      <li><code>bIsTransparent</code>: <code>true</code></li>
    </ul>
  </li>
  <li><b>Activate in Blueprints</b>:
    <ul>
      <li>Get Subsystem: <code>Get SwuiDocumentManagerSubsystem</code></li>
      <li>Call <code>Load Document Asset (DA_HUD)</code></li>
      <li>Call <code>Activate Document ("MainHUD")</code></li>
    </ul>
  </li>
  <li><b>Update State</b>: Call <code>Set State Number ("PlayerHealth", 100.0)</code> from Unreal.</li>
  <li><b>Receive Events</b>: Bind to <code>On Navigation Event</code> to react when web buttons emit GameplayTags!</li>
</ol>

<div class="callout"><svg><use href="#i-zap"/></svg><p>No bundler or framework required for Path A — a single HTML file is a complete, transparent, layered in-game UI document.</p></div>
`
  },

  'installation': {
    t: 'Installation & Setup',
    m: 'plugin · UE 5.8.3 · npm',
    h: `
<p>SWUI is structured as an Unreal Engine plugin with companion npm packages for modern frontend projects.</p>

<h2>1. Unreal Plugin Installation</h2>
<ol>
  <li>Clone or copy the <code>SWUI</code> repository into your project's <code>Plugins/</code> directory:
    <div class="sig">YourProject/Plugins/SimpleWebUI/</div>
  </li>
  <li>Open your project in Unreal Engine 5.8.3. When prompted, compile the plugin modules:
    <ul>
      <li><code>SwuiRuntime</code>: Core CEF browser host, DirectX shared texture presenter, state bus, input preprocessor.</li>
      <li><code>SwuiEditor</code>: Document Asset factory, details customizations, TypeScript contract generator.</li>
      <li><code>SwuiUncookedOnly</code>: Custom K2 Blueprint nodes (<code>K2Node_SwuiCommandHook</code>, <code>K2Node_SwuiObserve</code>).</li>
      <li><code>SwuiLoader</code>: Embedded CEF runtime bootstrap.</li>
    </ul>
  </li>
  <li>Enable the plugin under <b>Edit &rarr; Plugins &rarr; User Interface &rarr; SimpleWebUI</b>.</li>
</ol>

<h2>2. Desktop Platform Support (CEF Backend)</h2>
<div class="table-wrap">
  <table style="width:100%;border-collapse:collapse;margin:16px 0;font:400 13px var(--mono)">
    <thead>
      <tr style="border-bottom:2px solid var(--ln);text-align:left">
        <th style="padding:8px">Platform</th>
        <th style="padding:8px">Status</th>
        <th style="padding:8px">Notes</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom:1px solid var(--ln2)">
        <td style="padding:8px">Windows x64</td>
        <td style="padding:8px;color:var(--ok)">Primary Target</td>
        <td style="padding:8px">Hardware-accelerated D3D11 shared textures</td>
      </tr>
      <tr style="border-bottom:1px solid var(--ln2)">
        <td style="padding:8px">Windows ARM64</td>
        <td style="padding:8px;color:var(--warn)">Experimental</td>
        <td style="padding:8px">Requires ARM64 CEF build</td>
      </tr>
      <tr style="border-bottom:1px solid var(--ln2)">
        <td style="padding:8px">macOS</td>
        <td style="padding:8px;color:var(--ok)">Supported</td>
        <td style="padding:8px">Desktop CEF backend available</td>
      </tr>
      <tr>
        <td style="padding:8px">Linux</td>
        <td style="padding:8px;color:var(--warn)">Experimental</td>
        <td style="padding:8px">Desktop CEF backend available</td>
      </tr>
    </tbody>
  </table>
</div>

<h2>3. Frontend Packages (Optional)</h2>
<p>If building a modern web frontend with Vite, React, Vue, or Svelte:</p>
<div class="sig"># Core framework-agnostic client
npm i @swui/core

# Framework integrations
npm i @swui/react   # or @swui/vue · @swui/svelte

# Build CLI
npm i -D @swui/cli</div>
`
  },

  'vanilla': {
    t: 'Vanilla HTML/CSS/JS Path',
    m: 'zero-build · no node',
    h: `
<p>The simplest path for artists, technical designers, and scripters: one file, zero tooling. The embedded runtime automatically injects the <code>window.__SWUI__</code> global and dispatches native DOM events.</p>

<h2>Complete Single-File HUD Example</h2>
<div class="sig">&lt;!doctype html&gt;
&lt;html lang="en"&gt;
&lt;head&gt;
  &lt;meta charset="utf-8"&gt;
  &lt;style&gt;
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 100vw; height: 100vh; overflow: hidden;
      background: transparent; user-select: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: white;
    }
    .hud-box {
      position: absolute; bottom: 30px; left: 30px;
      background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px; padding: 12px 20px;
    }
    .label { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: bold; }
    .value { font-size: 28px; font-weight: 800; color: #38bdf8; }
    .btn {
      margin-top: 8px; padding: 6px 12px; background: #0284c7;
      border: none; border-radius: 4px; color: white; cursor: pointer;
    }
  &lt;/style&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;div class="hud-box"&gt;
    &lt;div class="label"&gt;Shield Power&lt;/div&gt;
    &lt;div class="value" id="shield-text"&gt;100%&lt;/div&gt;
    &lt;button class="btn" id="btn-recharge"&gt;Recharge&lt;/button&gt;
  &lt;/div&gt;

  &lt;script&gt;
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
  &lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;</div>
`
  },

  'documents': {
    t: 'Multi-Document Engine & Layers',
    m: 'layers · z-order · assets',
    h: `
<p>In SWUI 3.0, the UI is not a single giant web app. Instead, multiple independent web documents are concurrently managed by <code>USwuiDocumentManagerSubsystem</code>. Each document has its own CEF browser host (<code>USwuiView</code>), Slate widget, and lifecycle.</p>

<h2>Three Document Layers</h2>
<div class="table-wrap">
  <table style="width:100%;border-collapse:collapse;margin:16px 0;font:400 13px var(--mono)">
    <thead>
      <tr style="border-bottom:2px solid var(--ln);text-align:left">
        <th style="padding:8px">Layer</th>
        <th style="padding:8px">Intended Usage</th>
        <th style="padding:8px">Level Travel Persistence</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom:1px solid var(--ln2)">
        <td style="padding:8px;color:var(--acc);font-weight:600">Persistent</td>
        <td style="padding:8px">Watermarks, ping/network telemetry, global chat, persistent notifications</td>
        <td style="padding:8px"><b>Survives level travel</b> (not destroyed on map load)</td>
      </tr>
      <tr style="border-bottom:1px solid var(--ln2)">
        <td style="padding:8px;color:var(--acc);font-weight:600">Level</td>
        <td style="padding:8px">Gameplay HUD, minimap, crosshairs, objective trackers</td>
        <td style="padding:8px">Unloaded automatically on level transition</td>
      </tr>
      <tr>
        <td style="padding:8px;color:var(--acc);font-weight:600">Modal</td>
        <td style="padding:8px">Pause menu, inventory, character sheet, dialogue, settings</td>
        <td style="padding:8px">Unloaded automatically on level transition</td>
      </tr>
    </tbody>
  </table>
</div>

<h2>Recommended Z-Order Conventions</h2>
<ul>
  <li><b>0 &ndash; 9</b>: Background &amp; persistent system telemetry</li>
  <li><b>10 &ndash; 49</b>: Gameplay HUD (vitals, hotbars, radar)</li>
  <li><b>50 &ndash; 99</b>: Floating in-world markers &amp; contextual interaction prompts</li>
  <li><b>100 &ndash; 199</b>: Interactive game windows (Inventory, Map, Character Sheet)</li>
  <li><b>200 &ndash; 299</b>: System menus (Pause Menu, Options, Confirm Dialogs)</li>
  <li><b>300+</b>: Critical modals (Fatal error popups, connection dropped alerts)</li>
</ul>

<h2>USwuiDocumentAsset Properties</h2>
<p>Each document is defined by a <code>USwuiDocumentAsset</code> Data Asset containing:</p>
<ul>
  <li><code>DocumentId</code>: FName unique identifier (e.g. <code>MainHUD</code>, <code>Inventory</code>).</li>
  <li><code>EntryURL</code>: Path relative to Content folder or <code>local://</code> URL.</li>
  <li><code>Layer</code>: <code>ESwuiDocumentLayer::Level</code>, <code>Modal</code>, or <code>Persistent</code>.</li>
  <li><code>ZOrder</code>: Integer determining visual compositing and hit-testing priority.</li>
  <li><code>LoadBehavior</code>: <code>Eager</code> (loads at game start) or <code>Lazy</code> (loads on first activation).</li>
  <li><code>bIsTransparent</code>: Enables alpha channel blending with the 3D scene.</li>
  <li><code>bEnableSleep</code>: When hidden, suspends browser execution to save 100% CPU/GPU.</li>
</ul>
`
  },

  'lifecycle': {
    t: 'Document Lifecycle & States',
    m: 'states · preloading · sleep',
    h: `
<p>Every document operates as a deterministic finite-state machine governed by the subsystem:</p>

<div class="sig">[Unloaded]
   │
   ▼ (Load / Preload)
[Preloaded] ◄──────────────┐
   │                       │
   ▼ (Activate)            │ (Deactivate)
[Active] ─────────────► [Sleeping]
   │                       │
   └──────────┬────────────┘
              ▼ (Unload)
         [Unloaded]</div>

<h2>Lifecycle Operations</h2>
<ul>
  <li><b>Preload / Load</b>: Initializes the CEF Chromium instance and loads HTML/JS into memory in the background without attaching to the viewport. Eliminates frame hitches during gameplay.</li>
  <li><b>Activate(OverrideZOrder)</b>: Attaches the Slate widget to the viewport, wakes Chromium's renderer (<code>WasHidden(false)</code>), and flushes current global state.</li>
  <li><b>Deactivate()</b>: Detaches the widget from the viewport. If sleep is enabled, immediately triggers sleep.</li>
  <li><b>Sleep()</b>: Calls Chromium's <code>WasHidden(true)</code> and halts scheduler timers. Chromium stops executing <code>requestAnimationFrame</code>, pauses JavaScript timers (<code>setTimeout</code>/<code>setInterval</code>), and reclaims 100% of GPU rendering time.</li>
  <li><b>Wake()</b>: Calls <code>WasHidden(false)</code> and forces an immediate repaint (<code>PET_VIEW</code>).</li>
  <li><b>Unload()</b>: Immediately invokes <code>USwuiView::Shutdown()</code>, releasing DirectX shared texture handles and destroying CEF browser host objects without waiting for garbage collection.</li>
</ul>
`
  },

  'state': {
    t: 'State Bus & Atomic Batching',
    m: 'IPC · batching · zero-polling',
    h: `
<p>In traditional web UI integrations, game code calls <code>ExecuteJavaScript("state.health = 80")</code> for each modified property. At 60 FPS across dozens of fields, this causes serious performance degradation due to V8 string parsing stalls, repeated IPC round-trips, and layout thrashing.</p>

<h2>SWUI 3.0 Atomic Frame Batching</h2>
<p>SWUI 3.0 accumulates all state changes during a frame and flushes them as a single atomic batch at the start of each engine tick:</p>

<div class="sig">// 1. Game calls during the frame:
DocSubsystem-&gt;SetStateNumber(FName("PlayerHealth"), 80.0f);
DocSubsystem-&gt;SetStateNumber(FName("Ammo"), 25.0f);
DocSubsystem-&gt;SetStateNumber(FName("Shield"), 50.0f);

// 2. Flushed as ONE JSON batch before render:
{ "PlayerHealth": 80, "Ammo": 25, "Shield": 50 }</div>

<h2>Frontend Reception</h2>
<p>A single microtask applies all changes atomically:</p>
<div class="sig">(function(){
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
})();</div>

<p>Frontend frameworks (React 18, Vue 3, Svelte) batch all DOM changes into a single render pass without screen tearing or repeated microtask overhead.</p>

<h2>Engine Telemetry Exposed to State</h2>
<p>The state bus also exposes real engine timing: <code>fps</code>, <code>dt</code>, <code>time</code>, <code>frameIndex</code>, <code>stateVersion</code>, <code>cefFps</code>, <code>timeDilation</code>, and <code>paused</code> &mdash; allowing animations to be driven by game time rather than browser wall-clock time.</p>
`
  },

  'events': {
    t: 'Two-Way Events & GameplayTags',
    m: 'GameplayTags · bidirectional',
    h: `
<p>Events flow bidirectionally between Unreal Engine and web documents through structured GameplayTags rather than raw strings.</p>

<h2>1. Web &rarr; Unreal: Emitting GameplayTags</h2>
<p>From JavaScript, emit events using <code>window.__SWUI__.send()</code> or the SDK's <code>useSwuiEvent</code>:</p>

<div class="sig">// Vanilla
window.__SWUI__.send(JSON.stringify({
  type: 'navigation',
  tag: 'UI.Inventory.UseItem',
  payload: { itemId: 'health_potion', slot: 2 }
}));

// React SDK
const useItem = useSwuiEvent('UI.Inventory.UseItem');
useItem({ itemId: 'health_potion', slot: 2 });</div>

<h2>2. Receiving in Unreal (Blueprints / C++)</h2>
<p>In your <code>PlayerController</code> or Game Mode:</p>
<ol>
  <li>Get <code>USwuiDocumentManagerSubsystem</code>.</li>
  <li>Bind to <code>OnNavigationEvent</code> delegate.</li>
  <li>Switch on <code>EventTag</code> (e.g. <code>UI.Inventory.UseItem</code>).</li>
  <li>Parse <code>PayloadJson</code> or access reflected struct fields directly!</li>
</ol>

<h2>3. Unreal &rarr; Web: Reflected Delegates</h2>
<p>Any <code>UPROPERTY(BlueprintAssignable)</code> delegate declared in C++ or Blueprint is automatically forwarded to active documents as a typed <code>CustomEvent</code>.</p>
`
  },

  'delegate-payloads': {
    t: 'Delegate Payloads & C++ Bridge',
    m: 'C++ · reflection · ProcessEvent',
    h: `
<p>SWUI bridges Unreal dynamic multicast delegates to browser JavaScript. Rather than generating a custom C++ function for every delegate signature, SWUI implements an elegant reflection-driven bridge.</p>

<h2>How the ProcessEvent Override Works</h2>
<ol>
  <li>When a delegate is observed via <code>USwuiSubsystem::ObserveDelegate</code>, SWUI creates a <code>USwuiDelegateBridge</code> instance.</li>
  <li>It binds a generic hook function (<code>DelegateHook</code>) to the delegate.</li>
  <li>When Unreal invokes <code>Broadcast()</code> on the delegate, it calls <code>ProcessEvent(Bridge, HookFunction, &amp;Params)</code>.</li>
  <li>SWUI's <code>ProcessEvent</code> override intercepts the call and inspects the delegate's <code>SignatureFunction</code> metadata.</li>
  <li>It iterates each parameter property (<code>FProperty</code>), reading its name and offset from the raw <code>Parms</code> buffer.</li>
  <li>It serializes parameters into a JSON object matching the delegate's parameter names:
    <div class="sig">{ "bSuccess": true, "ErrorMessage": "" }</div>
  </li>
  <li>It dispatches a native <code>CustomEvent</code> into the DOM:
    <div class="sig">document.dispatchEvent(new CustomEvent("Online.OnRoomHostResult", { detail: json }));</div>
  </li>
</ol>

<div class="callout"><svg><use href="#i-zap"/></svg><p>Because the reflection metadata is generated by UHT from the same delegate declaration, runtime parameter names and types always match the generated TypeScript contracts.</p></div>
`
  },

  'rendering': {
    t: 'Direct3D 11 GPU Shared Textures',
    m: 'GPU zero-copy · DXGI · CPU fallback',
    h: `
<p>SWUI negotiates between two distinct presentation pipelines based on operating system capabilities and platform flags:</p>

<h2>1. GPU Direct3D 11 / DXGI Shared Textures (Primary)</h2>
<p>On Windows platforms with DirectX 11 support:</p>
<ol>
  <li>Chromium renders off-screen into an accelerated DirectX surface.</li>
  <li>CEF generates an NT shared resource handle (<code>HANDLE SharedHandle</code>).</li>
  <li><code>FSwuiGpuSharedTextureHelper</code> opens this shared handle directly on Unreal's RHI device (<code>ID3D11Device::OpenSharedResource</code>).</li>
  <li>On every <code>OnAcceleratedPaint</code> callback, Unreal executes a zero-copy GPU blit using RHI command lists (<code>CopySharedTexture</code>).</li>
  <li><b>Zero CPU memory staging</b>: Pixel bytes never touch system RAM or CPU caches. This achieves a rock-solid 60&ndash;120 FPS at 4K resolution with near-zero CPU usage.</li>
</ol>

<h2>2. CPU Full-Surface Renderer (Fallback)</h2>
<p>If GPU shared handles are unavailable or CPU mode is forced (<code>swui.forceCpuRenderer 1</code>):</p>
<ol>
  <li>Chromium writes BGRA8 pixel bytes into a system-memory buffer.</li>
  <li><code>FSwuiFullSurfaceCpuRenderer</code> stages the buffer across a double-buffered thread pool.</li>
  <li>On the game thread tick (<code>TickDeferredUpload</code>), dirty sub-rectangles are uploaded to Unreal's <code>UTexture2D</code> via <code>RHIUpdateTexture2D</code>.</li>
</ol>
`
  },

  'pacing': {
    t: 'Frame Pacing & Compositing',
    m: 'external begin frames · ROI',
    h: `
<p>Unconstrained web browsers attempt to render at display refresh rates, contending with Unreal's render thread. SWUI implements three frame-pacing mechanisms to eliminate contention:</p>

<h2>1. External Begin Frames (Lockstep Compositing)</h2>
<p>With <code>bUseExternalBeginFrames = true</code>, Chromium's internal timer is disabled:</p>
<ul>
  <li>On every engine frame, <code>USwuiView::SendExternalBeginFrameIfDue(DeltaTime)</code> calls <code>CefBrowserHost::SendExternalBeginFrame()</code>.</li>
  <li>Chromium executes layout and produces exactly one UI frame synchronized with Unreal's frame clock.</li>
  <li>Eliminates visual jitter and redundant repaints.</li>
</ul>

<h2>2. HUD ROI (Region of Interest) Partial Blitting</h2>
<p>For gameplay HUDs where 90% of the screen is transparent and only corner widgets update (e.g. minimap or health bar):</p>
<ul>
  <li>Define rectangular Regions of Interest (<code>FSwuiHudRoiSettings</code>).</li>
  <li>The presenter only uploads and blits pixels within active ROI boxes, skipping millions of unchanged transparent pixels each frame.</li>
</ul>

<h2>3. Key Best Practices</h2>
<ul>
  <li><b>Always set transparent background</b>: <code>body { background: transparent; }</code> and <code>bIsTransparent = true</code> on the document asset.</li>
  <li><b>Disable text drag boxes</b>: <code>body { user-select: none; }</code>.</li>
  <li><b>Prevent viewport scrolling</b>: <code>body { width: 100vw; height: 100vh; overflow: hidden; }</code>.</li>
</ul>
`
  },

  'memory-cleanup': {
    t: 'Deterministic Lifecycle & Cleanup',
    m: 'memory · level travel · shutdown',
    h: `
<p>Managing multiple Chromium browser instances in an Unreal game requires deterministic resource cleanup rather than waiting for Unreal's non-deterministic Garbage Collection.</p>

<h2>Immediate Shutdown (<code>USwuiView::Shutdown</code>)</h2>
<p>When a document is unloaded, SWUI immediately executes synchronous destruction on the game thread:</p>
<ul>
  <li>Resets <code>FSwuiGpuSharedTextureHelper</code> and closes DirectX shared NT handles.</li>
  <li>Calls <code>CefBrowserHost::CloseBrowser(true)</code> to cleanly terminate the CEF sub-process.</li>
  <li>Clears smart pointers to browser hosts and client delegates.</li>
  <li>Destroys the Slate presenter texture and frees GPU VRAM immediately.</li>
</ul>

<h2>Level Travel Unload Rules</h2>
<p>When <code>FWorldDelegates::OnPreWorldFinishDestroy</code> triggers during level transitions:</p>
<ul>
  <li><code>USwuiDocumentManagerSubsystem::UnloadNonPersistentDocuments()</code> runs.</li>
  <li>Documents in the <code>Level</code> and <code>Modal</code> layers are cleanly unloaded.</li>
  <li>Documents in the <code>Persistent</code> layer (e.g. chat, party status, ping monitor) survive across level travel without stutter or reload.</li>
</ul>
`
  },

  'input-routing': {
    t: 'Input Preprocessing & Focus',
    m: 'Slate · CEF input · text fields',
    h: `
<p>Handling input across multiple overlapping web documents requires deterministic layer routing through Slate.</p>

<h2>Pointer & Mouse Routing</h2>
<p>The engine registers <code>FSwuiInputPreprocessor</code> into Slate's global input pipeline:</p>
<ol>
  <li>On mouse move, click, or wheel, the preprocessor queries:
    <div class="sig">USwuiDocumentManagerSubsystem::GetTopInteractiveViewAt(ScreenPosition)</div>
  </li>
  <li>The subsystem iterates active documents sorted in descending Z-Order.</li>
  <li>It hit-tests each document via <code>ScreenToBrowserPixel</code>.</li>
  <li>The highest Z-Order document containing the cursor receives the pointer event via <code>SendMouseMoveEvent</code> or <code>SendMouseClickEvent</code>.</li>
  <li>If no document accepts the hit, input falls through to gameplay!</li>
</ol>

<h2>Native Keyboard & Text Input Forwarding</h2>
<p>HTML <code>&lt;input&gt;</code>, <code>&lt;textarea&gt;</code>, and <code>&lt;select&gt;</code> elements receive real keyboard typing:</p>
<ul>
  <li><code>HandleKeyDownEvent</code> delivers <code>KEYEVENT_KEYDOWN</code> to CEF.</li>
  <li>For printable characters, a synthesized <code>KEYEVENT_CHAR</code> is forwarded with Unicode mapping.</li>
  <li>When an input is focused, <code>focus_on_editable_field = true</code> is set, enabling native Tab navigation and copy/paste shortcuts (Ctrl+C / Ctrl+V).</li>
</ul>
`
  },

  'react-input-fields': {
    t: 'React Input Controls',
    m: 'React 18 · controlled inputs · IME',
    h: `
<p>Standard React controlled components work transparently inside SWUI without special APIs.</p>

<h2>Example: Controlled Username Input</h2>
<div class="sig">import React, { useState } from 'react';
import { useSwuiEvent } from '@swui/react';

export function UsernameInput() {
  const [username, setUsername] = useState('Player');
  const setUsernameEvent = useSwuiEvent('Player.SetUsername');

  const commit = () => {
    setUsernameEvent({ username });
  };

  return (
    &lt;div className="input-group"&gt;
      &lt;label&gt;Pilot Name:&lt;/label&gt;
      &lt;input
        value={username}
        onChange={e =&gt; setUsername(e.target.value)}
        onBlur={commit}
        onKeyDown={e =&gt; { if (e.key === 'Enter') commit(); }}
        placeholder="Enter name..."
      /&gt;
    &lt;/div&gt;
  );
}</div>

<h2>Suppressing Gameplay Input While Typing</h2>
<p>When an HTML input element is focused, <code>USwuiSubsystem::IsTextInputFocused()</code> returns <code>true</code>:</p>
<div class="sig">// In your PlayerController or Character:
if (SwuiSubsystem-&gt;IsTextInputFocused()) {
    // Suppress WASD movement, jumping, firing while typing in chat
    return;
}</div>
`
  },

  'navigation': {
    t: 'Gamepad & Menu Navigation',
    m: 'SwuiNavigation · controller',
    h: `
<p>Console games and gamepad-controlled menus require structured spatial navigation rather than mouse pointers.</p>

<h2>Binding Unreal Input to SwuiNavigation</h2>
<p>Map your Enhanced Input actions to <code>SwuiNavigation</code>:</p>
<div class="sig">// Directional navigation
D-Pad / Left Stick  &rarr; SwuiNavigation.Navigate(Direction)

// Actions
A / Cross / Enter   &rarr; SwuiNavigation.Confirm()
B / Circle / Escape &rarr; SwuiNavigation.Cancel()
LB / L1 / Prev Tab  &rarr; SwuiNavigation.PreviousTab()
RB / R1 / Next Tab  &rarr; SwuiNavigation.NextTab()</div>

<h2>Consuming Navigation in JavaScript</h2>
<div class="sig">import { useSwuiNavigation } from '@swui/react';

export function Menu() {
  useSwuiNavigation({
    onNavigate: (direction) =&gt; focusManager.move(direction),
    onConfirm: () =&gt; activeItem.trigger(),
    onCancel: () =&gt; menu.close(),
    onNextTab: () =&gt; tabs.next(),
    onPreviousTab: () =&gt; tabs.previous()
  });

  return &lt;nav&gt;...&lt;/nav&gt;;
}</div>
`
  },

  'react': {
    t: 'React 18 Integration (@swui/react)',
    m: 'hooks · state · events',
    h: `
<p>The official <code>@swui/react</code> package provides ergonomic React 18 hooks that subscribe to the global state bus and emit GameplayTag events.</p>

<h2>Primary Hooks</h2>
<div class="sig">import { useSwuiState, useSwuiEvent, useSwuiNavigation, useSwuiTimeline } from '@swui/react';

export function WeaponHUD() {
  // 1. Reactive state subscription (auto-batched)
  const health = useSwuiState&lt;number&gt;('PlayerHealth', 100);
  const ammo = useSwuiState&lt;number&gt;('Ammo', 30);

  // 2. GameplayTag event emitter
  const fireWeapon = useSwuiEvent('Weapon.Fire');
  const reloadWeapon = useSwuiEvent('Weapon.Reload');

  // 3. Engine-synchronized timeline
  const { time, dt, paused } = useSwuiTimeline();

  return (
    &lt;div className="hud"&gt;
      &lt;div className="health-bar" style={{ width: health + '%' }} /&gt;
      &lt;div className="ammo-count"&gt;{ammo}&lt;/div&gt;
      &lt;button onClick={() =&gt; reloadWeapon({ fast: true })}&gt;Reload&lt;/button&gt;
    &lt;/div&gt;
  );
}</div>
`
  },

  'vue-svelte': {
    t: 'Vue 3 & Svelte Stores',
    m: 'composables · stores',
    h: `
<p>SWUI provides first-class integrations across all major modern frontend frameworks over the exact same state bus contract.</p>

<h2>Vue 3 Composition API (<code>@swui/vue</code>)</h2>
<div class="sig">import { defineComponent } from 'vue';
import { useSwuiState, useSwuiEvent } from '@swui/vue';

export default defineComponent({
  setup() {
    const health = useSwuiState('PlayerHealth', 100);
    const reload = useSwuiEvent('Weapon.Reload');

    return { health, reload };
  },
  template: "\n    &lt;div class=\"vitals\"&gt;\n      &lt;span&gt;HP: {{ health }}&lt;/span&gt;\n      &lt;button @click=\"reload({ fast: true })\"&gt;Reload&lt;/button&gt;\n    &lt;/div&gt;\n  "
});</div>

<h2>Svelte Stores (<code>@swui/svelte</code>)</h2>
<div class="sig">&lt;script&gt;
  import { swuiState, swuiEvent } from '@swui/svelte';

  const health = swuiState('PlayerHealth', 100);
  const reload = swuiEvent('Weapon.Reload');
&lt;/script&gt;

&lt;div class="vitals"&gt;
  &lt;span&gt;HP: {$health}&lt;/span&gt;
  &lt;button on:click={() =&gt; reload({ fast: true })}&gt;Reload&lt;/button&gt;
&lt;/div&gt;</div>
`
  },

  'cli': {
    t: 'SWUI CLI & Production Build',
    m: '@swui/cli · vite',
    h: `
<p>The <code>@swui/cli</code> package streamlines development and creates optimized production bundles for Unreal Engine.</p>

<h2>Configuration (<code>swui.config.ts</code>)</h2>
<div class="sig">import { defineConfig } from '@swui/cli';

export default defineConfig({
  name: 'MainHUD',
  framework: 'react',
  entry: 'src/main.tsx',
  output: 'dist',
  runtime: {
    layer: 'level',
    loadBehavior: 'eager',
    frameRate: 60,
  }
});</div>

<h2>Commands</h2>
<ul>
  <li><code>npx swui dev</code>: Starts local Vite dev server with Hot Module Replacement (HMR).</li>
  <li><code>npx swui build --production</code>: Compiles the frontend into self-contained static assets in <code>dist/</code> without external server dependencies.</li>
</ul>
`
  },

  'recipe-hud-inventory': {
    t: 'Recipe: Gameplay HUD + Modal Inventory',
    m: 'practical guide · HUD + inventory',
    h: `
<p>A complete recipe for an in-game HUD that stays visible during gameplay and an Inventory screen that opens on keypress (<kbd>I</kbd> or <kbd>Tab</kbd>), captures pointer input, and closes on <kbd>Escape</kbd>.</p>

<h2>1. Create Two Document Assets</h2>
<ul>
  <li><b><code>DA_MainHUD</code></b>:
    <ul>
      <li><code>DocumentId</code>: <code>MainHUD</code></li>
      <li><code>Layer</code>: <code>Level</code>, <code>ZOrder</code>: <code>10</code>, <code>LoadBehavior</code>: <code>Eager</code></li>
    </ul>
  </li>
  <li><b><code>DA_Inventory</code></b>:
    <ul>
      <li><code>DocumentId</code>: <code>Inventory</code></li>
      <li><code>Layer</code>: <code>Modal</code>, <code>ZOrder</code>: <code>100</code>, <code>LoadBehavior</code>: <code>Lazy</code>, <code>bEnableSleep</code>: <code>true</code></li>
    </ul>
  </li>
</ul>

<h2>2. Blueprint Input Action (PlayerController)</h2>
<div class="sig">[Input Action: ToggleInventory]
  &rarr; Get SwuiDocumentManagerSubsystem &rarr; Get Document ("Inventory")
  &rarr; Is Active?
     TRUE:  Deactivate Document ("Inventory")
            Set Show Mouse Cursor: false
            Set Input Mode Game Only
     FALSE: Activate Document ("Inventory", OverrideZOrder: 100)
            Set Show Mouse Cursor: true
            Set Input Mode Game and UI</div>

<h2>3. Using Items from Web UI</h2>
<div class="sig">// In inventory.html:
window.__SWUI__.send(JSON.stringify({
  type: "navigation",
  tag: "UI.Inventory.UseItem",
  payload: { itemId: "health_potion", slot: 2 }
}));</div>
`
  },

  'recipe-pause-menu': {
    t: 'Recipe: Pause Menu with World Paused',
    m: 'practical guide · pause menu',
    h: `
<p>When pausing a single-player game, you want the 3D world frozen, but the web UI fully animated and interactive.</p>

<h2>Blueprint Setup</h2>
<ol>
  <li><b>On Pause Pressed (Escape)</b>:
    <div class="sig">Set Game Paused: true
Get SwuiDocumentManagerSubsystem &rarr; Activate Document ("PauseMenu", OverrideZOrder: 200)
Set Show Mouse Cursor: true
Set Input Mode UI Only</div>
  </li>
  <li><b>Inside pause_menu.html</b>:
    <div class="sig">document.getElementById('btn-resume').addEventListener('click', () =&gt; {
  window.__SWUI__.send(JSON.stringify({ type: 'navigation', tag: 'UI.Menu.Resume' }));
});</div>
  </li>
  <li><b>In Blueprint OnNavigationEvent</b>:
    <div class="sig">When EventTag == UI.Menu.Resume:
Get SwuiDocumentManagerSubsystem &rarr; Deactivate Document ("PauseMenu")
Set Game Paused: false
Set Show Mouse Cursor: false
Set Input Mode Game Only</div>
  </li>
</ol>

<div class="callout"><svg><use href="#i-zap"/></svg><p>Because <code>USwuiDocumentManagerSubsystem</code> implements <code>FTickableGameObject</code> with <code>TickableWhenPaused = true</code>, UI animations, button hovers, and sounds continue playing at full frame rate while the game world is paused.</p></div>
`
  },

  'recipe-preloading': {
    t: 'Recipe: Zero-Stutter Level Preloading',
    m: 'practical guide · level travel',
    h: `
<p>Loading heavy web bundles, 3D CSS animations, or high-res UI assets during level gameplay can cause micro-stutters. SWUI 3.0 provides zero-stutter background preloading.</p>

<h2>Workflow</h2>
<ol>
  <li>During map travel or a loading screen:
    <div class="sig">// C++
USwuiDocumentManagerSubsystem* DocMgr = GetGameInstance()-&gt;GetSubsystem&lt;USwuiDocumentManagerSubsystem&gt;();
DocMgr-&gt;PreloadDocument(FName("Level02HUD"));

// Blueprints: Call "Preload Document" ("Level02HUD")</div>
  </li>
  <li>CEF initializes and loads HTML, CSS, and scripts in the background without attaching to the viewport.</li>
  <li>Once the level fades in:
    <div class="sig">DocMgr-&gt;ActivateDocument(FName("Level02HUD"));</div>
  </li>
  <li>The HUD appears instantly at 60+ FPS with zero layout or compilation hitch!</li>
</ol>
`
  },

  'recipe-in-world-screens': {
    t: 'Recipe: 3D In-World Mesh Screens',
    m: 'practical guide · actor component',
    h: `
<p>For in-world interactive terminals (such as sci-fi consoles or vehicle cockpit dashboards) attached to 3D meshes in the game world:</p>

<h2>Setup Steps</h2>
<ol>
  <li>Add a <code>USwui</code> component to your Actor.</li>
  <li>In the Details panel, assign the <code>Document Asset</code> property to your <code>USwuiDocumentAsset</code> (e.g. <code>DA_TerminalScreen</code>).</li>
  <li>Set <code>RenderMode</code> to <code>CpuCompatible</code> or <code>GpuAccelerated</code>.</li>
  <li>The component automatically registers with <code>USwuiDocumentManagerSubsystem</code> and passes the rendered <code>UTexture2D</code> directly to your actor mesh's Dynamic Material Instance!</li>
</ol>
`
  },

  'profiling': {
    t: 'Diagnostic CVars & Profiling',
    m: 'CVars · profiler · diagnostics',
    h: `
<p>SWUI provides dedicated diagnostic console variables to measure frame pacing, latency, and resource utilization in the Unreal Editor or packaged builds:</p>

<div class="table-wrap">
  <table style="width:100%;border-collapse:collapse;margin:16px 0;font:400 13px var(--mono)">
    <thead>
      <tr style="border-bottom:2px solid var(--ln);text-align:left">
        <th style="padding:8px">Command</th>
        <th style="padding:8px">Default</th>
        <th style="padding:8px">Description</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom:1px solid var(--ln2)">
        <td style="padding:8px;color:var(--acc)">swui.debug.Stats 1</td>
        <td style="padding:8px">0</td>
        <td style="padding:8px">Prints periodic telemetry: Browser FPS, Presented FPS, Paint-to-Present latency, state flushes.</td>
      </tr>
      <tr style="border-bottom:1px solid var(--ln2)">
        <td style="padding:8px;color:var(--acc)">swui.verbosePaint 1</td>
        <td style="padding:8px">0</td>
        <td style="padding:8px">Logs all paint callbacks and texture upload dimensions.</td>
      </tr>
      <tr style="border-bottom:1px solid var(--ln2)">
        <td style="padding:8px;color:var(--acc)">swui.hud.Lockstep 1</td>
        <td style="padding:8px">0</td>
        <td style="padding:8px">Forces CEF frame production to lockstep with Unreal Engine frames.</td>
      </tr>
      <tr style="border-bottom:1px solid var(--ln2)">
        <td style="padding:8px;color:var(--acc)">swui.hud.MaxBrowserFPS 60</td>
        <td style="padding:8px">60</td>
        <td style="padding:8px">Caps maximum browser rendering rate.</td>
      </tr>
      <tr>
        <td style="padding:8px;color:var(--acc)">swui.cefMessageLoopBudgetMs 1.5</td>
        <td style="padding:8px">1.5</td>
        <td style="padding:8px">Maximum game-thread time (ms) allowed for pumping CEF per tick.</td>
      </tr>
    </tbody>
  </table>
</div>
`
  },

  'troubleshooting': {
    t: 'Troubleshooting & Gotchas',
    m: 'documented scenarios',
    h: `
<h2>1. Transparency: UI background is solid black or white</h2>
<ul>
  <li>In CSS, ensure <code>body { background: transparent; }</code>.</li>
  <li>On the <code>USwuiDocumentAsset</code>, ensure <code>bIsTransparent = true</code>.</li>
</ul>

<h2>2. Text Fields: Keyboard typing not received</h2>
<ul>
  <li>Ensure the document's widget has focus and pointer input is enabled (<code>SetPointerInputEnabled(true)</code>).</li>
  <li>Verify that you clicked inside the <code>&lt;input&gt;</code> element to establish DOM focus.</li>
</ul>

<h2>3. Warning: "Development dev-server detected"</h2>
<ul>
  <li>You loaded an unbundled URL pointing to <code>http://localhost:5173</code> in a shipping build.</li>
  <li>Run <code>npx swui build --production</code> and point the document asset at <code>dist/index.html</code>.</li>
</ul>

<h2>4. Input falls through unexpectedly</h2>
<ul>
  <li>Verify that the document's layer and Z-order are higher than underlying interactive elements.</li>
  <li>Check that the document's widget is not marked hit-test invisible in Slate.</li>
</ul>
`
  }
};
