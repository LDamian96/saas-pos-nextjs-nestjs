// =============================================================================
// _layout.tsx — Root layout.
//   • TamaguiProvider (theme + tokens compile-time)
//   • Mulish font loader (misma tipografía que la web)
//   • RemoteLogger global (captura errores + envío al backend)
//   • Splash custom animado mientras carga
//   • Stack screens con transiciones suaves
// =============================================================================

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
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

  // ── Errores globales + checkAuth + servicios offline ───────────
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

  // ── Tracking de ruta actual (para diagnóstico remoto) ───────────
  useEffect(() => {
    const route = '/' + (segments?.join('/') ?? '');
    setLoggerRoute(route);
  }, [segments]);

  // ── Bind userId al logger cuando cambia ─────────────────────────
  useEffect(() => {
    if (usuario?.id) {
      setLoggerSession({
        userId: usuario.id,
        empresaId: usuario.empresa?.id,
      });
    }
  }, [usuario?.id]);

  if (!fontsLoaded) {
    // No bloquea con loader — el splash custom lo cubre.
    return <View style={{ flex: 1, backgroundColor: '#F7F8FA' }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F8FA' }}>
      <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade_from_bottom',
                animationDuration: 240,
                contentStyle: { backgroundColor: '#F7F8FA' },
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
          </GestureHandlerRootView>
        </QueryClientProvider>
      {!splashDone && <AnimatedSplash onAnimationEnd={() => setSplashDone(true)} />}
    </View>
  );
}
