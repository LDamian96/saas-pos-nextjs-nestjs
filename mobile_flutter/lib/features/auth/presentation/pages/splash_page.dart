// =============================================================================
// splash_page.dart
// Splash inicial elegante (1.2-1.5s mientras bootstrap).
// Logo verde con pulso + texto fade + barra de carga sutil.
// Cross-fade automático a la pantalla destino (PIN, login, home).
// =============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:pos_mobile/app/router/route_names.dart';
import 'package:pos_mobile/app/theme/app_colors.dart';
import 'package:pos_mobile/core/extensions/context_x.dart';
import 'package:pos_mobile/features/auth/presentation/providers/auth_controller.dart';

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage> {
  @override
  void initState() {
    super.initState();
    _start();
  }

  Future<void> _start() async {
    // Animación mínima visible (no parpadea si bootstrap fue rápido).
    final minSplash = Future<void>.delayed(const Duration(milliseconds: 1400));
    await ref.read(authControllerProvider.notifier).bootstrap();
    await minSplash;
    if (!mounted) return;

    final state = ref.read(authControllerProvider);
    final destination = switch (state) {
      AuthAuthenticated() => RouteNames.home,
      AuthPinRequired() => RouteNames.loginPin,
      AuthSetupRequired() => RouteNames.setupPin,
      _ => RouteNames.loginCredentials,
    };
    context.go(destination);
  }

  @override
  Widget build(BuildContext context) {
    final brand = AppColors.brand;
    final isDark = context.isDark;
    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : AppColors.lightBg,
      body: SafeArea(
        child: Stack(
          children: [
            // Halo radial detrás del logo
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    colors: [
                      brand.withValues(alpha: isDark ? 0.18 : 0.10),
                      Colors.transparent,
                    ],
                    radius: 0.7,
                  ),
                ),
              ),
            ),
            // Contenido
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _LogoMark(brand: brand).animate().scale(
                        begin: const Offset(0.7, 0.7),
                        end: const Offset(1, 1),
                        duration: 600.ms,
                        curve: Curves.easeOutBack,
                      ).then(delay: 100.ms).shimmer(
                        duration: 1200.ms,
                        color: Colors.white.withValues(alpha: 0.5),
                        size: 0.8,
                      ),
                  const SizedBox(height: 28),
                  Text(
                    'POS SHOP',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 6,
                      color: isDark ? AppColors.darkText : AppColors.lightText,
                    ),
                  )
                      .animate(delay: 300.ms)
                      .fadeIn(duration: 400.ms)
                      .slideY(begin: 0.3, end: 0, curve: Curves.easeOutCubic),
                  const SizedBox(height: 8),
                  Text(
                    'Tu negocio en tu mano',
                    style: TextStyle(
                      fontSize: 13,
                      letterSpacing: 0.6,
                      color: isDark
                          ? AppColors.darkTextMuted
                          : AppColors.lightTextMuted,
                    ),
                  ).animate(delay: 500.ms).fadeIn(duration: 400.ms),
                ],
              ),
            ),
            // Loading bar abajo
            Positioned(
              left: 60,
              right: 60,
              bottom: 48,
              child: _LoadingBar(),
            ),
          ],
        ),
      ),
    );
  }
}

class _LogoMark extends StatelessWidget {
  const _LogoMark({required this.brand});
  final Color brand;
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 96,
      height: 96,
      decoration: BoxDecoration(
        color: brand,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: brand.withValues(alpha: 0.45),
            blurRadius: 32,
            spreadRadius: 2,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: const Icon(LucideIcons.store, color: Colors.white, size: 44),
    );
  }
}

class _LoadingBar extends StatefulWidget {
  @override
  State<_LoadingBar> createState() => _LoadingBarState();
}

class _LoadingBarState extends State<_LoadingBar>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..forward();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(99),
      child: SizedBox(
        height: 3,
        child: AnimatedBuilder(
          animation: _ctrl,
          builder: (_, __) {
            return LinearProgressIndicator(
              value: _ctrl.value,
              backgroundColor: Colors.transparent,
              valueColor: const AlwaysStoppedAnimation(AppColors.brand),
              minHeight: 3,
            );
          },
        ),
      ),
    );
  }
}
