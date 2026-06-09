// =============================================================================
// PressableButton.tsx — Botón con animación de scale spring + haptic.
// Variantes: primary (verde), outline, ghost, danger.
// =============================================================================

import { ComponentType, ReactNode } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from 'tamagui';

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

export function PressableButton({
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

  const heightMap = { sm: 40, md: 48, lg: 56 } as const;
  const fontSizeMap = { sm: 13, md: 15, lg: 16 } as const;
  const radiusMap = { sm: 12, md: 14, lg: 16 } as const;
  const iconSizeMap = { sm: 16, md: 18, lg: 20 } as const;

  const isDisabled = disabled || loading;

  const variants: Record<Variant, ViewStyle & { textColor: string }> = {
    primary: {
      backgroundColor: '#00932C',
      borderWidth: 0,
      shadowColor: '#00932C',
      shadowOpacity: 0.22,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
      textColor: '#FFFFFF',
    },
    outline: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1.4,
      borderColor: '#E5E7E6',
      textColor: '#0C0C0C',
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      textColor: '#00932C',
    },
    danger: {
      backgroundColor: '#E53935',
      borderWidth: 0,
      shadowColor: '#E53935',
      shadowOpacity: 0.22,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
      textColor: '#FFFFFF',
    },
  };

  const v = variants[variant];

  return (
    <Pressable
      onPress={() => {
        if (isDisabled) return;
        if (variant === 'danger') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
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
            height: heightMap[size],
            borderRadius: radiusMap[size],
            backgroundColor: v.backgroundColor,
            borderWidth: v.borderWidth,
            borderColor: v.borderColor,
            shadowColor: v.shadowColor,
            shadowOpacity: v.shadowOpacity,
            shadowRadius: v.shadowRadius,
            shadowOffset: v.shadowOffset,
            elevation: v.elevation,
            opacity: isDisabled ? 0.55 : 1,
          },
          animStyle,
        ]}
      >
        {Icon && <Icon color={v.textColor} size={iconSizeMap[size]} strokeWidth={2.2} />}
        <Text
          fontFamily="$body"
          fontWeight="800"
          fontSize={fontSizeMap[size]}
          color={v.textColor}
          marginLeft={Icon ? 8 : 0}
          marginRight={RightIcon ? 8 : 0}
          letterSpacing={0.1}
        >
          {loading ? 'Cargando…' : label}
        </Text>
        {RightIcon && <RightIcon color={v.textColor} size={iconSizeMap[size]} strokeWidth={2.2} />}
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
