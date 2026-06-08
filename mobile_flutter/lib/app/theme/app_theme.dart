// =============================================================================
// app_theme.dart
// ThemeData light + dark. Paletas dedicadas para cada modo.
// =============================================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:pos_mobile/app/theme/app_colors.dart';
import 'package:pos_mobile/app/theme/app_spacing.dart';
import 'package:pos_mobile/app/theme/app_typography.dart';

class AppTheme {
  AppTheme._();

  static ThemeData light() {
    final colorScheme = const ColorScheme.light(
      primary: AppColors.brand,
      onPrimary: Colors.white,
      primaryContainer: AppColors.brandSoft,
      onPrimaryContainer: AppColors.brandDark,
      secondary: AppColors.accentMint,
      onSecondary: Colors.white,
      surface: AppColors.lightSurface,
      onSurface: AppColors.lightText,
      surfaceContainerHighest: AppColors.lightSurfaceAlt,
      error: AppColors.danger,
      onError: Colors.white,
      outline: AppColors.lightBorder,
    );

    return _build(
      colorScheme: colorScheme,
      bg: AppColors.lightBg,
      textColor: AppColors.lightText,
      mutedColor: AppColors.lightTextMuted,
      brightness: Brightness.light,
      systemOverlay: SystemUiOverlayStyle.dark,
    );
  }

  static ThemeData dark() {
    final colorScheme = const ColorScheme.dark(
      primary: AppColors.brand,
      onPrimary: Colors.white,
      primaryContainer: AppColors.brandDark,
      onPrimaryContainer: AppColors.brandSoft,
      secondary: AppColors.accentMint,
      onSecondary: Colors.white,
      surface: AppColors.darkSurface,
      onSurface: AppColors.darkText,
      surfaceContainerHighest: AppColors.darkSurfaceAlt,
      error: AppColors.danger,
      onError: Colors.white,
      outline: AppColors.darkBorder,
    );

    return _build(
      colorScheme: colorScheme,
      bg: AppColors.darkBg,
      textColor: AppColors.darkText,
      mutedColor: AppColors.darkTextMuted,
      brightness: Brightness.dark,
      systemOverlay: SystemUiOverlayStyle.light,
    );
  }

  static ThemeData _build({
    required ColorScheme colorScheme,
    required Color bg,
    required Color textColor,
    required Color mutedColor,
    required Brightness brightness,
    required SystemUiOverlayStyle systemOverlay,
  }) {
    final textTheme = AppTypography.textTheme(
      textColor: textColor,
      mutedColor: mutedColor,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: bg,
      brightness: brightness,
      splashFactory: InkSparkle.splashFactory,
      visualDensity: VisualDensity.adaptivePlatformDensity,
      textTheme: textTheme,
      // AppBar moderno minimal
      appBarTheme: AppBarTheme(
        backgroundColor: bg,
        foregroundColor: textColor,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        systemOverlayStyle: systemOverlay.copyWith(
          statusBarColor: Colors.transparent,
          systemNavigationBarColor: bg,
          systemNavigationBarDividerColor: bg,
        ),
        titleTextStyle: textTheme.headlineMedium,
      ),
      // Cards limpias
      cardTheme: CardThemeData(
        color: colorScheme.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          side: BorderSide(color: colorScheme.outline, width: 0.5),
        ),
      ),
      // Inputs modernos
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colorScheme.surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        hintStyle: textTheme.bodyMedium?.copyWith(color: mutedColor),
        labelStyle: textTheme.bodyMedium,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(color: colorScheme.outline, width: 1.2),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(color: colorScheme.outline, width: 1.2),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppColors.brand, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppColors.danger, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.brand,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(56),
          padding: const EdgeInsets.symmetric(horizontal: 24),
          elevation: 0,
          textStyle: textTheme.labelLarge,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.brand,
          textStyle: textTheme.labelLarge,
        ),
      ),
      dividerTheme: DividerThemeData(
        color: brightness == Brightness.light
            ? AppColors.lightDivider
            : AppColors.darkDivider,
        thickness: 1,
        space: 1,
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: colorScheme.surface,
        elevation: 0,
        modalElevation: 0,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(AppRadius.xl),
          ),
        ),
      ),
      snackBarTheme: const SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.brandDark,
        contentTextStyle: TextStyle(color: Colors.white),
      ),
    );
  }
}
