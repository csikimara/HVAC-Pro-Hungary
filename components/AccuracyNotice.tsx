import React from 'react';
import { View, Text } from 'react-native';
import { BadgeCheck, Calculator, TriangleAlert } from 'lucide-react-native';
import { HelpToggle, useDetailedHelp } from '@/contexts/HelpContext';
import { useEngineeringSettings } from '@/contexts/EngineeringSettingsContext';
import type { AccuracyLevel } from '@/domain/calculationQuality';
import { jurisdictionName, jurisdictionStatus, jurisdictionStatusLabel } from '@/domain/engineeringStandards';
import { CalculationModeSelector } from '@/components/CalculationModeSelector';
import { CalculationEvidencePanel } from '@/components/CalculationEvidencePanel';

export type { AccuracyLevel } from '@/domain/calculationQuality';

const LEVELS = {
  manufacturer: { title: 'Gyártói adat', detail: 'Konkrét termék hivatalos adatlapjából.', color: '#22C55E', Icon: BadgeCheck },
  engineering: { title: 'Mérnöki számítás', detail: 'Ellenőrzött módszer, teljes és megfelelő pontosságú bemeneti adatokkal. A helyszíni ellenőrzést és beszabályozást nem helyettesíti.', color: '#1E90FF', Icon: Calculator },
  'engineering-estimate': { title: 'Mérnöki ajánlás', detail: 'Elfogadott mérnöki módszer, de legalább egy bemeneti adat általános vagy feltételezett.', color: '#F59E0B', Icon: Calculator },
  estimate: { title: 'ELŐMÉRETEZÉS', detail: 'Egyszerűsített vagy hiányos bemenetből készült eredmény. Végleges méretezésre önmagában nem használható.', color: '#F97316', Icon: TriangleAlert },
} as const;

export function AccuracyNotice({ level, note }: { level: AccuracyLevel; note?: string }) {
  const item = LEVELS[level];
  const Icon = item.Icon;
  const { calculationMode, jurisdiction } = useEngineeringSettings();
  const requestedFull = calculationMode === 'complete-engineering';
  const resultIsFull = level === 'engineering' || level === 'manufacturer';
  const regionStatus = jurisdictionStatus(jurisdiction);
  return (
    <View style={{ backgroundColor: `${item.color}12`, borderColor: `${item.color}66`, borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', gap: 10, marginBottom: 14 }}>
      <Icon size={19} color={item.color} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: item.color, fontSize: 14, fontWeight: '800' }}>{item.title}</Text>
        <Text style={{ color: '#A7B0BC', fontSize: 13, lineHeight: 18, marginTop: 2 }}>{note ?? item.detail}</Text>
        <View style={{ borderTopColor: `${item.color}44`, borderTopWidth: 1, marginTop: 8, paddingTop: 7 }}>
          <Text style={{ color: '#D1D7DE', fontSize: 12, fontWeight: '800' }}>Kiválasztott mód: {requestedFull ? 'Mérnöki számítás' : 'Mérnöki ajánlás'} · {jurisdictionName(jurisdiction)}</Text>
          <Text style={{ color: resultIsFull ? '#22C55E' : '#FBBF24', fontSize: 12, fontWeight: '800', lineHeight: 17, marginTop: 3 }}>Az eredmény minősítése: {resultIsFull ? 'Mérnöki számítás' : level === 'estimate' ? 'Előméretezés' : 'Mérnöki ajánlás'}</Text>
          {requestedFull && !resultIsFull && <Text style={{ color: '#FBBF24', fontSize: 12, lineHeight: 17, marginTop: 3 }}>A jelenlegi adatok nem elegendők mérnöki számításhoz, ezért az eredmény mérnöki ajánlásként jelenik meg.</Text>}
          {regionStatus !== 'verified' && <Text style={{ color: '#98A3AF', fontSize: 11, lineHeight: 16, marginTop: 3 }}>{jurisdictionStatusLabel(regionStatus)}.</Text>}
        </View>
      </View>
    </View>
  );
}

export function ToolGuide({ title, useWhen, needs, accuracy, accuracyNote, method, assumptions, source, verification }: {
  title: string; useWhen: string; needs: string; accuracy: AccuracyLevel; accuracyNote?: string;
  method?: string; assumptions?: string; source?: string; verification?: string;
}) {
  const { detailedHelp } = useDetailedHelp();
  const { calculationMode, jurisdiction } = useEngineeringSettings();
  const complete = calculationMode === 'complete-engineering';
  return (
    <>
      <HelpToggle />
      <View style={{ backgroundColor: '#161A1F', borderColor: '#2A2F38', borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <Text style={{ color: '#E8ECF0', fontSize: 20, fontWeight: '800', marginBottom: detailedHelp ? 12 : 8 }}>{title}</Text>
        <CalculationModeSelector />
        {detailedHelp && <>
          <Text style={{ color: '#60A5FA', fontSize: 13, fontWeight: '800', marginBottom: 4 }}>MIKOR HASZNÁLD?</Text>
          <Text style={{ color: '#D1D7DE', fontSize: 15, lineHeight: 21, marginBottom: 12 }}>{useWhen}</Text>
          <Text style={{ color: '#60A5FA', fontSize: 13, fontWeight: '800', marginBottom: 4 }}>MIT KELL MEGADNOD?</Text>
          <Text style={{ color: '#D1D7DE', fontSize: 15, lineHeight: 21, marginBottom: 14 }}>{needs}</Text>
        </>}
        <AccuracyNotice level={accuracy} note={accuracyNote} />
        <CalculationEvidencePanel method={method ?? 'A modul eredményénél megnevezett fizikai vagy mérnöki összefüggés.'} inputs={needs} assumptions={complete ? 'Teljes módban minden kötelező adatot konkrét értékkel kell megadni; a program a hiányokat külön jelzi.' : (assumptions ?? 'A választómezőkhöz rendelt tipikus jellemzők; ezek a mentett jegyzőkönyvben tételesen szerepelnek.')} source={source ?? 'A modulban felsorolt szabványos, mérnöki vagy igazolt gyártói forrás.'} accuracy={LEVELS[accuracy].title} verification={verification ?? 'A számított tervezési értéket helyszíni mérés, beszabályozás és szükség esetén jogosult szakági tervező ellenőrzése zárja le.'} />
      </View>
    </>
  );
}
