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

export const DOCNAV: DocCategory[] = [
  {
    "category": "GETTING STARTED",
    "items": [
      {
        "id": "getting-started",
        "title": "Overview"
      },
      {
        "id": "installation",
        "title": "Installation"
      },
      {
        "id": "vanilla",
        "title": "Vanilla HTML"
      }
    ]
  },
  {
    "category": "CORE CONCEPTS",
    "items": [
      {
        "id": "documents",
        "title": "Documents"
      },
      {
        "id": "state",
        "title": "State"
      },
      {
        "id": "events",
        "title": "Events"
      },
      {
        "id": "input",
        "title": "Input"
      }
    ]
  },
  {
    "category": "RUNTIME",
    "items": [
      {
        "id": "rendering",
        "title": "Rendering"
      },
      {
        "id": "performance",
        "title": "Performance"
      }
    ]
  },
  {
    "category": "INTEGRATION",
    "items": [
      {
        "id": "blueprint",
        "title": "Blueprint & Codegen"
      },
      {
        "id": "typescript",
        "title": "TypeScript"
      },
      {
        "id": "react",
        "title": "React"
      },
      {
        "id": "vue",
        "title": "Vue"
      },
      {
        "id": "svelte",
        "title": "Svelte"
      },
      {
        "id": "cli",
        "title": "CLI & Config"
      }
    ]
  },
  {
    "category": "TOOLS",
    "items": [
      {
        "id": "preview",
        "title": "Preview"
      },
      {
        "id": "profiling",
        "title": "Profiling"
      },
      {
        "id": "troubleshooting",
        "title": "Troubleshooting"
      }
    ]
  }
];

