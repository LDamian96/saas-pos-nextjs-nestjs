// =============================================================================
// splash_page.dart
// Splash ULTRAMODERNO: gradient mesh diagonal + orbes flotantes desenfocados +
// logo con glassmorphism + barra de progreso brand.
// Sin pantalla blanca previa (configurado flutter_native_splash + theme).
// =============================================================================

import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:pos_mobile/app/router/route_names.dart';
import 'package:pos_mobile/app/theme/app_colors.dart';
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
    // CRÍTICO: bootstrap modifica provider — no se puede en initState.
    WidgetsBinding.instance.addPostFrameCallback((_) => _start());
  }

  Future<void> _start() async {
    try {
      final minSplash = Future<void>.delayed(const Duration(milliseconds: 1800));
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
      if (mounted) context.go(destination);
    } catch (e, st) {
      debugPrint('Splash bootstrap error: $e\n$st');
      if (mounted) context.go(RouteNames.loginCredentials);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050A07),
      body: Stack(
        children: [
          // Fondo base oscuro
          const Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(color: Color(0xFF050A07)),
            ),
          ),

          // Mesh gradient — capa diagonal verde brand
          const Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF00C16A),
                    Color(0xFF018D40),
                    Color(0xFF003318),
                    Color(0xFF050A07),
                  ],
                  stops: [0.0, 0.35, 0.7, 1.0],
                ),
              ),
            ),
          ),

          // Capa diagonal opuesta: cyan/teal sutil para mesh feel
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomLeft,
                  end: Alignment.topRight,
                  colors: [
                    const Color(0xFF00E0C8).withValues(alpha: 0.28),
                    Colors.transparent,
                    const Color(0xFF6B5BFF).withValues(alpha: 0.18),
                  ],
                  stops: const [0.0, 0.6, 1.0],
                ),
              ),
            ),
          ),

          // Orbes flotantes desenfocados — efecto mesh moderno
          const _FloatingOrb(
            top: -80,
            right: -60,
            size: 280,
            color: Color(0xFF00FF95),
            opacity: 0.55,
          ),
          const _FloatingOrb(
            bottom: -100,
            left: -80,
            size: 320,
            color: Color(0xFF00CFE2),
            opacity: 0.40,
          ),
          const _FloatingOrb(
            top: 280,
            left: -50,
            size: 200,
            color: Color(0xFF8B5CF6),
            opacity: 0.32,
          ),

          // Capa de blur encima de los orbes
          Positioned.fill(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 80, sigmaY: 80),
              child: const SizedBox.expand(),
            ),
          ),

          // Grain noise muy sutil (vignette dark en bordes)
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment.center,
                  radius: 1.2,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.45),
                  ],
                  stops: const [0.4, 1.0],
                ),
              ),
            ),
          ),

          // Contenido
          SafeArea(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const _GlassLogo()
                      .animate()
                      .scale(
                        begin: const Offset(0.6, 0.6),
                        end: const Offset(1, 1),
                        duration: 700.ms,
                        curve: Curves.elasticOut,
                      )
                      .fadeIn(duration: 400.ms),
                  const SizedBox(height: 32),
                  Text(
                    'POS SHOP',
                    style: TextStyle(
                      fontSize: 30,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 8,
                      color: Colors.white,
                      shadows: [
                        Shadow(
                          color: Colors.black.withValues(alpha: 0.4),
                          blurRadius: 24,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                  )
                      .animate(delay: 350.ms)
                      .fadeIn(duration: 500.ms)
                      .slideY(begin: 0.4, end: 0, curve: Curves.easeOutCubic),
                  const SizedBox(height: 10),
                  Text(
                    'Tu negocio en tu mano',
                    style: TextStyle(
                      fontSize: 14,
                      letterSpacing: 1.6,
                      fontWeight: FontWeight.w500,
                      color: Colors.white.withValues(alpha: 0.85),
                    ),
                  ).animate(delay: 600.ms).fadeIn(duration: 500.ms),
                ],
              ),
            ),
          ),

          // Barra de carga sutil abajo
          Positioned(
            left: 60,
            right: 60,
            bottom: 56,
            child: _LoadingBar()
                .animate(delay: 800.ms)
                .fadeIn(duration: 400.ms),
          ),
        ],
      ),
    );
  }
}

class _FloatingOrb extends StatelessWidget {
  const _FloatingOrb({
    required this.size,
    required this.color,
    required this.opacity,
    this.top,
    this.bottom,
    this.left,
    this.right,
  });

  final double size;
  final Color color;
  final double opacity;
  final double? top;
  final double? bottom;
  final double? left;
  final double? right;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [
              color.withValues(alpha: opacity),
              color.withValues(alpha: 0),
            ],
          ),
        ),
      ),
    );
  }
}

class _GlassLogo extends StatelessWidget {
  const _GlassLogo();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 120,
      height: 120,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Halo brand exterior
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  AppColors.brand.withValues(alpha: 0.7),
                  Colors.transparent,
                ],
              ),
            ),
          ),
          // Anillo rotando suave
          _RotatingRing(),
          // Card glassmorphism interior
          ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
              child: Container(
                width: 84,
                height: 84,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.35),
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.brand.withValues(alpha: 0.55),
                      blurRadius: 40,
                      spreadRadius: 4,
                    ),
                  ],
                ),
                child: const Icon(
                  LucideIcons.store,
                  color: Colors.white,
                  size: 38,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RotatingRing extends StatefulWidget {
  @override
  State<_RotatingRing> createState() => _RotatingRingState();
}

class _RotatingRingState extends State<_RotatingRing>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 6),
  )..repeat();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, child) => Transform.rotate(
        angle: _ctrl.value * 2 * math.pi,
        child: child,
      ),
      child: CustomPaint(
        size: const Size(110, 110),
        painter: _RingPainter(),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..shader = SweepGradient(
        colors: [
          Colors.transparent,
          Colors.white.withValues(alpha: 0.0),
          Colors.white.withValues(alpha: 0.6),
          Colors.white.withValues(alpha: 0.0),
          Colors.transparent,
        ],
        stops: const [0.0, 0.5, 0.7, 0.85, 1.0],
      ).createShader(Rect.fromCircle(
        center: size.center(Offset.zero),
        radius: size.width / 2,
      ))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawCircle(size.center(Offset.zero), size.width / 2 - 1, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _LoadingBar extends StatefulWidget {
  @override
  State<_LoadingBar> createState() => _LoadingBarState();
}

class _LoadingBarState extends State<_LoadingBar>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  )..forward();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(99),
          child: SizedBox(
            height: 4,
            child: Stack(
              children: [
                Container(color: Colors.white.withValues(alpha: 0.12)),
                AnimatedBuilder(
                  animation: _ctrl,
                  builder: (_, __) => FractionallySizedBox(
                    alignment: Alignment.centerLeft,
                    widthFactor: _ctrl.value,
                    child: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Color(0xFF00FF95),
                            Color(0xFF00CFE2),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),
        Text(
          'Preparando todo…',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.55),
            fontSize: 12,
            letterSpacing: 1.2,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
