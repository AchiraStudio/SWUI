import React, { useState, useEffect, useRef } from 'react'
import { makeCrosshair } from '../utils/crosshair'

const INVENTORY_ITEMS = [
  { name: 'Medkit', count: '×2' },
  { name: 'Ammo pack', count: '×4' },
  { name: 'Keycard — north gate', count: '×1' },
  { name: 'Crafting scrap', count: '×12' }
]

const USE_CASES = [
  ['Gameplay HUD', 'state · ROI · frame pacing'],
  ['Inventory', 'modal documents · input capture · GameplayTags'],
  ['Pause menu', 'tick-when-paused · events'],
  ['Dialogue', 'state · prompt strings · events'],
  ['Objective tracker', 'state · batching'],
  ['Interaction prompt', 'reflected bools + strings'],
  ['Crosshair', 'springs · events · state'],
  ['Map / minimap', 'canvas · ROI'],
  ['Skill tree', 'modal · navigation'],
  ['Settings', 'forms · two-way state'],
  ['Debug overlay', 'all-state subscription · telemetry'],
  ['Network HUD', 'persistent layer'],
  ['Chat', 'persistent · keyboard routing'],
  ['In-world terminal', 'actor component · dynamic material'],
  ['Cockpit dashboard', 'in-world surface · game time'],
  ['Internal runtime tool', 'documents · profiling'],
  ['Editor control panel', 'CEF · dev workflow'],
  ['Loading screens', 'preload · lifecycle']
]

const TERMINAL_LINES = [
  '> handshake … OK',
  '> colony-net relay 07',
  '> atmospheric: nominal',
  '> power: 62% and falling',
  '> SWUI surface mounted',
  '> awaiting operator_'
]

