import React, { useState } from 'react'

const MENU_ITEMS = [
  'Gameplay & HUD Settings',
  'Display & Frame Budget',
  'Audio & Volume Mix',
  'Controller & Navigation Binds'
]

export const InputSection: React.FC = () => {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [navLog, setNavLog] = useState<string[]>([
    'swui.navigation.ready (focus initialized to index 0)'
  ])

  const addLog = (event: string) => {
    setNavLog(prev => [event, ...prev.slice(0, 5)])
  }

  const handleNav = (dir: 'up' | 'down' | 'left' | 'right') => {
    if (dir === 'up') {
      setFocusedIndex(i => (i - 1 + MENU_ITEMS.length) % MENU_ITEMS.length)
      addLog('swui.navigation.onNavigate("up")')
    } else if (dir === 'down') {
      setFocusedIndex(i => (i + 1) % MENU_ITEMS.length)
      addLog('swui.navigation.onNavigate("down")')
    } else {
      addLog(`swui.navigation.onNavigate("${dir}")`)
    }
  }

  const handleConfirm = () => {
    addLog(`swui.navigation.onConfirm() → selected "${MENU_ITEMS[focusedIndex]}"`)
  }

  const handleCancel = () => {
    addLog('swui.navigation.onCancel() → back/close')
  }

  const handleTab = (dir: 'next' | 'prev') => {
    addLog(`swui.navigation.on${dir === 'next' ? 'Next' : 'Previous'}Tab()`)
  }

  return (
    <section className="sec">
      <div className="wrap">
        <div className="shead">
          <span className="sidx">06</span>
          <span className="slbl">Input routing</span>
          <span className="srule" />
          <span className="stag">Virtual Gamepad Controller</span>
        </div>
        <div className="sec-top">
          <h2 className="display" style={{ fontSize: 'clamp(26px,3vw,46px)' }}>
            Gamepad-grade navigation.<br />
            <span className="si">No brittle synthetic events.</span>
          </h2>
        </div>

        <div className="grid2 rv in">
          {/* Virtual controller & buttons */}
          <div className="plate">
            <div className="plate-h">
              <span className="sq" />
              Gamepad Input Simulator
            </div>
            <div className="plate-b">
              {/* D-Pad and Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: '20px 0' }}>
                {/* D-pad */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 36px)', gap: '4px' }}>
                  <span />
                  <button className="tbtn" onClick={() => handleNav('up')} aria-label="Up">▲</button>
                  <span />
                  <button className="tbtn" onClick={() => handleNav('left')} aria-label="Left">◀</button>
                  <span style={{ background: 'var(--card2)' }} />
                  <button className="tbtn" onClick={() => handleNav('right')} aria-label="Right">▶</button>
                  <span />
                  <button className="tbtn" onClick={() => handleNav('down')} aria-label="Down">▼</button>
                  <span />
                </div>

                {/* Face Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="tbtn" onClick={() => handleTab('prev')}>[LB] Prev</button>
                    <button className="tbtn" onClick={() => handleTab('next')}>[RB] Next</button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="tbtn pri" onClick={handleConfirm}>[A] Confirm</button>
                    <button className="tbtn" onClick={handleCancel}>[B] Cancel</button>
                  </div>
                </div>
              </div>

              {/* Navigation log */}
              <div
                className="ir-trace"
                style={{ minHeight: '120px' }}
                dangerouslySetInnerHTML={{ __html: navLog.map(l => `<span class="r">${l}</span>`).join('<br>') }}
              />
            </div>
          </div>

          {/* Focused Menu Simulation */}
          <div className="plate">
            <div className="plate-h">
              <span className="sq" />
              Simulated Menu Navigation Surface
            </div>
            <div className="plate-b">
              <div id="gmMenu" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {MENU_ITEMS.map((item, idx) => (
                  <div
                    key={idx}
                    className={`gm-item ${idx === focusedIndex ? 'foc' : ''}`}
                    onClick={() => {
                      setFocusedIndex(idx)
                      addLog(`focus moved to "${item}"`)
                    }}
                    style={{
                      padding: '12px 16px',
                      background: idx === focusedIndex ? 'var(--card2)' : 'var(--card)',
                      border: idx === focusedIndex ? '1px solid var(--blaze)' : '1px solid var(--ln2)',
                      color: idx === focusedIndex ? 'var(--blaze)' : 'var(--fg)',
                      font: '600 13px var(--mono)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{item}</span>
                    {idx === focusedIndex && <span className="chip on">FOCUSED</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

