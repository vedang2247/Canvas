'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listCanvases, createCanvas, deleteCanvas } from '@/services/canvasApi';
import { Canvas } from '@/types/canvas';

export default function Home() {
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
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
    const name = newName.trim();
    if (!name) return;
    setIsCreating(true);
    try {
      const created = await createCanvas(name);
      router.push(`/canvas/${created._id}`);
    } catch (err) {
      console.error('Failed to create canvas:', err);
      setIsCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this canvas? This cannot be undone.')) return;
    try {
      await deleteCanvas(id);
      setCanvases((prev) => prev.filter((c) => c._id !== id));
    } catch (error) {
      console.error('Failed to delete canvas:', error);
    }
  };

  return (
    <>
      {/* ── New Canvas Modal ── */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '12px', padding: '2rem',
              width: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '1.25rem' }}>
              New Canvas
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Give your canvas a name to get started.
            </p>
            <input
              autoFocus
              type="text"
              placeholder="Untitled Canvas"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNew()}
              style={{
                width: '100%', padding: '0.625rem 0.75rem',
                border: '1px solid var(--border)', borderRadius: '8px',
                fontSize: '1rem', outline: 'none', marginBottom: '1rem',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowModal(false); setNewName(''); }}
                style={{
                  padding: '0.5rem 1rem', border: '1px solid var(--border)',
                  borderRadius: '8px', background: '#fff', color: 'var(--text-primary)',
                  fontSize: '0.875rem', fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNew}
                disabled={isCreating || !newName.trim()}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: isCreating || !newName.trim() ? '#9ca3af' : 'var(--accent)',
                  color: '#fff', border: 'none', borderRadius: '8px',
                  fontSize: '0.875rem', fontWeight: 600,
                  cursor: isCreating || !newName.trim() ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {isCreating ? 'Creating…' : 'Create Canvas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Page ── */}
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 60%, #f5f3ff 100%)',
      }}>
        {/* Header */}
        <header style={{
          background: '#fff',
          borderBottom: '1px solid var(--border)',
          padding: '0 2rem',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '32px', height: '32px', background: 'var(--accent)',
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>C</span>
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Caanvas</span>
          </div>
          <button
            onClick={() => { setNewName(''); setShowModal(true); }}
            style={{
              padding: '0.5rem 1.25rem',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
          >
            + New Canvas
          </button>
        </header>

        {/* Body */}
        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            My Canvases
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
            {isLoading ? 'Loading your work…' : canvases.length === 0 ? 'No canvases yet. Create one to get started!' : `${canvases.length} canvas${canvases.length !== 1 ? 'es' : ''}`}
          </p>

          {/* Skeleton grid */}
          {isLoading && (
            <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} style={{
                  background: '#fff', borderRadius: '12px', padding: '1.5rem',
                  height: '140px', border: '1px solid var(--border)',
                  animation: 'skeletonPulse 1.4s ease-in-out infinite',
                }}>
                  <div style={{ height: '1.1rem', background: '#e5e7eb', borderRadius: '4px', width: '55%', marginBottom: '0.75rem' }} />
                  <div style={{ height: '0.8rem', background: '#e5e7eb', borderRadius: '4px', width: '35%' }} />
                </div>
              ))}
              <style>{`
                @keyframes skeletonPulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.45; }
                }
              `}</style>
            </div>
          )}

          {/* Canvas cards */}
          {!isLoading && canvases.length > 0 && (
            <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {canvases.map((canvas) => (
                <div
                  key={canvas._id}
                  onClick={() => router.push(`/canvas/${canvas._id}`)}
                  style={{
                    background: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.12)';
                    e.currentTarget.style.borderColor = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  {/* Color accent bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  }} />

                  <h3 style={{
                    fontSize: '1.05rem', fontWeight: 600,
                    color: 'var(--text-primary)', marginBottom: '0.375rem',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {canvas.name}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                    Updated {new Date(canvas.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => router.push(`/canvas/${canvas._id}`)}
                      style={{
                        flex: 1, padding: '0.4rem',
                        background: 'var(--accent-light)', color: 'var(--accent)',
                        border: '1px solid transparent', borderRadius: '6px',
                        fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.15s',
                      }}
                    >
                      Open
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, canvas._id)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        background: 'transparent', color: 'var(--text-secondary)',
                        border: '1px solid var(--border)', borderRadius: '6px',
                        fontSize: '0.82rem', transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--danger-light)';
                        e.currentTarget.style.color = 'var(--danger)';
                        e.currentTarget.style.borderColor = '#fca5a5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && canvases.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '5rem 2rem',
              border: '2px dashed var(--border)', borderRadius: '16px',
              background: '#fff',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎨</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No canvases yet</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Start creating your first design canvas
              </p>
              <button
                onClick={() => { setNewName(''); setShowModal(true); }}
                style={{
                  padding: '0.625rem 1.5rem',
                  background: 'var(--accent)', color: '#fff',
                  border: 'none', borderRadius: '8px',
                  fontWeight: 600, fontSize: '0.95rem',
                }}
              >
                + Create Canvas
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
