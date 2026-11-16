import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import type { CalculationRecord, NewCalculationRecord } from '@/domain/calculationRecord';
import { createCalculationRecord } from '@/domain/calculationRecord';

const STORAGE_KEY = 'hvac-pro-calculation-archive-v1';
const WEB_DB_NAME = 'hvac-pro-audit-db';
const WEB_STORE = 'calculation_records';

type CalculationArchiveValue = {
  records: CalculationRecord[];
  loaded: boolean;
  saveCalculation: (draft: NewCalculationRecord) => CalculationRecord;
  deleteCalculation: (id: string) => void;
};

const Context = createContext<CalculationArchiveValue>({ records: [], loaded: false, saveCalculation: () => { throw new Error('CalculationArchiveProvider missing'); }, deleteCalculation: () => undefined });

async function readArchive(): Promise<CalculationRecord[]> {
  if (Platform.OS === 'web' && globalThis.indexedDB) {
    try { return await readWebDatabase(); } catch { /* régi böngészőben tartalék tároló */ }
  }
  const raw = Platform.OS === 'web' ? globalThis.localStorage?.getItem(STORAGE_KEY) : await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return [];
  try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

function writeArchive(records: CalculationRecord[]) {
  if (Platform.OS === 'web' && globalThis.indexedDB) {
    void writeWebDatabase(records).catch(() => globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(records)));
    return;
  }
  const raw = JSON.stringify(records);
  if (Platform.OS === 'web') globalThis.localStorage?.setItem(STORAGE_KEY, raw);
  else void SecureStore.setItemAsync(STORAGE_KEY, raw);
}

function openWebDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = globalThis.indexedDB.open(WEB_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(WEB_STORE)) db.createObjectStore(WEB_STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readWebDatabase(): Promise<CalculationRecord[]> {
  const db = await openWebDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(WEB_STORE, 'readonly').objectStore(WEB_STORE).getAll();
    request.onsuccess = () => resolve((request.result as CalculationRecord[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    request.onerror = () => reject(request.error);
  });
}

async function writeWebDatabase(records: CalculationRecord[]) {
  const db = await openWebDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(WEB_STORE, 'readwrite');
    const store = transaction.objectStore(WEB_STORE);
    store.clear();
    records.forEach(record => store.put(record));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export function CalculationArchiveProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<CalculationRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { void readArchive().then(setRecords).finally(() => setLoaded(true)); }, []);

  const saveCalculation = useCallback((draft: NewCalculationRecord) => {
    const record = createCalculationRecord(draft);
    setRecords(current => { const next = [record, ...current]; writeArchive(next); return next; });
    return record;
  }, []);

  const deleteCalculation = useCallback((id: string) => {
    setRecords(current => { const next = current.filter(record => record.id !== id); writeArchive(next); return next; });
  }, []);

  const value = useMemo(() => ({ records, loaded, saveCalculation, deleteCalculation }), [records, loaded, saveCalculation, deleteCalculation]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useCalculationArchive() { return useContext(Context); }
