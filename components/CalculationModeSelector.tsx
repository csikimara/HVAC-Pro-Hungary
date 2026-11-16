import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Calculator, ClipboardCheck } from 'lucide-react-native';
import { useEngineeringSettings } from '@/contexts/EngineeringSettingsContext';

const BLUE = '#1E90FF';
const AMBER = '#F59E0B';
const BORDER = '#2A2F38';

export function CalculationModeSelector() {
  const { calculationMode, setCalculationMode } = useEngineeringSettings();
  const complete = calculationMode === 'complete-engineering';

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: '#E8ECF0', fontSize: 14, fontWeight: '900', marginBottom: 8 }}>Melyik számítási módot szeretnéd használni?</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ selected: complete }}
          onPress={() => setCalculationMode('complete-engineering')}
          style={{ flex: 1, minWidth: 150, borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: complete ? BLUE : BORDER, backgroundColor: complete ? `${BLUE}22` : '#11151A' }}
        >
          <Calculator size={19} color={complete ? BLUE : '#98A3AF'} />
          <Text style={{ color: complete ? '#FFFFFF' : '#D1D7DE', fontWeight: '900', marginTop: 7 }}>Mérnöki számítás</Text>
          <Text style={{ color: '#98A3AF', fontSize: 12, lineHeight: 17, marginTop: 3 }}>Akkor válaszd, ha minden szükséges mérési és gyártói adat rendelkezésre áll. A hiányzó adatokat az app jelzi.</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ selected: !complete }}
          onPress={() => setCalculationMode('guided-recommendation')}
          style={{ flex: 1, minWidth: 150, borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: !complete ? AMBER : BORDER, backgroundColor: !complete ? `${AMBER}18` : '#11151A' }}
        >
          <ClipboardCheck size={19} color={!complete ? AMBER : '#98A3AF'} />
          <Text style={{ color: !complete ? '#FFFFFF' : '#D1D7DE', fontWeight: '900', marginTop: 7 }}>Mérnöki ajánlás</Text>
          <Text style={{ color: '#98A3AF', fontSize: 12, lineHeight: 17, marginTop: 3 }}>Akkor válaszd, ha nem ismersz minden pontos adatot. Az app ellenőrzött általános értékekkel számol, és felsorolja a feltételezéseket.</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
