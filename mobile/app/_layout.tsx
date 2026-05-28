import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { useAuthStore } from '@/stores/auth.store';
import { AnimatedSplash } from '@/components/splash-screen';

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

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#16a34a',
        borderLeftWidth: 5,
        backgroundColor: '#fff',
        borderRadius: 14,
        elevation: 20,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        marginHorizontal: 12,
        height: undefined,
        minHeight: 56,
        paddingVertical: 10,
      }}
      contentContainerStyle={{ paddingHorizontal: 14 }}
      text1Style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}
      text2Style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#dc2626',
        borderLeftWidth: 5,
        backgroundColor: '#fff',
        borderRadius: 14,
        elevation: 20,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        marginHorizontal: 12,
        height: undefined,
        minHeight: 56,
        paddingVertical: 10,
      }}
      contentContainerStyle={{ paddingHorizontal: 14 }}
      text1Style={{ fontSize: 15, fontWeight: '700', color: '#dc2626' }}
      text2Style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#7c3aed',
        borderLeftWidth: 5,
        backgroundColor: '#fff',
        borderRadius: 14,
        elevation: 20,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        marginHorizontal: 12,
        height: undefined,
        minHeight: 56,
        paddingVertical: 10,
      }}
      contentContainerStyle={{ paddingHorizontal: 14 }}
      text1Style={{ fontSize: 15, fontWeight: '700', color: '#7c3aed' }}
      text2Style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
    />
  ),
};

export default function RootLayout() {
  const checkAuth = useAuthStore(s => s.checkAuth);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
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
    } catch {}
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider value={LightTheme}>
            <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom', animationDuration: 250 }}>
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              <Stack.Screen name="login" options={{ animation: 'fade', animationDuration: 300 }} />
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
