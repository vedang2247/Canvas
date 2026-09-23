'use client';

import { useElements } from '@/context/ElementsContext';
import { CanvasElement } from '@/types/canvas';

export default function Toolbar() {
  const { elements, dispatch } = useElements();

  const handleAdd = (type: 'rect' | 'circle' | 'text') => {
    const baseElement = {
      id: crypto.randomUUID(),
      x: 100,
      y: 100,
      rotation: 0,
      zIndex: elements.length,
      fill: type === 'text' ? '#000000' : '#6366f1',
    };

    let newElement: CanvasElement;

    if (type === 'rect') {
      newElement = { ...baseElement, type: 'rect', width: 100, height: 100 };
    } else if (type === 'circle') {
      newElement = { ...baseElement, type: 'circle', radius: 50 };
    } else {
      newElement = { ...baseElement, type: 'text', text: 'New Text', fontSize: 24 };
    }

    dispatch({ type: 'ADD_ELEMENT', element: newElement });
  };

  return (
    <div style={{ width: '200px', borderRight: '1px solid #ccc', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3>Tools</h3>
      <button onClick={() => handleAdd('rect')} style={buttonStyle}>Add Rectangle</button>
      <button onClick={() => handleAdd('circle')} style={buttonStyle}>Add Circle</button>
      <button onClick={() => handleAdd('text')} style={buttonStyle}>Add Text</button>
      
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #eee', fontSize: '0.875rem', color: '#666' }}>
        Elements count: {elements.length}
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: '0.5rem',
  background: '#f3f4f6',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  cursor: 'pointer',
};
