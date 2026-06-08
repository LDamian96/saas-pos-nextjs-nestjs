// =============================================================================
// more_page.dart — placeholder de la pestaña "Más" (settings, perfil, logout).
// =============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:pos_mobile/app/router/route_names.dart';
import 'package:pos_mobile/app/theme/app_colors.dart';
import 'package:pos_mobile/core/extensions/context_x.dart';
import 'package:pos_mobile/core/services/toast_service.dart';
import 'package:pos_mobile/features/auth/presentation/providers/auth_controller.dart';

class MorePage extends ConsumerWidget {
  const MorePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final user = auth is AuthAuthenticated ? auth.user : null;

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 120),
        physics: const BouncingScrollPhysics(),
        children: [
          if (user != null) ...[
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: context.colors.surface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: context.colors.outline, width: 0.6),
              ),
              child: Row(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: AppColors.brandSoft,
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      user.initials,
                      style: const TextStyle(
                        color: AppColors.brand,
                        fontWeight: FontWeight.w800,
                        fontSize: 20,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(user.fullName, style: context.text.titleMedium),
                        const SizedBox(height: 2),
                        Text(
                          user.empresaNombre,
                          style: context.text.bodySmall,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            )
                .animate()
                .fadeIn(duration: 380.ms)
                .slideY(begin: 0.12, end: 0, curve: Curves.easeOutCubic),
            const SizedBox(height: 20),
          ],
          _SectionTitle('Configuración'),
          _Tile(
            icon: LucideIcons.fileText,
            label: 'Comprobantes (NubeFact)',
            subtitle: 'Boletas, facturas, comprobantes',
            onTap: () {},
          ),
          _Tile(
            icon: LucideIcons.bluetooth,
            label: 'Impresora Bluetooth',
            subtitle: 'Vincular y configurar',
            onTap: () {},
          ),
          _Tile(
            icon: LucideIcons.messageCircle,
            label: 'Envío por WhatsApp',
            subtitle: 'Mandar comprobantes al cliente',
            onTap: () {},
          ),
          _Tile(
            icon: LucideIcons.moon,
            label: 'Modo oscuro',
            subtitle: 'Automático según el sistema',
            onTap: () {},
          ),
          const SizedBox(height: 20),
          _SectionTitle('Cuenta'),
          _Tile(
            icon: LucideIcons.logOut,
            label: 'Cerrar sesión',
            isDanger: true,
            onTap: () async {
              await ref.read(authControllerProvider.notifier).logout();
              if (!context.mounted) return;
              ref.read(toastServiceProvider).info(
                    context,
                    title: 'Sesión cerrada',
                    message: 'Hasta pronto',
                  );
              context.go(RouteNames.loginCredentials);
            },
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);
  final String text;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 4, 4, 10),
      child: Text(
        text.toUpperCase(),
        style: context.text.labelSmall?.copyWith(
          color: context.colors.onSurface.withValues(alpha: 0.55),
        ),
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.subtitle,
    this.isDanger = false,
  });

  final IconData icon;
  final String label;
  final String? subtitle;
  final bool isDanger;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final fg = isDanger ? AppColors.danger : context.colors.onSurface;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border.all(color: context.colors.outline, width: 0.6),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: (isDanger ? AppColors.danger : AppColors.brand)
                        .withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, size: 20, color: fg),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        style: context.text.titleMedium?.copyWith(color: fg),
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 2),
                        Text(subtitle!, style: context.text.bodySmall),
                      ],
                    ],
                  ),
                ),
                Icon(
                  LucideIcons.chevronRight,
                  size: 18,
                  color: context.colors.outline,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
