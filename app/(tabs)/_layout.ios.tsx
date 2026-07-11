import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  console.log('[TabLayout iOS] Rendering native tabs');
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(home)">
        <Icon sf="house.fill" />
        <Label>Kezdőlap</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(atvalto)">
        <Icon sf="arrow.left.arrow.right" />
        <Label>Átváltók</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(legtechnika)">
        <Icon sf="wind" />
        <Label>Légtechnika</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(hutestechnika)">
        <Icon sf="snowflake" />
        <Label>Hűtéstechnika</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(villany)">
        <Icon sf="bolt.fill" />
        <Label>Villany</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(diagnosztika)">
        <Icon sf="waveform.path.ecg" />
        <Label>Diagnosztika</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(kedvencek)">
        <Icon sf="star.fill" />
        <Label>Kedvencek</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
