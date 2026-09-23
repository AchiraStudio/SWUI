import React, { useState } from 'react'
import { CodeBlock } from '../components/common/CodeBlock'
import { toast } from '../utils/toast'

const PLATFORMS = [
  ['Windows x64', 'exp', 'Experimental', 'primary development target — needs validation'],
  ['Windows ARM64', 'exp', 'Experimental', 'needs validation'],
  ['macOS', 'val', 'Supported', 'desktop CEF runtime'],
  ['Linux', 'exp', 'Experimental', 'packaging validation in progress'],
  ['Android', 'no', 'Not supported', ''],
  ['iOS', 'no', 'Not supported', ''],
  ['PlayStation', 'no', 'Not supported', ''],
  ['Xbox', 'no', 'Not supported', ''],
  ['Nintendo Switch', 'no', 'Not supported', '']
]

const STATUS_ITEMS = [
  ['Core Unreal ↔ JavaScript interop model', 'val', 'Exists'],
  ['Generated bindings', 'dev', 'In development'],
  ['Preview workflow', 'dev', 'In development'],
  ['Event ergonomics', 'dev', 'In development'],
  ['Packaging', 'dev', 'In development'],
  ['Desktop runtime stability', 'val', 'Validation']
]

const INPUT_MODES = {
  game: [
    ['W A S D', 'game'],
    ['mouse look', 'game'],
    ['E interact', 'game'],
    ['I inventory', 'game (blocked)']
  ],
  both: [
    ['W A S D', 'game'],
    ['mouse look', 'game'],
    ['E interact', 'game'],
    ['I inventory', 'ui — opens document']
  ],
  ui: [
    ['W A S D', 'ui — document'],
    ['mouse', 'ui — document'],
    ['Esc', 'ui — releases focus']
  ]
}

