// =============================================================================
// pin_keypad.dart
// Teclado numérico full-width estilo iOS. Touch targets 72-80 dp.
// =============================================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:pos_mobile/app/theme/app_colors.dart';
import 'package:pos_mobile/app/theme/app_spacing.dart';
import 'package:pos_mobile/core/extensions/context_x.dart';

class PinKeypad extends StatelessWidget {
  const PinKeypad({
    required this.onDigit,
    required this.onBackspace,
    super.key,
    this.onBiometric,
  });

  final ValueChanged<String> onDigit;
  final VoidCallback onBackspace;
  final VoidCallback? onBiometric;

  @override
  Widget build(BuildContext context) {
    final rows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['bio', '0', 'back'],
    ];

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (final row in rows)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              for (final v in row) _Key(value: v, parent: this),
            ],
          ),
      ].expand((w) => [w, const SizedBox(height: AppSpacing.md)]).toList()
        ..removeLast(),
    );
  }
}

class _Key extends StatelessWidget {
  const _Key({required this.value, required this.parent});
  final String value;
  final PinKeypad parent;

  @override
  Widget build(BuildContext context) {
    if (value == 'bio') {
      if (parent.onBiometric == null) return const _Placeholder();
      return _KeyButton(
        icon: LucideIcons.fingerprint,
        color: AppColors.brand,
        onTap: () {
          HapticFeedback.lightImpact();
          parent.onBiometric?.call();
        },
      );
    }
    if (value == 'back') {
      return _KeyButton(
        icon: LucideIcons.delete,
        color: context.colors.onSurface.withValues(alpha: 0.7),
        onTap: () {
          HapticFeedback.lightImpact();
          parent.onBackspace();
        },
      );
    }
    return _KeyButton(
      label: value,
      onTap: () {
        HapticFeedback.selectionClick();
        parent.onDigit(value);
      },
    );
  }
}

class _Placeholder extends StatelessWidget {
  const _Placeholder();
  @override
  Widget build(BuildContext context) {
    return const SizedBox(width: 72, height: 72);
  }
}

class _KeyButton extends StatefulWidget {
  const _KeyButton({this.label, this.icon, this.color, required this.onTap});
  final String? label;
  final IconData? icon;
  final Color? color;
  final VoidCallback onTap;

  @override
  State<_KeyButton> createState() => _KeyButtonState();
}

class _KeyButtonState extends State<_KeyButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 80),
    lowerBound: 0,
    upperBound: 1,
  );

  late final Animation<double> _scale = Tween<double>(
    begin: 1,
    end: 0.92,
  ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return GestureDetector(
      onTapDown: (_) => _ctrl.forward(),
      onTapUp: (_) {
        _ctrl.reverse();
        widget.onTap();
      },
      onTapCancel: () => _ctrl.reverse(),
      child: ScaleTransition(
        scale: _scale,
        child: Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: context.isDark
                ? AppColors.darkSurfaceAlt
                : AppColors.lightSurface,
            shape: BoxShape.circle,
            border: Border.all(color: c.outline, width: 0.6),
            boxShadow: [
              BoxShadow(
                color: AppColors.shadowSoft,
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          alignment: Alignment.center,
          child: widget.icon != null
              ? Icon(widget.icon, size: 24, color: widget.color ?? c.onSurface)
              : Text(
                  widget.label!,
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w600,
                    color: c.onSurface,
                  ),
                ),
        ),
      ),
    );
  }
}
