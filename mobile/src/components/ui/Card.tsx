// =============================================================================
// Card.tsx — Card sobria con sombra suave y border.
// =============================================================================

import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface Props {
  children: ReactNode;
  padding?: number;
  style?: ViewStyle;
  variant?: 'default' | 'subtle';
}

export function Card({ children, padding = 16, style, variant = 'default' }: Props) {
  return (
    <View
      style={[
        s.base,
        variant === 'subtle' ? s.subtle : s.default,
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  base: {
    borderRadius: 18,
    borderWidth: 1,
  },
  default: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EEF0EF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  subtle: {
    backgroundColor: '#F7F8FA',
    borderColor: '#EEF0EF',
  },
});
