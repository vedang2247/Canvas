'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getCanvas, updateCanvas } from '@/services/canvasApi';
import { ElementsProvider, useElements } from '@/context/ElementsContext';
import Toolbar from '@/components/Toolbar';
import PropertiesPanel from '@/components/PropertiesPanel';

// Dynamically import CanvasArea so Konva never runs server-side
const CanvasArea = dynamic(() => import('@/components/CanvasArea'), { ssr: false });

// ── Save indicator states ─────────────────────────────────────────────────
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

  // Track whether the canvas has been initially loaded before allowing saves
  const isLoadedRef = useRef(false);

  const { elements, dispatch } = useElements();

  // ── Load canvas on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    getCanvas(id)
      .then((canvas) => {
        setName(canvas.name);
        dispatch({ type: 'SET_ELEMENTS', elements: canvas.elements });
        setIsLoading(false);
        // Mark canvas as loaded AFTER state is set so autosave guard works
        setTimeout(() => { isLoadedRef.current = true; }, 0);
      })
      .catch((err) => {
        console.error('Failed to load canvas:', err);
        setLoadError(true);
        setIsLoading(false);
      });
  }, [id, dispatch]);

  // ── Save function (shared by button and autosave) ──────────────────────
  const save = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!id || !isLoadedRef.current) return;
      if (!options?.silent) setSaveStatus('saving');
      try {
        await updateCanvas(id, { name, elements });
        setSaveStatus('saved');
        // Reset to idle after 2 s
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Save failed:', err);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    },
    [id, name, elements]
  );

  // ── Loading / error states ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading canvas…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem' }}>
        <p style={{ color: '#dc2626' }}>Canvas not found or failed to load.</p>
        <button
          onClick={() => router.push('/')}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer', border: '1px solid #d1d5db', borderRadius: '6px' }}
        >
          ← Back to Home
        </button>
      </div>
    );
  }

  // ── Save indicator label ───────────────────────────────────────────────
  const saveLabel =
    saveStatus === 'saving' ? 'Saving…'
    : saveStatus === 'saved'  ? '✓ Saved'
    : saveStatus === 'error'  ? '✗ Error'
    : 'Save';

  const saveBg =
    saveStatus === 'saved' ? '#d1fae5'
    : saveStatus === 'error' ? '#fee2e2'
    : '#6366f1';

  const saveColor =
    saveStatus === 'saved' ? '#065f46'
    : saveStatus === 'error' ? '#dc2626'
    : '#ffffff';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* ── Header ── */}
      <header style={{
        padding: '0.625rem 1.25rem',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff',
        zIndex: 10,
        gap: '1rem',
      }}>
        {/* Left: home button + editable name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '0.375rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              background: '#f9fafb',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
            }}
          >
            ← Home
          </button>

          {/* Step 39 — Editable canvas name */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Canvas name"
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#111827',
              border: 'none',
              borderBottom: '2px solid transparent',
              outline: 'none',
              background: 'transparent',
              padding: '0.25rem 0.125rem',
              minWidth: '160px',
              maxWidth: '320px',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.target.style.borderBottomColor = '#6366f1')}
            onBlur={(e) => (e.target.style.borderBottomColor = 'transparent')}
          />
        </div>

        {/* Right: save indicator + save button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Step 38 — Save button */}
          <button
            id="btn-save"
            onClick={() => save()}
            disabled={saveStatus === 'saving'}
            style={{
              padding: '0.375rem 1rem',
              background: saveBg,
              color: saveColor,
              border: 'none',
              borderRadius: '6px',
              cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              transition: 'background 0.2s, color 0.2s',
              minWidth: '80px',
            }}
          >
            {saveLabel}
          </button>
        </div>
      </header>

      {/* ── Editor body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Toolbar />
        <CanvasArea selectedId={selectedId} setSelectedId={setSelectedId} />
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
