import { useState, useRef, useCallback, useEffect } from 'react';
import { TextLabel } from '@/types/room';

interface CanvasLabelProps {
  label: TextLabel;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextLabel>) => void;
}

export const CanvasLabel = ({ label, isSelected, onSelect, onUpdate }: CanvasLabelProps) => {
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setDragging(true);
    dragOffset.current = { x: e.clientX - label.x, y: e.clientY - label.y };
  }, [label.x, label.y, onSelect]);

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      onUpdate({
        x: Math.round((e.clientX - dragOffset.current.x) / 10) * 10,
        y: Math.round((e.clientY - dragOffset.current.y) / 10) * 10,
      });
    };
    const handleMouseUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, onUpdate]);

  return (
    <div
      className="absolute select-none cursor-grab active:cursor-grabbing px-1"
      style={{
        left: label.x,
        top: label.y,
        fontSize: label.fontSize,
        color: label.color,
        transform: `rotate(${label.rotation || 0}deg)`,
        border: isSelected ? '1px dashed hsl(45, 90%, 60%)' : '1px dashed transparent',
      }}
      onMouseDown={handleMouseDown}
    >
      {label.text}
    </div>
  );
};
