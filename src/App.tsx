import React from 'react'
import { UnrealBridgeSimulator } from './components/UnrealBridgeSimulator'
import { Features } from './components/Features'
import { CodeSnippet } from './components/CodeSnippet'
import { ExternalLink, Terminal, ChevronRight, Gamepad2, ArrowRight } from 'lucide-react'

const GithubIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
)

export default function App() {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background radial gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-cyan-500/10 via-purple-500/5 to-transparent blur-3xl" />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0b0f17]/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              SWUI
            </span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
              v1.5
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a href="#simulator" className="hover:text-slate-100 transition-colors">Interactive Demo</a>
            <a href="#features" className="hover:text-slate-100 transition-colors">Features</a>
            <a href="#code" className="hover:text-slate-100 transition-colors">Code Example</a>
            <a href="#quickstart" className="hover:text-slate-100 transition-colors">Quickstart</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/AchiraStudio/SWUI"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 transition-all shadow-sm hover:border-slate-600"
            >
              <GithubIcon className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 z-10">
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 px-6 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-medium mb-8 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            Unreal Engine 5.4+ Web UI Integration
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Build UI like a <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">web app</span>. <br />
            Wire it like an <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Unreal system</span>.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            SWUI is a high-performance web layer for Unreal Engine. Render interactive game HUDs, menus, and overlays using React, Vite, and modern web tech.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#simulator"
              className="px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 group"
            >
              <span>Try Interactive Simulator</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="https://github.com/AchiraStudio/SWUI"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-xl font-semibold text-sm bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-2"
            >
              <GithubIcon className="w-4 h-4" />
              <span>View Repository</span>
            </a>
          </div>
        </section>

        {/* Live Simulator Section */}
        <section id="simulator" className="py-12 px-6">
          <UnrealBridgeSimulator />
        </section>

        {/* Features Section */}
        <div id="features">
          <Features />
        </div>

        {/* Code Snippet Section */}
        <section id="code" className="py-12">
          <div className="text-center max-w-2xl mx-auto mb-8 px-6">
            <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Clean, Idiomatic Developer Experience</h3>
            <p className="mt-3 text-sm text-slate-400">
              Simple hooks, strict TypeScript types, and zero custom JSON parsing.
            </p>
          </div>
          <CodeSnippet />
        </section>

        {/* Quickstart / Cloudflare Pages info */}
        <section id="quickstart" className="py-16 px-6 max-w-4xl mx-auto">
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-2xl font-bold text-white mb-3">Deploying with Cloudflare Pages</h3>
            <p className="text-slate-400 text-sm max-w-lg mx-auto mb-6">
              This site is ready to deploy directly on Cloudflare Pages connected to your GitHub repository.
            </p>

            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 text-left font-mono text-xs max-w-lg mx-auto space-y-2 text-slate-300">
              <div className="flex items-center gap-2 text-slate-500 pb-2 border-b border-slate-800">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cloudflare Build Settings</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Framework Preset:</span>
                <span className="text-cyan-300">Vite</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Build Command:</span>
                <span className="text-cyan-300">npm run build</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Build Output:</span>
                <span className="text-cyan-300">dist</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Branch:</span>
                <span className="text-cyan-300">demo</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-850 py-8 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Achira Studio. Open source under MIT License.</p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/AchiraStudio/SWUI" className="hover:text-slate-300 transition-colors">GitHub</a>
            <span>•</span>
            <a href="https://github.com/AchiraStudio/SWUI/blob/main/Docs/README.md" className="hover:text-slate-300 transition-colors">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