export const DOCS: Record<string, DocContent> = {
  "getting-started": {
    "t": "Getting Started",
    "m": "5 min · vanilla path",
    "h": "\n<p>SWUI puts a web UI runtime inside Unreal Engine. You write HTML, CSS and JavaScript — or a full modern frontend — and Unreal owns gameplay state, events and runtime control.</p>\n<h2>Path A — Vanilla</h2>\n<ol><li>Create <code>Content/UI/hud.html</code></li><li>Create an <b>SWUI Document Asset</b></li><li>Set the <b>Entry URL</b> to your HTML file</li><li><b>Load</b> the document</li><li><b>Activate</b> the document</li><li><b>Set state</b> from Unreal</li><li>Handle a <b>navigation event</b> from the web side</li></ol>\n<h2>Path B — Modern frontend</h2>\n<ol><li><code>npm i @swui/core</code></li><li>Install a framework package — <code>@swui/react</code>, <code>@swui/vue</code> or <code>@swui/svelte</code></li><li>Build your frontend</li><li><code>swui build --production</code></li><li>Point the Document Asset at <code>dist/index.html</code></li><li>Activate in Unreal</li></ol>\n <figure class=\"code code-l\"><figcaption><span class=\"cf-file\">hud.html</span><span class=\"cf-lang\">html</span><button class=\"cf-copy\" data-copy=\"hudHtml\" aria-label=\"Copy code\"><svg><use href=\"#i-copy\"/></svg>copy</button></figcaption><pre><span class=\"cl\" data-n=\" 1 \"><span class=\"c\">&lt;!-- Content/UI/hud.html --&gt;</span></span><span class=\"cl\" data-n=\" 2 \"><span class=\"t\">&lt;!doctype</span> html<span class=\"t\">&gt;</span></span><span class=\"cl\" data-n=\" 3 \"><span class=\"t\">&lt;html</span><span class=\"t\">&gt;</span></span><span class=\"cl\" data-n=\" 4 \"><span class=\"t\">&lt;head</span><span class=\"t\">&gt;</span></span><span class=\"cl\" data-n=\" 5 \">  <span class=\"t\">&lt;meta</span> <span class=\"a\">charset</span>=<span class=\"s\">\"utf-8\"</span> <span class=\"t\">/&gt;</span></span><span class=\"cl\" data-n=\" 6 \">  <span class=\"t\">&lt;style</span><span class=\"t\">&gt;</span></span><span class=\"cl\" data-n=\" 7 \">    body { margin: 0; background: transparent; }</span><span class=\"cl\" data-n=\" 8 \">    .ammo {</span><span class=\"cl\" data-n=\" 9 \">      position: fixed; right: 32px; bottom: 24px;</span><span class=\"cl\" data-n=\"10 \">      font: 600 44px/1 ui-monospace, monospace;</span><span class=\"cl\" data-n=\"11 \">      color: #ececf1; text-align: right;</span><span class=\"cl\" data-n=\"12 \">    }</span><span class=\"cl\" data-n=\"13 \">    .ammo small { display: block; font-size: 12px; opacity: .55; }</span><span class=\"cl\" data-n=\"14 \">  <span class=\"t\">&lt;/style</span><span class=\"t\">&gt;</span></span><span class=\"cl\" data-n=\"15 \"><span class=\"t\">&lt;/head</span><span class=\"t\">&gt;</span></span><span class=\"cl\" data-n=\"16 \"><span class=\"t\">&lt;body</span><span class=\"t\">&gt;</span></span><span class=\"cl\" data-n=\"17 \">  <span class=\"t\">&lt;div</span> <span class=\"a\">class</span>=<span class=\"s\">\"ammo\"</span><span class=\"t\">&gt;</span><span class=\"t\">&lt;span</span> <span class=\"a\">id</span>=<span class=\"s\">\"ammo\"</span><span class=\"t\">&gt;</span>24<span class=\"t\">&lt;/span</span><span class=\"t\">&gt;</span><span class=\"t\">&lt;small</span><span class=\"t\">&gt;</span>RESERVE 180<span class=\"t\">&lt;/small</span><span class=\"t\">&gt;</span><span class=\"t\">&lt;/div</span><span class=\"t\">&gt;</span></span><span class=\"cl\" data-n=\"18 \"> </span><span class=\"cl\" data-n=\"19 \">  <span class=\"t\">&lt;script</span><span class=\"t\">&gt;</span></span><span class=\"cl\" data-n=\"20 \">    // React to Unreal state — no polling, no bridge glue.</span><span class=\"cl\" data-n=\"21 \">    swui.on('Weapon.CurrentAmmo', v =<span class=\"t\">&gt;</span> {</span><span class=\"cl\" data-n=\"22 \">      document.getElementById('ammo').textContent = v;</span><span class=\"cl\" data-n=\"23 \">    });</span><span class=\"cl\" data-n=\"24 \">  <span class=\"t\">&lt;/script</span><span class=\"t\">&gt;</span></span><span class=\"cl\" data-n=\"25 \"><span class=\"t\">&lt;/body</span><span class=\"t\">&gt;</span></span><span class=\"cl\" data-n=\"26 \"><span class=\"t\">&lt;/html</span><span class=\"t\">&gt;</span></span></pre></figure>\n<div class=\"callout\"><svg><use href=\"#i-zap\"/></svg><p>No Node, no bundler, no framework required for the basic workflow — a single HTML file is a complete UI document.</p></div>"
  },
  "installation": {
    "t": "Installation",
    "m": "plugin · npm",
    "h": "\n<p>Install the SWUI plugin into your Unreal project's <code>Plugins</code> directory and enable it in the editor. The embedded CEF/Chromium runtime ships with the plugin for supported desktop platforms.</p>\n<h2>Frontend side (optional)</h2>\n<div class=\"sig\">npm i @swui/core\nnpm i @swui/react   # or @swui/vue · @swui/svelte\nnpm i -D @swui/cli</div>\n<div class=\"callout warn\"><svg><use href=\"#i-zap\"/></svg><p>See the repository for the current authoritative installation steps and license terms. Platform support is stated on the <a href=\"#/product\" class=\"acc\">product page</a>.</p></div>"
  },
  "vanilla": {
    "t": "Vanilla HTML",
    "m": "no framework · no node",
    "h": "\n<p>The simplest entry point: one file, zero tooling. The runtime injects the <code>swui</code> global into every document.</p>\n<h2>The whole HUD</h2>\n <figure class=\"code code-l\"><figcaption><span class=\"cf-file\">hud.html — script</span><span class=\"cf-lang\">js</span><button class=\"cf-copy\" data-copy=\"vanilla\" aria-label=\"Copy code\"><svg><use href=\"#i-copy\"/></svg>copy</button></figcaption><pre><span class=\"cl\" data-n=\" 1 \"><span class=\"c\">// No framework. No Node. One file.</span></span><span class=\"cl\" data-n=\" 2 \"><span class=\"c\">// Content/UI/hud.html → USwuiDocumentAsset → done.</span></span><span class=\"cl\" data-n=\" 3 \"> </span><span class=\"cl\" data-n=\" 4 \">swui.<span class=\"f\">on</span>(<span class=\"s\">'Weapon.CurrentAmmo'</span>, v =&gt; {</span><span class=\"cl\" data-n=\" 5 \">  document.<span class=\"f\">querySelector</span>(<span class=\"s\">'#ammo'</span>).textContent = v;</span><span class=\"cl\" data-n=\" 6 \">});</span><span class=\"cl\" data-n=\" 7 \"> </span><span class=\"cl\" data-n=\" 8 \">swui.navigation.<span class=\"f\">onConfirm</span>(() =&gt; {</span><span class=\"cl\" data-n=\" 9 \">  document.activeElement?.<span class=\"f\">click</span>();</span><span class=\"cl\" data-n=\"10 \">});</span></pre></figure>\n<p>Point a <code>USwuiDocumentAsset</code> at the file, load it, activate it. The HUD appears in the Unreal viewport — transparent, layered, input-aware.</p>"
  },
  "documents": {
    "t": "Documents",
    "m": "layers · z-order · assets",
    "h": "\n<p>Every UI is its own web document, managed independently by the runtime. Documents live in three primary layers.</p>\n<h2>Layers</h2>\n<ul><li><b>Persistent</b> — network info, ping, chat, global notifications. Survives level transitions.</li><li><b>Level</b> — HUD, minimap, crosshair, objective tracker. Removed during level travel.</li><li><b>Modal</b> — inventory, pause menu, skill tree, settings, dialogue, confirmations.</li></ul>\n<h2>Z-order</h2>\n<ul><li><b>0–9</b> background / persistent</li><li><b>10–49</b> gameplay HUD</li><li><b>50–99</b> contextual UI</li><li><b>100–199</b> interactive windows</li><li><b>200–299</b> system menus</li><li><b>300+</b> critical system dialogs</li></ul>\n<h2>USwuiDocumentAsset</h2>\n<p>The asset defines: Document ID, Entry URL, Layer, Z-order, Load behavior (lazy / eager), Transparency, Sleep behavior and Render mode.</p>\n<div class=\"callout\"><svg><use href=\"#i-zap\"/></svg><p>Try the interactive document stack and lifecycle on the <a href=\"#/\" class=\"acc\">homepage</a>.</p></div>"
  },
  "state": {
    "t": "State",
    "m": "bus · batching · API",
    "h": "\n<p>Unreal publishes reflected properties to a global state bus. Documents subscribe to fields; only relevant listeners react. The frontend never polls.</p>\n<h2>Accumulate, then flush</h2>\n<p>Updates are accumulated during the frame and flushed as one atomic batch — every framework sees the same snapshot, once.</p>\n <figure class=\"code code-l\"><figcaption><span class=\"cf-file\">state.ts</span><span class=\"cf-lang\">ts</span><button class=\"cf-copy\" data-copy=\"state\" aria-label=\"Copy code\"><svg><use href=\"#i-copy\"/></svg>copy</button></figcaption><pre><span class=\"cl\" data-n=\" 1 \"><span class=\"c\">// Read current state</span></span><span class=\"cl\" data-n=\" 2 \"><span class=\"k\">const</span> ammo = swui.state.<span class=\"f\">get</span>(<span class=\"s\">'Weapon.CurrentAmmo'</span>);</span><span class=\"cl\" data-n=\" 3 \"> </span><span class=\"cl\" data-n=\" 4 \"><span class=\"c\">// Subscribe to a single field</span></span><span class=\"cl\" data-n=\" 5 \">swui.state.<span class=\"f\">subscribe</span>(<span class=\"s\">'Weapon.CurrentSpread'</span>, v =&gt; {</span><span class=\"cl\" data-n=\" 6 \">  crosshair.<span class=\"f\">setSpread</span>(v);</span><span class=\"cl\" data-n=\" 7 \">});</span><span class=\"cl\" data-n=\" 8 \"> </span><span class=\"cl\" data-n=\" 9 \"><span class=\"c\">// Propagate a state patch</span></span><span class=\"cl\" data-n=\"10 \">swui.state.<span class=\"f\">update</span>({ <span class=\"s\">'UI.MenuVolume'</span>: <span class=\"n\">0.4</span> });</span><span class=\"cl\" data-n=\"11 \"> </span><span class=\"cl\" data-n=\"12 \"><span class=\"c\">// React once per frame, to the whole batch</span></span><span class=\"cl\" data-n=\"13 \">swui.state.<span class=\"f\">onBatch</span>(batch =&gt; {</span><span class=\"cl\" data-n=\"14 \">  stats.<span class=\"f\">beginFrame</span>(batch.version);</span><span class=\"cl\" data-n=\"15 \">});</span><span class=\"cl\" data-n=\"16 \"> </span><span class=\"cl\" data-n=\"17 \"><span class=\"c\">// Runtime tick — engine time, not wall time</span></span><span class=\"cl\" data-n=\"18 \">swui.state.<span class=\"f\">onTick</span>(({ dt, time, paused }) =&gt; {</span><span class=\"cl\" data-n=\"19 \">  <span class=\"k\">if</span> (!paused) world.<span class=\"f\">step</span>(dt);</span><span class=\"cl\" data-n=\"20 \">});</span></pre></figure>\n<h2>Runtime data</h2>\n<p>The SDK also exposes runtime timing: <code>fps</code>, <code>dt</code>, <code>time</code>, <code>frameIndex</code>, <code>stateVersion</code>, <code>cefFps</code>, <code>width</code>, <code>height</code>, <code>timeDilation</code> and <code>paused</code> — so UI animation can be driven by game time, not wall time.</p>"
  },
  "events": {
    "t": "Events",
    "m": "GameplayTags · payloads",
    "h": "\n<p>Events flow both ways. The web side emits structured messages that arrive in Unreal as GameplayTag events; reflected Unreal events arrive in the document as typed subscriptions.</p>\n <figure class=\"code code-l\"><figcaption><span class=\"cf-file\">events.ts</span><span class=\"cf-lang\">ts</span><button class=\"cf-copy\" data-copy=\"events\" aria-label=\"Copy code\"><svg><use href=\"#i-copy\"/></svg>copy</button></figcaption><pre><span class=\"cl\" data-n=\" 1 \"><span class=\"c\">// Web → Unreal (structured, tag-routed)</span></span><span class=\"cl\" data-n=\" 2 \">swui.events.<span class=\"f\">emit</span>(<span class=\"s\">'UI.Inventory.UseItem'</span>, {</span><span class=\"cl\" data-n=\" 3 \">  itemId: <span class=\"s\">'health_potion'</span>,</span><span class=\"cl\" data-n=\" 4 \">  slot: <span class=\"n\">2</span>,</span><span class=\"cl\" data-n=\" 5 \">});</span><span class=\"cl\" data-n=\" 6 \"> </span><span class=\"cl\" data-n=\" 7 \"><span class=\"c\">// Unreal → Web (reflected events as subscriptions)</span></span><span class=\"cl\" data-n=\" 8 \">swui.events.<span class=\"f\">on</span>(<span class=\"s\">'Weapon.OnPlayerFiredShot'</span>, ({ ammoRemaining }) =&gt; {</span><span class=\"cl\" data-n=\" 9 \">  ammoEl.textContent = ammoRemaining;</span><span class=\"cl\" data-n=\"10 \">});</span><span class=\"cl\" data-n=\"11 \"> </span><span class=\"cl\" data-n=\"12 \"><span class=\"c\">// Gamepad-grade navigation, routed by the runtime</span></span><span class=\"cl\" data-n=\"13 \">swui.events.<span class=\"f\">emitNavigation</span>(<span class=\"s\">'confirm'</span>);</span></pre></figure>\n<h2>Tag conventions</h2>\n<p>Tags such as <code>UI.Inventory.UseItem</code> or <code>UI.Menu.Resume</code> map cleanly onto Unreal's GameplayTag hierarchy — handlers stay declarative on the engine side.</p>"
  },
  "input": {
    "t": "Input",
    "m": "pointer · keyboard · gamepad",
    "h": "\n<h2>Pointer</h2>\n<p>One input surface, many documents. Every pointer event is hit-tested: visible, interactive, contains the pointer, highest Z-order wins. If no document accepts it, input falls through to gameplay.</p>\n<h2>Keyboard / text</h2>\n<p>Focused web inputs receive printable characters, modifiers and text events through the Slate input preprocessor into CEF. The routing architecture is designed to stay compatible with IME input flows on desktop.</p>\n<h2>Gamepad navigation</h2>\n <figure class=\"code code-l\"><figcaption><span class=\"cf-file\">navigation.ts</span><span class=\"cf-lang\">ts</span><button class=\"cf-copy\" data-copy=\"navigation\" aria-label=\"Copy code\"><svg><use href=\"#i-copy\"/></svg>copy</button></figcaption><pre><span class=\"cl\" data-n=\" 1 \">swui.navigation.<span class=\"f\">onNavigate</span>(dir =&gt; focus.<span class=\"f\">move</span>(dir));</span><span class=\"cl\" data-n=\" 2 \"><span class=\"c\">// up | down | left | right</span></span><span class=\"cl\" data-n=\" 3 \"> </span><span class=\"cl\" data-n=\" 4 \">swui.navigation.<span class=\"f\">onConfirm</span>(()  =&gt; focus.<span class=\"f\">current</span>().<span class=\"f\">click</span>());</span><span class=\"cl\" data-n=\" 5 \">swui.navigation.<span class=\"f\">onCancel</span>(()   =&gt; <span class=\"f\">closeDocument</span>());</span><span class=\"cl\" data-n=\" 6 \">swui.navigation.<span class=\"f\">onNextTab</span>(()  =&gt; tabs.<span class=\"f\">next</span>());</span><span class=\"cl\" data-n=\" 7 \">swui.navigation.<span class=\"f\">onPreviousTab</span>(() =&gt; tabs.<span class=\"f\">prev</span>());</span></pre></figure>\n<h2>Input enablement</h2>\n<ul><li><b>Game Only</b> — everything goes to gameplay</li><li><b>Game + UI</b> — split by focus and document interactivity</li><li><b>UI Only</b> — the document captures everything</li></ul>"
  },
  "rendering": {
    "t": "Rendering",
    "m": "GPU · CPU · pacing · ROI",
    "h": "\n<h2>GPU shared texture path</h2>\n<p>The primary accelerated path. Chromium renders off-screen; a shared GPU resource — Direct3D 11 / DXGI shared textures — lets the Unreal RHI consume the texture without staging the full frame through CPU memory.</p>\n<h2>CPU fallback</h2>\n<p>A full-surface renderer paints into a BGRA system-memory buffer, double-buffered and uploaded as an RHI texture update. It exists for platform compatibility and is not equivalent in throughput to the GPU path.</p>\n<h2>External begin frames</h2>\n<p>Unreal can drive Chromium's frame production rather than letting the browser free-run. The UI composites in step with the engine clock.</p>\n<h2>Region of interest</h2>\n<p>For mostly-transparent HUDs, SWUI tracks changed rectangles and blits only those regions — the unchanged majority of the surface is not repainted.</p>"
  },
  "performance": {
    "t": "Performance",
    "m": "sleep · batching · budget",
    "h": "\n<p>Performance in SWUI is architectural, not a benchmark claim:</p>\n<ul><li><b>Chromium sleep</b> — hidden documents suspend rAF, timers and compositing via WasHidden.</li><li><b>State batching</b> — one atomic flush per frame; N property changes become one evaluation per document.</li><li><b>CEF message-loop budget</b> — browser work is bounded per frame (<code>swui.cefMessageLoopBudgetMs</code>).</li><li><b>Preloading</b> — prepare documents before the player needs them.</li><li><b>ROI</b> — repaint only what changed.</li></ul>\n<p>Measure it yourself with the <a href=\"#/profiling\" class=\"acc\">profiler</a>.</p>"
  },
  "blueprint": {
    "t": "Blueprint & Codegen",
    "m": "observe nodes · contracts",
    "h": "\n<p>The Blueprint graph can be the source of truth. <code>SwuiObserve</code> and <code>SwuiObserveEvent</code> nodes declare what the UI can see; SWUI derives TypeScript binding information from them.</p>\n<div class=\"sig\">Blueprint graph → reflection → Refresh JS Bindings → bindings.gen.ts</div>\n<p>For the documented workflow, no separate manual class configuration is required — the observed properties and events become the generated contract directly.</p>\n<h2>Workflow</h2>\n<ol><li>Create SWUI Interface</li><li>Select HTML entry</li><li>Create Document Asset</li><li>Load · Activate</li><li>Bind state · bind events</li><li>Generate frontend contract</li></ol>"
  },
  "typescript": {
    "t": "TypeScript",
    "m": "generated types",
    "h": "\n<p>State fields, event names, payloads, namespaces and value types are generated from Unreal reflection:</p>\n <figure class=\"code code-l\"><figcaption><span class=\"cf-file\">bindings.gen.ts</span><span class=\"cf-lang\">ts</span><button class=\"cf-copy\" data-copy=\"gen\" aria-label=\"Copy code\"><svg><use href=\"#i-copy\"/></svg>copy</button></figcaption><pre><span class=\"cl\" data-n=\" 1 \"><span class=\"c\">// Generated by SWUI — do not edit.</span></span><span class=\"cl\" data-n=\" 2 \"><span class=\"c\">// Source of truth: Blueprint graph observation nodes.</span></span><span class=\"cl\" data-n=\" 3 \"> </span><span class=\"cl\" data-n=\" 4 \"><span class=\"k\">export</span> <span class=\"k\">interface</span> SwuiState {</span><span class=\"cl\" data-n=\" 5 \">  <span class=\"s\">'Player.Health'</span>: <span class=\"k\">number</span>;</span><span class=\"cl\" data-n=\" 6 \">  <span class=\"s\">'Player.Shield'</span>: <span class=\"k\">number</span>;</span><span class=\"cl\" data-n=\" 7 \">  <span class=\"s\">'Weapon.CurrentAmmo'</span>: <span class=\"k\">number</span>;</span><span class=\"cl\" data-n=\" 8 \">  <span class=\"s\">'Weapon.CurrentSpread'</span>: <span class=\"k\">number</span>;</span><span class=\"cl\" data-n=\" 9 \">  <span class=\"s\">'HUDState.CrosshairMode'</span>: <span class=\"s\">'PRECISE'</span> | <span class=\"s\">'EXPANDED'</span> | <span class=\"s\">'SNIPER'</span>;</span><span class=\"cl\" data-n=\"10 \">  <span class=\"s\">'Interaction.bCanInteract'</span>: <span class=\"k\">boolean</span>;</span><span class=\"cl\" data-n=\"11 \">  <span class=\"s\">'Interaction.Prompt'</span>: <span class=\"k\">string</span>;</span><span class=\"cl\" data-n=\"12 \">}</span><span class=\"cl\" data-n=\"13 \"> </span><span class=\"cl\" data-n=\"14 \"><span class=\"k\">export</span> <span class=\"k\">interface</span> SwuiEvents {</span><span class=\"cl\" data-n=\"15 \">  <span class=\"s\">'Weapon.OnPlayerFiredShot'</span>: {</span><span class=\"cl\" data-n=\"16 \">    gunType: <span class=\"k\">string</span>;</span><span class=\"cl\" data-n=\"17 \">    ammoRemaining: <span class=\"k\">number</span>;</span><span class=\"cl\" data-n=\"18 \">    spread: <span class=\"k\">number</span>;</span><span class=\"cl\" data-n=\"19 \">  };</span><span class=\"cl\" data-n=\"20 \">  <span class=\"s\">'Combat.OnHitConfirmed'</span>: { damage: <span class=\"k\">number</span> };</span><span class=\"cl\" data-n=\"21 \">  <span class=\"s\">'Weapon.Reload'</span>: Record&lt;<span class=\"k\">string</span>, never&gt;;</span><span class=\"cl\" data-n=\"22 \">}</span></pre></figure>\n<p>Unreal defines the contract. The web UI consumes the contract — with autocomplete.</p>"
  },
  "react": {
    "t": "React",
    "m": "@swui/react",
    "h": "\n<p>First-party hooks over the core runtime:</p>\n <figure class=\"code code-l\"><figcaption><span class=\"cf-file\">AmmoCounter.tsx</span><span class=\"cf-lang\">ts</span><button class=\"cf-copy\" data-copy=\"react\" aria-label=\"Copy code\"><svg><use href=\"#i-copy\"/></svg>copy</button></figcaption><pre><span class=\"cl\" data-n=\" 1 \"><span class=\"k\">import</span> { useSwuiState, useSwuiEvent } <span class=\"k\">from</span> <span class=\"s\">'@swui/react'</span>;</span><span class=\"cl\" data-n=\" 2 \"> </span><span class=\"cl\" data-n=\" 3 \"><span class=\"k\">export</span> <span class=\"k\">function</span> <span class=\"f\">AmmoCounter</span>() {</span><span class=\"cl\" data-n=\" 4 \">  <span class=\"k\">const</span> ammo   = useSwuiState&lt;<span class=\"k\">number</span>&gt;(<span class=\"s\">'Weapon.CurrentAmmo'</span>, <span class=\"n\">30</span>);</span><span class=\"cl\" data-n=\" 5 \">  <span class=\"k\">const</span> reload = <span class=\"f\">useSwuiEvent</span>(<span class=\"s\">'Weapon.Reload'</span>);</span><span class=\"cl\" data-n=\" 6 \"> </span><span class=\"cl\" data-n=\" 7 \">  reload.<span class=\"f\">on</span>(() =&gt; <span class=\"f\">flash</span>(<span class=\"s\">'RELOADING'</span>));</span><span class=\"cl\" data-n=\" 8 \"> </span><span class=\"cl\" data-n=\" 9 \">  <span class=\"k\">return</span> &lt;div className=<span class=\"s\">\"ammo\"</span>&gt;{ammo}&lt;/div&gt;;</span><span class=\"cl\" data-n=\"10 \">}</span></pre></figure>\n<p><code>useSwuiState</code>, <code>useSwuiEvent</code>, <code>useSwuiNavigation</code> and <code>useSwuiTimeline</code> cover the documented React surface.</p>"
  },
  "vue": {
    "t": "Vue",
    "m": "@swui/vue",
    "h": "\n<p>Composition API bindings over the same contract:</p>\n <figure class=\"code code-l\"><figcaption><span class=\"cf-file\">composables.ts</span><span class=\"cf-lang\">ts</span><button class=\"cf-copy\" data-copy=\"vue\" aria-label=\"Copy code\"><svg><use href=\"#i-copy\"/></svg>copy</button></figcaption><pre><span class=\"cl\" data-n=\" 1 \"><span class=\"k\">import</span> { useSwuiState, useSwuiEvent } <span class=\"k\">from</span> <span class=\"s\">'@swui/vue'</span>;</span><span class=\"cl\" data-n=\" 2 \"> </span><span class=\"cl\" data-n=\" 3 \"><span class=\"k\">const</span> health = <span class=\"f\">useSwuiState</span>(<span class=\"s\">'Player.Health'</span>, <span class=\"n\">100</span>);</span><span class=\"cl\" data-n=\" 4 \"><span class=\"k\">const</span> reload  = <span class=\"f\">useSwuiEvent</span>(<span class=\"s\">'Weapon.Reload'</span>);</span><span class=\"cl\" data-n=\" 5 \"> </span><span class=\"cl\" data-n=\" 6 \"><span class=\"c\">// Same contract, same GameplayTags —</span></span><span class=\"cl\" data-n=\" 7 \"><span class=\"c\">// only the rendering layer changes.</span></span><span class=\"cl\" data-n=\" 8 \"><span class=\"f\">defineComponent</span>({ template: <span class=\"s\">'&lt;div&gt;{{ health }}&lt;/div&gt;'</span> });</span></pre></figure>\n<p>State and events behave identically to the React integration — only the rendering layer changes.</p>"
  },
  "svelte": {
    "t": "Svelte",
    "m": "@swui/svelte",
    "h": "\n<p>Runtime-backed Svelte stores:</p>\n <figure class=\"code code-l\"><figcaption><span class=\"cf-file\">Crosshair.svelte</span><span class=\"cf-lang\">ts</span><button class=\"cf-copy\" data-copy=\"svelte\" aria-label=\"Copy code\"><svg><use href=\"#i-copy\"/></svg>copy</button></figcaption><pre><span class=\"cl\" data-n=\" 1 \">&lt;script&gt;</span><span class=\"cl\" data-n=\" 2 \">  <span class=\"k\">import</span> { swuiState, swuiEvent } <span class=\"k\">from</span> <span class=\"s\">'@swui/svelte'</span>;</span><span class=\"cl\" data-n=\" 3 \"> </span><span class=\"cl\" data-n=\" 4 \">  <span class=\"k\">const</span> spread = <span class=\"f\">swuiState</span>(<span class=\"s\">'Weapon.CurrentSpread'</span>, <span class=\"n\">0.3</span>);</span><span class=\"cl\" data-n=\" 5 \">  <span class=\"k\">const</span> fired  = <span class=\"f\">swuiEvent</span>(<span class=\"s\">'Weapon.OnPlayerFiredShot'</span>);</span><span class=\"cl\" data-n=\" 6 \"> </span><span class=\"cl\" data-n=\" 7 \">  <span class=\"c\">// A Svelte store backed by the runtime.</span></span><span class=\"cl\" data-n=\" 8 \">  $: gap = <span class=\"n\">6</span> + $spread * <span class=\"n\">42</span>;</span><span class=\"cl\" data-n=\" 9 \">&lt;/script&gt;</span><span class=\"cl\" data-n=\"10 \"> </span><span class=\"cl\" data-n=\"11 \">&lt;div <span class=\"k\">class</span>=<span class=\"s\">\"crosshair\"</span> style=<span class=\"s\">\"--gap: {gap}px\"</span>&gt;&lt;/div&gt;</span></pre></figure>\n<p>Unreal state → SWUI core → Svelte store → component. The store updates drive Svelte's reactivity directly.</p>"
  },
  "cli": {
    "t": "CLI & Config",
    "m": "@swui/cli",
    "h": "\n<p><code>swui dev</code> starts the development workflow with live reload. <code>swui build --production</code> produces static assets for the Unreal runtime. The CLI detects frontend project structure — Vite configurations, and Next.js static-export projects.</p>\n <figure class=\"code code-l\"><figcaption><span class=\"cf-file\">swui.config.ts</span><span class=\"cf-lang\">ts</span><button class=\"cf-copy\" data-copy=\"config\" aria-label=\"Copy code\"><svg><use href=\"#i-copy\"/></svg>copy</button></figcaption><pre><span class=\"cl\" data-n=\" 1 \"><span class=\"k\">import</span> { defineConfig } <span class=\"k\">from</span> <span class=\"s\">'@swui/cli'</span>;</span><span class=\"cl\" data-n=\" 2 \"> </span><span class=\"cl\" data-n=\" 3 \"><span class=\"k\">export</span> <span class=\"k\">default</span> <span class=\"f\">defineConfig</span>({</span><span class=\"cl\" data-n=\" 4 \">  name: <span class=\"s\">'MainHUD'</span>,</span><span class=\"cl\" data-n=\" 5 \">  framework: <span class=\"s\">'react'</span>,</span><span class=\"cl\" data-n=\" 6 \">  entry: <span class=\"s\">'src/main.tsx'</span>,</span><span class=\"cl\" data-n=\" 7 \">  output: <span class=\"s\">'dist'</span>,</span><span class=\"cl\" data-n=\" 8 \">  runtime: {</span><span class=\"cl\" data-n=\" 9 \">    layer: <span class=\"s\">'level'</span>,</span><span class=\"cl\" data-n=\"10 \">    loadBehavior: <span class=\"s\">'eager'</span>,</span><span class=\"cl\" data-n=\"11 \">    frameRate: <span class=\"n\">60</span>,</span><span class=\"cl\" data-n=\"12 \">  },</span><span class=\"cl\" data-n=\"13 \">});</span></pre></figure>\n<div class=\"callout warn\"><svg><use href=\"#i-zap\"/></svg><p><b>Next.js support means the CLI can detect and invoke a static-export build.</b> Server features are not implied to run inside the Unreal runtime — the delivered artifact is always static web output.</p></div>"
  },
  "preview": {
    "t": "Preview",
    "m": "in development",
    "h": "\n<p>The preview direction: open a dedicated window that loads your actual UI, uses the generated interface contract, exposes reflected state as controls, triggers reflected events, and runs the same frontend code in preview and in Unreal.</p>\n<div class=\"callout warn\"><svg><use href=\"#i-zap\"/></svg><p><b>The preview workflow is an active development area.</b> Controls shown on this site illustrate the intended direction and are not production-ready tooling.</p></div>\n<ul><li>float → slider</li><li>int → number</li><li>bool → checkbox</li><li>enum → dropdown</li><li>string → text input</li><li>event → trigger button</li></ul>"
  },
  "profiling": {
    "t": "Profiling",
    "m": "diagnostics",
    "h": "\n<p>Engine-style diagnostics: browser FPS, presented FPS, paint-to-present latency, state flushes, CEF budget and frame pacing. See the live <a href=\"#/profiling\" class=\"acc\">profiler page</a> and the console commands documented there.</p>"
  },
  "troubleshooting": {
    "t": "Troubleshooting",
    "m": "documented scenarios",
    "h": "\n<h2>Transparency — UI appears black or white</h2>\n<p>The web page paints an opaque background over the world.</p>\n<ul><li>Set <code>body { background: transparent; }</code> in your CSS.</li><li>Enable transparency on the Document Asset.</li></ul>\n <figure class=\"code code-l\"><figcaption><span class=\"cf-file\">hud.css</span><span class=\"cf-lang\">css</span><button class=\"cf-copy\" data-copy=\"trcss\" aria-label=\"Copy code\"><svg><use href=\"#i-copy\"/></svg>copy</button></figcaption><pre><span class=\"cl\" data-n=\" 1 \">body {</span><span class=\"cl\" data-n=\" 2 \">  <span class=\"a\">background</span>: transparent;</span><span class=\"cl\" data-n=\" 3 \">}</span><span class=\"cl\" data-n=\" 4 \"> </span><span class=\"cl\" data-n=\" 5 \">/* <span class=\"a\">plus</span>: enable transparency</span><span class=\"cl\" data-n=\" 6 \">   on the USwuiDocumentAsset */</span></pre></figure>\n<h2>Keyboard — text input does not receive typing</h2>\n<ul><li>Check that the document has focus.</li><li>Check that pointer input is enabled for the document.</li><li>Check that the HTML input itself has focus inside the document.</li></ul>\n<h2>Dev server warning — localhost URL detected</h2>\n<p>A development localhost URL in a production document asset triggers a warning.</p>\n<div class=\"sig\">$ swui build --production</div>\n<p>Then point the Document Asset at the built static entry, e.g. <code>dist/index.html</code>.</p>\n<h2>Input falls through unexpectedly</h2>\n<ul><li>Verify the document's interactive flag and Z-order relative to overlapping documents.</li></ul>\n<h2>Document sleeps unexpectedly</h2>\n<ul><li>Check the sleep behavior — hidden documents are suspended via WasHidden by design.</li></ul>"
  }
};
