// @ts-nocheck
import React, { useEffect, useRef } from 'react'
import { $, $$, RM, clamp, damp, el, loop, codeFig, makeCrosshair, hl, toast, copyText, observeReveal } from '../utils/engine'

interface PageProps {
  hidden?: boolean
}

export const ProductPage: React.FC<PageProps> = ({ hidden }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const initedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || initedRef.current || hidden) return
    initedRef.current = true

    function initProduct() {
      // 1. Platform Matrix for UE 5.8.3
      const MX = [
        ['Windows x64 (Direct3D 11/12)', 'val', 'Primary Target', 'Zero-copy GPU shared texture handle (DXGI), 60/120 lockstep.'],
        ['Windows ARM64', 'exp', 'Experimental', 'Supported via native ARM64 Chromium / CEF build.'],
        ['macOS (Apple Silicon & Intel)', 'val', 'Supported', 'Off-screen rendering with Metal texture synchronization.'],
        ['Linux x86_64 (Vulkan)', 'val', 'Supported', 'CEF desktop off-screen runtime with BGRA buffer pipeline.'],
        ['Steam Deck / SteamOS (Proton)', 'val', 'Verified', 'Runs via standard Windows x64 D3D11 shared texture path under Proton.'],
        ['Android & iOS', 'no', 'Not Supported', 'CEF is desktop-only. Mobile web views require engine-native web widgets.'],
        ['Console (PS5, Xbox Series, Switch)', 'no', 'Not Supported', 'Chromium is prohibited by console vendor NDAs and OS sandbox policies.']
      ];
      const pmx = $('#platformMx');
      if (pmx) {
        pmx.innerHTML = `<div class="mrow h"><span>Platform</span><span>Status</span><span>Architecture Notes</span></div>` +
          MX.map(r => `<div class="mrow"><span class="mp"><b>${r[0]}</b></span><span><span class="badge ${r[1]}">${r[2]}</span></span><span class="ms">${r[3]}</span></div>`).join('');
      }

      // 2. Feature Status for UE 5.8.3
      const ST = [
        ['Multi-Document Manager Subsystem', 'val', 'Production Ready', 'Z-ordered Persistent, Level, and Modal document layers.'],
        ['D3D11 Shared Texture Pipeline', 'val', 'Production Ready', 'Zero-copy GPU texture sharing via HANDLE SharedHandle.'],
        ['State Bus & Atomic Batching', 'val', 'Production Ready', 'FlushStateBatch() once per engine tick; zero lock contention.'],
        ['Two-Way GameplayTag Events', 'val', 'Production Ready', 'Reflected Unreal dynamic delegates with JSON payload serialization.'],
        ['Slate Input Preprocessor', 'val', 'Production Ready', 'IME-aware text focus routing and IsTextInputFocused() suppression.'],
        ['True Chromium Sleep (WasHidden)', 'val', 'Production Ready', 'Suspends Blink timers, rAF, and compositing with 0% CPU consumption.'],
        ['World Mesh Screens (Diegetic UI)', 'val', 'Production Ready', 'USwuiWorldWidget actor component facade for in-world 3D meshes.'],
        ['TypeScript Contract Generator', 'val', 'Production Ready', 'Automatic bindings.gen.ts emitted from Blueprint observation nodes.']
      ];
      const smx = $('#statusMx');
      if (smx) {
        smx.innerHTML = ST.map(r => `<div class="mrow"><span class="mp"><b>${r[0]}</b></span><span><span class="badge ${r[1]}">${r[2]}</span></span><span class="ms">${r[3]}</span></div>`).join('');
      }

      // 3. Load behavior simulation
      $('#lbLazy')?.addEventListener('click', () => {
        const bar = $('#lbLazyBar');
        const txt = $('#lbLazyT');
        if (!bar || !txt) return;
        txt.textContent = '1. Creating CEF browser… 2. Compiling HTML/JS…';
        bar.style.width = '0%';
        requestAnimationFrame(() => { bar.style.width = '100%'; });
        setTimeout(() => {
          txt.textContent = 'Activated! Total cold load: 124 ms';
          toast('Lazy: Cold start performed at invocation');
        }, 1100);
      });

      $('#lbEager')?.addEventListener('click', () => {
        const txt = $('#lbEagerT');
        if (txt) txt.textContent = 'Activated in 0.2 ms! (Preloaded memory ready)';
        toast('Eager: Zero-stutter instant activation');
      });

      // 4. Input Routing Simulation
      const IM = {
        game: [
          ['W A S D', 'game: player movement'],
          ['Mouse Look', 'game: camera yaw/pitch'],
          ['Left Click', 'game: fire primary weapon'],
          ['I key', 'game: blocked']
        ],
        both: [
          ['W A S D', 'game: player movement'],
          ['Mouse Look', 'game: camera active'],
          ['Minimap Hover', 'ui: tooltip presented (z10)'],
          ['I key', 'ui: triggers Modal inventory']
        ],
        ui: [
          ['W A S D', 'ui: list navigation / text editing'],
          ['Mouse Cursor', 'ui: unlocked, captured by Slate'],
          ['Left Click', 'ui: interact with web controls'],
          ['Escape', 'ui: closes modal & restores game input']
        ]
      };

      const setIM = m => {
        $$('[data-im]').forEach(b => b.classList.toggle('on', b.dataset.im === m));
        const tr = $('#imTrace');
        if (tr) {
          tr.innerHTML = IM[m].map(([k, v]) => `<em>${k}</em> → <span class="${v.startsWith('ui') ? 'acc' : 'dim'}">${v}</span>`).join('<br>');
        }
      };
      $$('[data-im]').forEach(b => b.addEventListener('click', () => setIM(b.dataset.im)));
      setIM('both');

      // 5. Transparency Simulation
      $$('[data-tr]').forEach(b => b.addEventListener('click', () => {
        $$('[data-tr]').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        const good = b.dataset.tr === 'good';
        const badEl = $('#trBad');
        const goodEl = $('#trGood');
        if (badEl) badEl.firstElementChild.style.display = good ? 'none' : 'flex';
        if (goodEl) goodEl.style.opacity = good ? '1' : '.3';
      }));
      const ge = $('#trGood');
      if (ge) ge.style.opacity = '1';

      // 6. Code snippet
      const cd = $('#trCode');
      if (cd) cd.innerHTML = codeFig('trcss', 'Content/UI/hud.css', 'css', 'l', false);
    }

    try {
      initProduct();
    } catch (e) {
      console.error('Error in initProduct:', e);
    }

    observeReveal(containerRef.current);
  }, [hidden]);

  return (
    <div
      ref={containerRef}
      className="page paper"
      data-page="product"
      hidden={hidden}
      dangerouslySetInnerHTML={{
        __html: `
  <header class="pgh"><div class="wrap">
    <div class="eyebrow">Product &amp; Engine Spec · Unreal Engine 5.8.3</div>
    <h1>A runtime,<br><em>not a widget.</em><span class="si">— every subsystem stated plainly.</span></h1>
    <p class="lead">SWUI 3.0 is a complete web UI orchestration runtime for Unreal Engine 5.8.3. It manages multiple independent web documents, deterministic lifecycle, state synchronization, input arbitration, and hardware-accelerated rendering while Unreal remains the single source of truth for gameplay.</p>
  </div></header>

  <section class="sec"><div class="wrap">
    <div class="shead"><span class="sidx">01</span><span class="slbl">Document Asset</span><span class="srule"></span><span class="stag">USwuiDocumentAsset</span></div>
    <div class="sec-top">
      <h2 class="display">First-class assets<br><span class="si">in the Content Browser.</span></h2>
      <p class="lead">Each UI surface in SWUI is defined by a <b>USwuiDocumentAsset</b>. Artists and designers tune layer precedence, render paths, frame rates, and sleep parameters directly in the Unreal Editor Details panel.</p>
    </div>
    <div class="rp-grid">
      <div class="plate">
        <div class="plate-h"><span class="sq"></span>Details — USwuiDocumentAsset (UE 5.8.3)</div>
        <div class="plate-b">
          <div class="frow"><label>Document ID</label><span class="mono" style="font-size:12px;font-weight:600">MainHUD</span></div>
          <div class="frow"><label>Entry URL</label><span class="mono acc" style="font-size:11.5px">Content/UI/hud.html</span></div>
          <div class="frow"><label>Layer</label><span class="chip on">Level (Z-10)</span></div>
          <div class="frow"><label>Load Behavior</label><span class="chip">Eager Preload</span></div>
          <div class="frow"><label>Render Path</label><span class="chip on">D3D11 Shared Texture (Zero-Copy)</span></div>
          <div class="frow"><label>Pacing Target</label><span class="mono">60 FPS (External Begin Frames)</span></div>
          <div class="frow"><label>Transparency</label><span class="mono" style="color:var(--ok)">Enabled (Premultiplied Alpha)</span></div>
          <div class="frow"><label>Sleep When Hidden</label><span class="mono" style="color:var(--ok)">WasHidden (0% CPU Consumption)</span></div>
          <div class="frow"><label>Input Routing</label><span class="mono">Slate Input Preprocessor</span></div>
          <div class="frow"><label>Paused World Tick</label><span class="mono">TickableWhenPaused = true</span></div>
        </div>
      </div>
      <div>
        <h3 class="display" style="font-size:clamp(20px,2.2vw,28px)">Load Behavior: Lazy vs. Eager</h3>
        <p class="lead" style="font-size:13.5px;margin:8px 0 16px">Lazy loads on demand at activation. Eager preloads Chromium and pre-compiles scripts in the background, achieving 0-stutter transitions.</p>
        <div class="grid2">
          <div class="plate"><div class="plate-b">
            <h5 class="mono" style="font-size:10px;letter-spacing:.2em;color:var(--mut)">LAZY ALLOCATION</h5>
            <p style="font-size:12px;color:var(--mut);margin:8px 0 12px">Button click → allocate browser → compile scripts → render</p>
            <button class="tbtn" id="lbLazy">Simulate Lazy Load</button>
            <div style="height:3px;background:var(--ln2);margin-top:12px"><i id="lbLazyBar" style="display:block;height:100%;width:0;background:var(--blaze);transition:width 1.1s linear"></i></div>
            <p class="mono dim" style="font-size:10px;margin-top:8px" id="lbLazyT">idle</p>
          </div></div>
          <div class="plate"><div class="plate-b">
            <h5 class="mono" style="font-size:10px;letter-spacing:.2em;color:var(--mut)">EAGER PRELOAD</h5>
            <p style="font-size:12px;color:var(--mut);margin:8px 0 12px">Pre-allocated during level load → instant mount</p>
            <span class="chip on">pre-rendered · resident</span>
            <button class="tbtn" id="lbEager" style="margin-top:12px">Instant Mount</button>
            <p class="mono dim" style="font-size:10px;margin-top:12px" id="lbEagerT">idle</p>
          </div></div>
        </div>

        <h3 class="display" style="font-size:clamp(20px,2.2vw,28px);margin-top:36px">Input Arbitration Modes</h3>
        <p class="lead" style="font-size:13.5px;margin:8px 0 12px">The Slate input preprocessor dynamically filters input depending on document focus and modal state:</p>
        <div class="api-strip" style="margin:10px 0" id="imModes">
          <button class="tbtn" data-im="game">Game Only</button>
          <button class="tbtn on" data-im="both">Game + HUD</button>
          <button class="tbtn" data-im="ui">UI Modal Focus</button>
        </div>
        <div class="ir-trace" id="imTrace" style="min-height:96px"></div>

        <h3 class="display" style="font-size:clamp(20px,2.2vw,28px);margin-top:36px">Alpha Blending &amp; Transparency</h3>
        <p class="lead" style="font-size:13.5px;margin:8px 0 12px">SWUI surfaces blend directly over Unreal's 3D viewport using premultiplied alpha. Set <span class="mono">background: transparent</span> in CSS to let the 3D world shine through:</p>
        <div class="api-strip" style="margin:10px 0">
          <button class="tbtn" data-tr="bad">Opaque Body (Default Web)</button>
          <button class="tbtn on" data-tr="good">Transparent Body (SWUI HUD)</button>
        </div>
        <div class="grid2">
          <div class="roi-wrap" style="aspect-ratio:16/9;border:1px solid var(--ln)" id="trBad">
            <div style="position:absolute;inset:0;background:#F4F3ED;display:flex;align-items:center;justify-content:center;color:var(--ink);font:600 12px var(--sans)">Opaque CSS body hides the 3D game world</div>
          </div>
          <div class="roi-wrap" style="aspect-ratio:16/9;border:1px solid var(--ln)" id="trGood">
            <div style="position:absolute;inset:56% -12% 0;background:linear-gradient(rgba(239,238,232,.05) 1px,transparent 1px) 0 0/100% 32px,linear-gradient(90deg,rgba(239,238,232,.05) 1px,transparent 1px) 0 0/56px 100%;transform:perspective(300px) rotateX(58deg);transform-origin:top;pointer-events:none"></div>
            <div style="position:absolute;left:14px;top:12px;font:500 11px var(--mono);color:var(--bone)">VITALS 100%</div>
            <div style="position:absolute;right:14px;bottom:10px;font:600 24px var(--mono);color:var(--bone)">24 <span style="font-size:11px;color:#6E7078">| 180</span></div>
          </div>
        </div>
        <div id="trCode" style="margin-top:14px"></div>
      </div>
    </div>
  </div></section>

  <section class="sec inksec"><div class="wrap">
    <div class="shead"><span class="sidx">02</span><span class="slbl">Desktop Platform Matrix</span><span class="srule"></span><span class="stag">Unreal Engine 5.8.3</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(26px,3.2vw,44px)">Platform matrix.<br><span class="si">architectural breakdown.</span></h2>
      <p class="lead">SWUI embeds a native Chromium Embedded Framework runtime customized specifically for desktop Unreal games. Below is the authoritative platform capability matrix for UE 5.8.3.</p>
    </div>
    <div class="matrix" id="platformMx" style="overflow-x:auto;-webkit-overflow-scrolling:touch"></div>

    <div class="shead" style="margin-top:64px"><span class="sidx">03</span><span class="slbl">Subsystem Status</span><span class="srule"></span><span class="stag">Production Verified</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(26px,3.2vw,44px)">Engine subsystems.<br><span class="si">built for production.</span></h2>
      <p class="lead">Every subsystem is benchmarked under high frame rate stress testing (60–120 FPS) with multi-document concurrency.</p>
    </div>
    <div class="matrix" id="statusMx" style="overflow-x:auto;-webkit-overflow-scrolling:touch"></div>
  </div></section>
`
      }}
    />
  )
}
