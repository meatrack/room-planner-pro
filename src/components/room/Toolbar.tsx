import { Square, Circle, Triangle, Type, Plus, Download, Printer, FolderOpen, Save, FilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ShapeType } from '@/types/room';

interface ToolbarProps {
  onAddShape: (type: ShapeType) => void;
  onAddLabel: () => void;
  onSave: () => void;
  onNew: () => void;
  onOpenLibrary: () => void;
  onDownload: () => void;
  onPrint: () => void;
}

const tools: { type: ShapeType; icon: typeof Square; label: string }[] = [
  { type: 'rectangle', icon: Square, label: 'Rectangle' },
  { type: 'circle', icon: Circle, label: 'Circle' },
  { type: 'triangle', icon: Triangle, label: 'Triangle' },
];

export const Toolbar = ({ onAddShape, onAddLabel, onSave, onNew, onOpenLibrary, onDownload, onPrint }: ToolbarProps) => {
  return (
    <div className="flex items-center gap-1 p-2 bg-card border-b border-border">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onNew} className="text-muted-foreground hover:text-foreground hover:bg-secondary">
            <FilePlus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>New Room</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onSave} className="text-muted-foreground hover:text-foreground hover:bg-secondary">
            <Save className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Save Room</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onOpenLibrary} className="text-muted-foreground hover:text-foreground hover:bg-secondary">
            <FolderOpen className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Room Library</TooltipContent>
      </Tooltip>

      <div className="w-px h-6 bg-border mx-1" />

      {tools.map(({ type, icon: Icon, label }) => (
        <Tooltip key={type}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => onAddShape(type)} className="text-muted-foreground hover:text-primary hover:bg-secondary">
              <Icon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add {label}</TooltipContent>
        </Tooltip>
      ))}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onAddLabel} className="text-muted-foreground hover:text-primary hover:bg-secondary">
            <Type className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add Text Label</TooltipContent>
      </Tooltip>

      <div className="flex-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onDownload} className="text-muted-foreground hover:text-foreground hover:bg-secondary">
            <Download className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Download as PNG</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onPrint} className="text-muted-foreground hover:text-foreground hover:bg-secondary">
            <Printer className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Print</TooltipContent>
      </Tooltip>
    </div>
  );
};
