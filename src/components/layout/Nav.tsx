import React from 'react'

interface NavProps {
  currentRoute: string
  onToggleMenu: () => void
}

export const Nav: React.FC<NavProps> = ({ currentRoute, onToggleMenu }) => {
  return (
    <nav id="nav" aria-label="Main">
      <div className="wrap">
        <a className="brand" href="#/" aria-label="SWUI home">
          <svg><use href="#i-logo" /></svg>
          SWUI
        </a>
        <div className="nav-c">
          <a
            href="#/product"
            data-nav="product"
            className={currentRoute === 'product' ? 'on' : ''}
          >
            Product
          </a>
          <a
            href="#/architecture"
            data-nav="architecture"
            className={currentRoute === 'architecture' ? 'on' : ''}
          >
            Architecture
          </a>
          <a
            href="#/sdk"
            data-nav="sdk"
            className={currentRoute === 'sdk' ? 'on' : ''}
          >
            SDK
          </a>
          <a
            href="#/examples"
            data-nav="examples"
            className={currentRoute === 'examples' ? 'on' : ''}
          >
            Examples
          </a>
          <a
            href="#/docs/getting-started"
            data-nav="docs"
            className={currentRoute === 'docs' ? 'on' : ''}
          >
            Docs
          </a>
        </div>
        <div className="nav-r">
          <a
            className="gh"
            href="https://github.com/AchiraStudio/SWUI"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg><use href="#i-gh" /></svg>
            <span>GitHub</span>
          </a>
          <a className="btn-nav" href="#/docs/getting-started">
            Get Started
          </a>
          <button
            id="menuBtn"
            onClick={onToggleMenu}
            aria-label="Open menu"
          >
            <svg width="15" height="15"><use href="#i-menu" /></svg>
          </button>
        </div>
      </div>
    </nav>
  )
}
