'use client';

import React, { useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Text, Transformer } from 'react-konva';
import Konva from 'konva';
import { useElements } from '@/context/ElementsContext';

interface CanvasAreaProps {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

export default function CanvasArea({ selectedId, setSelectedId }: CanvasAreaProps) {
  const { elements, dispatch } = useElements();
  
  // Ref for the Transformer
  const transformerRef = useRef<Konva.Transformer>(null);
  
  // Ref map to store Konva nodes for each shape
  const shapeRefs = useRef(new Map<string, Konva.Node>());

  // Sort elements by zIndex to ensure correct rendering order
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  // Deselect when clicking on empty canvas
  const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // clicked on empty area (the stage itself)
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  // Wire transformer to the selected shape
  useEffect(() => {
    if (selectedId) {
      const selectedNode = shapeRefs.current.get(selectedId);
      if (selectedNode && transformerRef.current) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else {
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedId, elements]); // also depend on elements in case the selected element changes size/position from outside

  return (
    <div style={{ flex: 1, backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto' }}>
      <div style={{ border: '1px solid #d1d5db', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <Stage 
          width={800} 
          height={600}
          onMouseDown={checkDeselect}
          onTouchStart={checkDeselect}
        >
          <Layer>
            {sortedElements.map((element) => {
              const handleSelect = () => setSelectedId(element.id);
              
              const assignRef = (node: Konva.Node | null) => {
                if (node) {
                  shapeRefs.current.set(element.id, node);
                } else {
                  shapeRefs.current.delete(element.id);
                }
              };

              const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
                dispatch({
                  type: 'UPDATE_ELEMENT',
                  id: element.id,
                  patch: {
                    x: e.target.x(),
                    y: e.target.y(),
                  },
                });
              };

              const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
                const node = e.target;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();

                // Reset scale on the node, bake it into width/height/radius
                node.scaleX(1);
                node.scaleY(1);

                const patch: any = {
                  x: node.x(),
                  y: node.y(),
                  rotation: node.rotation(),
                };

                if (element.type === 'rect') {
                  patch.width = Math.max(5, element.width * scaleX);
                  patch.height = Math.max(5, element.height * scaleY);
                } else if (element.type === 'circle') {
                  patch.radius = Math.max(5, element.radius * scaleX);
                }

                dispatch({
                  type: 'UPDATE_ELEMENT',
                  id: element.id,
                  patch,
                });
              };

              if (element.type === 'rect') {
                return (
                  <Rect
                    key={element.id}
                    id={element.id}
                    ref={assignRef}
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    height={element.height}
                    fill={element.fill}
                    rotation={element.rotation}
                    draggable={true}
                    onClick={handleSelect}
                    onTap={handleSelect}
                    onDragEnd={handleDragEnd}
                    onTransformEnd={handleTransformEnd}
                  />
                );
              }
              if (element.type === 'circle') {
                return (
                  <Circle
                    key={element.id}
                    id={element.id}
                    ref={assignRef}
                    x={element.x}
                    y={element.y}
                    radius={element.radius}
                    fill={element.fill}
                    rotation={element.rotation}
                    draggable={true}
                    onClick={handleSelect}
                    onTap={handleSelect}
                    onDragEnd={handleDragEnd}
                    onTransformEnd={handleTransformEnd}
                  />
                );
              }
              if (element.type === 'text') {
                return (
                  <Text
                    key={element.id}
                    id={element.id}
                    ref={assignRef}
                    x={element.x}
                    y={element.y}
                    text={element.text}
                    fontSize={element.fontSize}
                    fill={element.fill}
                    rotation={element.rotation}
                    draggable={true}
                    onClick={handleSelect}
                    onTap={handleSelect}
                    onDragEnd={handleDragEnd}
                    onTransformEnd={handleTransformEnd}
                  />
                );
              }
              return null;
            })}
            <Transformer ref={transformerRef} />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