export const ProductPage: React.FC = () => {
  const [loadBehavior, setLoadBehavior] = useState<'lazy' | 'eager'>('lazy')
  const [lazyProgress, setLazyProgress] = useState(0)
  const [lazyText, setLazyText] = useState('click to trigger lazy load')
  const [eagerText, setEagerText] = useState('click to activate resident document')
  const [activeInputMode, setActiveInputMode] = useState<'game' | 'both' | 'ui'>('both')
  const [transparencyMode, setTransparencyMode] = useState<'good' | 'bad'>('good')

  const handleTriggerLazy = () => {
    setLazyText('loading…')
    setLazyProgress(0)
    requestAnimationFrame(() => setLazyProgress(100))
    setTimeout(() => {
      setLazyText('activated — total: cold load + mount')
    }, 1450)
  }

  const handleTriggerEager = () => {
    setEagerText('activated — document already resident')
    toast('Eager: instant activation')
  }

  return (
    <div className="page paper" data-page="product" style={{ paddingTop: '72px' }}>
      <header className="pgh">
        <div className="wrap">
          <div className="eyebrow">Product</div>
          <h1>
            Built for production.<br />
            <em>Engineered for games.</em>
          </h1>
          <p className="lead">
            SWUI is an architectural layer for Unreal Engine 5 that allows UI engineers and technical artists to build production user interfaces with modern web standards without sacrificing gameplay determinism.
          </p>
        </div>
      </header>

      {/* Section 01: Core Capabilities */}
      <section className="sec" style={{ borderTop: 0 }}>
        <div className="wrap">
          <div className="shead">
            <span className="sidx">01</span>
            <span className="slbl">Load behaviors</span>
            <span className="srule" />
            <span className="stag">Eager vs Lazy</span>
          </div>

          <div className="rp-grid rv in">
            <div className="plate">
              <div className="plate-h">
                <span className="sq" />
                <span>Lazy Document Loading</span>
                <span className="sp" />
                <button className="tbtn pri" onClick={handleTriggerLazy}>
                  Trigger Load
                </button>
              </div>
              <div className="plate-b">
                <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--mut)' }}>
                  Cold load from disk / network upon activation request.
                </div>
                <div className="bar" style={{ width: '100%', height: '8px', background: 'var(--card2)', marginBottom: '12px' }}>
                  <i
                    style={{
                      width: `${lazyProgress}%`,
                      transition: lazyProgress ? 'width 1.4s ease-out' : 'none'
                    }}
                  />
                </div>
                <div className="mono" style={{ fontSize: '11px', color: 'var(--fg)' }}>
                  {lazyText}
                </div>
              </div>
            </div>

            <div className="plate">
              <div className="plate-h">
                <span className="sq" />
                <span>Eager Preloaded Document</span>
                <span className="sp" />
                <button className="tbtn pri" onClick={handleTriggerEager}>
                  Activate
                </button>
              </div>
              <div className="plate-b">
                <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--mut)' }}>
                  Resident in memory — zero-frame latency upon activation.
                </div>
                <div className="bar" style={{ width: '100%', height: '8px', background: 'var(--card2)', marginBottom: '12px' }}>
                  <i style={{ width: '100%', background: 'var(--ok)' }} />
                </div>
                <div className="mono" style={{ fontSize: '11px', color: 'var(--fg)' }}>
                  {eagerText}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 02: Input Enablement Modes */}
      <section className="sec">
        <div className="wrap">
          <div className="shead">
            <span className="sidx">02</span>
            <span className="slbl">Input Enablement</span>
            <span className="srule" />
            <span className="stag">Game · Both · UI</span>
          </div>

          <div className="rp-grid rv in">
            <div className="plate">
              <div className="plate-h">
                <span className="sq" />
                <span>Active Routing Mode</span>
                <span className="sp" />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className={`tbtn ${activeInputMode === 'game' ? 'on' : ''}`}
                    onClick={() => setActiveInputMode('game')}
                  >
                    Game only
                  </button>
                  <button
                    className={`tbtn ${activeInputMode === 'both' ? 'on' : ''}`}
                    onClick={() => setActiveInputMode('both')}
                  >
                    Game + UI
                  </button>
                  <button
                    className={`tbtn ${activeInputMode === 'ui' ? 'on' : ''}`}
                    onClick={() => setActiveInputMode('ui')}
                  >
                    UI only
                  </button>
                </div>
              </div>
              <div className="plate-b">
                <div
                  className="ir-trace"
                  style={{ minHeight: '140px' }}
                >
                  {INPUT_MODES[activeInputMode].map(([k, v], i) => (
                    <div key={i}>
                      <em>{k}</em> →{' '}
                      <span className={v.startsWith('ui') ? 'r' : 'g'}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="lead" style={{ fontSize: '14px', lineHeight: 1.7 }}>
                Input dispatching can be dynamically split between Slate, CEF, and Unreal Engine gameplay.
                In <b>Game + UI</b> mode, non-interactive documents let mouse clicks and gamepad inputs pass cleanly through to your player controller.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 03: Transparency Setup */}
      <section className="sec">
        <div className="wrap">
          <div className="shead">
            <span className="sidx">03</span>
            <span className="slbl">Alpha Transparency</span>
            <span className="srule" />
            <span className="stag">HUD Compositing</span>
          </div>

          <div className="rp-grid rv in">
            <div className="plate">
              <div className="plate-h">
                <span className="sq" />
                <span>Viewport Compositor</span>
                <span className="sp" />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className={`tbtn ${transparencyMode === 'good' ? 'on' : ''}`}
                    onClick={() => setTransparencyMode('good')}
                  >
                    Transparent
                  </button>
                  <button
                    className={`tbtn ${transparencyMode === 'bad' ? 'on' : ''}`}
                    onClick={() => setTransparencyMode('bad')}
                  >
                    Opaque (Buggy)
                  </button>
                </div>
              </div>
              <div className="plate-b">
                <div
                  style={{
                    height: '180px',
                    position: 'relative',
                    background: 'radial-gradient(circle at center, #1b2838 0%, #0d1217 100%)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div style={{ color: 'var(--mut)', font: '500 12px var(--mono)' }}>
                    [3D Game World Background]
                  </div>

                  {/* Bad overlay */}
                  {transparencyMode === 'bad' && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#111',
                        font: '600 13px var(--mono)'
                      }}
                    >
                      ⚠ Opaque White Background (Missing CSS Transparency)
                    </div>
                  )}

                  {/* Good overlay */}
                  {transparencyMode === 'good' && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '20px',
                        right: '20px',
                        padding: '8px 16px',
                        background: 'rgba(0,0,0,0.6)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'var(--bone)',
                        font: '600 14px var(--mono)'
                      }}
                    >
                      Ammo: 30 / 120
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <CodeBlock snipKey="trcss" file="hud.css" lang="css" theme="l" showLineNumbers={false} />
            </div>
          </div>
        </div>
      </section>

      {/* Section 04: Platforms & Matrix */}
      <section className="sec">
        <div className="wrap">
          <div className="shead">
            <span className="sidx">04</span>
            <span className="slbl">Platform Matrix</span>
            <span className="srule" />
            <span className="stag">Target Platforms</span>
          </div>
          <div className="sec-top">
            <h2 className="display" style={{ fontSize: 'clamp(26px,3vw,44px)' }}>
              A desktop CEF runtime.<br />
              <span className="si">stated plainly.</span>
            </h2>
          </div>

          <div className="matrix rv in" id="platformMx">
            <div className="mrow h">
              <span>Platform</span>
              <span>Status</span>
              <span>Notes</span>
            </div>
            {PLATFORMS.map(([p, cls, st, note], i) => (
              <div key={i} className="mrow">
                <span className="mp">{p}</span>
                <span>
                  <span className={`badge ${cls}`}>{st}</span>
                </span>
                <span className="ms">{note}</span>
              </div>
            ))}
          </div>

          <div className="shead" style={{ marginTop: '64px' }}>
            <span className="sidx">05</span>
            <span className="slbl">Project status</span>
            <span className="srule" />
            <span className="stag">As-is, not as marketing</span>
          </div>
          <div className="sec-top">
            <h2 className="display" style={{ fontSize: 'clamp(26px,3vw,44px)' }}>
              Where the project<br />
              <span className="si">actually is.</span>
            </h2>
          </div>

          <div className="matrix rv in" id="statusMx">
            {STATUS_ITEMS.map(([title, cls, st], i) => (
              <div key={i} className="mrow">
                <span className="mp">{title}</span>
                <span>
                  <span className={`badge ${cls}`}>{st}</span>
                </span>
                <span className="ms">stated as-is, not as marketing</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
