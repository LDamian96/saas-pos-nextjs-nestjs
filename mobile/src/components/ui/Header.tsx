// =============================================================================
// Header.tsx — Header con botón back, título y acción derecha.
// =============================================================================

import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { colors, fonts } from '@/theme';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function Header({ title, subtitle, onBack, right }: Props) {
  return (
    <Animated.View
      entering={FadeIn.duration(220).easing(Easing.out(Easing.cubic))}
      style={s.wrap}
    >
      <Pressable onPress={() => (onBack ? onBack() : router.back())} style={s.back} hitSlop={10}>
        <ChevronLeft color={colors.text} size={22} strokeWidth={2.4} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={s.title}>{title}</Text>
        {subtitle && <Text numberOfLines={1} style={s.subtitle}>{subtitle}</Text>}
      </View>
      {right && <View style={s.right}>{right}</View>}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  title: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 18, letterSpacing: -0.3 },
  subtitle: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 12, marginTop: 2 },
  right: { flexDirection: 'row', gap: 8 },
});
