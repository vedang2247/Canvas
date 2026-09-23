'use client';

import React from 'react';
import { Stage, Layer, Rect, Circle, Text } from 'react-konva';
import { useElements } from '@/context/ElementsContext';

export default function CanvasArea() {
  const { elements } = useElements();

  // Sort elements by zIndex to ensure correct rendering order
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div style={{ flex: 1, backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto' }}>
      <div style={{ border: '1px solid #d1d5db', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <Stage width={800} height={600}>
          <Layer>
            {sortedElements.map((element) => {
              if (element.type === 'rect') {
                return (
                  <Rect
                    key={element.id}
                    id={element.id}
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    height={element.height}
                    fill={element.fill}
                    rotation={element.rotation}
                    draggable={false}
                  />
                );
              }
              if (element.type === 'circle') {
                return (
                  <Circle
                    key={element.id}
                    id={element.id}
                    x={element.x}
                    y={element.y}
                    radius={element.radius}
                    fill={element.fill}
                    rotation={element.rotation}
                    draggable={false}
                  />
                );
              }
              if (element.type === 'text') {
                return (
                  <Text
                    key={element.id}
                    id={element.id}
                    x={element.x}
                    y={element.y}
                    text={element.text}
                    fontSize={element.fontSize}
                    fill={element.fill}
                    rotation={element.rotation}
                    draggable={false}
                  />
                );
              }
              return null;
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
