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

// Dynamically import CanvasArea so Konva never runs server-side
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
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const isLoadedRef = useRef(false);
  const lastSavedElementsStr = useRef<string>('[]');
  const stageRef = useRef<Konva.Stage | null>(null);

  const { elements, dispatch } = useElements();
  const [debouncedElements] = useDebounce(elements, 1500);

  // ── Load canvas on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    getCanvas(id)
      .then((canvas) => {
        setName(canvas.name);
        dispatch({ type: 'SET_ELEMENTS', elements: canvas.elements });
        lastSavedElementsStr.current = JSON.stringify(canvas.elements);
        setIsLoading(false);
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
    if (currentStr === lastSavedElementsStr.current) return;

    setAutosaveStatus('saving');
    updateCanvas(id, { elements: debouncedElements })
      .then(() => {
        lastSavedElementsStr.current = currentStr;
        setAutosaveStatus('saved');
        setTimeout(() => setAutosaveStatus('idle'), 2000);
      })
      .catch((err) => {
        console.error('Autosave failed:', err);
        setAutosaveStatus('idle');
      });
  }, [debouncedElements, id]);

  // ── Manual save ────────────────────────────────────────────────────────
  const save = useCallback(
    async () => {
      if (!id || !isLoadedRef.current) return;
      setSaveStatus('saving');
      try {
        await updateCanvas(id, { name, elements });
        lastSavedElementsStr.current = JSON.stringify(elements);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Save failed:', err);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    },
    [id, name, elements]
  );

  // ── Export PNG ─────────────────────────────────────────────────────────
  const handleExportPng = () => {
    if (!stageRef.current) return;
    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `${name || 'canvas'}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── UI States ──────────────────────────────────────────────────────────
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {autosaveStatus === 'saved' && (
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 500 }}>Autosaved</span>
          )}
          {autosaveStatus === 'saving' && (
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Saving...</span>
          )}

          <button
            onClick={handleExportPng}
            style={{
              padding: '0.375rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              background: '#fff',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
            }}
          >
            Export PNG
          </button>

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
