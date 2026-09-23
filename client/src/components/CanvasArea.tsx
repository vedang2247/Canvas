'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Circle, Text, Transformer } from 'react-konva';
import Konva from 'konva';
import { useElements } from '@/context/ElementsContext';
import { TextElement } from '@/types/canvas';

interface CanvasAreaProps {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

interface TextareaState {
  x: number;
  y: number;
  width: number;
  fontSize: number;
  fill: string;
  rotation: number;
  text: string;
  elementId: string;
}

export default function CanvasArea({ selectedId, setSelectedId }: CanvasAreaProps) {
  const { elements, dispatch } = useElements();

  // Refs
  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef(new Map<string, Konva.Node>());
  const stageRef = useRef<Konva.Stage>(null);
  // Ref to the white bordered div that wraps the <Stage>
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Text editing state — kept local since positioning depends on the stage DOM node
  const [editingState, setEditingState] = useState<TextareaState | null>(null);

  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  // ── Deselect on empty stage click ────────────────────────────────────────
  const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  // ── Wire Transformer to selected node ────────────────────────────────────
  useEffect(() => {
    if (selectedId) {
      const node = shapeRefs.current.get(selectedId);
      if (node && transformerRef.current) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else {
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedId, elements]);

  // ── Focus textarea when editing starts ───────────────────────────────────
  useEffect(() => {
    if (editingState) {
      // Small delay so the textarea is mounted before we focus
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [editingState]);

  // ── Text double-click handler ─────────────────────────────────────────────
  const handleTextDblClick = (
    e: Konva.KonvaEventObject<MouseEvent>,
    element: TextElement
  ) => {
    // Hide the Konva text node while editing
    const textNode = e.target as Konva.Text;
    const absPos = textNode.getAbsolutePosition();

    // Use node's scale-aware width (min 100px so it doesn't collapse)
    const nodeWidth = Math.max(100, textNode.width());

    setEditingState({
      elementId: element.id,
      x: absPos.x,
      y: absPos.y,
      width: nodeWidth,
      fontSize: element.fontSize,
      fill: element.fill,
      rotation: element.rotation,
      text: element.text,
    });

    // Clear transformer while editing so handles don't interfere
    if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  };

  // ── Commit text on blur ───────────────────────────────────────────────────
  const handleTextareaBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (!editingState) return;
    dispatch({
      type: 'UPDATE_ELEMENT',
      id: editingState.elementId,
      patch: { text: e.target.value },
    });
    setEditingState(null);
  };

  // Prevent accidental newline on Enter — commit instead
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setEditingState(null);
    }
  };

  // ── Shared per-element handlers ───────────────────────────────────────────
  const makeHandlers = (element: (typeof sortedElements)[number]) => {
    const handleSelect = () => setSelectedId(element.id);

    const assignRef = (node: Konva.Node | null) => {
      if (node) shapeRefs.current.set(element.id, node);
      else shapeRefs.current.delete(element.id);
    };

    const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
      dispatch({
        type: 'UPDATE_ELEMENT',
        id: element.id,
        patch: { x: e.target.x(), y: e.target.y() },
      });
    };

    const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Bake scale into geometry — reset to 1
      node.scaleX(1);
      node.scaleY(1);

      const patch: Record<string, number> = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      };

      if (element.type === 'rect') {
        patch.width = Math.max(5, (node as Konva.Rect).width() * scaleX);
        patch.height = Math.max(5, (node as Konva.Rect).height() * scaleY);
      } else if (element.type === 'circle') {
        patch.radius = Math.max(5, (node as Konva.Circle).radius() * scaleX);
      }

      dispatch({ type: 'UPDATE_ELEMENT', id: element.id, patch });
    };

    return { handleSelect, assignRef, handleDragEnd, handleTransformEnd };
  };

  return (
    // Outer flex container — fills remaining editor space
    <div style={{
      flex: 1,
      backgroundColor: '#f3f4f6',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'auto',
    }}>
      {/* Stage wrapper — position:relative so textarea overlay is positioned within it */}
      <div
        ref={stageWrapRef}
        style={{
          position: 'relative',
          border: '1px solid #d1d5db',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          background: '#ffffff',
          lineHeight: 0, // prevent extra space below canvas element
        }}
      >
        <Stage
          ref={stageRef}
          width={800}
          height={600}
          onMouseDown={checkDeselect}
          onTouchStart={checkDeselect}
        >
          <Layer>
            {sortedElements.map((element) => {
              const { handleSelect, assignRef, handleDragEnd, handleTransformEnd } =
                makeHandlers(element);

              // Hide text node while its textarea overlay is active
              const isEditing = editingState?.elementId === element.id;

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
                    draggable
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
                    draggable
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
                    // Hide the Konva node while the textarea overlay is active
                    visible={!isEditing}
                    draggable
                    onClick={handleSelect}
                    onTap={handleSelect}
                    onDragEnd={handleDragEnd}
                    onTransformEnd={handleTransformEnd}
                    onDblClick={(e) =>
                      handleTextDblClick(e, element)
                    }
                    onDblTap={(e) =>
                      handleTextDblClick(e as unknown as Konva.KonvaEventObject<MouseEvent>, element)
                    }
                  />
                );
              }

              return null;
            })}

            <Transformer ref={transformerRef} />
          </Layer>
        </Stage>

        {/* ── HTML textarea overlay ── */}
        {editingState && (
          <textarea
            ref={textareaRef}
            defaultValue={editingState.text}
            onBlur={handleTextareaBlur}
            onKeyDown={handleTextareaKeyDown}
            style={{
              position: 'absolute',
              top: editingState.y,
              left: editingState.x,
              width: editingState.width + 20, // a little breathing room
              minHeight: editingState.fontSize + 8,
              fontSize: editingState.fontSize,
              color: editingState.fill,
              transform: `rotate(${editingState.rotation}deg)`,
              transformOrigin: 'top left',
              // Match canvas aesthetic — transparent so canvas background shows through
              background: 'transparent',
              border: '1px dashed #6366f1',
              outline: 'none',
              resize: 'none',
              padding: 0,
              margin: 0,
              lineHeight: 1.2,
              fontFamily: 'inherit',
              overflow: 'hidden',
              zIndex: 100,
              // Prevent the textarea from being larger than the canvas
              maxWidth: 800 - editingState.x,
            }}
          />
        )}
      </div>
    </div>
  );
}
