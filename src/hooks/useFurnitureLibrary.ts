import { useState, useEffect } from 'react';
import { FurnitureTemplate } from '@/types/furniture';

const STORAGE_KEY = 'room-designer-furniture';

export const useFurnitureLibrary = () => {
  const [templates, setTemplates] = useState<FurnitureTemplate[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setTemplates(JSON.parse(stored));
    } catch {}
  }, []);

  const save = (updated: FurnitureTemplate[]) => {
    setTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const saveTemplate = (template: FurnitureTemplate) => {
    const idx = templates.findIndex(t => t.id === template.id);
    save(idx >= 0 ? templates.map(t => t.id === template.id ? template : t) : [...templates, template]);
  };

  const deleteTemplate = (id: string) => {
    save(templates.filter(t => t.id !== id));
  };

  const exportTemplates = () => {
    const json = JSON.stringify(templates, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = 'furniture-templates.json';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importTemplates = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return resolve(false);
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const imported = JSON.parse(reader.result as string) as FurnitureTemplate[];
            if (!Array.isArray(imported)) return resolve(false);
            // Merge: add new, skip duplicates by id
            const merged = [...templates];
            for (const t of imported) {
              if (!merged.find(m => m.id === t.id)) merged.push(t);
            }
            save(merged);
            resolve(true);
          } catch {
            resolve(false);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  };

  return { templates, saveTemplate, deleteTemplate, exportTemplates, importTemplates };
};
