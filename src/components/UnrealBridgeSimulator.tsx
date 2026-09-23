import React, { useState, useEffect } from 'react'
import { Shield, Heart, Zap, Terminal, Play, RotateCcw, Send, CheckCircle2 } from 'lucide-react'

interface LogEntry {
  id: string
  time: string
  source: 'Unreal -> Web' | 'Web -> Unreal'
  event: string
  payload: Record<string, any>
}

export const UnrealBridgeSimulator: React.FC = () => {
  const [health, setHealth] = useState(85)
  const [shield, setShield] = useState(100)
  const [ammo, setAmmo] = useState(30)
  const [activeBuff, setActiveBuff] = useState<string | null>('Buff.Overclock')
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      time: '12:00:01',
      source: 'Unreal -> Web',
      event: 'Character.State.Updated',
      payload: { health: 85, shield: 100, ammo: 30, tag: 'Player.State.Alive' }
    }
  ])

  const addLog = (source: 'Unreal -> Web' | 'Web -> Unreal', event: string, payload: Record<string, any>) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs(prev => [{ id: Math.random().toString(36).substring(2, 9), time, source, event, payload }, ...prev.slice(0, 7)])
  }

  const handleTakeDamage = () => {
    setShield(prevShield => {
      let dmg = 25
      let newShield = Math.max(0, prevShield - dmg)
      let remainingDmg = dmg - (prevShield - newShield)
      if (remainingDmg > 0) {
        setHealth(prevHealth => Math.max(0, prevHealth - remainingDmg))
      }
      addLog('Unreal -> Web', 'GameplayTag.Damaged', { damage: 25, newShield, remainingHealth: Math.max(0, health - remainingDmg) })
      return newShield
    })
  }

  const handleHeal = () => {
    setHealth(100)
    setShield(100)
    addLog('Unreal -> Web', 'GameplayTag.Health.FullRestore', { health: 100, shield: 100 })
  }

  const handleWebAction = (actionName: string) => {
    if (actionName === 'Fire') {
      if (ammo > 0) {
        setAmmo(a => a - 1)
        addLog('Web -> Unreal', 'Input.Action.PrimaryFire', { weapon: 'PulseRifle', remainingAmmo: ammo - 1 })
      }
    } else if (actionName === 'UseMedkit') {
      handleHeal()
      addLog('Web -> Unreal', 'Inventory.Item.Consumed', { itemId: 'Item_NanoMedkit_01' })
    } else if (actionName === 'ToggleBuff') {
      const nextBuff = activeBuff ? null : 'Buff.Overclock'
      setActiveBuff(nextBuff)
      addLog('Web -> Unreal', 'Tag.Buff.Toggled', { tag: nextBuff || 'None' })
    }
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-2xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Glow effect */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-semibold text-slate-300 font-mono">SWUI Live Bridge Simulator</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
            Unreal 5.4+ ↔ React
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setHealth(85)
              setShield(100)
              setAmmo(30)
              setActiveBuff('Buff.Overclock')
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors px-2.5 py-1 rounded bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Simulated Unreal Game HUD */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800 relative group">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-mono">Simulated Game Viewport (React WebUI Overlay)</span>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 60 FPS / CEF Shared Texture
              </span>
            </div>

            {/* Health & Shield Bars */}
            <div className="space-y-3.5 mb-6">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Heart className="w-3.5 h-3.5 fill-current" /> Health
                  </span>
                  <span className="text-slate-300">{health} / 100</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 ease-out"
                    style={{ width: `${health}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Shield className="w-3.5 h-3.5 fill-current" /> Shield
                  </span>
                  <span className="text-slate-300">{shield} / 100</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300 ease-out"
                    style={{ width: `${shield}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Status & Inventory */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                <div className="text-[11px] text-slate-400 font-mono mb-1">Active Buffs</div>
                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono font-medium">
                  <Zap className="w-3.5 h-3.5" />
                  {activeBuff || 'None'}
                </div>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                <div className="text-[11px] text-slate-400 font-mono mb-1">Ammunition</div>
                <div className="text-xs text-slate-200 font-mono font-medium">
                  {ammo} <span className="text-slate-500">/ 120</span>
                </div>
              </div>
            </div>

            {/* Control buttons simulating Unreal & React events */}
            <div className="border-t border-slate-850 pt-4 flex flex-wrap gap-2">
              <span className="w-full text-[11px] text-slate-400 font-mono mb-1">Simulate Unreal Triggers:</span>
              <button
                onClick={handleTakeDamage}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1.5"
              >
                Simulate Damage (-25)
              </button>
              <button
                onClick={handleHeal}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1.5"
              >
                Restore HP & Shield
              </button>
            </div>

            <div className="border-t border-slate-850 pt-3 mt-3 flex flex-wrap gap-2">
              <span className="w-full text-[11px] text-slate-400 font-mono mb-1">Simulate Web UI Events:</span>
              <button
                onClick={() => handleWebAction('Fire')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" /> Emit Fire Event
              </button>
              <button
                onClick={() => handleWebAction('ToggleBuff')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all"
              >
                Toggle Buff Tag
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Event Stream / Bridge Logs */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800 flex-1 flex flex-col font-mono text-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Realtime Bridge Traffic
              </span>
              <span className="text-[10px] text-slate-500 font-sans">JSON Transport</span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[340px] pr-1">
              {logs.map(log => (
                <div
                  key={log.id}
                  className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80 text-[11px] transition-all animate-fadeIn"
                >
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span
                      className={`font-semibold ${
                        log.source === 'Unreal -> Web' ? 'text-emerald-400' : 'text-cyan-400'
                      }`}
                    >
                      {log.source === 'Unreal -> Web' ? '◀ Unreal' : '▶ React'}
                    </span>
                    <span className="text-[10px] text-slate-500">{log.time}</span>
                  </div>
                  <div className="text-slate-200 font-medium">{log.event}</div>
                  <div className="mt-1 text-slate-400 text-[10px] bg-slate-950 p-1.5 rounded border border-slate-800 overflow-x-auto">
                    <code>{JSON.stringify(log.payload)}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
