// @ts-nocheck
import React, { useEffect, useRef } from 'react'
import { $, $$, RM, clamp, damp, el, loop, codeFig, makeCrosshair, hl, toast, copyText, observeReveal } from '../utils/engine'

interface PageProps {
  hidden?: boolean
}

export const ArchitecturePage: React.FC<PageProps> = ({ hidden }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const initedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || initedRef.current || hidden) return
    initedRef.current = true

    function initArch() {
      const AM = [
        {
          t: 'Layer 1: Frontend Application Layer',
          d: 'Modern web tooling (Vite, React 18, Vue 3, Svelte 4/5, or vanilla TypeScript). SWUI treats the web project as static assets in Content/UI/ — no Node.js runtime executes inside Unreal. State is subscribed reactively, and events are emitted via GameplayTags.',
          tags: ['React 18', 'Vue 3', 'Svelte', 'Vanilla TS', 'Vite', 'Static Assets']
        },
        {
          t: 'Layer 2: Embedded Chromium (CEF)',
          d: 'Customized desktop Chromium Embedded Framework runtime providing Blink layout, V8 JIT execution, and GPU-accelerated compositing. SWUI drives Chromium using external begin frames (SendExternalBeginFrame) locked to Unreal ticks, and puts hidden documents into true sleep via WasHidden().',
          tags: ['Blink', 'V8 Engine', 'External Begin Frames', 'WasHidden() Sleep', 'Off-screen Rendering']
        },
        {
          t: 'Layer 3: SWUI Document Subsystem',
          d: 'USwuiDocumentManagerSubsystem is the central engine coordinator. It manages the multi-document registry (Persistent, Level, Modal), executes per-frame state batching (FlushStateBatch), enforces deterministic level travel cleanup, and routes hit-testing.',
          tags: ['USwuiDocumentManagerSubsystem', 'USwuiDocument', 'USwuiView', 'FSwuiScheduler', 'State Batching']
        },
        {
          t: 'Layer 4: Hardware & GPU Pipeline',
          d: 'On Windows x64, Chromium renders directly into a DirectX 11 shared texture handle (HANDLE SharedHandle). Unreal imports this via DXGI zero-copy, skipping CPU system memory entirely. On systems without D3D11 sharing, double-buffered BGRA CPU fallback takes over automatically.',
          tags: ['D3D11 Shared Texture', 'HANDLE SharedHandle', 'Zero-Copy DXGI', 'BGRA CPU Fallback', 'Slate ROI Blit']
        },
        {
          t: 'Layer 5: Unreal Engine 5.8.3 Core',
          d: 'Unreal remains the sole authority for gameplay. The Slate input preprocessor catches keystrokes (KEYEVENT_CHAR) and IME compositions. Dynamic delegates are serialized using the ProcessEvent override on USwuiDelegateBridge with UProperty reflection.',
          tags: ['FSlateInputPreprocessor', 'GameplayTags', 'ProcessEvent Override', 'UProperty Reflection', 'Slate Viewport']
        }
      ];

      const stack = $('#amStack');
      if (stack) {
        stack.innerHTML = '';
        AM.forEach((a, i) => {
          const d = el('button', 'al' + (i === 2 ? ' sel' : ''), `<b${i === 2 ? ' class="acc"' : ''}>${a.t}</b>`);
          d.addEventListener('click', () => {
            $$('.al', stack).forEach(x => x.classList.remove('sel'));
            d.classList.add('sel');
            const titleEl = $('#amTitle');
            const descEl = $('#amDesc');
            const tagsEl = $('#amTags');
            if (titleEl) titleEl.textContent = a.t;
            if (descEl) descEl.textContent = a.d;
            if (tagsEl) tagsEl.innerHTML = a.tags.map(t => `<span class="chip on">${t}</span>`).join('');
          });
          stack.appendChild(d);
        });
        const titleEl = $('#amTitle');
        const descEl = $('#amDesc');
        const tagsEl = $('#amTags');
        if (titleEl) titleEl.textContent = AM[2].t;
        if (descEl) descEl.textContent = AM[2].d;
        if (tagsEl) tagsEl.innerHTML = AM[2].tags.map(t => `<span class="chip on">${t}</span>`).join('');
      }

      // Unload sequence simulation
      $('#mmRun')?.addEventListener('click', () => {
        const nodes = $$('#mmFlow .fnode');
        nodes.forEach(x => x.classList.remove('lit'));
        nodes.forEach((x, i) => setTimeout(() => x.classList.add('lit'), i * 360));
        toast('Simulating deterministic document unload & resource reclamation');
      });

      // Level travel simulation
      const LT1 = [
        ['chat.html (PERSISTENT)', 'ACTIVE', 'var(--ok)'],
        ['hud.html (LEVEL)', 'ACTIVE', 'var(--ok)'],
        ['inventory.html (MODAL)', 'SLEEPING', 'var(--warn)']
      ];
      const LT2 = [
        ['chat.html (PERSISTENT)', 'SURVIVED', 'var(--ok)'],
        ['hud.html (LEVEL)', 'CLEANED UP', 'var(--mut)'],
        ['level2_hud.html (LEVEL)', 'PRELOADED → ACTIVE', 'var(--acc)']
      ];

      const renderRows = (elTarget, arr) => {
        if (!elTarget) return;
        elTarget.innerHTML = arr.map(([n, s, c]) => `
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--ln2);font:400 11.5px var(--mono)">
            <span>${n}</span>
            <span style="color:${c};font-weight:600">${s}</span>
          </div>`).join('');
      };

      const elLt1 = $('#lt1');
      const elLt2 = $('#lt2');
      renderRows(elLt1, LT1);
      renderRows(elLt2, [['chat.html (PERSISTENT)', 'SLEEPING', 'var(--warn)'], ['hud.html (LEVEL)', 'UNLOADED', 'var(--mut)'], ['inventory.html (MODAL)', 'UNLOADED', 'var(--mut)']]);

      $('#ltRun')?.addEventListener('click', () => {
        renderRows(elLt1, LT1);
        setTimeout(() => renderRows(elLt1, [
          ['chat.html (PERSISTENT)', 'ACTIVE (SURVIVES)', 'var(--ok)'],
          ['hud.html (LEVEL)', 'SHUTDOWN() IN PROGRESS', 'var(--acc)'],
          ['inventory.html (MODAL)', 'UNLOADING', 'var(--mut)']
        ]), 800);
        setTimeout(() => renderRows(elLt1, [
          ['chat.html (PERSISTENT)', 'SURVIVED TRAVEL', 'var(--ok)'],
          ['hud.html (LEVEL)', 'RESOURCES RECLAIMED', 'var(--mut)'],
          ['inventory.html (MODAL)', 'UNLOADED', 'var(--mut)']
        ]), 1600);
        setTimeout(() => renderRows(elLt2, [
          ['chat.html (PERSISTENT)', 'ACTIVE', 'var(--ok)'],
          ['level2_hud.html (LEVEL)', 'PRELOAD HIT (0 ms)', 'var(--acc)']
        ]), 2400);
        setTimeout(() => renderRows(elLt2, LT2), 3200);
        toast('Level travel executed: persistent documents preserved, level memory cleaned');
      });
    }

    try {
      initArch();
    } catch (e) {
      console.error('Error in initArch:', e);
    }

    observeReveal(containerRef.current);
  }, [hidden]);

  return (
    <div
      ref={containerRef}
      className="page inksec"
      data-page="architecture"
      hidden={hidden}
      dangerouslySetInnerHTML={{
        __html: `
  <header class="pgh"><div class="wrap">
    <div class="eyebrow" style="color:#8A8C95">Architecture &amp; Subsystems · UE 5.8.3</div>
    <h1>Two worlds.<br><em>One runtime.</em><span class="si">— five decoupled subsystems.</span></h1>
    <p class="lead">Unreal Engine 5.8.3 remains the authoritative source of truth for all gameplay state, timing, and physics. SWUI bridges embedded Chromium directly to Slate and Direct3D 11 with zero-copy shared GPU textures.</p>
  </div></header>

  <section class="sec" style="border-top:0"><div class="wrap">
    <div class="shead"><span class="sidx">01</span><span class="slbl">Subsystem Hierarchy</span><span class="srule"></span><span class="stag">Interactive 5-Layer Stack</span></div>
    <div class="rp-grid">
      <div class="arch-stack" id="amStack"></div>
      <div class="lc-desc" style="position:sticky;top:76px;min-height:280px">
        <h4 id="amTitle">Layer 3: SWUI Document Subsystem</h4>
        <p id="amDesc">USwuiDocumentManagerSubsystem is the central engine coordinator...</p>
        <div class="api-strip" style="margin-top:16px" id="amTags"></div>
      </div>
    </div>
  </div></section>

  <section class="sec"><div class="wrap">
    <div class="shead"><span class="sidx">02</span><span class="slbl">Coordinator Subsystem</span><span class="srule"></span><span class="stag">USwuiDocumentManagerSubsystem</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(26px,3.2vw,46px)">The engine coordinator.<br><span class="si">zero lock contention.</span></h2>
      <p class="lead">Instantiated automatically as an Unreal GameInstance subsystem. Drives frame pacing, atomic state flushing, input preprocessor arbitration, and level persistence.</p>
    </div>
    <div class="tele" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
      <div>
        <b style="color:var(--bone);font-size:13px">1. Centralized Frame Pacing</b>
        <span style="font:400 12.5px/1.6 var(--sans);color:var(--mut);margin-top:6px;display:block">
          Drives Chromium frame production lockstep via <code style="color:var(--acc)">SendExternalBeginFrame()</code> inside the engine render tick. Eliminates drift and presentation jitter.
        </span>
      </div>
      <div>
        <b style="color:var(--bone);font-size:13px">2. Atomic Frame Batching</b>
        <span style="font:400 12.5px/1.6 var(--sans);color:var(--mut);margin-top:6px;display:block">
          Dirty properties accumulate throughout the frame and flush in a single contiguous batch via <code style="color:var(--acc)">FlushStateBatch()</code>, eliminating micro-stutters and IPC thrashing.
        </span>
      </div>
      <div>
        <b style="color:var(--bone);font-size:13px">3. 3-Tier Layer Registry</b>
        <span style="font:400 12.5px/1.6 var(--sans);color:var(--mut);margin-top:6px;display:block">
          Maintains strict z-ordering across <b>Persistent</b> (survives level travel), <b>Level</b> (HUD/vitals), and <b>Modal</b> (inventory/pause) documents.
        </span>
      </div>
      <div>
        <b style="color:var(--bone);font-size:13px">4. Slate Input Preprocessor</b>
        <span style="font:400 12.5px/1.6 var(--sans);color:var(--mut);margin-top:6px;display:block">
          Intercepts Slate events before the game viewport. Automatically routes <code style="color:var(--acc)">KEYEVENT_CHAR</code> and IME text to focused web inputs, suppressing game actions.
        </span>
      </div>
    </div>
  </div></section>

  <section class="sec"><div class="wrap">
    <div class="shead"><span class="sidx">03</span><span class="slbl">Deterministic Memory Management</span><span class="srule"></span><span class="stag">Deterministic Unload</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(26px,3.2vw,46px)">Deterministic cleanup.<br><span class="si">zero memory leaks.</span></h2>
      <p class="lead">When a document is closed or unloaded during level travel, SWUI cascades resource destruction in a deterministic order:</p>
    </div>
    <div class="plate" style="max-width:960px">
      <div class="plate-h">
        <span class="sq"></span>Resource Destruction Cascade
        <span class="sp"></span>
        <button class="tbtn pri" id="mmRun"><svg><use href="#i-play"/></svg> Simulate Unload</button>
      </div>
      <div class="plate-b" style="overflow-x:auto;-webkit-overflow-scrolling:touch">
        <div class="flow" id="mmFlow" style="min-width:680px;flex-wrap:nowrap;gap:8px">
          <div class="fnode"><b>Active Document</b><span>Deactivate()</span></div><div class="fwire"></div>
          <div class="fnode"><b>WasHidden()</b><span>Blink suspend</span></div><div class="fwire"></div>
          <div class="fnode"><b>CEF Browser</b><span>CloseBrowser()</span></div><div class="fwire"></div>
          <div class="fnode"><b>DXGI Handle</b><span>Release shared ptr</span></div><div class="fwire"></div>
          <div class="fnode"><b>Slate Texture</b><span>RHI cleanup</span></div><div class="fwire"></div>
          <div class="fnode"><b>RAM &amp; VRAM</b><span>100% reclaimed</span></div>
        </div>
      </div>
    </div>
  </div></section>

  <section class="sec paper"><div class="wrap">
    <div class="shead"><span class="sidx">04</span><span class="slbl">Level Travel Lifecycle</span><span class="srule"></span><span class="stag">Persistence Split</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(26px,3.2vw,46px)">What survives travel.<br><span class="si">clean boundary separation.</span></h2>
      <p class="lead">Persistent documents remain mounted and ticking across level transitions. Level-specific documents are cleaned up cleanly to prevent stale references.</p>
    </div>
    <div class="lt-grid">
      <div class="plate">
        <div class="plate-h"><span class="sq"></span>Level 01 (Pre-Travel)</div>
        <div class="plate-b" id="lt1"></div>
      </div>
      <div style="display:flex;align-items:center;justify-content:center;padding:14px 10px">
        <div style="text-align:center">
          <div style="width:2px;height:54px;background:var(--blaze);margin:0 auto"></div>
          <div class="mono" style="font-size:9px;letter-spacing:.2em;color:var(--mut);margin-top:10px">TRAVEL</div>
        </div>
      </div>
      <div class="plate">
        <div class="plate-h"><span class="sq"></span>Level 02 (Post-Travel)</div>
        <div class="plate-b" id="lt2"></div>
      </div>
    </div>
    <button class="tbtn" id="ltRun" style="margin-top:20px"><svg><use href="#i-play"/></svg> Simulate Level Transition</button>
  </div></section>

  <section class="sec inksec"><div class="wrap">
    <div class="shead"><span class="sidx">05</span><span class="slbl">Architectural Decision Records (ADRs)</span><span class="srule"></span><span class="stag">Authoritative Specs</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(26px,3.2vw,46px)">Engineering ADRs.<br><span class="si">core architectural decisions.</span></h2>
      <p class="lead">Key decisions recorded in the SWUI repository that govern how the engine integrates with Chromium and Unreal Engine 5.8.3:</p>
    </div>
    <div class="tele" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">
      <div>
        <b style="color:var(--bone);font-size:13px">ADR 0001: Unreal Reflection as Source of Truth</b>
        <span style="font:400 12.5px/1.6 var(--sans);color:var(--mut);margin-top:6px;display:block">
          All state fields and reflected delegates are discovered via Unreal's <code style="color:var(--acc)">UProperty</code> reflection. No hand-maintained glue code or IDLs.
        </span>
      </div>
      <div>
        <b style="color:var(--bone);font-size:13px">ADR 0002: Navigation Payloads Use UScriptStruct</b>
        <span style="font:400 12.5px/1.6 var(--sans);color:var(--mut);margin-top:6px;display:block">
          Directional pad navigation and menu actions are modeled as typed <code style="color:var(--acc)">FSwuiNavigationPayload</code> structs, keeping focus arbitration deterministic.
        </span>
      </div>
      <div>
        <b style="color:var(--bone);font-size:13px">ADR 0003: Frame-Batched JSON Transport</b>
        <span style="font:400 12.5px/1.6 var(--sans);color:var(--mut);margin-top:6px;display:block">
          CEF inter-process communication flushes once per engine frame as a single consolidated JSON packet, minimizing IPC serialization overhead.
        </span>
      </div>
      <div>
        <b style="color:var(--bone);font-size:13px">ADR 0004: ProcessEvent Override for Delegates</b>
        <span style="font:400 12.5px/1.6 var(--sans);color:var(--mut);margin-top:6px;display:block">
          <code style="color:var(--acc)">USwuiDelegateBridge::ProcessEvent</code> is overridden to intercept dynamic delegate invocations directly, providing zero-overhead payload serialization.
        </span>
      </div>
    </div>
  </div></section>
`
      }}
    />
  )
}
