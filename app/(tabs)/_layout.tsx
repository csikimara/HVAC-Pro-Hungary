import React from 'react';
import { View, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

const { width: screenWidth } = Dimensions.get('window');

const TABS: TabBarItem[] = [
  { name: '(home)', route: '/(tabs)/(home)', icon: 'home', label: 'Kezdőlap' },
  { name: '(atvalto)', route: '/(tabs)/(atvalto)', icon: 'swap-horiz', label: 'Átváltók' },
  { name: '(legtechnika)', route: '/(tabs)/(legtechnika)', icon: 'air', label: 'Légtechnika' },
  { name: '(hutestechnika)', route: '/(tabs)/(hutestechnika)', icon: 'ac-unit', label: 'Hűtés' },
  { name: '(villany)', route: '/(tabs)/(villany)', icon: 'bolt', label: 'Villany' },
  { name: '(diagnosztika)', route: '/(tabs)/(diagnosztika)', icon: 'analytics', label: 'Diagnosz.' },
  { name: '(kedvencek)', route: '/(tabs)/(kedvencek)', icon: 'star', label: 'Kedvencek' },
];

export default function TabLayout() {
  console.log('[TabLayout] Rendering tab layout');
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="(home)" />
        <Stack.Screen name="(atvalto)" />
        <Stack.Screen name="(legtechnika)" />
        <Stack.Screen name="(hutestechnika)" />
        <Stack.Screen name="(villany)" />
        <Stack.Screen name="(diagnosztika)" />
        <Stack.Screen name="(kedvencek)" />
      </Stack>
      <FloatingTabBar
        tabs={TABS}
        containerWidth={screenWidth - 16}
        borderRadius={20}
        bottomMargin={12}
      />
    </View>
  );
}
