import React from 'react';
import { Text, View } from 'react-native';
import { Calculator, TriangleAlert } from 'lucide-react-native';
import { useEngineeringSettings } from '@/contexts/EngineeringSettingsContext';
import { jurisdictionName, jurisdictionStatus, jurisdictionStatusLabel } from '@/domain/engineeringStandards';

export function EngineeringModeBanner({ compact = false }: { compact?: boolean }) {
  const { calculationMode, jurisdiction } = useEngineeringSettings();
  const complete = calculationMode === 'complete-engineering';
  const status = jurisdictionStatus(jurisdiction);
  const color = complete ? '#1E90FF' : '#F59E0B';
  const Icon = complete ? Calculator : TriangleAlert;
  return <View style={{ backgroundColor: `${color}12`, borderColor: `${color}66`, borderWidth: 1, borderRadius: 13, padding: 12, marginBottom: 14, flexDirection: 'row', gap: 10 }}>
    <Icon size={19} color={color} />
    <View style={{ flex: 1 }}>
      <Text style={{ color, fontWeight: '900', fontSize: 14 }}>{complete ? 'Mérnöki számítás' : 'Mérnöki ajánlás'}</Text>
      <Text style={{ color: '#D1D7DE', fontSize: 13, lineHeight: 18, marginTop: 2 }}>{jurisdictionName(jurisdiction)} · EN/CEN + nemzeti kiegészítések</Text>
      {!compact && <Text style={{ color: status === 'verified' ? '#22C55E' : '#FBBF24', fontSize: 12, fontWeight: '800', marginTop: 4 }}>{jurisdictionStatusLabel(status)}</Text>}
      {!compact && complete && status !== 'verified' && <Text style={{ color: '#A7B0BC', fontSize: 12, lineHeight: 17, marginTop: 4 }}>A részletes számítás eredménye használható tervezési alap, de nemzeti megfelelőségi nyilatkozat csak lezárt országprofillal és a kötelező adatok teljes kitöltésével készülhet.</Text>}
    </View>
  </View>;
}
