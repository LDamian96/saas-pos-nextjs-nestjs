// =============================================================================
// Pill.tsx — Chip nativo (sin Reanimated). Memoizado para listas grandes.
// =============================================================================

import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius } from '@/theme';

interface Props {
  label: string;
  active?: boolean;
  onPress: () => void;
}

export const Pill = memo(function Pill({ label, active, onPress }: Props) {
  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        s.pill,
        active ? s.active : s.idle,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[s.text, active ? s.textActive : s.textIdle]}>{label}</Text>
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
