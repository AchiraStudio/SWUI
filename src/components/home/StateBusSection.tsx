import React, { useState } from 'react'

export const StateBusSection: React.FC = () => {
  const [hp, setHp] = useState(88)
  const [ammo, setAmmo] = useState(24)
  const [shield, setShield] = useState(75)
  const [spread, setSpread] = useState(0.3)
  const [mode, setMode] = useState('EXPANDED')
  const [canInteract, setCanInteract] = useState(true)
  const [prompt, setPrompt] = useState('Open crate')

  return (
    <section className="sec">
      <div className="wrap">
        <div className="shead">
          <span className="sidx">03</span>
          <span className="slbl">State Bus</span>
          <span className="srule" />
          <span className="stag">Multi-subscriber pub/sub</span>
        </div>
        <div className="sec-top">
          <h2 className="display" style={{ fontSize: 'clamp(26px,3vw,46px)' }}>
            Publish once.<br />
            <span className="si">Every subscriber updates.</span>
          </h2>
          <p className="lead" style={{ alignSelf: 'center' }}>
            Unreal properties and GameplayTags publish to the SWUI state bus. Every mounted document and hook gets the latest values in an atomic frame batch.
          </p>
        </div>

        <div className="grid2 rv in">
          {/* Controls */}
          <div className="plate">
            <div className="plate-h">
              <span className="sq" />
              Unreal State Publisher
            </div>
            <div className="plate-b">
              <div className="frow">
                <label>PlayerHealth ({hp})</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={hp}
                  onChange={e => setHp(+e.target.value)}
                />
              </div>
              <div className="frow">
                <label>Ammo ({ammo})</label>
                <input
                  type="number"
                  value={ammo}
                  onChange={e => setAmmo(+e.target.value)}
                />
              </div>
              <div className="frow">
                <label>Shield ({shield})</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={shield}
                  onChange={e => setShield(+e.target.value)}
                />
              </div>
              <div className="frow">
                <label>CrosshairMode</label>
                <select value={mode} onChange={e => setMode(e.target.value)}>
                  <option value="EXPANDED">EXPANDED</option>
                  <option value="PRECISE">PRECISE</option>
                  <option value="SNIPER">SNIPER</option>
                </select>
              </div>
              <div className="frow">
                <label>Interaction.Prompt</label>
                <input
                  type="text"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <input
                  type="checkbox"
                  id="sbCi"
                  checked={canInteract}
                  onChange={e => setCanInteract(e.target.checked)}
                />
                <label htmlFor="sbCi" className="mono" style={{ fontSize: '12px' }}>
                  Interaction.bCanInteract
                </label>
              </div>
            </div>
          </div>

          {/* Subscribers */}
          <div className="plate">
            <div className="plate-h">
              <span className="sq" />
              Active Web Document Subscribers
            </div>
            <div className="plate-b" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="sb-sub">
                <h5>HUD <span className="ls">PlayerHealth · Ammo · Spread</span></h5>
                <div className="val">
                  <span style={{ color: 'var(--ok)' }}>HP {hp}</span> · AMMO{' '}
                  <span className="acc">{ammo}</span> · MODE {mode}
                </div>
              </div>
              <div className="sb-sub">
                <h5>Inventory <span className="ls">Ammo · CanInteract</span></h5>
                <div className="val">
                  ammo {ammo} · interact {canInteract ? 'yes' : 'no'}
                </div>
              </div>
              <div className="sb-sub">
                <h5>Dialogue <span className="ls">Prompt · CanInteract</span></h5>
                <div className="val">
                  "{prompt}" {canInteract ? '· [E]' : ''}
                </div>
              </div>
              <div className="sb-sub">
                <h5>Debug UI <span className="ls">all fields</span></h5>
                <div className="val mono" style={{ fontSize: '10px', whiteSpace: 'pre' }}>
                  {JSON.stringify({ PlayerHealth: hp, Ammo: ammo, Shield: shield, Prompt: prompt }, null, 1)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
