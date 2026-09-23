import React, { useState } from 'react'
import { CodeBlock } from '../common/CodeBlock'

const FRAMEWORKS = [
  { id: 'react', name: 'React', file: 'AmmoCounter.tsx', lang: 'ts', key: 'react' },
  { id: 'vue', name: 'Vue', file: 'AmmoCounter.vue', lang: 'ts', key: 'vue' },
  { id: 'svelte', name: 'Svelte', file: 'Crosshair.svelte', lang: 'html', key: 'svelte' },
  { id: 'vanilla', name: 'Vanilla HTML/JS', file: 'hud.html', lang: 'html', key: 'vanilla' }
]

export const FrameworksSection: React.FC = () => {
  const [activeFw, setActiveFw] = useState(FRAMEWORKS[0])

  return (
    <section className="sec">
      <div className="wrap">
        <div className="shead">
          <span className="sidx">09</span>
          <span className="slbl">Framework Agnostic</span>
          <span className="srule" />
          <span className="stag">React · Vue · Svelte · Vanilla</span>
        </div>
        <div className="sec-top">
          <h2 className="display" style={{ fontSize: 'clamp(26px,3vw,46px)' }}>
            Your framework of choice.<br />
            <span className="si">The same Unreal bridge.</span>
          </h2>
          <p className="lead" style={{ alignSelf: 'center' }}>
            SWUI doesn't lock you into React or proprietary template engines. Use standard React hooks, Vue 3 composables, Svelte stores, or zero-build vanilla JavaScript.
          </p>
        </div>

        <div className="rv in">
          {/* Framework tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {FRAMEWORKS.map(fw => (
              <button
                key={fw.id}
                className={`tbtn ${activeFw.id === fw.id ? 'on' : ''}`}
                onClick={() => setActiveFw(fw)}
              >
                {fw.name}
              </button>
            ))}
          </div>

          <CodeBlock
            snipKey={activeFw.key}
            file={activeFw.file}
            lang={activeFw.lang}
            theme="d"
          />
        </div>
      </div>
    </section>
  )
}
