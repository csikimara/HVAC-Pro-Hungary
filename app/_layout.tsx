import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack, useGlobalSearchParams, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Alert, View } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { HelpProvider } from "@/contexts/HelpContext";
import { SavedRoomsProvider } from "@/contexts/SavedRoomsContext";
import { EngineeringSettingsProvider } from "@/contexts/EngineeringSettingsContext";
import { CalculationArchiveProvider } from "@/contexts/CalculationArchiveContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalSettingsButton } from "@/components/GlobalSettingsButton";
import SettingsScreen from "./settings";
// Note: Error logging is auto-initialized via index.ts import

// Only wrap with ErrorBoundary in dev — production apps should not include it
const DevErrorBoundary = __DEV__
  ? ErrorBoundary
  : ({ children }: { children: React.ReactNode }) => <>{children}</>;

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)", // Ensure any route can link back to `/`
};

export default function RootLayout() {
  const router = useRouter();
  const params = useGlobalSearchParams<{ settings?: string }>();
  const showSettings = params.settings === "1";
  const networkState = useNetworkState();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "🔌 You are offline",
        "You can keep using the app! Your changes will be saved locally and synced when you are back online."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "rgb(30, 144, 255)",
      background: "rgb(13, 15, 18)",
      card: "rgb(22, 26, 31)",
      text: "rgb(232, 236, 240)",
      border: "rgb(42, 47, 56)",
      notification: "rgb(239, 68, 68)",
    },
  };
  return (
    <DevErrorBoundary>
      <StatusBar style="light" animated />
        <ThemeProvider
          value={CustomDarkTheme}
        >
          <SafeAreaProvider>
            <WidgetProvider>
              <EngineeringSettingsProvider>
              <CalculationArchiveProvider>
              <HelpProvider>
              <SavedRoomsProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
              <View style={{ flex: 1 }}>
                {showSettings ? (
                  <SettingsScreen onClose={() => router.back()} />
                ) : (
                  <>
                    <Stack>
                      {/* Main app with tabs */}
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="settings" options={{ headerShown: false, presentation: "card" }} />
                    </Stack>
                    <GlobalSettingsButton />
                  </>
                )}
                <SystemBars style={"auto"} />
              </View>
              </GestureHandlerRootView>
              </SavedRoomsProvider>
              </HelpProvider>
              </CalculationArchiveProvider>
              </EngineeringSettingsProvider>
            </WidgetProvider>
          </SafeAreaProvider>
        </ThemeProvider>
    </DevErrorBoundary>
  );
}
