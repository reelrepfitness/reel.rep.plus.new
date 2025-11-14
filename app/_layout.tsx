import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { I18nManager, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/contexts/auth";
import { ToastProvider } from "@/components/ui/toast";
import {
  initializeNotifications,
  cleanupNotifications,
} from "@/lib/pushNotifications";
import { enableConnectionMonitoring } from "@/lib/connectionHelper";

if (!I18nManager.isRTL && Platform.OS !== "web") {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  };

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack 
      screenOptions={{ 
        headerBackTitle: "חזור",
        animation: I18nManager.isRTL ? 'slide_from_left' : 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();

    if (__DEV__) {
      const cleanupConnection = enableConnectionMonitoring();
      if (cleanupConnection) {
        return cleanupConnection;
      }
    }

    initializeNotifications(undefined, async (token: string) => {
      console.log("[Push] Expo push token:", token);
    });

    return () => {
      cleanupNotifications();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}