import React, { useState } from 'react'

interface DocCard {
  id: string
  name: string
  state: 'ACTIVE' | 'SLEEPING' | 'UNLOADED' | 'LOADING'
  z: number
  persist: boolean
  desc: string
}

const INITIAL_DOCS: DocCard[] = [
  { id: 'hud', name: 'hud.html', state: 'ACTIVE', z: 10, persist: true, desc: 'Persistent across level travel · layer: level · lockstep' },
  { id: 'pause', name: 'pause.html', state: 'SLEEPING', z: 20, persist: false, desc: 'Suspended via WasHidden · ticks when world is paused' },
  { id: 'chat', name: 'chat.html', state: 'UNLOADED', z: 15, persist: false, desc: 'Cold asset in Content/UI/chat.html · zero memory footprint' },
  { id: 'minimap', name: 'minimap.html', state: 'ACTIVE', z: 5, persist: true, desc: 'Subscribed to player telemetry and world coordinates' }
]

export const DocStackSection: React.FC = () => {
  const [docs, setDocs] = useState<DocCard[]>(INITIAL_DOCS)
  const [selectedId, setSelectedId] = useState('hud')

  const selectedDoc = docs.find(d => d.id === selectedId) || docs[0]

  const setDocState = (id: string, newState: DocCard['state']) => {
    setDocs(prev => prev.map(d => (d.id === id ? { ...d, state: newState } : d)))
  }

  return (
    <section className="sec">
      <div className="wrap">
        <div className="shead">
          <span className="sidx">01</span>
          <span className="slbl">Document stack</span>
          <span className="srule" />
          <span className="stag">Multi-surface architecture</span>
        </div>
        <div className="sec-top">
          <h2 className="display" style={{ fontSize: 'clamp(26px,3vw,46px)' }}>
            One runtime.<br />
            <span className="si">Many layered surfaces.</span>
          </h2>
          <p className="lead" style={{ alignSelf: 'center' }}>
            SWUI doesn't force your entire game UI into a single monolithic document. HUD overlays, modal menus, inventory screens, and debug widgets each live in dedicated documents.
          </p>
        </div>

        <div className="grid2 rv in">
          {/* Document list */}
          <div className="plate">
            <div className="plate-h">
              <span className="sq" />
              Registered Document Assets
              <span className="sp" />
              <span className="kbd">Z-ORDER RESOLUTION</span>
            </div>
            <div className="plate-b" style={{ padding: 0 }}>
              <div id="docList">
                {docs.map(doc => (
                  <div
                    key={doc.id}
                    className={`drow ${doc.id === selectedId ? 'on' : ''}`}
                    onClick={() => setSelectedId(doc.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 18px',
                      borderBottom: '1px solid var(--ln2)',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div className="dn" style={{ font: '600 13.5px var(--sans)' }}>
                        {doc.name}
                      </div>
                      <div className="dim mono" style={{ fontSize: '10.5px' }}>
                        Z: {doc.z} · {doc.persist ? 'Persistent' : 'Transient'}
                      </div>
                    </div>
                    <span
                      className="chip"
                      style={{
                        color:
                          doc.state === 'ACTIVE'
                            ? 'var(--ok)'
                            : doc.state === 'SLEEPING'
                            ? 'var(--warn)'
                            : 'var(--mut)'
                      }}
                    >
                      {doc.state}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Document Controls & Inspector */}
          <div className="plate">
            <div className="plate-h">
              <span className="sq" />
              Document Lifecycle Controller
            </div>
            <div className="plate-b">
              <h4 style={{ fontSize: '18px', marginBottom: '8px' }}>{selectedDoc.name}</h4>
              <p className="lead" style={{ fontSize: '13px', marginBottom: '18px' }}>
                {selectedDoc.desc}
              </p>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <button
                  className={`tbtn ${selectedDoc.state === 'ACTIVE' ? 'pri' : ''}`}
                  onClick={() => setDocState(selectedDoc.id, 'ACTIVE')}
                >
                  Activate
                </button>
                <button
                  className={`tbtn ${selectedDoc.state === 'SLEEPING' ? 'on' : ''}`}
                  onClick={() => setDocState(selectedDoc.id, 'SLEEPING')}
                >
                  Sleep (WasHidden)
                </button>
                <button
                  className={`tbtn ${selectedDoc.state === 'UNLOADED' ? 'on' : ''}`}
                  onClick={() => setDocState(selectedDoc.id, 'UNLOADED')}
                >
                  Unload
                </button>
                <button
                  className={`tbtn ${selectedDoc.state === 'LOADING' ? 'on' : ''}`}
                  onClick={() => setDocState(selectedDoc.id, 'LOADING')}
                >
                  Preload
                </button>
              </div>

              <div className="tele" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div><b>State</b><span>{selectedDoc.state}</span></div>
                <div><b>Z-Index</b><span>{selectedDoc.z}</span></div>
                <div><b>Persistence</b><span>{selectedDoc.persist ? 'Level travel' : 'Per level'}</span></div>
                <div><b>Memory</b><span>{selectedDoc.state === 'UNLOADED' ? '0 MB' : 'Allocated'}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
