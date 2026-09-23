import React, { useState } from 'react'
import { REFERENCE_DATA, RefEntry } from '../data/reference'

export const ReferencePage: React.FC = () => {
  const [search, setSearch] = useState('')
  const [openEntries, setOpenEntries] = useState<Record<string, boolean>>({})

  const toggleEntry = (key: string) => {
    setOpenEntries(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const query = search.toLowerCase()
  const filtered = REFERENCE_DATA.filter(
    r =>
      !query ||
      r.name.toLowerCase().includes(query) ||
      r.purpose.toLowerCase().includes(query) ||
      r.category.toLowerCase().includes(query)
  )

  return (
    <div className="page paper" data-page="reference" style={{ paddingTop: '80px', minHeight: '80vh' }}>
      <div className="wrap">
        <div style={{ maxWidth: '880px', margin: '0 auto', paddingBottom: '80px' }}>
          <div className="plate-h" style={{ marginBottom: '24px' }}>
            <span className="sq" />
            <span>API &amp; Contract Reference</span>
            <span className="sp" />
            <span className="kbd">SWUI 3.0</span>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div className="si2">
              <svg><use href="#i-search" /></svg>
              <input
                id="refSearch"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter by API name, purpose, or category (CORE, REACT, VUE, CLI)…"
                aria-label="Filter reference"
              />
            </div>
          </div>

          <div id="refList">
            {filtered.length > 0 ? (
              filtered.map(r => {
                const key = `${r.category}-${r.name}`
                const isOpen = !!openEntries[key]
                return (
                  <div key={key} className={`ref-entry ${isOpen ? 'open' : ''}`}>
                    <button
                      className="ref-h"
                      onClick={() => toggleEntry(key)}
                    >
                      <span className="nm">{r.name}</span>
                      <span className="pu">{r.purpose}</span>
                      <span className="ct">{r.category}</span>
                      <svg><use href="#i-chev" /></svg>
                    </button>
                    {isOpen && (
                      <div className="ref-b">
                        <div className="sig">{r.signature}</div>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="dim mono" style={{ fontSize: '12px' }}>
                no results
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
