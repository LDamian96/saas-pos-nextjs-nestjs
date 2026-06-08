// =============================================================================
// error_state.dart
// Vista de error inline para usar dentro de listas/pantallas cuando una query
// falla. Muestra mensaje + botón "Reintentar".
// =============================================================================

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:pos_mobile/app/theme/app_colors.dart';
import 'package:pos_mobile/core/extensions/context_x.dart';
import 'package:pos_mobile/core/widgets/buttons/primary_button.dart';

class ErrorStateView extends StatelessWidget {
  const ErrorStateView({
    required this.message,
    super.key,
    this.title,
    this.onRetry,
    this.icon,
  });

  final String message;
  final String? title;
  final VoidCallback? onRetry;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppColors.danger.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(
              icon ?? LucideIcons.circleAlert,
              color: AppColors.danger,
              size: 30,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            title ?? 'Algo salió mal',
            style: context.text.headlineSmall,
          ),
          const SizedBox(height: 6),
          Text(
            message,
            textAlign: TextAlign.center,
            style: context.text.bodyMedium?.copyWith(
              color: context.colors.onSurface.withValues(alpha: 0.7),
            ),
          ),
          if (onRetry != null) ...[
            const SizedBox(height: 20),
            PrimaryButton.outline(
              label: 'Reintentar',
              icon: LucideIcons.rotateCw,
              expand: false,
              size: PrimaryButtonSize.md,
              onPressed: onRetry,
            ),
          ],
        ],
      ),
    );
  }
}
