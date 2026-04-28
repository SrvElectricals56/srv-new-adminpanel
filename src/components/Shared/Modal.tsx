'use client';
import React, { useRef } from 'react';
import { useThemePalette } from '@/lib/theme';

/**
 * Modal overlay wrapper that prevents accidental close on text-select drag.
 * Uses mousedown/mouseup tracking instead of onClick to avoid the issue where
 * selecting text inside the modal and releasing mouse outside closes the modal.
 */
export default function Modal({
  children,
  onClose,
  width = 560,
  maxWidth = '95vw',
  maxHeight = '90vh',
  style,
}: {
  children: React.ReactNode;
  onClose: () => void;
  width?: number | string;
  maxWidth?: string;
  maxHeight?: string;
  style?: React.CSSProperties;
}) {
  const C = useThemePalette();
  const mouseDownInside = useRef(false);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: C.overlay,
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onMouseDown={() => { mouseDownInside.current = false; }}
      onMouseUp={() => { if (!mouseDownInside.current) onClose(); }}
    >
      <div
        style={{
          background: C.card,
          borderRadius: 20,
          width,
          maxWidth,
          maxHeight,
          overflowY: 'auto',
          boxShadow: '0 25px 70px rgba(0,0,0,0.25)',
          border: `1px solid ${C.border}`,
          ...style,
        }}
        onMouseDown={e => { e.stopPropagation(); mouseDownInside.current = true; }}
        onMouseUp={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
