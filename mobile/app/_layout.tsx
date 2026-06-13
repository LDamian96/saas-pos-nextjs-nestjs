// =============================================================================
// _layout.tsx — Root layout.
// Mulish fonts + telemetría remota + tracking de rutas + transiciones suaves.
// =============================================================================

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import {
  useFonts,
  Mulish_400Regular,
  Mulish_500Medium,
  Mulish_600SemiBold,
  Mulish_700Bold,
  Mulish_800ExtraBold,
  Mulish_900Black,
} from '@expo-google-fonts/mulish';

import { useAuthStore } from '@/stores/auth.store';
import { AnimatedSplash } from '@/components/splash-screen';
import {
  installGlobalErrorHandlers,
  remoteLogger,
  setLoggerRoute,
  setLoggerSession,
} from '@/services/remote-logger';
import { colors, fonts } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    primary: colors.brand,
  },
};

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: colors.success,
        borderLeftWidth: 5,
        backgroundColor: colors.surface,
        borderRadius: 14,
        elevation: 12,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        marginHorizontal: 12,
        minHeight: 56,
        height: undefined,
        paddingVertical: 10,
      }}
      contentContainerStyle={{ paddingHorizontal: 14 }}
      text1Style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.text }}
      text2Style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted, marginTop: 2 }}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: colors.danger,
        borderLeftWidth: 5,
        backgroundColor: colors.surface,
        borderRadius: 14,
        elevation: 12,
        marginHorizontal: 12,
        minHeight: 56,
        height: undefined,
        paddingVertical: 10,
      }}
      contentContainerStyle={{ paddingHorizontal: 14 }}
      text1Style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.danger }}
      text2Style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted, marginTop: 2 }}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: colors.brand,
        borderLeftWidth: 5,
        backgroundColor: colors.surface,
        borderRadius: 14,
        elevation: 12,
        marginHorizontal: 12,
        minHeight: 56,
        height: undefined,
        paddingVertical: 10,
      }}
      contentContainerStyle={{ paddingHorizontal: 14 }}
      text1Style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.brand }}
      text2Style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted, marginTop: 2 }}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
    />
  ),
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false } },
});

export default function RootLayout() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const usuario = useAuthStore((s) => s.usuario);
  const [splashDone, setSplashDone] = useState(false);
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    Mulish_400Regular,
    Mulish_500Medium,
    Mulish_600SemiBold,
    Mulish_700Bold,
    Mulish_800ExtraBold,
    Mulish_900Black,
  });

  useEffect(() => {
    installGlobalErrorHandlers();
    remoteLogger.info('app_opened');
    checkAuth();
    SplashScreen.hideAsync().catch(() => {});

    try {
      const { useNetworkStore } = require('@/stores/network.store');
      const sync = require('@/services/sync.service');
      const unsub = useNetworkStore.getState().init();
      sync.refreshPendingCount().catch(() => {});
      sync.startBackgroundSync();
      return () => {
        try {
          unsub?.();
          sync.stopBackgroundSync();
        } catch {}
      };
    } catch (e) {
      remoteLogger.warning('init_offline_services_failed', { err: String(e) });
    }
  }, []);

  useEffect(() => {
    setLoggerRoute('/' + (segments?.join('/') ?? ''));
  }, [segments]);

  useEffect(() => {
    if (usuario?.id) setLoggerSession({ userId: usuario.id, empresaId: usuario.empresa?.id });
  }, [usuario?.id]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider value={LightTheme}>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade_from_bottom',
                animationDuration: 240,
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              <Stack.Screen name="login" options={{ animation: 'fade', animationDuration: 280 }} />
              <Stack.Screen name="carrito" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="cobrar" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="cobrar-exito" options={{ animation: 'fade' }} />
              <Stack.Screen name="scanner" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="productos/nuevo" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="productos/[id]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="caja/abrir" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="caja/cerrar" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="config/negocio" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="config/comprobantes" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="config/nubefact" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="config/categorias" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="config/marcas" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="config/impresora" options={{ animation: 'slide_from_right' }} />
            </Stack>
            <StatusBar style="dark" />
          </ThemeProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
      <Toast config={toastConfig} topOffset={54} />
      {!splashDone && <AnimatedSplash onAnimationEnd={() => setSplashDone(true)} />}
    </View>
  );
}
