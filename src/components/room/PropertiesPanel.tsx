import { useRef } from 'react';
import { RoomShape, TextLabel, Room, PatternType, RoomShapeType } from '@/types/room';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2, Upload, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PropertiesPanelProps {
  room: Room;
  selectedShape: RoomShape | null;
  selectedLabel: TextLabel | null;
  onUpdateShape: (id: string, updates: Partial<RoomShape>) => void;
  onDeleteShape: (id: string) => void;
  onUpdateLabel: (id: string, updates: Partial<TextLabel>) => void;
  onDeleteLabel: (id: string) => void;
  onUpdateRoom: (updates: Partial<Room>) => void;
}

const patterns: { value: PatternType; label: string }[] = [
  { value: 'none', label: 'Solid' },
  { value: 'stripes', label: 'Stripes' },
  { value: 'dots', label: 'Dots' },
  { value: 'crosshatch', label: 'Crosshatch' },
  { value: 'diagonal', label: 'Diagonal' },
  { value: 'brick', label: 'Brick Wall' },
];

const roomShapes: { value: RoomShapeType; label: string }[] = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'l-shape-tl', label: 'L-Shape (Top Left)' },
  { value: 'l-shape-tr', label: 'L-Shape (Top Right)' },
  { value: 'l-shape-bl', label: 'L-Shape (Bottom Left)' },
  { value: 'l-shape-br', label: 'L-Shape (Bottom Right)' },
  { value: 'u-shape', label: 'U-Shape' },
  { value: 't-shape', label: 'T-Shape' },
];

