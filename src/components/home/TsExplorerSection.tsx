import React, { useState } from 'react'
import { CodeBlock } from '../common/CodeBlock'

const FIELDS = [
  { n: 'Player.Health', t: 'number' },
  { n: 'Player.Shield', t: 'number' },
  { n: 'Weapon.CurrentAmmo', t: 'number' },
  { n: 'Weapon.CurrentSpread', t: 'number' },
  { n: 'HUDState.CrosshairMode', t: "'PRECISE' | 'EXPANDED' | 'SNIPER'" },
  { n: 'Interaction.bCanInteract', t: 'boolean' },
  { n: 'Interaction.Prompt', t: 'string' }
]

const EVENTS = [
  { n: 'Weapon.OnPlayerFiredShot', t: '(e) => void' },
  { n: 'Combat.OnHitConfirmed', t: '(e) => void' },
  { n: 'Weapon.Reload', t: '() => void' }
]

export const TsExplorerSection: React.FC = () => {
  const [inputVal, setInputVal] = useState('')
  const [showSug, setShowSug] = useState(false)

  const suggestions = FIELDS.filter(f =>
    f.n.toLowerCase().includes(inputVal.replace('swui.state.', '').toLowerCase())
  )

  return (
    <section className="sec">
      <div className="wrap">
        <div className="shead">
          <span className="sidx">08</span>
          <span className="slbl">TypeScript Typegen</span>
          <span className="srule" />
          <span className="stag">Compile-time safety</span>
        </div>
        <div className="sec-top">
          <h2 className="display" style={{ fontSize: 'clamp(26px,3vw,46px)' }}>
            Unreal defines.<br />
            <span className="si">TypeScript autocompletes.</span>
          </h2>
        </div>

        <div className="grid2 rv in">
          {/* Observed properties & reflection */}
          <div className="plate">
            <div className="plate-h">
              <span className="sq" />
              Observed Blueprint Reflection List
            </div>
            <div className="plate-b" style={{ padding: 0 }}>
              <div id="tsObs" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {FIELDS.map(f => (
                  <div
                    key={f.n}
                    className="ts-orow"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--ln2)',
                      font: '400 12px var(--mono)'
                    }}
                  >
                    <span>{f.n}</span>
                    <span className="ty dim" style={{ color: 'var(--acc)' }}>state · {f.t}</span>
                  </div>
                ))}
                {EVENTS.map(e => (
                  <div
                    key={e.n}
                    className="ts-orow"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--ln2)',
                      font: '400 12px var(--mono)'
                    }}
                  >
                    <span>{e.n}</span>
                    <span className="ty dim" style={{ color: 'var(--ok)' }}>event · {e.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Generated Code & Autocomplete Playground */}
          <div>
            <CodeBlock snipKey="gen" file="bindings.gen.ts" lang="ts" theme="d" />

            {/* Interactive Autocomplete Sandbox */}
            <div className="plate" style={{ marginTop: '14px' }}>
              <div className="plate-h">
                <span className="sq" />
                IDE Autocomplete Simulator
              </div>
              <div className="plate-b">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="mono" style={{ color: 'var(--mut)', fontSize: '13px' }}>
                    const spread = swui.state.get(
                  </span>
                  <input
                    type="text"
                    value={inputVal}
                    onChange={e => {
                      setInputVal(e.target.value)
                      setShowSug(true)
                    }}
                    onFocus={() => setShowSug(true)}
                    placeholder="'Weapon."
                    style={{
                      padding: '4px 8px',
                      background: 'var(--card2)',
                      border: '1px solid var(--ln)',
                      color: 'var(--blaze)',
                      font: '600 12px var(--mono)',
                      width: '180px'
                    }}
                  />
                  <span className="mono" style={{ color: 'var(--mut)', fontSize: '13px' }}>)</span>
                </div>

                {showSug && suggestions.length > 0 && (
                  <div
                    style={{
                      background: 'var(--card2)',
                      border: '1px solid var(--ln)',
                      padding: '6px',
                      borderRadius: '4px',
                      marginTop: '6px'
                    }}
                  >
                    <div className="mono dim" style={{ fontSize: '9px', marginBottom: '4px' }}>
                      SUGGESTIONS FROM BINDINGS.GEN.TS:
                    </div>
                    {suggestions.map(s => (
                      <div
                        key={s.n}
                        onClick={() => {
                          setInputVal(`'${s.n}'`)
                          setShowSug(false)
                        }}
                        style={{
                          padding: '4px 8px',
                          cursor: 'pointer',
                          font: '500 11px var(--mono)',
                          color: 'var(--fg)'
                        }}
                      >
                        '{s.n}' : <span style={{ color: 'var(--mut)' }}>{s.t}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

