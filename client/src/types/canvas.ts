export interface BaseElement {
  id: string;
  type: 'rect' | 'circle' | 'text';
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
  fill: string;
}

export interface RectElement extends BaseElement {
  type: 'rect';
  width: number;
  height: number;
}

export interface CircleElement extends BaseElement {
  type: 'circle';
  radius: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
}

export type CanvasElement = RectElement | CircleElement | TextElement;

export interface Canvas {
  _id: string;
  name: string;
  elements: CanvasElement[];
  createdAt: string;
  updatedAt: string;
}
