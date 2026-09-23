// @ts-nocheck
import React, { useEffect, useRef } from 'react'
import { $, $$, RM, clamp, damp, el, loop, codeFig, makeCrosshair, hl, toast, copyText, observeReveal } from '../utils/engine'

interface PageProps {
  hidden?: boolean
}

export const ExamplesPage: React.FC<PageProps> = ({ hidden }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const initedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || initedRef.current || hidden) return
    initedRef.current = true

    function initExamples(){
  const xh=makeCrosshair($('#exXh'));
  let spread=.25,kick=0,open=false,t=0;
  loop($('#exView'),dt=>{
    t+=dt;kick=damp(kick,0,7,dt);
    spread=clamp(.22+Math.sin(t*.8)*.08,0,1);
    xh.set(spread+kick,'EXPANDED');
  });
  const grid=$('#exInvGrid');
  [['Medkit','×2'],['Ammo pack','×4'],['Keycard — north gate','×1'],['Crafting scrap','×12']].forEach(([n,c])=>{
    grid.appendChild(el('div','inv-item',`<div class="inv-ic"><svg><use href="#i-doc"/></svg></div><div style="flex:1"><div class="nm" style="font-size:12.5px">${n}</div><div class="ct">${c}</div></div><button class="tbtn">use</button>`));
  });
  const trace=s=>{$('#exTrace').innerHTML=s+'<br>'+$('#exTrace').innerHTML.split('<br>').slice(0,7).join('<br>')};
  $('#exTrace').innerHTML='<em>click the viewport to focus, then press I</em>';
  const setOpen=v=>{
    open=v;$('#exInv').style.display=v?'flex':'none';
    $('#exHintC').textContent=v?'inventory active · press ESC to close':'click to focus · press I for inventory';
    trace(v
      ?'<span class="r">I keypress → hit test → hud.html (z10, non-interactive) → falls through</span><br><span class="r">SWUI → ActivateDocument(inventory.html)</span><br><em>MODAL · Z-100 · input captured · mouse shown · gameplay input blocked</em>'
      :'<span class="r">ESC keypress → UI.Menu.CloseInventory</span><br><em>DeactivateDocument(inventory.html) → gameplay resumes</em>');
  };
  $('#exView').addEventListener('keydown',e=>{
    if((e.key==='i'||e.key==='I')&&!open){setOpen(true);e.preventDefault()}
    if(e.key==='Escape'&&open)setOpen(false);
  });
  $$('.inv-item .tbtn',grid).forEach((b,i)=>b.addEventListener('click',()=>trace(`<span class="r">swui.events.emit('UI.Inventory.UseItem', { slot: ${i+1} })</span>`)));
  const pmxh=makeCrosshair($('#pmXhIn'));
  let pk=0,pt=0,paused=false;
  loop($('#pmView'),dt=>{
    if(paused)return;
    pt+=dt;pk=damp(pk,0,7,dt);
    pmxh.set(.22+Math.sin(pt*.8)*.06+pk,'EXPANDED');
  });
  const ptr=$('#pmTrace');ptr.innerHTML='<em>world running · crosshair driven by game ticks</em>';
  $('#pmBtn').addEventListener('click',()=>{
    paused=true;
    $('#pmMenu').style.display='flex';
    $('#pmTitle').textContent='world: PAUSED · pause.html: ACTIVE (ticking)';
    $('#pmBtn').textContent='Paused';$('#pmBtn').disabled=true;
    ptr.innerHTML='<span class="r">SetGamePaused(true) — world freezes</span><br><em>SWUI document manager continues ticking when paused</em><br><span class="r">LoadDocument(pause.html) → Activate — menu animates in</span>';
  });
  $('#pmResume').addEventListener('click',()=>{
    paused=false;
    $('#pmMenu').style.display='none';
    $('#pmTitle').textContent='world: running · pause.html: unloaded';
    $('#pmBtn').textContent='Pause';$('#pmBtn').disabled=false;
    ptr.innerHTML='<span class="r">button → swui.events.emit(\'UI.Menu.Resume\')</span><br><span class="r">Unreal: Deactivate pause.html · SetGamePaused(false)</span><br><em>gameplay resumes</em><br>'+ptr.innerHTML;
  });
  /* terminal typer */
  const LINES=['> handshake … OK','> colony-net relay 07','> atmospheric: nominal','> power: 62% and falling','> SWUI surface mounted','> awaiting operator_'];
  let li=0,ci=0,txt='';
  const term=$('#twTerm');
  setInterval(()=>{
    if(!term.isConnected)return;
    const r=term.getBoundingClientRect();
    if(r.top<innerHeight&&r.bottom>0){
      if(li<LINES.length){
        txt=LINES[li].slice(0,++ci);
        if(ci>=LINES[li].length){li++;ci=0;txt=LINES.slice(0,li).join('\n');if(li<LINES.length)txt+='\n'}
        term.textContent=txt+(li<LINES.length?'▌':'');
      }else if(Math.random()<.05){li=0;ci=0;txt=''}
    }
  },70);
  const UC=[
    ['Gameplay HUD','state · ROI · frame pacing'],['Inventory','modal documents · input capture · GameplayTags'],
    ['Pause menu','tick-when-paused · events'],['Dialogue','state · prompt strings · events'],
    ['Objective tracker','state · batching'],['Interaction prompt','reflected bools + strings'],
    ['Crosshair','springs · events · state'],['Map / minimap','canvas · ROI'],
    ['Skill tree','modal · navigation'],['Settings','forms · two-way state'],
    ['Debug overlay','all-state subscription · telemetry'],['Network HUD','persistent layer'],
    ['Chat','persistent · keyboard routing'],['In-world terminal','actor component · dynamic material'],
    ['Cockpit dashboard','in-world surface · game time'],['Internal runtime tool','documents · profiling'],
    ['Editor control panel','CEF · dev workflow'],['Loading screens','preload · lifecycle'],
  ];
  $('#ucList').innerHTML=`<div class="th"><span>Use case</span><span></span><span style="text-align:right">SWUI systems demonstrated</span></div>`+UC.map(([n,s])=>`<div class="drow" style="cursor:default"><span class="dn" style="font-family:var(--sans);font-size:14px">${n}</span><span></span><span class="dl" style="text-align:right">${s}</span></div>`).join('');
}


    try {
      initExamples()
    } catch (e) {
      console.error('Error in initExamples:', e)
    }

    observeReveal(containerRef.current)
  }, [hidden])

  return (
    <div
      ref={containerRef}
      className="page inksec"
      data-page="examples"
      hidden={hidden}
      dangerouslySetInnerHTML={{ __html: `
  <header class="pgh"><div class="wrap">
    <div class="eyebrow" style="color:#8A8C95">Examples</div>
    <h1>Documents<br><em>at work.</em></h1>
    <p class="lead">Working demonstrations of layered documents, input capture, game-time pausing and in-world surfaces. The HUD below is live — click it to focus, then press <span class="kbd">I</span> and <span class="kbd">Esc</span>.</p>
  </div></header>
  <section class="sec" style="border-top:0"><div class="wrap">
    <div class="shead"><span class="sidx">01</span><span class="slbl">HUD + Inventory</span><span class="srule"></span><span class="stag">Live — I / Esc</span></div>
    <div class="cx rv">
      <div class="cx-view" id="exView" tabindex="0" aria-label="Game viewport. Press I for inventory, Escape to close.">
        <div class="floor"></div>
        <div style="position:absolute;inset:0" id="exXh"></div>
        <div class="hudel" style="left:22px;top:20px"><div class="htag">Vitals</div><div class="hnum"><b>85</b> / 100</div><div class="bar" style="width:128px"><i style="width:85%"></i></div></div>
        <div class="hudel hud-ammo"><div class="big"><span id="exAmmo">24</span><span> | 180</span></div></div>
        <div class="hudel" style="left:50%;bottom:16px;transform:translateX(-50%)"><span class="chip" id="exHintC" style="color:var(--bone);border-color:rgba(239,238,232,.35)">click to focus · press I for inventory</span></div>
        <div id="exInv" style="position:absolute;inset:0;background:rgba(8,9,11,.74);display:none;z-index:10;align-items:center;justify-content:center">
          <div style="width:min(420px,86%);border:1px solid var(--blaze);background:rgba(16,17,20,.97)">
            <div class="plate-h"><span class="sq"></span>inventory.html · MODAL · Z-100 · ACTIVE<span class="sp"></span><span class="chip">input: captured</span></div>
            <div style="padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px" id="exInvGrid"></div>
          </div>
        </div>
      </div>
      <div>
        <div class="plate"><div class="plate-b" style="padding:0"><div class="ir-trace" id="exTrace" style="border:0;min-height:190px"></div></div></div>
        <div class="api-strip" style="margin-top:14px"><span class="chip">documents</span><span class="chip">layers</span><span class="chip">Z-order</span><span class="chip">input</span><span class="chip">events</span><span class="chip">state</span><span class="chip">lifecycle</span></div>
      </div>
    </div>
  </div></section>
  <section class="sec"><div class="wrap">
    <div class="shead"><span class="sidx">02</span><span class="slbl">Pause menu</span><span class="srule"></span><span class="stag">Tick when paused</span></div>
    <div class="rp-grid rv">
      <div class="plate"><div class="plate-h"><span class="sq"></span><span id="pmTitle">world: running · pause.html: unloaded</span><span class="sp"></span><button class="tbtn pri" id="pmBtn">Pause</button></div>
        <div class="plate-b"><div class="roi-wrap" style="aspect-ratio:16/8;min-height:250px" id="pmView">
          <div style="position:absolute;inset:56% -12% 0;background:linear-gradient(rgba(239,238,232,.05) 1px,transparent 1px) 0 0/100% 32px,linear-gradient(90deg,rgba(239,238,232,.05) 1px,transparent 1px) 0 0/56px 100%;transform:perspective(300px) rotateX(58deg);transform-origin:top"></div>
          <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)" id="pmXh"><div style="position:relative;width:0;height:0" id="pmXhIn"></div></div>
          <div id="pmMenu" style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:10">
            <div style="width:min(320px,84%);border:1px solid rgba(239,238,232,.25);background:rgba(13,14,17,.96);padding:26px;text-align:center">
              <div class="mono" style="font-size:10px;letter-spacing:.32em;color:var(--acc);margin-bottom:18px">GAME PAUSED</div>
              <div style="font:400 12px/1.6 var(--sans);color:var(--mut);margin-bottom:22px">The Unreal game world can pause while the SWUI document manager continues ticking.</div>
              <div class="sl-spin" style="margin:0 auto 22px"></div>
              <button class="btn" id="pmResume" style="width:100%;justify-content:center">Resume</button>
              <div class="mono dim" style="font-size:9px;margin-top:14px">emits UI.Menu.Resume</div>
            </div>
          </div>
        </div></div>
      </div>
      <div><div class="ir-trace" id="pmTrace" style="min-height:230px"></div></div>
    </div>
  </div></section>
  <section class="sec"><div class="wrap">
    <div class="shead"><span class="sidx">03</span><span class="slbl">In-world UI</span><span class="srule"></span><span class="stag">Actor component → material</span></div>
    <div class="sec-top"><h2 class="display" style="font-size:clamp(24px,2.8vw,46px)">Beyond flat HUDs.</h2></div>
    <div class="rp-grid rv">
      <div class="plate"><div class="plate-h"><span class="sq"></span>USwui actor component → dynamic material</div><div class="plate-b">
        <div class="roi-wrap" style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;perspective:900px">
          <div style="transform:rotateX(8deg) rotateY(-14deg);width:min(380px,72%);border:1px solid var(--acc);background:#07080B;overflow:hidden;box-shadow:0 40px 90px -20px rgba(0,0,0,.9)">
            <div class="plate-h" style="border-bottom:1px solid rgba(239,238,232,.1)"><span class="sq"></span><span class="mono" style="font-size:9px">terminal.swui · colony-net v4.2</span></div>
            <pre id="twTerm" class="mono" style="padding:16px;font-size:11px;line-height:1.9;color:#9FD0A8;margin:0;min-height:150px"></pre>
          </div>
        </div>
      </div></div>
      <div>
        <div class="arch-stack">
          <div class="al"><b>Actor</b><div class="sub"><span class="chip">in-world placement</span></div></div>
          <div class="al"><b>USwui component</b><div class="sub"><span class="chip on">drives the document</span></div></div>
          <div class="al"><b>Document asset</b><div class="sub"><span class="chip">terminal.html</span></div></div>
          <div class="al"><b>CEF → texture</b><div class="sub"><span class="chip">rendered surface</span></div></div>
          <div class="al"><b>Dynamic material</b><div class="sub"><span class="chip">UV-mapped screen</span></div></div>
        </div>
        <p class="lead" style="font-size:13px;margin-top:16px">The same document pipeline drives screens inside your world — terminals, cockpits, signage.</p>
      </div>
    </div>
  </div></section>
  <section class="sec paper"><div class="wrap">
    <div class="shead"><span class="sidx">04</span><span class="slbl">Use-case index</span><span class="srule"></span><span class="stag">Eighteen surfaces</span></div>
    <div class="dtable rv" id="ucList"></div>
  </div></section>
</div>

<!-- ================================================= DOCS ================================================= -->` }}
    />
  )
}
