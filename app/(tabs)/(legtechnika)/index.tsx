import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { Wind } from 'lucide-react-native';

const HVAC_BG = '#0D0F12';
const HVAC_TEXT = '#E8ECF0';
const HVAC_TEXT_SECONDARY = '#7A8694';
const HVAC_BLUE = '#1E90FF';
const ACCENT = '#06B6D4';

export default function LegtechnikaScreen() {
  console.log('[Légtechnika] Screen mounted');
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: HVAC_BG }}
      contentContainerStyle={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 100,
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: ACCENT + '22',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Wind size={40} color={ACCENT} />
      </View>
      <Text style={{ fontSize: 24, fontWeight: '700', color: HVAC_TEXT, marginBottom: 8, textAlign: 'center' }}>
        Légtechnika
      </Text>
      <Text style={{ fontSize: 14, color: HVAC_TEXT_SECONDARY, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
        Légcsatorna méretezés és légsebesség számítás
      </Text>
      <View
        style={{
          backgroundColor: HVAC_BLUE + '22',
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 6,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '600', color: HVAC_BLUE }}>
          Hamarosan elérhető
        </Text>
      </View>
    </ScrollView>
  );
}
