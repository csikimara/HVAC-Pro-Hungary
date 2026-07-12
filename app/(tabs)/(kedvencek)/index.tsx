import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { Star, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const HVAC_BG = '#0D0F12';
const HVAC_TEXT = '#E8ECF0';
const HVAC_TEXT_SECONDARY = '#7A8694';
const HVAC_BLUE = '#1E90FF';
const ACCENT = '#A855F7';

export default function KedvencekScreen() {
  console.log('[Kedvencek] Screen mounted');
  const router = useRouter();
  const backBtn = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: 16,
    marginTop: 24,
    alignSelf: 'flex-start' as const,
  };
  const backBtnText = {
    fontSize: 13,
    color: HVAC_BLUE,
    fontWeight: '500' as const,
  };
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: HVAC_BG }}
      contentContainerStyle={{
        flex: 1,
        paddingBottom: 100,
        paddingHorizontal: 24,
        paddingTop: 16,
      }}
    >
      <TouchableOpacity
        style={backBtn}
        onPress={() => {
          console.log('[Kedvencek] Vissza a kezdőlapra');
          router.push('/(tabs)/(home)');
        }}
        activeOpacity={0.7}
      >
        <ChevronLeft size={16} color={HVAC_BLUE} />
        <Text style={backBtnText}>Vissza a kezdőlapra</Text>
      </TouchableOpacity>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
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
        <Star size={40} color={ACCENT} />
      </View>
      <Text style={{ fontSize: 24, fontWeight: '700', color: HVAC_TEXT, marginBottom: 8, textAlign: 'center' }}>
        Kedvencek
      </Text>
      <Text style={{ fontSize: 14, color: HVAC_TEXT_SECONDARY, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
        Mentett és leggyakrabban használt számítások
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
      </View>
    </ScrollView>
  );
}
