import React, { useState } from 'react';
import { useSwuiEvent, useSwuiState } from '@swui/react';
import { Shield, Zap, Crosshair } from 'lucide-react';

interface PlayerStats {
  health: number;
  stamina: number;
  ammo: number;
  score: number;
}

export const HudApp: React.FC = () => {
  // Listen for real-time state broadcasts from Unreal Engine
  const stats = useSwuiState<PlayerStats>('player.stats', {
    health: 100,
    stamina: 85,
    ammo: 30,
    score: 0,
  });

  // Example of listening to specific one-shot gameplay events
  const [lastNotification, setLastNotification] = useState<string>('Welcome to SWUI');
  useSwuiEvent<{ message: string }>('game.notification', (payload) => {
    if (payload?.message) {
      setLastNotification(payload.message);
    }
  });

  return (
    <div className="hud-container">
      {/* Top Notification Banner */}
      <div className="hud-notification">
        <span>{lastNotification}</span>
      </div>

      {/* Bottom-Left Status Bars */}
      <div className="hud-bottom-left">
        <div className="stat-row">
          <Shield size={18} color="#4ade80" />
          <div className="stat-bar-bg">
            <div
              className="stat-bar-fill health"
              style={{ width: `${Math.max(0, Math.min(100, stats.health))}%` }}
            />
          </div>
          <span className="stat-value">{stats.health}</span>
        </div>

        <div className="stat-row">
          <Zap size={18} color="#38bdf8" />
          <div className="stat-bar-bg">
            <div
              className="stat-bar-fill stamina"
              style={{ width: `${Math.max(0, Math.min(100, stats.stamina))}%` }}
            />
          </div>
          <span className="stat-value">{stats.stamina}</span>
        </div>
      </div>

      {/* Bottom-Right Ammo & Score */}
      <div className="hud-bottom-right">
        <div className="score-display">
          <span className="label">SCORE</span>
          <span className="number">{stats.score.toLocaleString()}</span>
        </div>
        <div className="ammo-display">
          <Crosshair size={20} color="#facc15" />
          <span className="ammo-count">{stats.ammo}</span>
          <span className="ammo-max">/ 90</span>
        </div>
      </div>
    </div>
  );
};

