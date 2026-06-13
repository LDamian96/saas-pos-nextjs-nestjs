// =============================================================================
// PText.tsx — Reemplazo del Text de Tamagui con look idéntico.
// Acepta las mismas props (fontFamily, fontWeight, fontSize, color, etc.)
// pero mapeándolas a estilos RN nativos. Tokens "$body", "$color", etc se mapean.
// =============================================================================

import { ComponentProps } from 'react';
import { Text as RNText, StyleSheet, TextStyle } from 'react-native';

// Mapeo de tokens "$..." → valores reales (alineados con tamagui.config.ts)
const TOKENS: Record<string, string> = {
  $color: '#0C0C0C',
  $colorMuted: '#5E6A63',
  $colorSubtle: '#8A938D',
  $primary: '#00932C',
  $body: 'Mulish_500Medium',
};

// Mapeo fontWeight numérico → familia Mulish
const WEIGHT_FONTS: Record<string, string> = {
  '400': 'Mulish_400Regular',
  '500': 'Mulish_500Medium',
  '600': 'Mulish_600SemiBold',
  '700': 'Mulish_700Bold',
  '800': 'Mulish_800ExtraBold',
  '900': 'Mulish_900Black',
};

type Color = string;

interface PTextProps extends Omit<ComponentProps<typeof RNText>, 'style'> {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: TextStyle['fontWeight'] | '900';
  color?: Color;
  letterSpacing?: number;
  lineHeight?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginVertical?: number;
  marginHorizontal?: number;
  textAlign?: TextStyle['textAlign'];
  flex?: number;
  style?: TextStyle | TextStyle[];
}

export function PText({
  fontFamily,
  fontSize,
  fontWeight,
  color,
  letterSpacing,
  lineHeight,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  marginVertical,
  marginHorizontal,
  textAlign,
  flex,
  style,
  children,
  ...rest
}: PTextProps) {
  // Resolver token de color
  const resolvedColor = color && color.startsWith('$') ? TOKENS[color] ?? color : color;

  // Resolver familia: si pasan fontWeight, usar familia Mulish del peso
  const family = (() => {
    if (fontFamily && fontFamily.startsWith('$')) return TOKENS[fontFamily] ?? 'Mulish_500Medium';
    if (fontFamily) return fontFamily;
    if (fontWeight) {
      const key = String(fontWeight);
      if (WEIGHT_FONTS[key]) return WEIGHT_FONTS[key];
    }
    return 'Mulish_500Medium';
  })();

  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: family,
          fontSize,
          color: resolvedColor,
          letterSpacing,
          lineHeight,
          marginTop,
          marginBottom,
          marginLeft,
          marginRight,
          marginVertical,
          marginHorizontal,
          textAlign,
          flex,
        },
        StyleSheet.flatten(style ?? {}),
      ]}
    >
      {children}
    </RNText>
  );
}

// Alias para compatibilidad — donde antes había `import { Text } from 'tamagui'`,
// ahora será `import { PText as Text } from '@/components/ui/PText'`.
export { PText as Text };

// YStack equivalente — alias a View con flexDirection column.
import { View, ViewProps } from 'react-native';

export function YStack({ children, style, ...props }: ViewProps & { children?: React.ReactNode } & Record<string, any>) {
  const flatStyle: any = {};
  const numericKeys = [
    'flex', 'padding', 'paddingHorizontal', 'paddingVertical', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
    'margin', 'marginHorizontal', 'marginVertical', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
    'gap', 'width', 'height',
  ];
  for (const key of numericKeys) {
    if ((props as any)[key] !== undefined) {
      flatStyle[key] = (props as any)[key];
      delete (props as any)[key];
    }
  }
  return (
    <View
      {...(props as ViewProps)}
      style={[{ flexDirection: 'column' }, flatStyle, style]}
    >
      {children}
    </View>
  );
}
