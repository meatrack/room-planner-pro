export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'l-shape' | 'rounded-rect';

export type PatternType = 'none' | 'stripes' | 'dots' | 'crosshatch' | 'diagonal';

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
  labelFontSize: number;
  labelRotation: number;
  pattern: PatternType;
}

export interface TextLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  rotation: number;
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
