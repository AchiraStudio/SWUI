import React, { useState } from 'react'

const ARCH_STACK = [
  {
    t: 'Web application',
    d: 'The presentation layer you already know how to build. Plain HTML and CSS, or React, Vue, Svelte, or Vite-built bundles. SWUI places no framework requirement — the delivered artifact is static web content.',
    tags: ['HTML', 'CSS', 'JS', 'TS', 'React', 'Vue', 'Svelte']
  },
  {
    t: 'CEF / Chromium',
    d: 'An embedded Chromium provides Blink, V8, the DOM and the compositor. SWUI treats it as a controllable render backend: frame production can be driven externally, and hidden documents can be genuinely suspended.',
    tags: ['Blink', 'V8', 'DOM', 'Compositor']
  },
  {
    t: 'USwuiDocumentManagerSubsystem',
    d: 'The heart of the runtime. Central ticking for all documents, CEF message-loop work within a per-frame budget, state batching, the document registry, lifecycle, Z-order management, hit testing, input routing, level persistence and non-persistent cleanup.',
    tags: ['ticking', 'batching', 'registry', 'z-order', 'hit test', 'persistence']
  },
  {
    t: 'USwuiDocument · USwuiView · FSwuiScheduler',
    d: 'The document owns the lifecycle. The view owns the browser and rendering surface. The scheduler controls how the document and its browser update — when to tick, when to sleep. Slate presents the resulting surface inside Unreal.',
    tags: ['document', 'view', 'scheduler']
  },
  {
    t: 'Unreal',
    d: 'Slate presents the UI. The RHI consumes rendered textures. Gameplay, Blueprint and GameplayTags remain the source of truth for state and events — the web layer only subscribes and emits.',
    tags: ['Slate', 'RHI', 'Gameplay', 'Blueprint', 'GameplayTags']
  }
]

