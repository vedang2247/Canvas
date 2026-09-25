'use client';

import { useElements } from '@/context/ElementsContext';
import { CanvasElement } from '@/types/canvas';

interface PropertiesPanelProps {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

export default function PropertiesPanel({ selectedId, setSelectedId }: PropertiesPanelProps) {
  const { elements, dispatch } = useElements();
  const element = elements.find((el) => el.id === selectedId);

  const updateNum = (field: string, value: number) => {
    if (!selectedId) return;
    dispatch({ type: 'UPDATE_ELEMENT', id: selectedId, patch: { [field]: value } as Partial<CanvasElement> });
  };

  const updateStr = (field: string, value: string) => {
    if (!selectedId) return;
    dispatch({ type: 'UPDATE_ELEMENT', id: selectedId, patch: { [field]: value } as Partial<CanvasElement> });
  };

  const handleDelete = () => {
    if (!selectedId) return;
    dispatch({ type: 'DELETE_ELEMENT', id: selectedId });
    setSelectedId(null);
  };

  const handleBringForward = () => element && updateNum('zIndex', element.zIndex + 1);
  const handleSendBackward = () => element && updateNum('zIndex', Math.max(0, element.zIndex - 1));

  if (!element) {
    return (
      <aside style={panelStyle}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: '0.75rem',
          color: 'var(--text-secondary)', padding: '2rem',
        }}>
          <span style={{ fontSize: '2rem' }}>↖</span>
          <p style={{ fontSize: '0.82rem', textAlign: 'center', lineHeight: 1.5 }}>
            Select an element to edit its properties
          </p>
        </div>
      </aside>
    );
  }

  const typeLabel = element.type.charAt(0).toUpperCase() + element.type.slice(1);

  return (
    <aside style={panelStyle}>
      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: '0.72rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          color: 'var(--text-secondary)',
        }}>
          {typeLabel}
        </span>
        <span style={{
          fontSize: '0.68rem', padding: '0.15rem 0.5rem',
          background: 'var(--accent-light)', color: 'var(--accent)',
          borderRadius: '999px', fontWeight: 600,
        }}>
          id:{element.id.slice(0, 6)}
        </span>
      </div>

      <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', overflowY: 'auto' }}>

        {/* Position */}
        <Section label="Position">
          <Row label="X" value={element.x} onChange={(v) => updateNum('x', v)} />
          <Row label="Y" value={element.y} onChange={(v) => updateNum('y', v)} />
        </Section>

        {/* Transform */}
        <Section label="Transform">
          <Row label="Rotation" value={element.rotation} onChange={(v) => updateNum('rotation', v)} unit="°" />
          <Row label="Z-Index"  value={element.zIndex}   onChange={(v) => updateNum('zIndex', v)}   step={1} />
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
            <button
              onClick={handleSendBackward}
              style={{ ...layerBtnStyle }}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, layerBtnHover)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, layerBtnStyle)}
            >↓ Backward</button>
            <button
              onClick={handleBringForward}
              style={{ ...layerBtnStyle }}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, layerBtnHover)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, layerBtnStyle)}
            >↑ Forward</button>
          </div>
        </Section>

        {/* Rect-specific */}
        {element.type === 'rect' && (
          <Section label="Size">
            <Row label="Width"  value={element.width}  onChange={(v) => updateNum('width', v)} />
            <Row label="Height" value={element.height} onChange={(v) => updateNum('height', v)} />
            <ColorRow label="Fill" value={element.fill} onChange={(v) => updateStr('fill', v)} />
          </Section>
        )}

        {/* Circle-specific */}
        {element.type === 'circle' && (
          <Section label="Size">
            <Row label="Radius" value={element.radius} onChange={(v) => updateNum('radius', v)} />
            <ColorRow label="Fill" value={element.fill} onChange={(v) => updateStr('fill', v)} />
          </Section>
        )}

        {/* Text-specific */}
        {element.type === 'text' && (
          <Section label="Text">
            <div>
              <label style={labelStyle}>Content</label>
              <input
                type="text"
                value={element.text}
                onChange={(e) => updateStr('text', e.target.value)}
                style={{ ...inputStyle, width: '100%', marginTop: '0.25rem' }}
              />
            </div>
            <Row label="Font Size" value={element.fontSize} onChange={(v) => updateNum('fontSize', v)} step={1} />
            <ColorRow label="Color" value={element.fill} onChange={(v) => updateStr('fill', v)} />
          </Section>
        )}

        {/* Delete */}
        <button
          onClick={handleDelete}
          style={{
            width: '100%',
            padding: '0.5rem',
            background: 'transparent',
            color: 'var(--danger)',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.82rem',
            cursor: 'pointer',
            marginTop: '0.25rem',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--danger-light)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          Delete Element
        </button>
      </div>
    </aside>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{
        fontSize: '0.68rem', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--text-secondary)', marginBottom: '0.4rem',
      }}>
        {label}
      </p>
      <div style={{
        background: '#f8f9fb', borderRadius: '8px',
        padding: '0.5rem 0.625rem',
        display: 'flex', flexDirection: 'column', gap: '0.45rem',
        border: '1px solid var(--border)',
      }}>
        {children}
      </div>
    </div>
  );
}

function Row({
  label, value, step = 0.5, unit = '', onChange,
}: {
  label: string; value: number; step?: number; unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
      <label style={labelStyle}>{label}{unit && <span style={{ color: '#9ca3af' }}> {unit}</span>}</label>
      <input
        type="number"
        value={Math.round(value * 100) / 100}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ...inputStyle, width: '72px', textAlign: 'right' }}
      />
    </div>
  );
}

function ColorRow({
  label, value, onChange,
}: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        <input
          type="color"
          value={value.startsWith('#') ? value : '#6366f1'}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '28px', height: '24px', padding: '1px', border: '1px solid var(--border)', cursor: 'pointer', borderRadius: '4px', background: 'none' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, width: '72px', fontFamily: 'monospace', fontSize: '0.72rem', textAlign: 'center' }}
        />
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  width: '220px',
  minWidth: '220px',
  borderLeft: '1px solid var(--border)',
  background: 'var(--surface)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: 'var(--text-primary)',
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  padding: '0.2rem 0.4rem',
  border: '1px solid var(--border)',
  borderRadius: '5px',
  fontSize: '0.78rem',
  background: '#fff',
  outline: 'none',
  color: 'var(--text-primary)',
};

const layerBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.3rem',
  fontSize: '0.72rem',
  cursor: 'pointer',
  borderRadius: '5px',
  border: '1px solid var(--border)',
  background: '#fff',
  color: 'var(--text-primary)',
  fontWeight: 500,
  transition: 'all 0.13s',
};

const layerBtnHover: React.CSSProperties = {
  background: 'var(--accent-light)',
  color: 'var(--accent)',
  borderColor: '#c7d2fe',
};
