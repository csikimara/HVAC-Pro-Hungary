import React from 'react';
import { View, Text } from 'react-native';
import { BadgeCheck, Calculator, TriangleAlert } from 'lucide-react-native';

export type AccuracyLevel = 'manufacturer' | 'engineering' | 'estimate';

const LEVELS = {
  manufacturer: { title: 'Gyártói adat', detail: 'Konkrét termék hivatalos adatlapjából.', color: '#22C55E', Icon: BadgeCheck },
  engineering: { title: 'Mérnöki számítás', detail: 'Ellenőrzött képletből, a megadott adatokkal.', color: '#1E90FF', Icon: Calculator },
  estimate: { title: 'Becsült érték', detail: 'Általános feltételezést használ; helyszíni döntéshez ellenőrizd.', color: '#F59E0B', Icon: TriangleAlert },
} as const;

export function AccuracyNotice({ level, note }: { level: AccuracyLevel; note?: string }) {
  const item = LEVELS[level];
  const Icon = item.Icon;
  return (
    <View style={{ backgroundColor: `${item.color}12`, borderColor: `${item.color}66`, borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', gap: 10, marginBottom: 14 }}>
      <Icon size={19} color={item.color} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: item.color, fontSize: 14, fontWeight: '800' }}>{item.title}</Text>
        <Text style={{ color: '#A7B0BC', fontSize: 13, lineHeight: 18, marginTop: 2 }}>{note ?? item.detail}</Text>
      </View>
    </View>
  );
}

export function ToolGuide({ title, useWhen, needs, accuracy, accuracyNote }: {
  title: string; useWhen: string; needs: string; accuracy: AccuracyLevel; accuracyNote?: string;
}) {
  return (
    <View style={{ backgroundColor: '#161A1F', borderColor: '#2A2F38', borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 }}>
      <Text style={{ color: '#E8ECF0', fontSize: 20, fontWeight: '800', marginBottom: 12 }}>{title}</Text>
      <Text style={{ color: '#60A5FA', fontSize: 13, fontWeight: '800', marginBottom: 4 }}>AKKOR HASZNÁLD, HA…</Text>
      <Text style={{ color: '#D1D7DE', fontSize: 15, lineHeight: 21, marginBottom: 12 }}>{useWhen}</Text>
      <Text style={{ color: '#60A5FA', fontSize: 13, fontWeight: '800', marginBottom: 4 }}>EZT KELL MEGADNOD</Text>
      <Text style={{ color: '#D1D7DE', fontSize: 15, lineHeight: 21, marginBottom: 14 }}>{needs}</Text>
      <AccuracyNotice level={accuracy} note={accuracyNote} />
    </View>
  );
}
