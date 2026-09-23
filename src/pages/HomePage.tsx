import React from 'react'
import { Hero } from '../components/home/Hero'
import { DocStackSection } from '../components/home/DocStackSection'
import { LifecycleSection } from '../components/home/LifecycleSection'
import { StateBusSection } from '../components/home/StateBusSection'
import { BatchingSection } from '../components/home/BatchingSection'
import { RenderingSection } from '../components/home/RenderingSection'
import { InputSection } from '../components/home/InputSection'
import { TagsSection } from '../components/home/TagsSection'
import { TsExplorerSection } from '../components/home/TsExplorerSection'
import { FrameworksSection } from '../components/home/FrameworksSection'
import { CrosshairSection } from '../components/home/CrosshairSection'

export const HomePage: React.FC = () => {
  return (
    <div className="page" data-page="home">
      <Hero />
      <DocStackSection />
      <LifecycleSection />
      <StateBusSection />
      <BatchingSection />
      <RenderingSection />
      <InputSection />
      <TagsSection />
      <TsExplorerSection />
      <FrameworksSection />
      <CrosshairSection />

      {/* Final Docs CTA banner */}
      <section className="sec paper" id="docsCta">
        <div className="wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="eyebrow" style={{ marginBottom: '12px' }}>
            Next Steps
          </div>
          <h2 className="display" style={{ fontSize: 'clamp(28px,3.5vw,52px)', marginBottom: '20px' }}>
            Ready to integrate with Unreal Engine?
          </h2>
          <p className="lead" style={{ maxWidth: '640px', margin: '0 auto 28px' }}>
            Get started in 5 minutes with the vanilla path, or configure modern Vite + React bundles for your game HUDs and menus.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a className="btn" href="#/docs/getting-started">
              Read Documentation
              <svg><use href="#i-arr" /></svg>
            </a>
            <a
              className="btn-g"
              href="https://github.com/AchiraStudio/SWUI"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
