// @ts-nocheck
import React, { useEffect, useRef } from 'react'
import { $, $$, RM, clamp, damp, el, loop, codeFig, makeCrosshair, hl, toast, copyText, observeReveal } from '../utils/engine'

interface PageProps {
  hidden?: boolean
}

export const ProfilingPage: React.FC<PageProps> = ({ hidden }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const initedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || initedRef.current || hidden) return
    initedRef.current = true

    function initProf(){
  const S={bf:60,pf:60,lat:4.2,flush:.6,budget:.4,hist:[],inj:0};
  const cells=[['BrowserFPS',()=>S.bf.toFixed(0)],['PresentedFPS',()=>S.pf.toFixed(0)],['PaintPresent',()=>S.lat.toFixed(1)+' ms'],['StateFlushes',()=>S.flush.toFixed(1)],['CEFBudget',()=>(S.budget*2).toFixed(2)+' / 2.00 ms']];
  $('#pfGrid').innerHTML=cells.map(c=>`<div><b>${c[0]}</b><span id="pf-${c[0]}">${c[1]()}</span></div>`).join('');
  const cv=$('#pfCv'),cx=cv.getContext('2d');
  const sz=()=>cv.width=cv.clientWidth||800;sz();addEventListener('resize',sz);
  loop(cv,dt=>{
    S.bf=damp(S.bf,1/dt,2,dt);
    const miss=Math.random()<(S.inj>0?.3:.02);
    S.pf=damp(S.pf,miss?S.bf*.5:S.bf,4,dt);
    S.lat=damp(S.lat,S.inj>0?7+Math.random()*4:3.5+Math.random()*1.6,3,dt);
    S.flush=damp(S.flush,S.inj>0?4:.6,4,dt);
    S.budget=damp(S.budget,S.inj>0?.95:.4,3,dt);
    if(S.inj>0)S.inj-=dt;
    S.hist.push({b:S.bf,p:S.pf});if(S.hist.length>180)S.hist.shift();
    cells.forEach(c=>{const n=$('#pf-'+c[0]);if(n)n.textContent=c[1]()});
    cx.clearRect(0,0,cv.width,cv.height);
    cx.strokeStyle='rgba(239,238,232,.1)';cx.beginPath();cx.moveTo(0,cv.height/2);cx.lineTo(cv.width,cv.height/2);cx.stroke();
    cx.strokeStyle='rgba(239,238,232,.8)';cx.lineWidth=1.4;cx.beginPath();
    S.hist.forEach((h,i)=>{const x=i/180*cv.width,y=cv.height-4-clamp(h.b/130,0,1)*(cv.height-14);i?cx.lineTo(x,y):cx.moveTo(x,y)});
    cx.stroke();
    cx.strokeStyle='#FF4D00';cx.setLineDash([4,4]);cx.beginPath();
    S.hist.forEach((h,i)=>{const x=i/180*cv.width,y=cv.height-4-clamp(h.p/130,0,1)*(cv.height-14);i?cx.lineTo(x,y):cx.moveTo(x,y)});
    cx.stroke();cx.setLineDash([]);
    cx.fillStyle='rgba(239,238,232,.6)';cx.font='500 9px IBM Plex Mono';cx.fillText('— browser fps',10,14);
    cx.fillStyle='rgba(255,107,51,.9)';cx.fillText('— presented fps',100,14);
  });
  $('#pfDirty').addEventListener('click',()=>{S.inj=2;toast('4 fields dirtied — one batch flush')});
  $('#pfDoc').addEventListener('click',()=>{S.inj=3;toast('Document activated — preload hit avoided')});
  const CMDS=[
    ['swui.debug.Stats 1','Enable the on-screen runtime statistics overlay.','BrowserFPS 60 | PresentedFPS 60 | PaintLatency 4.1ms\nDocuments: 2 active / 1 sleeping / 1 unloaded'],
    ['swui.verbosePaint 1','Log every paint and present with dirty rect information.','[SWUI] MainHUD paint: roi=4 rects 1280x720 -> present 4.1ms\n[SWUI] Chat paint: full 512x384 -> present 1.2ms'],
    ['swui.hud.Lockstep 1','Lock HUD document presentation to the engine frame clock.','HUD lockstep enabled: browser begin-frame driven by engine tick'],
    ['swui.hud.MaxBrowserFPS 60','Clamp browser frame production for the HUD document.','MaxBrowserFPS=60 (previous: 120)'],
    ['swui.cefMessageLoopBudgetMs 2','Per-frame budget for CEF message-loop work.','CEF message loop budget: 2.00 ms (used last frame: 0.84 ms)'],
  ];
  $('#cmdList').innerHTML=CMDS.map((c,i)=>`<div class="cmd"><div class="cmd-h"><code>${c[0]}</code><button class="cf-copy" data-cmd="${i}" aria-label="Copy command"><svg><use href="#i-copy"/></svg>copy</button></div><div class="cmd-b">${c[1]}</div><div class="cmd-out">${c[2]}</div></div>`).join('');
  $$('#cmdList [data-cmd]').forEach(b=>b.addEventListener('click',()=>copyText(CMDS[+b.dataset.cmd][0])));
}


    try {
      initProf()
    } catch (e) {
      console.error('Error in initProf:', e)
    }

    observeReveal(containerRef.current)
  }, [hidden])

  return (
    <div
      ref={containerRef}
      className="page inksec"
      data-page="profiling"
      hidden={hidden}
      dangerouslySetInnerHTML={{ __html: `
  <header class="pgh"><div class="wrap">
    <div class="eyebrow" style="color:#8A8C95">Profiling</div>
    <h1>Performance<br><em>you can see.</em></h1>
    <p class="lead">An engine-style view of the runtime: browser frames, presented frames, paint-to-present latency, state flushes and the CEF message-loop budget. The scope below is an illustrative simulation — inject activity and watch it respond.</p>
  </div></header>
  <section class="sec" style="border-top:0"><div class="wrap">
    <div class="plate rv" style="max-width:1000px">
      <div class="plate-h"><span class="sq"></span>swui.debug.stats — live panel<span class="sp"></span>
        <button class="tbtn" id="pfDirty">Dirty 4 fields</button><button class="tbtn" id="pfDoc">Activate document</button>
      </div>
      <div class="plate-b">
        <div class="scope"><canvas id="pfCv" height="150" style="width:100%;display:block"></canvas></div>
        <div class="tele" style="margin-top:14px" id="pfGrid"></div>
      </div>
    </div>
  </div></section>
  <section class="sec paper"><div class="wrap">
    <div class="shead"><span class="sidx" style="background:var(--ink);color:var(--paper)">02</span><span class="slbl">Console commands</span><span class="srule"></span><span class="stag">Copy · run · read</span></div>
    <div style="max-width:860px" id="cmdList"></div>
    <div class="shead" style="margin-top:56px"><span class="sidx" style="background:var(--ink);color:var(--paper)">03</span><span class="slbl">Debug overlay</span><span class="srule"></span><span class="stag">swui.debug</span></div>
    <div class="plate rv" style="max-width:560px">
      <div class="plate-h"><span class="sq"></span>swui.debug overlay</div>
      <div class="plate-b mono" style="font-size:11.5px;line-height:2">
        <div class="dim" style="letter-spacing:.16em;font-size:9px">DOCUMENTS</div>
        <div style="display:flex;justify-content:space-between"><span>MainHUD</span><span class="acc">ACTIVE · Z10</span></div>
        <div style="display:flex;justify-content:space-between"><span>Inventory</span><span style="color:var(--warn)">SLEEPING · Z100</span></div>
        <div style="display:flex;justify-content:space-between"><span>PauseMenu</span><span class="dim">UNLOADED · Z200</span></div>
        <hr class="hair" style="margin:10px 0">
        <div class="dim" style="letter-spacing:.16em;font-size:9px">STATE</div>
        <div style="display:flex;justify-content:space-between"><span>PlayerHealth</span><span>85</span></div>
        <div style="display:flex;justify-content:space-between"><span>Ammo</span><span>24</span></div>
        <div style="display:flex;justify-content:space-between"><span>Shield</span><span>60</span></div>
        <hr class="hair" style="margin:10px 0">
        <div class="dim" style="letter-spacing:.16em;font-size:9px">RUNTIME</div>
        <div style="display:flex;justify-content:space-between"><span>CEF FPS</span><span>60</span></div>
        <div style="display:flex;justify-content:space-between"><span>Engine FPS</span><span>60</span></div>
        <div style="display:flex;justify-content:space-between"><span>State Version</span><span>421</span></div>
      </div>
    </div>
  </div></section>` }}
    />
  )
}
