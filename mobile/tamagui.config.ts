// =============================================================================
// tamagui.config.ts — Theme y tokens del POS Shop móvil.
// Paleta DineTrack (verde #00932C), Mulish, spacing/radius/shadow consistentes.
// Compile-time CSS via @tamagui/babel-plugin → cero runtime overhead.
// =============================================================================

import { createTamagui, createTokens, createFont } from 'tamagui';
import { createAnimations } from '@tamagui/animations-react-native';
import { shorthands } from '@tamagui/shorthands';
import { themes as defaultThemes, tokens as defaultTokens } from '@tamagui/themes';

// ----- Animaciones (spring + timing, alineadas a Material/iOS) --------------
const animations = createAnimations({
  // Entrada principal: snappy spring
  bouncy: { type: 'spring', damping: 18, stiffness: 200 },
  // Tap / micro-interacción
  quick: { type: 'spring', damping: 14, stiffness: 400 },
  // Suave y elegante
  smooth: { type: 'spring', damping: 22, stiffness: 160 },
  // Lento (para reveals)
  slow: { type: 'spring', damping: 28, stiffness: 120 },
  fast: { type: 'timing', duration: 180 },
  medium: { type: 'timing', duration: 240 },
});

// ----- Tipografía Mulish (la misma que la web) ------------------------------
const mulishFont = createFont({
  family: 'Mulish_500Medium',
  size: {
    1: 11, 2: 12, 3: 13, 4: 14, 5: 15, 6: 16, 7: 18, 8: 20, 9: 22, 10: 26, 11: 30, 12: 36, 13: 44, 14: 52,
  },
  lineHeight: {
    1: 14, 2: 16, 3: 18, 4: 20, 5: 22, 6: 24, 7: 26, 8: 28, 9: 30, 10: 34, 11: 38, 12: 44, 13: 52, 14: 60,
  },
  weight: {
    4: '400', 5: '500', 6: '600', 7: '700', 8: '800', 9: '900',
  },
  letterSpacing: {
    1: 0.3, 2: 0.2, 3: 0.1, 4: 0, 5: -0.1, 6: -0.2, 7: -0.3, 8: -0.4,
  },
  face: {
    400: { normal: 'Mulish_400Regular' },
    500: { normal: 'Mulish_500Medium' },
    600: { normal: 'Mulish_600SemiBold' },
    700: { normal: 'Mulish_700Bold' },
    800: { normal: 'Mulish_800ExtraBold' },
    900: { normal: 'Mulish_900Black' },
  },
});

// ----- Tokens DineTrack -----------------------------------------------------
const tokens = createTokens({
  ...defaultTokens,
  color: {
    ...defaultTokens.color,
    brand: '#00932C',
    brandSoft: '#CCE9D5',
    brandDark: '#006920',
    brandTint: '#E8F5EC',
    accentMint: '#2BD37B',
    bgLight: '#F7F8FA',
    bgDark: '#0A0F0C',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F3F2',
    border: '#E5E7E6',
    text: '#0C0C0C',
    textMuted: '#5E6A63',
    textSubtle: '#8A938D',
    success: '#00932C',
    warning: '#FFB020',
    danger: '#E53935',
    info: '#2E7DD7',
    efectivo: '#00932C',
    yape: '#722F8E',
    plin: '#00BCD9',
    tarjeta: '#1F2937',
  },
  space: {
    ...defaultTokens.space,
    px: 1, 0: 0, 0.5: 2, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40, 9: 56, 10: 72,
  },
  size: {
    ...defaultTokens.size,
    0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40, 9: 48, 10: 56, 11: 64, 12: 72, 13: 88,
    true: 16,
  },
  radius: {
    ...defaultTokens.radius,
    0: 0, 1: 6, 2: 10, 3: 12, 4: 14, 5: 16, 6: 20, 7: 24, 8: 28, 9: 999, true: 14,
  },
  zIndex: { ...defaultTokens.zIndex },
});

// ----- Themes (light / dark) ------------------------------------------------
const lightTheme = {
  background: tokens.color.bgLight,
  backgroundStrong: tokens.color.bgLight,
  backgroundSoft: tokens.color.surface,
  surface: tokens.color.surface,
  surfaceAlt: tokens.color.surfaceAlt,
  border: tokens.color.border,
  color: tokens.color.text,
  colorMuted: tokens.color.textMuted,
  colorSubtle: tokens.color.textSubtle,
  primary: tokens.color.brand,
  primarySoft: tokens.color.brandSoft,
  primaryDark: tokens.color.brandDark,
  primaryTint: tokens.color.brandTint,
};

const darkTheme = {
  background: tokens.color.bgDark,
  backgroundStrong: '#000000',
  backgroundSoft: '#11171350',
  surface: '#1A211D',
  surfaceAlt: '#263027',
  border: '#1E2620',
  color: '#F2F4F2',
  colorMuted: '#AAB2AC',
  colorSubtle: '#6F7872',
  primary: tokens.color.brand,
  primarySoft: tokens.color.brandDark,
  primaryDark: tokens.color.brandDark,
  primaryTint: tokens.color.brandDark,
};

// ----- Config principal -----------------------------------------------------
export const tamaguiConfig = createTamagui({
  defaultFont: 'body',
  animations,
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    body: mulishFont,
    heading: mulishFont,
  },
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  tokens,
  media: {
    xs: { maxWidth: 360 },
    sm: { maxWidth: 480 },
    md: { maxWidth: 760 },
    lg: { maxWidth: 1020 },
    short: { maxHeight: 740 },
    tall: { minHeight: 741 },
  },
});

export type Conf = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default tamaguiConfig;
