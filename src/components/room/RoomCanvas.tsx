import { Room, RoomShape, TextLabel, RoomShapeType } from '@/types/room';
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

const getClipPath = (shape: RoomShapeType): string | undefined => {
  switch (shape) {
    case 'l-shape-tl':
      return 'polygon(0% 0%, 50% 0%, 50% 50%, 100% 50%, 100% 100%, 0% 100%)';
    case 'l-shape-tr':
      return 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 100%, 50% 50%, 0% 50%)';
    case 'l-shape-bl':
      return 'polygon(0% 0%, 100% 0%, 100% 50%, 50% 50%, 50% 100%, 0% 100%)';
    case 'l-shape-br':
      return 'polygon(50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 50%, 50% 50%)';
    case 'u-shape':
      return 'polygon(0% 0%, 30% 0%, 30% 60%, 70% 60%, 70% 0%, 100% 0%, 100% 100%, 0% 100%)';
    case 't-shape':
      return 'polygon(0% 0%, 100% 0%, 100% 40%, 70% 40%, 70% 100%, 30% 100%, 30% 40%, 0% 40%)';
    default:
      return undefined;
  }
};

export const RoomCanvas = ({
  room, selectedShapeId, selectedLabelId,
  onSelectShape, onSelectLabel, onUpdateShape, onUpdateLabel,
  onClearSelection, canvasRef,
}: RoomCanvasProps) => {
  const clipPath = getClipPath(room.roomShape || 'rectangle');

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
          clipPath,
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
