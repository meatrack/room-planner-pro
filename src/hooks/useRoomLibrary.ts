import { useState, useEffect } from 'react';
import { Room } from '@/types/room';

const STORAGE_KEY = 'room-designer-library';

export const useRoomLibrary = () => {
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRooms(JSON.parse(stored));
    } catch {}
  }, []);

  const save = (rooms: Room[]) => {
    setRooms(rooms);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  };

  const saveRoom = (room: Room) => {
    const existing = rooms.findIndex(r => r.id === room.id);
    const updated = existing >= 0
      ? rooms.map(r => r.id === room.id ? room : r)
      : [...rooms, room];
    save(updated);
  };

  const deleteRoom = (id: string) => {
    save(rooms.filter(r => r.id !== id));
  };

  return { rooms, saveRoom, deleteRoom };
};
