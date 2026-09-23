import React, { useState } from 'react'
import { toast } from '../../utils/toast'
import { hl } from '../../utils/highlighter'

interface DirtyField {
  k: string
  v: string | number
}

export const BatchingSection: React.FC = () => {
  const [pending, setPending] = useState<DirtyField[]>([])
  const [naiveCount, setNaiveCount] = useState(0)
  const [swuiCount, setSwuiCount] = useState(0)
  const [jsonOutput, setJsonOutput] = useState('{}')
  const [isFlashing, setIsFlashing] = useState(false)

  const handleDirty = (key: string, val: string | number) => {
    if (pending.some(p => p.k === key)) return
    setPending(prev => [...prev, { k: key, v: val }])
    setNaiveCount(c => c + 1)
  }

  const handleFlush = () => {
    if (!pending.length) {
      toast('Nothing dirty — mark some fields first')
      return
    }
    const payload: Record<string, any> = {}
    pending.forEach(p => {
      payload[p.k] = isNaN(Number(p.v)) ? p.v : Number(p.v)
    })
    setJsonOutput(JSON.stringify(payload, null, 2))
    setSwuiCount(c => c + 1)
    setPending([])
    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), 700)
    toast('Flushed dirty state in 1 atomic frame batch')
  }

  const handleReset = () => {
    setPending([])
    setNaiveCount(0)
    setSwuiCount(0)
    setJsonOutput('{}')
  }

  return (
    <section className="sec">
      <div className="wrap">
        <div className="shead">
          <span className="sidx">04</span>
          <span className="slbl">State batching</span>
          <span className="srule" />
          <span className="stag">1 flush per frame</span>
        </div>
        <div className="sec-top">
          <h2 className="display" style={{ fontSize: 'clamp(26px,3vw,46px)' }}>
            Never pay for N flushes.<br />
            <span className="si">Everything is batched.</span>
          </h2>
        </div>

        <div className="plate rv in">
          <div className="plate-h">
            <span className="sq" />
            Dirty Property Batcher
            <span className="sp" />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="tbtn pri" onClick={handleFlush}>
                Flush Batch
              </button>
              <button className="tbtn" onClick={handleReset}>
                Reset
              </button>
            </div>
          </div>

          <div className="plate-b">
            {/* Quick buttons to dirty fields */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <button
                className="tbtn"
                onClick={() => handleDirty('Player.Health', 72)}
              >
                + Dirty Health · 72
              </button>
              <button
                className="tbtn"
                onClick={() => handleDirty('Weapon.CurrentAmmo', 21)}
              >
                + Dirty Ammo · 21
              </button>
              <button
                className="tbtn"
                onClick={() => handleDirty('Player.Shield', 40)}
              >
                + Dirty Shield · 40
              </button>
              <button
                className="tbtn"
                onClick={() => handleDirty('Combat.LastHitTag', 'Damage.Type.Fire')}
              >
                + Dirty Buff · Fire
              </button>
            </div>

            {/* Metrics comparison */}
            <div className="tele" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: '20px' }}>
              <div>
                <b>Naive Unbatched Calls</b>
                <span className="mono" style={{ color: 'var(--blaze)' }}>{naiveCount}</span>
              </div>
              <div>
                <b>SWUI Atomic Flushes</b>
                <span className="mono" style={{ color: 'var(--ok)' }}>{swuiCount}</span>
              </div>
              <div>
                <b>Pending Dirty Fields</b>
                <span className="mono">{pending.length}</span>
              </div>
            </div>

            {/* Dirty chips */}
            <div
              id="btChips"
              style={{
                minHeight: '44px',
                padding: '10px 14px',
                background: 'var(--card2)',
                border: '1px solid var(--ln2)',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                alignItems: 'center',
                marginBottom: '16px'
              }}
            >
              {pending.length > 0 ? (
                pending.map(p => (
                  <div
                    key={p.k}
                    className="chip on"
                    style={{ background: 'var(--card)', color: 'var(--fg)', borderColor: 'var(--ln)' }}
                  >
                    <b>{p.k}</b> → {p.v}
                  </div>
                ))
              ) : (
                <span className="mono dim" style={{ fontSize: '11px' }}>
                  — nothing dirty — click buttons above to mark properties
                </span>
              )}
            </div>

            {/* Flushed JSON output */}
            <pre
              className="mono"
              style={{
                padding: '14px',
                background: 'var(--card2)',
                border: '1px solid var(--ln2)',
                fontSize: '11.5px',
                color: 'var(--fg)'
              }}
              dangerouslySetInnerHTML={{ __html: hl(jsonOutput, 'json') }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
