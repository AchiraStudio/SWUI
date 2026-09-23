// @ts-nocheck
import React, { useEffect, useRef } from 'react'
import { $, $$, RM, clamp, damp, el, loop, codeFig, makeCrosshair, hl, toast, copyText, observeReveal } from '../utils/engine'
import { DOCNAV, DOCS } from '../data/docs'

interface DocsPageProps {
  hidden?: boolean
  docId?: string
  onOpenSearch?: () => void
}

export const DocsPage: React.FC<DocsPageProps> = ({ hidden, docId = 'getting-started', onOpenSearch }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const initedRef = useRef(false)
  const openSearch = () => {
    if (onOpenSearch) onOpenSearch()
  }

  function buildDocSidebar() {
    const s = $('#docSide')
    if (!s) return
    s.innerHTML = '<div style="padding:4px 0 12px"><button class="tbtn" id="docSearchBtn" style="width:100%;justify-content:center"><svg width="11" height="11"><use href="#i-search"/></svg> Search — press /</button></div>'
    DOCNAV.forEach(([cat, items]) => {
      s.appendChild(el('h5', null, cat))
      items.forEach(([id, t]) => {
        const a = el('a', null, t)
        a.href = '#/docs/' + id
        a.dataset.doc = id
        s.appendChild(a)
      })
    })
    $('#docSearchBtn')?.addEventListener('click', openSearch)
  }

  function renderDoc(id) {
    const d = DOCS[id] || DOCS['getting-started']
    $$('#docSide a').forEach(a => a.classList.toggle('on', a.dataset.doc === id))
    const order = DOCNAV.flatMap(c => c[1])
    const i = order.findIndex(o => o[0] === id)
    const prev = order[i - 1]
    const next = order[i + 1]
    const body = $('#docBody')
    if (!body) return
    body.innerHTML = `
      <div class="doc-crumb"><a href="#/">SWUI</a><span>/</span><a href="#/docs/getting-started">Docs</a><span>/</span><span>${d.t}</span></div>
      <h1>${d.t}</h1>
      <div class="doc-meta"><span class="chip on">${d.m}</span></div>
      <div>${d.h}</div>
      <div class="doc-nav">
        ${prev ? `<a href="#/docs/${prev[0]}"><span>Previous</span><b>${prev[1]}</b></a>` : '<span></span>'}
        ${next ? `<a class="nn" href="#/docs/${next[0]}"><span>Next</span><b>${next[1]}</b></a>` : ''}
      </div>`
  }

  useEffect(() => {
    if (!containerRef.current || hidden) return
    if (!initedRef.current) {
      initedRef.current = true
      buildDocSidebar()
      const searchBtn = containerRef.current.querySelector('#docSearchBtn')
      if (searchBtn && onOpenSearch) {
        searchBtn.addEventListener('click', onOpenSearch)
      }
    }
    renderDoc(docId || 'getting-started')
    observeReveal(containerRef.current)
  }, [hidden, docId])

  return (
    <div
      ref={containerRef}
      className="page paper"
      data-page="docs"
      hidden={hidden}
      dangerouslySetInnerHTML={{
        __html: `
  <div class="wrap docs-g">
    <aside class="doc-side" id="docSide" aria-label="Documentation navigation"></aside>
    <article class="doc-body" id="docBody"></article>
  </div>
`
      }}
    />
  )
}
