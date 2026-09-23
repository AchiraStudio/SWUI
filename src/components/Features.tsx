import React from 'react'
import { Cpu, Zap, Code2, Layers, ShieldCheck, Sparkles } from 'lucide-react'

export const Features: React.FC = () => {
  const features = [
    {
      icon: <Cpu className="w-6 h-6 text-cyan-400" />,
      title: 'Unreal Reflection as Source of Truth',
      description: 'Define your properties, USTRUCTs, and GameplayTags in C++ or Blueprints. SWUI inspects reflection data automatically.'
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      title: 'Zero Manual JSON Plumbing',
      description: 'No more writing custom JSON parsers, string matching, or repetitive Blueprint serialization logic.'
    },
    {
      icon: <Code2 className="w-6 h-6 text-purple-400" />,
      title: 'TypeScript Type Generation',
      description: 'Automatically generate strongly typed TypeScript bindings for your Unreal structs and events with `@simplewebui/client`.'
    },
    {
      icon: <Layers className="w-6 h-6 text-emerald-400" />,
      title: 'GPU Shared Texture Rendering',
      description: 'Powered by Chromium Embedded Framework (CEF) with high-performance GPU texture sharing for ultra-smooth 60+ FPS game overlays.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-blue-400" />,
      title: 'GameplayTag-Based Routing',
      description: 'Route UI events directly to Unreal GameplayTags, enabling seamless integration with Unreal’s Gameplay Ability System (GAS).'
    },
    {
      icon: <Sparkles className="w-6 h-6 text-rose-400" />,
      title: 'Framework Agnostic',
      description: 'Use React, Vue, Svelte, or vanilla HTML/CSS. Build your game UI with the modern web developer ecosystem and hot reloading.'
    }
  ]

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-mono mb-3">Architected for Speed & Clarity</h2>
        <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Everything you need to ship web-powered Unreal UI
        </h3>
        <p className="mt-4 text-slate-400 text-base leading-relaxed">
          Say goodbye to sluggish Slate, cumbersome UMG hierarchies, and hand-written C++ binding boilerplate.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80 transition-all group backdrop-blur-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-800/60 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              {feature.icon}
            </div>
            <h4 className="text-lg font-bold text-white mb-2">{feature.title}</h4>
            <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
