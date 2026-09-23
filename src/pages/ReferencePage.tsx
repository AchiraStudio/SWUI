// @ts-nocheck
import React, { useEffect, useRef } from 'react'
import { $, $$, clamp, damp, el, loop, codeFig, makeCrosshair, hl, toast, copyText, observeReveal } from '../utils/engine'

interface PageProps {
  hidden?: boolean
}

export const ReferencePage: React.FC<PageProps> = ({ hidden }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const initedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || initedRef.current || hidden) return
    initedRef.current = true

    function initRef() {
      const REF_DATA = [
        // ================= C++ SUBSYSTEMS & ASSETS =================
        {
          cat: 'C++ Subsystems',
          name: 'USwuiDocumentManagerSubsystem::LoadDocumentAsset',
          desc: 'Loads and registers a USwuiDocumentAsset with the GameInstance coordinator.',
          sig: 'USwuiDocument* LoadDocumentAsset(USwuiDocumentAsset* Asset);',
          usage: 'DocMgr->LoadDocumentAsset(DA_MainHUD);',
        },
        {
          cat: 'C++ Subsystems',
          name: 'USwuiDocumentManagerSubsystem::ActivateDocument',
          desc: 'Attaches the document widget to the game viewport at specified Z-Order.',
          sig: 'bool ActivateDocument(FName DocumentId, int32 OverrideZOrder = -1);',
          usage: 'DocMgr->ActivateDocument(FName("Inventory"), 100);',
        },
        {
          cat: 'C++ Subsystems',
          name: 'USwuiDocumentManagerSubsystem::DeactivateDocument',
          desc: 'Removes document from viewport. If bEnableSleep is true, calls WasHidden() to stop GPU/CPU rasterization.',
          sig: 'bool DeactivateDocument(FName DocumentId);',
          usage: 'DocMgr->DeactivateDocument(FName("Inventory")); // Suspends CEF',
        },
        {
          cat: 'C++ Subsystems',
          name: 'USwuiDocumentManagerSubsystem::PreloadDocument',
          desc: 'Instantiates offscreen CEF browser in background without viewport attachment, eliminating runtime hitches.',
          sig: 'bool PreloadDocument(FName DocumentId);',
          usage: 'DocMgr->PreloadDocument(FName("Level02HUD")); // Background prewarm',
        },
        {
          cat: 'C++ Subsystems',
          name: 'USwuiDocumentManagerSubsystem::UnloadDocument',
          desc: 'Destroys browser instance, frees shared textures, and removes document registration.',
          sig: 'bool UnloadDocument(FName DocumentId);',
          usage: 'DocMgr->UnloadDocument(FName("Level01HUD"));',
        },
        {
          cat: 'C++ Subsystems',
          name: 'USwuiDocumentManagerSubsystem::GetDocumentState',
          desc: 'Returns current lifecycle state: Unloaded, Preloaded, Active, or Sleeping.',
          sig: 'ESwuiDocumentState GetDocumentState(FName DocumentId) const;',
          usage: 'if (DocMgr->GetDocumentState("Inventory") == ESwuiDocumentState::Active) { ... }',
        },
        {
          cat: 'C++ Subsystems',
          name: 'USwuiDocumentAsset',
          desc: 'Primary Data Asset defining document identity, entry URL, layer type, Z-order, and sleep policy.',
          sig: 'class SWUIRUNTIME_API USwuiDocumentAsset : public UPrimaryDataAsset',
          usage: 'UPROPERTY(EditAnywhere) FName DocumentId;\nUPROPERTY(EditAnywhere) FString EntryURL;\nUPROPERTY(EditAnywhere) ESwuiLayer Layer;\nUPROPERTY(EditAnywhere) int32 ZOrder;\nUPROPERTY(EditAnywhere) bool bIsTransparent;\nUPROPERTY(EditAnywhere) bool bEnableSleep;',
        },
        {
          cat: 'C++ Subsystems',
          name: 'USwuiDelegateBridge::ProcessEvent',
          desc: 'Overrides UObject::ProcessEvent to serialize dynamic multicast delegate parameters directly into JSON CustomEvents.',
          sig: 'virtual void ProcessEvent(UFunction* Function, void* Parms) override;',
          usage: '// Reads SignatureFunction FProperty list and serializes Parms buffer to JSON automatically',
        },
        {
          cat: 'C++ Subsystems',
          name: 'FSwuiInputPreprocessor',
          desc: 'Slate IInputProcessor forwarding keyboard, mouse, and wheel events directly into Chromium offscreen browser host.',
          sig: 'class FSwuiInputPreprocessor : public IInputProcessor',
          usage: 'SendKeyEvent(CefKeyEvent); // Enables HTML <input> and <textarea> typing inside Unreal',
        },

        // ================= K2 BLUEPRINT NODES =================
        {
          cat: 'Blueprint Nodes',
          name: 'K2Node_SwuiNavigationEvent',
          desc: 'Compile-time expanded node providing strongly-typed UScriptStruct pins for incoming JavaScript navigation commands.',
          sig: 'K2Node_SwuiNavigationEvent (Expands into JsonToStruct + FInstancedStruct)',
          usage: '// Graph: [OnNavigationEvent (Tag: onev.rooms.host)] ──► [Payload: FOneVRoomsHostPayload (Typed Pin)]',
        },
        {
          cat: 'Blueprint Nodes',
          name: 'K2Node_SwuiCommandHook',
          desc: 'Routes Blueprint commands to the active SWUI document runtime.',
          sig: 'K2Node_SwuiCommandHook',
          usage: '// Graph: [ExecuteCommand] ──► [Document: "MainHUD", Action: "ResetCrosshair"]',
        },
        {
          cat: 'Blueprint Nodes',
          name: 'K2Node_SwuiObserve',
          desc: 'Reflects changes on any UPROPERTY directly into the SWUI state tree without tick boilerplate.',
          sig: 'K2Node_SwuiObserve',
          usage: '// Graph: [Observe Property: PlayerCharacter.CurrentHealth] ──► Auto-synced to "Player.Health"',
        },
        {
          cat: 'Blueprint Nodes',
          name: 'K2Node_SwuiObserveEvent',
          desc: 'Listens to dynamic multicast delegates and passes typed parameters into SWUI events.',
          sig: 'K2Node_SwuiObserveEvent',
          usage: '// Graph: [Observe Delegate: OnPlayerFiredShot] ──► Emits "Weapon.OnPlayerFiredShot"',
        },

        // ================= CONSOLE VARIABLES (CVARS) =================
        {
          cat: 'CVars',
          name: 'swui.debug.Stats',
          desc: 'Toggles the on-screen runtime stats HUD overlay (CEF FPS, Presented FPS, Latency, Flushes).',
          sig: 'swui.debug.Stats <0|1> (Default: 0)',
          usage: 'swui.debug.Stats 1',
        },
        {
          cat: 'CVars',
          name: 'swui.hud.Lockstep',
          desc: 'Forces Chromium frame production to lockstep with the Unreal Engine frame rate.',
          sig: 'swui.hud.Lockstep <0|1> (Default: 0)',
          usage: 'swui.hud.Lockstep 1',
        },
        {
          cat: 'CVars',
          name: 'swui.hud.MaxBrowserFPS',
          desc: 'Sets the maximum browser frame rate cap.',
          sig: 'swui.hud.MaxBrowserFPS <int32> (Default: 60)',
          usage: 'swui.hud.MaxBrowserFPS 60',
        },
        {
          cat: 'CVars',
          name: 'swui.cefMessageLoopBudgetMs',
          desc: 'Maximum GameThread budget in milliseconds allocated for pumping CEF messages per frame.',
          sig: 'swui.cefMessageLoopBudgetMs <float> (Default: 1.5)',
          usage: 'swui.cefMessageLoopBudgetMs 2.0',
        },
        {
          cat: 'CVars',
          name: 'swui.gpuAccelerated',
          desc: 'Enables Direct3D 11 GPU Shared Texture zero-copy pipeline (Windows x64 / ARM64).',
          sig: 'swui.gpuAccelerated <0|1> (Default: 1)',
          usage: 'swui.gpuAccelerated 1',
        },
        {
          cat: 'CVars',
          name: 'swui.paint.HybridDirtyUpload',
          desc: 'Enables partial dirty-rect texture uploads to eliminate full-frame VRAM bandwidth overhead.',
          sig: 'swui.paint.HybridDirtyUpload <0|1> (Default: 1)',
          usage: 'swui.paint.HybridDirtyUpload 1',
        },
        {
          cat: 'CVars',
          name: 'swui.verbosePaint',
          desc: 'Logs detailed texture upload dimensions, paint rects, and Slate blit timings to Output Log.',
          sig: 'swui.verbosePaint <0|1> (Default: 0)',
          usage: 'swui.verbosePaint 1',
        },
        {
          cat: 'CVars',
          name: 'swui.debug.ShowDirtyRects',
          desc: 'Draws green bounding boxes over rendered dirty rects on the Slate viewport.',
          sig: 'swui.debug.ShowDirtyRects <0|1> (Default: 0)',
          usage: 'swui.debug.ShowDirtyRects 1',
        },

        // ================= CORE SDK =================
        {
          cat: 'Core SDK',
          name: 'swui.state.get',
          desc: 'Synchronously reads the current value of a state field.',
          sig: "swui.state.get<T>(tag: string): T",
          usage: "const ammo = swui.state.get<number>('Weapon.CurrentAmmo');",
        },
        {
          cat: 'Core SDK',
          name: 'swui.state.subscribe',
          desc: 'Subscribes to changes for a specific tag. Returns an unsubscribe function.',
          sig: "swui.state.subscribe<T>(tag: string, fn: (val: T) => void): () => void",
          usage: "const unsub = swui.state.subscribe('Player.Health', hp => updateHud(hp));",
        },
        {
          cat: 'Core SDK',
          name: 'swui.state.onBatch',
          desc: 'Fires once per frame with the complete atomic batch of mutated fields.',
          sig: "swui.state.onBatch(fn: (batch: { version: number, fields: Record<string, any> }) => void): () => void",
          usage: "swui.state.onBatch(b => console.log('State version:', b.version));",
        },
        {
          cat: 'Core SDK',
          name: 'swui.state.onTick',
          desc: 'Synchronized with Unreal Engine frame tick (respects time dilation and pausing).',
          sig: "swui.state.onTick(fn: ({ dt, time, paused }: TickData) => void): () => void",
          usage: "swui.state.onTick(({ dt, paused }) => { if (!paused) stepPhysics(dt); });",
        },
        {
          cat: 'Core SDK',
          name: 'swui.events.emit',
          desc: 'Emits a tag-routed navigation command to Unreal Engine.',
          sig: "swui.events.emit<T>(tag: string, payload: T): void",
          usage: "swui.events.emit('UI.Inventory.UseItem', { itemId: 'medkit', slot: 1 });",
        },
        {
          cat: 'Core SDK',
          name: 'swui.events.on',
          desc: 'Subscribes to reflected Unreal Engine dynamic multicast delegates.',
          sig: "swui.events.on<T>(tag: string, fn: (payload: T) => void): () => void",
          usage: "swui.events.on('Weapon.OnPlayerFiredShot', e => kickCrosshair(e.spread));",
        },
        {
          cat: 'Core SDK',
          name: 'swui.navigation.onNavigate',
          desc: 'Directional focus navigation callback for Gamepad / Keyboard D-Pad.',
          sig: "swui.navigation.onNavigate(fn: (direction: 'up'|'down'|'left'|'right') => void): () => void",
          usage: "swui.navigation.onNavigate(dir => grid.move(dir));",
        },
        {
          cat: 'Core SDK',
          name: 'swui.animation.createSpring',
          desc: 'Creates a physics spring with stiffness, damping, and mass.',
          sig: "swui.animation.createSpring(options: { stiffness: number, damping: number, mass?: number }): Spring",
          usage: "const spring = swui.animation.createSpring({ stiffness: 180, damping: 24 });",
        },

        // ================= REACT HOOKS =================
        {
          cat: 'React Hooks',
          name: 'useSwuiState',
          desc: 'React hook that subscribes to an Unreal state field and triggers component re-renders.',
          sig: "useSwuiState<T>(tag: string, fallback: T): T",
          usage: "const health = useSwuiState<number>('Player.Health', 100);",
        },
        {
          cat: 'React Hooks',
          name: 'useSwuiEvent',
          desc: 'React hook for subscribing to reflected Unreal delegates with automatic unmount cleanup.',
          sig: "useSwuiEvent<T>(tag: string, callback?: (data: T) => void): { on: Function }",
          usage: "useSwuiEvent('Weapon.Reload', () => playReloadSound());",
        },
        {
          cat: 'React Hooks',
          name: 'useSwuiNavigation',
          desc: 'React hook that binds Gamepad spatial navigation handlers to component focus.',
          sig: "useSwuiNavigation(bindings: { onConfirm?: Function, onCancel?: Function, onNextTab?: Function }): void",
          usage: "useSwuiNavigation({ onConfirm: () => openModal(), onCancel: () => closeModal() });",
        },
        {
          cat: 'React Hooks',
          name: 'useSwuiTimeline',
          desc: 'React hook providing a game-time scaled animation progress value (0.0 to 1.0).',
          sig: "useSwuiTimeline(durationSeconds: number): { progress: number, isPlaying: boolean, play: Function }",
          usage: "const { progress, play } = useSwuiTimeline(2.5);",
        },

        // ================= CLI =================
        {
          cat: 'CLI',
          name: 'swui dev',
          desc: 'Starts local Vite dev server with live hot-module reload reflected inside Unreal editor.',
          sig: "npx swui dev [--port 5173]",
          usage: "$ npx swui dev",
        },
        {
          cat: 'CLI',
          name: 'swui build --production',
          desc: 'Compiles frontend bundle and exports production static assets into Unreal Content/UI folder.',
          sig: "npx swui build --production [--out Content/UI/dist]",
          usage: "$ npx swui build --production",
        },
      ]

      const searchInput = $('#refSearch')
      const catPills = $$('.ref-cat-pill')
      const listEl = $('#refList')
      let activeCat = 'All'

      const render = () => {
        const query = (searchInput?.value || '').toLowerCase().trim()
        const filtered = REF_DATA.filter(item => {
          const matchCat = activeCat === 'All' || item.cat === activeCat
          const matchQuery = !query ||
            item.name.toLowerCase().includes(query) ||
            item.desc.toLowerCase().includes(query) ||
            item.cat.toLowerCase().includes(query) ||
            item.sig.toLowerCase().includes(query)
          return matchCat && matchQuery
        })

        if (!listEl) return
        $('#refCount').textContent = `${filtered.length} entries`

        listEl.innerHTML = filtered.length ? filtered.map(item => `
          <div class="ref-entry open" style="margin-bottom:12px">
            <button class="ref-h" style="padding:12px 16px">
              <span class="nm mono" style="font-weight:600;color:var(--acc)">${item.name}</span>
              <span class="pu dim" style="font-size:12px">${item.desc}</span>
              <span class="ct mono" style="font-size:9.5px;text-transform:uppercase">${item.cat}</span>
              <svg><use href="#i-chev"/></svg>
            </button>
            <div class="ref-b" style="padding:12px 16px;background:var(--card2)">
              <div class="mono" style="font-size:10px;color:var(--mut);margin-bottom:6px;letter-spacing:.08em">// SIGNATURE</div>
              <div class="sig mono" style="font-size:11.5px;color:var(--fg);margin-bottom:12px">${item.sig.replace(/</g, '&lt;')}</div>
              <div class="mono" style="font-size:10px;color:var(--mut);margin-bottom:6px;letter-spacing:.08em">// USAGE EXAMPLE</div>
              <pre class="mono" style="font-size:11px;line-height:1.5;padding:8px 12px;background:var(--card);border:1px solid var(--ln2);color:var(--fg);margin:0;overflow-x:auto">${item.usage.replace(/</g, '&lt;')}</pre>
            </div>
          </div>
        `).join('') : '<p class="dim mono" style="font-size:13px;padding:32px;text-align:center">No matching reference entries found.</p>'

        $$('.ref-entry', listEl).forEach(entry => {
          $('.ref-h', entry)?.addEventListener('click', () => entry.classList.toggle('open'))
        })
      }

      catPills.forEach(pill => {
        pill.addEventListener('click', () => {
          catPills.forEach(p => p.classList.remove('on'))
          pill.classList.add('on')
          activeCat = pill.dataset.cat || 'All'
          render()
        })
      })

      searchInput?.addEventListener('input', render)
      render()
    }

    try {
      initRef()
    } catch (e) {
      console.error('Error in initRef:', e)
    }

    observeReveal(containerRef.current)
  }, [hidden])

  return (
    <div
      ref={containerRef}
      className="page paper"
      data-page="reference"
      hidden={hidden}
      dangerouslySetInnerHTML={{
        __html: `
  <header class="pgh"><div class="wrap">
    <div class="eyebrow">Technical Reference</div>
    <h1>Authoritative Surface.<br><em>C++, Blueprints, CVars &amp; SDK.</em></h1>
    <p class="lead">Complete technical specification of SWUI 3.0 on Unreal Engine 5.8.3. Search across C++ Subsystems, K2 Blueprint Nodes, Console Variables, and TypeScript bindings with signatures and usage examples.</p>
  </div></header>

  <section class="sec" style="border-top:0;padding-top:28px"><div class="wrap">
    <!-- Search & Filters -->
    <div style="margin-bottom:24px">
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:16px">
        <input type="text" id="refSearch" placeholder="Search reference — try 'Preload', 'Lockstep', 'useSwuiState'…" aria-label="Search technical reference" style="flex:1;min-width:260px;max-width:540px">
        <span class="mono dim" id="refCount" style="font-size:11px"></span>
      </div>

      <div class="api-strip" style="flex-wrap:wrap;gap:6px">
        <button class="tbtn ref-cat-pill on" data-cat="All">All</button>
        <button class="tbtn ref-cat-pill" data-cat="C++ Subsystems">C++ Subsystems</button>
        <button class="tbtn ref-cat-pill" data-cat="Blueprint Nodes">Blueprint Nodes</button>
        <button class="tbtn ref-cat-pill" data-cat="CVars">Console Variables (CVars)</button>
        <button class="tbtn ref-cat-pill" data-cat="Core SDK">Core SDK</button>
        <button class="tbtn ref-cat-pill" data-cat="React Hooks">React Hooks</button>
        <button class="tbtn ref-cat-pill" data-cat="CLI">CLI</button>
      </div>
    </div>

    <!-- Results List -->
    <div id="refList" class="rv"></div>
  </div></section>
</div>
`
      }}
    />
  )
}
