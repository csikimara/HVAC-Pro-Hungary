import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, Switch, Text, View } from 'react-native';

const STORAGE_KEY = 'hvac-pro-detailed-help';

type HelpContextValue = {
  detailedHelp: boolean;
  setDetailedHelp: (enabled: boolean) => void;
};

const HelpContext = createContext<HelpContextValue>({ detailedHelp: true, setDetailedHelp: () => undefined });

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [detailedHelp, setDetailedHelpState] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = Platform.OS === 'web'
          ? globalThis.localStorage?.getItem(STORAGE_KEY)
          : await SecureStore.getItemAsync(STORAGE_KEY);
        if (stored != null) setDetailedHelpState(stored === 'true');
      } catch {
        // A súgó alapból bekapcsolva marad, ha a beállítás nem olvasható.
      }
    };
    void load();
  }, []);

  const setDetailedHelp = (enabled: boolean) => {
    setDetailedHelpState(enabled);
    try {
      if (Platform.OS === 'web') globalThis.localStorage?.setItem(STORAGE_KEY, String(enabled));
      else void SecureStore.setItemAsync(STORAGE_KEY, String(enabled));
    } catch {
      // A kapcsoló a futó munkamenetben tárolási hiba esetén is működik.
    }
  };

  return <HelpContext.Provider value={{ detailedHelp, setDetailedHelp }}>{children}</HelpContext.Provider>;
}

export function useDetailedHelp() {
  return useContext(HelpContext);
}

export function HelpToggle() {
  const { detailedHelp, setDetailedHelp } = useDetailedHelp();
  return (
    <View style={{ backgroundColor: '#101820', borderColor: detailedHelp ? '#1E90FF' : '#2A2F38', borderWidth: 1, borderRadius: 14, padding: 13, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#E8ECF0', fontSize: 15, fontWeight: '900' }}>Részletes segítség</Text>
        <Text style={{ color: '#98A3AF', fontSize: 13, lineHeight: 18, marginTop: 2 }}>{detailedHelp ? 'Bekapcsolva: minden lépésnél elmondjuk, mit és miért adj meg.' : 'Kikapcsolva: csak a szükséges mezők és szakmai figyelmeztetések látszanak.'}</Text>
      </View>
      <Switch value={detailedHelp} onValueChange={setDetailedHelp} trackColor={{ false: '#3A414B', true: '#176BB0' }} thumbColor={detailedHelp ? '#60A5FA' : '#D1D5DB'} accessibilityLabel="Részletes segítség be- vagy kikapcsolása" />
    </View>
  );
}

export function HelpText({ children }: { children: React.ReactNode }) {
  const { detailedHelp } = useDetailedHelp();
  if (!detailedHelp) return null;
  return <Text style={{ color: '#A7B0BC', fontSize: 14, lineHeight: 20 }}>{children}</Text>;
}
