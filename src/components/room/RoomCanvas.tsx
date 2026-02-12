import { useRef } from 'react';
import { Room, RoomShape, TextLabel } from '@/types/room';
import { CanvasShape } from './CanvasShape';
import { CanvasLabel } from './CanvasLabel';

interface RoomCanvasProps {
  room: Room;
  selectedShapeId: string | null;
  selectedLabelId: string | null;
  onSelectShape: (id: string) => void;
  onSelectLabel: (id: string) => void;
  onUpdateShape: (id: string, updates: Partial<RoomShape>) => void;
  onUpdateLabel: (id: string, updates: Partial<TextLabel>) => void;
  onClearSelection: () => void;
  canvasRef: React.RefObject<HTMLDivElement>;
}

export const RoomCanvas = ({
  room, selectedShapeId, selectedLabelId,
  onSelectShape, onSelectLabel, onUpdateShape, onUpdateLabel,
  onClearSelection, canvasRef,
}: RoomCanvasProps) => {
  return (
    <div className="flex-1 overflow-auto bg-canvas flex items-center justify-center p-8">
      <div
        ref={canvasRef}
        className="relative grid-pattern grid-pattern-major shadow-2xl"
        style={{
          width: room.width,
          height: room.height,
          backgroundColor: room.backgroundColor,
          minWidth: room.width,
          minHeight: room.height,
        }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClearSelection();
        }}
      >
        {room.shapes.map(shape => (
          <CanvasShape
            key={shape.id}
            shape={shape}
            isSelected={shape.id === selectedShapeId}
            onSelect={() => {
              onSelectShape(shape.id);
            }}
            onUpdate={(updates) => onUpdateShape(shape.id, updates)}
          />
        ))}
        {room.labels.map(label => (
          <CanvasLabel
            key={label.id}
            label={label}
            isSelected={label.id === selectedLabelId}
            onSelect={() => {
              onSelectLabel(label.id);
            }}
            onUpdate={(updates) => onUpdateLabel(label.id, updates)}
          />
        ))}
      </div>
    </div>
  );
};
