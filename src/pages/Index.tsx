import { useRef, useState } from 'react';
import { useRoomDesigner } from '@/hooks/useRoomDesigner';
import { useRoomLibrary } from '@/hooks/useRoomLibrary';
import { useFurnitureLibrary } from '@/hooks/useFurnitureLibrary';
import { Toolbar } from '@/components/room/Toolbar';
import { RoomCanvas } from '@/components/room/RoomCanvas';
import { PropertiesPanel } from '@/components/room/PropertiesPanel';
import { FurniturePanel } from '@/components/room/FurniturePanel';
import { RoomLibraryDialog } from '@/components/room/RoomLibraryDialog';
import { downloadRoomAsPng, printRoom, saveRoomToFile, loadRoomFromFile } from '@/utils/exportRoom';
import { FurnitureItem, FurnitureTemplate } from '@/types/furniture';
import { RoomShape } from '@/types/room';
import { toast } from 'sonner';

const generateId = () => Math.random().toString(36).substr(2, 9);

const Index = () => {
  const canvasRef = useRef<HTMLDivElement>(null!);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const designer = useRoomDesigner();
  const library = useRoomLibrary();
  const furniture = useFurnitureLibrary();

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

  const handleSaveToFile = () => {
    saveRoomToFile(designer.room);
    toast.success('Room saved to file');
  };

  const handleLoadFromFile = async () => {
    const room = await loadRoomFromFile();
    if (room) {
      designer.loadRoom(room);
      toast.success('Room loaded from file');
    } else {
      toast.error('Failed to load room');
    }
  };

  const handleRotateShape = () => {
    if (designer.selectedShape) {
      designer.updateShape(designer.selectedShape.id, {
        rotation: (designer.selectedShape.rotation + 90) % 360,
      });
    }
  };

  const handleSaveAsTemplate = (name: string) => {
    const shapes = designer.room.shapes.filter(s =>
      designer.selectedShapeId === s.id || designer.room.shapes.length > 0
    );
    // If a shape is selected, save just that one; otherwise save all
    const toSave = designer.selectedShape ? [designer.selectedShape] : designer.room.shapes;
    if (toSave.length === 0) return;

    const template: FurnitureTemplate = {
      id: generateId(),
      name,
      items: toSave.map(s => ({
        id: generateId(),
        name: s.name || s.label || s.type,
        shape: {
          type: s.type,
          width: s.width,
          height: s.height,
          rotation: s.rotation,
          color: s.color,
          label: s.label,
          labelFontSize: s.labelFontSize,
          labelRotation: s.labelRotation,
          labelColor: s.labelColor,
          pattern: s.pattern,
          imagePattern: s.imagePattern,
        },
      })),
      createdAt: Date.now(),
    };
    furniture.saveTemplate(template);
    toast.success(`Template "${name}" saved with ${toSave.length} item(s)`);
  };

  const handleDropFurniture = (shape: Omit<RoomShape, 'id' | 'x' | 'y'>, x: number, y: number) => {
    const newShape: RoomShape = {
      ...shape,
      id: generateId(),
      x,
      y,
    };
    designer.updateRoom({
      shapes: [...designer.room.shapes, newShape],
    });
    designer.setSelectedShapeId(newShape.id);
    designer.setSelectedLabelId(null);
    toast.success('Furniture added');
  };

  const handleImportTemplates = async () => {
    const ok = await furniture.importTemplates();
    if (ok) toast.success('Templates imported');
    else toast.error('Failed to import templates');
  };

  // Get selected shapes for the save-as-template feature
  const selectedShapes = designer.selectedShape ? [designer.selectedShape] : [];

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
        onSaveToFile={handleSaveToFile}
        onLoadFromFile={handleLoadFromFile}
        onRotateShape={handleRotateShape}
        canRotate={!!designer.selectedShape}
      />
      <div className="flex flex-1 overflow-hidden">
        <FurniturePanel
          templates={furniture.templates}
          onDeleteTemplate={furniture.deleteTemplate}
          onExport={furniture.exportTemplates}
          onImport={handleImportTemplates}
          onDragStart={() => {}}
          selectedShapes={selectedShapes}
          onSaveAsTemplate={handleSaveAsTemplate}
        />
        <RoomCanvas
          room={designer.room}
          selectedShapeId={designer.selectedShapeId}
          selectedLabelId={designer.selectedLabelId}
          onSelectShape={(id) => { designer.setSelectedShapeId(id); designer.setSelectedLabelId(null); }}
          onSelectLabel={(id) => { designer.setSelectedLabelId(id); designer.setSelectedShapeId(null); }}
          onUpdateShape={designer.updateShape}
          onUpdateLabel={designer.updateLabel}
          onClearSelection={designer.clearSelection}
          onUpdateRoom={designer.updateRoom}
          canvasRef={canvasRef}
          onDropFurniture={handleDropFurniture}
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
