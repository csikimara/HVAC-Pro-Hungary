import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, ChevronLeft, ChevronRight, Globe2, Search, ShieldCheck, X } from 'lucide-react-native';
import { useEngineeringSettings } from '@/contexts/EngineeringSettingsContext';
import { useDetailedHelp } from '@/contexts/HelpContext';
import {
  APP_LANGUAGES,
  EUROPEAN_CORE_STANDARDS,
  EUROPEAN_JURISDICTIONS,
  jurisdictionName,
  jurisdictionStatus,
  jurisdictionStatusLabel,
  type AppLanguage,
  type CalculationMode,
  type JurisdictionCode,
} from '@/domain/engineeringStandards';

const BG = '#0D0F12';
const CARD = '#161A1F';
const SURFACE = '#1C2128';
const BORDER = '#2A2F38';
const TEXT = '#E8ECF0';
const MUTED = '#98A3AF';
const BLUE = '#1E90FF';
const YELLOW = '#F59E0B';
const GREEN = '#22C55E';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={{ backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 }}><Text style={{ color: TEXT, fontSize: 19, fontWeight: '900' }}>{title}</Text>{children}</View>;
}

function ChoiceCard({ title, detail, selected, onPress, color = BLUE }: { title: string; detail: string; selected: boolean; onPress: () => void; color?: string }) {
  return <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={{ backgroundColor: selected ? `${color}18` : SURFACE, borderColor: selected ? color : BORDER, borderWidth: selected ? 2 : 1, borderRadius: 13, padding: 14, flexDirection: 'row', gap: 10 }}>
    <View style={{ flex: 1 }}><Text style={{ color: selected ? color : TEXT, fontSize: 16, fontWeight: '900' }}>{title}</Text><Text style={{ color: MUTED, fontSize: 13, lineHeight: 19, marginTop: 5 }}>{detail}</Text></View>
    {selected && <Check size={20} color={color} />}
  </TouchableOpacity>;
}

