import { useRef, useState } from 'react';
import { useRoomDesigner } from '@/hooks/useRoomDesigner';
import { useRoomLibrary } from '@/hooks/useRoomLibrary';
import { Toolbar } from '@/components/room/Toolbar';
import { RoomCanvas } from '@/components/room/RoomCanvas';
import { PropertiesPanel } from '@/components/room/PropertiesPanel';
import { RoomLibraryDialog } from '@/components/room/RoomLibraryDialog';
import { downloadRoomAsPng, printRoom } from '@/utils/exportRoom';
import { toast } from 'sonner';

const Index = () => {
  const canvasRef = useRef<HTMLDivElement>(null!);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const designer = useRoomDesigner();
  const library = useRoomLibrary();

  const handleSave = () => {
    library.saveRoom(designer.room);
    toast.success('Room saved to library');
  };

  const handleDownload = async () => {
    if (canvasRef.current) {
      await downloadRoomAsPng(canvasRef.current, designer.room.name);
      toast.success('Room downloaded');
    }
  };

  const handlePrint = async () => {
    if (canvasRef.current) {
      await printRoom(canvasRef.current);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Toolbar
        onAddShape={designer.addShape}
        onAddLabel={designer.addLabel}
        onSave={handleSave}
        onNew={designer.newRoom}
        onOpenLibrary={() => setLibraryOpen(true)}
        onDownload={handleDownload}
        onPrint={handlePrint}
        onDuplicate={designer.duplicateShape}
        canDuplicate={!!designer.selectedShape}
      />
      <div className="flex flex-1 overflow-hidden">
        <RoomCanvas
          room={designer.room}
          selectedShapeId={designer.selectedShapeId}
          selectedLabelId={designer.selectedLabelId}
          onSelectShape={(id) => { designer.setSelectedShapeId(id); designer.setSelectedLabelId(null); }}
          onSelectLabel={(id) => { designer.setSelectedLabelId(id); designer.setSelectedShapeId(null); }}
          onUpdateShape={designer.updateShape}
          onUpdateLabel={designer.updateLabel}
          onClearSelection={designer.clearSelection}
          canvasRef={canvasRef}
        />
        <PropertiesPanel
          room={designer.room}
          selectedShape={designer.selectedShape}
          selectedLabel={designer.selectedLabel}
          onUpdateShape={designer.updateShape}
          onDeleteShape={designer.deleteShape}
          onUpdateLabel={designer.updateLabel}
          onDeleteLabel={designer.deleteLabel}
          onUpdateRoom={designer.updateRoom}
        />
      </div>
      <RoomLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        rooms={library.rooms}
        onLoad={designer.loadRoom}
        onDelete={library.deleteRoom}
      />
    </div>
  );
};

export default Index;
