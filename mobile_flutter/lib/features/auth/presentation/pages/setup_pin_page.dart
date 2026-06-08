// =============================================================================
// setup_pin_page.dart
// Después del primer login: el usuario crea un PIN de 4 dígitos.
// Pide ingresarlo dos veces. Si OK → preguntar habilitar biometría.
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
import 'package:pos_mobile/core/services/biometric_service.dart';
import 'package:pos_mobile/core/services/haptic_service.dart';
import 'package:pos_mobile/core/widgets/buttons/primary_button.dart';
import 'package:pos_mobile/features/auth/presentation/providers/auth_controller.dart';
import 'package:pos_mobile/features/auth/presentation/widgets/pin_dots.dart';
import 'package:pos_mobile/features/auth/presentation/widgets/pin_keypad.dart';

enum _Stage { create, confirm }

class SetupPinPage extends ConsumerStatefulWidget {
  const SetupPinPage({super.key});

  @override
  ConsumerState<SetupPinPage> createState() => _SetupPinPageState();
}

class _SetupPinPageState extends ConsumerState<SetupPinPage> {
  static const _pinLength = 4;

  _Stage _stage = _Stage.create;
  String _first = '';
  String _current = '';
  bool _shake = false;

  void _onDigit(String d) {
    if (_current.length >= _pinLength) return;
    setState(() => _current += d);
    if (_current.length == _pinLength) {
      _handleComplete();
    }
  }

  void _onBackspace() {
    if (_current.isEmpty) return;
    setState(() => _current = _current.substring(0, _current.length - 1));
  }

  Future<void> _handleComplete() async {
    await Future<void>.delayed(const Duration(milliseconds: 180));
    if (_stage == _Stage.create) {
      _first = _current;
      setState(() {
        _stage = _Stage.confirm;
        _current = '';
      });
    } else {
      if (_current == _first) {
        await ref.read(hapticServiceProvider).success();
        final ok = await ref
            .read(authControllerProvider.notifier)
            .savePin(_first);
        if (!ok || !mounted) return;
        await _askBiometric();
      } else {
        await ref.read(hapticServiceProvider).error();
        setState(() => _shake = true);
        await Future<void>.delayed(const Duration(milliseconds: 450));
        if (!mounted) return;
        setState(() {
          _shake = false;
          _current = '';
          _first = '';
          _stage = _Stage.create;
        });
      }
    }
  }

  Future<void> _askBiometric() async {
    final biometric = ref.read(biometricServiceProvider);
    final available = await biometric.isAvailable();
    if (!mounted) return;

    if (available) {
      final activar = await showModalBottomSheet<bool>(
        context: context,
        backgroundColor: Colors.transparent,
        isScrollControlled: true,
        builder: (_) => const _BiometricSheet(),
      );
      if (activar ?? false) {
        await ref
            .read(authControllerProvider.notifier)
            .setBiometricEnabled(true);
      }
    }
    if (!mounted) return;
    context.go(RouteNames.home);
  }

  @override
  Widget build(BuildContext context) {
    final title =
        _stage == _Stage.create ? 'Crea tu PIN' : 'Vuelve a ingresarlo';
    final subtitle = _stage == _Stage.create
        ? '4 dígitos para abrir tu negocio rápido'
        : 'Para confirmar que lo recuerdas';

    return Scaffold(
      backgroundColor: context.isDark ? AppColors.darkBg : AppColors.lightBg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.screenPaddingH,
          ),
          child: Column(
            children: [
              const SizedBox(height: 24),
              Align(
                alignment: Alignment.centerLeft,
                child: IconButton(
                  icon: const Icon(LucideIcons.arrowLeft),
                  onPressed: () => context.pop(),
                ),
              ),
              const Spacer(),
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppColors.brandSoft,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  LucideIcons.lock,
                  color: AppColors.brand,
                  size: 28,
                ),
              )
                  .animate(key: ValueKey(_stage))
                  .scale(
                    begin: const Offset(0.7, 0.7),
                    end: const Offset(1, 1),
                    duration: 380.ms,
                    curve: Curves.easeOutBack,
                  )
                  .fadeIn(duration: 280.ms),
              const SizedBox(height: 24),
              Text(title, style: context.text.headlineLarge),
              const SizedBox(height: 6),
              Text(
                subtitle,
                style: context.text.bodyMedium?.copyWith(
                  color: context.colors.onSurface.withValues(alpha: 0.6),
                ),
              ),
              const SizedBox(height: 32),
              PinDots(
                length: _pinLength,
                entered: _current.length,
                shake: _shake,
              ),
              const Spacer(),
              PinKeypad(
                onDigit: _onDigit,
                onBackspace: _onBackspace,
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _BiometricSheet extends StatelessWidget {
  const _BiometricSheet();
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 36,
              height: 4,
              margin: const EdgeInsets.only(bottom: 24),
              decoration: BoxDecoration(
                color: context.colors.outline,
                borderRadius: BorderRadius.circular(99),
              ),
            ),
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.brandSoft,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.fingerprint,
                color: AppColors.brand,
                size: 36,
              ),
            ),
            const SizedBox(height: 20),
            Text('Activar huella digital', style: context.text.headlineSmall),
            const SizedBox(height: 8),
            Text(
              'Abre tu negocio aún más rápido. Solo tú podrás entrar con tu huella.',
              textAlign: TextAlign.center,
              style: context.text.bodyMedium?.copyWith(
                color: context.colors.onSurface.withValues(alpha: 0.7),
              ),
            ),
            const SizedBox(height: 24),
            PrimaryButton(
              label: 'Activar huella',
              icon: LucideIcons.fingerprint,
              onPressed: () => Navigator.of(context).pop(true),
            ),
            const SizedBox(height: 10),
            PrimaryButton.ghost(
              label: 'Ahora no',
              onPressed: () => Navigator.of(context).pop(false),
            ),
          ],
        ),
      ),
    );
  }
}
