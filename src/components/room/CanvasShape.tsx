import { useState, useRef, useCallback, useEffect } from 'react';
import { RoomShape, PatternType } from '@/types/room';
import { RotateCw } from 'lucide-react';

interface CanvasShapeProps {
  shape: RoomShape;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<RoomShape>) => void;
}

const PatternDefs = ({ id, pattern, color, width, height, imagePattern }: { id: string; pattern: PatternType; color: string; width: number; height: number; imagePattern?: string }) => {
  if (pattern === 'none' && !imagePattern) return null;

  if (imagePattern) {
    return (
      <defs>
        <pattern id={id} patternUnits="userSpaceOnUse" width={width} height={height}>
          <image href={imagePattern} width={width} height={height} preserveAspectRatio="xMidYMid slice" />
        </pattern>
      </defs>
    );
  }

  return (
    <defs>
      {pattern === 'stripes' && (
        <pattern id={id} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
          <rect width="8" height="8" fill={color} />
          <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        </pattern>
      )}
      {pattern === 'dots' && (
        <pattern id={id} patternUnits="userSpaceOnUse" width="10" height="10">
          <rect width="10" height="10" fill={color} />
          <circle cx="5" cy="5" r="1.5" fill="rgba(255,255,255,0.25)" />
        </pattern>
      )}
      {pattern === 'crosshatch' && (
        <pattern id={id} patternUnits="userSpaceOnUse" width="8" height="8">
          <rect width="8" height="8" fill={color} />
          <path d="M0,0 L8,8 M8,0 L0,8" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        </pattern>
      )}
      {pattern === 'diagonal' && (
        <pattern id={id} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(-45)">
          <rect width="6" height="6" fill={color} />
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        </pattern>
      )}
      {pattern === 'brick' && (
        <pattern id={id} patternUnits="userSpaceOnUse" width="24" height="12">
          <rect width="24" height="12" fill={color} />
          <line x1="0" y1="6" x2="24" y2="6" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
          <line x1="12" y1="0" x2="12" y2="6" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
          <line x1="24" y1="0" x2="24" y2="6" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
          <line x1="6" y1="6" x2="6" y2="12" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
          <line x1="18" y1="6" x2="18" y2="12" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
        </pattern>
      )}
    </defs>
  );
};

type ResizeEdge = 'right' | 'bottom' | 'left' | 'top' | 'corner-br' | 'corner-tl' | 'corner-bl' | 'corner-tr' | null;

