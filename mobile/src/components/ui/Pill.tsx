// =============================================================================
// Pill.tsx — Chip con scale spring + haptic. Para categorías/filtros.
// =============================================================================

import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius } from '@/theme';

interface Props {
  label: string;
  active?: boolean;
  onPress: () => void;
}

export function Pill({ label, active, onPress }: Props) {
  const scale = useSharedValue(1);
  const bg = useSharedValue(active ? 1 : 0);
  bg.value = withTiming(active ? 1 : 0, { duration: 180 });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: bg.value > 0.5 ? colors.brand : colors.surface,
    borderColor: bg.value > 0.5 ? colors.brand : colors.border,
  }));

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      onPressIn={() => (scale.value = withSpring(0.95, { damping: 14, stiffness: 400 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 14, stiffness: 400 }))}
    >
      <Animated.View style={[s.pill, animStyle]}>
        <Text style={[s.text, { color: active ? '#FFFFFF' : colors.textMuted }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  pill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1.4 },
  text: { fontFamily: fonts.bold, fontSize: 12.5 },
});
