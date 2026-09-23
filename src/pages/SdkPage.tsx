// @ts-nocheck
import React, { useEffect, useRef } from 'react'
import { $, $$, RM, clamp, damp, el, loop, codeFig, makeCrosshair, hl, toast, copyText, observeReveal } from '../utils/engine'

interface PageProps {
  hidden?: boolean
}

export const SdkPage: React.FC<PageProps> = ({ hidden }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const initedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || initedRef.current || hidden) return
    initedRef.current = true

    function initSdk(){
  const eco=$('#ecoStack');
  [['@swui/core','framework-agnostic runtime','on'],['@swui/react · @swui/vue · @swui/svelte','integrations over the same contract',''],['@swui/cli','dev · build · production workflow','']].forEach(([a,b,c],i)=>{
    const d=el('div','al',`<b${i===0?' class="acc"':''}>${a}</b><div class="sub"><span class="chip${i===0?' on':''}">${b}</span></div>`);
    d.style.cursor='default';eco.appendChild(d);
  });
  const API={
    State:{i:'swui.state',e:[['get','Read the current value of a state field.',"swui.state.get('Weapon.CurrentAmmo')"],['getAll','Read the entire published state object.','const s = swui.state.getAll()'],['subscribe','Subscribe to a single field.',"swui.state.subscribe('Weapon.CurrentSpread', v => xh.setSpread(v))"],['on','Field listener — compatibility form.',"swui.on('Player.Health', render)"],['update','Propagate a state patch.',"swui.state.update({ 'UI.MenuVolume': 0.4 })"],['onBatch','Fire once per frame with the whole atomic batch.','swui.state.onBatch(b => stats.frame(b.version))'],['onTick','Runtime tick — engine time, not wall time.','swui.state.onTick(({ dt, paused }) => step(dt))']]},
    Events:{i:'swui.events',e:[['on','Subscribe to a reflected Unreal event.',"swui.events.on('Weapon.OnPlayerFiredShot', e => kick(e.spread))"],['emit','Emit a structured, tag-routed event toward Unreal.',"swui.events.emit('UI.Inventory.UseItem', { itemId: 'health_potion', slot: 2 })"],['emitNavigation','Emit a navigation action.',"swui.events.emitNavigation('confirm')"]]},
    Navigation:{i:'swui.navigation',e:[['onNavigate','Directional focus movement — up · down · left · right.','swui.navigation.onNavigate(dir => focus.move(dir))'],['onConfirm','Confirm on the focused element.','swui.navigation.onConfirm(() => focused.click())'],['onCancel','Cancel / back.','swui.navigation.onCancel(closeDoc)'],['onNextTab','Next tab group.','swui.navigation.onNextTab(() => tabs.next())'],['onPreviousTab','Previous tab group.','swui.navigation.onPreviousTab(() => tabs.prev())']]},
    Input:{i:'swui.input',e:[['focus','Acquire the keyboard/text routing context.','swui.input.focus()'],['release','Return input to gameplay.','swui.input.release()']]},
    Lifecycle:{i:'swui.lifecycle',e:[['onActivate','Document mounted into the viewport.','swui.lifecycle.onActivate(() => enter.run())'],['onDeactivate','Document removed from presentation.','swui.lifecycle.onDeactivate(() => enter.reset())'],['onSleep','Document hidden — WasHidden suspend.','swui.lifecycle.onSleep(pauseTimers)'],['onWake','Document visible again.','swui.lifecycle.onWake(resumeTimers)']]},
    Timeline:{i:'swui.timeline',e:[['begin','Start a game-time timeline.','t = swui.timeline.begin({ duration: 3 })'],['cancel','Cancel — records cancelProgress.','t.cancel()'],['state','IDLE · RUNNING · COMPLETED · CANCELLED.',"t.state // → 'RUNNING'"]]},
    Animation:{i:'swui.animation',e:[['createSpring','Spring with stiffness, damping, mass.','const s = swui.animation.createSpring({ stiffness: 170, damping: 26 })'],['damp','Frame-rate independent exponential approach.','v = swui.animation.damp(v, target, lambda, dt)'],['lerp','Linear interpolation.','x = swui.animation.lerp(a, b, t)'],['interpolate','Map a value across a range with easing.','p = swui.animation.interpolate(v, [0, 1], [0, 100])']]},
    Bridge:{i:'transport',e:[['CEF query','Preferred native bridge through the embedded browser.','conceptual — see technical reference'],['postMessage','Structured window messaging fallback.','conceptual — see technical reference'],['URL bridge','Last-resort URL-based transport.','conceptual — see technical reference']]},
  };
  const cats=$('#apiCats'),det=$('#apiDetail'),search=$('#apiSearch');
  let cur='State';
  const renderCats=f=>{
    cats.innerHTML='';
    Object.entries(API).forEach(([k,v])=>{
      if(f&&!k.toLowerCase().includes(f)&&!JSON.stringify(v.e).toLowerCase().includes(f))return;
      const b=el('button','api-cat'+(k===cur?' on':''),`<span>${k.toLowerCase()}</span><span class="cd">${v.e.length}</span>`);
      b.addEventListener('click',()=>{cur=k;renderCats(search.value.toLowerCase());renderDet()});
      cats.appendChild(b);
    });
  };
  const renderDet=()=>{
    const f=search.value.toLowerCase();
    const e=API[cur].e.filter(x=>!f||x[0].toLowerCase().includes(f)||x[1].toLowerCase().includes(f));
    det.innerHTML=`<div class="mono dim" style="font-size:10.5px;letter-spacing:.12em;margin-bottom:12px">// ${API[cur].i}</div>`+(e.length?e.map(x=>`
      <div class="ref-entry"><button class="ref-h"><span class="nm">${x[0]}</span><span class="pu">${x[1]}</span><span class="ct">${cur}</span><svg><use href="#i-chev"/></svg></button>
      <div class="ref-b"><div class="sig">${x[2].replace(/</g,'&lt;')}</div></div></div>`).join(''):'<p class="dim mono" style="font-size:12px">no matches</p>');
    $$('.ref-entry',det).forEach(r=>$('.ref-h',r).addEventListener('click',()=>r.classList.toggle('open')));
  };
  search.addEventListener('input',()=>{renderCats(search.value.toLowerCase());renderDet()});
  renderCats('');renderDet();
  const gi=()=>({hp:+$('#siHp').value,am:+$('#siAm').value,sh:+$('#siSh').value});
  const siUpd=()=>{
    const s=gi();
    $('#siHud').innerHTML=`<span style="color:var(--ok)">HP ${s.hp}</span> · AMMO <span class="acc">${s.am}</span>`;
    $('#siDb').textContent=JSON.stringify({PlayerHealth:s.hp,Ammo:s.am,Shield:s.sh},null,1);
  };
  ['siHp','siAm','siSh'].forEach(id=>$('#'+id).addEventListener('input',siUpd));siUpd();
  /* telemetry */
  const T={fps:60,dt:16,time:0,frame:0,ver:0,dil:1,paused:false};
  const hist=[];
  const cells=[['fps',()=>T.fps.toFixed(0)],['dt',()=>T.dt.toFixed(1)+' ms'],['time',()=>T.time.toFixed(1)+' s'],['frameIndex',()=>T.frame],['stateVersion',()=>T.ver],['cefFps',()=>Math.min(T.fps,60).toFixed(0)],['width',()=>'—'],['height',()=>'—'],['timeDilation',()=>T.dil.toFixed(2)],['paused',()=>T.paused]];
  $('#teleGrid').innerHTML=cells.map(c=>`<div><b>${c[0]}</b><span id="tv-${c[0].replace('.','')}">${c[1]()}</span></div>`).join('');
  ['siHp','siAm','siSh'].forEach(id=>$('#'+id).addEventListener('input',()=>T.ver++));
  const cv=$('#teleCv'),cx=cv.getContext('2d');
  const sz=()=>cv.width=cv.clientWidth||600;sz();addEventListener('resize',sz);
  loop($('#teleGrid'),dt=>{
    if(!T.paused){T.time+=dt*T.dil;T.frame++}
    T.dt=dt*1000;T.fps=damp(T.fps,1/dt,3,dt);
    hist.push(T.dt);if(hist.length>140)hist.shift();
    cells.forEach(c=>{const n=$('#tv-'+c[0].replace('.',''));if(n)n.textContent=c[1]()});
    cx.clearRect(0,0,cv.width,cv.height);
    cx.strokeStyle='rgba(16,17,20,.15)';cx.beginPath();cx.moveTo(0,cv.height/2);cx.lineTo(cv.width,cv.height/2);cx.stroke();
    cx.strokeStyle='#D63F00';cx.lineWidth=1.4;cx.beginPath();
    hist.forEach((v,i)=>{const x=i/140*cv.width,y=clamp(v/33,0,1)*(cv.height-10)+5;i?cx.lineTo(x,y):cx.moveTo(x,y)});
    cx.stroke();
  });
  $$('[data-td]').forEach(b=>b.addEventListener('click',()=>{
    $$('[data-td]').forEach(x=>x.classList.remove('on'));b.classList.add('on');T.dil=+b.dataset.td;
  }));
  $('#telePause').addEventListener('click',e=>{T.paused=!T.paused;e.currentTarget.classList.toggle('on',T.paused);e.currentTarget.textContent=T.paused?'Resume game':'Pause game'});
  /* timeline */
  const TL={st:'IDLE',p:0,dur:3,gen:0,start:0,prog:0};
  const tlCells=[['state',()=>TL.st],['progress',()=>TL.p.toFixed(2)],['generation',()=>TL.gen],['startGameTime',()=>TL.start.toFixed(2)+' s'],['duration',()=>TL.dur.toFixed(1)+' s'],['cancelProgress',()=>TL.prog>0&&TL.st==='CANCELLED'?TL.prog.toFixed(2):'—']];
  $('#teleTl').innerHTML=tlCells.map(c=>`<div><b>${c[0]}</b><span id="tl-${c[0]}">${c[1]()}</span></div>`).join('');
  loop($('#teleTl').closest('.plate'),dt=>{
    if(TL.st==='RUNNING'&&!T.paused){TL.p=Math.min(1,TL.p+dt*T.dil/TL.dur);if(TL.p>=1)TL.st='COMPLETED'}
    $('#tlBar').style.width=(TL.p*100)+'%';
    tlCells.forEach(c=>{const n=$('#tl-'+c[0]);if(n)n.textContent=c[1]()});
  });
  $('#tlPlay').addEventListener('click',()=>{TL.gen++;TL.st='RUNNING';TL.p=0;TL.start=T.time;TL.prog=0});
  $('#tlCancel').addEventListener('click',()=>{if(TL.st==='RUNNING'){TL.prog=TL.p;TL.st='CANCELLED'}});
  /* spring lab */
  const sp={x:60,tx:0,v:0,st:170,da:26,ma:1,trail:[]};
  const scv=$('#spCv'),sc=scv.getContext('2d');
  const spSize=()=>{sp.w=scv.clientWidth;scv.width=sp.w;scv.height=scv.height=240;if(!sp.tx)sp.tx=sp.w*.7};
  spSize();addEventListener('resize',spSize);
  scv.addEventListener('pointerdown',e=>{const r=scv.getBoundingClientRect();sp.tx=clamp(e.clientX-r.left,14,sp.w-14)});
  const stv=$('#spSt'),dvv=$('#spD'),mvv=$('#spM');
  [stv,dvv,mvv].forEach(s=>s.addEventListener('input',()=>{
    sp.st=+stv.value;sp.da=+dvv.value;sp.ma=+mvv.value/100;
    $('#spStv').textContent=stv.value;$('#spDv').textContent=dvv.value;$('#spMv').textContent=(mvv.value/100).toFixed(1);
  }));
  loop(scv,dt=>{
    const a=(-sp.st*(sp.x-sp.tx)-sp.da*sp.v)/sp.ma;
    sp.v+=a*dt;sp.x+=sp.v*dt;
    sp.trail.push(sp.x);if(sp.trail.length>70)sp.trail.shift();
    sc.clearRect(0,0,sp.w,240);
    sc.strokeStyle='rgba(16,17,20,.14)';sc.setLineDash([3,5]);sc.beginPath();sc.moveTo(sp.tx,20);sc.lineTo(sp.tx,220);sc.stroke();sc.setLineDash([]);
    sc.strokeStyle='rgba(214,63,0,.5)';sc.lineWidth=1.4;sc.beginPath();
    sp.trail.forEach((x,i)=>{const y=200-i/70*160;i?sc.lineTo(x,y):sc.moveTo(x,y)});sc.stroke();
    sc.fillStyle='#101114';sc.beginPath();sc.arc(sp.x,120,7,0,7);sc.fill();
    sc.strokeStyle='#D63F00';sc.lineWidth=2;sc.beginPath();sc.arc(sp.x,120,12,0,7);sc.stroke();
    $('#spPos').textContent=sp.x.toFixed(0)+' px';$('#spVel').textContent=sp.v.toFixed(0)+' px/s';
  });
  $('#spCode').innerHTML=codeFig('anim','crosshair.ts','ts','l',false);
  $('#cfgCode').innerHTML=codeFig('config','swui.config.ts','ts','l');
}


    try {
      initSdk()
    } catch (e) {
      console.error('Error in initSdk:', e)
    }

    observeReveal(containerRef.current)
  }, [hidden])

  return (
    <div
      ref={containerRef}
      className="page paper"
      data-page="sdk"
      hidden={hidden}
      dangerouslySetInnerHTML={{ __html: `
  <header class="pgh"><div class="wrap">
    <div class="eyebrow">SDK</div>
    <h1>One contract.<br><em>Every frontend.</em></h1>
    <p class="lead">A small ecosystem over a single core: framework-agnostic state, events, navigation, input, lifecycle, timeline and animation — with first-party wrappers and a CLI for the build workflow.</p>
    <div class="api-strip" style="margin-top:28px"><span class="chip">@swui/core</span><span class="chip">@swui/react</span><span class="chip">@swui/vue</span><span class="chip">@swui/svelte</span><span class="chip">@swui/cli</span></div>
  </div></header>
  <section class="sec" style="border-top:0"><div class="wrap">
    <div class="shead"><span class="sidx">01</span><span class="slbl">Ecosystem</span><span class="srule"></span><span class="stag">One graph</span></div>
    <div class="arch-stack rv" style="max-width:680px" id="ecoStack"></div>
  </div></section>
  <section class="sec"><div class="wrap">
    <div class="shead"><span class="sidx">02</span><span class="slbl">API explorer</span><span class="srule"></span><span class="stag">Searchable</span></div>
    <div class="api-g rv">
      <div><input type="text" id="apiSearch" placeholder="Search the API…" style="margin-bottom:12px" aria-label="Search API">
      <div id="apiCats" style="display:flex;flex-direction:column;gap:4px"></div></div>
      <div id="apiDetail"></div>
    </div>
    <p class="dim mono" style="font-size:10px;margin-top:16px">Signatures reflect the documented SDK surface. The repository holds the authoritative definitions for the current version.</p>
  </div></section>
  <section class="sec inksec"><div class="wrap">
    <div class="shead"><span class="sidx">03</span><span class="slbl">State — live</span><span class="srule"></span><span class="stag">get · subscribe · onBatch</span></div>
    <div class="sec-top"><h2 class="display" style="font-size:clamp(24px,2.8vw,44px)">Change a value.<br><span class="si">the UI reacts.</span></h2></div>
    <div class="grid2 rv">
      <div class="plate"><div class="plate-h"><span class="sq"></span>swui.state — publisher</div><div class="plate-b">
        <div class="frow"><label for="siHp">PlayerHealth</label><input type="range" id="siHp" min="0" max="100" value="85"></div>
        <div class="frow"><label for="siAm">Ammo</label><input type="number" id="siAm" value="30"></div>
        <div class="frow"><label for="siSh">Shield</label><input type="range" id="siSh" min="0" max="100" value="60"></div>
      </div></div>
      <div class="plate"><div class="plate-h"><span class="sq"></span>Subscribers</div><div class="plate-b">
        <div class="sb-sub"><h5>HUD<span class="ls">PlayerHealth · Ammo</span></h5><div class="val" id="siHud"></div></div>
        <div class="sb-sub"><h5>Debug UI<span class="ls">all fields</span></h5><div class="val mono" id="siDb" style="font-size:10.5px;white-space:pre"></div></div>
      </div></div>
    </div>
  </div></section>
  <section class="sec"><div class="wrap">
    <div class="shead"><span class="sidx">04</span><span class="slbl">Runtime data</span><span class="srule"></span><span class="stag">Telemetry</span></div>
    <div class="tele rv" id="teleGrid"></div>
    <div class="api-strip" style="margin-top:16px">
      <span class="mono dim" style="font-size:10px;letter-spacing:.1em">TIME DILATION</span>
      <button class="tbtn" data-td="0.25">0.25</button><button class="tbtn on" data-td="1">1.0</button><button class="tbtn" data-td="2">2.0</button>
      <button class="tbtn" id="telePause">Pause game</button>
    </div>
    <canvas id="teleCv" height="90" style="width:100%;margin-top:16px;border:1px solid var(--ln);background:var(--card)"></canvas>
    <p class="dim mono" style="font-size:10px;margin-top:10px">Illustrative panel — values reflect this page's own frame loop, shaped like the runtime data the SDK exposes: fps · dt · time · frameIndex · stateVersion · cefFps · width · height · timeDilation · paused.</p>
    <div class="shead" style="margin-top:56px"><span class="sidx">05</span><span class="slbl">Timeline</span><span class="srule"></span><span class="stag">Game-time animation</span></div>
    <div class="sec-top"><h2 class="display" style="font-size:clamp(24px,2.8vw,44px)">Animation that knows<br><span class="si">about game time.</span></h2><p class="lead" style="align-self:center">Progress is measured on the game clock — dilated and pausable, not wall time.</p></div>
    <div class="plate rv" style="max-width:860px"><div class="plate-h"><span class="sq"></span>timeline · id "reload" · duration 3.0 s<span class="sp"></span>
      <button class="tbtn" id="tlPlay"><svg><use href="#i-play"/></svg> Play</button><button class="tbtn" id="tlCancel">Cancel</button></div>
      <div class="plate-b">
        <div style="height:10px;background:var(--ln2)"><i id="tlBar" style="display:block;height:100%;width:0;background:var(--blaze)"></i></div>
        <div class="tele" style="margin-top:16px;grid-template-columns:repeat(auto-fit,minmax(110px,1fr))" id="teleTl"></div>
      </div>
    </div>
  </div></section>
  <section class="sec"><div class="wrap">
    <div class="shead"><span class="sidx">06</span><span class="slbl">Animation lab</span><span class="srule"></span><span class="stag">createSpring</span></div>
    <div class="sec-top"><h2 class="display" style="font-size:clamp(24px,2.8vw,44px)">Springs you can<br><span class="si">actually feel.</span></h2><p class="lead" style="align-self:center">Click anywhere on the canvas to set a target. Tune stiffness, damping and mass — the same parameters <span class="mono" style="font-size:12px;color:var(--fg)">swui.animation.createSpring</span> exposes.</p></div>
    <div class="rp-grid rv">
      <div class="plate"><div class="plate-h"><span class="sq"></span>Spring — click to retarget</div><div class="plate-b" style="padding:10px"><canvas class="sp-cv" id="spCv" aria-label="Spring animation playground"></canvas></div></div>
      <div>
        <div class="plate"><div class="plate-b">
          <div class="frow"><label>Stiffness <span class="mono dim" id="spStv">170</span></label><input type="range" id="spSt" min="20" max="400" value="170"></div>
          <div class="frow"><label>Damping <span class="mono dim" id="spDv">26</span></label><input type="range" id="spD" min="2" max="60" value="26"></div>
          <div class="frow"><label>Mass <span class="mono dim" id="spMv">1.0</span></label><input type="range" id="spM" min="20" max="400" value="100"></div>
          <div class="tele" style="margin-top:12px;grid-template-columns:1fr 1fr"><div><b>position</b><span id="spPos">—</span></div><div><b>velocity</b><span id="spVel">—</span></div></div>
        </div></div>
        <div id="spCode" style="margin-top:14px"></div>
      </div>
    </div>
  </div></section>
  <section class="sec inksec"><div class="wrap">
    <div class="shead"><span class="sidx">07</span><span class="slbl">CLI &amp; config</span><span class="srule"></span><span class="stag">swui dev · swui build</span></div>
    <div class="rp-grid rv">
      <div class="term"><div class="th">bash — project root</div><div class="tb">
        <div><span class="p">$</span> swui dev</div>
        <div class="out">SWUI dev · vite project detected · live reload → Unreal</div>
        <div style="height:10px"></div>
        <div><span class="p">$</span> swui build --production</div>
        <div class="out">vite v5 · building for production…</div>
        <div class="out">dist/index.html · 41 assets → Unreal Content/UI/MainHUD</div>
        <div style="height:10px"></div>
        <div><span class="p">$</span> <span class="cursor"></span></div>
      </div></div>
      <div>
        <div id="cfgCode"></div>
        <p class="lead" style="font-size:13px;margin-top:14px">The CLI detects frontend project structure — Vite configurations, and Next.js static-export projects — and invokes the frontend build workflow. The output is always static web assets delivered to the Unreal runtime. Next.js server features are not implied to run inside Unreal.</p>
      </div>
    </div>
    <div class="shead" style="margin-top:56px"><span class="sidx">08</span><span class="slbl">Compatibility</span><span class="srule"></span><span class="stag">Two forms, one core</span></div>
    <p class="lead" style="max-width:70ch">The core SDK offers structured namespaces — <span class="mono" style="color:var(--fg)">swui.state</span>, <span class="mono" style="color:var(--fg)">swui.events</span>, <span class="mono" style="color:var(--fg)">swui.navigation</span>… — and direct convenience shortcuts such as <span class="mono" style="color:var(--fg)">swui.on</span>, <span class="mono" style="color:var(--fg)">swui.get</span>, <span class="mono" style="color:var(--fg)">swui.onBatch</span> and <span class="mono" style="color:var(--fg)">swui.onTick</span>. Both are documented in the <a href="#/reference" class="acc">reference</a>.</p>
  </div></section>
</div>

<!-- ================================================= EXAMPLES ================================================= -->` }}
    />
  )
}
