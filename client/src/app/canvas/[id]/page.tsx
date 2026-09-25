'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type Konva from 'konva';
import { useDebounce } from 'use-debounce';
import { getCanvas, updateCanvas } from '@/services/canvasApi';
import { ElementsProvider, useElements } from '@/context/ElementsContext';
import Toolbar from '@/components/Toolbar';
import PropertiesPanel from '@/components/PropertiesPanel';

// Dynamically import CanvasArea — Konva requires the browser DOM (no SSR)
const CanvasArea = dynamic(() => import('@/components/CanvasArea'), { ssr: false });

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function EditorInner() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [autosaveLabel, setAutosaveLabel] = useState('');

  const isLoadedRef = useRef(false);
  const lastSavedStr = useRef<string>('');
  const stageRef = useRef<Konva.Stage | null>(null);

  const { elements, dispatch } = useElements();
  const [debouncedElements] = useDebounce(elements, 1500);

  // ── Load canvas ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    getCanvas(id)
      .then((canvas) => {
        setName(canvas.name);
        dispatch({ type: 'SET_ELEMENTS', elements: canvas.elements });
        lastSavedStr.current = JSON.stringify(canvas.elements);
        setIsLoading(false);
        // Guard against autosave firing before first load settles
        setTimeout(() => { isLoadedRef.current = true; }, 0);
      })
      .catch((err) => {
        console.error('Failed to load canvas:', err);
        setLoadError(true);
        setIsLoading(false);
      });
  }, [id, dispatch]);

  // ── Autosave ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !isLoadedRef.current) return;
    const currentStr = JSON.stringify(debouncedElements);
    if (currentStr === lastSavedStr.current) return;

    setAutosaveLabel('Saving…');
    updateCanvas(id, { elements: debouncedElements })
      .then(() => {
        lastSavedStr.current = currentStr;
        setAutosaveLabel('Autosaved ✓');
        setTimeout(() => setAutosaveLabel(''), 2500);
      })
      .catch(() => {
        setAutosaveLabel('Autosave failed');
        setTimeout(() => setAutosaveLabel(''), 3000);
      });
  }, [debouncedElements, id]);

  // ── Manual save ────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!id || !isLoadedRef.current) return;
    setSaveStatus('saving');
    try {
      await updateCanvas(id, { name, elements });
      lastSavedStr.current = JSON.stringify(elements);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [id, name, elements]);

  // ── Export PNG ─────────────────────────────────────────────────────────
  const exportPng = () => {
    if (!stageRef.current) return;
    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `${name || 'canvas'}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        dispatch({ type: 'DELETE_ELEMENT', id: selectedId });
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, dispatch]);

  // ── Loading spinner ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff' }}>
        <header style={{ height: '60px', borderBottom: '1px solid var(--border)', background: '#fff' }} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
            animation: 'editorSpin 0.8s linear infinite',
          }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading canvas…</p>
          <style>{`@keyframes editorSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem', background: '#fff' }}>
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Canvas not found</h2>
        <p style={{ color: 'var(--text-secondary)' }}>This canvas may have been deleted or the link is invalid.</p>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '0.5rem 1.25rem', background: 'var(--accent)',
            color: '#fff', border: 'none', borderRadius: '8px',
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          ← Back to Home
        </button>
      </div>
    );
  }

  // ── Save button label/style ────────────────────────────────────────────
  const saveLabel =
    saveStatus === 'saving' ? 'Saving…'
    : saveStatus === 'saved'  ? '✓ Saved'
    : saveStatus === 'error'  ? '✗ Error'
    : 'Save';

  const saveBg =
    saveStatus === 'saved'  ? 'var(--success-light)'
    : saveStatus === 'error' ? 'var(--danger-light)'
    : 'var(--accent)';

  const saveColor =
    saveStatus === 'saved'  ? 'var(--success)'
    : saveStatus === 'error' ? 'var(--danger)'
    : '#fff';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <header style={{
        padding: '0 1.25rem',
        height: '56px',
        minHeight: '56px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        zIndex: 10,
        gap: '1rem',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '0 0 auto' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '0.35rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              background: '#f9fafb',
              fontSize: '0.82rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-light)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#f9fafb')}
          >
            ← Home
          </button>

          {/* Editable canvas name */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Canvas name"
            style={{
              fontSize: '1rem', fontWeight: 700,
              color: 'var(--text-primary)',
              border: 'none',
              borderBottom: '2px solid transparent',
              outline: 'none', background: 'transparent',
              padding: '0.2rem 0.125rem',
              minWidth: '140px', maxWidth: '300px',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.target.style.borderBottomColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderBottomColor = 'transparent')}
          />
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: '0 0 auto' }}>
          {autosaveLabel && (
            <span style={{
              fontSize: '0.75rem',
              color: autosaveLabel.includes('failed') ? 'var(--danger)' : 'var(--text-secondary)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}>
              {autosaveLabel}
            </span>
          )}

          <button
            onClick={exportPng}
            style={{
              padding: '0.35rem 0.875rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              background: '#fff',
              fontSize: '0.82rem', fontWeight: 500,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
          >
            Export PNG
          </button>

          <button
            id="btn-save"
            onClick={save}
            disabled={saveStatus === 'saving'}
            style={{
              padding: '0.35rem 1rem',
              background: saveBg,
              color: saveColor,
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s, color 0.2s',
              minWidth: '72px',
              whiteSpace: 'nowrap',
            }}
          >
            {saveLabel}
          </button>
        </div>
      </header>

      {/* ── Editor body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Toolbar />
        <CanvasArea selectedId={selectedId} setSelectedId={setSelectedId} stageRef={stageRef} />
        <PropertiesPanel selectedId={selectedId} setSelectedId={setSelectedId} />
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <ElementsProvider>
      <EditorInner />
    </ElementsProvider>
  );
}
