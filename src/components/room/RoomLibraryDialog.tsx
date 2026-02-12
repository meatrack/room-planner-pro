import { Room } from '@/types/room';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, FolderOpen } from 'lucide-react';

interface RoomLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rooms: Room[];
  onLoad: (room: Room) => void;
  onDelete: (id: string) => void;
}

export const RoomLibraryDialog = ({ open, onOpenChange, rooms, onLoad, onDelete }: RoomLibraryDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Room Library</DialogTitle>
        </DialogHeader>
        {rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No saved rooms yet. Save your current room to see it here.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {rooms.map(room => (
              <div key={room.id} className="flex items-center justify-between p-3 rounded-md bg-secondary hover:bg-secondary/80 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{room.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {room.shapes.length} shapes · {new Date(room.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10" onClick={() => { onLoad(room); onOpenChange(false); }}>
                    <FolderOpen className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(room.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
