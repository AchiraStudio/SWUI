import React, { useEffect, useRef, useState } from 'react'
import { copyText, toast } from '../utils/toast'

interface Cmd {
  cmd: string
  desc: string
  out: string
}

const COMMANDS: Cmd[] = [
  {
    cmd: 'swui.debug.Stats 1',
    desc: 'Enable the on-screen runtime statistics overlay.',
    out: 'BrowserFPS 60 | PresentedFPS 60 | PaintLatency 4.1ms\nDocuments: 2 active / 1 sleeping / 1 unloaded'
  },
  {
    cmd: 'swui.verbosePaint 1',
    desc: 'Log every paint and present with dirty rect information.',
    out: '[SWUI] MainHUD paint: roi=4 rects 1280x720 -> present 4.1ms\n[SWUI] Chat paint: full 512x384 -> present 1.2ms'
  },
  {
    cmd: 'swui.hud.Lockstep 1',
    desc: 'Lock HUD document presentation to the engine frame clock.',
    out: 'HUD lockstep enabled: browser begin-frame driven by engine tick'
  },
  {
    cmd: 'swui.hud.MaxBrowserFPS 60',
    desc: 'Clamp browser frame production for the HUD document.',
    out: 'MaxBrowserFPS=60 (previous: 120)'
  },
  {
    cmd: 'swui.cefMessageLoopBudgetMs 2',
    desc: 'Per-frame budget for CEF message-loop work.',
    out: 'CEF message loop budget: 2.00 ms (used last frame: 0.84 ms)'
  }
]

