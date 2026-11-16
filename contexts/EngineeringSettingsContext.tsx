import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import type { AppLanguage, CalculationMode, JurisdictionCode } from '@/domain/engineeringStandards';

const STORAGE_KEY = 'hvac-pro-engineering-settings-v1';

export type EngineeringSettings = {
  language: AppLanguage;
  jurisdiction: JurisdictionCode;
  calculationMode: CalculationMode;
};

const DEFAULT_SETTINGS: EngineeringSettings = {
  language: 'hu',
  jurisdiction: 'HU',
  calculationMode: 'guided-recommendation',
};

type EngineeringSettingsValue = EngineeringSettings & {
  loaded: boolean;
  setLanguage: (value: AppLanguage) => void;
  setJurisdiction: (value: JurisdictionCode) => void;
  setCalculationMode: (value: CalculationMode) => void;
};

const Context = createContext<EngineeringSettingsValue>({
  ...DEFAULT_SETTINGS,
  loaded: false,
  setLanguage: () => undefined,
  setJurisdiction: () => undefined,
  setCalculationMode: () => undefined,
});

async function readSettings() {
  const raw = Platform.OS === 'web'
    ? globalThis.localStorage?.getItem(STORAGE_KEY)
    : await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as EngineeringSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(settings: EngineeringSettings) {
  const raw = JSON.stringify(settings);
  if (Platform.OS === 'web') globalThis.localStorage?.setItem(STORAGE_KEY, raw);
  else void SecureStore.setItemAsync(STORAGE_KEY, raw);
}

export function EngineeringSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void readSettings().then(value => {
      setSettings(value);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const update = (patch: Partial<EngineeringSettings>) => setSettings(current => {
    const next = { ...current, ...patch };
    try { persistSettings(next); } catch { /* Az aktuális munkamenetben így is megmarad. */ }
    return next;
  });

  const value = useMemo<EngineeringSettingsValue>(() => ({
    ...settings,
    loaded,
    setLanguage: language => update({ language }),
    setJurisdiction: jurisdiction => update({ jurisdiction }),
    setCalculationMode: calculationMode => update({ calculationMode }),
  }), [loaded, settings]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useEngineeringSettings() {
  return useContext(Context);
}