export default function SettingsScreen({ onClose }: { onClose?: () => void } = {}) {
  const router = useRouter();
  const { language, jurisdiction, calculationMode, setLanguage, setJurisdiction, setCalculationMode } = useEngineeringSettings();
  const { detailedHelp, setDetailedHelp } = useDetailedHelp();
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');
  const countries = useMemo(() => {
    const needle = countryQuery.trim().toLocaleLowerCase('hu');
    if (!needle) return EUROPEAN_JURISDICTIONS;
    return EUROPEAN_JURISDICTIONS.filter(([code, name]) => `${code} ${name}`.toLocaleLowerCase('hu').includes(needle));
  }, [countryQuery]);
  const status = jurisdictionStatus(jurisdiction);

  return <View style={{ flex: 1, backgroundColor: BG }}>
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 22, paddingBottom: 80, gap: 14 }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 18 }}>
        <TouchableOpacity onPress={onClose ?? (() => router.back())} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Vissza"><ChevronLeft size={24} color="#60A5FA" /></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={{ color: TEXT, fontSize: 27, fontWeight: '900' }}>Beállítások</Text><Text style={{ color: MUTED, fontSize: 13, marginTop: 2 }}>Nyelv, szabványrégió és számítási mód</Text></View>
      </View>

      <Section title="1. Számítási mód">
        <ChoiceCard title="Mérnöki számítás" detail="Akkor használd, ha minden szükséges mérési és gyártói adat rendelkezésre áll. Hiányzó kötelező adatnál az app jelzi, hogy az eredmény csak mérnöki ajánlásként adható ki." selected={calculationMode === 'complete-engineering'} onPress={() => setCalculationMode('complete-engineering' as CalculationMode)} />
        <ChoiceCard title="Mérnöki ajánlás" detail="Akkor használd, ha nem ismersz minden pontos adatot. Az app ellenőrzött általános értékekkel számol, és jól láthatóan felsorolja a feltételezéseket és a bizonytalanságokat." selected={calculationMode === 'guided-recommendation'} onPress={() => setCalculationMode('guided-recommendation' as CalculationMode)} color={YELLOW} />
      </Section>

      <Section title="2. Nyelv">
        <Text style={{ color: MUTED, lineHeight: 19 }}>A kezelőfelület nyelve nem változtatja meg az alkalmazott országot vagy szabványt.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{APP_LANGUAGES.map(item => {
          const selected = language === item.code;
          return <TouchableOpacity key={item.code} onPress={() => setLanguage(item.code as AppLanguage)} style={{ backgroundColor: selected ? `${BLUE}24` : SURFACE, borderColor: selected ? BLUE : BORDER, borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 }}><Text style={{ color: selected ? '#FFFFFF' : MUTED, fontWeight: '800' }}>{item.label}</Text></TouchableOpacity>;
        })}</View>
        {language !== 'hu' && <Text style={{ color: YELLOW, fontSize: 13, lineHeight: 19 }}>A teljes szakmai fordítás még ellenőrzés alatt áll. Biztonsági és felelősségi szöveg hiányos fordítással nem kerülhet nyilvános kiadásba.</Text>}
      </Section>

      <Section title="3. Ország és szabványrégió">
        <Text style={{ color: MUTED, lineHeight: 19 }}>A számítás az európai EN/CEN alapmódszert és a kiválasztott ország nemzeti kiegészítéseit használja. A nyelv ettől független.</Text>
        <TouchableOpacity onPress={() => setCountryOpen(true)} style={{ backgroundColor: SURFACE, borderColor: BLUE, borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}><Globe2 size={21} color={BLUE} /><View style={{ flex: 1 }}><Text style={{ color: TEXT, fontSize: 16, fontWeight: '900' }}>{jurisdictionName(jurisdiction)}</Text><Text style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>{jurisdiction} · EN/CEN + nemzeti kiegészítések</Text></View><ChevronRight size={20} color={MUTED} /></TouchableOpacity>
        <View style={{ backgroundColor: `${status === 'verified' ? GREEN : YELLOW}12`, borderColor: `${status === 'verified' ? GREEN : YELLOW}66`, borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', gap: 9 }}><ShieldCheck size={19} color={status === 'verified' ? GREEN : YELLOW} /><View style={{ flex: 1 }}><Text style={{ color: status === 'verified' ? GREEN : YELLOW, fontWeight: '900' }}>{jurisdictionStatusLabel(status)}</Text><Text style={{ color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 3 }}>Az app nem állít nemzeti megfelelőséget addig, amíg a jogtiszta szabványmódszer és az országos szakmai ellenőrzés nincs lezárva.</Text></View></View>
      </Section>

      <Section title="4. Részletes segítség">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ flex: 1 }}><Text style={{ color: TEXT, fontWeight: '900' }}>Lépésenkénti magyarázat</Text><Text style={{ color: MUTED, fontSize: 13, lineHeight: 18, marginTop: 3 }}>Bekapcsolva hétköznapi nyelven elmagyarázza, mit kell megadni és miért.</Text></View><Switch value={detailedHelp} onValueChange={setDetailedHelp} /></View>
      </Section>

      <Section title="Európai számítási alapok">
        <Text style={{ color: MUTED, fontSize: 13, lineHeight: 19 }}>Ezek a közös európai alapok. A pontos kiadás, nemzeti melléklet és helyi jogszabály külön országprofilhoz tartozik.</Text>
        {EUROPEAN_CORE_STANDARDS.map(item => <View key={item.id} style={{ borderTopColor: BORDER, borderTopWidth: 1, paddingTop: 10 }}><Text style={{ color: BLUE, fontWeight: '900' }}>{item.id}</Text><Text style={{ color: TEXT, fontSize: 13, fontWeight: '700', marginTop: 2 }}>{item.title}</Text><Text style={{ color: MUTED, fontSize: 12, lineHeight: 17, marginTop: 2 }}>{item.role}</Text></View>)}
      </Section>
    </ScrollView>

    <Modal visible={countryOpen} animationType="slide" transparent onRequestClose={() => setCountryOpen(false)}>
      <View style={{ flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' }}><View style={{ backgroundColor: CARD, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '88%', padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}><Text style={{ color: TEXT, fontSize: 20, fontWeight: '900', flex: 1 }}>Számítás országa</Text><TouchableOpacity onPress={() => setCountryOpen(false)} style={{ padding: 8 }}><X size={22} color={MUTED} /></TouchableOpacity></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderColor: BORDER, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 10 }}><Search size={18} color={MUTED} /><TextInput value={countryQuery} onChangeText={setCountryQuery} placeholder="Ország keresése…" placeholderTextColor="#66717E" style={{ color: TEXT, fontSize: 15, padding: 12, flex: 1 }} /></View>
        <ScrollView keyboardShouldPersistTaps="handled">{countries.map(([code, name]) => <TouchableOpacity key={code} onPress={() => { setJurisdiction(code as JurisdictionCode); setCountryOpen(false); setCountryQuery(''); }} style={{ paddingVertical: 13, borderBottomColor: BORDER, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' }}><View style={{ flex: 1 }}><Text style={{ color: jurisdiction === code ? BLUE : TEXT, fontSize: 16, fontWeight: '800' }}>{name}</Text><Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>{code} · nemzeti ellenőrzési profil</Text></View>{jurisdiction === code && <Check size={20} color={BLUE} />}</TouchableOpacity>)}</ScrollView>
      </View></View>
    </Modal>
  </View>;
}
