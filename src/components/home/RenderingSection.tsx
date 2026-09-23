import React, { useState } from 'react'

export const RenderingSection: React.FC = () => {
  const [renderMode, setRenderMode] = useState<'gpu' | 'cpu'>('gpu')
  const [hp, setHp] = useState(84)
  const [ammo, setAmmo] = useState(24)
  const [dirtyFlash, setDirtyFlash] = useState<string | null>(null)

  const triggerHpChange = (newHp: number) => {
    setHp(newHp)
    setDirtyFlash('hp')
    setTimeout(() => setDirtyFlash(null), 500)
  }

  const triggerAmmoChange = (newAmmo: number) => {
    setAmmo(newAmmo)
    setDirtyFlash('ammo')
    setTimeout(() => setDirtyFlash(null), 500)
  }

  return (
    <section className="sec">
      <div className="wrap">
        <div className="shead">
          <span className="sidx">05</span>
          <span className="slbl">Rendering &amp; ROI</span>
          <span className="srule" />
          <span className="stag">GPU Shared Texture + Partial Blits</span>
        </div>
        <div className="sec-top">
          <h2 className="display" style={{ fontSize: 'clamp(26px,3vw,46px)' }}>
            High-throughput compositing.<br />
            <span className="si">Paint only what changed.</span>
          </h2>
        </div>

        <div className="grid2 rv in">
          {/* Render Path Toggle */}
          <div className="plate">
            <div className="plate-h">
              <span className="sq" />
              RHI Render Pipeline
              <span className="sp" />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className={`tbtn ${renderMode === 'gpu' ? 'pri' : ''}`}
                  onClick={() => setRenderMode('gpu')}
                >
                  GPU Shared
                </button>
                <button
                  className={`tbtn ${renderMode === 'cpu' ? 'pri' : ''}`}
                  onClick={() => setRenderMode('cpu')}
                >
                  CPU Fallback
                </button>
              </div>
            </div>
            <div className="plate-b">
              {renderMode === 'gpu' ? (
                <div>
                  <h4 style={{ fontSize: '15px', color: 'var(--ok)', marginBottom: '8px' }}>
                    Direct3D 11 / DXGI Shared Handle
                  </h4>
                  <p style={{ font: '400 13px/1.6 var(--sans)', color: 'var(--mut)', marginBottom: '14px' }}>
                    Chromium renders into a DXGI shared texture resource. The Unreal RHI consumes the texture handle directly with zero staging through host system memory.
                  </p>
                  <div className="tele" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div><b>Latency</b><span>1.2 ms</span></div>
                    <div><b>CPU Copy Overhead</b><span>0.0 MB/s</span></div>
                    <div><b>Throughput</b><span>Full Display Rate (144+ FPS)</span></div>
                    <div><b>Color Format</b><span>B8G8R8A8_UNORM</span></div>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 style={{ fontSize: '15px', color: 'var(--warn)', marginBottom: '8px' }}>
                    Full-Surface CPU Software Renderer
                  </h4>
                  <p style={{ font: '400 13px/1.6 var(--sans)', color: 'var(--mut)', marginBottom: '14px' }}>
                    Software-rendered BGRA bitmap buffer double-buffered in host RAM, uploaded to RHI via UpdateTexture. Kept as fallback for non-DXGI targets.
                  </p>
                  <div className="tele" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div><b>Latency</b><span>6.8 ms</span></div>
                    <div><b>Memory Copy</b><span>~33 MB/frame (4K)</span></div>
                    <div><b>Throughput</b><span>60 FPS Cap</span></div>
                    <div><b>Allocation</b><span>Double-buffered host RAM</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ROI Visualizer */}
          <div className="plate">
            <div className="plate-h">
              <span className="sq" />
              ROI (Region of Interest) Visualizer
              <span className="sp" />
              <span className="kbd">Dirty Rect Tracking</span>
            </div>
            <div className="plate-b">
              {/* Controls */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <button
                  className="tbtn"
                  onClick={() => triggerHpChange(Math.max(10, hp - 10))}
                >
                  Damage HP ({hp})
                </button>
                <button
                  className="tbtn"
                  onClick={() => triggerAmmoChange(Math.max(0, ammo - 1))}
                >
                  Fire Ammo ({ammo})
                </button>
              </div>

              {/* Viewport simulation */}
              <div
                style={{
                  height: '180px',
                  background: '#090b0e',
                  border: '1px solid var(--ln2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Health dirty box */}
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    padding: '8px 12px',
                    border: dirtyFlash === 'hp' ? '2px solid var(--blaze)' : '1px dashed rgba(255,255,255,0.15)',
                    background: dirtyFlash === 'hp' ? 'rgba(255,77,0,0.15)' : 'transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--mut)', marginBottom: '4px' }}>
                    Dirty Rect #1 (Vitals)
                  </div>
                  <div style={{ font: '600 13px var(--mono)', color: 'var(--fg)' }}>
                    HP: {hp} / 100
                  </div>
                </div>

                {/* Ammo dirty box */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    right: '16px',
                    padding: '8px 12px',
                    border: dirtyFlash === 'ammo' ? '2px solid var(--ok)' : '1px dashed rgba(255,255,255,0.15)',
                    background: dirtyFlash === 'ammo' ? 'rgba(95,169,122,0.15)' : 'transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--mut)', marginBottom: '4px' }}>
                    Dirty Rect #2 (Ammo)
                  </div>
                  <div style={{ font: '600 13px var(--mono)', color: 'var(--fg)' }}>
                    AMMO: {ammo} / 180
                  </div>
                </div>

                {/* Static center element (never dirty) */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%,-50%)',
                    color: 'var(--mut)',
                    font: '400 11px var(--mono)'
                  }}
                >
                  [Crosshair: Static — 0 Repaints]
                </div>
              </div>
              <div className="mono dim" style={{ fontSize: '10px', marginTop: '8px' }}>
                92% of surface unchanged · blitting only changed rectangles saves GPU bandwidth.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
