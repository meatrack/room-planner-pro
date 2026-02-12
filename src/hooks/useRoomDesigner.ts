import { useState, useCallback } from 'react';
import { Room, RoomShape, TextLabel, ShapeType } from '@/types/room';

const generateId = () => Math.random().toString(36).substr(2, 9);

const createDefaultRoom = (): Room => ({
  id: generateId(),
  name: 'Untitled Room',
  width: 800,
  height: 600,
  backgroundColor: '#1a1e2e',
  shapes: [],
  labels: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const useRoomDesigner = () => {
  const [room, setRoom] = useState<Room>(createDefaultRoom());
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);

  const addShape = useCallback((type: ShapeType) => {
    const shape: RoomShape = {
      id: generateId(),
      type,
      x: 100,
      y: 100,
      width: type === 'circle' ? 80 : 100,
      height: type === 'circle' ? 80 : 60,
      rotation: 0,
      color: '#2dd4bf',
      label: '',
    };
    setRoom(prev => ({ ...prev, shapes: [...prev.shapes, shape], updatedAt: Date.now() }));
    setSelectedShapeId(shape.id);
    setSelectedLabelId(null);
  }, []);

  const updateShape = useCallback((id: string, updates: Partial<RoomShape>) => {
    setRoom(prev => ({
      ...prev,
      shapes: prev.shapes.map(s => s.id === id ? { ...s, ...updates } : s),
      updatedAt: Date.now(),
    }));
  }, []);

  const deleteShape = useCallback((id: string) => {
    setRoom(prev => ({
      ...prev,
      shapes: prev.shapes.filter(s => s.id !== id),
      updatedAt: Date.now(),
    }));
    if (selectedShapeId === id) setSelectedShapeId(null);
  }, [selectedShapeId]);

  const addLabel = useCallback(() => {
    const label: TextLabel = {
      id: generateId(),
      x: 150,
      y: 150,
      text: 'Label',
      fontSize: 14,
      color: '#e2e8f0',
    };
    setRoom(prev => ({ ...prev, labels: [...prev.labels, label], updatedAt: Date.now() }));
    setSelectedLabelId(label.id);
    setSelectedShapeId(null);
  }, []);

  const updateLabel = useCallback((id: string, updates: Partial<TextLabel>) => {
    setRoom(prev => ({
      ...prev,
      labels: prev.labels.map(l => l.id === id ? { ...l, ...updates } : l),
      updatedAt: Date.now(),
    }));
  }, []);

  const deleteLabel = useCallback((id: string) => {
    setRoom(prev => ({
      ...prev,
      labels: prev.labels.filter(l => l.id !== id),
      updatedAt: Date.now(),
    }));
    if (selectedLabelId === id) setSelectedLabelId(null);
  }, [selectedLabelId]);

  const updateRoom = useCallback((updates: Partial<Room>) => {
    setRoom(prev => ({ ...prev, ...updates, updatedAt: Date.now() }));
  }, []);

  const loadRoom = useCallback((r: Room) => {
    setRoom(r);
    setSelectedShapeId(null);
    setSelectedLabelId(null);
  }, []);

  const newRoom = useCallback(() => {
    setRoom(createDefaultRoom());
    setSelectedShapeId(null);
    setSelectedLabelId(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedShapeId(null);
    setSelectedLabelId(null);
  }, []);

  const selectedShape = room.shapes.find(s => s.id === selectedShapeId) || null;
  const selectedLabel = room.labels.find(l => l.id === selectedLabelId) || null;

  return {
    room, selectedShape, selectedLabel,
    selectedShapeId, selectedLabelId,
    setSelectedShapeId, setSelectedLabelId,
    addShape, updateShape, deleteShape,
    addLabel, updateLabel, deleteLabel,
    updateRoom, loadRoom, newRoom, clearSelection,
  };
};
