import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import type { CalculationQuality } from '@/domain/calculationQuality';

const STORAGE_KEY = 'hvac-pro-saved-room-loads-v1';
export type SavedRoomLoad = { id: string; name: string; areaM2: number; heightM: number; coolingLoadKw: number; quality?: CalculationQuality; updatedAt: string };
type StoredProject = { schemaVersion: 2 | 3; localProjectId: string; rooms: SavedRoomLoad[] };
type Value = { localProjectId: string; rooms: SavedRoomLoad[]; saveRoom: (room: Omit<SavedRoomLoad, 'id' | 'updatedAt'>) => void };
const Context = createContext<Value>({ localProjectId: '', rooms: [], saveRoom: () => undefined });
const newProjectId = () => `hvac-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function SavedRoomsProvider({ children }: { children: React.ReactNode }) {
  const [rooms, setRooms] = useState<SavedRoomLoad[]>([]);
  const [localProjectId, setLocalProjectId] = useState(newProjectId);
  useEffect(() => { void (async () => { try { const raw = Platform.OS === 'web' ? globalThis.localStorage?.getItem(STORAGE_KEY) : await SecureStore.getItemAsync(STORAGE_KEY); if (raw) { const parsed = JSON.parse(raw) as StoredProject | SavedRoomLoad[]; if (Array.isArray(parsed)) setRooms(parsed); else { setRooms(parsed.rooms ?? []); setLocalProjectId(parsed.localProjectId || newProjectId()); } } } catch {} })(); }, []);
  const persist = (next: SavedRoomLoad[]) => { setRooms(next); const stored: StoredProject = { schemaVersion: 3, localProjectId, rooms: next }; const raw = JSON.stringify(stored); try { if (Platform.OS === 'web') globalThis.localStorage?.setItem(STORAGE_KEY, raw); else void SecureStore.setItemAsync(STORAGE_KEY, raw); } catch {} };
  const saveRoom = (room: Omit<SavedRoomLoad, 'id' | 'updatedAt'>) => {
    const name = room.name.trim(); if (!name) return;
    const existing = rooms.find(item => item.name.toLocaleLowerCase('hu') === name.toLocaleLowerCase('hu'));
    const saved = { ...room, name, id: existing?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`, updatedAt: new Date().toISOString() };
    persist(existing ? rooms.map(item => item.id === existing.id ? saved : item) : [...rooms, saved]);
  };
  return <Context.Provider value={{ localProjectId, rooms, saveRoom }}>{children}</Context.Provider>;
}
export function useSavedRooms() { return useContext(Context); }
