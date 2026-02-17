export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'l-shape' | 'rounded-rect';

export type PatternType = 'none' | 'stripes' | 'dots' | 'crosshatch' | 'diagonal' | 'brick';

export type RoomShapeType = 'rectangle' | 'l-shape-tl' | 'l-shape-tr' | 'l-shape-bl' | 'l-shape-br' | 'u-shape' | 't-shape';

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
  labelColor?: string;
  pattern: PatternType;
  imagePattern?: string;
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
  gridColor: string;
  gridOpacity: number;
  shapes: RoomShape[];
  labels: TextLabel[];
  roomShape: RoomShapeType;
  cutoutXPercent: number;
  cutoutYPercent: number;
  createdAt: number;
  updatedAt: number;
}
