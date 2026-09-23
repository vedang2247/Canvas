'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { CanvasElement } from '../types/canvas';
import { elementsReducer, Action } from './elementsReducer';

interface ElementsContextType {
  elements: CanvasElement[];
  dispatch: React.Dispatch<Action>;
}

const ElementsContext = createContext<ElementsContextType | undefined>(undefined);

export function ElementsProvider({ children }: { children: ReactNode }) {
  const [elements, dispatch] = useReducer(elementsReducer, []);

  return (
    <ElementsContext.Provider value={{ elements, dispatch }}>
      {children}
    </ElementsContext.Provider>
  );
}

export function useElements() {
  const context = useContext(ElementsContext);
  if (context === undefined) {
    throw new Error('useElements must be used within an ElementsProvider');
  }
  return context;
}
