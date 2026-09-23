// @ts-nocheck
import React, { useEffect, useRef } from 'react'
import { $, $$, clamp, damp, el, loop, codeFig, makeCrosshair, hl, toast, copyText, observeReveal } from '../utils/engine'
import { SNIP } from '../data/snippets'

interface PageProps {
  hidden?: boolean
}

export const SdkPage: React.FC<PageProps> = ({ hidden }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const initedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || initedRef.current || hidden) return
    initedRef.current = true

    function initSdk() {
      // ================= 01: API EXPLORER =================
      const API = {
        State: {
          desc: 'swui.state — Reflection-backed atomic state channel',
          methods: [
            ['get(tag)', 'Read the current value of a state field synchronously.', "const ammo = swui.state.get('Weapon.CurrentAmmo');"],
            ['getAll()', 'Read the complete published state snapshot.', 'const fullState = swui.state.getAll();'],
            ['subscribe(tag, callback)', 'Subscribe to single field mutations.', "const unsub = swui.state.subscribe('Player.Health', (hp) => updateHealthBar(hp));"],
            ['update(patch)', 'Propagate an atomic state patch toward Unreal.', "swui.state.update({ 'UI.MenuVolume': 0.8, 'UI.ColorblindMode': 'Protanopia' });"],
            ['onBatch(callback)', 'Fires once per engine frame with the whole batch.', "swui.state.onBatch(({ version, timestamp, fields }) => renderStats(version));"],
            ['onTick(callback)', 'Engine frame tick callback (respects game time dilation & pause).', "swui.state.onTick(({ dt, time, paused }) => { if (!paused) step(dt); });"],
            ['on(tag, callback)', 'Compatibility alias for swui.state.subscribe.', "swui.on('Weapon.CurrentSpread', (spread) => crosshair.set(spread));"],
          ]
        },
        Events: {
          desc: 'swui.events — Two-way event transport & delegate reflection',
          methods: [
            ['on(tag, callback)', 'Subscribe to a reflected UPROPERTY(BlueprintAssignable) delegate.', "swui.events.on('Weapon.OnPlayerFiredShot', ({ ammoRemaining, spread }) => kick(spread));"],
            ['emit(tag, payload)', 'Emit a tag-routed navigation command toward Unreal.', "swui.events.emit('UI.Inventory.UseItem', { itemId: 'medkit_01', slot: 2 });"],
            ['emitNavigation(action)', 'Emit built-in navigation actions (confirm, cancel, nextTab).', "swui.events.emitNavigation('confirm');"],
            ['emitNavigationEvent(tag, payload)', 'Typed navigation event dispatcher (JSON payload).', "swui.events.emitNavigationEvent('onev.rooms.host', { RoomName: 'Arena', bPublic: true });"],
          ]
        },
        Navigation: {
          desc: 'swui.navigation — Gamepad & keyboard spatial focus management',
          methods: [
            ['onNavigate(callback)', 'Directional focus movement handler (up, down, left, right).', "swui.navigation.onNavigate(direction => spatialGrid.moveFocus(direction));"],
            ['onConfirm(callback)', 'Confirm button triggered (A / Cross / Enter).', "swui.navigation.onConfirm(() => document.activeElement?.click());"],
            ['onCancel(callback)', 'Cancel / Back button triggered (B / Circle / Esc).', "swui.navigation.onCancel(() => handleMenuCancel());"],
            ['onNextTab(callback)', 'Next tab triggered (RB / R1 / Tab).', "swui.navigation.onNextTab(() => tabStrip.next());"],
            ['onPreviousTab(callback)', 'Previous tab triggered (LB / L1 / Shift+Tab).', "swui.navigation.onPreviousTab(() => tabStrip.prev());"],
          ]
        },
        Input: {
          desc: 'swui.input — Slate input preprocessor & editable field arbitration',
          methods: [
            ['focus()', 'Explicitly acquire Slate keyboard text routing context.', "swui.input.focus(); // Signals bTextInputFocused = true to CEF"],
            ['release()', 'Release keyboard focus and restore GameOnly input mode.', "swui.input.release(); // Restores gameplay controls"],
          ]
        },
        Lifecycle: {
          desc: 'swui.lifecycle — Viewport mount and Chromium sleep hooks',
          methods: [
            ['onActivate(callback)', 'Document attached to Unreal Slate viewport.', "swui.lifecycle.onActivate(() => enterAnimation.play());"],
            ['onDeactivate(callback)', 'Document removed or transitioning away.', "swui.lifecycle.onDeactivate(() => cleanupTransientState());"],
            ['onSleep(callback)', 'bEnableSleep triggered: CEF WasHidden() called (0% GPU/CPU).', "swui.lifecycle.onSleep(() => pauseHeavyVideoAndCanvases());"],
            ['onWake(callback)', 'Document restored from sleep state.', "swui.lifecycle.onWake(() => resumeRendering());"],
          ]
        },
        Timeline: {
          desc: 'swui.timeline — Game-time scaled animations & timers',
          methods: [
            ['begin({ duration })', 'Start a timeline synchronized with Unreal game time.', "const tl = swui.timeline.begin({ duration: 3.5 });"],
            ['cancel()', 'Cancel timeline and record cancelProgress.', "tl.cancel(); // Stores where animation was interrupted"],
            ['state', 'Current state: IDLE | RUNNING | COMPLETED | CANCELLED.', "if (tl.state === 'RUNNING') console.log('Playing');"],
          ]
        },
        Animation: {
          desc: 'swui.animation — Deterministic physics & easing utilities',
          methods: [
            ['createSpring(options)', 'Physics spring with stiffness, damping, and mass.', "const spring = swui.animation.createSpring({ stiffness: 180, damping: 24, mass: 1.0 });"],
            ['damp(current, target, lambda, dt)', 'Framerate-independent exponential smoothing.', "current = swui.animation.damp(current, target, 8.0, dt);"],
            ['lerp(a, b, t)', 'Standard linear interpolation.', "x = swui.animation.lerp(start, end, alpha);"],
            ['interpolate(val, inRange, outRange)', 'Map value across ranges with optional clamping.', "opacity = swui.animation.interpolate(health, [0, 100], [0, 1]);"],
          ]
        },
        Bridge: {
          desc: 'swui.bridge — Low-level CEF Query & C++ message transport',
          methods: [
            ['window.__SWUI__.send(json)', 'Direct CEF query transport bridge to USwuiView.', "window.__SWUI__.send(JSON.stringify({ type: 'navigation', tag: 'Action' }));"],
            ['cefQuery(options)', 'Native Chromium Embedded Framework query dispatcher.', "window.cefQuery({ request: payload, onSuccess: ... });"],
          ]
        }
      }

      const catsContainer = $('#apiCats')
      const detContainer = $('#apiDetail')
      const searchInput = $('#apiSearch')
      let activeCategory = 'State'

      const renderCategories = (filter: string) => {
        if (!catsContainer) return
        catsContainer.innerHTML = ''
        Object.entries(API).forEach(([k, v]) => {
          const matchCount = v.methods.filter(m => !filter || m[0].toLowerCase().includes(filter) || m[1].toLowerCase().includes(filter)).length
          if (filter && matchCount === 0) return

          const btn = el('button', `api-cat ${k === activeCategory ? 'on' : ''}`, `
            <span>${k}</span>
            <span class="cd">${v.methods.length}</span>
          `)
          btn.addEventListener('click', () => {
            activeCategory = k
            renderCategories(searchInput.value.toLowerCase())
            renderDetails()
          })
          catsContainer.appendChild(btn)
        })
      }

      const renderDetails = () => {
        if (!detContainer) return
        const filter = searchInput.value.toLowerCase()
        const cat = API[activeCategory]
        if (!cat) return

        const filteredMethods = cat.methods.filter(m => !filter || m[0].toLowerCase().includes(filter) || m[1].toLowerCase().includes(filter))

        detContainer.innerHTML = `
          <div class="mono dim" style="font-size:11px;letter-spacing:.12em;margin-bottom:14px;border-bottom:1px solid var(--ln2);padding-bottom:8px">
            // ${cat.desc}
          </div>
        ` + (filteredMethods.length ? filteredMethods.map(m => `
          <div class="ref-entry open" style="margin-bottom:10px">
            <button class="ref-h" style="padding:10px 14px">
              <span class="nm mono" style="font-weight:600;color:var(--acc)">${m[0]}</span>
              <span class="pu dim" style="font-size:12px">${m[1]}</span>
              <span class="ct mono" style="font-size:9.5px">${activeCategory}</span>
              <svg><use href="#i-chev"/></svg>
            </button>
            <div class="ref-b" style="padding:10px 14px;background:var(--card2)">
              <div class="sig mono" style="font-size:11px;color:var(--fg)">${m[2].replace(/</g, '&lt;')}</div>
            </div>
          </div>
        `).join('') : '<p class="dim mono" style="font-size:12px;padding:16px">No matching methods found in this category.</p>')

        $$('.ref-entry', detContainer).forEach(entry => {
          $('.ref-h', entry)?.addEventListener('click', () => entry.classList.toggle('open'))
        })
      }

      searchInput?.addEventListener('input', () => {
        renderCategories(searchInput.value.toLowerCase())
        renderDetails()
      })
      renderCategories('')
      renderDetails()

      // ================= 02: LIVE STATE PUBLISHER & SUBSCRIBERS =================
      const hpInput = $('#siHp')
      const amInput = $('#siAm')
      const shInput = $('#siSh')
      const spreadInput = $('#siSpread')
      const modeSelect = $('#siMode')

      const siHud = $('#siHud')
      const siDb = $('#siDb')
      let stateVersion = 100

      const updateStatePublisher = () => {
        stateVersion++
        const hp = parseInt(hpInput.value, 10)
        const ammo = parseInt(amInput.value, 10)
        const shield = parseInt(shInput.value, 10)
        const spread = parseFloat(spreadInput.value)
        const mode = modeSelect.value

        $('#siHpVal').textContent = hp + ' HP'
        $('#siAmVal').textContent = ammo + ' rounds'
        $('#siShVal').textContent = shield + ' Shield'
        $('#siSpreadVal').textContent = spread.toFixed(2)

        if (siHud) {
          siHud.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
              <span style="color:var(--ok);font-weight:600">HP: ${hp}/100</span>
              <div style="flex:1;height:8px;background:var(--ln2);border-radius:2px;overflow:hidden">
                <div style="width:${hp}%;height:100%;background:var(--ok)"></div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
              <span style="color:#569CD6;font-weight:600">SHIELD: ${shield}/100</span>
              <div style="flex:1;height:8px;background:var(--ln2);border-radius:2px;overflow:hidden">
                <div style="width:${shield}%;height:100%;background:#569CD6"></div>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px">
              <span>AMMO: <b style="color:var(--blaze)">${ammo}</b> / 180</span>
              <span class="chip on">${mode}</span>
            </div>
          `
        }

        if (siDb) {
          const snapshot = {
            'StateVersion': stateVersion,
            'Player.Health': hp,
            'Player.Shield': shield,
            'Weapon.CurrentAmmo': ammo,
            'Weapon.CurrentSpread': spread,
            'HUDState.CrosshairMode': mode,
          }
          siDb.textContent = JSON.stringify(snapshot, null, 2)
        }
      }

      ;[hpInput, amInput, shInput, spreadInput, modeSelect].forEach(inp => {
        inp?.addEventListener('input', updateStatePublisher)
      })
      updateStatePublisher()

      // ================= 03: TELEMETRY & GAME-TIME TIMELINE =================
      const Telemetry = {
        fps: 60,
        dt: 16.6,
        gameTime: 0,
        frameIndex: 0,
        stateVersion: 520,
        cefFps: 60,
        timeDilation: 1.0,
        isPaused: false,
      }
      const dtHistory: number[] = []

      const teleCells = [
        ['fps', () => Telemetry.fps.toFixed(0)],
        ['dt', () => Telemetry.dt.toFixed(1) + ' ms'],
        ['gameTime', () => Telemetry.gameTime.toFixed(1) + ' s'],
        ['frameIndex', () => Telemetry.frameIndex],
        ['stateVersion', () => stateVersion],
        ['cefFps', () => Math.min(Telemetry.fps, 60).toFixed(0)],
        ['timeDilation', () => Telemetry.timeDilation.toFixed(2) + 'x'],
        ['paused', () => Telemetry.isPaused ? 'true' : 'false'],
      ]

      const teleGrid = $('#teleGrid')
      if (teleGrid) {
        teleGrid.innerHTML = teleCells.map(c => `
          <div><b>${c[0]}</b><span id="tv-${c[0]}">${c[1]()}</span></div>
        `).join('')
      }

      const teleCv = $('#teleCv')
      const teleCtx = teleCv?.getContext('2d')
      const resizeTeleCv = () => {
        if (!teleCv) return
        teleCv.width = teleCv.clientWidth || 600
        teleCv.height = 100
      }
      resizeTeleCv()
      window.addEventListener('resize', resizeTeleCv)

      loop($('#teleGrid'), dt => {
        if (!Telemetry.isPaused) {
          Telemetry.gameTime += dt * Telemetry.timeDilation
          Telemetry.frameIndex++
        }
        Telemetry.dt = dt * 1000
        Telemetry.fps = damp(Telemetry.fps, 1 / dt, 3, dt)
        dtHistory.push(Telemetry.dt)
        if (dtHistory.length > 140) dtHistory.shift()

        teleCells.forEach(c => {
          const elNode = $('#tv-' + c[0])
          if (elNode) elNode.textContent = c[1]()
        })

        if (teleCtx && teleCv) {
          teleCtx.clearRect(0, 0, teleCv.width, teleCv.height)
          teleCtx.strokeStyle = 'rgba(16,17,20,.12)'
          teleCtx.beginPath()
          teleCtx.moveTo(0, teleCv.height / 2)
          teleCtx.lineTo(teleCv.width, teleCv.height / 2)
          teleCtx.stroke()

          teleCtx.strokeStyle = '#D63F00'
          teleCtx.lineWidth = 1.6
          teleCtx.beginPath()
          dtHistory.forEach((v, i) => {
            const x = (i / 140) * teleCv.width
            const y = clamp(v / 33, 0, 1) * (teleCv.height - 12) + 6
            if (i === 0) teleCtx.moveTo(x, y)
            else teleCtx.lineTo(x, y)
          })
          teleCtx.stroke()
        }
      })

      $$('[data-td]').forEach(btn => {
        btn.addEventListener('click', () => {
          $$('[data-td]').forEach(b => b.classList.remove('on'))
          btn.classList.add('on')
          Telemetry.timeDilation = parseFloat(btn.dataset.td || '1.0')
          toast(`Time Dilation: ${Telemetry.timeDilation}x`)
        })
      })

      const pauseBtn = $('#telePause')
      pauseBtn?.addEventListener('click', () => {
        Telemetry.isPaused = !Telemetry.isPaused
        pauseBtn.classList.toggle('on', Telemetry.isPaused)
        pauseBtn.textContent = Telemetry.isPaused ? 'Resume Game' : 'Pause Game'
        toast(Telemetry.isPaused ? 'Game Paused (Engine time stopped)' : 'Game Resumed')
      })

      // Interactive Timeline
      const TL = { status: 'IDLE', progress: 0, duration: 3.0, startTime: 0, cancelProgress: 0 }
      const tlCells = [
        ['state', () => TL.status],
        ['progress', () => TL.progress.toFixed(2)],
        ['duration', () => TL.duration.toFixed(1) + ' s'],
        ['cancelProgress', () => TL.cancelProgress > 0 && TL.status === 'CANCELLED' ? TL.cancelProgress.toFixed(2) : '—'],
      ]
      const teleTl = $('#teleTl')
      if (teleTl) {
        teleTl.innerHTML = tlCells.map(c => `<div><b>${c[0]}</b><span id="tl-${c[0]}">${c[1]()}</span></div>`).join('')
      }

      loop($('#teleTl').closest('.plate'), dt => {
        if (TL.status === 'RUNNING' && !Telemetry.isPaused) {
          TL.progress = Math.min(1.0, TL.progress + (dt * Telemetry.timeDilation) / TL.duration)
          if (TL.progress >= 1.0) TL.status = 'COMPLETED'
        }
        const bar = $('#tlBar')
        if (bar) bar.style.width = (TL.progress * 100) + '%'
        tlCells.forEach(c => {
          const node = $('#tl-' + c[0])
          if (node) node.textContent = c[1]()
        })
      })

      $('#tlPlay')?.addEventListener('click', () => {
        TL.status = 'RUNNING'
        TL.progress = 0
        TL.cancelProgress = 0
        TL.startTime = Telemetry.gameTime
        toast('swui.timeline.begin({ duration: 3.0 })')
      })
      $('#tlCancel')?.addEventListener('click', () => {
        if (TL.status === 'RUNNING') {
          TL.cancelProgress = TL.progress
          TL.status = 'CANCELLED'
          toast('swui.timeline.cancel()')
        }
      })

      // ================= 04: SPRING ANIMATION LAB =================
      const spring = { x: 60, targetX: 0, v: 0, stiffness: 180, damping: 24, mass: 1.0, trail: [], width: 600 }
      const spCv = $('#spCv')
      const spCtx = spCv?.getContext('2d')
      const resizeSpring = () => {
        if (!spCv) return
        spring.width = spCv.clientWidth
        spCv.width = spring.width
        spCv.height = 220
        if (!spring.targetX) spring.targetX = spring.width * 0.7
      }
      resizeSpring()
      window.addEventListener('resize', resizeSpring)

      spCv?.addEventListener('pointerdown', (e: PointerEvent) => {
        const rect = spCv.getBoundingClientRect()
        spring.targetX = clamp(e.clientX - rect.left, 20, spring.width - 20)
      })

      const stInp = $('#spSt')
      const daInp = $('#spD')
      const maInp = $('#spM')

      ;[stInp, daInp, maInp].forEach(slider => {
        slider?.addEventListener('input', () => {
          spring.stiffness = parseFloat(stInp.value)
          spring.damping = parseFloat(daInp.value)
          spring.mass = parseFloat(maInp.value) / 100
          $('#spStv').textContent = spring.stiffness
          $('#spDv').textContent = spring.damping
          $('#spMv').textContent = spring.mass.toFixed(1)
        })
      })

      loop(spCv, dt => {
        const force = -spring.stiffness * (spring.x - spring.targetX) - spring.damping * spring.v
        const accel = force / spring.mass
        spring.v += accel * dt
        spring.x += spring.v * dt

        spring.trail.push(spring.x)
        if (spring.trail.length > 70) spring.trail.shift()

        if (spCtx && spCv) {
          spCtx.clearRect(0, 0, spring.width, 220)

          // Target line
          spCtx.strokeStyle = 'rgba(16,17,20,.15)'
          spCtx.setLineDash([4, 4])
          spCtx.beginPath()
          spCtx.moveTo(spring.targetX, 20)
          spCtx.lineTo(spring.targetX, 200)
          spCtx.stroke()
          spCtx.setLineDash([])

          // Trail curve
          spCtx.strokeStyle = 'rgba(214,63,0,.5)'
          spCtx.lineWidth = 1.6
          spCtx.beginPath()
          spring.trail.forEach((pos, i) => {
            const y = 180 - (i / 70) * 140
            if (i === 0) spCtx.moveTo(pos, y)
            else spCtx.lineTo(pos, y)
          })
          spCtx.stroke()

          // Circle
          spCtx.fillStyle = '#101114'
          spCtx.beginPath()
          spCtx.arc(spring.x, 110, 8, 0, Math.PI * 2)
          spCtx.fill()

          spCtx.strokeStyle = '#D63F00'
          spCtx.lineWidth = 2.5
          spCtx.beginPath()
          spCtx.arc(spring.x, 110, 14, 0, Math.PI * 2)
          spCtx.stroke()
        }

        const spPos = $('#spPos')
        const spVel = $('#spVel')
        if (spPos) spPos.textContent = spring.x.toFixed(0) + ' px'
        if (spVel) spVel.textContent = spring.v.toFixed(0) + ' px/s'
      })

      // Insert code figures
      $('#spCode').innerHTML = codeFig('anim', 'crosshair_spring.ts', 'ts', 'l', false)
      $('#cfgCode').innerHTML = codeFig('config', 'swui.config.ts', 'ts', 'l')
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
      dangerouslySetInnerHTML={{
        __html: `
  <header class="pgh"><div class="wrap">
    <div class="eyebrow">SWUI 3.0 SDK Ecosystem</div>
    <h1>One Contract.<br><em>Every modern frontend.</em></h1>
    <p class="lead">A lean, zero-overhead TypeScript runtime. Framework-agnostic state subscriptions, tag-routed navigation events, game-time timelines, spring animation physics, and input focus arbitration — with first-party bindings for React, Vue, Svelte, and a dedicated CLI.</p>
    <div class="api-strip" style="margin-top:24px">
      <span class="chip on">@swui/core (2.8 kB)</span>
      <span class="chip">@swui/react (1.2 kB)</span>
      <span class="chip">@swui/vue (1.4 kB)</span>
      <span class="chip">@swui/svelte (0.9 kB)</span>
      <span class="chip">@swui/cli</span>
    </div>
  </div></header>

  <!-- ================= 01: ECOSYSTEM PACKAGES ================= -->
  <section class="sec" style="border-top:0"><div class="wrap">
    <div class="shead"><span class="sidx">01</span><span class="slbl">Ecosystem Packages</span><span class="srule"></span><span class="stag">One Graph</span></div>
    <div class="grid3 rv" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px">
      <div class="plate">
        <div class="plate-h"><span class="sq"></span>@swui/core<span class="sp"></span><span class="chip on">2.8 kB</span></div>
        <div class="plate-b">
          <p style="font-size:13px;line-height:1.6;margin-bottom:12px">Pure ESM runtime bridge. Powers state observation, navigation events, game-time animation springs, and CEF transport.</p>
          <div class="mono" style="font-size:11px;padding:6px 10px;background:var(--card2);border:1px solid var(--ln2)">npm i @swui/core</div>
        </div>
      </div>

      <div class="plate">
        <div class="plate-h"><span class="sq"></span>@swui/react<span class="sp"></span><span class="chip">1.2 kB</span></div>
        <div class="plate-b">
          <p style="font-size:13px;line-height:1.6;margin-bottom:12px">Idiomatic React hooks (<span class="mono">useSwuiState</span>, <span class="mono">useSwuiEvent</span>, <span class="mono">useSwuiTimeline</span>) with selective re-rendering.</p>
          <div class="mono" style="font-size:11px;padding:6px 10px;background:var(--card2);border:1px solid var(--ln2)">npm i @swui/react</div>
        </div>
      </div>

      <div class="plate">
        <div class="plate-h"><span class="sq"></span>@swui/cli<span class="sp"></span><span class="chip">Dev Tool</span></div>
        <div class="plate-b">
          <p style="font-size:13px;line-height:1.6;margin-bottom:12px">Build pipeline and development server with hot-module reload reflected directly inside Unreal Engine 5.8.3.</p>
          <div class="mono" style="font-size:11px;padding:6px 10px;background:var(--card2);border:1px solid var(--ln2)">npm i -D @swui/cli</div>
        </div>
      </div>
    </div>
  </div></section>

  <!-- ================= 02: API EXPLORER ================= -->
  <section class="sec"><div class="wrap">
    <div class="shead"><span class="sidx">02</span><span class="slbl">API Explorer</span><span class="srule"></span><span class="stag">Searchable Surface</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(22px,2.6vw,42px)">Engineered for clarity.<br><span class="si">Predictable signatures.</span></h2>
      <p class="lead">Search the entire SDK surface across state, events, navigation, input arbitration, lifecycle, and animation.</p>
    </div>

    <div class="api-g rv">
      <div>
        <input type="text" id="apiSearch" placeholder="Search methods, e.g. 'subscribe', 'emit'…" style="margin-bottom:12px;width:100%" aria-label="Search API">
        <div id="apiCats" style="display:flex;flex-direction:column;gap:4px"></div>
      </div>
      <div id="apiDetail"></div>
    </div>
  </div></section>

  <!-- ================= 03: LIVE STATE PUBLISHER & SUBSCRIBERS ================= -->
  <section class="sec inksec"><div class="wrap">
    <div class="shead"><span class="sidx">03</span><span class="slbl">State Synchronization Lab</span><span class="srule"></span><span class="stag">swui.state</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(22px,2.6vw,42px)">Live State Publisher.<br><span class="si">The UI reacts instantly.</span></h2>
      <p class="lead">Adjust the simulated Unreal state below. State changes are batched once per engine frame and dispatched to subscribers without polling.</p>
    </div>

    <div class="grid2 rv">
      <div class="plate">
        <div class="plate-h"><span class="sq"></span>Simulated Unreal Publisher</div>
        <div class="plate-b">
          <div class="frow">
            <label for="siHp">Player.Health <span class="mono dim" id="siHpVal">100 HP</span></label>
            <input type="range" id="siHp" min="0" max="100" value="100">
          </div>
          <div class="frow">
            <label for="siSh">Player.Shield <span class="mono dim" id="siShVal">75 Shield</span></label>
            <input type="range" id="siSh" min="0" max="100" value="75">
          </div>
          <div class="frow">
            <label for="siAm">Weapon.CurrentAmmo <span class="mono dim" id="siAmVal">30 rounds</span></label>
            <input type="range" id="siAm" min="0" max="120" value="30">
          </div>
          <div class="frow">
            <label for="siSpread">Weapon.CurrentSpread <span class="mono dim" id="siSpreadVal">0.25</span></label>
            <input type="range" id="siSpread" min="0" max="1" step="0.01" value="0.25">
          </div>
          <div class="frow">
            <label for="siMode">CrosshairMode</label>
            <select id="siMode" style="background:var(--card);border:1px solid var(--ln);padding:6px 10px;color:var(--fg);font-family:var(--mono);font-size:11px">
              <option value="PRECISE">PRECISE</option>
              <option value="EXPANDED">EXPANDED</option>
              <option value="SNIPER">SNIPER</option>
            </select>
          </div>
        </div>
      </div>

      <div class="plate">
        <div class="plate-h"><span class="sq"></span>Subscribed Consumers</div>
        <div class="plate-b">
          <div class="sb-sub" style="margin-bottom:16px">
            <h5 style="margin-bottom:10px;font-size:12px;font-weight:600">HUD Subscriber <span class="ls mono dim" style="font-size:10px">(Player.Health · Ammo · Shield)</span></h5>
            <div id="siHud" style="padding:12px;background:rgba(0,0,0,.3);border:1px solid var(--ln2)"></div>
          </div>
          <div class="sb-sub">
            <h5 style="margin-bottom:8px;font-size:12px;font-weight:600">Atomic Batch Inspector <span class="ls mono dim" style="font-size:10px">(swui.state.onBatch)</span></h5>
            <pre class="mono" id="siDb" style="padding:10px;font-size:11px;line-height:1.5;background:rgba(0,0,0,.4);border:1px solid var(--ln2);color:var(--ok);max-height:150px;overflow-y:auto"></pre>
          </div>
        </div>
      </div>
    </div>
  </div></section>

  <!-- ================= 04: TELEMETRY & DILATED TIMERS ================= -->
  <section class="sec"><div class="wrap">
    <div class="shead"><span class="sidx">04</span><span class="slbl">Engine Telemetry &amp; Game Time</span><span class="srule"></span><span class="stag">Dilated Time Clock</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(22px,2.6vw,42px)">Animation synchronized<br><span class="si">with engine time.</span></h2>
      <p class="lead">Unlike wall-clock timers (<span class="mono">performance.now()</span>), SWUI timelines scale with Unreal time dilation and pause cleanly when the world freezes.</p>
    </div>

    <div class="tele rv" id="teleGrid"></div>

    <div class="api-strip" style="margin-top:16px">
      <span class="mono dim" style="font-size:10px;letter-spacing:.1em">SIMULATE TIME DILATION:</span>
      <button class="tbtn" data-td="0.25">0.25x (Bullet Time)</button>
      <button class="tbtn" data-td="0.5">0.5x</button>
      <button class="tbtn on" data-td="1.0">1.0x (Normal)</button>
      <button class="tbtn" data-td="2.0">2.0x (Fast)</button>
      <button class="tbtn" id="telePause">Pause Game</button>
    </div>

    <canvas id="teleCv" height="100" style="width:100%;margin-top:16px;border:1px solid var(--ln);background:var(--card)"></canvas>

    <!-- Timeline Demo -->
    <div class="plate rv" style="margin-top:36px;max-width:900px">
      <div class="plate-h">
        <span class="sq"></span>swui.timeline — Reload Animation (Duration: 3.0s)
        <span class="sp"></span>
        <button class="tbtn pri" id="tlPlay">▶ Play</button>
        <button class="tbtn" id="tlCancel">✕ Cancel</button>
      </div>
      <div class="plate-b">
        <div style="height:12px;background:var(--ln2);position:relative;overflow:hidden">
          <i id="tlBar" style="display:block;height:100%;width:0;background:var(--blaze)"></i>
        </div>
        <div class="tele" style="margin-top:16px;grid-template-columns:repeat(auto-fit,minmax(120px,1fr))" id="teleTl"></div>
      </div>
    </div>
  </div></section>

  <!-- ================= 05: SPRING ANIMATION LAB ================= -->
  <section class="sec paper"><div class="wrap">
    <div class="shead"><span class="sidx" style="background:var(--ink);color:var(--paper)">05</span><span class="slbl">Physics &amp; Spring Playground</span><span class="srule"></span><span class="stag">swui.animation.createSpring</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(22px,2.6vw,42px)">Springs you can<br><span class="si">actually feel.</span></h2>
      <p class="lead">Click anywhere on the canvas below to set a new target. Adjust stiffness, damping, and mass in real time.</p>
    </div>

    <div class="rp-grid rv">
      <div class="plate">
        <div class="plate-h"><span class="sq"></span>Spring Canvas — Click / Drag to Retarget</div>
        <div class="plate-b" style="padding:10px">
          <canvas class="sp-cv" id="spCv" style="width:100%;height:220px;cursor:crosshair;background:var(--card)" aria-label="Spring animation playground"></canvas>
        </div>
      </div>

      <div>
        <div class="plate"><div class="plate-b">
          <div class="frow"><label>Stiffness <span class="mono dim" id="spStv">180</span></label><input type="range" id="spSt" min="20" max="400" value="180"></div>
          <div class="frow"><label>Damping <span class="mono dim" id="spDv">24</span></label><input type="range" id="spD" min="2" max="60" value="24"></div>
          <div class="frow"><label>Mass <span class="mono dim" id="spMv">1.0</span></label><input type="range" id="spM" min="20" max="300" value="100"></div>
          <div class="tele" style="margin-top:12px;grid-template-columns:1fr 1fr">
            <div><b>position</b><span id="spPos">—</span></div>
            <div><b>velocity</b><span id="spVel">—</span></div>
          </div>
        </div></div>
        <div id="spCode" style="margin-top:14px"></div>
      </div>
    </div>
  </div></section>

  <!-- ================= 06: CLI & BUILD WORKFLOW ================= -->
  <section class="sec inksec"><div class="wrap">
    <div class="shead"><span class="sidx">06</span><span class="slbl">CLI &amp; Build Workflow</span><span class="srule"></span><span class="stag">swui dev · swui build</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(22px,2.6vw,42px)">Zero-friction pipeline.<br><span class="si">Straight to Content/UI.</span></h2>
      <p class="lead">The CLI automatically detects your frontend toolchain (Vite, React, Vue, Svelte) and packages optimized static assets directly into Unreal's Content folder.</p>
    </div>

    <div class="rp-grid rv">
      <div class="term">
        <div class="th">bash — frontend project root</div>
        <div class="tb">
          <div><span class="p">$</span> npx swui dev</div>
          <div class="out" style="color:var(--ok)">✓ SWUI dev server ready at http://localhost:5173</div>
          <div class="out">✓ HMR connected to Unreal Engine 5.8.3 live viewport</div>
          <div style="height:12px"></div>
          <div><span class="p">$</span> npx swui build --production</div>
          <div class="out">✓ vite v5.4: bundling production assets...</div>
          <div class="out">✓ 38 assets compiled (index.html, bundles, fonts, textures)</div>
          <div class="out" style="color:var(--acc)">✓ Exported to Unreal: Content/UI/dist/</div>
          <div class="out">✓ Generated TypeScript bindings: generated/MyHUD.navigation.generated.ts</div>
          <div style="height:12px"></div>
          <div><span class="p">$</span> <span class="cursor"></span></div>
        </div>
      </div>

      <div>
        <div id="cfgCode"></div>
      </div>
    </div>
  </div></section>
</div>
`
      }}
    />
  )
}
