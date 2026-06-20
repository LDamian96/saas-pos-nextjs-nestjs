// =============================================================================
// Button.tsx — Botón con scale spring + haptic + variantes.
// =============================================================================

import { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius } from '@/theme';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  icon?: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  rightIcon?: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  style?: ViewStyle;
}

const HEIGHTS = { sm: 40, md: 48, lg: 56 } as const;
const FONT_SIZES = { sm: 13, md: 15, lg: 16 } as const;
const ICON_SIZES = { sm: 16, md: 18, lg: 20 } as const;

export function Button({
  label,
  icon: Icon,
  rightIcon: RightIcon,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  full = true,
  style,
}: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isDisabled = disabled || loading;

  const variants: Record<Variant, ViewStyle & { textColor: string; shadowEnabled: boolean }> = {
    primary: {
      backgroundColor: colors.brand,
      textColor: '#FFFFFF',
      shadowEnabled: true,
    },
    outline: {
      backgroundColor: colors.surface,
      borderWidth: 1.4,
      borderColor: colors.border,
      textColor: colors.text,
      shadowEnabled: false,
    },
    ghost: {
      backgroundColor: 'transparent',
      textColor: colors.brand,
      shadowEnabled: false,
    },
    danger: {
      backgroundColor: colors.danger,
      textColor: '#FFFFFF',
      shadowEnabled: true,
    },
  };
  const v = variants[variant];
  const shadowColor = variant === 'danger' ? colors.danger : colors.brand;

  return (
    <Pressable
      onPress={() => {
        if (isDisabled) return;
        if (variant === 'danger') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={() => (scale.value = withSpring(0.96, { damping: 14, stiffness: 400 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 14, stiffness: 400 }))}
      style={[full && { width: '100%' }, style]}
    >
      <Animated.View
        style={[
          s.base,
          {
            height: HEIGHTS[size],
            borderRadius: radius.md,
            backgroundColor: v.backgroundColor,
            borderWidth: v.borderWidth,
            borderColor: v.borderColor,
            opacity: isDisabled ? 0.55 : 1,
          },
          v.shadowEnabled && {
            shadowColor,
            shadowOpacity: 0.25,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 4,
          },
          animStyle,
        ]}
      >
        {Icon && <Icon color={v.textColor} size={ICON_SIZES[size]} strokeWidth={2.2} />}
        <Text
          style={{
            color: v.textColor,
            fontFamily: fonts.extrabold,
            fontSize: FONT_SIZES[size],
            letterSpacing: 0.2,
            marginLeft: Icon ? 8 : 0,
            marginRight: RightIcon ? 8 : 0,
          }}
        >
          {loading ? 'Cargando…' : label}
        </Text>
        {RightIcon && <RightIcon color={v.textColor} size={ICON_SIZES[size]} strokeWidth={2.2} />}
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
});
