// =============================================================================
// Card.tsx — Card sobria con sombra suave.
// =============================================================================

import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, shadows } from '@/theme';

interface Props {
  children: ReactNode;
  padding?: number;
  style?: ViewStyle;
}

export function Card({ children, padding = 16, style }: Props) {
  return (
    <View style={[s.base, { padding }, style]}>{children}</View>
  );
}

const s = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.soft,
  },
});
