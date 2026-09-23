import React, { useState, useEffect, useRef } from 'react'
import { CodeBlock } from '../components/common/CodeBlock'

const API_CATEGORIES: Record<string, { i: string; e: [string, string, string][] }> = {
  STATE: {
    i: 'Publish · subscribe · batch',
    e: [
      ['swui.state.get', 'Read a state field', "const v = swui.state.get('Weapon.CurrentAmmo')"],
      ['swui.state.getAll', 'Read full published state', 'const state = swui.state.getAll()'],
      ['swui.state.subscribe', 'Subscribe to a single field', "const unsub = swui.state.subscribe('Player.Health', v => render(v))"],
      ['swui.state.update', 'Propagate a state patch', "swui.state.update({ 'UI.MenuVolume': 0.4 })"],
      ['swui.state.onBatch', 'Once-per-frame atomic batch', 'swui.state.onBatch(batch => frame(batch.version))'],
      ['swui.state.onTick', 'Runtime tick on engine clock', 'swui.state.onTick(({ dt, time, paused }) => update(dt))']
    ]
  },
  EVENTS: {
    i: 'Unreal ↔ Web event bridge',
    e: [
      ['swui.events.on', 'Subscribe to Unreal event', "swui.events.on('Weapon.OnPlayerFiredShot', onFire)"],
      ['swui.events.emit', 'Emit tag-routed event to Unreal', "swui.events.emit('UI.Inventory.UseItem', { slot: 2 })"],
      ['swui.events.emitNavigation', 'Emit navigation action', "swui.events.emitNavigation('confirm')"]
    ]
  },
  NAVIGATION: {
    i: 'Focus & gamepad navigation',
    e: [
      ['swui.navigation.onNavigate', 'Directional focus movement', 'swui.navigation.onNavigate(dir => focus.move(dir))'],
      ['swui.navigation.onConfirm', 'Confirm / execute focused', 'swui.navigation.onConfirm(() => click())'],
      ['swui.navigation.onCancel', 'Cancel / close document', 'swui.navigation.onCancel(() => close())'],
      ['swui.navigation.onNextTab', 'Next tab group', 'swui.navigation.onNextTab(() => tabs.next())'],
      ['swui.navigation.onPreviousTab', 'Previous tab group', 'swui.navigation.onPreviousTab(() => tabs.prev())']
    ]
  },
  TIMELINE: {
    i: 'Game-time animation timeline',
    e: [
      ['swui.timeline.begin', 'Start game-time timeline', "const t = swui.timeline.begin({ id: 'reload', duration: 3 })"],
      ['swui.timeline.cancel', 'Cancel — records cancelProgress', 't.cancel()']
    ]
  },
  ANIMATION: {
    i: 'Physics springs & interpolation',
    e: [
      ['swui.animation.createSpring', 'Spring with stiffness / damping', 'const s = swui.animation.createSpring({ stiffness: 170, damping: 26 })'],
      ['swui.animation.damp', 'Frame-rate independent approach', 'val = swui.animation.damp(val, target, 8, dt)'],
      ['swui.animation.lerp', 'Linear interpolation', 'x = swui.animation.lerp(a, b, t)']
    ]
  }
}

