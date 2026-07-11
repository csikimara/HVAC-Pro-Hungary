import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Home,
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
    title: 'Kezdőlap',
    description: 'Főoldal és modulok áttekintése',
    route: '/(tabs)/(home)',
    color: '#1E90FF',
    Icon: Home,
  },
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

      {/* Full-width single-column tile list */}
      <View style={{ gap: 12 }}>
        {MODULE_CARDS.map((card) => {
          const CardIcon = card.Icon;
          return (
            <TouchableOpacity
              key={card.title}
              activeOpacity={0.75}
              onPress={() => handleModulePress(card.title, card.route)}
              style={{
                width: '100%',
                backgroundColor: HVAC_CARD,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: HVAC_BORDER,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: card.color + '22',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}
              >
                <CardIcon size={26} color={card.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: HVAC_TEXT, marginBottom: 4 }}>
                  {card.title}
                </Text>
                <Text style={{ fontSize: 13, color: HVAC_TEXT_SECONDARY, lineHeight: 18 }}>
                  {card.description}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
