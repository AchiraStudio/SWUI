// @ts-nocheck
import React, { useEffect, useRef } from 'react'
import { $, $$, clamp, damp, el, loop, codeFig, makeCrosshair, hl, toast, copyText, observeReveal } from '../utils/engine'
import { SNIP } from '../data/snippets'

interface PageProps {
  hidden?: boolean
}

export const ExamplesPage: React.FC<PageProps> = ({ hidden }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const initedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || initedRef.current || hidden) return
    initedRef.current = true

    function initExamples() {
      // ================= 01: HUD + INVENTORY =================
      const xh = makeCrosshair($('#exXh'))
      let spread = 0.22, kick = 0, invOpen = false, exTime = 0
      let ammoCount = 24

      const exLoop = loop($('#exView'), dt => {
        exTime += dt
        kick = damp(kick, 0, 8, dt)
        spread = clamp(0.2 + Math.sin(exTime * 0.9) * 0.07 + kick, 0.05, 0.95)
        xh.set(spread, 'PRECISE')
      })

      const grid = $('#exInvGrid')
      const items = [
        { name: 'Nanite Medkit', count: '×3', id: 'medkit_01', type: 'Heal (+50 HP)' },
        { name: 'Pulse Rifle Ammo', count: '×180', id: 'ammo_pulse', type: 'Ammo (+60)' },
        { name: 'Security Keycard — Vault 4', count: '×1', id: 'key_vault4', type: 'Quest item' },
        { name: 'Composite Armor Plate', count: '×2', id: 'armor_plate', type: 'Shield (+75)' },
        { name: 'Stasis Mine', count: '×4', id: 'mine_stasis', type: 'Deployable' },
        { name: 'Plasma Injector Core', count: '×1', id: 'core_plasma', type: 'Crafting component' },
      ]

      grid.innerHTML = ''
      items.forEach((it, idx) => {
        const itemEl = el('div', 'inv-item', `
          <div class="inv-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg></div>
          <div style="flex:1;min-width:0">
            <div class="nm" style="font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${it.name}</div>
            <div class="ct mono dim" style="font-size:10.5px">${it.count} · ${it.type}</div>
          </div>
          <button class="tbtn pri inv-use" data-idx="${idx}" style="padding:4px 9px;font-size:9.5px">Use</button>
        `)
        grid.appendChild(itemEl)
      })

      const traceBox = $('#exTrace')
      const trace = (s: string) => {
        const timestamp = new Date().toISOString().substring(11, 19)
        const line = `<div style="margin-bottom:6px;border-left:2px solid var(--blaze);padding-left:8px"><span class="mono dim" style="font-size:9.5px">[${timestamp}]</span> ${s}</div>`
        traceBox.innerHTML = line + traceBox.innerHTML.split('</div>').slice(0, 8).join('</div>')
      }
      trace('<span class="mono">Viewport ready. Click viewport or tap button to toggle inventory (I / Esc).</span>')

      const setInvOpen = (open: boolean) => {
        invOpen = open
        const invModal = $('#exInv')
        if (invModal) invModal.style.display = open ? 'flex' : 'none'
        const hint = $('#exHintC')
        if (hint) hint.textContent = open ? 'Inventory Active · [ESC] to close' : 'Click to focus · Press [I] or [TAB] for inventory'
        
        if (open) {
          trace(`<b style="color:var(--acc)">Input Captured:</b> <span class="mono">SetInputModeGameAndUI() · bShowMouseCursor = true</span><br><span class="mono dim">USwuiDocumentManagerSubsystem::ActivateDocument("Inventory", ZOrder: 100)</span>`)
        } else {
          trace(`<b style="color:var(--ok)">Input Released:</b> <span class="mono">SetInputModeGameOnly() · bShowMouseCursor = false</span><br><span class="mono dim">USwuiDocumentManagerSubsystem::DeactivateDocument("Inventory") [Sleep mode active: 0% GPU/CPU]</span>`)
        }
      }

      const viewEl = $('#exView')
      viewEl.addEventListener('keydown', (e: KeyboardEvent) => {
        if ((e.key === 'i' || e.key === 'I' || e.key === 'Tab') && !invOpen) {
          e.preventDefault()
          setInvOpen(true)
        } else if (e.key === 'Escape' && invOpen) {
          e.preventDefault()
          setInvOpen(false)
        }
      })

      $('#exToggleBtn')?.addEventListener('click', () => setInvOpen(!invOpen))
      $('#exCloseInv')?.addEventListener('click', () => setInvOpen(false))

      $$('.inv-use', grid).forEach((btn: HTMLElement) => {
        btn.addEventListener('click', (e: Event) => {
          e.stopPropagation()
          const idx = parseInt(btn.dataset.idx || '0', 10)
          const it = items[idx]
          kick = 0.4
          xh.hit()
          trace(`<span style="color:var(--blaze)">window.__SWUI__.send:</span> <span class="mono">{"type":"navigation","tag":"UI.Inventory.UseItem","payload":{"itemId":"${it.id}","slot":${idx + 1}}}</span><br><span class="mono dim">Blueprint HandleUINavEvent executed → Item used</span>`)
          toast(`Used: ${it.name}`)
        })
      })

      // Tabs for Recipe 01 Code
      const r1Tabs = $$('.r1-tab')
      const r1Panes = {
        bp: $('#r1CodeBp'),
        js: $('#r1CodeJs'),
        asset: $('#r1CodeAsset'),
      }
      r1Tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          r1Tabs.forEach(t => t.classList.remove('on'))
          tab.classList.add('on')
          const key = tab.dataset.tab
          Object.keys(r1Panes).forEach(k => {
            if (r1Panes[k]) r1Panes[k].style.display = k === key ? 'block' : 'none'
          })
        })
      })

      // ================= 02: PAUSE MENU (TICK WHEN PAUSED) =================
      const pmxh = makeCrosshair($('#pmXhIn'))
      let pmk = 0, pmt = 0, isPaused = false
      let pmSubpage = 'main'

      const pmLoop = loop($('#pmView'), dt => {
        if (isPaused) return // World stops ticking!
        pmt += dt
        pmk = damp(pmk, 0, 7, dt)
        pmxh.set(0.24 + Math.sin(pmt * 1.1) * 0.08 + pmk, 'EXPANDED')
      })

      const pmTrace = $('#pmTrace')
      const pmLog = (s: string) => {
        const time = new Date().toISOString().substring(11, 19)
        pmTrace.innerHTML = `<div style="margin-bottom:6px;border-left:2px solid var(--acc);padding-left:8px"><span class="mono dim" style="font-size:9.5px">[${time}]</span> ${s}</div>` + pmTrace.innerHTML.split('</div>').slice(0, 6).join('</div>')
      }
      pmLog('<span class="mono">Game world running at 60 FPS. Click "Pause World" or press Esc.</span>')

      const setPausedState = (pause: boolean) => {
        isPaused = pause
        pmSubpage = 'main'
        const menu = $('#pmMenu')
        const title = $('#pmTitle')
        const btn = $('#pmBtn')
        const mainPanel = $('#pmMainPanel')
        const settingsPanel = $('#pmSettingsPanel')

        if (pause) {
          if (menu) menu.style.display = 'flex'
          if (mainPanel) mainPanel.style.display = 'block'
          if (settingsPanel) settingsPanel.style.display = 'none'
          if (title) title.innerHTML = '<span style="color:var(--blaze)">● WORLD PAUSED</span> · pause.html ACTIVE (TickableWhenPaused = true)'
          if (btn) { btn.textContent = 'Unpause World'; btn.classList.add('on') }
          pmLog(`<b style="color:var(--blaze)">UGameplayStatics::SetGamePaused(true):</b> World DeltaTime = 0.0s (frozen).<br><span class="mono dim">USwuiDocumentManagerSubsystem (FTickableGameObject) continues ticking Chromium at 60 FPS!</span>`)
        } else {
          if (menu) menu.style.display = 'none'
          if (title) title.innerHTML = '<span style="color:var(--ok)">● WORLD RUNNING</span> · pause.html: Deactivated'
          if (btn) { btn.textContent = 'Pause World (Esc)'; btn.classList.remove('on') }
          pmLog(`<b style="color:var(--ok)">UGameplayStatics::SetGamePaused(false):</b> World resumes.<br><span class="mono dim">Input mode restored to FInputModeGameOnly().</span>`)
        }
      }

      $('#pmBtn')?.addEventListener('click', () => setPausedState(!isPaused))
      $('#pmResume')?.addEventListener('click', () => setPausedState(false))
      $('#pmOpenSettings')?.addEventListener('click', () => {
        pmSubpage = 'settings'
        $('#pmMainPanel').style.display = 'none'
        $('#pmSettingsPanel').style.display = 'block'
        pmLog(`<span class="mono">Page transition: pause.html navigated to Settings. Pressing Cancel (Esc) will return to Main Menu.</span>`)
      })
      $('#pmBackSettings')?.addEventListener('click', () => {
        pmSubpage = 'main'
        $('#pmSettingsPanel').style.display = 'none'
        $('#pmMainPanel').style.display = 'block'
        pmLog(`<span class="mono">Page-aware cancel: Back to Main Pause Menu.</span>`)
      })
      $('#pmQuit')?.addEventListener('click', () => {
        toast('Emitted UI.Menu.QuitGame → Unreal Confirmation Dialog')
        pmLog(`<span class="mono" style="color:var(--acc)">swui.events.emit('UI.Menu.QuitGame') → Native quit action called.</span>`)
      })

      // Tabs for Recipe 02 Code
      const r2Tabs = $$('.r2-tab')
      const r2Panes = {
        bp: $('#r2CodeBp'),
        react: $('#r2CodeReact'),
      }
      r2Tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          r2Tabs.forEach(t => t.classList.remove('on'))
          tab.classList.add('on')
          const key = tab.dataset.tab
          Object.keys(r2Panes).forEach(k => {
            if (r2Panes[k]) r2Panes[k].style.display = k === key ? 'block' : 'none'
          })
        })
      })

      // ================= 03: ZERO-STUTTER LEVEL PRELOAD SIMULATOR =================
      const plBtn = $('#plStartBtn')
      const plBar = $('#plProgressBar')
      const plStage = $('#plStage')
      const plLog = $('#plLog')
      let plRunning = false

      plBtn?.addEventListener('click', () => {
        if (plRunning) return
        plRunning = true
        plBtn.disabled = true
        let progress = 0
        plStage.textContent = 'Entering Level Travel: Streaming Level 02...'
        plLog.innerHTML = `<span class="mono dim">[0.0s] Level travel initiated (OpenLevel / ServerTravel)...</span>`
        
        const interval = setInterval(() => {
          progress += 5
          if (plBar) plBar.style.width = progress + '%'
          
          if (progress === 30) {
            plStage.textContent = 'Background Preload: USwuiDocumentManagerSubsystem::PreloadDocument("Level02HUD")'
            plLog.innerHTML += `<br><span class="mono" style="color:var(--acc)">[0.4s] PreloadDocument("Level02HUD") triggered: CEF browser instance spawned offscreen, compiling React & shaders.</span>`
          } else if (progress === 70) {
            plStage.textContent = 'Level 02 World Ready · Preloaded texture handle ready in VRAM'
            plLog.innerHTML += `<br><span class="mono" style="color:var(--ok)">[1.0s] Preload completed in background. Frame time during load: 0ms hitch in main thread.</span>`
          } else if (progress >= 100) {
            clearInterval(interval)
            plRunning = false
            plBtn.disabled = false
            plStage.textContent = 'Level Transition Complete · ActivateDocument("Level02HUD") Instantaneous!'
            plLog.innerHTML += `<br><b style="color:var(--blaze)">[1.4s] DocMgr->ActivateDocument("Level02HUD"): Instant viewport attach at locked 60 FPS! 0ms hitch!</b>`
            toast('Level 02 HUD activated with 0ms hitch!')
          }
        }, 70)
      })

      // ================= 04: IN-WORLD 3D MESH TERMINAL =================
      const term = $('#twTerm')
      const termCmdInput = $('#termCmdInput')
      const termOutputs: Record<string, string> = {
        status: `[REACTOR STATUS]\nCore Temp: 412.8 K (NOMINAL)\nMagnetic Containment: 99.4%\nCoolant Loop A/B: ACTIVE\nSWUI Surface: Direct D3D11 Shared Texture`,
        power: `[POWER GRID]\nOutput: 4.8 GW\nColony Grid Demand: 3.2 GW\nSurplus Battery Reserve: 98%\nPower routed to Subsystems.`,
        matrix: `[SWUI RENDER PIPELINE]\nRenderer: USwuiWorldWidget\nResolution: 1024x1024 RGBA8\nTarget: Dynamic Material Instance\nParameter: 'UI_Texture'`,
        ping: `[PING TELEMETRY]\nGameThread -> CEF: 0.14 ms\nPaintToPresent: 3.8 ms\nFrame drops: 0`,
        help: `Available commands: status, power, matrix, ping, clear`,
      }

      function appendTerm(text: string) {
        if (!term) return
        term.textContent += text + '\n'
        term.scrollTop = term.scrollHeight
      }

      termCmdInput?.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          const raw = termCmdInput.value.trim().toLowerCase()
          termCmdInput.value = ''
          if (!raw) return
          appendTerm(`> ${raw}`)
          if (raw === 'clear') {
            term.textContent = ''
          } else if (termOutputs[raw]) {
            appendTerm(termOutputs[raw])
          } else {
            appendTerm(`Command not recognized: '${raw}'. Type 'help' for commands.`)
          }
        }
      })

      // Initial terminal prompt
      if (term && !term.textContent) {
        term.textContent = `COLONY-NET SECURE TERMINAL v5.8.3\nUSwui Actor Component Active.\nType 'help' or click commands below.\n----------------------------------------\n`
      }
      $$('.term-quick-btn').forEach((b: HTMLElement) => {
        b.addEventListener('click', () => {
          const cmd = b.dataset.cmd || 'status'
          appendTerm(`> ${cmd}`)
          if (termOutputs[cmd]) appendTerm(termOutputs[cmd])
        })
      })

      // ================= 05: GAMEPAD & SPATIAL NAVIGATION =================
      let focusedNavIndex = 0
      const navButtons = $$('.nav-btn-item')
      const navFeedback = $('#navFeedback')

      const updateNavFocus = (index: number) => {
        focusedNavIndex = clamp(index, 0, navButtons.length - 1)
        navButtons.forEach((btn, idx) => {
          btn.classList.toggle('focused', idx === focusedNavIndex)
        })
        if (navFeedback) {
          const active = navButtons[focusedNavIndex]
          navFeedback.textContent = `Focused: [${active?.dataset.label || 'Item'}] · Key: ${focusedNavIndex + 1}`
        }
      }

      $('#navUp')?.addEventListener('click', () => updateNavFocus(focusedNavIndex - 3))
      $('#navDown')?.addEventListener('click', () => updateNavFocus(focusedNavIndex + 3))
      $('#navLeft')?.addEventListener('click', () => updateNavFocus(focusedNavIndex - 1))
      $('#navRight')?.addEventListener('click', () => updateNavFocus(focusedNavIndex + 1))
      $('#navConfirm')?.addEventListener('click', () => {
        const active = navButtons[focusedNavIndex]
        toast(`Confirmed: ${active?.dataset.label}`)
        if (navFeedback) navFeedback.innerHTML = `<span style="color:var(--ok)">SwuiNavigation::Confirm() → Action: ${active?.dataset.label} triggered!</span>`
      })
      $('#navCancel')?.addEventListener('click', () => {
        toast(`Cancel / Back pressed`)
        if (navFeedback) navFeedback.innerHTML = `<span style="color:var(--acc)">SwuiNavigation::Cancel() → Document hierarchy stepped back</span>`
      })

      // Use-case index list
      const UC = [
        ['Gameplay HUD', 'Level Layer (Z-10)', 'State subscriptions, ROI partial blit, lockstep pacing'],
        ['Modal Inventory', 'Modal Layer (Z-100)', 'Full input capture, WasHidden sleep mode, Esc key routing'],
        ['Pause Menu', 'Modal Layer (Z-200)', 'TickableWhenPaused = true, page-aware Cancel behavior'],
        ['Dialogue System', 'Level Layer (Z-20)', 'Reflected strings, dynamic response buttons, typewriter effects'],
        ['World Map / Radar', 'Level Layer (Z-15)', 'Full-screen canvas, zoom/pan transforms, spatial points of interest'],
        ['3D Mesh Terminal', 'In-World Actor Component', 'Dynamic Material Instance, UV texture blit, in-game cursor'],
        ['Cockpit Instrument Panel', 'In-World Actor Component', 'Direct D3D11 shared texture, 60 FPS live gauges'],
        ['Gamepad Skill Wheel', 'Modal Layer (Z-80)', 'SwuiNavigation radial focus, stick input smoothing'],
        ['Settings & Audio Controls', 'Modal Layer (Z-150)', 'Two-way CVars binding, resolution dropdown, volume sliders'],
        ['Loading Screen / Level Transition', 'Engine Persistent Layer', 'DocMgr->PreloadDocument(), zero hitch asset compilation'],
        ['Diegetic Cyberware HUD', 'Level Layer (Z-12)', 'Curved CSS perspective, chromatic aberration shaders'],
        ['In-Game Chat / Social', 'Level Layer (Z-30)', 'CEF input preprocessor, editable <input>, Slate IME'],
      ]
      const ucList = $('#ucList')
      if (ucList) {
        ucList.innerHTML = `
          <div class="th" style="display:grid;grid-template-columns:1fr 1fr 1.5fr;gap:12px;padding:10px 14px;border-bottom:1px solid var(--ln);font:500 10.5px var(--mono);text-transform:uppercase;color:var(--mut)">
            <span>Use Case</span>
            <span>Document Layer & Z-Order</span>
            <span>Key SWUI 3.0 Systems</span>
          </div>
        ` + UC.map(([n, l, s]) => `
          <div class="drow" style="display:grid;grid-template-columns:1fr 1fr 1.5fr;gap:12px;padding:12px 14px;border-bottom:1px solid var(--ln2);align-items:center">
            <span class="dn" style="font-family:var(--sans);font-weight:600;font-size:13.5px">${n}</span>
            <span class="mono" style="font-size:11px;color:var(--acc)">${l}</span>
            <span class="dl dim" style="font-size:12px">${s}</span>
          </div>
        `).join('')
      }
    }

    try {
      initExamples()
    } catch (e) {
      console.error('Error in initExamples:', e)
    }

    observeReveal(containerRef.current)
  }, [hidden])

  return (
    <div
      ref={containerRef}
      className="page inksec"
      data-page="examples"
      hidden={hidden}
      dangerouslySetInnerHTML={{
        __html: `
  <header class="pgh"><div class="wrap">
    <div class="eyebrow" style="color:var(--acc)">SWUI 3.0 · Unreal Engine 5.8.3 Recipes</div>
    <h1>Production Recipes.<br><em>Built &amp; battle-tested.</em></h1>
    <p class="lead">Concrete, production-ready recipes extracted directly from the Unreal Engine 5.8.3 plugin source and documentation. Explore live interactive simulations of modal inventory, pause menus that tick while the world freezes, zero-stutter preloading, and in-world 3D mesh surfaces.</p>
    <div class="api-strip" style="margin-top:24px">
      <span class="chip on">Recipe 1: Modal HUD</span>
      <span class="chip">Recipe 2: Paused-World Menu</span>
      <span class="chip">Recipe 3: Preload Travel</span>
      <span class="chip">Recipe 4: In-World 3D UI</span>
      <span class="chip">Recipe 5: Gamepad Nav</span>
    </div>
  </div></header>

  <!-- ================= RECIPE 01: HUD + MODAL INVENTORY ================= -->
  <section class="sec" style="border-top:0"><div class="wrap">
    <div class="shead"><span class="sidx">01</span><span class="slbl">Gameplay HUD + Modal Inventory</span><span class="srule"></span><span class="stag">Input Arbitration · Sleep Mode</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(22px,2.6vw,42px)">Layered presentation.<br><span class="si">Zero input leakage.</span></h2>
      <p class="lead">The gameplay HUD remains lightweight on Z-Order 10. Opening the inventory activates a modal document on Z-Order 100, routes input via <span class="mono">SetInputModeGameAndUI()</span>, and completely suspends GPU/CPU work when closed via Chromium sleep mode.</p>
    </div>

    <div class="cx rv">
      <div class="cx-view" id="exView" tabindex="0" aria-label="Game viewport. Press I for inventory, Escape to close." style="min-height:360px">
        <div class="floor"></div>
        <div style="position:absolute;inset:0" id="exXh"></div>
        
        <!-- Live HUD elements -->
        <div class="hudel" style="left:20px;top:20px">
          <div class="htag">Player Vitals</div>
          <div class="hnum"><b>100</b> / 100 HP</div>
          <div class="bar" style="width:140px"><i style="width:100%"></i></div>
        </div>
        <div class="hudel hud-ammo" style="right:20px;bottom:20px">
          <div class="big"><span id="exAmmo">24</span><span> / 180</span></div>
          <div class="htag" style="text-align:right">Pulse Rifle · Full Auto</div>
        </div>
        <div class="hudel" style="left:50%;bottom:20px;transform:translateX(-50%)">
          <span class="chip" id="exHintC" style="color:var(--bone);border-color:rgba(239,238,232,.35);background:rgba(16,17,20,.7)">Click to focus · Press [I] or [TAB] for inventory</span>
        </div>

        <!-- Modal Inventory overlay -->
        <div id="exInv" style="position:absolute;inset:0;background:rgba(8,9,11,.84);backdrop-filter:blur(6px);display:none;z-index:100;align-items:center;justify-content:center;padding:16px">
          <div style="width:min(520px,94%);border:1px solid var(--blaze);background:rgba(18,19,23,.98);box-shadow:0 24px 60px rgba(0,0,0,.8)">
            <div class="plate-h" style="border-bottom:1px solid rgba(255,77,0,.3)">
              <span class="sq"></span>inventory.html · MODAL · Z-100 · ACTIVE
              <span class="sp"></span>
              <button class="tbtn" id="exCloseInv" style="padding:2px 8px;font-size:10px">✕ Close [ESC]</button>
            </div>
            <div style="padding:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px" id="exInvGrid"></div>
            <div style="padding:10px 16px;background:rgba(0,0,0,.4);border-top:1px solid var(--ln2);display:flex;justify-content:space-between;align-items:center">
              <span class="mono dim" style="font-size:10px">bEnableSleep = true (0% GPU when closed)</span>
              <span class="mono" style="font-size:10px;color:var(--acc)">Input Mode: Game and UI</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          <button class="btn" id="exToggleBtn" style="padding:10px 18px;font-size:10.5px">Toggle Inventory (I)</button>
        </div>
        <div class="plate">
          <div class="plate-h"><span class="sq"></span>Subsystem Execution Trace</div>
          <div class="plate-b" style="padding:12px">
            <div class="ir-trace mono" id="exTrace" style="border:0;min-height:160px;font-size:11px;line-height:1.6"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recipe 01 Code Breakdown -->
    <div style="margin-top:32px">
      <div class="api-strip" style="margin-bottom:14px">
        <span class="mono dim" style="font-size:10px;letter-spacing:.1em">IMPLEMENTATION CODE:</span>
        <button class="tbtn r1-tab on" data-tab="bp">PlayerController.cpp (C++)</button>
        <button class="tbtn r1-tab" data-tab="js">inventory.tsx (Navigation Event)</button>
        <button class="tbtn r1-tab" data-tab="asset">USwuiDocumentAsset Config</button>
      </div>

      <div id="r1CodeBp">
        ${codeFig('recipe1Bp', 'PlayerController.cpp', 'cpp', 'd')}
      </div>
      <div id="r1CodeJs" style="display:none">
        ${codeFig('recipe1Js', 'inventory.tsx', 'ts', 'd')}
      </div>
      <div id="r1CodeAsset" style="display:none">
        <div class="plate"><div class="plate-h"><span class="sq"></span>DA_Inventory — USwuiDocumentAsset Data Asset Properties</div>
        <div class="plate-b mono" style="font-size:12px;line-height:1.9">
          <div><b style="color:var(--acc)">DocumentId:</b> FName("Inventory")</div>
          <div><b style="color:var(--acc)">EntryURL:</b> "UI/inventory.html" (or Vite dist)</div>
          <div><b style="color:var(--acc)">Layer:</b> ESwuiLayer::Modal</div>
          <div><b style="color:var(--acc)">ZOrder:</b> 100 (renders above MainHUD Z-10)</div>
          <div><b style="color:var(--acc)">LoadBehavior:</b> ESwuiLoadBehavior::Eager (pre-allocated) or Lazy</div>
          <div><b style="color:var(--acc)">bIsTransparent:</b> true (composited over Unreal Slate 3D scene)</div>
          <div><b style="color:var(--acc)">bEnableSleep:</b> true (Calls WasHidden() when deactivated, freeing 100% GPU raster work)</div>
        </div></div>
      </div>
    </div>
  </div></section>

  <!-- ================= RECIPE 02: PAUSE MENU (TICK WHEN PAUSED) ================= -->
  <section class="sec paper"><div class="wrap">
    <div class="shead"><span class="sidx" style="background:var(--ink);color:var(--paper)">02</span><span class="slbl">Pause Menu (Frozen World)</span><span class="srule"></span><span class="stag">TickableWhenPaused = true</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(22px,2.6vw,42px)">The world freezes.<br><span class="si">Your UI never does.</span></h2>
      <p class="lead">In single-player games, calling <span class="mono">SetGamePaused(true)</span> freezes game actors and physics. Because <span class="mono">USwuiDocumentManagerSubsystem</span> implements <span class="mono">FTickableGameObject</span> with <span class="mono">TickableWhenPaused = true</span>, the web runtime continues receiving frame ticks, animations, and gamepad events at full 60 FPS.</p>
    </div>

    <div class="rp-grid rv">
      <div class="plate">
        <div class="plate-h">
          <span class="sq"></span>
          <span id="pmTitle"><span style="color:var(--ok)">● WORLD RUNNING</span> · pause.html: Deactivated</span>
          <span class="sp"></span>
          <button class="tbtn pri" id="pmBtn">Pause World (Esc)</button>
        </div>
        <div class="plate-b">
          <div class="roi-wrap" style="aspect-ratio:16/9;min-height:280px;background:#0d0e12;position:relative;overflow:hidden" id="pmView">
            <div style="position:absolute;inset:54% -12% 0;background:linear-gradient(rgba(239,238,232,.06) 1px,transparent 1px) 0 0/100% 32px,linear-gradient(90deg,rgba(239,238,232,.06) 1px,transparent 1px) 0 0/56px 100%;transform:perspective(320px) rotateX(56deg);transform-origin:top"></div>
            <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)" id="pmXh">
              <div style="position:relative;width:0;height:0" id="pmXhIn"></div>
            </div>

            <!-- Pause Modal Shell -->
            <div id="pmMenu" style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(10,12,16,.88);backdrop-filter:blur(8px);z-index:20">
              <!-- Main Page -->
              <div id="pmMainPanel" style="width:min(340px,88%);border:1px solid rgba(255,255,255,.2);background:rgba(18,20,25,.96);padding:26px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.7)">
                <div class="mono" style="font-size:10px;letter-spacing:.3em;color:var(--blaze);margin-bottom:14px">PAUSE MENU</div>
                <div style="font:400 12.5px/1.6 var(--sans);color:#a0a2ab;margin-bottom:20px">Game world paused. SWUI tickable frame rate: 60.0 FPS.</div>
                <div style="display:flex;flex-direction:column;gap:10px">
                  <button class="btn" id="pmResume" style="width:100%;justify-content:center;padding:11px">Continue</button>
                  <button class="btn-g" id="pmOpenSettings" style="width:100%;justify-content:center;padding:10px">Settings</button>
                  <button class="btn-g" id="pmQuit" style="width:100%;justify-content:center;padding:10px">Quit Game</button>
                </div>
                <div class="mono dim" style="font-size:9.5px;margin-top:16px">emits UI.Menu.Resume / QuitGame</div>
              </div>

              <!-- Sub-page: Settings -->
              <div id="pmSettingsPanel" style="width:min(340px,88%);border:1px solid rgba(255,255,255,.2);background:rgba(18,20,25,.96);padding:26px;display:none;box-shadow:0 24px 60px rgba(0,0,0,.7)">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
                  <button class="tbtn" id="pmBackSettings" style="padding:4px 8px">← Back</button>
                  <span class="mono" style="font-size:11px;font-weight:600">SETTINGS</span>
                </div>
                <div class="frow" style="margin-bottom:12px"><label style="font-size:12px">Master Volume</label><input type="range" min="0" max="100" value="80"></div>
                <div class="frow" style="margin-bottom:12px"><label style="font-size:12px">Motion Blur</label><input type="checkbox" checked style="accent-color:var(--blaze)"></div>
                <div class="mono dim" style="font-size:9.5px;margin-top:14px">Page-aware Cancel: ESC returns to main menu instead of unpausing.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="plate"><div class="plate-h"><span class="sq"></span>Pause Flow Trace</div>
        <div class="plate-b" style="padding:12px"><div class="ir-trace mono" id="pmTrace" style="min-height:180px;font-size:11px;line-height:1.6"></div></div></div>

        <!-- Recipe 02 Code Breakdown -->
        <div style="margin-top:20px">
          <div class="api-strip" style="margin-bottom:10px">
            <button class="tbtn r2-tab on" data-tab="bp">Unreal C++ / Blueprint</button>
            <button class="tbtn r2-tab" data-tab="react">PauseMenuModal.tsx (React)</button>
          </div>
          <div id="r2CodeBp">
            ${codeFig('recipe2PauseBp', 'PauseHandler.cpp', 'cpp', 'l')}
          </div>
          <div id="r2CodeReact" style="display:none">
            ${codeFig('recipe2PauseReact', 'PauseMenuModal.tsx', 'tsx', 'l')}
          </div>
        </div>
      </div>
    </div>
  </div></section>

  <!-- ================= RECIPE 03: ZERO-STUTTER LEVEL PRELOADING ================= -->
  <section class="sec inksec"><div class="wrap">
    <div class="shead"><span class="sidx">03</span><span class="slbl">Zero-Stutter Level Preload</span><span class="srule"></span><span class="stag">PreloadDocument()</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(22px,2.6vw,42px)">Seamless level travel.<br><span class="si">Zero frame drops.</span></h2>
      <p class="lead">Loading a complex web bundle during gameplay causes JavaScript parsing and shader compilation spikes. With SWUI 3.0, you initiate <span class="mono">PreloadDocument()</span> in background while loading screen or level streaming runs, achieving instant viewport presentation with zero hitch.</p>
    </div>

    <div class="rp-grid rv">
      <div class="plate">
        <div class="plate-h"><span class="sq"></span>Level Travel &amp; Preload Simulator<span class="sp"></span>
          <button class="btn" id="plStartBtn" style="padding:8px 16px;font-size:10px">Trigger Level Travel</button>
        </div>
        <div class="plate-b">
          <div class="mono" id="plStage" style="font-size:12px;margin-bottom:14px;color:var(--acc)">Idle · Current Level: Level 01 (Active)</div>
          <div style="height:12px;background:var(--ln2);position:relative;overflow:hidden">
            <i id="plProgressBar" style="display:block;height:100%;width:0;background:var(--blaze);transition:width .1s linear"></i>
          </div>
          <div class="ir-trace mono" id="plLog" style="margin-top:16px;min-height:120px;font-size:11px;line-height:1.6">
            Click "Trigger Level Travel" to simulate background preloading during level travel.
          </div>
        </div>
      </div>

      <div>
        <div class="plate"><div class="plate-h"><span class="sq"></span>Frame-Time Comparison</div>
        <div class="plate-b mono" style="font-size:12px;line-height:1.8">
          <div style="margin-bottom:12px">
            <b style="color:var(--warn)">Without Preload (Old Pattern):</b>
            <div class="dim" style="font-size:11px">Level loads → ActivateDocument() → CEF spawns browser → DOM parse → JIT compile → <b>~180ms hitch</b></div>
          </div>
          <div>
            <b style="color:var(--ok)">With SWUI 3.0 PreloadDocument():</b>
            <div class="dim" style="font-size:11px">Travel begins → PreloadDocument() runs in background → Level ready → ActivateDocument() → <b>0ms hitch, instant 60 FPS</b></div>
          </div>
        </div></div>
        <div style="margin-top:16px">
          ${codeFig('recipe3Preload', 'LevelTravel.cpp', 'cpp', 'd')}
        </div>
      </div>
    </div>
  </div></section>

  <!-- ================= RECIPE 04: 3D IN-WORLD MESH SCREEN ================= -->
  <section class="sec paper"><div class="wrap">
    <div class="shead"><span class="sidx" style="background:var(--ink);color:var(--paper)">04</span><span class="slbl">Diegetic In-World UI</span><span class="srule"></span><span class="stag">USwui Actor Component</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(22px,2.6vw,42px)">Beyond flat HUDs.<br><span class="si">Screens inside your world.</span></h2>
      <p class="lead">Add a <span class="mono">USwui</span> actor component to any terminal, spaceship cockpit, or sci-fi door. The component drives the document asset, renders to an offscreen shared texture, and applies it directly to a Dynamic Material Instance.</p>
    </div>

    <div class="rp-grid rv">
      <div class="plate">
        <div class="plate-h"><span class="sq"></span>Live In-World Terminal Simulation</div>
        <div class="plate-b">
          <div class="roi-wrap" style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;perspective:900px;background:#06070a">
            <div style="transform:rotateX(7deg) rotateY(-12deg);width:min(440px,88%);border:1px solid var(--acc);background:#07080b;box-shadow:0 30px 80px rgba(0,0,0,.9);overflow:hidden">
              <div class="plate-h" style="border-bottom:1px solid rgba(255,107,51,.3);padding:8px 12px;background:rgba(0,0,0,.5)">
                <span class="sq"></span><span class="mono" style="font-size:9.5px">terminal.swui · Actor: BP_SciFiTerminal_03</span>
              </div>
              <pre id="twTerm" class="mono" style="padding:14px;font-size:11px;line-height:1.7;color:#9FD0A8;margin:0;height:180px;overflow-y:auto;background:transparent"></pre>
              <div style="padding:8px 12px;border-top:1px solid rgba(255,255,255,.1);display:flex;gap:6px;align-items:center">
                <span class="mono" style="color:var(--blaze);font-size:12px">&gt;</span>
                <input type="text" id="termCmdInput" placeholder="type status, power, matrix, ping..." style="flex:1;background:transparent;border:0;color:#9FD0A8;font-family:var(--mono);font-size:11px" aria-label="Terminal command">
              </div>
            </div>
          </div>
          <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap">
            <button class="tbtn term-quick-btn" data-cmd="status">status</button>
            <button class="tbtn term-quick-btn" data-cmd="power">power</button>
            <button class="tbtn term-quick-btn" data-cmd="matrix">matrix</button>
            <button class="tbtn term-quick-btn" data-cmd="ping">ping</button>
          </div>
        </div>
      </div>

      <div>
        <div class="arch-stack">
          <div class="al"><b>StaticMeshActor / Pawn</b><div class="sub"><span class="chip">3D World Placement</span></div></div>
          <div class="al"><b>USwui Component</b><div class="sub"><span class="chip on">Document Coordinator</span></div></div>
          <div class="al"><b>USwuiDocumentAsset</b><div class="sub"><span class="chip">terminal.html</span></div></div>
          <div class="al"><b>CEF Render Engine</b><div class="sub"><span class="chip">Direct D3D11 Shared Texture</span></div></div>
          <div class="al"><b>Dynamic Material Instance</b><div class="sub"><span class="chip">UV Parameter: 'UI_Texture'</span></div></div>
        </div>
        <div style="margin-top:16px">
          ${codeFig('recipe4World', 'ActorSetup.cpp', 'cpp', 'l')}
        </div>
      </div>
    </div>
  </div></section>

  <!-- ================= RECIPE 05: GAMEPAD & SPATIAL NAVIGATION ================= -->
  <section class="sec inksec"><div class="wrap">
    <div class="shead"><span class="sidx">05</span><span class="slbl">Gamepad &amp; Focus Navigation</span><span class="srule"></span><span class="stag">SwuiNavigation Subsystem</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(22px,2.6vw,42px)">Console-ready input.<br><span class="si">Zero mouse emulation hacks.</span></h2>
      <p class="lead">Built-in spatial navigation forwards D-Pad, Thumbsticks, Face Buttons, and Bumpers directly to web documents via <span class="mono">SwuiNavigation</span>. Seamlessly binds with Unreal's Enhanced Input System.</p>
    </div>

    <div class="rp-grid rv">
      <div class="plate">
        <div class="plate-h"><span class="sq"></span>Virtual Gamepad Controller Lab</div>
        <div class="plate-b">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
            <button class="tbtn nav-btn-item focused" data-label="Inventory Slot 1">Slot 1: Medkit</button>
            <button class="tbtn nav-btn-item" data-label="Inventory Slot 2">Slot 2: Ammo</button>
            <button class="tbtn nav-btn-item" data-label="Inventory Slot 3">Slot 3: Keycard</button>
            <button class="tbtn nav-btn-item" data-label="Inventory Slot 4">Slot 4: Shield</button>
            <button class="tbtn nav-btn-item" data-label="Inventory Slot 5">Slot 5: Mine</button>
            <button class="tbtn nav-btn-item" data-label="Inventory Slot 6">Slot 6: Core</button>
          </div>

          <!-- D-Pad Controls -->
          <div style="display:flex;justify-content:center;gap:20px;align-items:center;flex-wrap:wrap;margin-top:20px">
            <div style="display:grid;grid-template-columns:repeat(3,38px);grid-template-rows:repeat(3,38px);gap:4px">
              <div></div>
              <button class="tbtn" id="navUp" style="padding:0;justify-content:center">▲</button>
              <div></div>
              <button class="tbtn" id="navLeft" style="padding:0;justify-content:center">◀</button>
              <div style="background:var(--ln2);display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--mut)">D-PAD</div>
              <button class="tbtn" id="navRight" style="padding:0;justify-content:center">▶</button>
              <div></div>
              <button class="tbtn" id="navDown" style="padding:0;justify-content:center">▼</button>
              <div></div>
            </div>

            <div style="display:flex;flex-direction:column;gap:8px">
              <button class="btn" id="navConfirm" style="padding:10px 18px;font-size:10px;background:var(--ok);color:#000">Confirm (A / Enter)</button>
              <button class="btn-g" id="navCancel" style="padding:10px 18px;font-size:10px">Cancel (B / Esc)</button>
            </div>
          </div>

          <div class="mono" id="navFeedback" style="margin-top:16px;padding:8px 12px;background:rgba(0,0,0,.4);border:1px solid var(--ln2);font-size:11px">
            Focused: [Slot 1: Medkit] · Key: 1
          </div>
        </div>
      </div>

      <div>
        <div class="plate"><div class="plate-h"><span class="sq"></span>SwuiNavigation Input Binding</div>
        <div class="plate-b" style="padding:0">
          ${codeFig('recipe5Nav', 'SetupInput.cpp', 'cpp', 'd')}
        </div></div>
      </div>
    </div>
  </div></section>

  <!-- ================= RECIPE 06: PRODUCTION USE-CASE MATRIX ================= -->
  <section class="sec paper"><div class="wrap">
    <div class="shead"><span class="sidx" style="background:var(--ink);color:var(--paper)">06</span><span class="slbl">Production Use-Case Matrix</span><span class="srule"></span><span class="stag">Twelve Common Patterns</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(22px,2.6vw,42px)">Every surface.<br><span class="si">Engineered with precision.</span></h2>
      <p class="lead">From persistent heads-up displays to diegetic in-world terminals, see how SWUI 3.0 systems map to typical production requirements.</p>
    </div>
    <div class="dtable rv" id="ucList" style="overflow-x:auto;min-width:100%"></div>
  </div></section>
</div>
`
      }}
    />
  )
}
