import { useState } from 'react';
import { FurnitureTemplate, FurnitureItem } from '@/types/furniture';
import { RoomShape } from '@/types/room';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, ChevronDown, ChevronRight, Download, Upload, Package, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FurniturePanelProps {
  templates: FurnitureTemplate[];
  onDeleteTemplate: (id: string) => void;
  onExport: () => void;
  onImport: () => void;
  onDragStart: (item: FurnitureItem) => void;
  selectedShapes: RoomShape[];
  onSaveAsTemplate: (name: string) => void;
}

export const FurniturePanel = ({
  templates, onDeleteTemplate, onExport, onImport, onDragStart, selectedShapes, onSaveAsTemplate,
}: FurniturePanelProps) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleSave = () => {
    if (!newTemplateName.trim()) return;
    onSaveAsTemplate(newTemplateName.trim());
    setNewTemplateName('');
    setShowSaveForm(false);
  };

  const getShapePreview = (item: FurnitureItem) => {
    const w = 32;
    const h = 32;
    const sw = Math.min(w, item.shape.width / Math.max(item.shape.width, item.shape.height) * w);
    const sh = Math.min(h, item.shape.height / Math.max(item.shape.width, item.shape.height) * h);

    if (item.shape.type === 'circle') {
      return (
        <svg width={w} height={h}>
          <ellipse cx={w / 2} cy={h / 2} rx={sw / 2} ry={sh / 2} fill={item.shape.color} />
        </svg>
      );
    }
    if (item.shape.type === 'triangle') {
      return (
        <svg width={w} height={h}>
          <polygon points={`${w / 2},${h / 2 - sh / 2} ${w / 2 + sw / 2},${h / 2 + sh / 2} ${w / 2 - sw / 2},${h / 2 + sh / 2}`} fill={item.shape.color} />
        </svg>
      );
    }
    if (item.shape.type === 'rounded-rect') {
      return (
        <svg width={w} height={h}>
          <rect x={(w - sw) / 2} y={(h - sh) / 2} width={sw} height={sh} rx="4" fill={item.shape.color} />
        </svg>
      );
    }
    return (
      <svg width={w} height={h}>
        <rect x={(w - sw) / 2} y={(h - sh) / 2} width={sw} height={sh} fill={item.shape.color} />
      </svg>
    );
  };

  return (
    <div className="w-56 bg-card border-r border-border flex flex-col overflow-hidden">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Furniture</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={onImport}>
                <Upload className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Import Templates</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={onExport} disabled={templates.length === 0}>
                <Download className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export Templates</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Save shapes as template */}
      <div className="p-2 border-b border-border">
        {!showSaveForm ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs bg-secondary border-border"
            onClick={() => setShowSaveForm(true)}
            disabled={selectedShapes.length === 0}
          >
            <Plus className="h-3 w-3 mr-1" />
            Save Selection as Template
          </Button>
        ) : (
          <div className="flex gap-1">
            <Input
              value={newTemplateName}
              onChange={e => setNewTemplateName(e.target.value)}
              placeholder="Template name..."
              className="h-7 text-xs bg-secondary border-border"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <Button variant="default" size="sm" className="h-7 px-2 text-xs" onClick={handleSave}>
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto">
        {templates.length === 0 ? (
          <p className="text-[10px] text-muted-foreground p-3 text-center">
            Select shapes and save them as a furniture template. Drag items onto the room.
          </p>
        ) : (
          templates.map(template => (
            <div key={template.id} className="border-b border-border/50">
              <div
                className="flex items-center justify-between px-2 py-1.5 hover:bg-secondary/50 cursor-pointer"
                onClick={() => toggle(template.id)}
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {expanded[template.id] ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                  <span className="text-xs text-foreground truncate">{template.name}</span>
                  <span className="text-[10px] text-muted-foreground">({template.items.length})</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={(e) => { e.stopPropagation(); onDeleteTemplate(template.id); }}
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
              {expanded[template.id] && (
                <div className="px-2 pb-2 space-y-1">
                  {template.items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded bg-secondary/50 hover:bg-secondary cursor-grab active:cursor-grabbing transition-colors"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/furniture-item', JSON.stringify(item));
                        e.dataTransfer.effectAllowed = 'copy';
                        onDragStart(item);
                      }}
                    >
                      <div className="shrink-0">{getShapePreview(item)}</div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-foreground truncate">{item.name || item.shape.type}</p>
                        <p className="text-[9px] text-muted-foreground">{Math.round(item.shape.width)}×{Math.round(item.shape.height)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
