import React from 'react'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div id="mm" onClick={e => {
      if ((e.target as HTMLElement).tagName === 'A') {
        onClose()
      }
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="mmc" style={{ margin: 0 }}>Menu</span>
        <button
          onClick={onClose}
          style={{ padding: '8px 12px', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', font: '500 11px var(--mono)' }}
          aria-label="Close menu"
        >
          ✕ CLOSE
        </button>
      </div>
      <div style={{ margin: '8px 0 20px' }}>
        <a
          href="#/docs/getting-started"
          style={{
            display: 'block',
            textAlign: 'center',
            background: 'var(--blaze)',
            color: 'var(--ink)',
            font: '600 13px var(--mono)',
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            padding: '14px 20px',
            border: 'none'
          }}
        >
          Get Started →
        </a>
      </div>
      <div className="mmc">Site</div>
      <a href="#/product">Product</a>
      <a href="#/architecture">Architecture</a>
      <a href="#/sdk">SDK</a>
      <a href="#/examples">Examples</a>
      <a href="#/docs/getting-started">Docs</a>
      <div className="mmc">More</div>
      <a href="#/reference">Reference</a>
      <a href="#/profiling">Profiling</a>
      <a
        href="https://github.com/AchiraStudio/SWUI"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'var(--blaze)' }}
      >
        GitHub ↗
      </a>
    </div>
  )
}

