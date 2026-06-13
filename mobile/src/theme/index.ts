// =============================================================================
// theme/index.ts — Tokens visuales del POS (paleta DineTrack verde).
// Sobrio premium: fondo claro plano + verde solo en acentos.
// =============================================================================

export const colors = {
  // Brand
  brand: '#00932C',
  brandSoft: '#CCE9D5',
  brandDark: '#006920',
  brandTint: '#E8F5EC',

  // Surfaces
  bg: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F3F2',
  border: '#E5E7E6',
  divider: '#EEF0EF',

  // Text
  text: '#0C0C0C',
  textMuted: '#5E6A63',
  textSubtle: '#8A938D',
  textPlaceholder: '#A8B0AB',

  // Semantic
  success: '#00932C',
  warning: '#FFB020',
  warningSoft: '#FFFBEB',
  warningBorder: '#FDE68A',
  warningText: '#B45309',
  danger: '#E53935',
  dangerSoft: '#FEF2F2',
  dangerBorder: '#FECACA',
  info: '#2E7DD7',
};

export const fonts = {
  regular: 'Mulish_400Regular',
  medium: 'Mulish_500Medium',
  semibold: 'Mulish_600SemiBold',
  bold: 'Mulish_700Bold',
  extrabold: 'Mulish_800ExtraBold',
  black: 'Mulish_900Black',
};

export const radius = { sm: 10, md: 14, lg: 16, xl: 20, xxl: 24, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  brand: {
    shadowColor: '#00932C',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};
