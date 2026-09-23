import React, { useState, useEffect } from 'react'

const LIFECYCLE_STATES: Record<string, { desc: string; next: string }> = {
  UNLOADED: {
    desc: 'Asset exists on disk (Content/UI/...). Zero runtime memory or CEF resources.',
    next: 'LOADING'
  },
  LOADING: {
    desc: 'CEF navigates to the URL or HTML file. Resources, stylesheets and JavaScript bundles execute.',
    next: 'PRELOADED'
  },
  PRELOADED: {
    desc: 'DOM ready, scripts executed, initial state bound, but hidden from viewport. Zero paint cost.',
    next: 'ACTIVE'
  },
  ACTIVE: {
    desc: 'Presented on the viewport via Slate. Actively ticking, receiving input and rendering at target FPS.',
    next: 'SLEEPING'
  },
  SLEEPING: {
    desc: 'Suspended via WasHidden. Chromium genuinely pauses rAF, timers, and compositor work.',
    next: 'ACTIVE'
  },
  UNLOADING: {
    desc: 'Browser closed, DXGI shared textures released, Slate slate-texture freed, memory reclaimed.',
    next: 'UNLOADED'
  }
}

export const LifecycleSection: React.FC = () => {
  const [currentState, setCurrentState] = useState<keyof typeof LIFECYCLE_STATES>('ACTIVE')
  const [isAuto, setIsAuto] = useState(false)

  useEffect(() => {
    if (!isAuto) return
    const interval = setInterval(() => {
      setCurrentState(s => LIFECYCLE_STATES[s].next as any)
    }, 2000)
    return () => clearInterval(interval)
  }, [isAuto])

  return (
    <section className="sec">
      <div className="wrap">
        <div className="shead">
          <span className="sidx">02</span>
          <span className="slbl">Lifecycle</span>
          <span className="srule" />
          <span className="stag">State machine</span>
        </div>
        <div className="sec-top">
          <h2 className="display" style={{ fontSize: 'clamp(26px,3vw,46px)' }}>
            Deterministic lifecycle.<br />
            <span className="si">Zero phantom memory.</span>
          </h2>
        </div>

        <div className="plate rv in">
          <div className="plate-h">
            <span className="sq" />
            Document State Machine
            <span className="sp" />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="tbtn pri"
                onClick={() => {
                  setIsAuto(false)
                  setCurrentState(LIFECYCLE_STATES[currentState].next as any)
                }}
              >
                Next Step →
              </button>
              <button
                className={`tbtn ${isAuto ? 'on' : ''}`}
                onClick={() => setIsAuto(!isAuto)}
              >
                {isAuto ? 'Pause Auto' : 'Auto Play'}
              </button>
            </div>
          </div>

          <div className="plate-b">
            {/* Interactive State Nodes Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
                marginBottom: '20px'
              }}
            >
              {Object.keys(LIFECYCLE_STATES).map(key => (
                <button
                  key={key}
                  className={`lc-node ${currentState === key ? 'active' : ''}`}
                  onClick={() => {
                    setIsAuto(false)
                    setCurrentState(key as any)
                  }}
                  style={{
                    position: 'relative',
                    padding: '14px 10px',
                    border: currentState === key ? '1px solid var(--blaze)' : '1px solid var(--ln)',
                    background: currentState === key ? 'var(--card2)' : 'var(--card)',
                    color: currentState === key ? 'var(--blaze)' : 'var(--fg)',
                    font: '600 11px var(--mono)',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Current State Info */}
            <div
              className="plate"
              style={{ padding: '16px 20px', background: 'var(--card2)', border: '1px solid var(--ln2)' }}
            >
              <div className="mono acc" style={{ fontSize: '12px', marginBottom: '6px' }}>
                // Current State: {currentState}
              </div>
              <p style={{ font: '400 14px/1.7 var(--sans)', color: 'var(--fg)', margin: 0 }}>
                {LIFECYCLE_STATES[currentState].desc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

