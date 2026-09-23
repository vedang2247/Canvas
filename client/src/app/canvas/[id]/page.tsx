'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCanvas } from '@/services/canvasApi';
import { ElementsProvider, useElements } from '@/context/ElementsContext';
import Toolbar from '@/components/Toolbar';

// These components will be built in later steps, placeholder for now
const CanvasArea = () => <div style={{ flex: 1, border: '1px solid #ccc', margin: '0 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>[Canvas Area Placeholder]</div>;
const PropertiesPanel = () => <div style={{ width: '300px', borderLeft: '1px solid #ccc', padding: '1rem' }}>[Properties Panel Placeholder]</div>;

function EditorInner() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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
        console.error(err);
        alert('Failed to load canvas');
        router.push('/');
      });
  }, [id, dispatch, router]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between' }}>
        <h2>{name}</h2>
        <button onClick={() => router.push('/')}>Back to Home</button>
      </header>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Toolbar />
        <CanvasArea />
        <PropertiesPanel />
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
