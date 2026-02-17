import { useState, useCallback, useEffect, useRef } from 'react';
import { Room, RoomShape, TextLabel, RoomShapeType } from '@/types/room';
import { CanvasShape } from './CanvasShape';
import { CanvasLabel } from './CanvasLabel';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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

interface InnerHandle {
  type: 'inner-v' | 'inner-h';
  left: string;
  top: string;
  direction: 1 | -1; // +1: drag right/down increases cutout%, -1: decreases
}

const getClipPath = (shape: RoomShapeType, cx: number, cy: number): string | undefined => {
  switch (shape) {
    case 'l-shape-tl':
      return `polygon(0% 0%, ${cx}% 0%, ${cx}% ${cy}%, 100% ${cy}%, 100% 100%, 0% 100%)`;
    case 'l-shape-tr':
      return `polygon(0% 0%, 100% 0%, 100% 100%, ${100 - cx}% 100%, ${100 - cx}% ${cy}%, 0% ${cy}%)`;
    case 'l-shape-bl':
      return `polygon(0% 0%, 100% 0%, 100% ${100 - cy}%, ${cx}% ${100 - cy}%, ${cx}% 100%, 0% 100%)`;
    case 'l-shape-br':
      return `polygon(${100 - cx}% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${100 - cy}%, ${100 - cx}% ${100 - cy}%)`;
    case 'u-shape':
      return `polygon(0% 0%, ${cx}% 0%, ${cx}% ${cy}%, ${100 - cx}% ${cy}%, ${100 - cx}% 0%, 100% 0%, 100% 100%, 0% 100%)`;
    case 't-shape':
      return `polygon(0% 0%, 100% 0%, 100% ${cy}%, ${100 - cx}% ${cy}%, ${100 - cx}% 100%, ${cx}% 100%, ${cx}% ${cy}%, 0% ${cy}%)`;
    default:
      return undefined;
  }
};

