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

    function initArch(){
  const AM=[
    {t:'Web application',d:'The presentation layer you already know how to build. Plain HTML and CSS, or React, Vue, Svelte, or Vite-built bundles. SWUI places no framework requirement — the delivered artifact is static web content.',tags:['HTML','CSS','JS','TS','React','Vue','Svelte']},
    {t:'CEF / Chromium',d:'An embedded Chromium provides Blink, V8, the DOM and the compositor. SWUI treats it as a controllable render backend: frame production can be driven externally, and hidden documents can be genuinely suspended.',tags:['Blink','V8','DOM','Compositor']},
    {t:'USwuiDocumentManagerSubsystem',d:'The heart of the runtime. Central ticking for all documents, CEF message-loop work within a per-frame budget, state batching, the document registry, lifecycle, Z-order management, hit testing, input routing, level persistence and non-persistent cleanup.',tags:['ticking','batching','registry','z-order','hit test','persistence']},
    {t:'USwuiDocument · USwuiView · FSwuiScheduler',d:'The document owns the lifecycle. The view owns the browser and rendering surface. The scheduler controls how the document and its browser update — when to tick, when to sleep. Slate presents the resulting surface inside Unreal.',tags:['document','view','scheduler']},
    {t:'Unreal',d:'Slate presents the UI. The RHI consumes rendered textures. Gameplay, Blueprint and GameplayTags remain the source of truth for state and events — the web layer only subscribes and emits.',tags:['Slate','RHI','Gameplay','Blueprint','GameplayTags']},
  ];
  const stack=$('#amStack');
  AM.forEach((a,i)=>{
    const d=el('button','al'+(i===2?' sel':''),`<b${i===2?' class="acc"':''}>${a.t}</b>`);
    d.addEventListener('click',()=>{
      $$('.al',stack).forEach(x=>x.classList.remove('sel'));d.classList.add('sel');
      $('#amTitle').textContent=a.t;$('#amDesc').textContent=a.d;
      $('#amTags').innerHTML=a.tags.map(t=>`<span class="chip${i===2?' on':''}">${t}</span>`).join('');
    });
    stack.appendChild(d);
  });
  $('#amTitle').textContent=AM[2].t;$('#amDesc').textContent=AM[2].d;
  $('#amTags').innerHTML=AM[2].tags.map(t=>`<span class="chip on">${t}</span>`).join('');
  $('#mmRun').addEventListener('click',()=>{
    const n=$$('#mmFlow .fnode');
    n.forEach(x=>x.classList.remove('lit'));
    n.forEach((x,i)=>setTimeout(()=>x.classList.add('lit'),i*380));
  });
  const LT1=[['Persistent HUD','ACTIVE','var(--ok)'],['Level HUD','ACTIVE','var(--ok)'],['Inventory','SLEEPING','var(--warn)']];
  const LT2=[['Persistent HUD','SURVIVES','var(--ok)'],['Level HUD','UNLOADED','var(--mut)'],['New Level HUD','ACTIVE','var(--ok)']];
  const rows=(x,arr)=>x.innerHTML=arr.map(([n,s,c])=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--ln2);font:400 11.5px var(--mono)"><span>${n}</span><span style="color:${c}">${s}</span></div>`).join('');
  rows($('#lt1'),LT1);rows($('#lt2'),[['Persistent HUD','SLEEPING','var(--warn)'],['Level HUD','UNLOADED','var(--mut)'],['Inventory','UNLOADED','var(--mut)']]);
  $('#ltRun').addEventListener('click',()=>{
    rows($('#lt1'),LT1);
    setTimeout(()=>rows($('#lt1'),[['Persistent HUD','ACTIVE','var(--ok)'],['Level HUD','UNLOADING','var(--mut)'],['Inventory','UNLOADING','var(--mut)']]),900);
    setTimeout(()=>rows($('#lt1'),[['Persistent HUD','SURVIVES','var(--ok)'],['Level HUD','UNLOADED','var(--mut)'],['Inventory','UNLOADED','var(--mut)']]),1800);
    setTimeout(()=>rows($('#lt2'),[['Persistent HUD','ACTIVE','var(--ok)'],['New Level HUD','PRELOADED','var(--acc)']]),2400);
    setTimeout(()=>rows($('#lt2'),LT2),3300);
  });
}


    try {
      initArch()
    } catch (e) {
      console.error('Error in initArch:', e)
    }

    observeReveal(containerRef.current)
  }, [hidden])

  return (
    <div
      ref={containerRef}
      className="page inksec"
      data-page="architecture"
      hidden={hidden}
      dangerouslySetInnerHTML={{ __html: `
  <header class="pgh"><div class="wrap">
    <div class="eyebrow" style="color:#8A8C95">Architecture</div>
    <h1>Two worlds.<br><em>One runtime.</em></h1>
    <p class="lead">Select any subsystem to inspect it. The stack reads top to bottom: from your frontend, through embedded Chromium, through the SWUI runtime and its documents, into Unreal.</p>
  </div></header>
  <section class="sec" style="border-top:0"><div class="wrap">
    <div class="rp-grid">
      <div class="arch-stack rv" id="amStack"></div>
      <div class="lc-desc rv" style="position:sticky;top:76px"><h4 id="amTitle"></h4><p id="amDesc"></p><div class="api-strip" style="margin-top:16px" id="amTags"></div></div>
    </div>
  </div></section>
  <section class="sec"><div class="wrap">
    <div class="shead"><span class="sidx">02</span><span class="slbl">Document manager</span><span class="srule"></span><span class="stag">Center of the system</span></div>
    <div class="sec-top"><h2 class="display" style="font-size:clamp(26px,3vw,46px)">USwuiDocumentManager<br><span class="si">Subsystem.</span></h2></div>
    <div class="tele rv" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
      <div><b>Central ticking</b><span style="font:400 12.5px/1.6 var(--sans);color:var(--mut)">One subsystem drives every document and all CEF message-loop work, inside a per-frame budget.</span></div>
      <div><b>State batching</b><span style="font:400 12.5px/1.6 var(--sans);color:var(--mut)">Dirty state accumulates and flushes as one atomic batch per frame.</span></div>
      <div><b>Registry &amp; lifecycle</b><span style="font:400 12.5px/1.6 var(--sans);color:var(--mut)">Documents are registered, preloaded, activated, slept and unloaded from one place.</span></div>
      <div><b>Z-order &amp; hit testing</b><span style="font:400 12.5px/1.6 var(--sans);color:var(--mut)">Layer resolution and pointer routing across every visible surface.</span></div>
      <div><b>Level persistence</b><span style="font:400 12.5px/1.6 var(--sans);color:var(--mut)">Persistent documents survive level travel; non-persistent documents are cleaned up.</span></div>
      <div><b>Input routing</b><span style="font:400 12.5px/1.6 var(--sans);color:var(--mut)">Pointer, keyboard and navigation dispatched to the right document — or back to gameplay.</span></div>
    </div>
  </div></section>
  <section class="sec"><div class="wrap">
    <div class="shead"><span class="sidx">03</span><span class="slbl">Memory</span><span class="srule"></span><span class="stag">Deterministic unload</span></div>
    <div class="sec-top"><h2 class="display" style="font-size:clamp(26px,3vw,46px)">Lifecycle is<br><span class="si">resource management.</span></h2><p class="lead" style="align-self:center">Unloading is deterministic. Step through what happens when a document goes away.</p></div>
    <div class="plate rv" style="max-width:860px"><div class="plate-h"><span class="sq"></span>Unload cascade<span class="sp"></span><button class="tbtn pri" id="mmRun"><svg><use href="#i-play"/></svg> Unload document</button></div>
      <div class="plate-b"><div class="flow" id="mmFlow" style="flex-wrap:wrap;gap:8px">
        <div class="fnode"><b>Active document</b></div><div class="fwire"></div>
        <div class="fnode"><b>Unload</b></div><div class="fwire"></div>
        <div class="fnode"><b>Browser</b><span>released</span></div><div class="fwire"></div>
        <div class="fnode"><b>GPU handle</b><span>released</span></div><div class="fwire"></div>
        <div class="fnode"><b>Slate texture</b><span>released</span></div><div class="fwire"></div>
        <div class="fnode"><b>Memory</b><span>reclaimed</span></div>
      </div></div>
    </div>
  </div></section>
  <section class="sec paper"><div class="wrap">
    <div class="shead"><span class="sidx">04</span><span class="slbl">Level travel</span><span class="srule"></span><span class="stag">Persistence split</span></div>
    <div class="sec-top"><h2 class="display" style="font-size:clamp(26px,3vw,46px)">What survives<br><span class="si">the travel.</span></h2></div>
    <div class="lt-grid rv">
      <div class="plate"><div class="plate-h"><span class="sq"></span>Level 01</div><div class="plate-b" id="lt1"></div></div>
      <div style="display:flex;align-items:center;justify-content:center;padding:0 10px"><div style="text-align:center"><div style="width:2px;height:64px;background:var(--blaze);margin:0 auto"></div><div class="mono" style="font-size:9px;letter-spacing:.2em;color:var(--mut);margin-top:10px">TRAVEL</div></div></div>
      <div class="plate"><div class="plate-h"><span class="sq"></span>Level 02</div><div class="plate-b" id="lt2"></div></div>
    </div>
    <button class="tbtn" id="ltRun" style="margin-top:18px"><svg><use href="#i-play"/></svg> Run travel</button>
  </div></section>
  <section class="sec inksec"><div class="wrap">
    <div class="shead"><span class="sidx">05</span><span class="slbl">Input architecture</span><span class="srule"></span><span class="stag">Keyboard · text · IME · bridge</span></div>
    <h2 class="display" style="font-size:clamp(22px,2.4vw,38px);margin-bottom:26px">Keyboard, text and IME</h2>
    <div class="flow rv" style="max-width:900px;flex-wrap:wrap;gap:8px">
      <div class="fnode"><b>HTML input</b><span>focus</span></div><div class="fwire"></div>
      <div class="fnode"><b>SWUI</b><span>focus context</span></div><div class="fwire"></div>
      <div class="fnode"><b>Slate</b><span>input preprocessor</span></div><div class="fwire"></div>
      <div class="fnode"><b>CEF</b><span>key + text events</span></div>
    </div>
    <p class="lead rv" style="margin-top:20px;font-size:13.5px">Printable characters, modifiers and raw keys are routed for focused web inputs — text fields, textareas and search boxes. The routing is structured to stay compatible with IME-related input flows on desktop. Deeper details under <a href="#/docs/input" class="acc">Docs → Input</a>.</p>
    <h2 class="display" style="font-size:clamp(22px,2.4vw,38px);margin:56px 0 26px">Native bridge transports</h2>
    <div class="tele rv" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr))">
      <div><b>1 · CEF query</b><span style="font:400 12.5px/1.6 var(--sans);color:var(--mut)">Preferred native bridge through the embedded browser.</span></div>
      <div><b>2 · postMessage</b><span style="font:400 12.5px/1.6 var(--sans);color:var(--mut)">Structured messages via window messaging.</span></div>
      <div><b>3 · SWUI send</b><span style="font:400 12.5px/1.6 var(--sans);color:var(--mut)">Direct send transport.</span></div>
      <div><b>4 · webview postMessage</b><span style="font:400 12.5px/1.6 var(--sans);color:var(--mut)">Webview-style messaging fallback.</span></div>
      <div><b>5 · URL bridge</b><span style="font:400 12.5px/1.6 var(--sans);color:var(--mut)">URL-based SWUI bridge as a last-resort path.</span></div>
    </div>
  </div></section>
</div>

<!-- ================================================= SDK ================================================= -->` }}
    />
  )
}
