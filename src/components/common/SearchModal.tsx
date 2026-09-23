import React, { useState, useEffect, useRef } from 'react'
import { DOCS } from '../../data/docs'

interface SearchItem {
  t: string
  c: string
  x: string
  h: string
  s: string
}

const buildSearchIndex = (): SearchItem[] => {
  const items: SearchItem[] = []
  Object.entries(DOCS).forEach(([id, d]) => {
    const text = d.h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    items.push({
      t: d.t,
      c: 'Docs',
      x: text.slice(0, 110),
      h: '#/docs/' + id,
      s: (text + ' ' + d.t).toLowerCase()
    })
  })
  const mainSections: [string, string, string][] = [
    ['Product', 'runtime documents layers platform', '#/product'],
    ['Architecture', 'CEF subsystems memory travel bridge', '#/architecture'],
    ['SDK', 'api state spring timeline telemetry cli', '#/sdk'],
    ['Examples', 'hud inventory pause terminal use cases', '#/examples'],
    ['Reference', 'api signatures useSwuiState spring', '#/reference'],
    ['Profiling', 'console commands stats budget', '#/profiling']
  ]
  mainSections.forEach(([t, c, h]) => {
    items.push({
      t,
      c,
      x: 'Section',
      h,
      s: (t + ' ' + c).toLowerCase()
    })
  })
  return items
}

const SEARCH_INDEX = buildSearchIndex()

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = query
    ? SEARCH_INDEX.filter(item => item.s.includes(query.toLowerCase())).slice(0, 9)
    : SEARCH_INDEX.slice(0, 8)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelect = (url: string) => {
    onClose()
    window.location.hash = url
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(filtered.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex].h)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      id="searchOv"
      onClick={e => {
        if ((e.target as HTMLElement).id === 'searchOv') {
          onClose()
        }
      }}
    >
      <div id="searchBox" role="dialog" aria-label="Search" onKeyDown={handleKeyDown}>
        <div className="si2">
          <svg><use href="#i-search" /></svg>
          <input
            ref={inputRef}
            id="searchIn"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search docs, APIs, commands…"
            aria-label="Search input"
          />
          <span className="kbd" onClick={onClose} style={{ cursor: 'pointer' }}>
            esc
          </span>
        </div>
        <div id="searchRes">
          {filtered.length > 0 ? (
            filtered.map((item, i) => (
              <button
                key={item.h + i}
                className={`sr ${i === selectedIndex ? 'sel' : ''}`}
                onClick={() => handleSelect(item.h)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span className="t">
                  <b>{item.t}</b>
                  <span>{item.c}</span>
                </span>
                <p>{item.x}</p>
              </button>
            ))
          ) : (
            <p className="dim mono" style={{ padding: '16px 17px', fontSize: '12px' }}>
              no results
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
