// =============================================================================
// dashboard_page.dart
// Pantalla inicial dentro del shell. Saludo + stat cards animados.
// =============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:pos_mobile/app/theme/app_colors.dart';
import 'package:pos_mobile/app/theme/app_spacing.dart';
import 'package:pos_mobile/core/extensions/context_x.dart';
import 'package:pos_mobile/core/extensions/num_x.dart';
import 'package:pos_mobile/features/auth/presentation/providers/auth_controller.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final name = auth is AuthAuthenticated ? auth.user.nombre : '';
    final empresa = auth is AuthAuthenticated ? auth.user.empresaNombre : '';

    return SafeArea(
      bottom: false,
      child: ListView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.screenPaddingH,
          AppSpacing.lg,
          AppSpacing.screenPaddingH,
          120,
        ),
        children: [
          _Header(name: name, empresa: empresa).fadeSlide(),
          const SizedBox(height: 24),
          _PrimaryAction().fadeSlide(delay: 80),
          const SizedBox(height: 28),
          Text('Hoy', style: context.text.titleLarge).fadeSlide(delay: 160),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.15,
            children: [
              _StatCard(
                label: 'Ventas',
                value: (0).toSoles,
                icon: LucideIcons.trendingUp,
                color: AppColors.brand,
              ),
              _StatCard(
                label: 'Transacciones',
                value: '0',
                icon: LucideIcons.receipt,
                color: AppColors.info,
              ),
              _StatCard(
                label: 'Efectivo',
                value: (0).toSoles,
                icon: LucideIcons.banknote,
                color: AppColors.accentMint,
              ),
              _StatCard(
                label: 'Productos',
                value: '0',
                icon: LucideIcons.package,
                color: AppColors.accentAmber,
              ),
            ],
          ).animate(delay: 200.ms).fadeIn(duration: 320.ms),
        ],
      ),
    );
  }
}

extension on Widget {
  Widget fadeSlide({int delay = 0}) {
    return animate(delay: Duration(milliseconds: delay))
        .fadeIn(duration: 380.ms, curve: Curves.easeOutCubic)
        .slideY(begin: 0.16, end: 0, curve: Curves.easeOutCubic);
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.name, required this.empresa});
  final String name;
  final String empresa;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: AppColors.brandSoft,
            borderRadius: BorderRadius.circular(16),
          ),
          alignment: Alignment.center,
          child: Text(
            name.isNotEmpty ? name[0].toUpperCase() : 'U',
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
              Text(
                'Hola, $name',
                style: context.text.headlineMedium,
                overflow: TextOverflow.ellipsis,
              ),
              if (empresa.isNotEmpty)
                Text(
                  empresa,
                  style: context.text.bodySmall,
                  overflow: TextOverflow.ellipsis,
                ),
            ],
          ),
        ),
        IconButton(
          icon: Icon(
            LucideIcons.bell,
            size: 22,
            color: context.colors.onSurface,
          ),
          onPressed: () {},
        ),
      ],
    );
  }
}

class _PrimaryAction extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.brand, AppColors.brandDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.brand.withValues(alpha: 0.32),
            blurRadius: 28,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'Vender ahora',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.4,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Abre el POS y empieza a cobrar',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.18),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              LucideIcons.arrowRight,
              color: Colors.white,
              size: 24,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.colors.outline, width: 0.6),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const Spacer(),
          Text(label, style: context.text.bodySmall),
          const SizedBox(height: 2),
          Text(
            value,
            style: context.text.headlineSmall?.copyWith(
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
        ],
      ),
    );
  }
}
