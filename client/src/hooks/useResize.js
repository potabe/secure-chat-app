/**
 * useResize.js — Custom hook for drag-to-resize panels
 *
 * Usage:
 *   const { size, handleMouseDown } = useResize({
 *     defaultSize: 240,
 *     min: 160,
 *     max: 400,
 *     direction: 'horizontal', // 'horizontal' | 'vertical'
 *     storageKey: 'channel-sidebar-width',
 *   });
 */
import { useState, useCallback, useEffect, useRef } from 'react';

export function useResize({ defaultSize, min, max, direction = 'horizontal', storageKey }) {
  const [size, setSize] = useState(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= min && parsed <= max) return parsed;
      }
    }
    return defaultSize;
  });

  const isDragging = useRef(false);
  const startPos = useRef(0);
  const startSize = useRef(size);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
    startSize.current = size;

    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [size, direction]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging.current) return;
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPos.current;
      const newSize = Math.min(max, Math.max(min, startSize.current + delta));
      setSize(newSize);
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // Persist to localStorage
      if (storageKey) {
        setSize(prev => {
          localStorage.setItem(storageKey, String(prev));
          return prev;
        });
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [direction, min, max, storageKey]);

  return { size, handleMouseDown };
}
