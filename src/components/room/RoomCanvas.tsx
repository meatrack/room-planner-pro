import { useState, useCallback, useEffect, useRef } from 'react';
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
  onUpdateRoom: (updates: Partial<Room>) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
}

type ResizeEdge = 'right' | 'bottom' | 'corner' | null;

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
  onClearSelection, onUpdateRoom, canvasRef,
}: RoomCanvasProps) => {
  const clipPath = getClipPath(room.roomShape || 'rectangle');
  const [resizeEdge, setResizeEdge] = useState<ResizeEdge>(null);
  const startPos = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const handleResizeStart = useCallback((edge: ResizeEdge, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setResizeEdge(edge);
    startPos.current = { x: e.clientX, y: e.clientY, w: room.width, h: room.height };
  }, [room.width, room.height]);

  useEffect(() => {
    if (!resizeEdge) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      const updates: Partial<Room> = {};
      if (resizeEdge === 'right' || resizeEdge === 'corner') {
        updates.width = Math.max(200, startPos.current.w + dx);
      }
      if (resizeEdge === 'bottom' || resizeEdge === 'corner') {
        updates.height = Math.max(200, startPos.current.h + dy);
      }
      onUpdateRoom(updates);
    };
    const onUp = () => setResizeEdge(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [resizeEdge, onUpdateRoom]);

  return (
    <div className="flex-1 overflow-auto bg-canvas flex items-center justify-center p-8">
      <div className="relative" style={{ width: room.width, height: room.height, minWidth: room.width, minHeight: room.height }}>
        <div
          ref={canvasRef}
          className="absolute inset-0 grid-pattern grid-pattern-major shadow-2xl"
          style={{
            backgroundColor: room.backgroundColor,
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
              onSelect={() => onSelectShape(shape.id)}
              onUpdate={(updates) => onUpdateShape(shape.id, updates)}
            />
          ))}
          {room.labels.map(label => (
            <CanvasLabel
              key={label.id}
              label={label}
              isSelected={label.id === selectedLabelId}
              onSelect={() => onSelectLabel(label.id)}
              onUpdate={(updates) => onUpdateLabel(label.id, updates)}
            />
          ))}
        </div>
        {/* Right edge handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -right-2 w-1.5 h-10 rounded-full bg-primary/60 hover:bg-primary cursor-ew-resize"
          onMouseDown={(e) => handleResizeStart('right', e)}
        />
        {/* Bottom edge handle */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-2 h-1.5 w-10 rounded-full bg-primary/60 hover:bg-primary cursor-ns-resize"
          onMouseDown={(e) => handleResizeStart('bottom', e)}
        />
        {/* Corner handle */}
        <div
          className="absolute -bottom-2.5 -right-2.5 w-4 h-4 rounded-full bg-primary/80 hover:bg-primary cursor-nwse-resize border-2 border-background"
          onMouseDown={(e) => handleResizeStart('corner', e)}
        />
      </div>
    </div>
  );
};
