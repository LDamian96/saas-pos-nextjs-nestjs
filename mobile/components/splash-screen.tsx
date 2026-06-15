// =============================================================================
// AnimatedSplash — fondo morado gradiente + logo + carrito que avanza cargando.
// Duracion total ~2500ms para que se vea pro.
// =============================================================================

import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  onAnimationEnd?: () => void;
}

const { width: SCREEN_W } = Dimensions.get('window');

export function AnimatedSplash({ onAnimationEnd }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const cartX = useRef(new Animated.Value(-40)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo aparece con spring + fade
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 360, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 200, mass: 0.6 }),
    ]).start();

    // Carrito recorriendo: -40 -> +trackWidth (loop indefinido)
    Animated.loop(
      Animated.sequence([
        Animated.timing(cartX, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
        Animated.timing(cartX, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();

    // Despues de 2.5s hace fadeout
    const timer = setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }).start(() => onAnimationEnd?.());
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // El carrito se desliza desde la izquierda del track hasta la derecha
  const TRACK_WIDTH = 180;
  const cartTranslate = cartX.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, TRACK_WIDTH - 10],
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeOut, zIndex: 9999 }]}>
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED', '#5B21B6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={s.center}>
        <Animated.View style={[s.logoCard, { opacity: fade, transform: [{ scale }] }]}>
          <Text style={s.logoEmoji}>🛒</Text>
        </Animated.View>

        <Animated.Text style={[s.title, { opacity: fade }]}>POS Shop</Animated.Text>
        <Animated.Text style={[s.subtitle, { opacity: fade }]}>Punto de venta</Animated.Text>

        {/* Track con carrito animado */}
        <Animated.View style={[s.trackWrap, { opacity: fade }]}>
          <View style={[s.track, { width: TRACK_WIDTH }]}>
            <Animated.View
              style={[
                s.cart,
                { transform: [{ translateX: cartTranslate }] },
              ]}
            >
              <Text style={s.cartEmoji}>🛒</Text>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  logoCard: {
    width: 110,
    height: 110,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  logoEmoji: { fontSize: 56 },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 24,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 4,
  },

  trackWrap: { marginTop: 32 },
  track: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 3,
    overflow: 'visible',
    justifyContent: 'center',
  },
  cart: { position: 'absolute', top: -18 },
  cartEmoji: { fontSize: 28 },
});
