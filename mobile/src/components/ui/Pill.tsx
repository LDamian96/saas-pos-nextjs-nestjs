// =============================================================================
// Pill.tsx — Chip con press feedback ligero. Optimizado para listas largas.
// =============================================================================

import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius } from '@/theme';

interface Props {
  label: string;
  active?: boolean;
  onPress: () => void;
}

export const Pill = memo(function Pill({ label, active, onPress }: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    onPress();
  }, [onPress]);

  const onPressIn = useCallback(() => {
    scale.value = withTiming(0.96, { duration: 80 });
  }, []);
  const onPressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 120 });
  }, []);

  return (
    <Pressable onPress={handlePress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        style={[
          s.pill,
          active ? s.active : s.idle,
          animStyle,
        ]}
      >
        <Text style={[s.text, active ? s.textActive : s.textIdle]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
});

const s = StyleSheet.create({
  pill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1.4 },
  active: { backgroundColor: colors.brand, borderColor: colors.brand },
  idle: { backgroundColor: colors.surface, borderColor: colors.border },
  text: { fontFamily: fonts.bold, fontSize: 12.5 },
  textActive: { color: '#FFFFFF' },
  textIdle: { color: colors.textMuted },
});
