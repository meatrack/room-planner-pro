export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'l-shape';

export interface RoomShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  label: string;
}

export interface TextLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
}

export interface Room {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  shapes: RoomShape[];
  labels: TextLabel[];
  createdAt: number;
  updatedAt: number;
}
