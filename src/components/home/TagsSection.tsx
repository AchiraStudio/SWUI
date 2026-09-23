import React, { useState } from 'react'

const BP_NODES = [
  { id: 'begin', title: 'BeginPlay', cat: 'Event', color: '#EFEEE8', desc: 'Standard Unreal actor event entry point.' },
  { id: 'iface', title: 'Create Interface', cat: 'SWUI', color: '#FF4D00', desc: 'Creates the SWUI bridge instance and binds lifecycle.' },
  { id: 'load', title: 'Load Document', cat: 'SWUI', color: '#FF4D00', desc: 'Allocates browser view, loads Entry URL, mounts CEF instance.' },
  { id: 'act', title: 'Activate Document', cat: 'SWUI', color: '#FF4D00', desc: 'Presents document on viewport via Slate, enables input.' },
  { id: 'obs1', title: 'SwuiObserve (Weapon.Spread)', cat: 'Blueprint Reflection', color: '#5FA97A', desc: 'Marks Weapon.CurrentSpread to be published to web state automatically on tick.' },
  { id: 'obs2', title: 'SwuiObserveEvent (OnFired)', cat: 'Event Dispatcher', color: '#D96A5A', desc: 'Reflects Blueprint event dispatcher into TypeScript event subscriber.' }
]

export const TagsSection: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState(BP_NODES[1])

  return (
    <section className="sec">
      <div className="wrap">
        <div className="shead">
          <span className="sidx">07</span>
          <span className="slbl">Blueprint &amp; GameplayTags</span>
          <span className="srule" />
          <span className="stag">Unreal as Source of Truth</span>
        </div>
        <div className="sec-top">
          <h2 className="display" style={{ fontSize: 'clamp(26px,3vw,46px)' }}>
            Blueprint graph →<br />
            <span className="si">Generated TypeScript contract.</span>
          </h2>
          <p className="lead" style={{ alignSelf: 'center' }}>
            No hand-written bridge C++ classes. Put <code>SwuiObserve</code> nodes in your character or HUD Blueprint, and SWUI extracts the contract directly from Unreal reflection.
          </p>
        </div>

        <div className="grid2 rv in">
          {/* Blueprint Visual Graph Nodes */}
          <div className="plate">
            <div className="plate-h">
              <span className="sq" />
              Blueprint Graph Visualizer
              <span className="sp" />
              <span className="kbd">CLICK NODE TO INSPECT</span>
            </div>
            <div className="plate-b" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              {BP_NODES.map(node => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  style={{
                    padding: '12px',
                    background: selectedNode.id === node.id ? 'var(--card2)' : 'var(--card)',
                    border: selectedNode.id === node.id ? `2px solid ${node.color}` : '1px solid var(--ln)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div className="mono" style={{ fontSize: '9px', color: node.color, marginBottom: '4px' }}>
                    {node.cat}
                  </div>
                  <div style={{ font: '600 12px var(--sans)', color: 'var(--fg)' }}>
                    {node.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Node Inspector */}
          <div className="plate">
            <div className="plate-h">
              <span className="sq" />
              Node Contract Inspector
            </div>
            <div className="plate-b">
              <div className="mono acc" style={{ fontSize: '11px', marginBottom: '8px' }}>
                // {selectedNode.cat} Node: {selectedNode.title}
              </div>
              <p style={{ font: '400 14px/1.7 var(--sans)', color: 'var(--fg)', marginBottom: '16px' }}>
                {selectedNode.desc}
              </p>
              <div className="tele" style={{ gridTemplateColumns: '1fr' }}>
                <div>
                  <b>Reflection Target</b>
                  <span className="mono">USwuiBlueprintLibrary</span>
                </div>
                <div>
                  <b>Execution Phase</b>
                  <span className="mono">Game Thread / PostActorTick</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
