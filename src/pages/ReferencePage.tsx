// @ts-nocheck
import React, { useEffect, useRef } from 'react'
import { $, $$, RM, clamp, damp, el, loop, codeFig, makeCrosshair, hl, toast, copyText, observeReveal } from '../utils/engine'

interface PageProps {
  hidden?: boolean
}

export const ReferencePage: React.FC<PageProps> = ({ hidden }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const initedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || initedRef.current || hidden) return
    initedRef.current = true

    function initRef(){
  const R=[
    ['CORE','swui.state.get','Read a state field.',"swui.state.get('Weapon.CurrentAmmo')"],
    ['CORE','swui.state.getAll','Read the full published state.','const s = swui.state.getAll()'],
    ['CORE','swui.state.subscribe','Subscribe to one field.',"swui.state.subscribe('Player.Health', render)"],
    ['CORE','swui.state.update','Propagate a state patch.',"swui.state.update({ 'UI.MenuVolume': 0.4 })"],
    ['CORE','swui.state.onBatch','Once-per-frame atomic batch handler.','swui.state.onBatch(b => frame(b.version))'],
    ['CORE','swui.state.onTick','Runtime tick on engine time.','swui.state.onTick(({ dt }) => step(dt))'],
    ['CORE','swui.events.on','Subscribe to a reflected Unreal event.',"swui.events.on('Weapon.OnPlayerFiredShot', onFire)"],
    ['CORE','swui.events.emit','Emit a tag-routed event toward Unreal.',"swui.events.emit('UI.Inventory.UseItem', { slot: 2 })"],
    ['CORE','swui.events.emitNavigation','Emit a navigation action.',"swui.events.emitNavigation('nextTab')"],
    ['CORE','swui.navigation.onNavigate','Directional focus movement.','swui.navigation.onNavigate(d => focus.move(d))'],
    ['CORE','swui.navigation.onConfirm','Confirm on the focused element.','swui.navigation.onConfirm(fire)'],
    ['CORE','swui.navigation.onCancel','Cancel / back.','swui.navigation.onCancel(close)'],
    ['CORE','swui.navigation.onNextTab','Advance one tab group.','swui.navigation.onNextTab(next)'],
    ['CORE','swui.navigation.onPreviousTab','Reverse one tab group.','swui.navigation.onPreviousTab(prev)'],
    ['CORE','swui.input.focus','Acquire the keyboard/text context.','swui.input.focus()'],
    ['CORE','swui.input.release','Return input to gameplay.','swui.input.release()'],
    ['CORE','swui.lifecycle.onActivate','Document mounted.','swui.lifecycle.onActivate(enter)'],
    ['CORE','swui.lifecycle.onSleep','WasHidden suspend.','swui.lifecycle.onSleep(pauseAll)'],
    ['CORE','swui.timeline.begin','Start a game-time timeline.','t = swui.timeline.begin({ duration: 3 })'],
    ['CORE','swui.timeline.cancel','Cancel — records cancelProgress.','t.cancel()'],
    ['CORE','swui.animation.createSpring','Spring with stiffness · damping · mass.','const s = swui.animation.createSpring({ stiffness: 170, damping: 26 })'],
    ['CORE','swui.animation.damp','Frame-rate independent approach.','v = swui.animation.damp(v, target, 8, dt)'],
    ['CORE','swui.animation.lerp','Linear interpolation.','x = swui.animation.lerp(a, b, t)'],
    ['CORE','swui.animation.interpolate','Map a value across a range.','p = swui.animation.interpolate(v, [0, 1], [0, 100])'],
    ['CORE','swui.on','Compatibility shortcut — field listener.',"swui.on('Player.Health', render)"],
    ['CORE','swui.get','Compatibility shortcut — read.',"swui.get('Ammo')"],
    ['CORE','swui.onBatch','Compatibility shortcut — batch.','swui.onBatch(fn)'],
    ['CORE','swui.onTick','Compatibility shortcut — tick.','swui.onTick(fn)'],
    ['REACT','useSwuiState','Subscribe state into component state.',"const hp = useSwuiState<number>('Player.Health', 100)"],
    ['REACT','useSwuiEvent','Subscribe an event.',"const reload = useSwuiEvent('Weapon.Reload')"],
    ['REACT','useSwuiNavigation','Bind navigation handlers.','useSwuiNavigation({ onConfirm: fire })'],
    ['REACT','useSwuiTimeline','React to a game-time timeline.','const t = useSwuiTimeline(3)'],
    ['VUE','useSwuiState','Composition API state binding.',"const health = useSwuiState('Player.Health', 100)"],
    ['VUE','useSwuiEvent','Composition API event binding.',"const reload = useSwuiEvent('Weapon.Reload')"],
    ['SVELTE','swuiState','Runtime-backed Svelte store.',"const spread = swuiState('Weapon.CurrentSpread', 0.3)"],
    ['SVELTE','swuiEvent','Runtime-backed event store.',"const fired = swuiEvent('Weapon.OnPlayerFiredShot')"],
    ['CLI','swui build','Build the web application.','$ swui build'],
    ['CLI','swui build --production','Production assets into Unreal Content.','$ swui build --production'],
    ['CLI','swui dev','Development workflow with live reload.','$ swui dev'],
  ];
  const render=f=>{
    const m=R.filter(r=>!f||r[1].toLowerCase().includes(f)||r[2].toLowerCase().includes(f)||r[0].toLowerCase().includes(f));
    $('#refList').innerHTML=m.length?m.map(r=>`<div class="ref-entry"><button class="ref-h"><span class="nm">${r[1]}</span><span class="pu">${r[2]}</span><span class="ct">${r[0]}</span><svg><use href="#i-chev"/></svg></button>
      <div class="ref-b"><div class="sig">${r[3].replace(/</g,'&lt;')}</div></div></div>`).join(''):'<p class="dim mono" style="font-size:12px">no results</p>';
    $$('.ref-entry',$('#refList')).forEach(x=>$('.ref-h',x).addEventListener('click',()=>x.classList.toggle('open')));
  };
  $('#refSearch').addEventListener('input',e=>render(e.target.value.toLowerCase()));
  render('');
}


    try {
      initRef()
    } catch (e) {
      console.error('Error in initRef:', e)
    }

    observeReveal(containerRef.current)
  }, [hidden])

  return (
    <div
      ref={containerRef}
      className="page paper"
      data-page="reference"
      hidden={hidden}
      dangerouslySetInnerHTML={{ __html: `
  <header class="pgh"><div class="wrap">
    <div class="eyebrow">Reference</div>
    <h1>Every surface,<br><em>on one page.</em></h1>
    <p class="lead">The documented SDK surface — core, framework integrations and CLI. Searchable, expandable, honest about scope.</p>
  </div></header>
  <section class="sec" style="border-top:0;padding-top:24px"><div class="wrap">
    <input type="text" id="refSearch" placeholder="Search API — try “subscribe”, “spring”, “useSwuiState”…" aria-label="Search reference" style="max-width:460px;margin-bottom:22px">
    <div id="refList"></div>
  </div></section>
</div>

<!-- ================================================= PROFILING ================================================= -->` }}
    />
  )
}
