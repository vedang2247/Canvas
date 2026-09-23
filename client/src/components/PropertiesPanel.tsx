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

  // Generic number field updater
  const updateField = (field: string, value: number) => {
    if (!selectedId) return;
    dispatch({
      type: 'UPDATE_ELEMENT',
      id: selectedId,
      patch: { [field]: value } as Partial<CanvasElement>,
    });
  };

  // Generic string field updater
  const updateStringField = (field: string, value: string) => {
    if (!selectedId) return;
    dispatch({
      type: 'UPDATE_ELEMENT',
      id: selectedId,
      patch: { [field]: value } as Partial<CanvasElement>,
    });
  };

  const handleDelete = () => {
    if (!selectedId) return;
    dispatch({ type: 'DELETE_ELEMENT', id: selectedId });
    setSelectedId(null);
  };

  if (!element) {
    return (
      <div style={panelStyle}>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', marginTop: '2rem' }}>
          Select an element to edit its properties
        </p>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <h3 style={{ marginBottom: '1rem', textTransform: 'capitalize', color: '#374151' }}>
        {element.type} properties
      </h3>

      {/* ── Shared fields ── */}
      <Section label="Position">
        <Field label="X" value={element.x} onChange={(v) => updateField('x', v)} />
        <Field label="Y" value={element.y} onChange={(v) => updateField('y', v)} />
      </Section>

      <Section label="Transform">
        <Field label="Rotation (°)" value={element.rotation} onChange={(v) => updateField('rotation', v)} />
        <Field label="Z-Index" value={element.zIndex} step={1} onChange={(v) => updateField('zIndex', v)} />
      </Section>

      {/* ── Type-specific fields ── */}
      {element.type === 'rect' && (
        <Section label="Size">
          <Field label="Width" value={element.width} onChange={(v) => updateField('width', v)} />
          <Field label="Height" value={element.height} onChange={(v) => updateField('height', v)} />
          <ColorField label="Fill" value={element.fill} onChange={(v) => updateStringField('fill', v)} />
        </Section>
      )}

      {element.type === 'circle' && (
        <Section label="Size">
          <Field label="Radius" value={element.radius} onChange={(v) => updateField('radius', v)} />
          <ColorField label="Fill" value={element.fill} onChange={(v) => updateStringField('fill', v)} />
        </Section>
      )}

      {element.type === 'text' && (
        <Section label="Text">
          <label style={labelStyle}>Content</label>
          <input
            type="text"
            value={element.text}
            onChange={(e) => updateStringField('text', e.target.value)}
            style={{ ...inputStyle, marginBottom: '0.5rem' }}
          />
          <Field label="Font Size" value={element.fontSize} onChange={(v) => updateField('fontSize', v)} />
          <ColorField label="Fill" value={element.fill} onChange={(v) => updateStringField('fill', v)} />
        </Section>
      )}

      {/* ── Delete ── */}
      <button
        onClick={handleDelete}
        style={{
          marginTop: '1.5rem',
          width: '100%',
          padding: '0.5rem',
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fca5a5',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Delete Element
      </button>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '0.5rem' }}>
        {label}
      </p>
      <div style={{ background: '#f9fafb', borderRadius: '6px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
      <label style={labelStyle}>{label}</label>
      <input
        type="number"
        value={Math.round(value * 100) / 100}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ...inputStyle, width: '80px', textAlign: 'right' }}
      />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '32px', height: '28px', padding: '0', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, width: '80px', fontFamily: 'monospace', fontSize: '0.75rem' }}
        />
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  width: '240px',
  minWidth: '240px',
  borderLeft: '1px solid #e5e7eb',
  padding: '1rem',
  overflowY: 'auto',
  background: '#ffffff',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#374151',
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  fontSize: '0.8rem',
  background: '#fff',
  outline: 'none',
};
