export interface RefEntry {
  category: string
  name: string
  purpose: string
  signature: string
}

export const REFERENCE_DATA: RefEntry[] = [
  { category: 'CORE', name: 'swui.state.get', purpose: 'Read a state field.', signature: "swui.state.get('Weapon.CurrentAmmo')" },
  { category: 'CORE', name: 'swui.state.getAll', purpose: 'Read the full published state.', signature: 'const s = swui.state.getAll()' },
  { category: 'CORE', name: 'swui.state.subscribe', purpose: 'Subscribe to one field.', signature: "swui.state.subscribe('Player.Health', render)" },
  { category: 'CORE', name: 'swui.state.update', purpose: 'Propagate a state patch.', signature: "swui.state.update({ 'UI.MenuVolume': 0.4 })" },
  { category: 'CORE', name: 'swui.state.onBatch', purpose: 'Once-per-frame atomic batch handler.', signature: 'swui.state.onBatch(b => frame(b.version))' },
  { category: 'CORE', name: 'swui.state.onTick', purpose: 'Runtime tick on engine time.', signature: 'swui.state.onTick(({ dt }) => step(dt))' },
  { category: 'CORE', name: 'swui.events.on', purpose: 'Subscribe to a reflected Unreal event.', signature: "swui.events.on('Weapon.OnPlayerFiredShot', onFire)" },
  { category: 'CORE', name: 'swui.events.emit', purpose: 'Emit a tag-routed event toward Unreal.', signature: "swui.events.emit('UI.Inventory.UseItem', { slot: 2 })" },
  { category: 'CORE', name: 'swui.events.emitNavigation', purpose: 'Emit a navigation action.', signature: "swui.events.emitNavigation('nextTab')" },
  { category: 'CORE', name: 'swui.navigation.onNavigate', purpose: 'Directional focus movement.', signature: 'swui.navigation.onNavigate(d => focus.move(d))' },
  { category: 'CORE', name: 'swui.navigation.onConfirm', purpose: 'Confirm on the focused element.', signature: 'swui.navigation.onConfirm(fire)' },
  { category: 'CORE', name: 'swui.navigation.onCancel', purpose: 'Cancel / back.', signature: 'swui.navigation.onCancel(close)' },
  { category: 'CORE', name: 'swui.navigation.onNextTab', purpose: 'Advance one tab group.', signature: 'swui.navigation.onNextTab(next)' },
  { category: 'CORE', name: 'swui.navigation.onPreviousTab', purpose: 'Reverse one tab group.', signature: 'swui.navigation.onPreviousTab(prev)' },
  { category: 'CORE', name: 'swui.input.focus', purpose: 'Acquire the keyboard/text context.', signature: 'swui.input.focus()' },
  { category: 'CORE', name: 'swui.input.release', purpose: 'Return input to gameplay.', signature: 'swui.input.release()' },
  { category: 'CORE', name: 'swui.lifecycle.onActivate', purpose: 'Document mounted.', signature: 'swui.lifecycle.onActivate(enter)' },
  { category: 'CORE', name: 'swui.lifecycle.onSleep', purpose: 'WasHidden suspend.', signature: 'swui.lifecycle.onSleep(pauseAll)' },
  { category: 'CORE', name: 'swui.timeline.begin', purpose: 'Start a game-time timeline.', signature: 't = swui.timeline.begin({ duration: 3 })' },
  { category: 'CORE', name: 'swui.timeline.cancel', purpose: 'Cancel — records cancelProgress.', signature: 't.cancel()' },
  { category: 'CORE', name: 'swui.animation.createSpring', purpose: 'Spring with stiffness · damping · mass.', signature: 'const s = swui.animation.createSpring({ stiffness: 170, damping: 26 })' },
  { category: 'CORE', name: 'swui.animation.damp', purpose: 'Frame-rate independent approach.', signature: 'v = swui.animation.damp(v, target, 8, dt)' },
  { category: 'CORE', name: 'swui.animation.lerp', purpose: 'Linear interpolation.', signature: 'x = swui.animation.lerp(a, b, t)' },
  { category: 'CORE', name: 'swui.animation.interpolate', purpose: 'Map a value across a range.', signature: 'p = swui.animation.interpolate(v, [0, 1], [0, 100])' },
  { category: 'CORE', name: 'swui.on', purpose: 'Compatibility shortcut — field listener.', signature: "swui.on('Player.Health', render)" },
  { category: 'CORE', name: 'swui.get', purpose: 'Compatibility shortcut — read.', signature: "swui.get('Ammo')" },
  { category: 'CORE', name: 'swui.onBatch', purpose: 'Compatibility shortcut — batch.', signature: 'swui.onBatch(fn)' },
  { category: 'CORE', name: 'swui.onTick', purpose: 'Compatibility shortcut — tick.', signature: 'swui.onTick(fn)' },
  { category: 'REACT', name: 'useSwuiState', purpose: 'Subscribe state into component state.', signature: "const hp = useSwuiState<number>('Player.Health', 100)" },
  { category: 'REACT', name: 'useSwuiEvent', purpose: 'Subscribe an event.', signature: "const reload = useSwuiEvent('Weapon.Reload')" },
  { category: 'REACT', name: 'useSwuiNavigation', purpose: 'Bind navigation handlers.', signature: 'useSwuiNavigation({ onConfirm: fire })' },
  { category: 'REACT', name: 'useSwuiTimeline', purpose: 'React to a game-time timeline.', signature: 'const t = useSwuiTimeline(3)' },
  { category: 'VUE', name: 'useSwuiState', purpose: 'Composition API state binding.', signature: "const health = useSwuiState('Player.Health', 100)" },
  { category: 'VUE', name: 'useSwuiEvent', purpose: 'Composition API event binding.', signature: "const reload = useSwuiEvent('Weapon.Reload')" },
  { category: 'SVELTE', name: 'swuiState', purpose: 'Runtime-backed Svelte store.', signature: "const spread = swuiState('Weapon.CurrentSpread', 0.3)" },
  { category: 'SVELTE', name: 'swuiEvent', purpose: 'Runtime-backed event store.', signature: "const fired = swuiEvent('Weapon.OnPlayerFiredShot')" },
  { category: 'CLI', name: 'swui build', purpose: 'Build the web application.', signature: '$ swui build' },
  { category: 'CLI', name: 'swui build --production', purpose: 'Production assets into Unreal Content.', signature: '$ swui build --production' },
  { category: 'CLI', name: 'swui dev', purpose: 'Development workflow with live reload.', signature: '$ swui dev' }
]
