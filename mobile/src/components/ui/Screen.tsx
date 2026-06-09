// =============================================================================
// Screen.tsx — Layout base de pantalla. SafeArea + fondo + status bar.
// =============================================================================

import { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  children: ReactNode;
  background?: string;
  topInset?: boolean;
  bottomInset?: boolean;
}

export function Screen({
  children,
  background = '#F7F8FA',
  topInset = true,
  bottomInset = false,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: background,
        paddingTop: topInset ? insets.top : 0,
        paddingBottom: bottomInset ? insets.bottom : 0,
      }}
    >
      {children}
    </View>
  );
}