export const SdkPage: React.FC = () => {
  // API browser state
  const [activeCategory, setActiveCategory] = useState('STATE')
  const [apiSearch, setApiSearch] = useState('')
  const [openApiEntries, setOpenApiEntries] = useState<Record<string, boolean>>({})

  // Live state publisher
  const [hp, setHp] = useState(85)
  const [ammo, setAmmo] = useState(30)
  const [shield, setShield] = useState(60)

  // Telemetry state
  const [teleTimeDilation, setTeleTimeDilation] = useState(1.0)
  const [isTelePaused, setIsTelePaused] = useState(false)
  const teleCanvasRef = useRef<HTMLCanvasElement>(null)
  const [teleData, setTeleData] = useState({
    fps: 60,
    dt: 16.6,
    time: 0,
    frame: 0,
    ver: 0
  })

  // Timeline state
  const [timelineState, setTimelineState] = useState<'IDLE' | 'RUNNING' | 'COMPLETED' | 'CANCELLED'>('IDLE')
  const [timelineProgress, setTimelineProgress] = useState(0)
  const [timelineGeneration, setTimelineGeneration] = useState(0)
  const [timelineStartTime, setTimelineStartTime] = useState(0)
  const [timelineCancelProgress, setTimelineCancelProgress] = useState(0)

  // Spring physics canvas
  const springCanvasRef = useRef<HTMLCanvasElement>(null)
  const [stiffness, setStiffness] = useState(170)
  const [damping, setDamping] = useState(26)
  const [mass, setMass] = useState(1.0)
  const [springPos, setSpringPos] = useState(60)
  const [springVel, setSpringVel] = useState(0)
  const springState = useRef({
    x: 60,
    tx: 240,
    v: 0,
    trail: [] as number[],
    w: 400
  })

  // Telemetry loop
  useEffect(() => {
    const cv = teleCanvasRef.current
    if (!cv) return
    const cx = cv.getContext('2d')
    if (!cx) return

    let animId = 0
    let lastTime = performance.now()
    const hist: number[] = []

    const handleResize = () => {
      cv.width = cv.clientWidth || 600
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016)
      lastTime = now

      if (!isTelePaused) {
        setTeleData(prev => {
          const fps = 1 / dt
          const newTime = prev.time + dt * teleTimeDilation
          const newFrame = prev.frame + 1
          return {
            fps: prev.fps + (fps - prev.fps) * 0.1,
            dt: dt * 1000,
            time: newTime,
            frame: newFrame,
            ver: prev.ver
          }
        })

        hist.push(dt * 1000)
        if (hist.length > 140) hist.shift()

        cx.clearRect(0, 0, cv.width, cv.height)
        cx.strokeStyle = 'rgba(16,17,20,.15)'
        cx.beginPath()
        cx.moveTo(0, cv.height / 2)
        cx.lineTo(cv.width, cv.height / 2)
        cx.stroke()

        cx.strokeStyle = '#D63F00'
        cx.lineWidth = 1.4
        cx.beginPath()
        hist.forEach((v, i) => {
          const x = (i / 140) * cv.width
          const y = Math.min(1, Math.max(0, v / 33)) * (cv.height - 10) + 5
          if (i === 0) cx.moveTo(x, y)
          else cx.lineTo(x, y)
        })
        cx.stroke()
      }

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [teleTimeDilation, isTelePaused])

  // Timeline loop
  useEffect(() => {
    if (timelineState !== 'RUNNING' || isTelePaused) return
    let animId = 0
    let lastTime = performance.now()

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016)
      lastTime = now

      setTimelineProgress(prev => {
        const next = prev + (dt * teleTimeDilation) / 3.0
        if (next >= 1) {
          setTimelineState('COMPLETED')
          return 1
        }
        return next
      })

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [timelineState, isTelePaused, teleTimeDilation])

  // Spring canvas loop
  useEffect(() => {
    const scv = springCanvasRef.current
    if (!scv) return
    const sc = scv.getContext('2d')
    if (!sc) return

    let animId = 0
    let lastTime = performance.now()

    const handleResize = () => {
      springState.current.w = scv.clientWidth || 400
      scv.width = springState.current.w
      scv.height = 240
      if (!springState.current.tx) {
        springState.current.tx = springState.current.w * 0.7
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016)
      lastTime = now

      const sp = springState.current
      const a = (-stiffness * (sp.x - sp.tx) - damping * sp.v) / mass
      sp.v += a * dt
      sp.x += sp.v * dt
      sp.trail.push(sp.x)
      if (sp.trail.length > 70) sp.trail.shift()

      setSpringPos(sp.x)
      setSpringVel(sp.v)

      sc.clearRect(0, 0, sp.w, 240)
      sc.strokeStyle = 'rgba(16,17,20,.14)'
      sc.setLineDash([3, 5])
      sc.beginPath()
      sc.moveTo(sp.tx, 20)
      sc.lineTo(sp.tx, 220)
      sc.stroke()
      sc.setLineDash([])

      sc.strokeStyle = 'rgba(214,63,0,.5)'
      sc.lineWidth = 1.4
      sc.beginPath()
      sp.trail.forEach((x, i) => {
        const y = 200 - (i / 70) * 160
        if (i === 0) sc.moveTo(x, y)
        else sc.lineTo(x, y)
      })
      sc.stroke()

      sc.fillStyle = '#101114'
      sc.beginPath()
      sc.arc(sp.x, 120, 7, 0, 7)
      sc.fill()

      sc.strokeStyle = '#D63F00'
      sc.lineWidth = 2
      sc.beginPath()
      sc.arc(sp.x, 120, 12, 0, 7)
      sc.stroke()

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [stiffness, damping, mass])

  const handleSpringPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const scv = springCanvasRef.current
    if (!scv) return
    const rect = scv.getBoundingClientRect()
    const targetX = Math.max(14, Math.min(springState.current.w - 14, e.clientX - rect.left))
    springState.current.tx = targetX
  }

  const handlePlayTimeline = () => {
    setTimelineGeneration(g => g + 1)
    setTimelineStartTime(teleData.time)
    setTimelineProgress(0)
    setTimelineCancelProgress(0)
    setTimelineState('RUNNING')
  }

  const handleCancelTimeline = () => {
    if (timelineState === 'RUNNING') {
      setTimelineCancelProgress(timelineProgress)
      setTimelineState('CANCELLED')
    }
  }

  const toggleApiEntry = (key: string) => {
    setOpenApiEntries(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const currentCat = API_CATEGORIES[activeCategory] || API_CATEGORIES.STATE
  const filteredEntries = currentCat.e.filter(
    x =>
      !apiSearch ||
      x[0].toLowerCase().includes(apiSearch.toLowerCase()) ||
      x[1].toLowerCase().includes(apiSearch.toLowerCase())
  )

  return (
    <div className="page paper" data-page="sdk" style={{ paddingTop: '72px' }}>
      <header className="pgh">
        <div className="wrap">
          <div className="eyebrow">SDK</div>
          <h1>
            Idiomatic APIs.<br />
            <em>Strict contracts.</em>
          </h1>
          <p className="lead">
            The SWUI client library provides TypeScript-first abstractions over Unreal state and events. Spring physics, game-time timelines, telemetry and live batching out of the box.
          </p>
        </div>
      </header>

      {/* Section 01: API Explorer */}
      <section className="sec" style={{ borderTop: 0 }}>
        <div className="wrap">
          <div className="shead">
            <span className="sidx">01</span>
            <span className="slbl">API Explorer</span>
            <span className="srule" />
            <span className="stag">Namespaces</span>
          </div>

          <div className="api-g rv in">
            <div>
              <input
                type="text"
                value={apiSearch}
                onChange={e => setApiSearch(e.target.value)}
                placeholder="Search the API…"
                style={{ marginBottom: '12px' }}
                aria-label="Search API"
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {Object.entries(API_CATEGORIES).map(([catKey, catVal]) => (
                  <button
                    key={catKey}
                    className={`api-cat ${catKey === activeCategory ? 'on' : ''}`}
                    onClick={() => setActiveCategory(catKey)}
                  >
                    <span>{catKey.toLowerCase()}</span>
                    <span className="cd">{catVal.e.length}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div
                className="mono dim"
                style={{ fontSize: '10.5px', letterSpacing: '.12em', marginBottom: '12px' }}
              >
                // {currentCat.i}
              </div>
              <div id="apiDetail">
                {filteredEntries.length > 0 ? (
                  filteredEntries.map(([name, desc, sig]) => {
                    const isOpen = !!openApiEntries[name]
                    return (
                      <div key={name} className={`ref-entry ${isOpen ? 'open' : ''}`}>
                        <button
                          className="ref-h"
                          onClick={() => toggleApiEntry(name)}
                        >
                          <span className="nm">{name}</span>
                          <span className="pu">{desc}</span>
                          <span className="ct">{activeCategory}</span>
                          <svg><use href="#i-chev" /></svg>
                        </button>
                        {isOpen && (
                          <div className="ref-b">
                            <div className="sig">{sig}</div>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <p className="dim mono" style={{ fontSize: '12px' }}>
                    no matches
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 02: State Publisher & Subscribers */}
      <section className="sec inksec">
        <div className="wrap">
          <div className="shead">
            <span className="sidx">02</span>
            <span className="slbl">State — live</span>
            <span className="srule" />
            <span className="stag">get · subscribe · onBatch</span>
          </div>
          <div className="sec-top">
            <h2 className="display" style={{ fontSize: 'clamp(24px,2.8vw,44px)' }}>
              Change a value.<br />
              <span className="si">the UI reacts.</span>
            </h2>
          </div>

          <div className="grid2 rv in">
            <div className="plate">
              <div className="plate-h">
                <span className="sq" />
                swui.state — publisher
              </div>
              <div className="plate-b">
                <div className="frow">
                  <label htmlFor="siHp">PlayerHealth ({hp})</label>
                  <input
                    type="range"
                    id="siHp"
                    min="0"
                    max="100"
                    value={hp}
                    onChange={e => setHp(+e.target.value)}
                  />
                </div>
                <div className="frow">
                  <label htmlFor="siAm">Ammo ({ammo})</label>
                  <input
                    type="number"
                    id="siAm"
                    value={ammo}
                    onChange={e => setAmmo(+e.target.value)}
                  />
                </div>
                <div className="frow">
                  <label htmlFor="siSh">Shield ({shield})</label>
                  <input
                    type="range"
                    id="siSh"
                    min="0"
                    max="100"
                    value={shield}
                    onChange={e => setShield(+e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="plate">
              <div className="plate-h">
                <span className="sq" />
                Subscribers
              </div>
              <div className="plate-b">
                <div className="sb-sub">
                  <h5>HUD<span className="ls">PlayerHealth · Ammo</span></h5>
                  <div className="val" id="siHud">
                    <span style={{ color: 'var(--ok)' }}>HP {hp}</span> · AMMO{' '}
                    <span className="acc">{ammo}</span>
                  </div>
                </div>
                <div className="sb-sub">
                  <h5>Debug UI<span className="ls">all fields</span></h5>
                  <div className="val mono" style={{ fontSize: '10.5px', whiteSpace: 'pre' }}>
                    {JSON.stringify({ PlayerHealth: hp, Ammo: ammo, Shield: shield }, null, 1)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 03: Telemetry & Timeline */}
      <section className="sec">
        <div className="wrap">
          <div className="shead">
            <span className="sidx">03</span>
            <span className="slbl">Runtime data</span>
            <span className="srule" />
            <span className="stag">Telemetry</span>
          </div>

          <div className="tele rv in" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))' }}>
            <div><b>fps</b><span>{teleData.fps.toFixed(0)}</span></div>
            <div><b>dt</b><span>{teleData.dt.toFixed(1)} ms</span></div>
            <div><b>time</b><span>{teleData.time.toFixed(1)} s</span></div>
            <div><b>frameIndex</b><span>{teleData.frame}</span></div>
            <div><b>cefFps</b><span>{Math.min(teleData.fps, 60).toFixed(0)}</span></div>
            <div><b>timeDilation</b><span>{teleTimeDilation.toFixed(2)}</span></div>
            <div><b>paused</b><span>{isTelePaused ? 'true' : 'false'}</span></div>
          </div>

          <div className="api-strip" style={{ marginTop: '16px' }}>
            <span className="mono dim" style={{ fontSize: '10px', letterSpacing: '.1em' }}>TIME DILATION</span>
            <button
              className={`tbtn ${teleTimeDilation === 0.25 ? 'on' : ''}`}
              onClick={() => setTeleTimeDilation(0.25)}
            >
              0.25
            </button>
            <button
              className={`tbtn ${teleTimeDilation === 1.0 ? 'on' : ''}`}
              onClick={() => setTeleTimeDilation(1.0)}
            >
              1.0
            </button>
            <button
              className={`tbtn ${teleTimeDilation === 2.0 ? 'on' : ''}`}
              onClick={() => setTeleTimeDilation(2.0)}
            >
              2.0
            </button>
            <button
              className={`tbtn ${isTelePaused ? 'on' : ''}`}
              onClick={() => setIsTelePaused(!isTelePaused)}
            >
              {isTelePaused ? 'Resume game' : 'Pause game'}
            </button>
          </div>

          <canvas
            ref={teleCanvasRef}
            height={90}
            style={{ width: '100%', marginTop: '16px', border: '1px solid var(--ln)', background: 'var(--card)' }}
          />

          {/* Section 04: Timeline */}
          <div className="shead" style={{ marginTop: '56px' }}>
            <span className="sidx">04</span>
            <span className="slbl">Timeline</span>
            <span className="srule" />
            <span className="stag">Game-time animation</span>
          </div>
          <div className="sec-top">
            <h2 className="display" style={{ fontSize: 'clamp(24px,2.8vw,44px)' }}>
              Animation that knows<br />
              <span className="si">about game time.</span>
            </h2>
            <p className="lead" style={{ alignSelf: 'center' }}>
              Progress is measured on the game clock — dilated and pausable, not wall time.
            </p>
          </div>

          <div className="plate rv in" style={{ maxWidth: '860px' }}>
            <div className="plate-h">
              <span className="sq" />
              timeline · id "reload" · duration 3.0 s
              <span className="sp" />
              <button className="tbtn" onClick={handlePlayTimeline}>
                <svg><use href="#i-play" /></svg> Play
              </button>
              <button className="tbtn" onClick={handleCancelTimeline}>
                Cancel
              </button>
            </div>
            <div className="plate-b">
              <div style={{ height: '10px', background: 'var(--ln2)', overflow: 'hidden' }}>
                <i
                  style={{
                    display: 'block',
                    height: '100%',
                    width: `${timelineProgress * 100}%`,
                    background: 'var(--blaze)',
                    transition: 'width 0.05s linear'
                  }}
                />
              </div>
              <div className="tele" style={{ marginTop: '16px', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))' }}>
                <div><b>state</b><span>{timelineState}</span></div>
                <div><b>progress</b><span>{timelineProgress.toFixed(2)}</span></div>
                <div><b>generation</b><span>{timelineGeneration}</span></div>
                <div><b>startGameTime</b><span>{timelineStartTime.toFixed(2)} s</span></div>
                <div><b>duration</b><span>3.0 s</span></div>
                <div><b>cancelProgress</b><span>{timelineCancelProgress > 0 && timelineState === 'CANCELLED' ? timelineCancelProgress.toFixed(2) : '—'}</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 05: Animation Lab (Spring) */}
      <section className="sec">
        <div className="wrap">
          <div className="shead">
            <span className="sidx">05</span>
            <span className="slbl">Animation lab</span>
            <span className="srule" />
            <span className="stag">createSpring</span>
          </div>
          <div className="sec-top">
            <h2 className="display" style={{ fontSize: 'clamp(24px,2.8vw,44px)' }}>
              Springs you can<br />
              <span className="si">actually feel.</span>
            </h2>
            <p className="lead" style={{ alignSelf: 'center' }}>
              Click anywhere on the canvas to set a target. Tune stiffness, damping and mass.
            </p>
          </div>

          <div className="rp-grid rv in">
            <div className="plate">
              <div className="plate-h">
                <span className="sq" />
                Spring — click to retarget
              </div>
              <div className="plate-b" style={{ padding: '10px' }}>
                <canvas
                  ref={springCanvasRef}
                  className="sp-cv"
                  onPointerDown={handleSpringPointerDown}
                  aria-label="Spring animation playground"
                  style={{ width: '100%', height: '240px', background: 'var(--card2)', cursor: 'crosshair' }}
                />
              </div>
            </div>

            <div>
              <div className="plate">
                <div className="plate-b">
                  <div className="frow">
                    <label>Stiffness <span className="mono dim">{stiffness}</span></label>
                    <input
                      type="range"
                      min="20"
                      max="400"
                      value={stiffness}
                      onChange={e => setStiffness(+e.target.value)}
                    />
                  </div>
                  <div className="frow">
                    <label>Damping <span className="mono dim">{damping}</span></label>
                    <input
                      type="range"
                      min="2"
                      max="60"
                      value={damping}
                      onChange={e => setDamping(+e.target.value)}
                    />
                  </div>
                  <div className="frow">
                    <label>Mass <span className="mono dim">{mass.toFixed(1)}</span></label>
                    <input
                      type="range"
                      min="20"
                      max="400"
                      value={mass * 100}
                      onChange={e => setMass(+e.target.value / 100)}
                    />
                  </div>
                  <div className="tele" style={{ marginTop: '12px', gridTemplateColumns: '1fr 1fr' }}>
                    <div><b>position</b><span>{springPos.toFixed(0)} px</span></div>
                    <div><b>velocity</b><span>{springVel.toFixed(0)} px/s</span></div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '14px' }}>
                <CodeBlock snipKey="anim" file="crosshair.ts" lang="ts" theme="l" showLineNumbers={false} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 06: CLI & Config */}
      <section className="sec inksec">
        <div className="wrap">
          <div className="shead">
            <span className="sidx">06</span>
            <span className="slbl">CLI &amp; config</span>
            <span className="srule" />
            <span className="stag">swui dev · swui build</span>
          </div>

          <div className="rp-grid rv in">
            <div className="term">
              <div className="th">bash — project root</div>
              <div className="tb">
                <div><span className="p">$</span> swui dev</div>
                <div className="out">SWUI dev · vite project detected · live reload → Unreal</div>
                <div style={{ height: '10px' }} />
                <div><span className="p">$</span> swui build --production</div>
                <div className="out">vite v5 · building for production…</div>
                <div className="out">dist/index.html · 41 assets → Unreal Content/UI/MainHUD</div>
                <div style={{ height: '10px' }} />
                <div><span className="p">$</span> <span className="cursor" /></div>
              </div>
            </div>
            <div>
              <CodeBlock snipKey="config" file="swui.config.ts" lang="ts" theme="l" />
              <p className="lead" style={{ fontSize: '13px', marginTop: '14px' }}>
                The CLI detects frontend project structure — Vite configurations, and Next.js static-export projects — and invokes the frontend build workflow. The output is always static web assets delivered to the Unreal runtime.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
