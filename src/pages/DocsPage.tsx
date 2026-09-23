// @ts-nocheck
import React, { useEffect, useRef } from 'react'
import { $, $$, RM, clamp, damp, el, loop, codeFig, makeCrosshair, hl, toast, copyText, observeReveal } from '../utils/engine'

interface DocsPageProps {
  hidden?: boolean
  docId?: string
  onOpenSearch?: () => void
}

export const DocsPage: React.FC<DocsPageProps> = ({ hidden, docId = 'getting-started', onOpenSearch }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const initedRef = useRef(false)
  const openSearch = () => {
    if (onOpenSearch) onOpenSearch()
  }

  /* ============================================================ DOCS */
const DOCNAV=[
  ['GETTING STARTED',[['getting-started','Overview'],['installation','Installation'],['vanilla','Vanilla HTML']]],
  ['CORE CONCEPTS',[['documents','Documents'],['state','State'],['events','Events'],['input','Input']]],
  ['RUNTIME',[['rendering','Rendering'],['performance','Performance']]],
  ['INTEGRATION',[['blueprint','Blueprint & Codegen'],['typescript','TypeScript'],['react','React'],['vue','Vue'],['svelte','Svelte'],['cli','CLI & Config']]],
  ['TOOLS',[['preview','Preview'],['profiling','Profiling'],['troubleshooting','Troubleshooting']]],
];
const DOCS={
'getting-started':{t:'Getting Started',m:'5 min · vanilla path',h:`
<p>SWUI puts a web UI runtime inside Unreal Engine. You write HTML, CSS and JavaScript — or a full modern frontend — and Unreal owns gameplay state, events and runtime control.</p>
<h2>Path A — Vanilla</h2>
<ol><li>Create <code>Content/UI/hud.html</code></li><li>Create an <b>SWUI Document Asset</b></li><li>Set the <b>Entry URL</b> to your HTML file</li><li><b>Load</b> the document</li><li><b>Activate</b> the document</li><li><b>Set state</b> from Unreal</li><li>Handle a <b>navigation event</b> from the web side</li></ol>
<h2>Path B — Modern frontend</h2>
<ol><li><code>npm i @swui/core</code></li><li>Install a framework package — <code>@swui/react</code>, <code>@swui/vue</code> or <code>@swui/svelte</code></li><li>Build your frontend</li><li><code>swui build --production</code></li><li>Point the Document Asset at <code>dist/index.html</code></li><li>Activate in Unreal</li></ol>
 ${codeFig('hudHtml','hud.html','html','l')}
<div class="callout"><svg><use href="#i-zap"/></svg><p>No Node, no bundler, no framework required for the basic workflow — a single HTML file is a complete UI document.</p></div>`},
'installation':{t:'Installation',m:'plugin · npm',h:`
<p>Install the SWUI plugin into your Unreal project's <code>Plugins</code> directory and enable it in the editor. The embedded CEF/Chromium runtime ships with the plugin for supported desktop platforms.</p>
<h2>Frontend side (optional)</h2>
<div class="sig">npm i @swui/core
npm i @swui/react   # or @swui/vue · @swui/svelte
npm i -D @swui/cli</div>
<div class="callout warn"><svg><use href="#i-zap"/></svg><p>See the repository for the current authoritative installation steps and license terms. Platform support is stated on the <a href="#/product" class="acc">product page</a>.</p></div>`},
'vanilla':{t:'Vanilla HTML',m:'no framework · no node',h:`
<p>The simplest entry point: one file, zero tooling. The runtime injects the <code>swui</code> global into every document.</p>
<h2>The whole HUD</h2>
 ${codeFig('vanilla','hud.html — script','js','l')}
<p>Point a <code>USwuiDocumentAsset</code> at the file, load it, activate it. The HUD appears in the Unreal viewport — transparent, layered, input-aware.</p>`},
'documents':{t:'Documents',m:'layers · z-order · assets',h:`
<p>Every UI is its own web document, managed independently by the runtime. Documents live in three primary layers.</p>
<h2>Layers</h2>
<ul><li><b>Persistent</b> — network info, ping, chat, global notifications. Survives level transitions.</li><li><b>Level</b> — HUD, minimap, crosshair, objective tracker. Removed during level travel.</li><li><b>Modal</b> — inventory, pause menu, skill tree, settings, dialogue, confirmations.</li></ul>
<h2>Z-order</h2>
<ul><li><b>0–9</b> background / persistent</li><li><b>10–49</b> gameplay HUD</li><li><b>50–99</b> contextual UI</li><li><b>100–199</b> interactive windows</li><li><b>200–299</b> system menus</li><li><b>300+</b> critical system dialogs</li></ul>
<h2>USwuiDocumentAsset</h2>
<p>The asset defines: Document ID, Entry URL, Layer, Z-order, Load behavior (lazy / eager), Transparency, Sleep behavior and Render mode.</p>
<div class="callout"><svg><use href="#i-zap"/></svg><p>Try the interactive document stack and lifecycle on the <a href="#/" class="acc">homepage</a>.</p></div>`},
'state':{t:'State',m:'bus · batching · API',h:`
<p>Unreal publishes reflected properties to a global state bus. Documents subscribe to fields; only relevant listeners react. The frontend never polls.</p>
<h2>Accumulate, then flush</h2>
<p>Updates are accumulated during the frame and flushed as one atomic batch — every framework sees the same snapshot, once.</p>
 ${codeFig('state','state.ts','ts','l')}
<h2>Runtime data</h2>
<p>The SDK also exposes runtime timing: <code>fps</code>, <code>dt</code>, <code>time</code>, <code>frameIndex</code>, <code>stateVersion</code>, <code>cefFps</code>, <code>width</code>, <code>height</code>, <code>timeDilation</code> and <code>paused</code> — so UI animation can be driven by game time, not wall time.</p>`},
'events':{t:'Events',m:'GameplayTags · payloads',h:`
<p>Events flow both ways. The web side emits structured messages that arrive in Unreal as GameplayTag events; reflected Unreal events arrive in the document as typed subscriptions.</p>
 ${codeFig('events','events.ts','ts','l')}
<h2>Tag conventions</h2>
<p>Tags such as <code>UI.Inventory.UseItem</code> or <code>UI.Menu.Resume</code> map cleanly onto Unreal's GameplayTag hierarchy — handlers stay declarative on the engine side.</p>`},
'input':{t:'Input',m:'pointer · keyboard · gamepad',h:`
<h2>Pointer</h2>
<p>One input surface, many documents. Every pointer event is hit-tested: visible, interactive, contains the pointer, highest Z-order wins. If no document accepts it, input falls through to gameplay.</p>
<h2>Keyboard / text</h2>
<p>Focused web inputs receive printable characters, modifiers and text events through the Slate input preprocessor into CEF. The routing architecture is designed to stay compatible with IME input flows on desktop.</p>
<h2>Gamepad navigation</h2>
 ${codeFig('navigation','navigation.ts','ts','l')}
<h2>Input enablement</h2>
<ul><li><b>Game Only</b> — everything goes to gameplay</li><li><b>Game + UI</b> — split by focus and document interactivity</li><li><b>UI Only</b> — the document captures everything</li></ul>`},
'rendering':{t:'Rendering',m:'GPU · CPU · pacing · ROI',h:`
<h2>GPU shared texture path</h2>
<p>The primary accelerated path. Chromium renders off-screen; a shared GPU resource — Direct3D 11 / DXGI shared textures — lets the Unreal RHI consume the texture without staging the full frame through CPU memory.</p>
<h2>CPU fallback</h2>
<p>A full-surface renderer paints into a BGRA system-memory buffer, double-buffered and uploaded as an RHI texture update. It exists for platform compatibility and is not equivalent in throughput to the GPU path.</p>
<h2>External begin frames</h2>
<p>Unreal can drive Chromium's frame production rather than letting the browser free-run. The UI composites in step with the engine clock.</p>
<h2>Region of interest</h2>
<p>For mostly-transparent HUDs, SWUI tracks changed rectangles and blits only those regions — the unchanged majority of the surface is not repainted.</p>`},
'performance':{t:'Performance',m:'sleep · batching · budget',h:`
<p>Performance in SWUI is architectural, not a benchmark claim:</p>
<ul><li><b>Chromium sleep</b> — hidden documents suspend rAF, timers and compositing via WasHidden.</li><li><b>State batching</b> — one atomic flush per frame; N property changes become one evaluation per document.</li><li><b>CEF message-loop budget</b> — browser work is bounded per frame (<code>swui.cefMessageLoopBudgetMs</code>).</li><li><b>Preloading</b> — prepare documents before the player needs them.</li><li><b>ROI</b> — repaint only what changed.</li></ul>
<p>Measure it yourself with the <a href="#/profiling" class="acc">profiler</a>.</p>`},
'blueprint':{t:'Blueprint & Codegen',m:'observe nodes · contracts',h:`
<p>The Blueprint graph can be the source of truth. <code>SwuiObserve</code> and <code>SwuiObserveEvent</code> nodes declare what the UI can see; SWUI derives TypeScript binding information from them.</p>
<div class="sig">Blueprint graph → reflection → Refresh JS Bindings → bindings.gen.ts</div>
<p>For the documented workflow, no separate manual class configuration is required — the observed properties and events become the generated contract directly.</p>
<h2>Workflow</h2>
<ol><li>Create SWUI Interface</li><li>Select HTML entry</li><li>Create Document Asset</li><li>Load · Activate</li><li>Bind state · bind events</li><li>Generate frontend contract</li></ol>`},
'typescript':{t:'TypeScript',m:'generated types',h:`
<p>State fields, event names, payloads, namespaces and value types are generated from Unreal reflection:</p>
 ${codeFig('gen','bindings.gen.ts','ts','l')}
<p>Unreal defines the contract. The web UI consumes the contract — with autocomplete.</p>`},
'react':{t:'React',m:'@swui/react',h:`
<p>First-party hooks over the core runtime:</p>
 ${codeFig('react','AmmoCounter.tsx','ts','l')}
<p><code>useSwuiState</code>, <code>useSwuiEvent</code>, <code>useSwuiNavigation</code> and <code>useSwuiTimeline</code> cover the documented React surface.</p>`},
'vue':{t:'Vue',m:'@swui/vue',h:`
<p>Composition API bindings over the same contract:</p>
 ${codeFig('vue','composables.ts','ts','l')}
<p>State and events behave identically to the React integration — only the rendering layer changes.</p>`},
'svelte':{t:'Svelte',m:'@swui/svelte',h:`
<p>Runtime-backed Svelte stores:</p>
 ${codeFig('svelte','Crosshair.svelte','ts','l')}
<p>Unreal state → SWUI core → Svelte store → component. The store updates drive Svelte's reactivity directly.</p>`},
'cli':{t:'CLI & Config',m:'@swui/cli',h:`
<p><code>swui dev</code> starts the development workflow with live reload. <code>swui build --production</code> produces static assets for the Unreal runtime. The CLI detects frontend project structure — Vite configurations, and Next.js static-export projects.</p>
 ${codeFig('config','swui.config.ts','ts','l')}
<div class="callout warn"><svg><use href="#i-zap"/></svg><p><b>Next.js support means the CLI can detect and invoke a static-export build.</b> Server features are not implied to run inside the Unreal runtime — the delivered artifact is always static web output.</p></div>`},
'preview':{t:'Preview',m:'in development',h:`
<p>The preview direction: open a dedicated window that loads your actual UI, uses the generated interface contract, exposes reflected state as controls, triggers reflected events, and runs the same frontend code in preview and in Unreal.</p>
<div class="callout warn"><svg><use href="#i-zap"/></svg><p><b>The preview workflow is an active development area.</b> Controls shown on this site illustrate the intended direction and are not production-ready tooling.</p></div>
<ul><li>float → slider</li><li>int → number</li><li>bool → checkbox</li><li>enum → dropdown</li><li>string → text input</li><li>event → trigger button</li></ul>`},
'profiling':{t:'Profiling',m:'diagnostics',h:`
<p>Engine-style diagnostics: browser FPS, presented FPS, paint-to-present latency, state flushes, CEF budget and frame pacing. See the live <a href="#/profiling" class="acc">profiler page</a> and the console commands documented there.</p>`},
'troubleshooting':{t:'Troubleshooting',m:'documented scenarios',h:`
<h2>Transparency — UI appears black or white</h2>
<p>The web page paints an opaque background over the world.</p>
<ul><li>Set <code>body { background: transparent; }</code> in your CSS.</li><li>Enable transparency on the Document Asset.</li></ul>
 ${codeFig('trcss','hud.css','css','l')}
<h2>Keyboard — text input does not receive typing</h2>
<ul><li>Check that the document has focus.</li><li>Check that pointer input is enabled for the document.</li><li>Check that the HTML input itself has focus inside the document.</li></ul>
<h2>Dev server warning — localhost URL detected</h2>
<p>A development localhost URL in a production document asset triggers a warning.</p>
<div class="sig">$ swui build --production</div>
<p>Then point the Document Asset at the built static entry, e.g. <code>dist/index.html</code>.</p>
<h2>Input falls through unexpectedly</h2>
<ul><li>Verify the document's interactive flag and Z-order relative to overlapping documents.</li></ul>
<h2>Document sleeps unexpectedly</h2>
<ul><li>Check the sleep behavior — hidden documents are suspended via WasHidden by design.</li></ul>`},
};
function buildDocSidebar(){
  const s=$('#docSide');
  s.innerHTML='<div style="padding:4px 0 12px"><button class="tbtn" id="docSearchBtn" style="width:100%;justify-content:center"><svg width="11" height="11"><use href="#i-search"/></svg> Search — press /</button></div>';
  DOCNAV.forEach(([cat,items])=>{
    s.appendChild(el('h5',null,cat));
    items.forEach(([id,t])=>{
      const a=el('a',null,t);a.href='#/docs/'+id;a.dataset.doc=id;s.appendChild(a);
    });
  });
  $('#docSearchBtn').addEventListener('click',openSearch);
}
function renderDoc(id){
  const d=DOCS[id]||DOCS['getting-started'];
  $$('#docSide a').forEach(a=>a.classList.toggle('on',a.dataset.doc===id));
  const order=DOCNAV.flatMap(c=>c[1]);const i=order.findIndex(o=>o[0]===id);
  const prev=order[i-1],next=order[i+1];
  $('#docBody').innerHTML=`
    <div class="doc-crumb"><a href="#/">SWUI</a><span>/</span><a href="#/docs/getting-started">Docs</a><span>/</span><span>${d.t}</span></div>
    <h1>${d.t}</h1>
    <div class="doc-meta"><span class="chip on">${d.m}</span></div>
    <div>${d.h}</div>
    <div class="doc-nav">
      ${prev?`<a href="#/docs/${prev[0]}"><span>Previous</span><b>${prev[1]}</b></a>`:'<span></span>'}
      ${next?`<a class="nn" href="#/docs/${next[0]}"><span>Next</span><b>${next[1]}</b></a>`:''}
    </div>`;
}


  useEffect(() => {
    if (!containerRef.current || hidden) return
    if (!initedRef.current) {
      initedRef.current = true
      buildDocSidebar()
      const searchBtn = containerRef.current.querySelector('#docSearchBtn')
      if (searchBtn && onOpenSearch) {
        searchBtn.addEventListener('click', onOpenSearch)
      }
    }
    renderDoc(docId || 'getting-started')
    observeReveal(containerRef.current)
  }, [hidden, docId])

  return (
    <div
      ref={containerRef}
      className="page paper"
      data-page="docs"
      hidden={hidden}
      dangerouslySetInnerHTML={{ __html: `
  <div class="wrap docs-g">
    <aside class="doc-side" id="docSide" aria-label="Documentation navigation"></aside>
    <article class="doc-body" id="docBody"></article>
  </div>
</div>

<!-- ================================================= REFERENCE ================================================= -->` }}
    />
  )
}
