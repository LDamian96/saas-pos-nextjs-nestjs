import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { useAuthStore } from '@/stores/auth.store';
import { AnimatedSplash } from '@/components/splash-screen';
import { Toaster } from '@/components/toaster';
import {
  installGlobalErrorHandlers,
  remoteLogger,
  setLoggerRoute,
  setLoggerSession,
} from '@/services/remote-logger';

// Mantener el splash nativo oculto hasta que nuestro splash custom termine
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f8fafc',
    card: '#ffffff',
    text: '#111827',
    primary: '#7c3aed',
  },
};

export default function RootLayout() {
  const checkAuth = useAuthStore(s => s.checkAuth);
  const usuario = useAuthStore(s => s.usuario);
  const [splashDone, setSplashDone] = useState(false);
  const segments = useSegments();

  useEffect(() => {
    installGlobalErrorHandlers();
    remoteLogger.info('app_opened');
    checkAuth();
    SplashScreen.hideAsync().catch(() => {});

    // Network + sync (carga diferida para no crashear)
    try {
      const { useNetworkStore } = require('@/stores/network.store');
      const sync = require('@/services/sync.service');
      const unsub = useNetworkStore.getState().init();
      sync.refreshPendingCount().catch(() => {});
      sync.startBackgroundSync();
      return () => { try { unsub?.(); sync.stopBackgroundSync(); } catch {} };
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

  return (
    <View style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Toaster>
          <ThemeProvider value={LightTheme}>
            <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 220 }}>
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              <Stack.Screen name="login" options={{ animation: 'fade', animationDuration: 300 }} />
              <Stack.Screen name="carrito" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="cobrar" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="cobrar-exito" options={{ animation: 'fade' }} />
              <Stack.Screen name="scanner" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="productos/nuevo" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="productos/[id]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="ventas/[id]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="caja/abrir" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="caja/cerrar" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="config/negocio" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="config/comprobantes" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="config/nubefact" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="config/categorias" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="config/marcas" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="config/impresora" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="config/biometria" options={{ animation: 'slide_from_right' }} />
            </Stack>
            <StatusBar style="dark" />
          </ThemeProvider>
          </Toaster>
        </GestureHandlerRootView>
      </QueryClientProvider>
      {!splashDone && <AnimatedSplash onAnimationEnd={() => setSplashDone(true)} />}
    </View>
  );
}
