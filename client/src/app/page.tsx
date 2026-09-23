'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listCanvases, createCanvas, deleteCanvas } from '@/services/canvasApi';
import { Canvas } from '@/types/canvas';

export default function Home() {
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCanvases();
  }, []);

  const fetchCanvases = async () => {
    try {
      const data = await listCanvases();
      setCanvases(data);
    } catch (error) {
      console.error('Failed to fetch canvases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = async () => {
    const name = prompt('Enter canvas name:');
    if (!name) return;
    setIsCreating(true);
    try {
      const newCanvas = await createCanvas(name);
      router.push(`/canvas/${newCanvas._id}`);
    } catch (error) {
      console.error('Failed to create canvas:', error);
      alert('Failed to create canvas');
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this canvas?')) return;
    try {
      await deleteCanvas(id);
      await fetchCanvases();
    } catch (error) {
      console.error('Failed to delete canvas:', error);
      alert('Failed to delete canvas');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>My Canvases</h1>
        <button 
          onClick={handleCreateNew}
          disabled={isCreating}
          style={{ 
            padding: '0.5rem 1rem', 
            background: isCreating ? '#9ca3af' : '#6366f1', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: isCreating ? 'not-allowed' : 'pointer' 
          }}
        >
          {isCreating ? 'Creating...' : 'New Canvas'}
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{ border: '1px solid #e5e7eb', padding: '1rem', borderRadius: '8px', background: '#f9fafb', height: '120px', animation: 'pulse 1.5s infinite ease-in-out' }}>
              <div style={{ height: '1.25rem', background: '#e5e7eb', borderRadius: '4px', width: '60%', marginBottom: '0.5rem' }}></div>
              <div style={{ height: '0.875rem', background: '#e5e7eb', borderRadius: '4px', width: '40%' }}></div>
            </div>
          ))}
          <style>{`
            @keyframes pulse {
              0% { opacity: 1; }
              50% { opacity: 0.5; }
              100% { opacity: 1; }
            }
          `}</style>
        </div>
      ) : canvases.length === 0 ? (
        <p>No canvases found. Create one to get started!</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
          {canvases.map(canvas => (
            <div key={canvas._id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>{canvas.name}</h3>
              <p style={{ color: '#666', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>
                Updated: {new Date(canvas.updatedAt).toLocaleDateString()}
              </p>
              <button 
                onClick={() => router.push(`/canvas/${canvas._id}`)}
                style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem', cursor: 'pointer' }}
              >
                Open
              </button>
              <button 
                onClick={() => handleDelete(canvas._id)}
                style={{ padding: '0.25rem 0.5rem', color: 'red', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
