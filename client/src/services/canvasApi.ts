import axios from 'axios';
import { Canvas } from '../types/canvas';

// NEXT_PUBLIC_API_URL should be the base server URL e.g. http://localhost:5000
// We append /api/canvases so all route calls (/, /:id) resolve correctly
const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/canvases`,
});

export const createCanvas = async (name: string): Promise<Canvas> => {
  const response = await api.post<Canvas>('/', { name });
  return response.data;
};

export const listCanvases = async (): Promise<Canvas[]> => {
  const response = await api.get<Canvas[]>('/');
  return response.data;
};

export const getCanvas = async (id: string): Promise<Canvas> => {
  const response = await api.get<Canvas>(`/${id}`);
  return response.data;
};

export const updateCanvas = async (id: string, data: Partial<Canvas>): Promise<Canvas> => {
  const response = await api.put<Canvas>(`/${id}`, data);
  return response.data;
};

export const deleteCanvas = async (id: string): Promise<void> => {
  await api.delete(`/${id}`);
};