const getInnerHandles = (shape: RoomShapeType, cx: number, cy: number): InnerHandle[] => {
  switch (shape) {
    case 'l-shape-tl':
      return [
        { type: 'inner-v', left: `${cx}%`, top: `${cy / 2}%`, direction: 1 },
        { type: 'inner-h', left: `${cx + (100 - cx) / 2}%`, top: `${cy}%`, direction: 1 },
      ];
    case 'l-shape-tr':
      return [
        { type: 'inner-h', left: `${(100 - cx) / 2}%`, top: `${cy}%`, direction: 1 },
        { type: 'inner-v', left: `${100 - cx}%`, top: `${cy + (100 - cy) / 2}%`, direction: -1 },
      ];
    case 'l-shape-bl':
      return [
        { type: 'inner-h', left: `${cx + (100 - cx) / 2}%`, top: `${100 - cy}%`, direction: -1 },
        { type: 'inner-v', left: `${cx}%`, top: `${(100 - cy) + cy / 2}%`, direction: 1 },
      ];
    case 'l-shape-br':
      return [
        { type: 'inner-v', left: `${100 - cx}%`, top: `${(100 - cy) / 2}%`, direction: -1 },
        { type: 'inner-h', left: `${(100 - cx) / 2}%`, top: `${100 - cy}%`, direction: -1 },
      ];
    case 'u-shape':
      return [
        { type: 'inner-v', left: `${cx}%`, top: `${cy / 2}%`, direction: 1 },
        { type: 'inner-v', left: `${100 - cx}%`, top: `${cy / 2}%`, direction: -1 },
        { type: 'inner-h', left: '50%', top: `${cy}%`, direction: 1 },
      ];
    case 't-shape':
      return [
        { type: 'inner-v', left: `${cx}%`, top: `${cy + (100 - cy) / 2}%`, direction: 1 },
        { type: 'inner-v', left: `${100 - cx}%`, top: `${cy + (100 - cy) / 2}%`, direction: -1 },
        { type: 'inner-h', left: `${cx / 2}%`, top: `${cy}%`, direction: 1 },
        { type: 'inner-h', left: `${100 - cx / 2}%`, top: `${cy}%`, direction: 1 },
      ];
    default:
      return [];
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
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0, w: 0, h: 0, ox: 0, oy: 0 });
  const innerDirRef = useRef<1 | -1>(1);

  const applyZoom = useCallback((newZoom: number, originX?: number, originY?: number) => {
    const clamped = Math.min(3, Math.max(0.25, newZoom));
    if (containerRef.current && originX !== undefined && originY !== undefined) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const mouseX = originX - rect.left + container.scrollLeft;
      const mouseY = originY - rect.top + container.scrollTop;
      const scale = clamped / zoom;
      const newScrollLeft = mouseX * scale - (originX - rect.left);
      const newScrollTop = mouseY * scale - (originY - rect.top);
      setZoom(clamped);
      requestAnimationFrame(() => {
        container.scrollLeft = newScrollLeft;
        container.scrollTop = newScrollTop;
      });
    } else {
      setZoom(clamped);
    }
  }, [zoom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        applyZoom(zoom + delta, e.clientX, e.clientY);
      }
    };
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [zoom, applyZoom]);

  const handleResizeStart = useCallback((edge: ResizeEdge, e: React.MouseEvent, direction?: 1 | -1) => {
    e.stopPropagation();
    e.preventDefault();
    setResizeEdge(edge);
    if (direction) innerDirRef.current = direction;
    startPos.current = { x: e.clientX, y: e.clientY, w: room.width, h: room.height, ox: offset.x, oy: offset.y };
  }, [room.width, room.height, offset.x, offset.y]);

  useEffect(() => {
    if (!resizeEdge) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      const updates: Partial<Room> = {};
      const newOffset = { x: offset.x, y: offset.y };

      if (resizeEdge === 'inner-v') {
        const pctDelta = (dx / startPos.current.w) * 100 * innerDirRef.current;
        updates.cutoutXPercent = Math.min(80, Math.max(20, (room.cutoutXPercent ?? 50) + pctDelta));
        startPos.current.x = e.clientX;
      } else if (resizeEdge === 'inner-h') {
        const pctDelta = (dy / startPos.current.h) * 100 * innerDirRef.current;
        updates.cutoutYPercent = Math.min(80, Math.max(20, (room.cutoutYPercent ?? 50) + pctDelta));
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

  const gridColor = room.gridColor || '#1e2a3a';
  const gridOpacity = (room.gridOpacity ?? 100) / 100;
  const gridMinor = `rgba(${parseInt(gridColor.slice(1,3),16)},${parseInt(gridColor.slice(3,5),16)},${parseInt(gridColor.slice(5,7),16)},${gridOpacity})`;
  const gridMajor = `rgba(${parseInt(gridColor.slice(1,3),16)},${parseInt(gridColor.slice(3,5),16)},${parseInt(gridColor.slice(5,7),16)},${Math.min(1, gridOpacity * 1.4)})`;

  return (
    <div className="relative flex-1 overflow-hidden">
      <div ref={containerRef} className="absolute inset-0 overflow-auto bg-canvas flex items-center justify-center p-8">
        <div className="relative" style={{ width: room.width * zoom, height: room.height * zoom, minWidth: room.width * zoom, minHeight: room.height * zoom, transform: `translate(${offset.x * zoom}px, ${offset.y * zoom}px)` }}>
          <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: room.width, height: room.height }}>
          {/* Room border outline */}
          <div className="absolute inset-0 border border-primary/50 pointer-events-none" style={{ clipPath }} />
          <div
            ref={canvasRef}
            className="absolute inset-0 shadow-2xl"
            style={{
              backgroundColor: room.backgroundColor,
              clipPath,
              backgroundImage: `
                linear-gradient(${gridMinor} 1px, transparent 1px),
                linear-gradient(90deg, ${gridMinor} 1px, transparent 1px),
                linear-gradient(${gridMajor} 1px, transparent 1px),
                linear-gradient(90deg, ${gridMajor} 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px, 20px 20px, 100px 100px, 100px 100px',
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
          {/* Inner edge handles */}
          {innerHandles.map((handle, i) => (
            <div
              key={i}
              className={`absolute rounded-full bg-primary -translate-x-1/2 -translate-y-1/2 ${
                handle.type === 'inner-v' ? 'w-1 h-6 cursor-ew-resize' : 'h-1 w-6 cursor-ns-resize'
              }`}
              style={{ left: handle.left, top: handle.top }}
              onMouseDown={(e) => handleResizeStart(handle.type, e, handle.direction)}
            />
          ))}
          </div>
        </div>
      </div>
      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-card border border-border rounded-lg p-1 shadow-lg">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => applyZoom(zoom - 0.1)}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>
        <span className="text-xs text-muted-foreground w-12 text-center font-mono">{Math.round(zoom * 100)}%</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => applyZoom(zoom + 0.1)}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setZoom(1)}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset Zoom</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
