'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Circle, Text, Transformer } from 'react-konva';
import Konva from 'konva';
import { useElements } from '@/context/ElementsContext';
import { TextElement } from '@/types/canvas';

interface CanvasAreaProps {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
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

export default function CanvasArea({ selectedId, setSelectedId, stageRef }: CanvasAreaProps) {
  const { elements, dispatch } = useElements();

  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef(new Map<string, Konva.Node>());
  // Ref to the outer flex-fill container — we measure this for stage dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [editingState, setEditingState] = useState<TextareaState | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // ── Responsive Stage ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () =>
      setDimensions({ width: el.clientWidth, height: el.clientHeight });

    // Measure immediately after mount (avoids 0×0 on first render)
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  // ── Deselect on empty stage click ─────────────────────────────────────────
  const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) setSelectedId(null);
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
      transformerRef.current?.nodes([]);
      transformerRef.current?.getLayer()?.batchDraw();
    }
  }, [selectedId, elements]);

  // ── Focus textarea when editing starts ───────────────────────────────────
  useEffect(() => {
    if (editingState) setTimeout(() => textareaRef.current?.focus(), 0);
  }, [editingState]);

  // ── Text double-click ─────────────────────────────────────────────────────
  const handleTextDblClick = (
    e: Konva.KonvaEventObject<MouseEvent>,
    element: TextElement
  ) => {
    const textNode = e.target as Konva.Text;
    const absPos = textNode.getAbsolutePosition();

    setEditingState({
      elementId: element.id,
      x: absPos.x,
      y: absPos.y,
      width: Math.max(120, textNode.width()),
      fontSize: element.fontSize,
      fill: element.fill,
      rotation: element.rotation,
      text: element.text,
    });

    // Deselect so the transformer useEffect clears handles correctly
    setSelectedId(null);

    // Also imperatively clear transformer while textarea is open
    transformerRef.current?.nodes([]);
    transformerRef.current?.getLayer()?.batchDraw();
  };

  // ── Commit text on blur ───────────────────────────────────────────────────
  const commitTextEdit = (state: TextareaState) => {
    dispatch({
      type: 'UPDATE_ELEMENT',
      id: state.elementId,
      // Read from controlled state — source of truth after textarea onChange
      patch: { text: state.text },
    });
    setEditingState(null);
  };

  const handleTextareaBlur = () => {
    if (editingState) commitTextEdit(editingState);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setEditingState(null); // discard — text node retains original value
    }
    // Plain Enter commits; Shift+Enter inserts a newline
    if (e.key === 'Enter' && !e.shiftKey && editingState) {
      e.preventDefault();
      commitTextEdit(editingState);
    }
  };

  // ── Per-element event handlers ────────────────────────────────────────────
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
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative', // textarea overlay anchors to this
        overflow: 'hidden',
        background: '#f1f3f7',
        // Subtle grid background
        backgroundImage:
          'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={checkDeselect}
        onTouchStart={checkDeselect}
      >
        <Layer>
          {sortedElements.map((element) => {
            const { handleSelect, assignRef, handleDragEnd, handleTransformEnd } =
              makeHandlers(element);
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
                  shadowBlur={selectedId === element.id ? 8 : 0}
                  shadowColor="rgba(99,102,241,0.4)"
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
                  shadowBlur={selectedId === element.id ? 8 : 0}
                  shadowColor="rgba(99,102,241,0.4)"
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
                  visible={!isEditing}
                  draggable
                  onClick={handleSelect}
                  onTap={handleSelect}
                  onDragEnd={handleDragEnd}
                  onTransformEnd={handleTransformEnd}
                  onDblClick={(e) => handleTextDblClick(e, element)}
                  onDblTap={(e) =>
                    handleTextDblClick(
                      e as unknown as Konva.KonvaEventObject<MouseEvent>,
                      element
                    )
                  }
                />
              );
            }

            return null;
          })}

          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) =>
              newBox.width < 5 || newBox.height < 5 ? oldBox : newBox
            }
          />
        </Layer>
      </Stage>

      {/* ── HTML textarea overlay for text editing ── */}
      {editingState && (
        <textarea
          ref={textareaRef}
          // Use value + onChange (controlled) so the committed value is always
          // what's in editingState, not a stale DOM snapshot.
          value={editingState.text}
          onChange={(e) =>
            setEditingState((prev) => prev ? { ...prev, text: e.target.value } : null)
          }
          onBlur={handleTextareaBlur}
          onKeyDown={handleTextareaKeyDown}
          style={{
            position: 'absolute',
            top: editingState.y,
            left: editingState.x,
            width: editingState.width + 24,
            minHeight: editingState.fontSize * 1.4,
            fontSize: editingState.fontSize,
            color: editingState.fill,
            transform: `rotate(${editingState.rotation}deg)`,
            transformOrigin: 'top left',
            background: 'rgba(255,255,255,0.92)',
            border: '2px solid var(--accent)',
            borderRadius: '4px',
            outline: 'none',
            resize: 'none',
            padding: '2px 4px',
            margin: 0,
            lineHeight: 1.2,
            fontFamily: 'var(--font)',
            overflow: 'hidden',
            zIndex: 100,
            maxWidth: dimensions.width - editingState.x - 8,
            boxShadow: '0 2px 12px rgba(99,102,241,0.2)',
          }}
        />
      )}
    </div>
  );
}
