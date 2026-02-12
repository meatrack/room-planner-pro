import { useState, useRef, useCallback, useEffect } from 'react';
import { RoomShape } from '@/types/room';
import { RotateCw } from 'lucide-react';

interface CanvasShapeProps {
  shape: RoomShape;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<RoomShape>) => void;
}

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

  const renderShape = () => {
    if (shape.type === 'circle') {
      return (
        <div
          className="w-full h-full rounded-full"
          style={{ backgroundColor: shape.color }}
        />
      );
    }
    if (shape.type === 'triangle') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50,5 95,95 5,95" fill={shape.color} />
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
          <span className="text-xs font-medium px-1 rounded" style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
            {shape.label}
          </span>
        </div>
      )}
      {isSelected && (
        <>
          <div className="absolute inset-0 border-2 rounded-sm pointer-events-none" style={{ borderColor: 'hsl(45, 90%, 60%)' }} />
          {/* Resize handle */}
          <div
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full cursor-se-resize"
            style={{ backgroundColor: 'hsl(45, 90%, 60%)' }}
            onMouseDown={handleResizeStart}
          />
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
