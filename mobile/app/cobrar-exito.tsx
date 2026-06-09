// =============================================================================
// cobrar-exito.tsx — Confirmación venta. Animación check + acciones.
// =============================================================================

import { useEffect } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, Home, MessageCircle, RefreshCcw } from 'lucide-react-native';
import { Text } from 'tamagui';

import { usePosStore } from '@/stores/pos.store';
import { PressableButton } from '@/components/ui/PressableButton';

export default function CobrarExitoScreen() {
  const insets = useSafeAreaInsets();
  const lastVenta = usePosStore((s) => s.lastVenta);

  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scale.value = withSequence(
      withSpring(1.15, { damping: 10, stiffness: 220 }),
      withSpring(1, { damping: 14, stiffness: 200 }),
    );
    rotate.value = withTiming(360, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, []);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  const total = Number(lastVenta?.total ?? 0);
  const numero = lastVenta?.numeroVenta ?? lastVenta?.numero ?? '—';

  return (
    <View style={[s.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <Animated.View style={[s.checkRing, checkStyle]}>
          <CheckCircle2 color="#FFFFFF" size={72} strokeWidth={2.4} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(280)}>
          <Text fontFamily="$body" fontSize={28} fontWeight="900" color="$color" marginTop={24} textAlign="center" letterSpacing={-0.6}>
            ¡Venta exitosa!
          </Text>
          <Text fontFamily="$body" fontSize={14} color="$colorMuted" marginTop={6} textAlign="center">
            Venta #{numero}
          </Text>
          <Text fontFamily="$body" fontSize={44} fontWeight="900" color="#00932C" marginTop={20} textAlign="center" letterSpacing={-1.2}>
            S/ {total.toFixed(2)}
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(360).duration(280)} style={{ gap: 10 }}>
        <PressableButton
          label="Compartir por WhatsApp"
          icon={MessageCircle}
          variant="outline"
          onPress={() => {
            const text = `Compra exitosa: S/ ${total.toFixed(2)} - Venta #${numero}`;
            Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text)}`).catch(() => {});
          }}
        />
        <PressableButton
          label="Nueva venta"
          icon={RefreshCcw}
          variant="ghost"
          onPress={() => router.replace('/(tabs)')}
        />
        <PressableButton
          label="Volver al inicio"
          icon={Home}
          variant="primary"
          onPress={() => router.replace('/(tabs)')}
        />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA', paddingHorizontal: 20 },
  checkRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#00932C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00932C',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
});
