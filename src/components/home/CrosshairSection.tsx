import React, { useState, useEffect, useRef } from 'react'
import { makeCrosshair, CrosshairHandle } from '../../utils/crosshair'

export const CrosshairSection: React.FC = () => {
  const [spread, setSpread] = useState(0.3)
  const [ammo, setAmmo] = useState(24)
  const [mode, setMode] = useState<'EXPANDED' | 'PRECISE' | 'SNIPER'>('EXPANDED')
  const [kick, setKick] = useState(0)
  const [logs, setLogs] = useState<string[]>([])

  const mountRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<CrosshairHandle | null>(null)

  const damp = (c: number, t: number, l: number, dt: number) =>
    t + (c - t) * (1 - Math.exp(-l * dt))

  useEffect(() => {
    if (!mountRef.current) return
    const xh = makeCrosshair(mountRef.current)
    handleRef.current = xh

    let animId = 0
    let lastTime = performance.now()

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016)
      lastTime = now

      setKick(k => damp(k, 0, 7, dt))
      xh.set(spread + kick, mode)

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [spread, kick, mode])

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 5)])
  }

  const handleFire = () => {
    if (ammo > 0) {
      setAmmo(a => a - 1)
      setKick(0.25)
      handleRef.current?.hit()
      addLog(`Weapon.OnPlayerFiredShot → ammo remaining: ${ammo - 1}, spread: ${(spread + 0.25).toFixed(2)}`)
    }
  }

  const handleReload = () => {
    setAmmo(30)
    addLog('Weapon.Reload → ammo restored to 30')
  }

  return (
    <section className="sec" id="crosshair">
      <div className="wrap">
        <div className="shead">
          <span className="sidx">10</span>
          <span className="slbl">Crosshair Sandbox</span>
          <span className="srule" />
          <span className="stag">Procedural HUD Component</span>
        </div>

        <div className="cx rv in">
          {/* Viewport */}
          <div className="cx-view" style={{ minHeight: '300px', position: 'relative' }}>
            <div className="floor" />
            <div
              ref={mountRef}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%,-50%)',
                pointerEvents: 'none'
              }}
            />
            <div className="hudel hud-ammo" style={{ right: '20px', bottom: '20px' }}>
              <div className="big">
                <span>{ammo}</span>
                <span> | 180</span>
              </div>
            </div>
          </div>

          {/* Controls & State Logs */}
          <div>
            <div className="plate">
              <div className="plate-h">
                <span className="sq" />
                Crosshair State Controls
              </div>
              <div className="plate-b">
                <div className="frow">
                  <label>Base Spread: {spread.toFixed(2)}</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={spread * 100}
                    onChange={e => setSpread(+e.target.value / 100)}
                  />
                </div>
                <div className="frow">
                  <label>Mode</label>
                  <select
                    value={mode}
                    onChange={e => setMode(e.target.value as any)}
                  >
                    <option value="EXPANDED">EXPANDED</option>
                    <option value="PRECISE">PRECISE</option>
                    <option value="SNIPER">SNIPER</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button className="tbtn pri" onClick={handleFire}>
                    Fire Shot (Kick)
                  </button>
                  <button className="tbtn" onClick={handleReload}>
                    Reload Ammo
                  </button>
                </div>
              </div>
            </div>

            <div className="plate" style={{ marginTop: '14px' }}>
              <div className="plate-h">
                <span className="sq" />
                Event Trace Log
              </div>
              <div className="plate-b" style={{ minHeight: '120px' }}>
                <div className="ir-trace" style={{ border: 0, minHeight: '90px' }}>
                  {logs.length > 0 ? (
                    logs.map((l, i) => <div key={i}><span className="r">{l}</span></div>)
                  ) : (
                    <em>Click "Fire Shot" or "Reload" to emit reflected Unreal events</em>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
