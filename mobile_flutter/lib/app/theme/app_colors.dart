// =============================================================================
// app_colors.dart
// Sistema de colores tokens — diseño DineTrack mobile, único.
// Mode light y dark con paletas DEDICADAS, no inversion.
// =============================================================================

import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ── Brand ──────────────────────────────────────────────────────────
  static const Color brand = Color(0xFF00932C);
  static const Color brandSoft = Color(0xFFCCE9D5);
  static const Color brandDark = Color(0xFF006920);
  static const Color brandTint = Color(0xFFE8F5EC);

  // ── Acentos vivos (microinteracciones) ─────────────────────────────
  static const Color accentMint = Color(0xFF2BD37B);
  static const Color accentLime = Color(0xFFB8E986);
  static const Color accentAmber = Color(0xFFFFB020);

  // ── Light mode ─────────────────────────────────────────────────────
  static const Color lightBg = Color(0xFFF7F8F7);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightSurfaceAlt = Color(0xFFF1F3F2);
  static const Color lightBorder = Color(0xFFE5E7E6);
  static const Color lightDivider = Color(0xFFEEF0EF);

  static const Color lightText = Color(0xFF0C0C0C);
  static const Color lightTextMuted = Color(0xFF5E6A63);
  static const Color lightTextSubtle = Color(0xFF8A938D);

  // ── Dark mode (paleta dedicada, no invertida) ──────────────────────
  static const Color darkBg = Color(0xFF0A0F0C);
  static const Color darkSurface = Color(0xFF11171350);
  static const Color darkSurfaceAlt = Color(0xFF1A211D);
  static const Color darkBorder = Color(0xFF263027);
  static const Color darkDivider = Color(0xFF1E2620);

  static const Color darkText = Color(0xFFF2F4F2);
  static const Color darkTextMuted = Color(0xFFAAB2AC);
  static const Color darkTextSubtle = Color(0xFF6F7872);

  // ── Estado / semánticos ────────────────────────────────────────────
  static const Color success = Color(0xFF00932C);
  static const Color warning = Color(0xFFFFB020);
  static const Color danger = Color(0xFFE53935);
  static const Color info = Color(0xFF2E7DD7);

  // ── Métodos de pago (chips de cobro) ───────────────────────────────
  static const Color efectivo = Color(0xFF00932C);
  static const Color yape = Color(0xFF722F8E);
  static const Color plin = Color(0xFF00BCD9);
  static const Color tarjeta = Color(0xFF1F2937);

  // ── Sombras (elevations modernas) ──────────────────────────────────
  static const Color shadowSoft = Color(0x10000000);
  static const Color shadowMedium = Color(0x18000000);
  static const Color shadowStrong = Color(0x24000000);
}
