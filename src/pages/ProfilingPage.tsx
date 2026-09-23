// @ts-nocheck
import React, { useEffect, useRef } from 'react'
import { $, $$, clamp, damp, el, loop, codeFig, makeCrosshair, hl, toast, copyText, observeReveal } from '../utils/engine'

interface PageProps {
  hidden?: boolean
}

export const ProfilingPage: React.FC<PageProps> = ({ hidden }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const initedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || initedRef.current || hidden) return
    initedRef.current = true

    function initProf() {
      // Telemetry state
      const S = {
        browserFps: 60,
        presentedFps: 60,
        latencyMs: 3.8,
        stateFlushes: 1,
        cefBudgetUsed: 0.45,
        cefBudgetMax: 1.5,
        dirtyTileCount: 2,
        uploadBytesKb: 124,
        history: [],
        injectTimer: 0,
        fpsCap: 60,
      }

      const cells = [
        ['BrowserFPS', () => S.browserFps.toFixed(0)],
        ['PresentedFPS', () => S.presentedFps.toFixed(0)],
        ['PaintToPresent', () => S.latencyMs.toFixed(1) + ' ms'],
        ['CEFBudget', () => `${S.cefBudgetUsed.toFixed(2)} / ${S.cefBudgetMax.toFixed(1)} ms`],
        ['DirtyUpload', () => `${S.uploadBytesKb.toFixed(0)} KB (${S.dirtyTileCount} tiles)`],
        ['StateFlushes', () => S.stateFlushes.toFixed(0) + ' / frame'],
      ]

      const grid = $('#pfGrid')
      if (grid) {
        grid.innerHTML = cells.map(c => `
          <div><b>${c[0]}</b><span id="pf-${c[0]}">${c[1]()}</span></div>
        `).join('')
      }

      const cv = $('#pfCv')
      const cx = cv?.getContext('2d')
      const resizeCv = () => {
        if (!cv) return
        cv.width = cv.clientWidth || 800
        cv.height = 160
      }
      resizeCv()
      window.addEventListener('resize', resizeCv)

      loop(cv, dt => {
        const targetFps = S.fpsCap
        S.browserFps = damp(S.browserFps, targetFps, 2, dt)

        // Occasional frame drop simulation during heavy inject
        const frameMiss = Math.random() < (S.injectTimer > 0 ? 0.25 : 0.01)
        S.presentedFps = damp(S.presentedFps, frameMiss ? S.browserFps * 0.55 : S.browserFps, 4, dt)

        S.latencyMs = damp(S.latencyMs, S.injectTimer > 0 ? 6.8 + Math.random() * 3.5 : 3.4 + Math.random() * 1.2, 3, dt)
        S.cefBudgetUsed = damp(S.cefBudgetUsed, S.injectTimer > 0 ? 1.25 + Math.random() * 0.2 : 0.42 + Math.random() * 0.15, 3, dt)
        S.dirtyTileCount = S.injectTimer > 0 ? Math.floor(6 + Math.random() * 4) : 2
        S.uploadBytesKb = S.dirtyTileCount * 64

        if (S.injectTimer > 0) S.injectTimer -= dt

        S.history.push({ b: S.browserFps, p: S.presentedFps, lat: S.latencyMs })
        if (S.history.length > 200) S.history.shift()

        cells.forEach(c => {
          const node = $('#pf-' + c[0])
          if (node) node.textContent = c[1]()
        })

        if (cx && cv) {
          cx.clearRect(0, 0, cv.width, cv.height)

          // 60 FPS reference line
          const y60 = cv.height - 4 - clamp(60 / 140, 0, 1) * (cv.height - 16)
          cx.strokeStyle = 'rgba(239,238,232,.12)'
          cx.beginPath()
          cx.moveTo(0, y60)
          cx.lineTo(cv.width, y60)
          cx.stroke()

          // Browser FPS curve (solid bone)
          cx.strokeStyle = 'rgba(239,238,232,.85)'
          cx.lineWidth = 1.5
          cx.beginPath()
          S.history.forEach((h, i) => {
            const x = (i / 200) * cv.width
            const y = cv.height - 4 - clamp(h.b / 140, 0, 1) * (cv.height - 16)
            if (i === 0) cx.moveTo(x, y)
            else cx.lineTo(x, y)
          })
          cx.stroke()

          // Presented FPS curve (dashed blaze)
          cx.strokeStyle = '#FF4D00'
          cx.lineWidth = 1.8
          cx.setLineDash([4, 4])
          cx.beginPath()
          S.history.forEach((h, i) => {
            const x = (i / 200) * cv.width
            const y = cv.height - 4 - clamp(h.p / 140, 0, 1) * (cv.height - 16)
            if (i === 0) cx.moveTo(x, y)
            else cx.lineTo(x, y)
          })
          cx.stroke()
          cx.setLineDash([])

          // Legend
          cx.fillStyle = 'rgba(239,238,232,.7)'
          cx.font = '500 10px IBM Plex Mono'
          cx.fillText('— Browser FPS', 12, 18)
          cx.fillStyle = 'rgba(255,77,0,.9)'
          cx.fillText('--- Presented FPS', 120, 18)
        }
      })

      // Injection triggers
      $('#pfDirty')?.addEventListener('click', () => {
        S.injectTimer = 2.5
        S.stateFlushes = 8
        toast('Injected: 8 dirty state fields. Batched into 1 engine frame.')
      })

      $('#pfPreload')?.addEventListener('click', () => {
        S.injectTimer = 1.5
        toast('PreloadDocument() cache hit: Document activated with 0ms hitch!')
      })

      $('#pfCap30')?.addEventListener('click', () => { S.fpsCap = 30; toast('CVarSwuiHudMaxBrowserFPS 30') })
      $('#pfCap60')?.addEventListener('click', () => { S.fpsCap = 60; toast('CVarSwuiHudMaxBrowserFPS 60') })
      $('#pfCap120')?.addEventListener('click', () => { S.fpsCap = 120; toast('CVarSwuiHudMaxBrowserFPS 120') })

      // CVars Console Workbench
      const CMDS = [
        {
          cmd: 'swui.debug.Stats 1',
          desc: 'Prints real-time telemetry to Output Log and toggles on-screen Slate HUD overlay.',
          out: '[SWUI] BrowserFPS: 60 | PresentedFPS: 60 | PaintLatency: 3.8ms | CEF Budget: 0.45/1.5ms\n[SWUI] Documents: 2 active / 1 sleeping / 1 unloaded',
        },
        {
          cmd: 'swui.cefMessageLoopBudgetMs 1.5',
          desc: 'Sets the maximum GameThread budget in milliseconds allocated for pumping CEF messages per tick.',
          out: '[SWUI] CEF message loop budget clamped to 1.50 ms (Last frame used: 0.42 ms)',
        },
        {
          cmd: 'swui.hud.Lockstep 1',
          desc: 'Forces Chromium frame production into lockstep with Unreal Engine frame ticks.',
          out: '[SWUI] HUD lockstep enabled: OnPaint begin-frame driven by FEngineLoop::Tick',
        },
        {
          cmd: 'swui.paint.HybridDirtyUpload 1',
          desc: 'Enables partial dirty-rect tile uploads to avoid transferring full 1080p/4K frames over PCIe.',
          out: '[SWUI] Hybrid dirty upload enabled: 2 tiles updated (128 KB) vs full frame (8.29 MB)',
        },
        {
          cmd: 'swui.hud.MaxBrowserFPS 60',
          desc: 'Caps maximum browser rendering rate to avoid wasted GPU rasterization.',
          out: '[SWUI] MaxBrowserFPS set to 60 (Previous: 120)',
        },
        {
          cmd: 'swui.verbosePaint 1',
          desc: 'Logs every dirty rect dimension, texture upload byte count, and presentation time.',
          out: '[SWUI] MainHUD Paint: dirty={x:1420, y:860, w:320, h:140} (44.8 KB) -> Present: 3.4ms\n[SWUI] Reticle Paint: dirty={x:940, y:520, w:40, h:40} (1.6 KB) -> Present: 0.8ms',
        },
        {
          cmd: 'swui.debug.ShowDirtyRects 1',
          desc: 'Draws visual green debug wireframe bounding boxes over invalidated Slate regions.',
          out: '[SWUI] ShowDirtyRects overlay activated on viewport',
        },
      ]

      const cmdList = $('#cmdList')
      if (cmdList) {
        cmdList.innerHTML = CMDS.map((c, i) => `
          <div class="cmd" style="margin-bottom:14px">
            <div class="cmd-h" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px">
              <code class="mono" style="font-size:12.5px;color:var(--acc);font-weight:600">${c.cmd}</code>
              <button class="cf-copy" data-cmd="${i}" aria-label="Copy command">
                <svg><use href="#i-copy"/></svg>copy
              </button>
            </div>
            <div class="cmd-b" style="padding:10px 14px;font-size:12.5px;color:var(--mut)">${c.desc}</div>
            <div class="cmd-out mono" style="padding:10px 14px;font-size:11px;line-height:1.6;background:var(--card2);white-space:pre-wrap;border-top:1px solid var(--ln2)">${c.out}</div>
          </div>
        `).join('')

        $$('#cmdList [data-cmd]').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.cmd || '0', 10)
            copyText(CMDS[idx].cmd)
            toast(`Copied: ${CMDS[idx].cmd}`)
          })
        })
      }
    }

    try {
      initProf()
    } catch (e) {
      console.error('Error in initProf:', e)
    }

    observeReveal(containerRef.current)
  }, [hidden])

  return (
    <div
      ref={containerRef}
      className="page inksec"
      data-page="profiling"
      hidden={hidden}
      dangerouslySetInnerHTML={{
        __html: `
  <header class="pgh"><div class="wrap">
    <div class="eyebrow" style="color:var(--acc)">SWUI 3.0 Diagnostics &amp; Profiling</div>
    <h1>Telemetry &amp; CVars.<br><em>Performance you can measure.</em></h1>
    <p class="lead">An engine-style view of the runtime: browser frame production, presented frame rates, paint-to-present latency, and the CEF message-loop game-thread budget. Inject load scenarios and explore the complete console variable workbench.</p>
  </div></header>

  <!-- ================= 01: LIVE TELEMETRY SCOPE ================= -->
  <section class="sec" style="border-top:0"><div class="wrap">
    <div class="plate rv" style="max-width:1080px">
      <div class="plate-h">
        <span class="sq"></span>swui.debug.stats — Live Telemetry Scope
        <span class="sp"></span>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="tbtn" id="pfDirty">Dirty 8 Fields</button>
          <button class="tbtn" id="pfPreload">Simulate Preload Hit</button>
        </div>
      </div>
      <div class="plate-b">
        <div class="scope"><canvas id="pfCv" height="160" style="width:100%;display:block"></canvas></div>
        <div class="tele" style="margin-top:16px" id="pfGrid"></div>

        <div class="api-strip" style="margin-top:16px">
          <span class="mono dim" style="font-size:10px;letter-spacing:.1em">FRAME PACING CAP:</span>
          <button class="tbtn" id="pfCap30">30 FPS</button>
          <button class="tbtn on" id="pfCap60">60 FPS (Default)</button>
          <button class="tbtn" id="pfCap120">120 FPS</button>
        </div>
      </div>
    </div>
  </div></section>

  <!-- ================= 02: BANDWIDTH & DIRTY RECT EFFICIENCY ================= -->
  <section class="sec paper"><div class="wrap">
    <div class="shead"><span class="sidx" style="background:var(--ink);color:var(--paper)">02</span><span class="slbl">PCIe Bandwidth &amp; Dirty Rects</span><span class="srule"></span><span class="stag">98.5% Savings</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(22px,2.6vw,42px)">Why full-frame uploads<br><span class="si">kill frame pacing.</span></h2>
      <p class="lead">A 1080p full-frame texture blit consumes 8.3 MB per frame (nearly 500 MB/s at 60 FPS). With SWUI 3.0's <span class="mono">HybridDirtyUpload</span>, only modified pixel tiles are transferred across PCIe.</p>
    </div>

    <div class="grid2 rv">
      <div class="plate">
        <div class="plate-h"><span class="sq"></span>Full-Frame Upload (Traditional)</div>
        <div class="plate-b mono" style="font-size:12px;line-height:1.8">
          <div><b style="color:var(--warn)">Resolution:</b> 1920 × 1080 (RGBA8)</div>
          <div><b style="color:var(--warn)">Upload Size:</b> 8,294,400 bytes (~8.3 MB)</div>
          <div><b style="color:var(--warn)">Bandwidth @ 60 FPS:</b> 497.6 MB/s</div>
          <div><b style="color:var(--warn)">GameThread Stall:</b> 2.4 – 4.5 ms per blit</div>
          <div style="margin-top:12px;padding:8px;background:rgba(217,169,74,.15);border:1px solid var(--warn);color:var(--fg)">
            Causes micro-stutters during heavy gameplay when memory bus is contended.
          </div>
        </div>
      </div>

      <div class="plate">
        <div class="plate-h"><span class="sq"></span>SWUI 3.0 Hybrid Dirty Upload</div>
        <div class="plate-b mono" style="font-size:12px;line-height:1.8">
          <div><b style="color:var(--ok)">Invalidated Region:</b> Crosshair + Ammo HUD</div>
          <div><b style="color:var(--ok)">Upload Size:</b> 124,000 bytes (~124 KB)</div>
          <div><b style="color:var(--ok)">Bandwidth @ 60 FPS:</b> 7.4 MB/s (98.5% reduction!)</div>
          <div><b style="color:var(--ok)">GameThread Stall:</b> &lt; 0.3 ms</div>
          <div style="margin-top:12px;padding:8px;background:rgba(95,169,122,.15);border:1px solid var(--ok);color:var(--fg)">
            Rock-solid 60 FPS frame pacing with zero PCIe bus contention.
          </div>
        </div>
      </div>
    </div>
  </div></section>

  <!-- ================= 03: CONSOLE VARIABLES WORKBENCH ================= -->
  <section class="sec inksec"><div class="wrap">
    <div class="shead"><span class="sidx">03</span><span class="slbl">CVars Workbench</span><span class="srule"></span><span class="stag">Console Commands</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(22px,2.6vw,42px)">Live inspection &amp; tuning.<br><span class="si">Copy directly to Output Log.</span></h2>
      <p class="lead">Built-in console commands from <span class="mono">SwuiCVars.cpp</span> for live debugging, dirty rect visualization, and lockstep tuning.</p>
    </div>
    <div id="cmdList" class="rv" style="max-width:920px"></div>
  </div></section>

  <!-- ================= 04: CSS PERFORMANCE IN EMBEDDED CHROMIUM ================= -->
  <section class="sec paper"><div class="wrap">
    <div class="shead"><span class="sidx" style="background:var(--ink);color:var(--paper)">04</span><span class="slbl">Chromium CSS Best Practices</span><span class="srule"></span><span class="stag">Docs/css-performance.md</span></div>
    <div class="sec-top">
      <h2 class="display" style="font-size:clamp(22px,2.6vw,42px)">High-FPS web authoring.<br><span class="si">Avoid layout thrashing.</span></h2>
      <p class="lead">Guidelines for writing CSS that hits locked 60 FPS inside Chromium's offscreen rendering pipeline.</p>
    </div>

    <div class="grid3 rv" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px">
      <div class="plate">
        <div class="plate-h"><span class="sq"></span>1. Animate Transforms &amp; Opacity</div>
        <div class="plate-b" style="font-size:12.5px;line-height:1.7">
          <p>Always animate with <span class="mono">transform</span> and <span class="mono">opacity</span>. Never animate <span class="mono">top</span>, <span class="mono">left</span>, <span class="mono">width</span>, or <span class="mono">height</span>, which trigger expensive CPU reflow and repaint cycles.</p>
        </div>
      </div>

      <div class="plate">
        <div class="plate-h"><span class="sq"></span>2. Avoid Heavy Blurs &amp; Shadows</div>
        <div class="plate-b" style="font-size:12.5px;line-height:1.7">
          <p>Avoid <span class="mono">backdrop-filter: blur()</span> on elements that repaint every frame (like crosshairs or moving healthbars). Reserve blurs for static modal dialogs.</p>
        </div>
      </div>

      <div class="plate">
        <div class="plate-h"><span class="sq"></span>3. Enable Chromium Sleep Mode</div>
        <div class="plate-b" style="font-size:12.5px;line-height:1.7">
          <p>Set <span class="mono">bEnableSleep = true</span> on your <span class="mono">USwuiDocumentAsset</span>. When inactive, SWUI calls <span class="mono">WasHidden()</span>, immediately halting all JavaScript timers and rendering.</p>
        </div>
      </div>
    </div>
  </div></section>
</div>
`
      }}
    />
  )
}
