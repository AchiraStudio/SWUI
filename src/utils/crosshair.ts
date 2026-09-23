export interface CrosshairHandle {
  root: HTMLDivElement
  set: (spread: number, mode: 'PRECISE' | 'EXPANDED' | 'SNIPER' | string) => void
  hit: () => void
}

export function makeCrosshair(mount: HTMLElement): CrosshairHandle {
  const root = document.createElement('div')
  root.className = 'xh'
  root.innerHTML =
    '<i class="xl t"></i><i class="xl b"></i><i class="xl l"></i><i class="xl r"></i><i class="xd"></i><div class="xring"></div><svg class="xhit" viewBox="0 0 28 28"><path d="M5 5l5 5M23 5l-5 5M5 23l5-5M23 23l-5-5"/></svg>'
  mount.appendChild(root)
  const hitEl = root.querySelector('.xhit') as SVGElement

  return {
    root,
    set(spread: number, mode: string) {
      const g = Math.max(4, Math.min(58, 4 + spread * 72))
      root.style.setProperty('--gap', (mode === 'SNIPER' ? g * 0.5 : g) + 'px')
      root.classList.toggle('sniper', mode === 'SNIPER')
    },
    hit() {
      if (!hitEl) return
      hitEl.classList.remove('show')
      void hitEl.getBoundingClientRect()
      hitEl.classList.add('show')
    }
  }
}
