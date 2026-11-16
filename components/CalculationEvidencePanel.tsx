import React from 'react';
import { Text, View } from 'react-native';
import { useEngineeringSettings } from '@/contexts/EngineeringSettingsContext';
import { jurisdictionName, jurisdictionStatus, jurisdictionStatusLabel } from '@/domain/engineeringStandards';

export function CalculationEvidencePanel({ method, inputs, assumptions, source, accuracy, verification }: { method: string; inputs: string; assumptions: string; source: string; accuracy: string; verification: string }) {
  const { jurisdiction } = useEngineeringSettings();
  const rows = [
    ['1', 'Módszer', method], ['2', 'Bemenő adatok', inputs], ['3', 'Feltételezések', assumptions], ['4', 'Adatforrás', source],
    ['5', 'Pontossági osztály', accuracy], ['6', 'Ország és szabvány', `${jurisdictionName(jurisdiction)} · ${jurisdictionStatusLabel(jurisdictionStatus(jurisdiction))}`], ['7', 'Végleges ellenőrzés', verification],
  ];
  return <View style={{ backgroundColor: '#10151B', borderColor: '#2A2F38', borderWidth: 1, borderRadius: 12, padding: 12, gap: 9 }}>
    <Text style={{ color: '#E8ECF0', fontSize: 14, fontWeight: '900' }}>A számítás dokumentációja</Text>
    {rows.map(([number, label, value]) => <View key={number} style={{ flexDirection: 'row', gap: 9 }}><View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#1E90FF22', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#60A5FA', fontSize: 11, fontWeight: '900' }}>{number}</Text></View><View style={{ flex: 1 }}><Text style={{ color: '#D1D7DE', fontSize: 12, fontWeight: '900' }}>{label}</Text><Text style={{ color: '#98A3AF', fontSize: 12, lineHeight: 17, marginTop: 2 }}>{value}</Text></View></View>)}
  </View>;
}
