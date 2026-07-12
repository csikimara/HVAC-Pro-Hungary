import React from 'react';
import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }} initialRouteName="(home)">
      <Stack.Screen name="(home)" />
      <Stack.Screen name="(atvalto)" />
      <Stack.Screen name="(legtechnika)" />
      <Stack.Screen name="(hutestechnika)" />
      <Stack.Screen name="(villany)" />
      <Stack.Screen name="(diagnosztika)" />
      <Stack.Screen name="(kedvencek)" />
    </Stack>
  );
}