export const ProfilingPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [metrics, setMetrics] = useState({
    bf: 60,
    pf: 60,
    lat: 4.2,
    flush: 0.6,
    budget: 0.4
  })
  const stateRef = useRef({
    bf: 60,
    pf: 60,
    lat: 4.2,
    flush: 0.6,
    budget: 0.4,
    hist: [] as { b: number; p: number }[],
    inj: 0
  })

  const damp = (c: number, t: number, l: number, dt: number) =>
    t + (c - t) * (1 - Math.exp(-l * dt))
  const clamp = (v: number, a: number, b: number) =>
    Math.max(a, Math.min(b, v))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    let lastTime = performance.now()

    const handleResize = () => {
      canvas.width = canvas.clientWidth || 800
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016)
      lastTime = now

      const S = stateRef.current
      S.bf = damp(S.bf, 1 / dt, 2, dt)
      const miss = Math.random() < (S.inj > 0 ? 0.3 : 0.02)
      S.pf = damp(S.pf, miss ? S.bf * 0.5 : S.bf, 4, dt)
      S.lat = damp(S.lat, S.inj > 0 ? 7 + Math.random() * 4 : 3.5 + Math.random() * 1.6, 3, dt)
      S.flush = damp(S.flush, S.inj > 0 ? 4 : 0.6, 4, dt)
      S.budget = damp(S.budget, S.inj > 0 ? 0.95 : 0.4, 3, dt)
      if (S.inj > 0) S.inj -= dt

      S.hist.push({ b: S.bf, p: S.pf })
      if (S.hist.length > 180) S.hist.shift()

      setMetrics({
        bf: S.bf,
        pf: S.pf,
        lat: S.lat,
        flush: S.flush,
        budget: S.budget
      })

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = 'rgba(239,238,232,.1)'
      ctx.beginPath()
      ctx.moveTo(0, canvas.height / 2)
      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()

      ctx.strokeStyle = 'rgba(239,238,232,.8)'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      S.hist.forEach((h, i) => {
        const x = (i / 180) * canvas.width
        const y = canvas.height - 4 - clamp(h.b / 130, 0, 1) * (canvas.height - 14)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      ctx.strokeStyle = '#FF4D00'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      S.hist.forEach((h, i) => {
        const x = (i / 180) * canvas.width
        const y = canvas.height - 4 - clamp(h.p / 130, 0, 1) * (canvas.height - 14)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = 'rgba(239,238,232,.6)'
      ctx.font = '500 9px IBM Plex Mono'
      ctx.fillText('— browser fps', 10, 14)
      ctx.fillStyle = 'rgba(255,107,51,.9)'
      ctx.fillText('— presented fps', 100, 14)

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const handleDirty = () => {
    stateRef.current.inj = 2
    toast('4 fields dirtied — one batch flush')
  }

  const handleDoc = () => {
    stateRef.current.inj = 3
    toast('Document activated — preload hit avoided')
  }

  return (
    <div className="page inksec" data-page="profiling" style={{ paddingTop: '80px', minHeight: '80vh' }}>
      <div className="wrap">
        <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '80px' }}>
          <div className="plate-h" style={{ marginBottom: '24px' }}>
            <span className="sq" />
            <span>Runtime Profiler &amp; Diagnostics</span>
            <span className="sp" />
            <span className="kbd">Live Telemetry</span>
          </div>

          <div className="plate" style={{ marginBottom: '28px' }}>
            <div className="plate-h">
              <span>Performance Metric Stream</span>
              <span className="sp" />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="tbtn" onClick={handleDirty}>
                  Dirty 4 fields (batch)
                </button>
                <button className="tbtn" onClick={handleDoc}>
                  Activate doc (preload hit)
                </button>
              </div>
            </div>
            <div className="plate-b">
              <div
                id="pfGrid"
                className="dtable"
                style={{
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  display: 'grid',
                  gap: '12px',
                  marginBottom: '16px'
                }}
              >
                <div className="plate" style={{ padding: '12px' }}>
                  <b style={{ display: 'block', fontSize: '11px', color: 'var(--mut)', marginBottom: '4px' }}>BrowserFPS</b>
                  <span className="mono" style={{ fontSize: '18px', color: 'var(--fg)' }}>{metrics.bf.toFixed(0)}</span>
                </div>
                <div className="plate" style={{ padding: '12px' }}>
                  <b style={{ display: 'block', fontSize: '11px', color: 'var(--mut)', marginBottom: '4px' }}>PresentedFPS</b>
                  <span className="mono" style={{ fontSize: '18px', color: 'var(--acc)' }}>{metrics.pf.toFixed(0)}</span>
                </div>
                <div className="plate" style={{ padding: '12px' }}>
                  <b style={{ display: 'block', fontSize: '11px', color: 'var(--mut)', marginBottom: '4px' }}>PaintPresent</b>
                  <span className="mono" style={{ fontSize: '18px', color: 'var(--fg)' }}>{metrics.lat.toFixed(1)} ms</span>
                </div>
                <div className="plate" style={{ padding: '12px' }}>
                  <b style={{ display: 'block', fontSize: '11px', color: 'var(--mut)', marginBottom: '4px' }}>StateFlushes</b>
                  <span className="mono" style={{ fontSize: '18px', color: 'var(--fg)' }}>{metrics.flush.toFixed(1)}</span>
                </div>
                <div className="plate" style={{ padding: '12px' }}>
                  <b style={{ display: 'block', fontSize: '11px', color: 'var(--mut)', marginBottom: '4px' }}>CEFBudget</b>
                  <span className="mono" style={{ fontSize: '18px', color: 'var(--fg)' }}>{(metrics.budget * 2).toFixed(2)} / 2.00 ms</span>
                </div>
              </div>

              <canvas
                ref={canvasRef}
                id="pfCv"
                height={160}
                style={{
                  width: '100%',
                  height: '160px',
                  background: 'rgba(0,0,0,.3)',
                  border: '1px solid var(--ln2)'
                }}
              />
            </div>
          </div>

          <div className="plate-h" style={{ marginBottom: '16px' }}>
            <span className="sq" />
            <span>Console Commands</span>
            <span className="sp" />
            <span className="kbd">Unreal ` ~ key</span>
          </div>

          <div id="cmdList" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {COMMANDS.map((c, i) => (
              <div key={i} className="cmd">
                <div className="cmd-h">
                  <code>{c.cmd}</code>
                  <button
                    className="cf-copy"
                    onClick={() => copyText(c.cmd)}
                    aria-label="Copy command"
                  >
                    <svg><use href="#i-copy" /></svg>copy
                  </button>
                </div>
                <div className="cmd-b">{c.desc}</div>
                <div className="cmd-out">{c.out}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
