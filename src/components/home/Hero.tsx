import React, { useState, useEffect, useRef } from 'react'
import { makeCrosshair } from '../../utils/crosshair'

interface Packet {
  id: number
  isEvent: boolean
  y: number
  d: number
}

export const Hero: React.FC = () => {
  const [hp, setHp] = useState(88)
  const [spread, setSpread] = useState(0.3)
  const [mode, setMode] = useState<'EXPANDED' | 'PRECISE' | 'SNIPER'>('EXPANDED')
  const [ammo, setAmmo] = useState(24)
  const [kick, setKick] = useState(0)
  const [packets, setPackets] = useState<Packet[]>([])

  const radarCanvasRef = useRef<HTMLCanvasElement>(null)
  const crosshairMountRef = useRef<HTMLDivElement>(null)
  const crosshairHandleRef = useRef<ReturnType<typeof makeCrosshair> | null>(null)

  const damp = (c: number, t: number, l: number, dt: number) =>
    t + (c - t) * (1 - Math.exp(-l * dt))
  const clamp = (v: number, a: number, b: number) =>
    Math.max(a, Math.min(b, v))

  const emitPacket = (isEvent: boolean) => {
    const p: Packet = {
      id: Math.random(),
      isEvent,
      y: 18 + Math.random() * 64,
      d: (isEvent ? -1 : 1) * (90 + Math.random() * 40)
    }
    setPackets(prev => [...prev, p])
    setTimeout(() => {
      setPackets(prev => prev.filter(x => x.id !== p.id))
    }, 800)
  }

  // Crosshair mount
  useEffect(() => {
    if (!crosshairMountRef.current) return
    const xh = makeCrosshair(crosshairMountRef.current)
    crosshairHandleRef.current = xh
  }, [])

  // Crosshair and radar animation loop
  useEffect(() => {
    const canvas = radarCanvasRef.current
    if (!canvas) return
    const rc = canvas.getContext('2d')
    if (!rc) return

    let animId = 0
    let lastTime = performance.now()
    let sweep = 0
    const blips = [
      { a: 0.6, r: 0.62 },
      { a: 2.5, r: 0.78 },
      { a: 4.2, r: 0.5 }
    ]

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016)
      lastTime = now

      // Damp kick
      setKick(k => damp(k, 0, 8, dt))

      // Update crosshair
      if (crosshairHandleRef.current) {
        crosshairHandleRef.current.set(spread + kick, mode)
      }

      // Draw radar
      const w = canvas.width
      const c = w / 2
      rc.clearRect(0, 0, w, w)
      rc.strokeStyle = 'rgba(239,238,232,.15)'
      rc.lineWidth = 1
      rc.beginPath()
      rc.arc(c, c, c - 2, 0, 7)
      rc.stroke()
      rc.beginPath()
      rc.arc(c, c, (c - 2) * 0.55, 0, 7)
      rc.stroke()
      rc.beginPath()
      rc.moveTo(c, 0)
      rc.lineTo(c, w)
      rc.moveTo(0, c)
      rc.lineTo(w, c)
      rc.stroke()

      sweep = (sweep + dt * 1.8) % (Math.PI * 2)
      rc.strokeStyle = '#5FA97A'
      rc.beginPath()
      rc.moveTo(c, c)
      rc.lineTo(c + Math.cos(sweep) * (c - 2), c + Math.sin(sweep) * (c - 2))
      rc.stroke()

      blips.forEach(b => {
        let diff = (sweep - b.a + Math.PI * 2) % (Math.PI * 2)
        let alpha = diff < 1.4 ? (1 - diff / 1.4) * 0.9 : 0.15
        rc.fillStyle = `rgba(95,169,122,${alpha})`
        const bx = c + Math.cos(b.a) * (c - 2) * b.r
        const by = c + Math.sin(b.a) * (c - 2) * b.r
        rc.fillRect(bx - 1.5, by - 1.5, 3, 3)
      })

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [spread, kick, mode])

  const handleFire = () => {
    if (ammo > 0) {
      setAmmo(a => a - 1)
      setKick(0.24)
      emitPacket(true)
    }
  }

  const handleHit = () => {
    setHp(h => Math.max(0, h - 15))
    emitPacket(true)
  }

  return (
    <section id="hero">
      <div className="wrap">
        <div className="hero-top">
          <div className="hero-t">
            <div className="eyebrow" style={{ color: '#8A8C95' }}>
              SimpleWebUI · SWUI 3.0
            </div>
            <h1 className="display">
              Web UI.<br />
              <em>Inside Unreal.</em>
            </h1>
            <p className="lead">
              A high-performance CEF runtime for Unreal Engine. Build game interfaces with HTML, CSS, JavaScript and TypeScript. Keep gameplay state, events and runtime control inside Unreal.
            </p>
            <div className="cta-row" style={{ marginTop: '24px' }}>
              <a className="btn" href="#/docs/getting-started">
                Get Started
                <svg><use href="#i-arr" /></svg>
              </a>
              <a className="btn-g" href="#/product">
                Overview
              </a>
            </div>
          </div>
        </div>

        {/* Console ↔ Seam ↔ HUD */}
        <div className="hero-demo rv in">
          {/* Console */}
          <div className="hc plate" id="heroConsole">
            <div className="plate-h">
              <span className="sq" />
              Unreal gameplay state
              <span className="sp" />
              <span className="chip on">SOURCE OF TRUTH</span>
            </div>
            <div className="hc-b">
              <div className="frow">
                <label>Player.Health <span className="mono dim">{hp}</span></label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={hp}
                  onChange={e => {
                    setHp(+e.target.value)
                    emitPacket(false)
                  }}
                />
              </div>
              <div className="frow">
                <label>Weapon.CurrentSpread <span className="mono dim">{(spread + kick).toFixed(2)}</span></label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={spread * 100}
                  onChange={e => {
                    setSpread(+e.target.value / 100)
                    emitPacket(false)
                  }}
                />
              </div>
              <div className="frow">
                <label>HUDState.CrosshairMode</label>
                <select
                  value={mode}
                  onChange={e => {
                    setMode(e.target.value as any)
                    emitPacket(false)
                  }}
                >
                  <option value="EXPANDED">EXPANDED</option>
                  <option value="PRECISE">PRECISE</option>
                  <option value="SNIPER">SNIPER</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button className="tbtn pri" onClick={handleFire}>
                  Fire weapon (Ammo: {ammo})
                </button>
                <button className="tbtn" onClick={handleHit}>
                  Take hit (-15 HP)
                </button>
              </div>
            </div>
          </div>

          {/* Seam */}
          <div className="hero-seam" id="heroSeam">
            <div className="seam-line" />
            <div className="seam-label top">← STATE</div>
            <div className="seam-label bot">EVENTS →</div>
            {packets.map(p => (
              <div
                key={p.id}
                className={`pkt ${p.isEvent ? 'ev' : ''}`}
                style={{
                  top: `${p.y}%`,
                  transform: `translateX(${p.d}px)`
                }}
              />
            ))}
          </div>

          {/* HUD Viewport */}
          <div className="hero-hud plate">
            <div className="plate-h">
              <span className="sq" />
              SWUI Document — hud.html
              <span className="sp" />
              <span className="chip">CEF · GPU SHARED TEXTURE</span>
            </div>
            <div className="hud-vp" style={{ minHeight: '340px', position: 'relative' }}>
              <div className="floor" />

              {/* Procedural crosshair mount */}
              <div
                ref={crosshairMountRef}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%,-50%)',
                  pointerEvents: 'none'
                }}
              />

              {/* Top Vitals */}
              <div className="hudel" style={{ left: '20px', top: '20px' }}>
                <div className="htag">Vitals</div>
                <div className="hnum"><b>{hp}</b> / 100</div>
                <div className="bar" style={{ width: '120px' }}>
                  <i style={{ width: `${hp}%`, background: hp < 30 ? 'var(--blaze)' : 'var(--ok)' }} />
                </div>
              </div>

              {/* Ammo */}
              <div className="hudel hud-ammo" style={{ right: '20px', bottom: '20px' }}>
                <div className="big">
                  <span>{ammo}</span>
                  <span> | 180</span>
                </div>
              </div>

              {/* Radar Canvas */}
              <div className="hudel" style={{ left: '20px', bottom: '20px' }}>
                <canvas
                  ref={radarCanvasRef}
                  width={68}
                  height={68}
                  style={{ width: '68px', height: '68px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

