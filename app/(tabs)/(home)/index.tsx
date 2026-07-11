import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeftRight,
  Wind,
  Snowflake,
  Zap,
  Activity,
  Star,
} from 'lucide-react-native';

const HVAC_BG = '#0D0F12';
const HVAC_CARD = '#161A1F';
const HVAC_BORDER = '#2A2F38';
const HVAC_TEXT = '#E8ECF0';
const HVAC_TEXT_SECONDARY = '#7A8694';
const HVAC_BLUE = '#1E90FF';

interface ModuleCard {
  title: string;
  description: string;
  route: string;
  color: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
}

const MODULE_CARDS: ModuleCard[] = [
  {
    title: 'Átváltók',
    description: 'Mértékegység-átváltók',
    route: '/(tabs)/(atvalto)',
    color: '#1E90FF',
    Icon: ArrowLeftRight,
  },
  {
    title: 'Légtechnika',
    description: 'Légcsatorna, légsebesség',
    route: '/(tabs)/(legtechnika)',
    color: '#06B6D4',
    Icon: Wind,
  },
  {
    title: 'Hűtéstechnika',
    description: 'Hűtőközeg, teljesítmény',
    route: '/(tabs)/(hutestechnika)',
    color: '#3B82F6',
    Icon: Snowflake,
  },
  {
    title: 'Villany',
    description: 'Elektromos számítások',
    route: '/(tabs)/(villany)',
    color: '#F59E0B',
    Icon: Zap,
  },
  {
    title: 'Diagnosztika',
    description: 'Hibakeresés, mérések',
    route: '/(tabs)/(diagnosztika)',
    color: '#22C55E',
    Icon: Activity,
  },
  {
    title: 'Kedvencek',
    description: 'Mentett számítások',
    route: '/(tabs)/(kedvencek)',
    color: '#A855F7',
    Icon: Star,
  },
];

const STATS = [
  { value: '6', label: 'Modul' },
  { value: '50+', label: 'Számítás' },
  { value: 'Magyar', label: 'Nyelv' },
];

export default function HomeScreen() {
  const router = useRouter();

  const handleModulePress = (title: string, route: string) => {
    console.log(`[Home] Module card pressed: ${title}, navigating to ${route}`);
    router.push(route as any);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: HVAC_BG }}
      contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ paddingTop: 60, paddingBottom: 24, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: HVAC_TEXT, letterSpacing: -0.5 }}>
            HVAC Pro
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: HVAC_BLUE }}>
            Hungary
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: HVAC_TEXT_SECONDARY, marginTop: 4, letterSpacing: 0.2 }}>
          Szakmai számítások és átváltók
        </Text>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
        {STATS.map((stat) => (
          <View
            key={stat.label}
            style={{
              flex: 1,
              backgroundColor: HVAC_CARD,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: HVAC_BORDER,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: HVAC_BLUE }}>
              {stat.value}
            </Text>
            <Text style={{ fontSize: 11, color: HVAC_TEXT_SECONDARY, marginTop: 2 }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Section title */}
      <Text style={{ fontSize: 18, fontWeight: '700', color: HVAC_TEXT, marginBottom: 14 }}>
        Modulok
      </Text>

      {/* 2-column grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {MODULE_CARDS.map((card) => {
          const CardIcon = card.Icon;
          return (
            <TouchableOpacity
              key={card.title}
              activeOpacity={0.75}
              onPress={() => handleModulePress(card.title, card.route)}
              style={{
                width: '47.5%',
                backgroundColor: HVAC_CARD,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: HVAC_BORDER,
                padding: 16,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: card.color + '22',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <CardIcon size={22} color={card.color} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: HVAC_TEXT, marginBottom: 4 }}>
                {card.title}
              </Text>
              <Text style={{ fontSize: 12, color: HVAC_TEXT_SECONDARY, lineHeight: 17 }}>
                {card.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
