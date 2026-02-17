import { useState, useCallback, useEffect, useRef } from 'react';
import { Room, RoomShape, TextLabel, RoomShapeType, PatternType } from '@/types/room';
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

const WallPatternDefs = ({ id, pattern, color }: { id: string; pattern: PatternType; color: string }) => {
  if (pattern === 'none') return null;
  const defs: Record<string, JSX.Element> = {
    stripes: <pattern id={id} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)"><rect width="8" height="8" fill={color} /><line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.2)" strokeWidth="2" /></pattern>,
    dots: <pattern id={id} patternUnits="userSpaceOnUse" width="10" height="10"><rect width="10" height="10" fill={color} /><circle cx="5" cy="5" r="1.5" fill="rgba(255,255,255,0.25)" /></pattern>,
    crosshatch: <pattern id={id} patternUnits="userSpaceOnUse" width="8" height="8"><rect width="8" height="8" fill={color} /><path d="M0,0 L8,8 M8,0 L0,8" stroke="rgba(255,255,255,0.15)" strokeWidth="1" /></pattern>,
    diagonal: <pattern id={id} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(-45)"><rect width="6" height="6" fill={color} /><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" /></pattern>,
    brick: <pattern id={id} patternUnits="userSpaceOnUse" width="24" height="12"><rect width="24" height="12" fill={color} /><line x1="0" y1="6" x2="24" y2="6" stroke="rgba(0,0,0,0.3)" strokeWidth="1" /><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0,0,0,0.3)" strokeWidth="1" /><line x1="12" y1="0" x2="12" y2="6" stroke="rgba(0,0,0,0.3)" strokeWidth="1" /><line x1="6" y1="6" x2="6" y2="12" stroke="rgba(0,0,0,0.3)" strokeWidth="1" /><line x1="18" y1="6" x2="18" y2="12" stroke="rgba(0,0,0,0.3)" strokeWidth="1" /></pattern>,
    wood: <pattern id={id} patternUnits="userSpaceOnUse" width="40" height="40"><rect width="40" height="40" fill={color} /><line x1="0" y1="5" x2="40" y2="5" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" /><line x1="0" y1="12" x2="40" y2="13" stroke="rgba(0,0,0,0.08)" strokeWidth="1" /><line x1="0" y1="20" x2="40" y2="19" stroke="rgba(0,0,0,0.1)" strokeWidth="1.2" /><line x1="0" y1="27" x2="40" y2="28" stroke="rgba(0,0,0,0.07)" strokeWidth="0.8" /><line x1="0" y1="34" x2="40" y2="34" stroke="rgba(0,0,0,0.11)" strokeWidth="1" /></pattern>,
    cloth: <pattern id={id} patternUnits="userSpaceOnUse" width="10" height="10"><rect width="10" height="10" fill={color} /><rect x="0" y="0" width="5" height="5" fill="rgba(255,255,255,0.06)" /><rect x="5" y="5" width="5" height="5" fill="rgba(255,255,255,0.06)" /><line x1="0" y1="0" x2="10" y2="0" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" /><line x1="0" y1="5" x2="10" y2="5" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" /></pattern>,
    metal: <pattern id={id} patternUnits="userSpaceOnUse" width="20" height="20"><rect width="20" height="20" fill={color} /><line x1="0" y1="2" x2="20" y2="2" stroke="rgba(255,255,255,0.08)" strokeWidth="1" /><line x1="0" y1="10" x2="20" y2="10" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" /><line x1="0" y1="18" x2="20" y2="18" stroke="rgba(255,255,255,0.07)" strokeWidth="0.6" /></pattern>,
  };
  return <defs>{defs[pattern]}</defs>;
};

const WallOverlay = ({ width, height, thickness, color, pattern, clipPath }: { width: number; height: number; thickness: number; color: string; pattern: PatternType; clipPath?: string }) => {
  const t = thickness;
  const patternId = 'wall-pattern';
  const hasPattern = pattern !== 'none';
  const fill = hasPattern ? `url(#${patternId})` : color;
  // Create a path that is the outer rect minus the inner rect (wall frame)
  const outerPath = `M0,0 L${width},0 L${width},${height} L0,${height} Z`;
  const innerPath = `M${t},${t} L${t},${height - t} L${width - t},${height - t} L${width - t},${t} Z`;
  return (
    <svg className="absolute inset-0 pointer-events-none" width={width} height={height} style={{ clipPath }}>
      {hasPattern && <WallPatternDefs id={patternId} pattern={pattern} color={color} />}
      <path d={`${outerPath} ${innerPath}`} fill={fill} fillRule="evenodd" />
    </svg>
  );
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
          {/* Wall rendering */}
          {(room.wallThickness || 0) > 0 && (
            <WallOverlay
              width={room.width}
              height={room.height}
              thickness={room.wallThickness}
              color={room.wallColor || '#4a5568'}
              pattern={room.wallPattern || 'none'}
              clipPath={clipPath}
            />
          )}
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
      <div className="absolute bottom-4 right-4 flex items-center gap-3">
        <span className="text-[10px] text-muted-foreground bg-card/50 px-2 py-1 rounded border border-border/50 backdrop-blur-sm hidden md:block">
          Ctrl + Scroll to zoom
        </span>
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 shadow-lg">
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
    </div>
  );
};
