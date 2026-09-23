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

