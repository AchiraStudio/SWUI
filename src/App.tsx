import React, { useState, useEffect } from 'react'
import { SvgSymbols } from './components/common/SvgSymbols'
import { Nav } from './components/layout/Nav'
import { MobileMenu } from './components/layout/MobileMenu'
import { Footer } from './components/layout/Footer'
import { Toast } from './components/common/Toast'
import { SearchModal } from './components/common/SearchModal'
import { copyText } from './utils/toast'
import { SNIP } from './data/snippets'

import { HomePage } from './pages/HomePage'
import { ProductPage } from './pages/ProductPage'
import { ArchitecturePage } from './pages/ArchitecturePage'
import { SdkPage } from './pages/SdkPage'
import { ExamplesPage } from './pages/ExamplesPage'
import { DocsPage } from './pages/DocsPage'
import { ReferencePage } from './pages/ReferencePage'
import { ProfilingPage } from './pages/ProfilingPage'

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'home' | 'product' | 'architecture' | 'sdk' | 'examples' | 'docs' | 'reference' | 'profiling'>('home')
  const [subRoute, setSubRoute] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Hash route parsing
  useEffect(() => {
    const parseRoute = () => {
      let h = window.location.hash.replace(/^#\/?/, '')
      let page = 'home'
      let sub: string | null = null

      if (h.startsWith('@')) {
        const anchor = h.slice(1)
        const t = document.getElementById(anchor)
        if (t) t.scrollIntoView({ behavior: 'smooth' })
        return
      }

      if (h) {
        const parts = h.split('/')
        page = parts[0] || 'home'
        sub = parts[1] || null
      }

      const validPages = ['home', 'product', 'architecture', 'sdk', 'examples', 'docs', 'reference', 'profiling']
      if (!validPages.includes(page)) {
        page = 'home'
        sub = null
      }

      setCurrentRoute(page as any)
      setSubRoute(sub)
      setMenuOpen(false)
      window.scrollTo({ top: 0, behavior: 'auto' })
    }

    parseRoute()
    window.addEventListener('hashchange', parseRoute)
    return () => window.removeEventListener('hashchange', parseRoute)
  }, [])

  // Global keyboard shortcuts (Ctrl+K or '/' to open search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) && !e.target?.toString().includes('HTMLInputElement') && !e.target?.toString().includes('HTMLTextAreaElement')) {
        e.preventDefault()
        setSearchOpen(true)
      } else if (e.key === 'Escape') {
        setSearchOpen(false)
        setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Global copy delegate for all code blocks and tabs
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('.cf-copy') as HTMLElement
      if (btn) {
        const key = btn.dataset.copy
        if (key && SNIP[key]) {
          copyText(SNIP[key])
        }
      }
    }
    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [])

  return (
    <>
      <SvgSymbols />
      <Nav currentRoute={currentRoute} onToggleMenu={() => setMenuOpen(!menuOpen)} />
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main id="app">
        <HomePage hidden={currentRoute !== 'home'} />
        <ProductPage hidden={currentRoute !== 'product'} />
        <ArchitecturePage hidden={currentRoute !== 'architecture'} />
        <SdkPage hidden={currentRoute !== 'sdk'} />
        <ExamplesPage hidden={currentRoute !== 'examples'} />
        <DocsPage
          hidden={currentRoute !== 'docs'}
          docId={subRoute || 'getting-started'}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <ReferencePage hidden={currentRoute !== 'reference'} />
        <ProfilingPage hidden={currentRoute !== 'profiling'} />
      </main>

      <Footer />
      <Toast />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
