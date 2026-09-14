import React, { useState } from 'react';
import { postMessage } from '@swui/core';
import { SelectDropdown } from '../../components/SelectDropdown';
import { Play, RotateCcw, Settings, LogOut, Volume2 } from 'lucide-react';

export const PauseMenuApp: React.FC = () => {
  const [graphicsQuality, setGraphicsQuality] = useState('epic');
  const [audioVolume, setAudioVolume] = useState(80);

  const handleResume = () => {
    postMessage({ tag: 'menu.resume' });
  };

  const handleRestart = () => {
    postMessage({ tag: 'menu.restart' });
  };

  const handleQuit = () => {
    postMessage({ tag: 'menu.quit' });
  };

  return (
    <div className="pause-overlay">
      <div className="pause-card">
        <h1 className="pause-title">PAUSED</h1>

        <div className="pause-actions">
          <button className="pause-btn primary" onClick={handleResume}>
            <Play size={18} />
            <span>RESUME GAME</span>
          </button>

          <button className="pause-btn" onClick={handleRestart}>
            <RotateCcw size={18} />
            <span>RESTART LEVEL</span>
          </button>
        </div>

        <div className="pause-divider" />

        <div className="pause-settings">
          <div className="setting-row">
            <span className="setting-label">Graphics Quality</span>
            <SelectDropdown
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'epic', label: 'Epic' },
              ]}
              value={graphicsQuality}
              onChange={(val) => {
                setGraphicsQuality(val);
                postMessage({ tag: 'settings.graphics', quality: val });
              }}
            />
          </div>

          <div className="setting-row">
            <div className="label-with-icon">
              <Volume2 size={16} />
              <span className="setting-label">Master Volume</span>
            </div>
            <div className="slider-wrapper">
              <input
                type="range"
                min="0"
                max="100"
                value={audioVolume}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setAudioVolume(val);
                  postMessage({ tag: 'settings.volume', volume: val });
                }}
                className="volume-slider"
              />
              <span className="slider-value">{audioVolume}%</span>
            </div>
          </div>
        </div>

        <div className="pause-divider" />

        <button className="pause-btn danger" onClick={handleQuit}>
          <LogOut size={18} />
          <span>QUIT TO MAIN MENU</span>
        </button>
      </div>
    </div>
  );
};

