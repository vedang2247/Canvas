'use client';

import { useElements } from '@/context/ElementsContext';
import { CanvasElement } from '@/types/canvas';

export default function Toolbar() {
  const { elements, dispatch } = useElements();

  const handleAdd = (type: 'rect' | 'circle' | 'text') => {
    const baseElement = {
      id: crypto.randomUUID(),
      // Stagger new elements so they don't all land at the same spot
      x: 80 + (elements.length % 5) * 20,
      y: 80 + (elements.length % 5) * 20,
      rotation: 0,
      zIndex: elements.length,
      fill: type === 'text' ? '#111827' : '#6366f1',
    };

    let newElement: CanvasElement;
    if (type === 'rect') {
      newElement = { ...baseElement, type: 'rect', width: 120, height: 80 };
    } else if (type === 'circle') {
      newElement = { ...baseElement, type: 'circle', radius: 55 };
    } else {
      newElement = { ...baseElement, type: 'text', text: 'Double-click to edit', fontSize: 20 };
    }

    dispatch({ type: 'ADD_ELEMENT', element: newElement });
  };

  const tools: { type: 'rect' | 'circle' | 'text'; label: string; icon: string; desc: string }[] = [
    { type: 'rect',   label: 'Rectangle', icon: '▭', desc: 'Add a rectangle' },
    { type: 'circle', label: 'Circle',    icon: '○', desc: 'Add a circle' },
    { type: 'text',   label: 'Text',      icon: 'T', desc: 'Add a text element' },
  ];

  return (
    <aside style={{
      width: '180px',
      minWidth: '180px',
      borderRight: '1px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem 0.75rem',
      gap: '0.25rem',
      overflowY: 'auto',
    }}>
      <p style={{
        fontSize: '0.7rem', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--text-secondary)', marginBottom: '0.5rem',
        paddingLeft: '0.25rem',
      }}>
        Elements
      </p>

      {tools.map(({ type, label, icon, desc }) => (
        <button
          key={type}
          title={desc}
          onClick={() => handleAdd(type)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.6rem 0.75rem',
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.13s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-light)';
            e.currentTarget.style.borderColor = '#c7d2fe';
            e.currentTarget.style.color = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
        >
          <span style={{
            width: '28px', height: '28px',
            background: 'var(--accent-light)', color: 'var(--accent)',
            borderRadius: '6px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: type === 'text' ? '0.9rem' : '1.1rem',
            fontWeight: 700, flexShrink: 0,
            transition: 'background 0.13s',
          }}>
            {icon}
          </span>
          {label}
        </button>
      ))}

      <div style={{
        marginTop: 'auto', paddingTop: '1rem',
        borderTop: '1px solid var(--border)',
        fontSize: '0.75rem', color: 'var(--text-secondary)',
        paddingLeft: '0.25rem',
      }}>
        <span style={{ fontWeight: 600 }}>{elements.length}</span> element{elements.length !== 1 ? 's' : ''}
        <div style={{ marginTop: '0.5rem', lineHeight: 1.6, color: '#9ca3af', fontSize: '0.7rem' }}>
          <div>⌫ Delete selected</div>
          <div>⤢ Drag to move</div>
          <div>↗ Handles to resize</div>
          <div>⇄ Double-click text</div>
        </div>
      </div>
    </aside>
  );
}
