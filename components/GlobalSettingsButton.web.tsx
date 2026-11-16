import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';

export function GlobalSettingsButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === '/settings' || typeof document === 'undefined') return null;

  return createPortal(
    <TouchableOpacity
      onPress={() => router.push('/?settings=1' as never)}
      accessibilityRole="button"
      accessibilityLabel="Beállítások"
      style={{
        position: 'fixed' as 'absolute',
        top: 48,
        right: 16,
        zIndex: 2_147_483_647,
        width: 46,
        height: 46,
        borderRadius: 23,
        borderColor: '#2A2F38',
        borderWidth: 1,
        backgroundColor: '#1C2128EE',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Settings size={22} color="#60A5FA" />
    </TouchableOpacity>,
    document.body,
  );
}
