import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  onAnimationEnd?: () => void;
}

export function AnimatedSplash({ onAnimationEnd }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeOutAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        onAnimationEnd?.();
      });
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeOutAnim, zIndex: 9999 }]}>
      <LinearGradient
        colors={['#7C3AED', '#6D28D9', '#4C1D95']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={s.center}>
        <Animated.View style={[s.logoWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={s.logoOuter}>
            <View style={s.logo}>
              <Text style={s.logoText}>P</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.Text style={[s.title, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          POS Shop
        </Animated.Text>

        <Animated.Text style={[s.subtitle, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          Sistema de Punto de Venta
        </Animated.Text>
      </View>

      <Animated.View style={[s.bottom, { opacity: fadeAnim }]}>
        <Text style={s.poweredBy}>Powered by POS Shop</Text>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { marginBottom: 28 },
  logoOuter: {
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: 52, fontWeight: '800' },
  title: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  bottom: { position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' },
  poweredBy: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '500', letterSpacing: 1 },
});