export const PropertiesPanel = ({
  room, selectedShape, selectedLabel,
  onUpdateShape, onDeleteShape, onUpdateLabel, onDeleteLabel, onUpdateRoom,
}: PropertiesPanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedShape) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateShape(selectedShape.id, { imagePattern: reader.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (selectedShape) {
    return (
      <div className="w-60 bg-card border-l border-border p-4 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground capitalize">{selectedShape.type}</h3>
          <Button variant="ghost" size="icon" onClick={() => onDeleteShape(selectedShape.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Label</Label>
          <Input
            value={selectedShape.label}
            onChange={e => onUpdateShape(selectedShape.id, { label: e.target.value })}
            placeholder="e.g. Sofa"
            className="h-8 text-sm bg-secondary border-border"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Label Font Size ({selectedShape.labelFontSize || 12}px)</Label>
          <Slider
            value={[selectedShape.labelFontSize || 12]}
            onValueChange={([v]) => onUpdateShape(selectedShape.id, { labelFontSize: v })}
            min={8} max={36} step={1}
            className="py-1"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Label Rotation ({selectedShape.labelRotation || 0}°)</Label>
          <Slider
            value={[selectedShape.labelRotation || 0]}
            onValueChange={([v]) => onUpdateShape(selectedShape.id, { labelRotation: v })}
            min={0} max={360} step={15}
            className="py-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Width</Label>
            <Input type="number" value={Math.round(selectedShape.width)} onChange={e => onUpdateShape(selectedShape.id, { width: +e.target.value })} className="h-8 text-sm bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Height</Label>
            <Input type="number" value={Math.round(selectedShape.height)} onChange={e => onUpdateShape(selectedShape.id, { height: +e.target.value })} className="h-8 text-sm bg-secondary border-border" />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Rotation ({selectedShape.rotation}°)</Label>
          <Slider
            value={[selectedShape.rotation]}
            onValueChange={([v]) => onUpdateShape(selectedShape.id, { rotation: v })}
            min={0} max={360} step={15}
            className="py-1"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Pattern</Label>
          <Select value={selectedShape.pattern || 'none'} onValueChange={(v) => onUpdateShape(selectedShape.id, { pattern: v as PatternType, imagePattern: undefined })}>
            <SelectTrigger className="h-8 text-sm bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {patterns.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Image Pattern</Label>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs flex-1 bg-secondary border-border" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3 w-3 mr-1" /> Upload Image
            </Button>
            {selectedShape.imagePattern && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onUpdateShape(selectedShape.id, { imagePattern: undefined })}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          {selectedShape.imagePattern && (
            <div className="w-full h-12 rounded border border-border overflow-hidden">
              <img src={selectedShape.imagePattern} alt="Pattern" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Color</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={selectedShape.color} onChange={e => onUpdateShape(selectedShape.id, { color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
            <Input value={selectedShape.color} onChange={e => onUpdateShape(selectedShape.id, { color: e.target.value })} className="h-8 text-sm bg-secondary border-border flex-1" />
          </div>
        </div>
      </div>
    );
  }

  if (selectedLabel) {
    return (
      <div className="w-60 bg-card border-l border-border p-4 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Text Label</h3>
          <Button variant="ghost" size="icon" onClick={() => onDeleteLabel(selectedLabel.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Text</Label>
          <Input value={selectedLabel.text} onChange={e => onUpdateLabel(selectedLabel.id, { text: e.target.value })} className="h-8 text-sm bg-secondary border-border" />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Font Size</Label>
          <Slider
            value={[selectedLabel.fontSize]}
            onValueChange={([v]) => onUpdateLabel(selectedLabel.id, { fontSize: v })}
            min={10} max={48} step={1}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Rotation ({selectedLabel.rotation || 0}°)</Label>
          <Slider
            value={[selectedLabel.rotation || 0]}
            onValueChange={([v]) => onUpdateLabel(selectedLabel.id, { rotation: v })}
            min={0} max={360} step={15}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Color</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={selectedLabel.color} onChange={e => onUpdateLabel(selectedLabel.id, { color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
            <Input value={selectedLabel.color} onChange={e => onUpdateLabel(selectedLabel.id, { color: e.target.value })} className="h-8 text-sm bg-secondary border-border flex-1" />
          </div>
        </div>
      </div>
    );
  }

  // Room properties
  return (
    <div className="w-60 bg-card border-l border-border p-4 space-y-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-foreground">Room Properties</h3>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Room Name</Label>
        <Input value={room.name} onChange={e => onUpdateRoom({ name: e.target.value })} className="h-8 text-sm bg-secondary border-border" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Room Shape</Label>
        <Select value={room.roomShape || 'rectangle'} onValueChange={(v) => onUpdateRoom({ roomShape: v as RoomShapeType })}>
          <SelectTrigger className="h-8 text-sm bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roomShapes.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">Width</Label>
          <Input type="number" value={room.width} onChange={e => onUpdateRoom({ width: +e.target.value })} className="h-8 text-sm bg-secondary border-border" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Height</Label>
          <Input type="number" value={room.height} onChange={e => onUpdateRoom({ height: +e.target.value })} className="h-8 text-sm bg-secondary border-border" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Background</Label>
        <div className="flex items-center gap-2">
          <input type="color" value={room.backgroundColor} onChange={e => onUpdateRoom({ backgroundColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
          <Input value={room.backgroundColor} onChange={e => onUpdateRoom({ backgroundColor: e.target.value })} className="h-8 text-sm bg-secondary border-border flex-1" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Grid Color</Label>
        <div className="flex items-center gap-2">
          <input type="color" value={room.gridColor || '#1e2a3a'} onChange={e => onUpdateRoom({ gridColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
          <Input value={room.gridColor || '#1e2a3a'} onChange={e => onUpdateRoom({ gridColor: e.target.value })} className="h-8 text-sm bg-secondary border-border flex-1" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Grid Opacity ({room.gridOpacity ?? 100}%)</Label>
        <Slider
          value={[room.gridOpacity ?? 100]}
          onValueChange={([v]) => onUpdateRoom({ gridOpacity: v })}
          min={0} max={100} step={5}
          className="py-1"
        />
      </div>

      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {room.shapes.length} shapes · {room.labels.length} labels
        </p>
      </div>
    </div>
  );
};
