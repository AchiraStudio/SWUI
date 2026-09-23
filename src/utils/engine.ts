import { SNIP } from '../data/snippets'
import { hl } from './highlighter'
import { toast, copyText } from './toast'

export { SNIP, hl, toast, copyText }

export const $ = (s: string, r: Element | Document = document): any => r.querySelector(s)
export const $$ = (s: string, r: Element | Document = document): any[] => [...r.querySelectorAll(s)]
export const RM = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
export const damp = (c: number, t: number, l: number, dt: number) => t + (c - t) * (1 - Math.exp(-l * dt))

export const el = (t: string, c?: string | null, h?: string | null): any => {
  const e = document.createElement(t)
  if (c) e.className = c
  if (h != null) e.innerHTML = h
  return e
}

export function loop(container: Element, fn: (dt: number, t: number) => void): { stop: () => void } {
  let run = false
  let id = 0
  let last = 0

  const tick = (t: number) => {
    if (!run) return
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016)
    last = t
    fn(dt, t)
    id = requestAnimationFrame(tick)
  }

  const io = new IntersectionObserver(
    es =>
      es.forEach(e => {
        if (e.isIntersecting && !run) {
          run = true
          last = performance.now()
          id = requestAnimationFrame(tick)
        } else if (!e.isIntersecting) {
          run = false
          cancelAnimationFrame(id)
        }
      }),
    { threshold: 0.05 }
  )

  io.observe(container)
  return {
    stop() {
      run = false
      cancelAnimationFrame(id)
      io.disconnect()
    }
  }
}

export function codeFig(key: string, file: string, lang: string, theme = 'd', ln = true): string {
  const raw = SNIP[key] || ''
  const highlighted = hl(raw, lang.toLowerCase())
  const lines = highlighted
    .split('\n')
    .map((l, i) => `<span class="cl" data-n="${ln ? String(i + 1).padStart(2, ' ') + ' ' : ''}">${l || ' '}</span>`)
    .join('')

  return `<figure class="code code-${theme}${ln ? '' : ' noln'}"><figcaption><span class="cf-file">${file}</span><span class="cf-lang">${lang}</span><button class="cf-copy" data-copy="${key}" aria-label="Copy code"><svg><use href="#i-copy"/></svg>copy</button></figcaption><pre>${lines}</pre></figure>`
}

export function makeCrosshair(mount: HTMLElement): {
  root: HTMLElement
  set: (spread: number, mode: string) => void
  hit: () => void
} {
  const root = el('div', 'xh')
  root.innerHTML =
    '<i class="xl t"></i><i class="xl b"></i><i class="xl l"></i><i class="xl r"></i><i class="xd"></i><div class="xring"></div><svg class="xhit" viewBox="0 0 28 28"><path d="M5 5l5 5M23 5l-5 5M5 23l5-5M23 23l-5-5"/></svg>'
  mount.appendChild(root)
  const hit = root.querySelector('.xhit') as HTMLElement

  return {
    root,
    set(spread: number, mode: string) {
      const g = clamp(4 + spread * 72, 4, 58)
      root.style.setProperty('--gap', (mode === 'SNIPER' ? g * 0.5 : g) + 'px')
      root.classList.toggle('sniper', mode === 'SNIPER')
    },
    hit() {
      if (!hit) return
      hit.classList.remove('show')
      void hit.offsetWidth
      hit.classList.add('show')
    }
  }
}

export function observeReveal(root: HTMLElement = document.body) {
  const io = new IntersectionObserver(
    es =>
      es.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in')
          io.unobserve(e.target)
        }
      }),
    { threshold: 0.08 }
  )
  root.querySelectorAll('.rv').forEach(n => (RM ? n.classList.add('in') : io.observe(n)))
}
