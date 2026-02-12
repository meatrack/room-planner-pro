import { RoomShape, TextLabel, Room, PatternType } from '@/types/room';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
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
];

export const PropertiesPanel = ({
  room, selectedShape, selectedLabel,
  onUpdateShape, onDeleteShape, onUpdateLabel, onDeleteLabel, onUpdateRoom,
}: PropertiesPanelProps) => {
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
          <Select value={selectedShape.pattern || 'none'} onValueChange={(v) => onUpdateShape(selectedShape.id, { pattern: v as PatternType })}>
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

      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {room.shapes.length} shapes · {room.labels.length} labels
        </p>
      </div>
    </div>
  );
};
