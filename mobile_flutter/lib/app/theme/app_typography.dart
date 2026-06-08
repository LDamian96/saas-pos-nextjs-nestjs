// =============================================================================
// app_typography.dart
// Jerarquía tipográfica Mulish. Máximo 3 tamaños por pantalla.
// =============================================================================

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTypography {
  AppTypography._();

  static TextTheme textTheme({required Color textColor, required Color mutedColor}) {
    return GoogleFonts.mulishTextTheme().copyWith(
      // Display - solo para hero / títulos grandes
      displayLarge: TextStyle(
        fontFamily: GoogleFonts.mulish().fontFamily,
        fontSize: 40,
        fontWeight: FontWeight.w800,
        letterSpacing: -1,
        height: 1.1,
        color: textColor,
      ),
      displayMedium: TextStyle(
        fontFamily: GoogleFonts.mulish().fontFamily,
        fontSize: 32,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.6,
        height: 1.15,
        color: textColor,
      ),
      // Headlines - títulos de pantalla
      headlineLarge: TextStyle(
        fontFamily: GoogleFonts.mulish().fontFamily,
        fontSize: 26,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.4,
        height: 1.2,
        color: textColor,
      ),
      headlineMedium: TextStyle(
        fontFamily: GoogleFonts.mulish().fontFamily,
        fontSize: 22,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.2,
        height: 1.25,
        color: textColor,
      ),
      headlineSmall: TextStyle(
        fontFamily: GoogleFonts.mulish().fontFamily,
        fontSize: 18,
        fontWeight: FontWeight.w700,
        height: 1.3,
        color: textColor,
      ),
      // Title - secciones
      titleLarge: TextStyle(
        fontFamily: GoogleFonts.mulish().fontFamily,
        fontSize: 16,
        fontWeight: FontWeight.w700,
        height: 1.35,
        color: textColor,
      ),
      titleMedium: TextStyle(
        fontFamily: GoogleFonts.mulish().fontFamily,
        fontSize: 15,
        fontWeight: FontWeight.w600,
        height: 1.35,
        color: textColor,
      ),
      titleSmall: TextStyle(
        fontFamily: GoogleFonts.mulish().fontFamily,
        fontSize: 13,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.2,
        height: 1.4,
        color: textColor,
      ),
      // Body
      bodyLarge: TextStyle(
        fontFamily: GoogleFonts.mulish().fontFamily,
        fontSize: 16,
        fontWeight: FontWeight.w500,
        height: 1.45,
        color: textColor,
      ),
      bodyMedium: TextStyle(
        fontFamily: GoogleFonts.mulish().fontFamily,
        fontSize: 14,
        fontWeight: FontWeight.w500,
        height: 1.45,
        color: textColor,
      ),
      bodySmall: TextStyle(
        fontFamily: GoogleFonts.mulish().fontFamily,
        fontSize: 12,
        fontWeight: FontWeight.w500,
        height: 1.4,
        color: mutedColor,
      ),
      // Label
      labelLarge: TextStyle(
        fontFamily: GoogleFonts.mulish().fontFamily,
        fontSize: 14,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.2,
        height: 1.2,
        color: textColor,
      ),
      labelMedium: TextStyle(
        fontFamily: GoogleFonts.mulish().fontFamily,
        fontSize: 12,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.4,
        height: 1.2,
        color: textColor,
      ),
      labelSmall: TextStyle(
        fontFamily: GoogleFonts.mulish().fontFamily,
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.2,
        height: 1.2,
        color: mutedColor,
      ),
    );
  }

  // Estilo especial para números monetarios (tabular nums)
  static TextStyle money(BuildContext context, {double? fontSize, Color? color}) {
    return TextStyle(
      fontFamily: GoogleFonts.mulish().fontFamily,
      fontSize: fontSize ?? 28,
      fontWeight: FontWeight.w800,
      letterSpacing: -0.4,
      fontFeatures: const [FontFeature.tabularFigures()],
      color: color ?? Theme.of(context).colorScheme.onSurface,
    );
  }
}
