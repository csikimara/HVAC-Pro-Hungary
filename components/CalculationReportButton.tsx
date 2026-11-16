import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { FileCheck2 } from 'lucide-react-native';
import { useCalculationArchive } from '@/contexts/CalculationArchiveContext';
import type { NewCalculationRecord } from '@/domain/calculationRecord';

export function CalculationReportButton({ buildRecord, disabled = false }: { buildRecord: () => NewCalculationRecord; disabled?: boolean }) {
  const { saveCalculation } = useCalculationArchive();
  const [message, setMessage] = useState('');
  return <View style={{ marginTop: 12 }}>
    <TouchableOpacity
      disabled={disabled}
      onPress={() => {
        const record = saveCalculation(buildRecord());
        setMessage(`Jegyzőkönyv elmentve: ${record.id}`);
      }}
      style={{ backgroundColor: disabled ? '#374151' : '#2563EB', borderRadius: 11, padding: 13, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }}
    >
      <FileCheck2 size={18} color="#FFFFFF" />
      <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Számítás és bemenetek mentése</Text>
    </TouchableOpacity>
    {message ? <Text style={{ color: '#22C55E', textAlign: 'center', fontSize: 12, fontWeight: '800', marginTop: 7 }}>{message}</Text> : null}
    <Text style={{ color: '#7A8694', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 5 }}>{Platform.OS === 'web' ? 'A Mentett számítások képernyőn nyomtatható vagy PDF-ként menthető.' : 'A jegyzőkönyv helyben, változatlan bemenetekkel kerül az archívumba.'}</Text>
  </View>;
}
