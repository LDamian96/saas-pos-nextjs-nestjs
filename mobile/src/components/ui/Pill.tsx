// =============================================================================
// Pill.tsx — Chip rounded para categorías / filtros con scale on press.
// =============================================================================

import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from 'tamagui';

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
    backgroundColor: bg.value > 0.5 ? '#00932C' : '#FFFFFF',
    borderColor: bg.value > 0.5 ? '#00932C' : '#E5E7E6',
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
        <Text
          fontFamily="$body"
          fontWeight="700"
          fontSize={12.5}
          color={active ? '#FFFFFF' : '#5E6A63'}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.4,
  },
});
