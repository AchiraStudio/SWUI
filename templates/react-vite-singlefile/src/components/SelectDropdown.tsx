import React, { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectDropdownProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

/**
 * In-DOM custom select dropdown component.
 * In CEF Off-Screen Rendering (OSR), native HTML <select> elements trigger OS popups (PET_POPUP)
 * which can cause texture reallocations. This custom component stays entirely within
 * the React DOM and guarantees smooth rendering inside Unreal Engine.
 */
export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  options,
  value,
  onChange,
  className = '',
  placeholder = 'Select...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`swui-select-container ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        minWidth: '160px',
        userSelect: 'none',
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'rgba(20, 26, 38, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          color: '#ffffff',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          outline: 'none',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span style={{ fontSize: '10px', marginLeft: '8px', opacity: 0.7 }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'rgba(15, 20, 30, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            maxHeight: '220px',
            overflowY: 'auto',
            backdropFilter: 'blur(12px)',
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '10px 14px',
                fontSize: '14px',
                color: opt.value === value ? '#38ef7d' : '#f0f4f8',
                background: opt.value === value ? 'rgba(56, 239, 125, 0.1)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  opt.value === value ? 'rgba(56, 239, 125, 0.1)' : 'transparent';
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

