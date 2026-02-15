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

type ResizeEdge = 'right' | 'bottom' | 'corner' | 'left' | 'top' | 'corner-tl' | 'corner-bl' | 'corner-tr' | null;

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

// Returns inner-edge handle positions for L-shaped rooms (percentage-based)
const getInnerHandles = (shape: RoomShapeType): { h?: { left: string; top: string }; v?: { left: string; top: string } } | null => {
  switch (shape) {
    case 'l-shape-tl':
      // Cutout top-right, inner corner at (50%, 50%)
      return {
        v: { left: '50%', top: '25%' },  // vertical edge x=50%, y=0→50%
        h: { left: '75%', top: '50%' },  // horizontal edge y=50%, x=50%→100%
      };
    case 'l-shape-tr':
      // Cutout top-left, inner corner at (50%, 50%)
      return {
        h: { left: '25%', top: '50%' },  // horizontal edge y=50%, x=0→50%
        v: { left: '50%', top: '75%' },  // vertical edge x=50%, y=50%→100%
      };
    case 'l-shape-bl':
      // Cutout bottom-right, inner corner at (50%, 50%)
      return {
        h: { left: '75%', top: '50%' },  // horizontal edge y=50%, x=50%→100%
        v: { left: '50%', top: '75%' },  // vertical edge x=50%, y=50%→100%
      };
    case 'l-shape-br':
      // Cutout bottom-left, inner corner at (50%, 50%)
      return {
        v: { left: '50%', top: '25%' },  // vertical edge x=50%, y=0→50%
        h: { left: '25%', top: '50%' },  // horizontal edge y=50%, x=0→50%
      };
    default:
      return null;
  }
};

export const RoomCanvas = ({
  room, selectedShapeId, selectedLabelId,
  onSelectShape, onSelectLabel, onUpdateShape, onUpdateLabel,
  onClearSelection, onUpdateRoom, canvasRef,
}: RoomCanvasProps) => {
  const clipPath = getClipPath(room.roomShape || 'rectangle');
  const innerHandles = getInnerHandles(room.roomShape || 'rectangle');
  const [resizeEdge, setResizeEdge] = useState<ResizeEdge>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0, w: 0, h: 0, ox: 0, oy: 0 });

  const handleResizeStart = useCallback((edge: ResizeEdge, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setResizeEdge(edge);
    startPos.current = { x: e.clientX, y: e.clientY, w: room.width, h: room.height, ox: offset.x, oy: offset.y };
  }, [room.width, room.height]);

  useEffect(() => {
    if (!resizeEdge) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      const updates: Partial<Room> = {};
      const newOffset = { x: offset.x, y: offset.y };
      if (resizeEdge === 'right' || resizeEdge === 'corner' || resizeEdge === 'corner-tr') {
        updates.width = Math.max(200, startPos.current.w + dx);
      }
      if (resizeEdge === 'bottom' || resizeEdge === 'corner' || resizeEdge === 'corner-bl') {
        updates.height = Math.max(200, startPos.current.h + dy);
      }
      if (resizeEdge === 'left' || resizeEdge === 'corner-tl' || resizeEdge === 'corner-bl') {
        const newW = Math.max(200, startPos.current.w - dx);
        updates.width = newW;
        newOffset.x = startPos.current.ox + (startPos.current.w - newW);
      }
      if (resizeEdge === 'top' || resizeEdge === 'corner-tl' || resizeEdge === 'corner-tr') {
        const newH = Math.max(200, startPos.current.h - dy);
        updates.height = newH;
        newOffset.y = startPos.current.oy + (startPos.current.h - newH);
      }
      setOffset(newOffset);
      onUpdateRoom(updates);
    };
    const onUp = () => setResizeEdge(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [resizeEdge, onUpdateRoom]);

  return (
    <div className="flex-1 overflow-auto bg-canvas flex items-center justify-center p-8">
        <div className="relative" style={{ width: room.width, height: room.height, minWidth: room.width, minHeight: room.height, transform: `translate(${offset.x}px, ${offset.y}px)` }}>
          {/* Room border outline */}
          <div className="absolute inset-0 border border-primary/50 pointer-events-none" style={{ clipPath }} />
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
          {/* Edge handles - pill shaped */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -left-1 w-1 h-6 rounded-full bg-primary cursor-ew-resize"
            onMouseDown={(e) => handleResizeStart('left', e)}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -right-1 w-1 h-6 rounded-full bg-primary cursor-ew-resize"
            onMouseDown={(e) => handleResizeStart('right', e)}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 -top-1 h-1 w-6 rounded-full bg-primary cursor-ns-resize"
            onMouseDown={(e) => handleResizeStart('top', e)}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-1 h-1 w-6 rounded-full bg-primary cursor-ns-resize"
            onMouseDown={(e) => handleResizeStart('bottom', e)}
          />
          {/* Corner handles - circles */}
          <div
            className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-primary cursor-nwse-resize"
            onMouseDown={(e) => handleResizeStart('corner-tl', e)}
          />
          <div
            className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-primary cursor-nesw-resize"
            onMouseDown={(e) => handleResizeStart('corner-tr', e)}
          />
          <div
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-primary cursor-nesw-resize"
            onMouseDown={(e) => handleResizeStart('corner-bl', e)}
          />
          <div
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-primary cursor-nwse-resize"
            onMouseDown={(e) => handleResizeStart('corner', e)}
          />
          {/* Inner edge handles for L-shapes */}
          {innerHandles?.v && (
            <div
              className="absolute w-1 h-6 rounded-full bg-primary cursor-ew-resize -translate-x-1/2 -translate-y-1/2"
              style={{ left: innerHandles.v.left, top: innerHandles.v.top }}
            />
          )}
          {innerHandles?.h && (
            <div
              className="absolute h-1 w-6 rounded-full bg-primary cursor-ns-resize -translate-x-1/2 -translate-y-1/2"
              style={{ left: innerHandles.h.left, top: innerHandles.h.top }}
            />
          )}
      </div>
    </div>
  );
};
