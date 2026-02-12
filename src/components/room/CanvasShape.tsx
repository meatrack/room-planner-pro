import { useState, useRef, useCallback, useEffect } from 'react';
import { RoomShape, PatternType } from '@/types/room';
import { RotateCw } from 'lucide-react';

interface CanvasShapeProps {
  shape: RoomShape;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<RoomShape>) => void;
}

const PatternDefs = ({ id, pattern, color }: { id: string; pattern: PatternType; color: string }) => {
  if (pattern === 'none') return null;
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
    </defs>
  );
};

export const CanvasShape = ({ shape, isSelected, onSelect, onUpdate }: CanvasShapeProps) => {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [rotating, setRotating] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const shapeRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setDragging(true);
    dragOffset.current = { x: e.clientX - shape.x, y: e.clientY - shape.y };
  }, [shape.x, shape.y, onSelect]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setResizing(true);
    dragOffset.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleRotateStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setRotating(true);
  }, []);

  useEffect(() => {
    if (!dragging && !resizing && !rotating) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        onUpdate({
          x: Math.round((e.clientX - dragOffset.current.x) / 10) * 10,
          y: Math.round((e.clientY - dragOffset.current.y) / 10) * 10,
        });
      } else if (resizing) {
        const dx = e.clientX - dragOffset.current.x;
        const dy = e.clientY - dragOffset.current.y;
        onUpdate({
          width: Math.max(20, shape.width + dx),
          height: Math.max(20, shape.height + dy),
        });
        dragOffset.current = { x: e.clientX, y: e.clientY };
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
      setResizing(false);
      setRotating(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, resizing, rotating, shape.width, shape.height, onUpdate]);

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
  const fill = shape.pattern !== 'none' ? `url(#${patternId})` : shape.color;

  const renderShape = () => {
    if (shape.type === 'circle') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <PatternDefs id={patternId} pattern={shape.pattern} color={shape.color} />
          <ellipse cx="50" cy="50" rx="48" ry="48" fill={fill} />
        </svg>
      );
    }
    if (shape.type === 'triangle') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <PatternDefs id={patternId} pattern={shape.pattern} color={shape.color} />
          <polygon points="50,5 95,95 5,95" fill={fill} />
        </svg>
      );
    }
    if (shape.type === 'rounded-rect') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <PatternDefs id={patternId} pattern={shape.pattern} color={shape.color} />
          <rect x="2" y="2" width="96" height="96" rx="20" ry="20" fill={fill} />
        </svg>
      );
    }
    // rectangle
    if (shape.pattern !== 'none') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <PatternDefs id={patternId} pattern={shape.pattern} color={shape.color} />
          <rect x="0" y="0" width="100" height="100" fill={fill} />
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
          <div
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full cursor-se-resize"
            style={{ backgroundColor: 'hsl(45, 90%, 60%)' }}
            onMouseDown={handleResizeStart}
          />
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
