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

type ResizeEdge = 'right' | 'bottom' | 'corner' | 'left' | 'top' | 'corner-tl' | 'corner-bl' | 'corner-tr' | 'inner-v' | 'inner-h' | null;

const getClipPath = (shape: RoomShapeType, cx: number, cy: number): string | undefined => {
  const x = cx;
  const y = cy;
  switch (shape) {
    case 'l-shape-tl':
      return `polygon(0% 0%, ${x}% 0%, ${x}% ${y}%, 100% ${y}%, 100% 100%, 0% 100%)`;
    case 'l-shape-tr':
      return `polygon(0% 0%, 100% 0%, 100% 100%, ${100 - x}% 100%, ${100 - x}% ${y}%, 0% ${y}%)`;
    case 'l-shape-bl':
      return `polygon(0% 0%, 100% 0%, 100% ${100 - y}%, ${x}% ${100 - y}%, ${x}% 100%, 0% 100%)`;
    case 'l-shape-br':
      return `polygon(${100 - x}% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${100 - y}%, ${100 - x}% ${100 - y}%)`;
    case 'u-shape':
      return 'polygon(0% 0%, 30% 0%, 30% 60%, 70% 60%, 70% 0%, 100% 0%, 100% 100%, 0% 100%)';
    case 't-shape':
      return 'polygon(0% 0%, 100% 0%, 100% 40%, 70% 40%, 70% 100%, 30% 100%, 30% 40%, 0% 40%)';
    default:
      return undefined;
  }
};

const getInnerHandles = (shape: RoomShapeType, cx: number, cy: number): { h?: { left: string; top: string }; v?: { left: string; top: string } } | null => {
  switch (shape) {
    case 'l-shape-tl':
      return {
        v: { left: `${cx}%`, top: `${cy / 2}%` },
        h: { left: `${cx + (100 - cx) / 2}%`, top: `${cy}%` },
      };
    case 'l-shape-tr':
      return {
        h: { left: `${(100 - cx) / 2}%`, top: `${cy}%` },
        v: { left: `${100 - cx}%`, top: `${cy + (100 - cy) / 2}%` },
      };
    case 'l-shape-bl':
      return {
        h: { left: `${cx + (100 - cx) / 2}%`, top: `${100 - cy}%` },
        v: { left: `${cx}%`, top: `${(100 - cy) + cy / 2}%` },
      };
    case 'l-shape-br':
      return {
        v: { left: `${100 - cx}%`, top: `${(100 - cy) / 2}%` },
        h: { left: `${(100 - cx) / 2}%`, top: `${100 - cy}%` },
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
  const clipPath = getClipPath(room.roomShape || 'rectangle', room.cutoutXPercent ?? 50, room.cutoutYPercent ?? 50);
  const innerHandles = getInnerHandles(room.roomShape || 'rectangle', room.cutoutXPercent ?? 50, room.cutoutYPercent ?? 50);
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

      if (resizeEdge === 'inner-v') {
        // Dragging the vertical inner edge changes cutoutXPercent
        const pctDelta = (dx / startPos.current.w) * 100;
        const shape = room.roomShape;
        let newPct: number;
        if (shape === 'l-shape-tl' || shape === 'l-shape-bl') {
          newPct = Math.min(80, Math.max(20, (room.cutoutXPercent ?? 50) + pctDelta));
        } else {
          newPct = Math.min(80, Math.max(20, (room.cutoutXPercent ?? 50) - pctDelta));
        }
        updates.cutoutXPercent = newPct;
        startPos.current.x = e.clientX;
      } else if (resizeEdge === 'inner-h') {
        // Dragging the horizontal inner edge changes cutoutYPercent
        const pctDelta = (dy / startPos.current.h) * 100;
        const shape = room.roomShape;
        let newPct: number;
        if (shape === 'l-shape-tl' || shape === 'l-shape-tr') {
          newPct = Math.min(80, Math.max(20, (room.cutoutYPercent ?? 50) + pctDelta));
        } else {
          newPct = Math.min(80, Math.max(20, (room.cutoutYPercent ?? 50) - pctDelta));
        }
        updates.cutoutYPercent = newPct;
        startPos.current.y = e.clientY;
      } else {
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
      }
      onUpdateRoom(updates);
    };
    const onUp = () => setResizeEdge(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [resizeEdge, onUpdateRoom, room.roomShape, room.cutoutXPercent, room.cutoutYPercent]);

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
              onMouseDown={(e) => handleResizeStart('inner-v', e)}
            />
          )}
          {innerHandles?.h && (
            <div
              className="absolute h-1 w-6 rounded-full bg-primary cursor-ns-resize -translate-x-1/2 -translate-y-1/2"
              style={{ left: innerHandles.h.left, top: innerHandles.h.top }}
              onMouseDown={(e) => handleResizeStart('inner-h', e)}
            />
          )}
      </div>
    </div>
  );
};
