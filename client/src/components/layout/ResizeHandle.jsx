/**
 * ResizeHandle.jsx — Drag handle for resizing panels
 */
import { useState } from 'react';

export default function ResizeHandle({ onMouseDown, direction = 'horizontal' }) {
  const [hovered, setHovered] = useState(false);

  const isHorizontal = direction === 'horizontal';

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0,
        width: isHorizontal ? 5 : '100%',
        height: isHorizontal ? '100%' : 5,
        cursor: isHorizontal ? 'col-resize' : 'row-resize',
        position: 'relative',
        zIndex: 10,
        background: 'transparent',
        transition: 'background 0.15s ease',
      }}
      title="Drag untuk mengubah ukuran"
    >
      {/* Visual indicator line */}
      <div
        style={{
          position: 'absolute',
          ...(isHorizontal
            ? { top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: hovered ? 2 : 1 }
            : { left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', height: hovered ? 2 : 1 }
          ),
          background: hovered ? 'var(--primary)' : 'var(--border)',
          transition: 'all 0.15s ease',
          borderRadius: 4,
        }}
      />

      {/* Drag dots indicator (only when hovered) */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: isHorizontal ? 'column' : 'row',
            gap: 3,
          }}
        >
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: 'var(--primary)',
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
