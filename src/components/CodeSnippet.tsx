import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export const CodeSnippet: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'react' | 'unreal' | 'ts'>('react')
  const [copied, setCopied] = useState(false)

  const codeExamples = {
    react: `import React, { useEffect, useState } from 'react'
import { swui } from '@simplewebui/client'

export function HealthBar() {
  const [health, setHealth] = useState(100)

  useEffect(() => {
    // Automatically bound to Unreal character health property
    const unsubscribe = swui.observe<number>('Player.Health', (newVal) => {
      setHealth(newVal)
    })
    return () => unsubscribe()
  }, [])

  const handleUsePotion = () => {
    // Emits GameplayTag event straight to Unreal Engine
    swui.emit('Player.Action.UseItem', { itemId: 'Potion_Health_Large' })
  }

  return (
    <div className="hud-container">
      <div className="health-fill" style={{ width: \`\${health}%\` }} />
      <button onClick={handleUsePotion}>Quick Heal</button>
    </div>
  )
}`,
    unreal: `// Unreal Engine C++ / Header
UCLASS()
class MYGAME_API AMyPlayerCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    // Mark with UPROPERTY to expose directly to SWUI
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "SWUI")
    float PlayerHealth = 100.0f;

    // Blueprint / GameplayTag event dispatcher
    UFUNCTION(BlueprintCallable, Category = "SWUI")
    void OnReceiveWebAction(FGameplayTag ActionTag, const FString& PayloadJson);
};`,
    ts: `// Generated TypeScript definitions from Unreal reflection
export namespace SWUI {
  export interface PlayerState {
    PlayerHealth: number;
    PlayerShield: number;
    ActiveGameplayTags: string[];
    InventoryItems: Array<{
      ItemId: string;
      Quantity: number;
    }>;
  }

  export type GameplayActionTags =
    | 'Player.Action.PrimaryFire'
    | 'Player.Action.UseItem'
    | 'UI.Menu.TogglePause';
}`
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeExamples[activeTab])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="py-16 px-6 max-w-5xl mx-auto">
      <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden font-mono text-sm">
        {/* Tabs header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('react')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'react'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              React (Hud.tsx)
            </button>
            <button
              onClick={() => setActiveTab('unreal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'unreal'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unreal C++ (Player.h)
            </button>
            <button
              onClick={() => setActiveTab('ts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'ts'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Generated Types (swui.d.ts)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Code body */}
        <div className="p-5 overflow-x-auto text-xs md:text-sm text-slate-300 leading-relaxed bg-[#0b0f17]">
          <pre>
            <code>{codeExamples[activeTab]}</code>
          </pre>
        </div>
      </div>
    </section>
  )
}
