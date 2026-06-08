// =============================================================================
// empty_state.dart
// Estado vacío con acción. Buen UX = "no hay X → [hacer Y]", no solo "vacío".
// =============================================================================

import 'package:flutter/material.dart';
import 'package:pos_mobile/app/theme/app_colors.dart';
import 'package:pos_mobile/core/extensions/context_x.dart';
import 'package:pos_mobile/core/widgets/buttons/primary_button.dart';

class EmptyStateView extends StatelessWidget {
  const EmptyStateView({
    required this.title,
    required this.message,
    required this.icon,
    super.key,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String message;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 88,
            height: 88,
            decoration: BoxDecoration(
              color: AppColors.brandSoft,
              borderRadius: BorderRadius.circular(28),
            ),
            child: Icon(icon, color: AppColors.brand, size: 40),
          ),
          const SizedBox(height: 18),
          Text(title, style: context.text.headlineSmall),
          const SizedBox(height: 6),
          Text(
            message,
            textAlign: TextAlign.center,
            style: context.text.bodyMedium?.copyWith(
              color: context.colors.onSurface.withValues(alpha: 0.65),
            ),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 20),
            PrimaryButton(
              label: actionLabel!,
              onPressed: onAction,
              expand: false,
              size: PrimaryButtonSize.md,
            ),
          ],
        ],
      ),
    );
  }
}
