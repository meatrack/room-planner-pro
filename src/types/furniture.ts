import { RoomShape } from './room';

export interface FurnitureItem {
  id: string;
  name: string;
  shape: Omit<RoomShape, 'id' | 'x' | 'y'>;
}

export interface FurnitureTemplate {
  id: string;
  name: string;
  items: FurnitureItem[];
  createdAt: number;
}
