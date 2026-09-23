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

    function initProduct(){
  const MX=[
    ['Windows x64','exp','Experimental','primary development target — needs validation'],
    ['Windows ARM64','exp','Experimental','needs validation'],
    ['macOS','val','Supported','desktop CEF runtime'],
    ['Linux','exp','Experimental','packaging validation in progress'],
    ['Android','no','Not supported',''],['iOS','no','Not supported',''],
    ['PlayStation','no','Not supported',''],['Xbox','no','Not supported',''],['Nintendo Switch','no','Not supported',''],
  ];
  $('#platformMx').innerHTML=`<div class="mrow h"><span>Platform</span><span>Status</span><span>Notes</span></div>`+MX.map(r=>`<div class="mrow"><span class="mp">${r[0]}</span><span><span class="badge ${r[1]}">${r[2]}</span></span><span class="ms">${r[3]}</span></div>`).join('');
  const ST=[
    ['Core Unreal ↔ JavaScript interop model','val','Exists'],
    ['Generated bindings','dev','In development'],
    ['Preview workflow','dev','In development'],
    ['Event ergonomics','dev','In development'],
    ['Packaging','dev','In development'],
    ['Desktop runtime stability','val','Validation'],
  ];
  $('#statusMx').innerHTML=ST.map(r=>`<div class="mrow"><span class="mp">${r[0]}</span><span><span class="badge ${r[1]}">${r[2]}</span></span><span class="ms">stated as-is, not as marketing</span></div>`).join('');
  $('#lbLazy').addEventListener('click',()=>{
    const bar=$('#lbLazyBar');$('#lbLazyT').textContent='loading…';bar.style.width='0';
    requestAnimationFrame(()=>bar.style.width='100%');
    setTimeout(()=>$('#lbLazyT').textContent='activated — total: cold load + mount',1450);
  });
  $('#lbEager').addEventListener('click',()=>{$('#lbEagerT').textContent='activated — document already resident';toast('Eager: instant activation')});
  const IM={
    game:[['W A S D','game'],['mouse look','game'],['E interact','game'],['I inventory','game (blocked)']],
    both:[['W A S D','game'],['mouse look','game'],['E interact','game'],['I inventory','ui — opens document']],
    ui:[['W A S D','ui — document'],['mouse','ui — document'],['Esc','ui — releases focus']]
  };
  const setIM=m=>{
    $$('[data-im]').forEach(b=>b.classList.toggle('on',b.dataset.im===m));
    $('#imTrace').innerHTML=IM[m].map(([k,v])=>`<em>${k}</em> → <span class="${v.startsWith('ui')?'r':'g'}">${v}</span>`).join('<br>');
  };
  $$('[data-im]').forEach(b=>b.addEventListener('click',()=>setIM(b.dataset.im)));
  setIM('both');
  $$('[data-tr]').forEach(b=>b.addEventListener('click',()=>{
    $$('[data-tr]').forEach(x=>x.classList.remove('on'));b.classList.add('on');
    const good=b.dataset.tr==='good';
    $('#trBad').firstElementChild.style.display=good?'none':'flex';
    $('#trGood').style.opacity=good?'1':'.3';
  }));
  $('#trGood').style.opacity='1';
  $('#trCode').innerHTML=codeFig('trcss','hud.css','css','l',false);
}


    try {
      initProduct()
    } catch (e) {
      console.error('Error in initProduct:', e)
    }

    observeReveal(containerRef.current)
  }, [hidden])

  return (
    <div
      ref={containerRef}
      className="page paper"
      data-page="product"
      hidden={hidden}
      dangerouslySetInnerHTML={{ __html: `
  <header class="pgh"><div class="wrap">
    <div class="eyebrow">Product</div>
    <h1>A runtime,<br><em>not a widget.</em><span class="si">— every surface, stated plainly.</span></h1>
    <p class="lead">SWUI is a web UI runtime for Unreal Engine. It manages multiple independent web documents — lifecycle, state, events, input, layering and rendering — while Unreal keeps ownership of gameplay.</p>
  </div></header>
  <section class="sec"><div class="wrap">
    <div class="shead"><span class="sidx">01</span><span class="slbl">Document asset</span><span class="srule"></span><span class="stag">Conceptual spec</span></div>
    <div class="rp-grid">
      <div class="plate">
        <div class="plate-h"><span class="sq"></span>Details — USwuiDocumentAsset</div>
        <div class="plate-b">
          <div class="frow"><label>Document ID</label><span class="mono" style="font-size:12px">MainHUD</span></div>
          <div class="frow"><label>Entry URL</label><span class="mono acc" style="font-size:11.5px">../Content/UI/hud.html</span></div>
          <div class="frow"><label>Layer</label><select><option>Persistent</option><option selected>Level</option><option>Modal</option></select></div>
          <div class="frow"><label>Z-Order</label><input type="number" value="10"></div>
          <div class="frow"><label>Load Behavior</label><select><option>Lazy</option><option selected>Eager</option></select></div>
          <div class="frow"><label>Render Mode</label><select><option selected>GPU Shared Texture</option><option>CPU Full Surface</option></select></div>
          <div class="frow"><label>Target FrameRate</label><input type="number" value="60"></div>
          <div class="frow"><label>Transparency</label><label class="cbx"><input type="checkbox" checked><i></i> allow alpha</label></div>
          <div class="frow"><label>Sleep When Hidden</label><label class="cbx"><input type="checkbox" checked><i></i> WasHidden</label></div>
          <div class="frow"><label>Pointer / Keyboard</label><label class="cbx"><input type="checkbox" checked><i></i> route</label></div>
        </div>
      </div>
      <div>
        <h3 class="display" style="font-size:clamp(20px,2vw,28px)">Load behavior</h3>
        <p class="lead" style="font-size:13.5px;margin:10px 0 16px">Lazy loads on activation. Eager prepares the document ahead of time.</p>
        <div class="grid2">
          <div class="plate"><div class="plate-b">
            <h5 class="mono" style="font-size:10px;letter-spacing:.2em;color:var(--mut)">LAZY</h5>
            <p style="font-size:12px;color:var(--mut);margin:8px 0 12px">button click → load → activate</p>
            <button class="tbtn" id="lbLazy">Click to open</button>
            <div style="height:3px;background:var(--ln2);margin-top:12px"><i id="lbLazyBar" style="display:block;height:100%;width:0;background:var(--blaze);transition:width 1.4s linear"></i></div>
            <p class="mono dim" style="font-size:10px;margin-top:8px" id="lbLazyT">idle</p>
          </div></div>
          <div class="plate"><div class="plate-b">
            <h5 class="mono" style="font-size:10px;letter-spacing:.2em;color:var(--mut)">EAGER</h5>
            <p style="font-size:12px;color:var(--mut);margin:8px 0 12px">preloaded at level start → ready</p>
            <span class="chip on">preloaded · ready</span>
            <button class="tbtn" id="lbEager" style="margin-top:12px">Activate</button>
            <p class="mono dim" style="font-size:10px;margin-top:12px" id="lbEagerT">idle</p>
          </div></div>
        </div>
        <h3 class="display" style="font-size:clamp(20px,2vw,28px);margin-top:42px">Input enablement</h3>
        <div class="api-strip" style="margin:14px 0" id="imModes">
          <button class="tbtn" data-im="game">Game Only</button><button class="tbtn on" data-im="both">Game + UI</button><button class="tbtn" data-im="ui">UI Only</button>
        </div>
        <div class="ir-trace" id="imTrace" style="min-height:96px"></div>
        <h3 class="display" style="font-size:clamp(20px,2vw,28px);margin-top:42px">Transparency</h3>
        <div class="api-strip" style="margin:14px 0"><button class="tbtn" data-tr="bad">Opaque body</button><button class="tbtn on" data-tr="good">Transparent body</button></div>
        <div class="grid2">
          <div class="roi-wrap" style="aspect-ratio:16/8" id="trBad"><div style="position:absolute;inset:0;background:#F4F3ED;display:flex;align-items:center;justify-content:center;color:var(--ink);font:600 12px var(--sans)">the web page hides the world</div></div>
          <div class="roi-wrap" style="aspect-ratio:16/8" id="trGood"><div style="position:absolute;inset:56% -12% 0;background:linear-gradient(rgba(239,238,232,.05) 1px,transparent 1px) 0 0/100% 32px,linear-gradient(90deg,rgba(239,238,232,.05) 1px,transparent 1px) 0 0/56px 100%;transform:perspective(300px) rotateX(58deg);transform-origin:top"></div><div style="position:absolute;right:14px;bottom:10px;font:600 24px var(--mono);color:var(--bone)">24 <span style="font-size:11px;color:#6E7078">| 180</span></div></div>
        </div>
        <div id="trCode" style="margin-top:14px"></div>
      </div>
    </div>
  </div></section>
  <section class="sec inksec"><div class="wrap">
    <div class="shead"><span class="sidx">02</span><span class="slbl">Platform support</span><span class="srule"></span><span class="stag">Desktop CEF runtime</span></div>
    <div class="sec-top"><h2 class="display" style="font-size:clamp(26px,3vw,44px)">A desktop CEF runtime.<br><span class="si">stated plainly.</span></h2></div>
    <div class="matrix rv" id="platformMx"></div>
    <div class="shead" style="margin-top:64px"><span class="sidx">03</span><span class="slbl">Project status</span><span class="srule"></span><span class="stag">As-is, not as marketing</span></div>
    <div class="sec-top"><h2 class="display" style="font-size:clamp(26px,3vw,44px)">Where the project<br><span class="si">actually is.</span></h2></div>
    <div class="matrix rv" id="statusMx"></div>
  </div></section>
</div>

<!-- ================================================= ARCHITECTURE ================================================= -->` }}
    />
  )
}
