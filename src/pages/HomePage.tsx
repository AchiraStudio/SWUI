// @ts-nocheck
import React, { useEffect, useRef } from 'react'
import { $, $$, RM, clamp, damp, el, loop, codeFig, makeCrosshair, hl, toast, copyText, observeReveal } from '../utils/engine'

interface PageProps {
  hidden?: boolean
}

export const HomePage: React.FC<PageProps> = ({ hidden }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const initedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || initedRef.current || hidden) return
    initedRef.current = true

    // Initialize all Home interactive components
    function initHome(){
  /* ---- hero: console → seam → HUD ---- */
  const xh=makeCrosshair($('#hudXh'));
  const radar=$('#hudRadar'),rc=radar.getContext('2d');
  const seam=$('#heroSeam');
  const horiz=()=>matchMedia('(min-width:1021px)').matches;
  function packet(ev){
    if(RM||!horiz())return;
    const p=el('div','pkt'+(ev?' ev':''));
    p.style.setProperty('--y',(18+Math.random()*64)+'%');
    /* state crosses right→left (← STATE), events left→right (EVENTS →) */
    p.style.setProperty('--d',(ev?-1:1)*(90+Math.random()*40)+'px');
    seam.appendChild(p);setTimeout(()=>p.remove(),800);
  }
  const st={hp:88,spread:.30,mode:'EXPANDED',ammo:24,kick:0,reload:0,obj:3,t:0};
  const blips=[{a:.6,r:.62},{a:2.5,r:.78},{a:4.2,r:.5}];let sweep=0;
  function drawRadar(){
    const w=radar.width,c=w/2;rc.clearRect(0,0,w,w);
    rc.strokeStyle='rgba(239,238,232,.15)';rc.lineWidth=1;rc.beginPath();rc.arc(c,c,c-2,0,7);rc.stroke();
    rc.strokeStyle='rgba(239,238,232,.06)';rc.beginPath();rc.moveTo(c,4);rc.lineTo(c,w-4);rc.moveTo(4,c);rc.lineTo(w-4,c);rc.stroke();
    for(let i=0;i<10;i++){const a=sweep-i*.09;rc.strokeStyle=`rgba(255,107,51,${.4*(1-i/10)})`;rc.lineWidth=1.5;rc.beginPath();rc.moveTo(c,c);rc.lineTo(c+Math.cos(a)*(c-3),c+Math.sin(a)*(c-3));rc.stroke()}
    blips.forEach(b=>{let d=Math.abs(((sweep-b.a)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI);const al=clamp(1-d/.6,.12,1);
      rc.fillStyle=`rgba(239,238,232,${al})`;rc.beginPath();rc.arc(c+Math.cos(b.a)*b.r*(c-6),c+Math.sin(b.a)*b.r*(c-6),2.3,0,7);rc.fill()});
    rc.fillStyle='#EFEEE8';rc.beginPath();rc.moveTo(c,c-5);rc.lineTo(c-3.5,c+3.5);rc.lineTo(c+3.5,c+3.5);rc.closePath();rc.fill();
  }
  const htoast=m=>{const t=el('div','toast',m);$('#hudToasts').appendChild(t);setTimeout(()=>t.remove(),2900)};
  const evs=[];const at=(d,f)=>evs.push({at:st.t+d,f});
  const plan=()=>{
    at(1.2,()=>{htoast('SWUI document active');packet()});
    at(4,()=>{st.obj=Math.min(6,st.obj+1);$('#hudObjC').textContent=st.obj+' / 6';htoast('objective updated');packet();
      if(st.obj>=6)at(1,()=>{st.obj=0;$('#hudObjC').textContent='0 / 6';$('#hudObjT').textContent='Exfil through the north gate';htoast('new objective')})});
    at(8,()=>{htoast('shield restored');packet()});
    at(11,()=>{st.reload=1});
    at(16,plan);
  };
  plan();
  function readConsole(){
    st.hp=+$('#hcHp').value;$('#hcHpV').textContent=st.hp;
    st.spread=+$('#hcSp').value/100;$('#hcSpV').textContent=st.spread.toFixed(2);
    st.mode=$('#hcCm').value;
    $('#hudHp').textContent=Math.round(st.hp);
    $('#hudHpB').style.width=st.hp+'%';
    xh.set(clamp(st.spread+st.kick,0,1),st.mode);
  }
  ['hcHp','hcSp','hcCm'].forEach(id=>$('#'+id).addEventListener('input',()=>{readConsole();packet()}));
  $('#hcCm')?.addEventListener('change',()=>{readConsole();packet()});
  function fire(){
    if(st.ammo<=0||st.reload>0)return;
    st.ammo--;st.kick=Math.min(.6,st.kick+.28);st.spread=clamp(st.spread+.015,0,1);
    if(st.ammo<=0)st.reload=1.1;
    packet(true); // event crosses web → unreal
    htoast('Weapon.OnPlayerFiredShot');
  }
  $('#hcFire').addEventListener('click',fire);
  $('.hud-shell')?.addEventListener('pointerdown',fire);
  $('#hcHit').addEventListener('click',()=>{xh.hit();const d=el('div','dmg','+'+Math.round(40+Math.random()*60));d.style.cssText='left:calc(50% + 24px);top:42%';$('#hudXh').appendChild(d);setTimeout(()=>d.remove(),820)});
  loop($('#heroConsole'),dt=>{
    st.t+=dt;
    for(let i=evs.length-1;i>=0;i--)if(st.t>=evs[i].at){evs[i].f();evs.splice(i,1)}
    st.kick=damp(st.kick,0,6.5,dt);
    st.spread=damp(st.spread,+$('#hcSp').value/100+.02*Math.sin(st.t*1.3),1.6,dt);
    if(st.reload>0){st.reload-=dt;$('#hudRl').textContent='RELOADING';if(st.reload<=0){st.ammo=24;$('#hudRl').textContent=''}}
    $('#hudHp').textContent=Math.round(st.hp);$('#hudHpB').style.width=st.hp+'%';
    $('#hudAmmo').textContent=st.ammo;
    xh.set(clamp(st.spread+st.kick,0,1),st.mode);
    sweep+=dt*1.4;drawRadar();
  });
  readConsole();
  /* ---- system log ---- */
  {
    const box=$('#sysLines');let n=1041,li=0;
    const L=[
      ()=>`<span class="t">[SWUI]</span> <span class="n">document MainHUD loaded — 41 ms</span>`,
      ()=>`<span class="t">[SWUI]</span> state batch flushed · 3 fields · v${++n}`,
      ()=>`<span class="t">[SWUI]</span> Inventory → WasHidden(true) · compositor suspended`,
      ()=>`<span class="t">[SWUI]</span> ROI blit · 4 rects · 6.2% surface coverage`,
      ()=>`<span class="t">[SWUI]</span> begin-frame · engine tick ${++n} · lockstep 60`,
      ()=>`<span class="t">[SWUI]</span> GameplayTag UI.Inventory.UseItem received`,
      ()=>`<span class="t">[SWUI]</span> shared texture acquired · 1920×1080 · DXGI`,
      ()=>`<span class="t">[SWUI]</span> Chat preloaded — activation deferred`,
      ()=>`<span class="t">[SWUI]</span> pause.html ticking — world paused`,
      ()=>`<span class="t">[SWUI]</span> cef message loop · 0.84 / 2.00 ms budget`,
    ];
    const put=()=>{const d=el('div');d.innerHTML=L[li++%L.length]();box.prepend(d);while(box.children.length>2)box.lastChild.remove()};
    put();if(!RM)setInterval(()=>{const r=box.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)put()},2300);
  }
  initDocStack();initLifecycle();initPreload();initStateBus();initBatching();initPacing();initRenderPaths();initRoi();initSleep();initInputRoute();initGamepad();initTagFlow();initBlueprint();initTsExplorer();initFrameworks();initCrosshair();
  const dc=$('#docsCta');
  [['Getting started — five minutes to a HUD','#/docs/getting-started'],['Documents, layers & Z-order','#/docs/documents'],['State bus & batching','#/docs/state'],['Events & GameplayTags','#/docs/events'],['Input routing','#/docs/input'],['Rendering: GPU, CPU, pacing','#/docs/rendering'],['Troubleshooting','#/docs/troubleshooting']].forEach(([t,h])=>{
    const a=el('a','dlink',`<span>${t}</span><svg><use href="#i-arr"/></svg>`);a.href=h;dc.appendChild(a);
  });
  /* final seam heartbeat */
  setInterval(()=>{const s=$('#finalSeam');if(!s||!s.isConnected)return;const r=s.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0){const p=el('div','pkt');p.style.setProperty('--y',(30+Math.random()*40)+'%');p.style.setProperty('--d','-120px');s.appendChild(p);setTimeout(()=>p.remove(),800)}},3800);
}
/* ---- documents ---- */
const DREG=[
  {id:'chat.html',layer:'PERSISTENT',z:5,state:'ACTIVE',w:26,h:38,x:6,y:44},
  {id:'watermark.html',layer:'PERSISTENT',z:8,state:'SLEEPING',w:20,h:12,x:76,y:6},
  {id:'hud.html',layer:'LEVEL',z:10,state:'ACTIVE',w:64,h:74,x:22,y:16},
  {id:'objectives.html',layer:'LEVEL',z:30,state:'ACTIVE',w:24,h:30,x:66,y:56},
  {id:'inventory.html',layer:'MODAL',z:100,state:'SLEEPING',w:46,h:56,x:30,y:26},
  {id:'pause.html',layer:'MODAL',z:200,state:'UNLOADED',w:40,h:48,x:32,y:28}
];
let dsel=2;
function docFace(d,foc){
  const c=el('div','docface'+(foc?' focused':''));
  c.style.cssText=`left:${d.x}%;top:${d.y}%;width:${d.w}%;height:${d.h}%;z-index:${Math.min(d.z,300)}`;
  c.innerHTML=`<div class="fh"><i></i>${d.id}</div><div class="fb"><div class="sk" style="width:70%"></div><div class="sk" style="width:45%"></div><div class="sk" style="width:58%"></div></div>`;
  if(d.state==='SLEEPING')c.classList.add('sleeping');
  if(d.state==='UNLOADED')c.classList.add('unloaded');
  return c;
}
function initDocStack(){
  const list=$('#docList'),stage=$('#dsStage'),meta=$('#dsMeta'),bar=$('#zrBar');
  DREG.forEach((d,i)=>{
    const b=el('button','drow'+(i===dsel?' sel':''),`<span class="dn">${d.id}</span><span class="dl">${d.layer}</span><span class="dz">${d.z}</span><span class="dstate ${d.state}">${d.state}</span>`);
    b.setAttribute('role','option');
    b.addEventListener('click',()=>{dsel=i;render()});
    b.addEventListener('mouseenter',()=>mks[i]?.classList.add('hot'));
    b.addEventListener('mouseleave',()=>mks[i]?.classList.remove('hot'));
    list.appendChild(b);
  });
  for(let z=0;z<=300;z+=50){const t=el('div','tick',`<span>${z}</span>`);t.style.left=(z/300*100)+'%';bar.appendChild(t)}
  const mks=DREG.map(d=>{
    const m=el('div','mk',`<span>${d.z}</span>`);m.style.left=clamp(d.z/300*100,0.5,99)+'%';bar.appendChild(m);return m;
  });
  function render(){
    $$('.drow',list).forEach((r,i)=>r.classList.toggle('sel',i===dsel));
    stage.innerHTML='';
    DREG.forEach((d,i)=>{if(d.state!=='UNLOADED')stage.appendChild(docFace(d,i===dsel))});
    const d=DREG[dsel];
    meta.innerHTML=`<div><b>Document ID</b><span>${d.id}</span></div><div><b>Layer</b><span>${d.layer}</span></div><div><b>Z-order</b><span>${d.z}</span></div><div><b>Lifecycle</b><span>${d.state}</span></div><div><b>Input</b><span>${d.layer==='MODAL'?'captures when active':'passthrough'}</span></div>`;
  }
  const set=s=>{DREG[dsel].state=s;render()};
  $('#dsAct').addEventListener('click',()=>set('ACTIVE'));
  $('#dsSleep').addEventListener('click',()=>set('SLEEPING'));
  $('#dsUnload').addEventListener('click',()=>set('UNLOADED'));
  $('#dsLoad').addEventListener('click',()=>set('ACTIVE'));
  render();
}
/* ---- lifecycle ---- */
const LC={
  UNLOADED:'No browser, no texture, no Slate surface. The document costs nothing.',
  LOADING:'Creating the Chromium context and fetching HTML, CSS and scripts. Not yet visible.',
  PRELOADED:'Fully prepared and resident — held off-screen until the moment it is needed.',
  ACTIVE:'Mounted into the Unreal viewport. Hit-testable, input-ready, ticking with the game.',
  SLEEPING:'Removed from presentation. Chromium rendering and timers are suspended via WasHidden.',
  UNLOADING:'Browser closing, client references clearing, GPU and Slate resources releasing.'
};
function initLifecycle(){
  const field=$('#lcField'),svg=$('#lcSvg'),prev=$('#lcPrev');
  const N={
    UNLOADED:[8,150],LOADING:[152,150],PRELOADED:[296,150],
    ACTIVE:[452,86],SLEEPING:[452,214],UNLOADING:[296,268]
  };
  Object.entries(N).forEach(([k,[x,y]])=>{
    const b=el('button','lc-node',k);b.dataset.s=k;
    b.style.cssText=`left:${x}px;top:${y}px`;
    b.addEventListener('click',()=>{stopAuto();set(k)});
    field.appendChild(b);
  });
  const mk=document.createElementNS('http://www.w3.org/2000/svg','marker');
  mk.setAttribute('id','lca');mk.setAttribute('markerWidth','7');mk.setAttribute('markerHeight','7');mk.setAttribute('refX','6');mk.setAttribute('refY','3.5');mk.setAttribute('orient','auto');
  mk.innerHTML='<path d="M0 0L7 3.5L0 7Z" fill="currentColor"/>';
  svg.appendChild(mk);svg.style.color='var(--mut)';
  const W=[['UNLOADED','LOADING'],['LOADING','PRELOADED'],['PRELOADED','ACTIVE'],['ACTIVE','SLEEPING'],['SLEEPING','ACTIVE'],['ACTIVE','UNLOADING'],['SLEEPING','UNLOADING'],['UNLOADING','UNLOADED']];
  W.forEach(([a,b])=>{
    const A={x:N[a][0]+118,y:N[a][1]+18},B={x:N[b][0],y:N[b][1]+18};
    if(b==='SLEEPING'||a==='SLEEPING'){A.x-=14;B.x+=14}
    const dx=Math.max(30,Math.abs(B.x-A.x)/2);
    let d=`M${A.x} ${A.y} C${A.x+dx} ${A.y} ${B.x-dx} ${B.y} ${B.x} ${B.y}`;
    if(a==='UNLOADING')d=`M${A.x} ${A.y+10} C${A.x-120} ${A.y+70} ${B.x-70} ${B.y+60} ${B.x+30} ${B.y+20}`;
    if(a==='ACTIVE'&&b==='UNLOADING')d=`M${A.x-30} ${A.y+10} C${A.x-60} ${A.y+80} ${B.x+40} ${B.y-20} ${B.x+40} ${B.y-2}`;
    const p=document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d',d);p.setAttribute('class','lc-wire');p.setAttribute('marker-end','url(#lca)');
    svg.appendChild(p);
  });
  function set(s){
    $$('.lc-node',field).forEach(n=>n.classList.toggle('on',n.dataset.s===s));
    $('#lcTitle').textContent=s.charAt(0)+s.slice(1).toLowerCase();
    $('#lcDesc').textContent=LC[s];
    prev.innerHTML='';
    const doc=el('div','lc-doc');
    if(s==='UNLOADED'){doc.style.cssText+=';border-style:dashed;background:transparent;opacity:.35';doc.innerHTML='<div class="fh">hud.html — unallocated</div>'}
    else if(s==='LOADING'){
      doc.innerHTML='<div class="fh">hud.html — fetching</div><div style="display:flex;gap:6px;padding:12px 14px 0;flex-wrap:wrap" id="lcc"></div><div class="lc-bar"><i id="lcb"></i></div>';
      ['HTML','CSS','JS','BROWSER'].forEach((c,i)=>setTimeout(()=>{const ch=el('span','chip',c);$('#lcc',prev).appendChild(ch);setTimeout(()=>ch.classList.add('on'),40)},i*240));
      let w=0;const iv=setInterval(()=>{w+=12;const b=$('#lcb',prev);if(b)b.style.width=Math.min(100,w)+'%';if(w>=100)clearInterval(iv)},140);
    }
    else if(s==='PRELOADED'){doc.style.borderColor='#FF6B33';doc.innerHTML='<div class="fh">hud.html — ready</div><div style="display:flex;gap:6px;padding:12px 14px;flex-wrap:wrap"><span class="chip on">HTML</span><span class="chip on">CSS</span><span class="chip on">JS</span><span class="chip on">BROWSER</span></div><div class="lc-bar" style="margin:0 14px 6px"><i style="width:100%"></i></div><div class="mono" style="font-size:9px;color:#8A8C95;text-align:center;padding:0 14px 14px">not mounted — activation is instant</div>'}
    else if(s==='ACTIVE'){doc.innerHTML='<div class="fh">hud.html — mounted · Z-10</div><div style="padding:12px 14px"><div style="height:5px;background:rgba(239,238,232,.1);margin:6px 0;width:64%"></div><div style="height:5px;background:rgba(239,238,232,.1);margin:6px 0;width:42%"></div><div style="height:5px;background:rgba(239,238,232,.1);margin:6px 0;width:55%"></div></div><div class="mono" style="font-size:9px;color:#5FA97A;text-align:center;padding-bottom:12px">rAF · timers · compositing — running</div>'}
    else if(s==='SLEEPING'){doc.classList.add('sleeping');doc.innerHTML='<div class="fh">hud.html — hidden</div><div class="mono" style="font-size:9px;color:#D9A94A;padding:16px;text-align:center;line-height:2">rAF paused<br>timers paused<br>compositing paused</div>'}
    else{doc.innerHTML='<div class="fh">hud.html — releasing</div><div style="display:flex;gap:6px;padding:12px 14px 0;flex-wrap:wrap"><span class="chip">browser</span><span class="chip">gpu handle</span><span class="chip">texture</span></div><div class="mono" style="font-size:9px;color:#8A8C95;padding:12px 14px 14px;text-align:center">memory reclaimed</div>'}
    prev.appendChild(doc);
  }
  let auto=null;
  const stopAuto=()=>{if(auto){clearInterval(auto);auto=null;$('#lcAuto').classList.remove('on')}};
  $('#lcAuto').addEventListener('click',()=>{
    if(auto){stopAuto();return}
    $('#lcAuto').classList.add('on');
    const seq=['LOADING','PRELOADED','ACTIVE','SLEEPING','ACTIVE','UNLOADING','UNLOADED','LOADING'];let i=1;
    set(seq[0]);
    auto=setInterval(()=>{set(seq[i]);i=(i+1)%seq.length},1500);
  });
  set('ACTIVE');
}
/* ---- preload ---- */
function initPreload(){
  $('#plRun').addEventListener('click',()=>{
    const chips=$$('#plChips .chip'),d1=$('#plD1'),d2=$('#plD2'),fill=$('#plFill'),lb=$('#plD2L');
    chips.forEach(c=>c.classList.remove('on'));fill.style.width='0';lb.textContent='level-02/hud.html · preloading…';
    d1.classList.add('on','hot');d1.classList.remove('dead');d2.classList.add('on');d2.classList.remove('dead','hot');
    [[300,()=>chips[0].classList.add('on')],[800,()=>chips[1].classList.add('on')],
     [1300,()=>{chips[2].classList.add('on');fill.style.width='45%'}],
     [1900,()=>{chips[3].classList.add('on');fill.style.width='78%'}],
     [2500,()=>{fill.style.width='100%';chips[4].classList.add('on');lb.textContent='level-02/hud.html · PRELOADED'}],
     [3300,()=>{d1.classList.add('dead');d1.classList.remove('hot')}],
     [3700,()=>{d2.classList.add('hot');lb.textContent='level-02/hud.html · ACTIVE — instantly'}]
    ].forEach(([t,f])=>setTimeout(f,t));
  });
}
/* ---- state bus ---- */
function initStateBus(){
  const SUBS=[
    {n:'HUD',ls:['PlayerHealth','Ammo','CurrentSpread','CrosshairMode'],r:s=>`HP ${s.PlayerHealth} · AMMO ${s.Ammo} · SPREAD ${(s.CurrentSpread/100).toFixed(2)}`},
    {n:'Inventory',ls:['Ammo','CanInteract'],r:s=>`ammo ${s.Ammo} · interact ${s.CanInteract?'yes':'no'}`},
    {n:'Dialogue',ls:['Prompt','CanInteract'],r:s=>`"${s.Prompt}" ${s.CanInteract?'· [E]':''}`},
    {n:'Debug UI',ls:['all fields'],r:s=>JSON.stringify({PlayerHealth:s.PlayerHealth,Ammo:s.Ammo,Shield:s.Shield})}
  ];
  const box=$('#sbSubs');let disp=0,inv=0;
  SUBS.forEach(s=>{
    const d=el('div','sb-sub',`<h5>${s.n}<span class="ls">${s.ls.join(' · ')}</span></h5><div class="val">—</div>`);
    box.appendChild(d);s.el=d;
  });
  const get=()=>({PlayerHealth:+$('#sbHp').value,Ammo:+$('#sbAmmo').value,Shield:+($('#sbSh')?.value||100),CurrentSpread:+$('#sbSp').value,CrosshairMode:$('#sbCm').value,CanInteract:$('#sbCi').checked,Prompt:$('#sbPr').value});
  let pend=null;
  ['sbHp','sbAmmo','sbSh','sbSp','sbCm','sbCi','sbPr'].forEach(id=>{
    const el=$('#'+id);
    if(el)el.addEventListener('input',()=>{
      if(pend)return;pend=setTimeout(()=>{pend=null;publish()},160);
    });
  });
  function publish(){
    const s=get();disp++;
    const bus=$('#sbBus');
    const p=el('div','pkt');p.style.setProperty('--y',(10+Math.random()*80)+'%');p.style.setProperty('--d','120px');
    bus.appendChild(p);setTimeout(()=>p.remove(),800);
    setTimeout(()=>{
      SUBS.forEach(sub=>{
        if(sub.ls[0]==='all fields'||Object.keys(s).some(k=>sub.ls.includes(k))){
          inv++;sub.el.classList.add('flash');$('.val',sub.el).textContent=sub.r(s);
          setTimeout(()=>sub.el.classList.remove('flash'),600);
        }
      });
      $('#sbCount').textContent=`// dispatches: ${disp} · listener invocations: ${inv} · frontend polls: 0`;
    },480);
  }
  publish();
}
/* ---- batching ---- */
function initBatching(){
  let pending=[],naive=0,swui=0;
  const chips=$('#btChips'),json=$('#btJson'),fw=$$('.bt-fw span');
  $$('[data-dirty]').forEach(b=>b.addEventListener('click',()=>{
    if(pending.some(p=>p.k===b.dataset.dirty))return;
    pending.push({k:b.dataset.dirty,v:b.textContent.split('· ')[1]});
    naive++;$('#btNaive').textContent=naive;
    chips.innerHTML='';pending.forEach(p=>chips.appendChild(el('div','bt-chip',`<b>${p.k}</b> → ${p.v}`)));
  }));
  $('#btFlush').addEventListener('click',()=>{
    if(!pending.length){toast('Nothing dirty — mark some fields first');return}
    const o={};pending.forEach(p=>o[p.k]=isNaN(p.v)?p.v:+p.v);
    json.innerHTML=hl(JSON.stringify(o,null,2),'json');
    swui++;$('#btSwui').textContent=swui;
    fw.forEach(f=>{f.classList.add('flash');setTimeout(()=>f.classList.remove('flash'),700)});
    pending=[];chips.innerHTML='<span class="mono dim" style="font-size:10.5px">— flushed as one batch —</span>';
  });
  $('#btReset').addEventListener('click',()=>{pending=[];naive=0;swui=0;$('#btNaive').textContent=0;$('#btSwui').textContent=0;chips.innerHTML='<span class="mono dim" style="font-size:11px">— nothing dirty —</span>';json.textContent='{}'});
}
/* ---- pacing ---- */
function initPacing(){
  const cv=$('#fpCv'),cx=cv.getContext('2d'),count=$('#fpCount');
  let mode=60,ticks=0,frames=0,drift=0,tEng=0,tUi=0;
  const eng=[],ui=[];
  function sz(){cv.width=cv.clientWidth||700}sz();addEventListener('resize',sz);
  loop(cv,dt=>{
    tEng+=dt;tUi+=dt;
    const engInt=1/60;
    const uiInt=mode==='free'?(0.008+Math.random()*0.018):1/mode;
    while(tEng>=engInt){tEng-=engInt;eng.push(1);if(eng.length>150)eng.shift();ticks++}
    while(tUi>=uiInt){tUi-=uiInt;ui.push(1);if(ui.length>150)ui.shift();frames++;if(mode==='free')drift+=Math.random()*.3-.14}
    cx.clearRect(0,0,cv.width,cv.height);
    cx.fillStyle='rgba(239,238,232,.5)';cx.font='500 9px IBM Plex Mono';
    cx.fillText('ENGINE CLOCK',10,18);cx.fillText('UI FRAMES',10,74);
    cx.strokeStyle='rgba(239,238,232,.12)';cx.beginPath();cx.moveTo(0,30);cx.lineTo(cv.width,30);cx.moveTo(0,86);cx.lineTo(cv.width,86);cx.stroke();
    eng.forEach((v,i)=>{cx.fillStyle='rgba(239,238,232,.75)';cx.fillRect(i/150*cv.width,22,2,16)});
    ui.forEach((v,i)=>{cx.fillStyle='#FF4D00';cx.fillRect(i/150*cv.width,78,2,16)});
    count.innerHTML=mode==='free'
      ?`game ticks: <b>${ticks}</b> · ui frames: <b>${frames}</b> · drift: <b>${drift>=0?'+':''}${drift.toFixed(1)} fr</b>`
      :`game ticks: <b>${ticks}</b> · ui frames: <b>${frames}</b> · drift: <b>+0.0</b> · lockstep`;
    const i=ticks%5;if(i===0){$$('#fpChain .fnode')[4].classList.add('lit');setTimeout(()=>$$('#fpChain .fnode')[4].classList.remove('lit'),150)}
  });
  $$('[data-fps]').forEach(b=>b.addEventListener('click',()=>{
    $$('[data-fps]').forEach(x=>x.classList.remove('on'));b.classList.add('on');
    mode=b.dataset.fps==='free'?'free':+b.dataset.fps;drift=0;
  }));
}
/* ---- render paths ---- */
function initRenderPaths(){
  $$('[data-rp]').forEach(b=>b.addEventListener('click',()=>{
    $$('[data-rp]').forEach(x=>x.classList.remove('on'));b.classList.add('on');
    const gpu=b.dataset.rp==='gpu';
    $('#rpGpu').hidden=!gpu;$('#rpCpu').hidden=gpu;
    $('#rpNote').textContent=gpu
      ?'The documented accelerated path. Chromium\u2019s composited output is exposed as a shared GPU resource and consumed directly by the Unreal RHI — no full-frame CPU staging between browser and engine.'
      :'A full-surface CPU renderer kept for platform compatibility. Chromium paints into a BGRA system-memory buffer, double-buffered, then uploaded as an RHI texture update. It keeps SWUI running where shared handles aren\u2019t available — it is not equivalent in throughput to the GPU path.';
    $('#rpTag').textContent=gpu?'GPU SHARED TEXTURE PATH':'CPU FULL-SURFACE — COMPATIBILITY';
    $('#rpTitle').textContent=gpu?'GPU shared texture path':'CPU full-surface path';
  }));
}
/* ---- ROI ---- */
function initRoi(){
  let mode='full';
  const panel=$('#roiPanel'),flash=$('#roiFlash');
  const rc=$('#roiRadar').getContext('2d');let sweep=0;
  const hxh=makeCrosshair($('#roiXh'));hxh.set(.3,'EXPANDED');
  const vals={health:84,ammo:24};
  let coverage=0;const rects={};
  function measure(){
    const pr=panel.getBoundingClientRect();
    $$('.hudel[data-roi-el]',panel).forEach(e=>{
      const r=e.getBoundingClientRect();
      rects[e.dataset.roiEl]={x:(r.left-pr.left)/pr.width*100,y:(r.top-pr.top)/pr.height*100,w:r.width/pr.width*100,h:r.height/pr.height*100};
    });
    coverage=Object.values(rects).reduce((a,r)=>a+r.w*r.h/100,0);
    $$('.roi-rect',panel).forEach(r=>r.remove());
    Object.entries(rects).forEach(([k,r])=>{
      const d=el('div','roi-rect',`<span class="rr-l">${k}</span>`);
      d.style.cssText=`left:${r.x}%;top:${r.y}%;width:${r.w}%;height:${r.h}%`;d.dataset.k=k;panel.appendChild(d);
    });
  }
  requestAnimationFrame(()=>setTimeout(measure,80));
  addEventListener('resize',()=>requestAnimationFrame(measure));
  loop(panel,dt=>{sweep+=dt*1.4;const w=84,c=w/2;rc.clearRect(0,0,w,w);rc.strokeStyle='rgba(239,238,232,.15)';rc.beginPath();rc.arc(c,c,c-2,0,7);rc.stroke();for(let i=0;i<8;i++){const a=sweep-i*.1;rc.strokeStyle=`rgba(255,107,51,${.35*(1-i/8)})`;rc.beginPath();rc.moveTo(c,c);rc.lineTo(c+Math.cos(a)*(c-3),c+Math.sin(a)*(c-3));rc.stroke()}});
  function update(which){
    measure();
    if(mode==='roi'){
      $$('.roi-rect',panel).forEach(r=>r.classList.toggle('on',r.dataset.k===which));
      setTimeout(()=>$$('.roi-rect',panel).forEach(r=>r.classList.remove('on')),700);
      $('#roiStat').textContent=`// ROI mode · 4 active regions · surface coverage ≈ ${coverage.toFixed(1)}% · partial blit`;
    }else{
      flash.classList.remove('on');void flash.offsetWidth;flash.classList.add('on');
      $('#roiStat').textContent=`// full-surface mode · 1 blit · 100% of the surface touched every update`;
    }
    if(which==='health'){vals.health=clamp(vals.health+(Math.random()*16-8),20,100);$('#roiHp').textContent=Math.round(vals.health);$('#roiHpB').style.width=vals.health+'%'}
    if(which==='ammo'){vals.ammo=Math.max(1,vals.ammo-(Math.random()<.6?1:0));if(vals.ammo<4)vals.ammo=24;$('#roiAmmo').textContent=vals.ammo}
    if(which==='notif'){$('#roiNotif').textContent=['shield restored','ammo low','objective updated'][Math.floor(Math.random()*3)]}
  }
  $$('[data-roi]').forEach(b=>b.addEventListener('click',()=>{
    $$('[data-roi]').forEach(x=>x.classList.remove('on'));b.classList.add('on');
    mode=b.dataset.roi;
    $('#roiStatic').classList.toggle('on',mode==='roi');
    if(mode==='roi'){$$('.roi-rect',panel).forEach(r=>r.classList.add('on'));setTimeout(()=>$$('.roi-rect',panel).forEach(r=>r.classList.remove('on')),900);update('none')}
    else update('none');
  }));
  $('#roiSim').addEventListener('click',()=>update(['health','ammo','minimap','notif'][Math.floor(Math.random()*4)]));
  let n=0;const cyc=['health','ammo','notif','minimap'];
  setInterval(()=>{const r=panel.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)update(cyc[n++%4])},2400);
  update('health');$('#roiStatic').classList.remove('on');
  $('#roiStat').textContent='// full-surface mode · 1 blit · 100% of the surface touched every update';
}
/* ---- sleep ---- */
function initSleep(){
  let frames=0,t=0,sleeping=false;
  const grid=$('#slGrid');
  loop(grid,dt=>{if(sleeping)return;frames++;t+=dt;$('#slFrames').textContent=frames;$('#slTime').textContent=t.toFixed(1)+' s'});
  const set=s=>{sleeping=s;grid.classList.toggle('sleeping',s);$('#slVis').classList.toggle('on',!s);$('#slHid').classList.toggle('on',s)};
  $('#slVis').addEventListener('click',()=>set(false));
  $('#slHid').addEventListener('click',()=>set(true));
}
/* ---- input routing ---- */
function initInputRoute(){
  const view=$('#irView'),trace=$('#irTrace'),docs=$$('.ir-doc',view);
  function report(x,y){
    const v=view.getBoundingClientRect();
    const px=Math.round(x-v.left),py=Math.round(y-v.top);
    let best=null;
    docs.forEach(d=>{
      const r=d.getBoundingClientRect();
      const inside=x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
      const inter=d.dataset.interactive==='1';
      d.classList.toggle('hot',!!(inside&&inter));
      d.classList.toggle('dimd',!!(inside&&!inter));
      if(inside&&inter&&(!best||+d.dataset.z>+best.dataset.z))best=d;
    });
    const chatR=$('.ir-doc[data-z="40"]').getBoundingClientRect();
    const lines=[];
    lines.push(`<em>pointer (${px}, ${py}) — hit test</em>`);
    lines.push(`hud.html · z10 · visible · <em>non-interactive</em> → skip`);
    lines.push(`chat.html · z40 · interactive · contains: ${x>=chatR.left&&x<=chatR.right&&y>=chatR.top&&y<=chatR.bottom?'<em>yes</em>':'no'}`);
    lines.push(best?`<span class="r">→ ROUTED: ${best.querySelector('.fh span').textContent} (highest interactive z-order containing pointer)</span>`
      :`<span class="g">→ no document accepts → FALLS THROUGH TO GAMEPLAY</span>`);
    trace.innerHTML=lines.join('<br>');
  }
  view.addEventListener('pointermove',e=>report(e.clientX,e.clientY));
  view.addEventListener('pointerdown',e=>report(e.clientX,e.clientY));
  view.addEventListener('pointerleave',()=>{docs.forEach(d=>d.classList.remove('hot','dimd'));trace.innerHTML='<em>move your pointer across the viewport</em>'});
  trace.innerHTML='<em>move your pointer across the viewport</em>';
}
/* ---- gamepad ---- */
function initGamepad(){
  const items=$$('.gm-item'),menu=$('#gmMenu'),log=$('#gmLog');let foc=0;
  const focus=i=>{foc=(i+items.length)%items.length;items.forEach((it,j)=>it.classList.toggle('foc',j===foc))};
  const logEv=s=>{log.innerHTML=`<span class="r">swui.navigation.${s}</span><br>`+log.innerHTML.split('<br>').slice(0,4).join('<br>')};
  const nav={up:-1,down:1};
  function act(a){
    if(a==='up'){focus(foc-1);logEv('onNavigate · up')}
    if(a==='down'){focus(foc+1);logEv('onNavigate · down')}
    if(a==='confirm'){items[foc].classList.add('conf');setTimeout(()=>items[foc].classList.remove('conf'),350);logEv('onConfirm · "'+items[foc].firstChild.textContent+'"')}
    if(a==='cancel')logEv('onCancel');
  }
  menu.addEventListener('keydown',e=>{
    if(e.key==='ArrowUp'){act('up');e.preventDefault()}
    if(e.key==='ArrowDown'){act('down');e.preventDefault()}
    if(e.key==='Enter'){act('confirm');e.preventDefault()}
    if(e.key==='Escape')act('cancel');
  });
  $$('[data-gm]').forEach(b=>b.addEventListener('click',()=>act(b.dataset.gm)));
  focus(0);
}
/* ---- tag flow ---- */
function initTagFlow(){
  let count=3;
  $('#tfUse').addEventListener('click',()=>{
    const pkt=$('#tfPkt'),acts=$$('#tfActs div');
    pkt.classList.add('on');acts.forEach(a=>a.classList.remove('on'));
    acts.forEach((a,i)=>setTimeout(()=>a.classList.add('on'),400+i*260));
    setTimeout(()=>{
      if(count>1){count--;$('#tfCount').textContent='×'+count+' remaining'}
      else{$('#tfCount').textContent='slot empty';$('#tfUse').disabled=true;$('#tfUse').textContent='Empty'}
    },1300);
    setTimeout(()=>pkt.classList.remove('on'),2600);
  });
}
/* ---- blueprint ---- */
function initBlueprint(){
  const box=$('#bpIn'),svg=$('#bpSvg');
  const C={swui:'#FF4D00',ev:'#EFEEE8',var2:'#D9A94A',obs:'#5FA97A',file:'#FF6B33'};
  const nodes=[
    {id:'begin',x:14,y:22,w:118,h:50,head:'Event',name:'BeginPlay',c:C.ev},
    {id:'iface',x:180,y:22,w:150,h:50,head:'SWUI',name:'Create Interface',c:C.swui},
    {id:'load',x:378,y:22,w:150,h:64,head:'SWUI',name:'Load Document',c:C.swui,inD:['asset'],outD:['doc']},
    {id:'act',x:576,y:22,w:162,h:64,head:'SWUI',name:'Activate Document',c:C.swui,inD:['doc']},
    {id:'asset',x:14,y:200,w:168,h:50,head:'Variable',name:'HUD Document Asset',c:C.var2,sub:'USwuiDocumentAsset',outD:['asset']},
    {id:'bind',x:180,y:160,w:150,h:76,head:'SWUI',name:'Bind State',c:C.swui,inD:['float'],sub:'Weapon.CurrentSpread'},
    {id:'binde',x:378,y:160,w:150,h:76,head:'SWUI',name:'Bind Event',c:C.swui,inD:['event'],sub:'OnPlayerFiredShot'},
    {id:'gen',x:576,y:160,w:162,h:64,head:'SWUI',name:'Generate Contract',c:C.swui,outD:['file']},
    {id:'obs1',x:180,y:320,w:172,h:60,head:'SwuiObserve',name:'Weapon.CurrentSpread',c:C.obs,outD:['float']},
    {id:'obs2',x:396,y:320,w:190,h:60,head:'SwuiObserveEvent',name:'OnPlayerFiredShot',c:'#D96A5A',outD:['event']},
  ];
  const PINS={};
  function build(){
    box.querySelectorAll('.bp-node,.bp-out').forEach(n=>n.remove());svg.innerHTML='';
    nodes.forEach(n=>{
      const d=el('div','bp-node');
      d.style.cssText=`left:${n.x}px;top:${n.y}px;min-width:${n.w}px`;
      d.innerHTML=`<div class="nh"><span class="nc" style="background:${n.c}"></span>${n.head}</div><div class="nn">${n.name}</div>${n.sub?`<div class="np">${n.sub}</div>`:''}`;
      box.appendChild(d);n.el=d;
      if(!['begin','asset','obs1','obs2'].includes(n.id)){
        const pe=el('span','bp-pin');pe.style.cssText=`left:-4.5px;top:22px;background:#0B0C0E;color:#EFEEE8`;
        d.appendChild(pe);PINS[n.id+'.in']={x:n.x,y:n.y+27};
      }
      if(!['asset','obs1','obs2'].includes(n.id)){
        const po=el('span','bp-pin');po.style.cssText=`right:-4.5px;top:22px;background:#EFEEE8;color:#EFEEE8`;
        d.appendChild(po);PINS[n.id+'.out']={x:n.x+n.w,y:n.y+27};
      }
      (n.inD||[]).forEach((t,i)=>{
        const col=t==='asset'?C.var2:t==='float'?C.obs:t==='event'?'#D96A5A':C.swui;
        const p=el('span','bp-pin');p.style.cssText=`left:-4.5px;top:${46+i*20}px;border-color:${col};background:${col}`;
        d.appendChild(p);PINS[n.id+'.inD'+i]={x:n.x,y:n.y+50+i*20};
      });
      (n.outD||[]).forEach((t,i)=>{
        const col=t==='float'?C.obs:t==='file'?C.file:C.swui;
        const p=el('span','bp-pin');p.style.cssText=`right:-4.5px;top:${46+i*20}px;border-color:${col};background:${col}`;
        d.appendChild(p);PINS[n.id+'.outD'+i]={x:n.x+n.w,y:n.y+50+i*20};
      });
      if(n.outD&&n.outD[0]==='file'){
        const o=el('div','bp-out','<svg><use href="#i-file"/></svg>bindings.gen.ts');
        o.style.cssText=`left:${n.x+n.w+42}px;top:${n.y+12}px`;box.appendChild(o);
        PINS['out.node']={x:n.x+n.w+42,y:n.y+38};
      }
    });
    const wires=[['begin.out','iface.in'],['iface.out','load.in'],['load.out','act.in'],
      ['act.out','bind.in'],['bind.out','binde.in'],['binde.out','gen.in'],
      ['asset.outD0','load.inD0'],['load.outD0','act.inD0'],
      ['obs1.outD0','bind.inD0'],['obs2.outD0','binde.inD0'],['gen.outD0','out.node']];
    const paths=[];
    wires.forEach(([a,b])=>{
      const A=PINS[a],B=PINS[b];if(!A||!B)return;
      const dx=Math.max(36,Math.abs(B.x-A.x)/2);
      const p=document.createElementNS('http://www.w3.org/2000/svg','path');
      p.setAttribute('d',`M${A.x} ${A.y} C${A.x+dx} ${A.y} ${B.x-dx} ${B.y} ${B.x} ${B.y}`);
      p.setAttribute('class','bp-wire');svg.appendChild(p);paths.push(p);
    });
    return paths;
  }
  let paths=build();
  addEventListener('resize',()=>{paths=build()});
  $('#bpRun').addEventListener('click',()=>{
    ['begin','iface','load','act','bind','binde','gen'].forEach((id,i)=>setTimeout(()=>{
      const n=nodes.find(n=>n.id===id);
      if(n&&n.el){n.el.classList.add('lit');setTimeout(()=>n.el.classList.remove('lit'),900)}
      if(paths[i]){paths[i].classList.add('lit');setTimeout(()=>paths[i].classList.remove('lit'),900)}
    },i*420));
  });
}
/* ---- ts explorer ---- */
function initTsExplorer(){
  const FIELDS=[
    {n:'Player.Health',t:'number'},{n:'Player.Shield',t:'number'},{n:'Weapon.CurrentAmmo',t:'number'},
    {n:'Weapon.CurrentSpread',t:'number'},{n:'HUDState.CrosshairMode',t:"'PRECISE' | 'EXPANDED' | 'SNIPER'"},
    {n:'Interaction.bCanInteract',t:'boolean'},{n:'Interaction.Prompt',t:'string'}
  ];
  const EVENTS=[
    {n:'Weapon.OnPlayerFiredShot',t:'(e) => void'},{n:'Combat.OnHitConfirmed',t:'(e) => void'},{n:'Weapon.Reload',t:'() => void'}
  ];
  const obs=$('#tsObs');
  [...FIELDS.map(f=>[f.n,'state · '+f.t]),...EVENTS.map(f=>[f.n,'event'])].forEach(([n,t])=>{
    obs.appendChild(el('div','ts-orow',`<span>${n}</span><span class="ty">${t}</span>`));
  });
  $('#tsGen').innerHTML=codeFig('gen','bindings.gen.ts','ts','l');
  const mount=$('#tsEd');mount.innerHTML='';
  const inp=el('input','ts-input');inp.placeholder='type — e.g. swui.state.';inp.setAttribute('aria-label','TypeScript input with autocomplete');
  const sug=el('div','ts-sug');sug.hidden=true;
  const line=el('div','ts-line');
  line.innerHTML=`<span class="k">const</span> spread =&nbsp;`;
  line.appendChild(inp);
  const hint=$('#tsHint');
  function ctx(){
    const v=inp.value;
    if(/^swui\.state\./.test(v))return{list:FIELDS.map(f=>({...f,ins:"swui.state.get('"+f.n+"')",dt:'typed: '+f.t})),rem:v.slice(11)};
    if(/^swui\.events\.on\('/.test(v))return{list:EVENTS.map(f=>({...f,ins:"swui.events.on('"+f.n+"'",dt:'handler: '+f.t})),rem:v.slice(16).replace(/^'/,'')};
    if(/^swui\.get\('/.test(v))return{list:FIELDS.map(f=>({...f,ins:"swui.get('"+f.n+"')",dt:'typed: '+f.t})),rem:v.slice(9).replace(/^'/,'')};
    return null;
  }
  function upd(){
    const c=ctx();
    if(!c){sug.hidden=true;hint.classList.remove('on');return}
    const m=c.list.filter(f=>f.n.toLowerCase().includes(c.rem.toLowerCase()));
    sug.innerHTML='';sug.hidden=false;
    if(!m.length){sug.appendChild(el('div','mono dim','<span style="padding:8px 12px;display:block;font-size:11px">no match in bindings.gen.ts</span>'));return}
    m.forEach(f=>{
      const b=el('button',null,`<span>${f.n}</span><span class="ty">${f.t}</span>`);
      b.addEventListener('click',()=>accept(f));sug.appendChild(b);
    });
  }
  function accept(f){inp.value=f.ins;sug.hidden=true;hint.classList.add('on');$('#tsHintT').textContent=f.dt+' — autocompleted from the generated contract'}
  inp.addEventListener('input',upd);
  inp.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key==='Tab'){
      const c=ctx();
      if(c&&!sug.hidden){const m=c.list.filter(f=>f.n.toLowerCase().includes(c.rem.toLowerCase()));if(m.length){e.preventDefault();accept(m[0])}}
    }
  });
  document.addEventListener('click',e=>{if(!e.target.closest('.ts-sug')&&e.target!==inp)sug.hidden=true});
  const fig=el('figure','code code-l');
  fig.innerHTML=`<figcaption><span class="cf-file">Crosshair.tsx</span><span class="cf-lang">TypeScript</span></figcaption>`;
  const pre=el('pre');
  const l1=el('span','cl',`<span class="k">import</span> { SwuiState } <span class="k">from</span> <span class="s">'./bindings.gen'</span>;`);
  const l2=el('span','cl',' ');
  const l3=el('span','cl',`<span class="k">export function</span> <span class="f">Crosshair</span>() {`);
  const l5=el('span','cl','  <span class="c">// ← type below — the contract is generated from Unreal</span>');
  const l6=el('span','cl','}');
  pre.append(l1,l2,l3,line,l5,l6);
  fig.appendChild(pre);mount.appendChild(fig);
  mount.parentNode.insertBefore(sug,mount);
  $$('#tsQuick [data-q]').forEach(b=>b.addEventListener('click',()=>{inp.value=b.dataset.q;inp.focus();upd()}));
}
/* ---- frameworks ---- */
function initFrameworks(){
  const mount=$('#fwCode');
  const data={react:['react','AmmoCounter.tsx'],vue:['vue','composables.ts'],svelte:['svelte','Crosshair.svelte'],vanilla:['vanilla','hud.html — script']};
  const set=k=>{
    $$('#fwTabs [data-fw]').forEach(t=>t.classList.toggle('on',t.dataset.fw===k));
    mount.innerHTML=codeFig(data[k][0],data[k][1],'ts','d',false);
  };
  $$('#fwTabs [data-fw]').forEach(t=>t.addEventListener('click',()=>set(t.dataset.fw)));
  set('react');
}
/* ---- preview removed: merged into flagship crosshair ---- */
/* ---- crosshair flagship ---- */
function initCrosshair(){
  const xh=makeCrosshair($('#cxXh'));
  const st={spread:.3,ammo:24,mode:'EXPANDED',kick:0,sim:false,simT:0};
  const t0=performance.now();
  const ts=()=>{const s=(performance.now()-t0)/1000;return `${String(Math.floor(s/60)).padStart(2,'0')}:${(s%60).toFixed(1).padStart(4,'0')}`};
  const log=h=>{const l=$('#cxLog');l.innerHTML=`<div><span class="dim">${ts()}</span> ${h}</div>`+l.innerHTML.split('<br>').slice(0,7).join('<br>')};
  const readout=()=>{
    const cells=[['Weapon.CurrentSpread',(st.spread+st.kick).toFixed(2)],['Weapon.CurrentAmmo',st.ammo],['HUDState.CrosshairMode',st.mode],['Interaction.bCanInteract',$('#cxCi').checked],['Interaction.Prompt','"'+$('#cxPr').value+'"']];
    $('#cxState').innerHTML=cells.map(([k,v])=>`<div><b>${k}</b><span>${v}</span></div>`).join('');
  };
  function fire(){
    if(st.ammo<=0)return;
    st.ammo--;st.kick=Math.min(.6,st.kick+.28);st.spread=clamp(st.spread+.015,0,1);
    $('#cxRl').textContent=st.ammo<=0?'RELOAD — [R]':'';
    log(`<span class="ev">ON</span> <span class="tag">Weapon.OnPlayerFiredShot</span> <span class="pl">{ gunType: "rifle", ammoRemaining: ${st.ammo}, spread: ${(st.spread+st.kick).toFixed(2)} }</span>`);
    readout();
  }
  $('#cxView').addEventListener('pointerdown',fire);
  $('#cxFire').addEventListener('click',fire);
  $('#cxHit').addEventListener('click',()=>{
    xh.hit();
    const d=el('div','dmg','+'+Math.round(40+Math.random()*60));
    d.style.cssText='left:calc(50% + 22px);top:42%';$('#cxView').appendChild(d);setTimeout(()=>d.remove(),820);
    log(`<span class="ev">ON</span> <span class="tag">Combat.OnHitConfirmed</span> <span class="pl">{ damage: 87 }</span>`);
  });
  $('#cxView').addEventListener('keydown',e=>{
    if(e.key==='r'||e.key==='R'){st.ammo=24;$('#cxRl').textContent='';log(`<span class="ev">ON</span> <span class="tag">Weapon.Reload</span>`);readout()}
  });
  $('#cxSp').addEventListener('input',()=>st.spread=$('#cxSp').value/100);
  $('#cxAm').addEventListener('input',()=>st.ammo=clamp(+$('#cxAm').value||0,0,999));
  $('#cxCm').addEventListener('input',()=>st.mode=$('#cxCm').value);
  $('#cxCi').addEventListener('input',()=>$('#cxPrompt').style.display=$('#cxCi').checked?'':'none');
  $('#cxPr').addEventListener('input',()=>$('#cxPrompt').textContent='[E] '+($('#cxPr').value||'…'));
  ['cxSp','cxAm','cxCm','cxCi','cxPr'].forEach(id=>$('#'+id).addEventListener('input',readout));
  $('#cxSim').addEventListener('change',e=>st.sim=e.target.checked);
  loop($('#cxView'),dt=>{
    st.kick=damp(st.kick,0,6,dt);
    st.spread=damp(st.spread,$('#cxSp').value/100,1.4,dt);
    if(st.sim){st.simT+=dt;st.spread=clamp(st.spread+Math.sin(st.simT*1.7)*.0035,0,1);$('#cxSp').value=Math.round(st.spread*100)}
    xh.set(clamp(st.spread+st.kick,0,1),st.mode);
    if(Math.random()<dt*.5)readout();
  });
  readout();
  log('<span class="dim">document mounted · subscriptions active</span>');
}


    try {
      initHome()
    } catch (e) {
      console.error('Error in initHome:', e)
    }

    observeReveal(containerRef.current)
  }, [hidden])

  return (
    <div
      ref={containerRef}
      className="page"
      data-page="home"
      hidden={hidden}
      dangerouslySetInnerHTML={{ __html: `

  <header id="hero">
    <div class="hero-g">
      <div class="h-left gridbg paper">
        <div class="eyebrow">SWUI 3.0 — Web UI runtime for Unreal Engine</div>
        <h1>Web<br>UI.</h1>
        <p class="h-note">the browser is your widget system —<br>the engine is your game.</p>
        <p class="h-sub">Build game interfaces with <b>HTML, CSS, JavaScript and TypeScript</b>. Keep gameplay state, events and runtime control <b>inside Unreal</b>. This console publishes state — watch it cross the seam.</p>
        <div class="h-cta">
          <a class="btn" href="#/docs/getting-started">Get Started <svg><use href="#i-arr"/></svg></a>
          <a class="btn-g" href="https://github.com/AchiraStudio/SWUI" target="_blank" rel="noopener"><svg><use href="#i-gh"/></svg> GitHub</a>
        </div>
        <div class="plate console" id="heroConsole">
          <div class="plate-h"><span class="sq"></span>State bus — live publish<span class="sp"></span>WEB SIDE</div>
          <div class="plate-b">
            <div class="crow"><label for="hcHp">PlayerHealth</label><input type="range" id="hcHp" min="0" max="100" value="88"><output id="hcHpV" for="hcHp">88</output></div>
            <div class="crow"><label for="hcSp">CurrentSpread</label><input type="range" id="hcSp" min="0" max="100" value="30"><output id="hcSpV" for="hcSp">0.30</output></div>
            <div class="crow"><label for="hcCm">CrosshairMode</label><select id="hcCm"><option>PRECISE</option><option selected>EXPANDED</option><option>SNIPER</option></select><output></output></div>
            <div class="cbtns">
              <button class="tbtn pri" id="hcFire">Fire — emit event</button>
              <button class="tbtn" id="hcHit">Hit confirmed</button>
            </div>
          </div>
        </div>
      </div>
      <div class="seam" id="heroSeam" aria-hidden="true">
        <span class="seam-arrow a1">← STATE</span>
        <span class="seam-tag">SWUI Runtime</span>
        <span class="seam-arrow a2">EVENTS →</span>
      </div>
      <div class="h-right inksec">
        <h1>Inside<br><em>Unreal.</em></h1>
        <div class="h-meta"><span class="chip">CEF / Chromium</span><span class="chip">HTML</span><span class="chip">CSS</span><span class="chip">JavaScript</span><span class="chip">TypeScript</span><span class="chip">React · Vue · Svelte</span></div>
        <div class="hud-shell" aria-label="Live game HUD driven by the console on the left">
          <div class="floor"></div>
          <div style="position:absolute;inset:0" id="hudXh"></div>
          <div class="hudel" style="left:22px;top:20px"><div class="htag">Vitals</div><div class="hnum"><b id="hudHp">88</b> / 100</div><div class="bar"><i id="hudHpB" style="width:88%"></i></div></div>
          <div class="hudel hud-obj"><div class="htag">Objective</div><div class="o" id="hudObjT">Neutralize the relay array</div><div class="c" id="hudObjC">3 / 6</div></div>
          <div class="hudel hud-ammo"><div class="rl" id="hudRl"></div><div class="big"><span id="hudAmmo">24</span><span> | 180</span></div></div>
          <div class="hudel" style="left:20px;bottom:18px"><canvas id="hudRadar" width="110" height="110" aria-label="Minimap"></canvas></div>
          <div class="hudel" id="hudToasts"></div>
        </div>
        <div class="hud-cap"><span>MAINHUD · LEVEL · Z-10 · ACTIVE</span><span id="hudCapR">driven by the console across the seam</span></div>
      </div>
    </div>
  </header>

  <div class="syslog inksec"><div class="wrap">
    <span class="sl-dot" aria-hidden="true"></span>
    <div id="sysLines" aria-live="off"></div>
    <span class="sl-tag">System log</span>
  </div></div>

  <!-- 01 position -->
  <section class="sec paper"><div class="wrap">
    <div class="shead"><span class="sidx">01</span><span class="slbl">Position</span><span class="srule"></span><span class="stag">Two contracts, one runtime</span></div>
    <div class="sec-top">
      <h2 class="display">Build UI like a <span class="si">web app.</span><br>Wire it like an <span class="si">Unreal system.</span></h2>
      <p class="lead">The frontend team works in the tools they already know. Unreal remains the source of truth for gameplay state and runtime behavior. SWUI is the runtime between the two — documents, lifecycle, state synchronization, event routing, input orchestration and frame control. <b>Not an embedded widget.</b></p>
    </div>
    <div class="duo rv">
      <div class="col"><h3>Web — left of the seam</h3>
        <ul class="tlist"><li>HTML</li><li>CSS</li><li>JavaScript</li><li>TypeScript</li><li>React · Vue · Svelte</li><li>Vite &amp; modern tooling</li></ul>
      </div>
      <div class="seam" aria-hidden="true"></div>
      <div class="col dark"><h3>Unreal — right of the seam</h3>
        <ul class="tlist"><li>Gameplay</li><li>Reflected properties</li><li>Gameplay events</li><li>GameplayTags</li><li>Blueprint</li><li>Input · lifecycle · rendering</li></ul>
      </div>
    </div>
  </div></section>

  <!-- 02 documents -->
  <section class="sec inksec"><div class="wrap">
    <div class="shead"><span class="sidx">02</span><span class="slbl">Documents</span><span class="srule"></span><span class="stag">Multi-document engine</span></div>
    <div class="sec-top">
      <h2 class="display">One runtime.<br><span class="si">multiple documents.</span></h2>
      <p class="lead">SWUI does not require one monolithic page containing your entire game UI. Each interface is its own web document — independently loaded, layered, suspended and unloaded. Select a document, change its lifecycle, watch the stack respond.</p>
    </div>
    <div class="dstack rv">
      <div>
        <div class="dtable" role="listbox" aria-label="Document registry">
          <div class="th"><span>Document</span><span>Layer</span><span style="text-align:center">Z</span><span style="text-align:center">Lifecycle</span></div>
          <div id="docList"></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
          <button class="tbtn" id="dsAct">Activate</button><button class="tbtn" id="dsSleep">Sleep</button>
          <button class="tbtn" id="dsUnload">Unload</button><button class="tbtn" id="dsLoad">Load</button>
        </div>
      </div>
      <div>
        <div class="dstage" id="dsStage" aria-label="Document stack viewport"></div>
        <div class="dmeta" id="dsMeta"></div>
      </div>
    </div>
    <div class="zr rv">
      <div class="zr-bar" id="zrBar"></div>
      <div class="zr-lbls"><span>0–9 PERSISTENT</span><span>10–49 HUD</span><span>50–99 CONTEXTUAL</span><span>100–199 WINDOWS</span><span>200–299 SYSTEM</span><span>300+ CRITICAL</span></div>
    </div>
  </div></section>

  <!-- 03 lifecycle -->
  <section class="sec paper"><div class="wrap">
    <div class="shead"><span class="sidx">03</span><span class="slbl">Lifecycle</span><span class="srule"></span><span class="stag">State machine — click any state</span></div>
    <div class="sec-top">
      <h2 class="display">Load. Activate.<br><span class="si">sleep. wake. unload.</span></h2>
      <p class="lead">Every document moves through an explicit state machine owned by the runtime — drawn here the way the runtime sees it.</p>
    </div>
    <div class="lc-grid rv">
      <div class="plate"><div class="plate-h"><span class="sq"></span>Document state machine<span class="sp"></span><button class="tbtn" id="lcAuto"><svg><use href="#i-play"/></svg> Auto</button></div>
        <div class="plate-b" style="padding:10px;overflow-x:auto;-webkit-overflow-scrolling:touch"><div class="lc-field gridbg" id="lcField" style="min-width:580px"><svg id="lcSvg"></svg></div></div>
      </div>
      <div>
        <div class="plate" style="margin-bottom:14px"><div class="plate-h"><span class="sq"></span>Stage — hud.html</div>
          <div class="lc-prev" id="lcPrev" style="border:0"></div>
        </div>
        <div class="lc-desc"><h4 id="lcTitle">Active</h4><p id="lcDesc"></p></div>
      </div>
    </div>
  </div></section>

  <!-- 04 preload -->
  <section class="sec inksec"><div class="wrap">
    <div class="shead"><span class="sidx">04</span><span class="slbl">Preloading</span><span class="srule"></span><span class="stag">Background preparation</span></div>
    <div class="sec-top">
      <h2 class="display">Prepare the UI<br><span class="si">before the player needs it.</span></h2>
      <p class="lead">Web documents can be prepared in the background. While the player is still in Level 01, the Level 02 HUD loads its HTML, CSS, scripts and browser context — so activation after preload avoids cold-start work at the moment of use.</p>
    </div>
    <div class="plate rv"><div class="plate-h"><span class="sq"></span>Timeline — level travel<span class="sp"></span><button class="tbtn pri" id="plRun"><svg><use href="#i-play"/></svg> Run sequence</button></div>
      <div class="plate-b" style="overflow-x:auto;-webkit-overflow-scrolling:touch">
        <div class="pl-rail" id="plRail" style="min-width:320px">
          <div class="pl-ph" style="left:8%"><b>Level 01</b><span>hud · active</span></div>
          <div class="pl-ph" style="left:50%"><b>Transition</b><span>level travel</span></div>
          <div class="pl-ph" style="left:92%"><b>Level 02</b><span>preloaded → active</span></div>
          <div class="pl-doc" id="plD1" style="left:8%;width:42%"><div class="shell"></div><div class="lb">level-01/hud.html · LEVEL · Z-10</div></div>
          <div class="pl-doc" id="plD2" style="left:30%;width:62%"><div class="fill" id="plFill"></div><div class="shell"></div><div class="lb" id="plD2L">level-02/hud.html · preloading…</div></div>
        </div>
        <div class="pl-chips" id="plChips">
          <span class="chip" data-r="html">HTML</span><span class="chip" data-r="css">CSS</span><span class="chip" data-r="js">JS</span><span class="chip" data-r="browser">Browser context</span><span class="chip" data-r="res">Resources</span>
        </div>
      </div>
    </div>
  </div></section>

  <!-- 05 state bus -->
  <section class="sec paper"><div class="wrap">
    <div class="shead"><span class="sidx">05</span><span class="slbl">State</span><span class="srule"></span><span class="stag">Global state bus</span></div>
    <div class="sec-top">
      <h2 class="display">State belongs to the game.<br><span class="si">rendering belongs to the UI.</span></h2>
      <p class="lead">Unreal publishes reflected properties to a global state bus. Documents subscribe to fields; only relevant listeners react. The frontend never polls. Change a value on the right and watch it arrive on the left.</p>
    </div>
    <div class="sb rv">
      <div id="sbSubs"></div>
      <div class="sb-mid"><div class="sb-busline" id="sbBus"></div></div>
      <div class="sb-pub">
        <div class="plate-h"><span class="sq"></span>Unreal — publishers<span class="sp"></span>REFLECTED</div>
        <div class="plate-b">
          <div class="frow"><label for="sbHp">PlayerHealth</label><input type="range" id="sbHp" min="0" max="100" value="85"></div>
          <div class="frow"><label for="sbAmmo">Ammo</label><input type="number" id="sbAmmo" min="0" max="999" value="30"></div>
          <div class="frow"><label for="sbSh">Shield</label><input type="range" id="sbSh" min="0" max="100" value="100"></div>
          <div class="frow"><label for="sbSp">CurrentSpread</label><input type="range" id="sbSp" min="0" max="100" value="35"></div>
          <div class="frow"><label for="sbCm">CrosshairMode</label><select id="sbCm"><option>PRECISE</option><option selected>EXPANDED</option><option>SNIPER</option></select></div>
          <div class="frow"><label for="sbCi">bCanInteract</label><label class="cbx"><input type="checkbox" id="sbCi" checked><i></i> interaction available</label></div>
          <div class="frow"><label for="sbPr">Prompt</label><input type="text" id="sbPr" value="Open Door"></div>
        </div>
      </div>
    </div>
    <p class="sb-count mono" id="sbCount"></p>
  </div></section>

  <!-- 06 batching -->
  <section class="sec inksec"><div class="wrap">
    <div class="shead"><span class="sidx">06</span><span class="slbl">Batching</span><span class="srule"></span><span class="stag">Atomic state flush</span></div>
    <div class="sec-top">
      <h2 class="display">One frame.<br><span class="si">one state batch.</span></h2>
      <p class="lead">State updates accumulate while the frame runs, then flush as a single atomic batch. Dirty a few fields, flush the frame — and compare against the naive model of one dispatch per property.</p>
    </div>
    <div class="bt rv">
      <div class="bt-col"><h5>Dirty during frame</h5>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="tbtn" data-dirty="PlayerHealth">PlayerHealth · 80</button>
          <button class="tbtn" data-dirty="Ammo">Ammo · 25</button>
          <button class="tbtn" data-dirty="Shield">Shield · 50</button>
          <button class="tbtn" data-dirty="CurrentSpread">CurrentSpread · 0.42</button>
        </div>
        <div style="margin-top:auto;padding-top:14px"><button class="tbtn pri" id="btFlush" style="width:100%;justify-content:center">Flush frame</button></div>
      </div>
      <div class="bt-col"><h5>Pending dirty state</h5><div id="btChips" class="dim mono" style="font-size:11px">— nothing dirty —</div>
        <div class="bt-stats"><span>naive dispatches: <b id="btNaive">0</b></span></div>
      </div>
      <div class="bt-col"><h5>One batch → documents</h5>
        <div class="bt-json" id="btJson">{}</div>
        <div class="bt-fw"><span>React</span><span>Vue</span><span>Svelte</span><span>Vanilla</span></div>
        <div class="bt-stats"><span>SWUI: <b id="btSwui">0</b> dispatch</span><span>1 eval / document</span></div>
        <button class="tbtn" id="btReset" style="margin-top:10px">Reset</button>
      </div>
    </div>
  </div></section>

  <!-- 07 pacing -->
  <section class="sec paper"><div class="wrap">
    <div class="shead"><span class="sidx">07</span><span class="slbl">Frame pacing</span><span class="srule"></span><span class="stag">External begin frames</span></div>
    <div class="sec-top">
      <h2 class="display">One game clock.<br><span class="si">one UI frame.</span></h2>
      <p class="lead">Through external begin frames, Unreal drives Chromium's frame production instead of letting browser rendering free-run. The scope below shows both behaviors — lockstep, and free-running drift.</p>
    </div>
    <div class="plate rv"><div class="plate-h"><span class="sq"></span>Frame chain<span class="sp"></span>ENGINE → BROWSER</div>
      <div class="plate-b">
        <div class="flow" style="margin-bottom:18px" id="fpChain">
          <div class="fnode"><b>Unreal</b><span>frame clock</span></div><div class="fwire"></div>
          <div class="fnode"><b>SWUI</b><span>scheduler</span></div><div class="fwire"></div>
          <div class="fnode"><b>CEF</b><span>begin frame</span></div><div class="fwire"></div>
          <div class="fnode"><b>Chromium</b><span>composite</span></div><div class="fwire"></div>
          <div class="fnode"><b>UI frame</b><span>presented</span></div>
        </div>
        <div class="scope"><canvas id="fpCv" height="130" style="width:100%;display:block"></canvas></div>
        <div class="fp-ctrl">
          <button class="tbtn on" data-fps="60">Lockstep 60</button>
          <button class="tbtn" data-fps="120">Lockstep 120</button>
          <button class="tbtn" data-fps="free">Free-running</button>
          <span class="fp-count" id="fpCount"></span>
        </div>
        <p class="dim mono" style="font-size:10px;margin-top:10px">Frame rates shown as configurable targets — not guaranteed performance.</p>
      </div>
    </div>
  </div></section>

  <!-- 08 rendering -->
  <section class="sec inksec"><div class="wrap">
    <div class="shead"><span class="sidx">08</span><span class="slbl">Rendering</span><span class="srule"></span><span class="stag">GPU / CPU paths</span></div>
    <div class="sec-top">
      <h2 class="display">Keep the pixels<br><span class="si">on the GPU.</span></h2>
      <p class="lead">Chromium renders to an off-screen surface. On the primary accelerated path, a shared GPU resource — Direct3D 11 / DXGI shared textures — lets Unreal consume the rendered texture without staging the entire frame through CPU memory.</p>
    </div>
    <div class="lc-grid rv">
      <div class="plate"><div class="plate-h"><span class="sq"></span><span id="rpTitle">GPU shared texture path</span><span class="sp"></span>
        <button class="tbtn on" data-rp="gpu">GPU accelerated</button><button class="tbtn" data-rp="cpu">CPU compatible</button></div>
        <div class="plate-b" style="min-height:220px;display:flex;align-items:center">
          <div class="flow" style="width:100%" id="rpGpu">
            <div class="fnode"><b>CEF / Chromium</b><span>off-screen render</span></div><div class="fwire"></div>
            <div class="fnode acc2"><b>GPU shared texture</b><span>D3D11 · DXGI</span></div><div class="fwire"></div>
            <div class="fnode"><b>Unreal RHI</b><span>texture import</span></div><div class="fwire"></div>
            <div class="fnode"><b>Slate / UI</b><span>presented</span></div>
          </div>
          <div class="flow" style="width:100%" id="rpCpu" hidden>
            <div class="fnode" style="opacity:.6"><b>Chromium</b><span>software render</span></div><div class="fwire"></div>
            <div class="fnode" style="opacity:.6"><b>BGRA buffer</b><span>system memory</span></div><div class="fwire"></div>
            <div class="fnode" style="opacity:.6"><b>Double buffer</b><span>copy + swap</span></div><div class="fwire"></div>
            <div class="fnode" style="opacity:.6"><b>RHI update</b><span>full-surface upload</span></div>
          </div>
        </div>
      </div>
      <div class="lc-desc"><h4 id="rpTag">GPU SHARED TEXTURE PATH</h4><p id="rpNote"></p></div>
    </div>
  </div></section>

  <!-- 09 ROI -->
  <section class="sec paper"><div class="wrap">
    <div class="shead"><span class="sidx">09</span><span class="slbl">Region of interest</span><span class="srule"></span><span class="stag">Partial blit</span></div>
    <div class="sec-top">
      <h2 class="display">Don't repaint<br><span class="si">what didn't change.</span></h2>
      <p class="lead">A HUD is mostly transparent stillness. SWUI's region-of-interest rendering tracks which rectangles actually changed and blits only those. Toggle the mode and simulate an update.</p>
    </div>
    <div class="plate rv" style="max-width:940px"><div class="plate-h"><span class="sq"></span>Hud surface — 1920×1080 concept<span class="sp"></span>
      <button class="tbtn on" data-roi="full">Full surface</button><button class="tbtn" data-roi="roi">ROI</button><button class="tbtn" id="roiSim">Simulate update</button></div>
      <div class="plate-b">
        <div class="roi-wrap" id="roiPanel" style="aspect-ratio:16/9">
          <div class="roi-static" id="roiStatic"><span class="tagc">unchanged · no repaint</span></div>
          <div class="roi-flash" id="roiFlash"></div>
          <div class="hudel" style="left:22px;top:20px" data-roi-el="health"><div class="htag">Vitals</div><div class="hnum"><b id="roiHp">84</b> / 100</div><div class="bar" style="width:128px"><i id="roiHpB" style="width:84%"></i></div></div>
          <div class="hudel" style="left:50%;top:50%;transform:translate(-50%,-50%)" data-static><div id="roiXh" style="position:relative;width:0;height:0"></div></div>
          <div class="hudel hud-obj" style="top:20px" data-static><div class="htag">Objective</div><div class="o">Hold the perimeter</div><div class="c">2 / 4</div></div>
          <div class="hudel hud-ammo" style="right:22px;bottom:18px" data-roi-el="ammo"><div class="big"><span id="roiAmmo">24</span><span> | 180</span></div></div>
          <div class="hudel" style="left:22px;bottom:16px" data-roi-el="minimap"><canvas id="roiRadar" width="84" height="84"></canvas></div>
          <div class="hudel" style="left:50%;top:18px;transform:translateX(-50%)" data-roi-el="notif"><span class="chip" id="roiNotif" style="color:#B9BABF;border-color:rgba(239,238,232,.3)">shield restored</span></div>
        </div>
        <p class="mono dim" id="roiStat" style="font-size:10.5px;margin-top:14px"></p>
      </div>
    </div>
  </div></section>

  <!-- 10 sleep -->
  <section class="sec inksec"><div class="wrap">
    <div class="shead"><span class="sidx">10</span><span class="slbl">Sleep</span><span class="srule"></span><span class="stag">WasHidden lifecycle</span></div>
    <div class="sec-top">
      <h2 class="display">Hidden should<br><span class="si">mean idle.</span></h2>
      <p class="lead">SWUI uses Chromium's <span class="mono acc" style="font-size:13px">WasHidden</span> behavior to genuinely suspend documents that aren't on screen. Hide the inventory below — the frame counter is real, and it freezes.</p>
    </div>
    <div class="sl-grid rv" id="slGrid">
      <div class="plate"><div class="plate-h"><span class="sq"></span>inventory.html · MODAL · Z-100<span class="sp"></span>
        <button class="tbtn on" id="slVis">Visible</button><button class="tbtn" id="slHid">Hidden</button></div>
        <div class="sl-doc">
          <div class="sl-inner"><div class="fh">inventory.html — compositor active</div>
            <div class="bodyc"><div class="sl-spin"></div>
              <div class="sl-lines">
                <div><span>compositor frames</span><b id="slFrames">0</b></div>
                <div><span>uptime</span><b id="slTime">0.0 s</b></div>
                <div><span>document state</span><b class="ok">ACTIVE</b></div>
              </div>
            </div>
          </div>
          <div class="sl-hidden"><div class="sl-hidbox">
            <svg width="22" height="22" style="color:var(--mut)"><use href="#i-doc"/></svg>
            <span class="t">Document hidden — WasHidden(true)</span>
            <div class="sl-lines">
              <div><span>requestAnimationFrame</span><b class="off">paused</b></div>
              <div><span>timers</span><b class="off">paused</b></div>
              <div><span>compositing</span><b class="off">paused</b></div>
            </div>
          </div></div>
        </div>
      </div>
      <div class="lc-desc"><h4>WHY IT MATTERS</h4>
        <p>Sleeping is especially useful for <b>closed inventories</b>, <b>inactive menus</b>, <b>hidden screens</b> and <b>unused overlays</b>. No rendering work, no timer churn — the document resumes exactly where it left off on wake.</p>
        <div class="api-strip"><span class="chip">closed inventory</span><span class="chip">inactive menus</span><span class="chip">hidden screens</span><span class="chip">unused overlays</span></div>
      </div>
    </div>
  </div></section>

  <!-- 11 input -->
  <section class="sec paper"><div class="wrap">
    <div class="shead"><span class="sidx">11</span><span class="slbl">Input</span><span class="srule"></span><span class="stag">Hit testing · navigation</span></div>
    <div class="sec-top">
      <h2 class="display">Multiple documents.<br><span class="si">one input surface.</span></h2>
      <p class="lead">Move your pointer across the viewport. SWUI hit-tests every event: which documents are visible, which are interactive, which contains the pointer, and which has the highest Z-order. If none accepts it, input falls through to gameplay.</p>
    </div>
    <div class="rp-grid rv" id="irGrid">
      <div class="ir-view" id="irView">
        <div class="ir-doc" data-z="10" data-interactive="0" style="inset:12px;border-style:dashed"><div class="fh"><span>hud.html</span><span>Z-10 · non-interactive</span></div></div>
        <div class="ir-doc" data-z="40" data-interactive="1" style="left:6%;bottom:8%;width:34%;height:42%"><div class="fh"><span>chat.html</span><span>Z-40 · interactive</span></div></div>
        <div class="ir-doc" data-z="100" data-interactive="1" style="left:38%;top:16%;width:52%;height:62%"><div class="fh"><span>inventory.html</span><span>Z-100 · interactive</span></div></div>
      </div>
      <div>
        <div class="ir-trace" id="irTrace" aria-live="polite"></div>
        <div class="flow" style="margin-top:16px;transform:scale(.88);transform-origin:left">
          <div class="fnode"><b>HTML input</b></div><div class="fwire"></div><div class="fnode"><b>Focus</b></div><div class="fwire"></div><div class="fnode"><b>SWUI</b></div><div class="fwire"></div><div class="fnode"><b>Slate</b><span>preprocessor</span></div><div class="fwire"></div><div class="fnode"><b>CEF</b></div>
        </div>
        <p class="dim mono" style="font-size:10px;margin-top:10px">Keyboard / text routing — printable characters, modifiers, text fields, IME-aware architecture. Details under <a href="#/architecture" class="acc">Architecture</a>.</p>
      </div>
    </div>
    <div class="gm-grid rv" style="margin-top:44px">
      <div style="display:flex;gap:22px;flex-wrap:wrap;align-items:flex-start">
        <div class="gm-menu" id="gmMenu" tabindex="0" aria-label="Gamepad-navigable menu. Use arrow keys, Enter and Escape.">
          <div class="htag" style="padding:6px 14px 2px">pause.html · Z-200</div>
          <div class="gm-item">Resume<span class="mono" style="font-size:10px;color:var(--mut)">enter</span><i class="hm"></i></div>
          <div class="gm-item">Loadout<span class="mono" style="font-size:10px;color:var(--mut)">enter</span><i class="hm"></i></div>
          <div class="gm-item">Settings<span class="mono" style="font-size:10px;color:var(--mut)">enter</span><i class="hm"></i></div>
          <div class="gm-item">Quit<span class="mono" style="font-size:10px;color:var(--mut)">enter</span><i class="hm"></i></div>
        </div>
        <p class="lead" style="font-size:13px;max-width:36ch">Focus the menu and use arrow keys — or the pad. The SDK exposes navigation as first-class concepts: <b>navigate, confirm, cancel, next tab, previous tab</b>.</p>
      </div>
      <div>
        <div class="gm-pad" aria-label="Gamepad controls">
          <span></span><button data-gm="up" aria-label="Up"><svg><use href="#i-up"/></svg></button><span></span>
          <button data-gm="left" aria-label="Left" style="transform:rotate(-90deg)"><svg><use href="#i-up"/></svg></button><button data-gm="confirm" aria-label="Confirm" style="color:var(--acc);border-color:var(--acc)"><svg><use href="#i-check"/></svg></button><button data-gm="right" aria-label="Right" style="transform:rotate(90deg)"><svg><use href="#i-up"/></svg></button>
          <span></span><button data-gm="down" aria-label="Down" style="transform:rotate(180deg)"><svg><use href="#i-up"/></svg></button><button data-gm="cancel" aria-label="Cancel" style="color:#D96A5A;border-color:rgba(217,106,90,.5)"><svg><use href="#i-x"/></svg></button><span></span>
        </div>
        <div class="gm-log mono" id="gmLog" style="margin-top:16px"></div>
      </div>
    </div>
  </div></section>

  <!-- 12 events -->
  <section class="sec paper"><div class="wrap">
    <div class="shead"><span class="sidx">12</span><span class="slbl">Events</span><span class="srule"></span><span class="stag">GameplayTags</span></div>
    <div class="sec-top">
      <h2 class="display">Let the UI<br><span class="si">speak Unreal.</span></h2>
      <p class="lead">Web documents emit structured messages that arrive in Unreal as GameplayTag events. Click USE and follow the payload across the seam.</p>
    </div>
    <div class="tf rv">
      <div class="plate"><div class="plate-h"><span class="sq"></span>inventory.html — web document</div>
        <div class="plate-b">
          <div class="inv-item">
            <div class="inv-ic"><svg><use href="#i-zap"/></svg></div>
            <div style="flex:1"><div class="nm">Health Potion</div><div class="ct" id="tfCount">×3 remaining</div></div>
            <button class="tbtn pri" id="tfUse">Use</button>
          </div>
          <div class="api-strip" style="margin-top:14px"><span class="chip">swui.events.emit</span><span class="chip">structured payload</span><span class="chip">json</span></div>
        </div>
      </div>
      <div class="tf-mid">
        <div style="position:absolute;left:50%;top:0;bottom:0;width:2px;background:var(--blaze);transform:translateX(-50%)"></div>
        <span class="tf-step" style="position:absolute;top:0;background:var(--paper);padding:2px 0">button</span>
        <span class="tf-step acc" style="position:absolute;top:33%;background:var(--paper)">swui event</span>
        <span class="tf-step" style="position:absolute;top:66%;background:var(--paper)">GameplayTag</span>
        <span class="tf-step" style="position:absolute;bottom:0;background:var(--paper)">unreal</span>
      </div>
      <div class="plate" style="background:var(--ink);color:var(--bone);--fg:var(--bone);--mut:#8A8C95;--ln:rgba(239,238,232,.2);--ln2:rgba(239,238,232,.08);--card:#17181D;--card2:#1E2027;--acc:#FF6B33;--ed:var(--bone);--edt:var(--ink)">
        <div class="plate-h"><span class="sq"></span>Unreal — event handler</div>
        <div class="plate-b">
          <div class="tf-pkt" id="tfPkt"><span class="tg">UI.Inventory.UseItem</span>
{
  "itemId": "health_potion",
  "slot": 2
}</div>
          <div class="tf-acts" id="tfActs" style="margin-top:12px">
            <div>→ GameplayTag received</div><div>→ RemoveItem(slot 2)</div><div>→ ApplyHeal(+140)</div><div>→ Publish PlayerHealth</div>
          </div>
        </div>
      </div>
    </div>
    <div class="api-strip rv"><span class="chip">events.on</span><span class="chip">events.emit</span><span class="chip">events.emitNavigation</span><span class="chip">navigation.onNavigate</span><span class="chip">navigation.onConfirm</span><span class="chip">navigation.onCancel</span><span class="chip">navigation.onNextTab</span><span class="chip">navigation.onPreviousTab</span></div>
    <p class="lead rv" style="margin-top:24px;font-size:13.5px">And in the other direction — reflected Unreal events such as <span class="mono" style="color:var(--fg)">Weapon.OnPlayerFiredShot</span> arrive in the document as typed subscriptions. See it live in the <a href="#@crosshair" class="acc">crosshair demo</a>.</p>
  </div></section>

  <!-- 13 blueprint -->
  <section class="sec inksec"><div class="wrap">
    <div class="shead"><span class="sidx">13</span><span class="slbl">Blueprint</span><span class="srule"></span><span class="stag">Graph codegen</span></div>
    <div class="sec-top">
      <h2 class="display">The Blueprint graph<br><span class="si">can be the source of truth.</span></h2>
      <p class="lead">Create the interface, select an HTML entry, load and activate documents, bind reflected state and events — then generate the frontend contract straight from the graph. <b>SwuiObserve</b> nodes declare what the UI can see; SWUI derives the TypeScript bindings from them. No separate manual class configuration for the documented workflow.</p>
    </div>
    <div class="plate rv"><div class="plate-h"><span class="sq"></span>Player controller — event graph<span class="sp"></span><button class="tbtn pri" id="bpRun"><svg><use href="#i-play"/></svg> Run graph</button></div>
      <div class="plate-b" style="overflow-x:auto"><div class="bp-in" id="bpIn"><svg id="bpSvg"></svg></div></div>
      <div class="plate-b" style="border-top:1px solid var(--ln2);padding-top:14px">
        <div class="flow">
          <div class="fnode"><b>Blueprint graph</b></div><div class="fwire"></div>
          <div class="fnode"><b>Reflection</b><span>SwuiObserve</span></div><div class="fwire"></div>
          <div class="fnode"><b>Refresh JS bindings</b></div><div class="fwire"></div>
          <div class="fnode acc2"><b>bindings.gen.ts</b><span>generated contract</span></div><div class="fwire"></div>
          <div class="fnode"><b>Frontend</b><span>autocomplete</span></div>
        </div>
        <p class="dim mono" style="font-size:10px;margin-top:14px">Schematic representation of the workflow — not an engine screenshot.</p>
      </div>
    </div>
  </div></section>

  <!-- 14 typescript -->
  <section class="sec paper"><div class="wrap">
    <div class="shead"><span class="sidx">14</span><span class="slbl">Codegen</span><span class="srule"></span><span class="stag">Reflection → types</span></div>
    <div class="sec-top">
      <h2 class="display">From Unreal reflection<br><span class="si">to frontend types.</span></h2>
      <p class="lead">Unreal defines the contract. The web UI consumes the contract. State fields, event names, payloads, namespaces and value types become generated TypeScript — try the editor below.</p>
    </div>
    <div class="ts-grid rv">
      <div class="plate" style="align-self:start">
        <div class="plate-h"><span class="sq"></span>Observed in Blueprint</div>
        <div id="tsObs"></div>
      </div>
      <div>
        <div id="tsGen"></div>
        <div id="tsEd"></div>
        <div class="api-strip" id="tsQuick" style="margin-top:14px">
          <button class="tbtn" data-q="swui.state.">swui.state.</button>
          <button class="tbtn" data-q="swui.events.on('">swui.events.on('</button>
          <button class="tbtn" data-q="swui.get('">swui.get('</button>
        </div>
        <div class="ts-hint" id="tsHint"><svg width="13" height="13"><use href="#i-check"/></svg><span id="tsHintT"></span></div>
      </div>
    </div>
  </div></section>

  <!-- 15 frameworks -->
  <section class="sec inksec"><div class="wrap">
    <div class="shead"><span class="sidx">15</span><span class="slbl">Frameworks</span><span class="srule"></span><span class="stag">Optional, all of them</span></div>
    <div class="sec-top">
      <h2 class="display">Your framework.<br><span class="si">your choice.</span></h2>
      <p class="lead">SWUI does not force a frontend framework. Ship a single HTML file with no Node tooling at all — or bring React, Vue, Svelte and modern build tooling. The state and event contract stays identical across all of them.</p>
    </div>
    <div class="plate rv" style="max-width:940px">
      <div style="display:flex;gap:2px;border-bottom:1px solid var(--ln2);padding:8px 10px 0;flex-wrap:wrap" id="fwTabs" role="tablist">
        <button class="tbtn on" data-fw="react" role="tab">React</button>
        <button class="tbtn" data-fw="vue" role="tab">Vue</button>
        <button class="tbtn" data-fw="svelte" role="tab">Svelte</button>
        <button class="tbtn" data-fw="vanilla" role="tab">Vanilla</button>
      </div>
      <div class="plate-b"><div id="fwCode"></div>
        <div class="api-strip"><span class="chip">same state contract</span><span class="chip">same events</span><span class="chip">same GameplayTags</span><span class="chip">no framework required</span></div>
        <div class="flow" style="margin-top:20px;flex-wrap:wrap;gap:8px">
          <div class="fnode"><b>Source</b><span>tsx / vue / svelte</span></div><div class="fwire"></div>
          <div class="fnode"><b>Vite</b><span>dev · hmr</span></div><div class="fwire"></div>
          <div class="fnode"><b>swui build --production</b></div><div class="fwire"></div>
          <div class="fnode"><b>Static assets</b><span>dist/</span></div><div class="fwire"></div>
          <div class="fnode"><b>Unreal Content</b><span>packaged game</span></div>
        </div>
      </div>
    </div>
  </div></section>

  <!-- 16 preview removed to eliminate redundant interactive window -->

  <!-- 17 crosshair -->
  <section class="sec inksec" id="crosshair"><div class="wrap">
    <div class="shead"><span class="sidx">17</span><span class="slbl">Flagship example</span><span class="srule"></span><span class="stag">Live — state · events · springs</span></div>
    <div class="sec-top">
      <h2 class="display">From gameplay state<br><span class="si">to a living crosshair.</span></h2>
      <p class="lead">Everything on this page, combined. Unreal state flows through the bus into the document; events fire back. The recoil settle is a real spring — the same <span class="mono acc" style="font-size:13px">swui.animation.damp</span> the SDK provides. Click the viewport to fire.</p>
    </div>
    <div class="cx rv">
      <div>
        <div class="cx-view" id="cxView" tabindex="0" aria-label="Crosshair demo viewport. Click to fire, press R to reload.">
          <div class="floor"></div>
          <div style="position:absolute;inset:0" id="cxXh"></div>
          <div class="hudel" style="left:22px;top:20px"><div class="htag">Vitals</div><div class="hnum"><b id="cxHp">85</b> / 100</div><div class="bar" style="width:128px"><i id="cxHpB" style="width:85%"></i></div></div>
          <div class="hudel hud-ammo"><div class="rl" id="cxRl"></div><div class="big"><span id="cxAmmo">24</span><span> | 180</span></div></div>
          <div class="hudel" style="left:50%;bottom:14%;transform:translateX(-50%)"><span class="chip" id="cxPrompt" style="color:var(--bone);border-color:rgba(239,238,232,.35)">[E] Open Door</span></div>
        </div>
        <div class="cx-state" id="cxState"></div>
        <div class="cx-log" id="cxLog" aria-live="polite"></div>
      </div>
      <div class="plate cx-side">
        <div class="plate-h"><span class="sq"></span>Details — SWUI bindings</div>
        <div class="plate-b">
          <div class="frow"><label for="cxSp">CurrentSpread</label><input type="range" id="cxSp" min="0" max="100" value="30"></div>
          <div class="frow"><label for="cxAm">CurrentAmmo</label><input type="number" id="cxAm" value="24"></div>
          <div class="frow"><label for="cxCm">CrosshairMode</label><select id="cxCm"><option>PRECISE</option><option selected>EXPANDED</option><option>SNIPER</option></select></div>
          <div class="frow"><label>bCanInteract</label><label class="cbx"><input type="checkbox" id="cxCi" checked><i></i> show prompt</label></div>
          <div class="frow"><label for="cxPr">Prompt</label><input type="text" id="cxPr" value="Open Door"></div>
          <div class="frow"><label>Simulate movement</label><label class="cbx"><input type="checkbox" id="cxSim"><i></i> wandering spread</label></div>
          <div style="display:flex;gap:8px;margin-top:16px">
            <button class="tbtn pri" id="cxFire" style="flex:1;justify-content:center">Fire</button>
            <button class="tbtn" id="cxHit" style="flex:1;justify-content:center">Hit confirmed</button>
          </div>
        </div>
      </div>
    </div>
  </div></section>

  <!-- 18 go deeper -->
  <section class="sec paper"><div class="wrap">
    <div class="shead"><span class="sidx">18</span><span class="slbl">Go deeper</span><span class="srule"></span><span class="stag">Three doors</span></div>
    <div class="rv">
      <a class="deep" href="#/architecture"><span class="di">i.</span><div><h3>Architecture</h3><p>Five layers from your frontend through embedded Chromium, the SWUI runtime and its documents, into Slate, RHI and gameplay — every subsystem inspectable.</p></div><svg><use href="#i-arr"/></svg></a>
      <a class="deep" href="#/profiling"><span class="di">ii.</span><div><h3>Performance</h3><p>GPU shared textures, external begin frames, Chromium sleep, ROI and the CEF message-loop budget — with an engine-style scope and console commands.</p></div><svg><use href="#i-arr"/></svg></a>
      <a class="deep" href="#/sdk"><span class="di">iii.</span><div><h3>The SDK</h3><p>A framework-agnostic core — state, events, navigation, timeline, animation — plus React, Vue and Svelte integrations, a CLI, live telemetry and a spring laboratory.</p></div><svg><use href="#i-arr"/></svg></a>
    </div>
  </div></section>

  <!-- 19 docs cta -->
  <section class="sec inksec"><div class="wrap">
    <div class="shead"><span class="sidx">19</span><span class="slbl">Documentation</span><span class="srule"></span><span class="stag">Press / to search</span></div>
    <div class="rp-grid">
      <div>
        <h2 class="display">Docs that read<br><span class="si">like a runtime.</span></h2>
        <p class="lead" style="margin-top:24px">From a five-minute vanilla HUD to frame pacing internals. Press <span class="kbd">/</span> anywhere on this site to search.</p>
        <a class="btn" href="#/docs/getting-started" style="margin-top:28px">Get started <svg><use href="#i-arr"/></svg></a>
      </div>
      <div id="docsCta"></div>
    </div>
  </div></section>

  <!-- 20 final -->
  <section class="final inksec"><div class="final-g">
    <div class="f-ink">
      <div class="ghost" style="left:8%;top:20%;width:170px;height:112px" aria-hidden="true"></div>
      <div class="ghost" style="left:16%;bottom:16%;width:120px;height:80px" aria-hidden="true"></div>
      <h2>Your next<br>HUD</h2>
    </div>
    <div class="seam" id="finalSeam" aria-hidden="true"><span class="seam-tag">SWUI Runtime</span></div>
    <div class="f-paper gridbg">
      <div class="ghost" style="right:10%;top:16%;width:150px;height:100px;border-color:rgba(16,17,20,.16)" aria-hidden="true"></div>
      <p class="si">can start in HTML.</p>
      <p class="lead" style="margin-top:22px">Build the visual layer with the tools you already know. Let Unreal handle the game.</p>
      <div class="h-cta" style="margin-top:30px">
        <a class="btn" href="#/docs/getting-started">Get Started <svg><use href="#i-arr"/></svg></a>
        <a class="btn-g" href="https://github.com/AchiraStudio/SWUI" target="_blank" rel="noopener"><svg><use href="#i-gh"/></svg> View on GitHub</a>
      </div>
    </div>
  </div></section>
</div>

<!-- ================================================= PRODUCT ================================================= -->` }}
    />
  )
}
