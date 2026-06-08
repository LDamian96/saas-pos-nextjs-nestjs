// =============================================================================
// pin_dots.dart
// Indicador visual del PIN: dots animados que se rellenan con cada dígito.
// Tiene un shake animado al PIN incorrecto.
// =============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:pos_mobile/app/theme/app_colors.dart';

class PinDots extends StatelessWidget {
  const PinDots({
    required this.length,
    required this.entered,
    super.key,
    this.shake = false,
    this.success = false,
  });

  final int length;
  final int entered;
  final bool shake;
  final bool success;

  @override
  Widget build(BuildContext context) {
    final dots = List.generate(length, (i) {
      final filled = i < entered;
      final color = success
          ? AppColors.success
          : (filled ? AppColors.brand : Theme.of(context).colorScheme.outline);
      return AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutBack,
        margin: const EdgeInsets.symmetric(horizontal: 8),
        width: filled ? 18 : 14,
        height: filled ? 18 : 14,
        decoration: BoxDecoration(
          color: filled ? color : Colors.transparent,
          shape: BoxShape.circle,
          border: Border.all(color: color, width: 1.6),
          boxShadow: filled
              ? [
                  BoxShadow(
                    color: color.withValues(alpha: 0.35),
                    blurRadius: 12,
                    spreadRadius: 1,
                  ),
                ]
              : null,
        ),
      );
    });

    final row = Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: dots,
    );

    if (shake) {
      return row.animate(key: ValueKey('shake-$entered')).shake(
            hz: 8,
            duration: 350.ms,
            offset: const Offset(8, 0),
          );
    }
    if (success) {
      return row.animate(key: const ValueKey('success')).scale(
            begin: const Offset(1, 1),
            end: const Offset(1.08, 1.08),
            duration: 220.ms,
            curve: Curves.easeOutBack,
          );
    }
    return row;
  }
}