export const ExamplesPage: React.FC = () => {
  const [isInvOpen, setIsInvOpen] = useState(false)
  const [exTrace, setExTrace] = useState<string[]>([
    '<em>click the viewport to focus, then press I</em>'
  ])

  // Pause menu state
  const [isPaused, setIsPaused] = useState(false)
  const [pmTrace, setPmTrace] = useState<string[]>([
    '<em>world running · crosshair driven by game ticks</em>'
  ])

  // Refs for crosshairs and viewport
  const exXhRef = useRef<HTMLDivElement>(null)
  const pmXhRef = useRef<HTMLDivElement>(null)
  const [terminalText, setTerminalText] = useState('')

  const damp = (c: number, t: number, l: number, dt: number) =>
    t + (c - t) * (1 - Math.exp(-l * dt))
  const clamp = (v: number, a: number, b: number) =>
    Math.max(a, Math.min(b, v))

  // HUD + Inventory loop
  useEffect(() => {
    if (!exXhRef.current) return
    const xh = makeCrosshair(exXhRef.current)
    let animId = 0
    let lastTime = performance.now()
    let spread = 0.25
    let kick = 0
    let t = 0

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016)
      lastTime = now
      t += dt
      kick = damp(kick, 0, 7, dt)
      spread = clamp(0.22 + Math.sin(t * 0.8) * 0.08, 0, 1)
      xh.set(spread + kick, 'EXPANDED')
      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [])

  // Pause menu loop
  useEffect(() => {
    if (!pmXhRef.current) return
    const pmxh = makeCrosshair(pmXhRef.current)
    let animId = 0
    let lastTime = performance.now()
    let pt = 0
    let pk = 0

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016)
      lastTime = now
      if (!isPaused) {
        pt += dt
        pk = damp(pk, 0, 7, dt)
        pmxh.set(0.22 + Math.sin(pt * 0.8) * 0.06 + pk, 'EXPANDED')
      }
      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [isPaused])

  // Terminal typewriter
  useEffect(() => {
    let li = 0
    let ci = 0
    let txt = ''
    const interval = window.setInterval(() => {
      if (li < TERMINAL_LINES.length) {
        txt = TERMINAL_LINES[li].slice(0, ++ci)
        if (ci >= TERMINAL_LINES[li].length) {
          li++
          ci = 0
          txt = TERMINAL_LINES.slice(0, li).join('\n')
          if (li < TERMINAL_LINES.length) txt += '\n'
        }
        setTerminalText(txt + (li < TERMINAL_LINES.length ? '▌' : ''))
      } else if (Math.random() < 0.05) {
        li = 0
        ci = 0
        txt = ''
        setTerminalText('')
      }
    }, 70)

    return () => clearInterval(interval)
  }, [])

  const addExTrace = (msg: string) => {
    setExTrace(prev => [msg, ...prev.slice(0, 6)])
  }

  const toggleInventory = (open: boolean) => {
    setIsInvOpen(open)
    if (open) {
      addExTrace(
        '<span class="r">I keypress → hit test → hud.html (z10, non-interactive) → falls through</span><br><span class="r">SWUI → ActivateDocument(inventory.html)</span><br><em>MODAL · Z-100 · input captured · mouse shown · gameplay input blocked</em>'
      )
    } else {
      addExTrace(
        '<span class="r">ESC keypress → UI.Menu.CloseInventory</span><br><em>DeactivateDocument(inventory.html) → gameplay resumes</em>'
      )
    }
  }

  const handleViewportKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'i' || e.key === 'I') && !isInvOpen) {
      e.preventDefault()
      toggleInventory(true)
    } else if (e.key === 'Escape' && isInvOpen) {
      e.preventDefault()
      toggleInventory(false)
    }
  }

  const handleUseItem = (slot: number) => {
    addExTrace(
      `<span class="r">swui.events.emit('UI.Inventory.UseItem', { slot: ${slot} })</span>`
    )
  }

  const handlePause = () => {
    setIsPaused(true)
    setPmTrace(prev => [
      '<span class="r">SetGamePaused(true) — world freezes</span><br><em>SWUI document manager continues ticking when paused</em><br><span class="r">LoadDocument(pause.html) → Activate — menu animates in</span>',
      ...prev
    ])
  }

  const handleResume = () => {
    setIsPaused(false)
    setPmTrace(prev => [
      '<span class="r">button → swui.events.emit(\'UI.Menu.Resume\')</span><br><span class="r">Unreal: Deactivate pause.html · SetGamePaused(false)</span><br><em>gameplay resumes</em>',
      ...prev
    ])
  }

  return (
    <div className="page inksec" data-page="examples" style={{ paddingTop: '72px' }}>
      <header className="pgh">
        <div className="wrap">
          <div className="eyebrow" style={{ color: '#8A8C95' }}>
            Examples
          </div>
          <h1>
            Documents<br />
            <em>at work.</em>
          </h1>
          <p className="lead">
            Working demonstrations of layered documents, input capture, game-time pausing and in-world surfaces. The HUD below is live — click it to focus, then press <span className="kbd">I</span> and <span className="kbd">Esc</span>.
          </p>
        </div>
      </header>

      {/* Section 01: HUD + Inventory */}
      <section className="sec" style={{ borderTop: 0 }}>
        <div className="wrap">
          <div className="shead">
            <span className="sidx">01</span>
            <span className="slbl">HUD + Inventory</span>
            <span className="srule" />
            <span className="stag">Live — I / Esc</span>
          </div>

          <div className="cx rv in">
            <div
              className="cx-view"
              id="exView"
              tabIndex={0}
              onKeyDown={handleViewportKeyDown}
              aria-label="Game viewport. Press I for inventory, Escape to close."
            >
              <div className="floor" />
              <div style={{ position: 'absolute', inset: 0 }} ref={exXhRef} />
              <div className="hudel" style={{ left: '22px', top: '20px' }}>
                <div className="htag">Vitals</div>
                <div className="hnum"><b>85</b> / 100</div>
                <div className="bar" style={{ width: '128px' }}>
                  <i style={{ width: '85%' }} />
                </div>
              </div>
              <div className="hudel hud-ammo">
                <div className="big">
                  <span>24</span>
                  <span> | 180</span>
                </div>
              </div>
              <div
                className="hudel"
                style={{ left: '50%', bottom: '16px', transform: 'translateX(-50%)' }}
              >
                <span
                  className="chip"
                  style={{ color: 'var(--bone)', borderColor: 'rgba(239,238,232,.35)' }}
                >
                  {isInvOpen ? 'inventory active · press ESC to close' : 'click to focus · press I for inventory'}
                </span>
              </div>

              {/* Modal Inventory */}
              {isInvOpen && (
                <div
                  id="exInv"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(8,9,11,.74)',
                    display: 'flex',
                    zIndex: 10,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div style={{ width: 'min(420px,86%)', border: '1px solid var(--blaze)', background: 'rgba(16,17,20,.97)' }}>
                    <div className="plate-h">
                      <span className="sq" />
                      inventory.html · MODAL · Z-100 · ACTIVE
                      <span className="sp" />
                      <span className="chip">input: captured</span>
                    </div>
                    <div
                      style={{
                        padding: '16px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px'
                      }}
                    >
                      {INVENTORY_ITEMS.map((item, i) => (
                        <div key={i} className="inv-item">
                          <div className="inv-ic">
                            <svg><use href="#i-doc" /></svg>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="nm" style={{ fontSize: '12.5px' }}>{item.name}</div>
                            <div className="ct">{item.count}</div>
                          </div>
                          <button
                            className="tbtn"
                            onClick={() => handleUseItem(i + 1)}
                          >
                            use
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="plate">
                <div className="plate-b" style={{ padding: 0 }}>
                  <div
                    className="ir-trace"
                    id="exTrace"
                    style={{ border: 0, minHeight: '190px' }}
                    dangerouslySetInnerHTML={{ __html: exTrace.join('<br>') }}
                  />
                </div>
              </div>
              <div className="api-strip" style={{ marginTop: '14px' }}>
                <span className="chip">documents</span>
                <span className="chip">layers</span>
                <span className="chip">Z-order</span>
                <span className="chip">input</span>
                <span className="chip">events</span>
                <span className="chip">state</span>
                <span className="chip">lifecycle</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 02: Pause menu */}
      <section className="sec">
        <div className="wrap">
          <div className="shead">
            <span className="sidx">02</span>
            <span className="slbl">Pause menu</span>
            <span className="srule" />
            <span className="stag">Tick when paused</span>
          </div>

          <div className="rp-grid rv in">
            <div className="plate">
              <div className="plate-h">
                <span className="sq" />
                <span>{isPaused ? 'world: PAUSED · pause.html: ACTIVE (ticking)' : 'world: running · pause.html: unloaded'}</span>
                <span className="sp" />
                <button
                  className="tbtn pri"
                  disabled={isPaused}
                  onClick={handlePause}
                >
                  {isPaused ? 'Paused' : 'Pause'}
                </button>
              </div>
              <div className="plate-b">
                <div className="roi-wrap" style={{ aspectRatio: '16/8', minHeight: '250px' }}>
                  <div
                    style={{
                      position: 'absolute',
                      inset: '56% -12% 0',
                      background:
                        'linear-gradient(rgba(239,238,232,.05) 1px,transparent 1px) 0 0/100% 32px,linear-gradient(90deg,rgba(239,238,232,.05) 1px,transparent 1px) 0 0/56px 100%',
                      transform: 'perspective(300px) rotateX(58deg)',
                      transformOrigin: 'top'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%,-50%)'
                    }}
                    ref={pmXhRef}
                  />

                  {/* Pause Menu Overlay */}
                  {isPaused && (
                    <div
                      id="pmMenu"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                      }}
                    >
                      <div
                        style={{
                          width: 'min(320px,84%)',
                          border: '1px solid rgba(239,238,232,.25)',
                          background: 'rgba(13,14,17,.96)',
                          padding: '26px',
                          textAlign: 'center'
                        }}
                      >
                        <div
                          className="mono"
                          style={{
                            fontSize: '10px',
                            letterSpacing: '.32em',
                            color: 'var(--acc)',
                            marginBottom: '18px'
                          }}
                        >
                          GAME PAUSED
                        </div>
                        <div
                          style={{
                            font: '400 12px/1.6 var(--sans)',
                            color: 'var(--mut)',
                            marginBottom: '22px'
                          }}
                        >
                          The Unreal game world can pause while the SWUI document manager continues ticking.
                        </div>
                        <div className="sl-spin" style={{ margin: '0 auto 22px' }} />
                        <button
                          className="btn"
                          style={{ width: '100%', justifyContent: 'center' }}
                          onClick={handleResume}
                        >
                          Resume
                        </button>
                        <div className="mono dim" style={{ fontSize: '9px', marginTop: '14px' }}>
                          emits UI.Menu.Resume
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div
                className="ir-trace"
                style={{ minHeight: '230px' }}
                dangerouslySetInnerHTML={{ __html: pmTrace.join('<br>') }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 03: In-world UI */}
      <section className="sec">
        <div className="wrap">
          <div className="shead">
            <span className="sidx">03</span>
            <span className="slbl">In-world UI</span>
            <span className="srule" />
            <span className="stag">Actor component → material</span>
          </div>
          <div className="sec-top">
            <h2 className="display" style={{ fontSize: 'clamp(24px,2.8vw,46px)' }}>
              Beyond flat HUDs.
            </h2>
          </div>
          <div className="rp-grid rv in">
            <div className="plate">
              <div className="plate-h">
                <span className="sq" />
                USwui actor component → dynamic material
              </div>
              <div className="plate-b">
                <div
                  className="roi-wrap"
                  style={{
                    aspectRatio: '16/9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    perspective: '900px'
                  }}
                >
                  <div
                    style={{
                      transform: 'rotateX(8deg) rotateY(-14deg)',
                      width: 'min(380px,72%)',
                      border: '1px solid var(--acc)',
                      background: '#07080B',
                      overflow: 'hidden',
                      boxShadow: '0 40px 90px -20px rgba(0,0,0,.9)'
                    }}
                  >
                    <div className="plate-h" style={{ borderBottom: '1px solid rgba(239,238,232,.1)' }}>
                      <span className="sq" />
                      <span className="mono" style={{ fontSize: '9px' }}>terminal.swui · colony-net v4.2</span>
                    </div>
                    <pre
                      className="mono"
                      style={{
                        padding: '16px',
                        fontSize: '11px',
                        lineHeight: '1.9',
                        color: '#9FD0A8',
                        margin: 0,
                        minHeight: '150px'
                      }}
                    >
                      {terminalText}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="arch-stack">
                <div className="al">
                  <b>Actor</b>
                  <div className="sub"><span className="chip">in-world placement</span></div>
                </div>
                <div className="al">
                  <b>USwui component</b>
                  <div className="sub"><span className="chip on">drives the document</span></div>
                </div>
                <div className="al">
                  <b>Document asset</b>
                  <div className="sub"><span className="chip">terminal.html</span></div>
                </div>
                <div className="al">
                  <b>CEF → texture</b>
                  <div className="sub"><span className="chip">rendered surface</span></div>
                </div>
                <div className="al">
                  <b>Dynamic material</b>
                  <div className="sub"><span className="chip">UV-mapped screen</span></div>
                </div>
              </div>
              <p className="lead" style={{ fontSize: '13px', marginTop: '16px' }}>
                The same document pipeline drives screens inside your world — terminals, cockpits, signage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 04: Use-case index */}
      <section className="sec paper">
        <div className="wrap">
          <div className="shead">
            <span className="sidx">04</span>
            <span className="slbl">Use-case index</span>
            <span className="srule" />
            <span className="stag">Eighteen surfaces</span>
          </div>

          <div className="dtable rv in" id="ucList">
            <div className="th">
              <span>Use case</span>
              <span />
              <span style={{ textAlign: 'right' }}>SWUI systems demonstrated</span>
            </div>
            {USE_CASES.map(([n, s], i) => (
              <div key={i} className="drow" style={{ cursor: 'default' }}>
                <span className="dn" style={{ fontFamily: 'var(--sans)', fontSize: '14px' }}>
                  {n}
                </span>
                <span />
                <span className="dl" style={{ textAlign: 'right' }}>
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
