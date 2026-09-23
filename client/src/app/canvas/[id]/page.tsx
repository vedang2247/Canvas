'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getCanvas } from '@/services/canvasApi';
import { ElementsProvider, useElements } from '@/context/ElementsContext';
import Toolbar from '@/components/Toolbar';
import PropertiesPanel from '@/components/PropertiesPanel';

// Dynamically import CanvasArea so Konva never runs server-side
const CanvasArea = dynamic(() => import('@/components/CanvasArea'), { ssr: false });

function EditorInner() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { dispatch } = useElements();

  useEffect(() => {
    if (!id) return;
    getCanvas(id)
      .then((canvas) => {
        setName(canvas.name);
        dispatch({ type: 'SET_ELEMENTS', elements: canvas.elements });
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load canvas:', err);
        setLoadError(true);
        setIsLoading(false);
      });
  }, [id, dispatch]);

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
        <button onClick={() => router.push('/')} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          ← Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <header style={{
        padding: '0.75rem 1.25rem',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => router.push('/')}
            style={{ padding: '0.375rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', background: '#f9fafb' }}
          >
            ← Home
          </button>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>{name}</h1>
        </div>
      </header>

      {/* Editor body */}
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
