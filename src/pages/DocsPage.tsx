import React, { useEffect, useState, useMemo } from 'react'
import { DOCNAV, DOCS } from '../data/docs'
import { copyText } from '../utils/toast'

interface DocsPageProps {
  docId?: string
  onOpenSearch: () => void
}

export const DocsPage: React.FC<DocsPageProps> = ({ docId = 'getting-started', onOpenSearch }) => {
  const [activeId, setActiveId] = useState(docId)

  useEffect(() => {
    if (docId && DOCS[docId]) {
      setActiveId(docId)
    } else {
      setActiveId('getting-started')
    }
  }, [docId])

  const doc = DOCS[activeId] || DOCS['getting-started']

  // Find previous and next articles in DOCNAV
  const allArticles = useMemo(() => {
    const list: { id: string; title: string }[] = []
    DOCNAV.forEach(cat => {
      cat.items.forEach(item => list.push(item))
    })
    return list
  }, [])

  const currentIndex = allArticles.findIndex(a => a.id === activeId)
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null
  const nextArticle = currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null

  // Extract table of contents (H2 headers) from HTML
  const toc = useMemo(() => {
    const matches = [...doc.h.matchAll(/<h2>([^<]+)<\/h2>/g)]
    return matches.map(m => m[1])
  }, [doc])

  // Attach copy listeners to any code blocks inside doc
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const copyBtn = target.closest('[data-copy]') as HTMLElement
    if (copyBtn && copyBtn.dataset.copy) {
      // Look for code text in nearest pre
      const figure = copyBtn.closest('figure')
      if (figure) {
        const pre = figure.querySelector('pre')
        if (pre) {
          copyText(pre.innerText)
        }
      }
    }
  }

  return (
    <div className="page paper" data-page="docs" style={{ paddingTop: '72px' }}>
      <div className="wrap">
        <div className="doc-layout">
          {/* Sidebar */}
          <aside id="docSide">
            <div style={{ padding: '4px 0 12px' }}>
              <button
                className="tbtn"
                onClick={onOpenSearch}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <svg width="11" height="11">
                  <use href="#i-search" />
                </svg>
                Search — press /
              </button>
            </div>
            {DOCNAV.map(cat => (
              <div key={cat.category}>
                <h5>{cat.category}</h5>
                {cat.items.map(item => (
                  <a
                    key={item.id}
                    href={`#/docs/${item.id}`}
                    className={item.id === activeId ? 'on' : ''}
                    onClick={() => setActiveId(item.id)}
                  >
                    {item.title}
                  </a>
                ))}
              </div>
            ))}
          </aside>

          {/* Main Article */}
          <article id="docBody" onClick={handleContentClick}>
            <div className="dh">
              <div className="dt">{doc.t}</div>
              <div className="dm">{doc.m}</div>
            </div>

            {/* In-page Table of Contents if multiple sections */}
            {toc.length > 1 && (
              <div
                style={{
                  marginBottom: '24px',
                  padding: '12px 16px',
                  border: '1px solid var(--ln2)',
                  background: 'var(--card)',
                  fontFamily: 'var(--mono)',
                  fontSize: '11px'
                }}
              >
                <div style={{ color: 'var(--mut)', marginBottom: '6px', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                  On this page
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
                  {toc.map((heading, i) => (
                    <span key={i} style={{ color: 'var(--fg)' }}>
                      • {heading}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* HTML Body */}
            <div
              className="doc-content"
              dangerouslySetInnerHTML={{ __html: doc.h }}
            />

            {/* Prev / Next Navigation */}
            <div className="doc-nav">
              {prevArticle ? (
                <a
                  className="pn"
                  href={`#/docs/${prevArticle.id}`}
                  onClick={() => setActiveId(prevArticle.id)}
                >
                  <span>Previous</span>
                  <b>{prevArticle.title}</b>
                </a>
              ) : (
                <span />
              )}
              {nextArticle && (
                <a
                  className="nn"
                  href={`#/docs/${nextArticle.id}`}
                  onClick={() => setActiveId(nextArticle.id)}
                >
                  <span>Next</span>
                  <b>{nextArticle.title}</b>
                </a>
              )}
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}
