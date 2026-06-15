// =============================================================================
// AnimatedSplash — fondo morado gradiente, sin pantalla blanca intermedia.
// Diseño minimal: solo logo en card glass + nombre, sin texturas.
// =============================================================================

import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingBag } from 'lucide-react-native';

interface Props {
  onAnimationEnd?: () => void;
}

export function AnimatedSplash({ onAnimationEnd }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 220, mass: 0.7 }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeOut, { toValue: 0, duration: 320, useNativeDriver: true, easing: Easing.in(Easing.cubic) }).start(
        () => onAnimationEnd?.()
      );
    }, 900);

    return () => clearTimeout(timer);
  }, []);

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
          <ShoppingBag color="#FFFFFF" size={48} strokeWidth={2.2} />
        </Animated.View>
        <Animated.Text style={[s.title, { opacity: fade }]}>POS Shop</Animated.Text>
        <Animated.View style={[s.dotsRow, { opacity: fade }]}>
          <View style={s.dot} />
          <View style={[s.dot, { opacity: 0.6 }]} />
          <View style={[s.dot, { opacity: 0.3 }]} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoCard: {
    width: 104,
    height: 104,
    borderRadius: 28,
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
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 24,
  },
  dotsRow: { flexDirection: 'row', gap: 6, marginTop: 18 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
});