export const CanvasShape = ({ shape, isSelected, onSelect, onUpdate }: CanvasShapeProps) => {
  const [dragging, setDragging] = useState(false);
  const [resizeEdge, setResizeEdge] = useState<ResizeEdge>(null);
  const [rotating, setRotating] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, sx: 0, sy: 0 });
  const shapeRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setDragging(true);
    dragOffset.current = { x: e.clientX - shape.x, y: e.clientY - shape.y };
  }, [shape.x, shape.y, onSelect]);

  const handleResizeStart = useCallback((edge: ResizeEdge, e: React.MouseEvent) => {
    e.stopPropagation();
    setResizeEdge(edge);
    resizeStart.current = { x: e.clientX, y: e.clientY, w: shape.width, h: shape.height, sx: shape.x, sy: shape.y };
  }, [shape.width, shape.height, shape.x, shape.y]);

  const handleRotateStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setRotating(true);
  }, []);

  useEffect(() => {
    if (!dragging && !resizeEdge && !rotating) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        onUpdate({
          x: Math.round((e.clientX - dragOffset.current.x) / 10) * 10,
          y: Math.round((e.clientY - dragOffset.current.y) / 10) * 10,
        });
      } else if (resizeEdge) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        const updates: Partial<RoomShape> = {};
        if (resizeEdge === 'right' || resizeEdge === 'corner-br' || resizeEdge === 'corner-tr') {
          updates.width = Math.max(20, resizeStart.current.w + dx);
        }
        if (resizeEdge === 'bottom' || resizeEdge === 'corner-br' || resizeEdge === 'corner-bl') {
          updates.height = Math.max(20, resizeStart.current.h + dy);
        }
        if (resizeEdge === 'left' || resizeEdge === 'corner-tl' || resizeEdge === 'corner-bl') {
          const newW = Math.max(20, resizeStart.current.w - dx);
          updates.width = newW;
          updates.x = resizeStart.current.sx + (resizeStart.current.w - newW);
        }
        if (resizeEdge === 'top' || resizeEdge === 'corner-tl' || resizeEdge === 'corner-tr') {
          const newH = Math.max(20, resizeStart.current.h - dy);
          updates.height = newH;
          updates.y = resizeStart.current.sy + (resizeStart.current.h - newH);
        }
        onUpdate(updates);
      } else if (rotating && shapeRef.current) {
        const rect = shapeRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI) + 90;
        onUpdate({ rotation: Math.round(angle / 15) * 15 });
      }
    };

    const handleMouseUp = () => {
      setDragging(false);
      setResizeEdge(null);
      setRotating(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, resizeEdge, rotating, onUpdate]);

  const shapeStyle: React.CSSProperties = {
    position: 'absolute',
    left: shape.x,
    top: shape.y,
    width: shape.width,
    height: shape.height,
    transform: `rotate(${shape.rotation}deg)`,
    cursor: dragging ? 'grabbing' : 'grab',
  };

  const patternId = `pattern-${shape.id}`;
  const hasPattern = shape.pattern !== 'none' || !!shape.imagePattern;
  const fill = hasPattern ? `url(#${patternId})` : shape.color;
  const w = shape.width;
  const h = shape.height;

  const renderShape = () => {
    if (shape.type === 'circle') {
      return (
        <svg width={w} height={h} className="w-full h-full">
          <PatternDefs id={patternId} pattern={shape.pattern} color={shape.color} width={w} height={h} imagePattern={shape.imagePattern} />
          <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - 2} ry={h / 2 - 2} fill={fill} />
        </svg>
      );
    }
    if (shape.type === 'triangle') {
      return (
        <svg width={w} height={h} className="w-full h-full">
          <PatternDefs id={patternId} pattern={shape.pattern} color={shape.color} width={w} height={h} imagePattern={shape.imagePattern} />
          <polygon points={`${w / 2},2 ${w - 4},${h - 2} 4,${h - 2}`} fill={fill} />
        </svg>
      );
    }
    if (shape.type === 'rounded-rect') {
      return (
        <svg width={w} height={h} className="w-full h-full">
          <PatternDefs id={patternId} pattern={shape.pattern} color={shape.color} width={w} height={h} imagePattern={shape.imagePattern} />
          <rect x="2" y="2" width={w - 4} height={h - 4} rx="16" ry="16" fill={fill} />
        </svg>
      );
    }
    // rectangle
    if (hasPattern) {
      return (
        <svg width={w} height={h} className="w-full h-full">
          <PatternDefs id={patternId} pattern={shape.pattern} color={shape.color} width={w} height={h} imagePattern={shape.imagePattern} />
          <rect x="0" y="0" width={w} height={h} fill={fill} />
        </svg>
      );
    }
    return (
      <div
        className="w-full h-full rounded-sm"
        style={{ backgroundColor: shape.color }}
      />
    );
  };

  return (
    <div
      ref={shapeRef}
      style={shapeStyle}
      onMouseDown={handleMouseDown}
      className="group select-none"
    >
      {renderShape()}
      {shape.label && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className="font-medium px-1 rounded"
            style={{
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              fontSize: shape.labelFontSize || 12,
              transform: `rotate(${shape.labelRotation || 0}deg)`,
              display: 'inline-block',
            }}
          >
            {shape.label}
          </span>
        </div>
      )}
      {isSelected && (
        <>
          <div className="absolute inset-0 border-2 rounded-sm pointer-events-none" style={{ borderColor: 'hsl(45, 90%, 60%)' }} />
          {/* Edge handles */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-1.5 h-8 rounded-full cursor-ew-resize" style={{ backgroundColor: 'hsl(45, 90%, 60%)' }} onMouseDown={(e) => handleResizeStart('left', e)} />
          <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-1.5 h-8 rounded-full cursor-ew-resize" style={{ backgroundColor: 'hsl(45, 90%, 60%)' }} onMouseDown={(e) => handleResizeStart('right', e)} />
          <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 h-1.5 w-8 rounded-full cursor-ns-resize" style={{ backgroundColor: 'hsl(45, 90%, 60%)' }} onMouseDown={(e) => handleResizeStart('top', e)} />
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 h-1.5 w-8 rounded-full cursor-ns-resize" style={{ backgroundColor: 'hsl(45, 90%, 60%)' }} onMouseDown={(e) => handleResizeStart('bottom', e)} />
          {/* Corner handles */}
          <div className="absolute -top-2 -left-2 w-3 h-3 rounded-full cursor-nwse-resize" style={{ backgroundColor: 'hsl(45, 90%, 60%)' }} onMouseDown={(e) => handleResizeStart('corner-tl', e)} />
          <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full cursor-nesw-resize" style={{ backgroundColor: 'hsl(45, 90%, 60%)' }} onMouseDown={(e) => handleResizeStart('corner-tr', e)} />
          <div className="absolute -bottom-2 -left-2 w-3 h-3 rounded-full cursor-nesw-resize" style={{ backgroundColor: 'hsl(45, 90%, 60%)' }} onMouseDown={(e) => handleResizeStart('corner-bl', e)} />
          <div className="absolute -bottom-2 -right-2 w-3 h-3 rounded-full cursor-nwse-resize" style={{ backgroundColor: 'hsl(45, 90%, 60%)' }} onMouseDown={(e) => handleResizeStart('corner-br', e)} />
          {/* Rotate handle */}
          <div
            className="absolute -top-8 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: 'hsl(45, 90%, 60%)' }}
            onMouseDown={handleRotateStart}
          >
            <RotateCw className="w-3 h-3" style={{ color: 'hsl(220, 20%, 6%)' }} />
          </div>
          <div className="absolute -top-4 left-1/2 w-px h-4 -translate-x-1/2" style={{ backgroundColor: 'hsl(45, 90%, 60%)' }} />
        </>
      )}
    </div>
  );
};
