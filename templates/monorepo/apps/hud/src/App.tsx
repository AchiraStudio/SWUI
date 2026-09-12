import React from 'react';
import { useSwuiState, useSwuiEvent } from '@swui/react';

export function App() {
  const health = useSwuiState('Player.Health', 100);
  const ammo = useSwuiState('Weapon.Ammo', 30);
  const openInventory = useSwuiEvent('swui.inventory.open');

  return (
    <div className="hud-root" style={{ width: '100vw', height: '100vh', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', bottom: '32px', left: '32px', color: '#fff', fontSize: '24px', fontFamily: 'sans-serif' }}>
        <div>Health: {health}</div>
        <div>Ammo: {ammo}</div>
      </div>
      <div style={{ position: 'absolute', top: '32px', right: '32px', pointerEvents: 'auto' }}>
        <button onClick={() => openInventory()} style={{ padding: '8px 16px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Open Inventory [I]
        </button>
      </div>
    </div>
  );
}

export default App;