export const ArchitecturePage: React.FC = () => {
  const [selectedSubsystem, setSelectedSubsystem] = useState(2)
  const [litNodeIndex, setLitNodeIndex] = useState(-1)

  // Level travel states
  const [lt1Rows, setLt1Rows] = useState([
    ['Persistent HUD', 'ACTIVE', 'var(--ok)'],
    ['Level HUD', 'ACTIVE', 'var(--ok)'],
    ['Inventory', 'SLEEPING', 'var(--warn)']
  ])
  const [lt2Rows, setLt2Rows] = useState([
    ['Persistent HUD', 'SLEEPING', 'var(--warn)'],
    ['Level HUD', 'UNLOADED', 'var(--mut)'],
    ['Inventory', 'UNLOADED', 'var(--mut)']
  ])

  const handleRunUnload = () => {
    setLitNodeIndex(-1)
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        setLitNodeIndex(i)
      }, i * 380)
    }
  }

  const handleRunTravel = () => {
    setLt1Rows([
      ['Persistent HUD', 'ACTIVE', 'var(--ok)'],
      ['Level HUD', 'ACTIVE', 'var(--ok)'],
      ['Inventory', 'SLEEPING', 'var(--warn)']
    ])
    setTimeout(() => {
      setLt1Rows([
        ['Persistent HUD', 'ACTIVE', 'var(--ok)'],
        ['Level HUD', 'UNLOADING', 'var(--mut)'],
        ['Inventory', 'UNLOADING', 'var(--mut)']
      ])
    }, 900)
    setTimeout(() => {
      setLt1Rows([
        ['Persistent HUD', 'SURVIVES', 'var(--ok)'],
        ['Level HUD', 'UNLOADED', 'var(--mut)'],
        ['Inventory', 'UNLOADED', 'var(--mut)']
      ])
    }, 1800)
    setTimeout(() => {
      setLt2Rows([
        ['Persistent HUD', 'ACTIVE', 'var(--ok)'],
        ['New Level HUD', 'PRELOADED', 'var(--acc)']
      ])
    }, 2400)
    setTimeout(() => {
      setLt2Rows([
        ['Persistent HUD', 'SURVIVES', 'var(--ok)'],
        ['Level HUD', 'UNLOADED', 'var(--mut)'],
        ['New Level HUD', 'ACTIVE', 'var(--ok)']
      ])
    }, 3300)
  }

  const sub = ARCH_STACK[selectedSubsystem]

  return (
    <div className="page inksec" data-page="architecture" style={{ paddingTop: '72px' }}>
      <header className="pgh">
        <div className="wrap">
          <div className="eyebrow" style={{ color: '#8A8C95' }}>
            Architecture
          </div>
          <h1>
            Two worlds.<br />
            <em>One runtime.</em>
          </h1>
          <p className="lead">
            Select any subsystem to inspect it. The stack reads top to bottom: from your frontend, through embedded Chromium, through the SWUI runtime and its documents, into Unreal.
          </p>
        </div>
      </header>

      {/* Section 01: Subsystems Stack */}
      <section className="sec" style={{ borderTop: 0 }}>
        <div className="wrap">
          <div className="rp-grid">
            <div className="arch-stack rv in" id="amStack">
              {ARCH_STACK.map((item, i) => (
                <button
                  key={i}
                  className={`al ${i === selectedSubsystem ? 'sel' : ''}`}
                  onClick={() => setSelectedSubsystem(i)}
                >
                  <b className={i === 2 ? 'acc' : ''}>{item.t}</b>
                </button>
              ))}
            </div>

            <div className="lc-desc rv in" style={{ position: 'sticky', top: '76px' }}>
              <h4>{sub.t}</h4>
              <p>{sub.d}</p>
              <div className="api-strip" style={{ marginTop: '16px' }}>
                {sub.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className={`chip ${selectedSubsystem === 2 ? 'on' : ''}`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 02: Document Manager */}
      <section className="sec">
        <div className="wrap">
          <div className="shead">
            <span className="sidx">02</span>
            <span className="slbl">Document manager</span>
            <span className="srule" />
            <span className="stag">Center of the system</span>
          </div>
          <div className="sec-top">
            <h2 className="display" style={{ fontSize: 'clamp(26px,3vw,46px)' }}>
              USwuiDocumentManager<br />
              <span className="si">Subsystem.</span>
            </h2>
          </div>
          <div className="tele rv in" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
            <div>
              <b>Central ticking</b>
              <span style={{ font: '400 12.5px/1.6 var(--sans)', color: 'var(--mut)' }}>
                One subsystem drives every document and all CEF message-loop work, inside a per-frame budget.
              </span>
            </div>
            <div>
              <b>State batching</b>
              <span style={{ font: '400 12.5px/1.6 var(--sans)', color: 'var(--mut)' }}>
                Dirty state accumulates and flushes as one atomic batch per frame.
              </span>
            </div>
            <div>
              <b>Registry &amp; lifecycle</b>
              <span style={{ font: '400 12.5px/1.6 var(--sans)', color: 'var(--mut)' }}>
                Documents are registered, preloaded, activated, slept and unloaded from one place.
              </span>
            </div>
            <div>
              <b>Z-order &amp; hit testing</b>
              <span style={{ font: '400 12.5px/1.6 var(--sans)', color: 'var(--mut)' }}>
                Layer resolution and pointer routing across every visible surface.
              </span>
            </div>
            <div>
              <b>Level persistence</b>
              <span style={{ font: '400 12.5px/1.6 var(--sans)', color: 'var(--mut)' }}>
                Persistent documents survive level travel; non-persistent documents are cleaned up.
              </span>
            </div>
            <div>
              <b>Input routing</b>
              <span style={{ font: '400 12.5px/1.6 var(--sans)', color: 'var(--mut)' }}>
                Pointer, keyboard and navigation dispatched to the right document — or back to gameplay.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 03: Memory Cascade */}
      <section className="sec">
        <div className="wrap">
          <div className="shead">
            <span className="sidx">03</span>
            <span className="slbl">Memory</span>
            <span className="srule" />
            <span className="stag">Deterministic unload</span>
          </div>
          <div className="sec-top">
            <h2 className="display" style={{ fontSize: 'clamp(26px,3vw,46px)' }}>
              Lifecycle is<br />
              <span className="si">resource management.</span>
            </h2>
            <p className="lead" style={{ alignSelf: 'center' }}>
              Unloading is deterministic. Step through what happens when a document goes away.
            </p>
          </div>

          <div className="plate rv in" style={{ maxWidth: '860px' }}>
            <div className="plate-h">
              <span className="sq" />
              Unload cascade
              <span className="sp" />
              <button className="tbtn pri" onClick={handleRunUnload}>
                <svg><use href="#i-play" /></svg> Unload document
              </button>
            </div>
            <div className="plate-b">
              <div className="flow" style={{ flexWrap: 'wrap', gap: '8px' }}>
                {[
                  ['Active document', ''],
                  ['Unload', ''],
                  ['Browser', 'released'],
                  ['GPU handle', 'released'],
                  ['Slate texture', 'released'],
                  ['Memory', 'reclaimed']
                ].map(([title, sub], idx) => (
                  <React.Fragment key={idx}>
                    <div className={`fnode ${idx <= litNodeIndex ? 'lit' : ''}`}>
                      <b>{title}</b>
                      {sub && <span>{sub}</span>}
                    </div>
                    {idx < 5 && <div className="fwire" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 04: Level Travel */}
      <section className="sec paper">
        <div className="wrap">
          <div className="shead">
            <span className="sidx">04</span>
            <span className="slbl">Level travel</span>
            <span className="srule" />
            <span className="stag">Persistence split</span>
          </div>
          <div className="sec-top">
            <h2 className="display" style={{ fontSize: 'clamp(26px,3vw,46px)' }}>
              What survives<br />
              <span className="si">the travel.</span>
            </h2>
          </div>

          <div className="lt-grid rv in">
            <div className="plate">
              <div className="plate-h">
                <span className="sq" />
                Level 01
              </div>
              <div className="plate-b">
                {lt1Rows.map(([n, s, c], idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid var(--ln2)',
                      font: '400 11.5px var(--mono)'
                    }}
                  >
                    <span>{n}</span>
                    <span style={{ color: c }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '2px', height: '64px', background: 'var(--blaze)', margin: '0 auto' }} />
                <div className="mono" style={{ fontSize: '9px', letterSpacing: '.2em', color: 'var(--mut)', marginTop: '10px' }}>
                  TRAVEL
                </div>
              </div>
            </div>

            <div className="plate">
              <div className="plate-h">
                <span className="sq" />
                Level 02
              </div>
              <div className="plate-b">
                {lt2Rows.map(([n, s, c], idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid var(--ln2)',
                      font: '400 11.5px var(--mono)'
                    }}
                  >
                    <span>{n}</span>
                    <span style={{ color: c }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button className="tbtn" onClick={handleRunTravel} style={{ marginTop: '18px' }}>
            <svg><use href="#i-play" /></svg> Run travel
          </button>
        </div>
      </section>

      {/* Section 05: Input & Transports */}
      <section className="sec inksec">
        <div className="wrap">
          <div className="shead">
            <span className="sidx">05</span>
            <span className="slbl">Input architecture</span>
            <span className="srule" />
            <span className="stag">Keyboard · text · IME · bridge</span>
          </div>
          <h2 className="display" style={{ fontSize: 'clamp(22px,2.4vw,38px)', marginBottom: '26px' }}>
            Keyboard, text and IME
          </h2>

          <div className="flow rv in" style={{ maxWidth: '900px', flexWrap: 'wrap', gap: '8px' }}>
            <div className="fnode"><b>HTML input</b><span>focus</span></div><div className="fwire" />
            <div className="fnode"><b>SWUI</b><span>focus context</span></div><div className="fwire" />
            <div className="fnode"><b>Slate</b><span>input preprocessor</span></div><div className="fwire" />
            <div className="fnode"><b>CEF</b><span>key + text events</span></div>
          </div>

          <p className="lead rv in" style={{ marginTop: '20px', fontSize: '13.5px' }}>
            Printable characters, modifiers and raw keys are routed for focused web inputs — text fields, textareas and search boxes. The routing is structured to stay compatible with IME-related input flows on desktop. Deeper details under <a href="#/docs/input" className="acc">Docs → Input</a>.
          </p>

          <h2 className="display" style={{ fontSize: 'clamp(22px,2.4vw,38px)', margin: '56px 0 26px' }}>
            Native bridge transports
          </h2>
          <div className="tele rv in" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
            <div>
              <b>1 · CEF query</b>
              <span style={{ font: '400 12.5px/1.6 var(--sans)', color: 'var(--mut)' }}>
                Preferred native bridge through the embedded browser.
              </span>
            </div>
            <div>
              <b>2 · postMessage</b>
              <span style={{ font: '400 12.5px/1.6 var(--sans)', color: 'var(--mut)' }}>
                Structured messages via window messaging.
              </span>
            </div>
            <div>
              <b>3 · SWUI send</b>
              <span style={{ font: '400 12.5px/1.6 var(--sans)', color: 'var(--mut)' }}>
                Direct send transport.
              </span>
            </div>
            <div>
              <b>4 · webview postMessage</b>
              <span style={{ font: '400 12.5px/1.6 var(--sans)', color: 'var(--mut)' }}>
                Webview-style messaging fallback.
              </span>
            </div>
            <div>
              <b>5 · URL bridge</b>
              <span style={{ font: '400 12.5px/1.6 var(--sans)', color: 'var(--mut)' }}>
                URL-based SWUI bridge as a last-resort path.
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
