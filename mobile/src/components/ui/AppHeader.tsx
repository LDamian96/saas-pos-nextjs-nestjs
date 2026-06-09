// =============================================================================
// AppHeader.tsx — Header reutilizable con back, título y acción opcional.
// =============================================================================

import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn } from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { Text } from 'tamagui';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  variant?: 'normal' | 'large';
}

export function AppHeader({ title, subtitle, onBack, right, variant = 'normal' }: Props) {
  const handleBack = () => (onBack ? onBack() : router.back());

  return (
    <Animated.View
      entering={FadeIn.duration(220).easing(Easing.out(Easing.cubic))}
      style={s.wrap}
    >
      <View style={s.row}>
        <Pressable onPress={handleBack} style={s.backBtn} hitSlop={10}>
          <ChevronLeft color="#0C0C0C" size={22} strokeWidth={2.2} />
        </Pressable>

        <View style={s.titleWrap}>
          <Text
            fontFamily="$body"
            fontWeight="800"
            fontSize={variant === 'large' ? 22 : 18}
            color="$color"
            letterSpacing={-0.3}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text fontFamily="$body" fontSize={12} color="$colorMuted" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={s.rightWrap}>{right}</View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEF0EF',
  },
  titleWrap: { flex: 1 },
  rightWrap: { flexDirection: 'row', gap: 8 },
});
