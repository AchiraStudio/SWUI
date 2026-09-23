import React from 'react'

export const Footer: React.FC = () => {
  return (
    <footer>
      <div className="wrap">
        <div className="ft-g">
          <div className="ft-brand">
            <div className="brand" style={{ marginBottom: '16px' }}>
              <svg><use href="#i-logoa" /></svg>
              SWUI
            </div>
            <div className="display">
              Web UI.<br />
              <em>Inside Unreal.</em>
            </div>
          </div>
          <div className="ft-col">
            <h5>Site</h5>
            <a href="#/product">Product</a>
            <a href="#/architecture">Architecture</a>
            <a href="#/sdk">SDK</a>
            <a href="#/examples">Examples</a>
            <a href="#/docs/getting-started">Docs</a>
            <a href="#/reference">Reference</a>
            <a href="#/profiling">Profiling</a>
          </div>
          <div className="ft-col">
            <h5>Resources</h5>
            <a href="https://github.com/AchiraStudio/SWUI" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href="#/docs/getting-started">Getting started</a>
            <a href="#/docs/troubleshooting">Troubleshooting</a>
            <a href="#/docs/cli">CLI &amp; config</a>
          </div>
          <div className="ft-col">
            <h5>Project</h5>
            <a href="#/product">Version — 3.0</a>
            <a href="https://github.com/AchiraStudio/SWUI" target="_blank" rel="noopener noreferrer">
              License
            </a>
            <a href="#/product">Project status</a>
            <a href="#/product">Platform matrix</a>
          </div>
        </div>
        <div className="ft-bot">
          <span>SWUI is derived from the BLUI / SimpleWebUI lineage. Licensing and credits are preserved in the repository.</span>
          <span>Made by AchiraStudio</span>
        </div>
      </div>
    </footer>
  )
}

