import { CanvasElement } from '../types/canvas';

export type Action =
  | { type: 'ADD_ELEMENT'; element: CanvasElement }
  | { type: 'UPDATE_ELEMENT'; id: string; patch: Partial<CanvasElement> }
  | { type: 'DELETE_ELEMENT'; id: string }
  | { type: 'SET_ELEMENTS'; elements: CanvasElement[] };

export function elementsReducer(state: CanvasElement[], action: Action): CanvasElement[] {
  switch (action.type) {
    case 'ADD_ELEMENT':
      return [...state, action.element];

    case 'UPDATE_ELEMENT':
      return state.map((el) => {
        if (el.id !== action.id) return el;
        // Cast is necessary because patch can contain fields for any CanvasElement type
        return { ...el, ...action.patch } as CanvasElement;
      });

    case 'DELETE_ELEMENT':
      return state.filter((el) => el.id !== action.id);

    case 'SET_ELEMENTS':
      return action.elements;

    default:
      return state;
  }
}
