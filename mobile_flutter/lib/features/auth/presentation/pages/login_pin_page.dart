// =============================================================================
// login_pin_page.dart
// Login del día a día: PIN + opcional huella. Si biometric_enabled, intenta
// auto al abrir la pantalla.
// =============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:pos_mobile/app/router/route_names.dart';
import 'package:pos_mobile/app/theme/app_colors.dart';
import 'package:pos_mobile/app/theme/app_spacing.dart';
import 'package:pos_mobile/core/extensions/context_x.dart';
import 'package:pos_mobile/core/services/haptic_service.dart';
import 'package:pos_mobile/features/auth/presentation/providers/auth_controller.dart';
import 'package:pos_mobile/features/auth/presentation/widgets/pin_dots.dart';
import 'package:pos_mobile/features/auth/presentation/widgets/pin_keypad.dart';

class LoginPinPage extends ConsumerStatefulWidget {
  const LoginPinPage({super.key});

  @override
  ConsumerState<LoginPinPage> createState() => _LoginPinPageState();
}

class _LoginPinPageState extends ConsumerState<LoginPinPage> {
  static const _pinLength = 4;
  String _current = '';
  bool _shake = false;
  bool _success = false;
  bool _biometricAvailable = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _initBiometric());
  }

  Future<void> _initBiometric() async {
    final enabled = await ref
        .read(authControllerProvider.notifier)
        .isBiometricEnabled();
    if (!mounted) return;
    setState(() => _biometricAvailable = enabled);
    if (enabled) {
      // Pequeño delay para que la UI termine de aparecer antes del prompt.
      await Future<void>.delayed(const Duration(milliseconds: 400));
      await _tryBiometric();
    }
  }

  Future<void> _tryBiometric() async {
    final ok = await ref
        .read(authControllerProvider.notifier)
        .authenticateWithBiometric();
    if (!mounted || !ok) return;
    await _onSuccess();
  }

  Future<void> _onDigit(String d) async {
    if (_current.length >= _pinLength) return;
    setState(() => _current += d);
    if (_current.length == _pinLength) {
      final ok = await ref
          .read(authControllerProvider.notifier)
          .verifyPin(_current);
      if (!mounted) return;
      if (ok) {
        await _onSuccess();
      } else {
        await ref.read(hapticServiceProvider).error();
        setState(() => _shake = true);
        await Future<void>.delayed(const Duration(milliseconds: 450));
        if (!mounted) return;
        setState(() {
          _shake = false;
          _current = '';
        });
      }
    }
  }

  Future<void> _onSuccess() async {
    await ref.read(hapticServiceProvider).success();
    setState(() => _success = true);
    await Future<void>.delayed(const Duration(milliseconds: 380));
    if (!mounted) return;
    context.go(RouteNames.home);
  }

  void _onBackspace() {
    if (_current.isEmpty) return;
    setState(() => _current = _current.substring(0, _current.length - 1));
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final userName = authState is AuthPinRequired
        ? authState.cachedUser.nombre
        : '';

    return Scaffold(
      backgroundColor: context.isDark ? AppColors.darkBg : AppColors.lightBg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.screenPaddingH,
          ),
          child: Column(
            children: [
              const Spacer(),
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: AppColors.brand,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.brand.withValues(alpha: 0.35),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: const Icon(
                  LucideIcons.store,
                  color: Colors.white,
                  size: 28,
                ),
              ).animate().scale(
                    begin: const Offset(0.7, 0.7),
                    end: const Offset(1, 1),
                    duration: 380.ms,
                    curve: Curves.easeOutBack,
                  ),
              const SizedBox(height: 20),
              Text(
                userName.isNotEmpty ? 'Hola, $userName' : 'Bienvenido',
                style: context.text.headlineLarge,
              ).animate(delay: 120.ms).fadeIn(duration: 300.ms),
              const SizedBox(height: 4),
              Text(
                'Ingresa tu PIN para continuar',
                style: context.text.bodyMedium?.copyWith(
                  color: context.colors.onSurface.withValues(alpha: 0.6),
                ),
              ).animate(delay: 180.ms).fadeIn(duration: 300.ms),
              const SizedBox(height: 32),
              PinDots(
                length: _pinLength,
                entered: _current.length,
                shake: _shake,
                success: _success,
              ),
              const Spacer(),
              PinKeypad(
                onDigit: _onDigit,
                onBackspace: _onBackspace,
                onBiometric: _biometricAvailable ? _tryBiometric : null,
              ),
              const SizedBox(height: 24),
              TextButton(
                onPressed: () async {
                  await ref.read(authControllerProvider.notifier).logout();
                  if (!context.mounted) return;
                  context.go(RouteNames.loginCredentials);
                },
                child: Text(
                  'Iniciar con otra cuenta',
                  style: context.text.bodySmall?.copyWith(
                    color: AppColors.brand,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
