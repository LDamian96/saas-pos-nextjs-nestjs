// =============================================================================
// login_credentials_page.dart
// Primera vez que el cliente abre la app — login con email + password.
// Después de éxito → setup PIN.
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
import 'package:pos_mobile/core/services/toast_service.dart';
import 'package:pos_mobile/core/widgets/buttons/primary_button.dart';
import 'package:pos_mobile/features/auth/presentation/providers/auth_controller.dart';

class LoginCredentialsPage extends ConsumerStatefulWidget {
  const LoginCredentialsPage({super.key});

  @override
  ConsumerState<LoginCredentialsPage> createState() =>
      _LoginCredentialsPageState();
}

class _LoginCredentialsPageState extends ConsumerState<LoginCredentialsPage> {
  static const _demoEmail = 'admin@demo.com';
  static const _demoPassword = 'admin123';

  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;

  void _fillDemo() {
    setState(() {
      _emailCtrl.text = _demoEmail;
      _passCtrl.text = _demoPassword;
    });
    _submit();
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    final toast = ref.read(toastServiceProvider);

    await ref.read(authControllerProvider.notifier).loginWithCredentials(
          _emailCtrl.text.trim(),
          _passCtrl.text,
        );
    if (!mounted) return;
    final state = ref.read(authControllerProvider);
    if (state is AuthSetupRequired) {
      toast.success(context, message: 'Bienvenido, ahora crea tu PIN');
      context.go(RouteNames.setupPin);
    } else if (state is AuthUnauthenticated && state.message != null) {
      toast.error(
        context,
        title: 'No pudimos entrar',
        message: state.message!,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final loading = authState is AuthLoading;

    return Scaffold(
      backgroundColor: context.isDark ? AppColors.darkBg : AppColors.lightBg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.screenPaddingH,
            vertical: AppSpacing.lg,
          ),
          child: Form(
            key: _formKey,
            child: ListView(
              physics: const BouncingScrollPhysics(),
              children: [
                const SizedBox(height: 32),
                _Header().animate().fadeIn(duration: 380.ms).slideY(
                      begin: -0.2,
                      end: 0,
                      curve: Curves.easeOutCubic,
                    ),
                const SizedBox(height: 36),
                _label('Correo'),
                const Gap(),
                TextFormField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autocorrect: false,
                  decoration: InputDecoration(
                    hintText: 'tu@email.com',
                    prefixIcon: const Icon(LucideIcons.mail, size: 20),
                    prefixIconColor: context.colors.outline,
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Ingresa tu correo';
                    if (!v.contains('@')) return 'Correo inválido';
                    return null;
                  },
                )
                    .animate(delay: 80.ms)
                    .fadeIn(duration: 320.ms)
                    .slideY(begin: 0.2, end: 0, curve: Curves.easeOutCubic),
                const SizedBox(height: 16),
                _label('Contraseña'),
                const Gap(),
                TextFormField(
                  controller: _passCtrl,
                  obscureText: _obscure,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  decoration: InputDecoration(
                    hintText: '••••••••',
                    prefixIcon: const Icon(LucideIcons.lock, size: 20),
                    prefixIconColor: context.colors.outline,
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscure ? LucideIcons.eye : LucideIcons.eyeOff,
                        size: 20,
                      ),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Ingresa tu contraseña';
                    if (v.length < 4) return 'Contraseña muy corta';
                    return null;
                  },
                )
                    .animate(delay: 160.ms)
                    .fadeIn(duration: 320.ms)
                    .slideY(begin: 0.2, end: 0, curve: Curves.easeOutCubic),
                const SizedBox(height: 32),
                PrimaryButton(
                  label: 'Continuar',
                  icon: LucideIcons.arrowRight,
                  loading: loading,
                  onPressed: loading ? null : _submit,
                ).animate(delay: 240.ms).fadeIn(duration: 320.ms),
                const SizedBox(height: 16),
                _DemoDivider().animate(delay: 280.ms).fadeIn(duration: 320.ms),
                const SizedBox(height: 16),
                PrimaryButton.outline(
                  label: 'Entrar como Demo (Tienda Demo)',
                  icon: LucideIcons.userRound,
                  onPressed: loading ? null : _fillDemo,
                ).animate(delay: 320.ms).fadeIn(duration: 320.ms),
                const SizedBox(height: 20),
                Center(
                  child: Text(
                    'Después configurarás un PIN rápido',
                    style: context.text.bodySmall,
                  ),
                ).animate(delay: 380.ms).fadeIn(duration: 320.ms),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _label(String text) {
    return Text(
      text,
      style: context.text.labelMedium?.copyWith(
        color: context.colors.onSurface.withValues(alpha: 0.8),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
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
          child: const Icon(LucideIcons.store, color: Colors.white, size: 28),
        ),
        const SizedBox(height: 20),
        Text(
          'Hola de nuevo',
          style: context.text.displayMedium,
        ),
        const SizedBox(height: 6),
        Text(
          'Abre tu negocio con tu cuenta',
          style: context.text.bodyLarge?.copyWith(
            color: context.colors.onSurface.withValues(alpha: 0.6),
          ),
        ),
      ],
    );
  }
}

class Gap extends StatelessWidget {
  const Gap({super.key, this.h = 6});
  final double h;
  @override
  Widget build(BuildContext context) => SizedBox(height: h);
}

class _DemoDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final color = context.colors.outline;
    return Row(
      children: [
        Expanded(child: Divider(color: color, thickness: 0.8)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            'o prueba sin registrarte',
            style: context.text.bodySmall?.copyWith(
              color: context.colors.onSurface.withValues(alpha: 0.5),
              fontSize: 11,
              letterSpacing: 0.4,
            ),
          ),
        ),
        Expanded(child: Divider(color: color, thickness: 0.8)),
      ],
    );
  }
}
