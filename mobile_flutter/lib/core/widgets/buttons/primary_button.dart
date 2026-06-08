// =============================================================================
// primary_button.dart
// Botón primario brand — alto contraste, haptic, loading state, full width.
// =============================================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:pos_mobile/app/theme/app_colors.dart';
import 'package:pos_mobile/app/theme/app_spacing.dart';
import 'package:pos_mobile/core/extensions/context_x.dart';

enum PrimaryButtonSize { sm, md, lg }

class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    required this.label,
    required this.onPressed,
    super.key,
    this.icon,
    this.loading = false,
    this.size = PrimaryButtonSize.lg,
    this.expand = true,
    this.variant = _Variant.solid,
  });

  const PrimaryButton.outline({
    required String label,
    required VoidCallback? onPressed,
    Key? key,
    IconData? icon,
    bool loading = false,
    PrimaryButtonSize size = PrimaryButtonSize.lg,
    bool expand = true,
  }) : this(
          key: key,
          label: label,
          onPressed: onPressed,
          icon: icon,
          loading: loading,
          size: size,
          expand: expand,
          variant: _Variant.outline,
        );

  const PrimaryButton.ghost({
    required String label,
    required VoidCallback? onPressed,
    Key? key,
    IconData? icon,
    bool loading = false,
    PrimaryButtonSize size = PrimaryButtonSize.lg,
    bool expand = true,
  }) : this(
          key: key,
          label: label,
          onPressed: onPressed,
          icon: icon,
          loading: loading,
          size: size,
          expand: expand,
          variant: _Variant.ghost,
        );

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool loading;
  final PrimaryButtonSize size;
  final bool expand;
  final _Variant variant;

  double get _height => switch (size) {
        PrimaryButtonSize.sm => 40,
        PrimaryButtonSize.md => 48,
        PrimaryButtonSize.lg => 56,
      };

  double get _fontSize => switch (size) {
        PrimaryButtonSize.sm => 13,
        PrimaryButtonSize.md => 15,
        PrimaryButtonSize.lg => 16,
      };

  @override
  Widget build(BuildContext context) {
    final isDisabled = onPressed == null || loading;
    final isDark = context.isDark;

    final (bg, fg, border) = switch (variant) {
      _Variant.solid => (AppColors.brand, Colors.white, null),
      _Variant.outline => (
          Colors.transparent,
          AppColors.brand,
          AppColors.brand,
        ),
      _Variant.ghost => (
          Colors.transparent,
          isDark ? AppColors.darkText : AppColors.lightText,
          null,
        ),
    };

    final child = AnimatedSwitcher(
      duration: const Duration(milliseconds: 220),
      child: loading
          ? const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(
                strokeWidth: 2.4,
                valueColor: AlwaysStoppedAnimation(Colors.white),
              ),
            )
          : Row(
              key: ValueKey(label),
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (icon != null) ...[
                  Icon(icon, size: _fontSize + 4, color: fg),
                  const SizedBox(width: 10),
                ],
                Text(
                  label,
                  style: TextStyle(
                    color: fg,
                    fontSize: _fontSize,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.2,
                  ),
                ),
              ],
            ),
    );

    final button = AnimatedOpacity(
      duration: const Duration(milliseconds: 180),
      opacity: isDisabled ? 0.55 : 1,
      child: Container(
        height: _height,
        constraints: BoxConstraints(minWidth: expand ? double.infinity : 0),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: border == null ? null : Border.all(color: border, width: 1.5),
          boxShadow: variant == _Variant.solid && !isDisabled
              ? [
                  BoxShadow(
                    color: AppColors.brand.withValues(alpha: 0.32),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ]
              : null,
        ),
        alignment: Alignment.center,
        child: child,
      ),
    );

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.md),
        onTap: isDisabled
            ? null
            : () {
                HapticFeedback.lightImpact();
                onPressed?.call();
              },
        child: button,
      ),
    );
  }
}

enum _Variant { solid, outline, ghost }
