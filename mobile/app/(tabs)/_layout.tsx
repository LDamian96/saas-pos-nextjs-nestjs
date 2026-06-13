// =============================================================================
// (tabs)/_layout.tsx — Bottom tabs con lucide icons + animación scale.
// =============================================================================

import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BarChart3, Boxes, Settings, ShoppingCart } from 'lucide-react-native';
import { colors, fonts } from '@/theme';
import { useEffect } from 'react';

type IconCmp = typeof ShoppingCart;

function AnimatedTabIcon({ Icon, label, focused }: { Icon: IconCmp; label: string; focused: boolean }) {
  const scale = useSharedValue(focused ? 1 : 0.92);
  const opacity = useSharedValue(focused ? 1 : 0.55);
  useEffect(() => {
    scale.value = withSpring(focused ? 1.08 : 0.94, { damping: 14, stiffness: 220 });
    opacity.value = withTiming(focused ? 1 : 0.55, { duration: 160 });
  }, [focused]);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  return (
    <Animated.View style={[ti.wrap, animStyle]}>
      <Icon color={focused ? colors.brand : colors.textSubtle} size={focused ? 24 : 22} strokeWidth={2.2} />
      <Text
        numberOfLines={1}
        style={[ti.label, { color: focused ? colors.brand : colors.textSubtle, fontFamily: focused ? fonts.extrabold : fonts.semibold }]}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

const ti = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 8, minWidth: 70 },
  label: { fontSize: 10.5, marginTop: 3, letterSpacing: 0.1 },
});

function TabButton(props: any) {
  return (
    <Pressable
      {...props}
      onPress={(e) => {
        Haptics.selectionAsync();
        props.onPress?.(e);
      }}
      android_ripple={undefined}
      style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.85 : 1, alignItems: 'center', justifyContent: 'center' }]}
    />
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 6);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: TabButton,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          borderTopWidth: 1,
          height: 62 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 0,
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -3 },
        },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <AnimatedTabIcon Icon={ShoppingCart} label="POS" focused={focused} /> }}
      />
      <Tabs.Screen
        name="productos"
        options={{ tabBarIcon: ({ focused }) => <AnimatedTabIcon Icon={Boxes} label="Productos" focused={focused} /> }}
      />
      <Tabs.Screen
        name="ventas"
        options={{ tabBarIcon: ({ focused }) => <AnimatedTabIcon Icon={BarChart3} label="Reportes" focused={focused} /> }}
      />
      <Tabs.Screen
        name="config"
        options={{ tabBarIcon: ({ focused }) => <AnimatedTabIcon Icon={Settings} label="Ajustes" focused={focused} /> }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
