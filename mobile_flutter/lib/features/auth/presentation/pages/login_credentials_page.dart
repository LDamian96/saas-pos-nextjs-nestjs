// =============================================================================
// login_credentials_page.dart — Login ultramoderno
// Fondo gradient mesh + orbes flotantes + glassmorphism card + inputs flotantes
// con float-label suave + botón gigante con halo + animaciones de entrada
// stagger + transición sin pantalla negra.
// =============================================================================

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:pos_mobile/app/router/route_names.dart';
import 'package:pos_mobile/app/theme/app_colors.dart';
import 'package:pos_mobile/core/services/toast_service.dart';
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

  Future<void> _fillDemo() async {
    setState(() {
      _emailCtrl.text = _demoEmail;
      _passCtrl.text = _demoPassword;
    });
    await _submit();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final loading = authState is AuthLoading;

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          // Fondo base mesh gradient diagonal (igual al splash → sin transición)
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
          // Capa cyan/purple
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomLeft,
                  end: Alignment.topRight,
                  colors: [
                    const Color(0xFF00E0C8).withValues(alpha: 0.20),
                    Colors.transparent,
                    const Color(0xFF6B5BFF).withValues(alpha: 0.14),
                  ],
                  stops: const [0.0, 0.6, 1.0],
                ),
              ),
            ),
          ),
          // Orbes
          const _Orb(top: -100, right: -70, size: 240, color: Color(0xFF00FF95), opacity: 0.55),
          const _Orb(bottom: 140, left: -90, size: 280, color: Color(0xFF00CFE2), opacity: 0.35),
          Positioned.fill(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 70, sigmaY: 70),
              child: const SizedBox.expand(),
            ),
          ),

          // Contenido
          SafeArea(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(24, 32, 24, 32),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 24),

                    // Header con avatar/icono carrito glass
                    Row(
                      children: [
                        _HeaderLogo()
                            .animate()
                            .scale(
                              begin: const Offset(0.6, 0.6),
                              end: const Offset(1, 1),
                              duration: 500.ms,
                              curve: Curves.elasticOut,
                            )
                            .fadeIn(duration: 300.ms),
                      ],
                    ),
                    const SizedBox(height: 28),
                    Text(
                      'Hola de\nnuevo 👋',
                      style: TextStyle(
                        fontSize: 38,
                        height: 1.05,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -1.2,
                        color: Colors.white,
                        shadows: [
                          Shadow(
                            color: Colors.black.withValues(alpha: 0.25),
                            blurRadius: 20,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                    )
                        .animate(delay: 150.ms)
                        .fadeIn(duration: 500.ms)
                        .slideX(begin: -0.15, end: 0, curve: Curves.easeOutCubic),
                    const SizedBox(height: 6),
                    Text(
                      'Entra a tu negocio',
                      style: TextStyle(
                        fontSize: 15,
                        color: Colors.white.withValues(alpha: 0.75),
                        letterSpacing: 0.3,
                        fontWeight: FontWeight.w500,
                      ),
                    )
                        .animate(delay: 250.ms)
                        .fadeIn(duration: 500.ms)
                        .slideX(begin: -0.15, end: 0, curve: Curves.easeOutCubic),
                    const SizedBox(height: 32),

                    // Card glassmorphism con los inputs
                    _GlassCard(
                      child: Column(
                        children: [
                          _ModernInput(
                            controller: _emailCtrl,
                            hint: 'tu@email.com',
                            label: 'Correo',
                            icon: LucideIcons.mail,
                            keyboardType: TextInputType.emailAddress,
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) {
                                return 'Ingresa tu correo';
                              }
                              if (!v.contains('@')) return 'Correo inválido';
                              return null;
                            },
                          ),
                          const _GlassDivider(),
                          _ModernInput(
                            controller: _passCtrl,
                            hint: '••••••••',
                            label: 'Contraseña',
                            icon: LucideIcons.lock,
                            obscure: _obscure,
                            suffix: GestureDetector(
                              onTap: () =>
                                  setState(() => _obscure = !_obscure),
                              child: Icon(
                                _obscure ? LucideIcons.eye : LucideIcons.eyeOff,
                                color: Colors.white.withValues(alpha: 0.7),
                                size: 20,
                              ),
                            ),
                            onSubmit: (_) => _submit(),
                            validator: (v) {
                              if (v == null || v.isEmpty) {
                                return 'Ingresa tu contraseña';
                              }
                              if (v.length < 4) return 'Muy corta';
                              return null;
                            },
                          ),
                        ],
                      ),
                    )
                        .animate(delay: 350.ms)
                        .fadeIn(duration: 500.ms)
                        .slideY(begin: 0.1, end: 0, curve: Curves.easeOutCubic),

                    const SizedBox(height: 28),

                    // Botón Continuar gigante con halo
                    _GlowButton(
                      label: 'Continuar',
                      icon: LucideIcons.arrowRight,
                      loading: loading,
                      onPressed: loading ? null : _submit,
                    )
                        .animate(delay: 500.ms)
                        .fadeIn(duration: 400.ms)
                        .slideY(begin: 0.2, end: 0, curve: Curves.easeOutCubic),

                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: Divider(
                            color: Colors.white.withValues(alpha: 0.18),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            'o prueba sin registrarte',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.55),
                              fontSize: 11,
                              letterSpacing: 0.4,
                            ),
                          ),
                        ),
                        Expanded(
                          child: Divider(
                            color: Colors.white.withValues(alpha: 0.18),
                          ),
                        ),
                      ],
                    ).animate(delay: 600.ms).fadeIn(duration: 400.ms),
                    const SizedBox(height: 16),

                    // Botón Demo glass outline
                    _OutlineGlassButton(
                      label: 'Entrar como Demo · Tienda Demo',
                      icon: LucideIcons.userRound,
                      onPressed: loading ? null : _fillDemo,
                    )
                        .animate(delay: 700.ms)
                        .fadeIn(duration: 400.ms)
                        .slideY(begin: 0.15, end: 0, curve: Curves.easeOutCubic),

                    const SizedBox(height: 22),
                    Center(
                      child: Text(
                        'Después configurarás un PIN rápido',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.55),
                          fontSize: 12,
                          letterSpacing: 0.4,
                        ),
                      ),
                    ).animate(delay: 800.ms).fadeIn(duration: 400.ms),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HeaderLogo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.18),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.35),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.brand.withValues(alpha: 0.55),
                blurRadius: 30,
                spreadRadius: 1,
              ),
            ],
          ),
          child: const Icon(
            LucideIcons.shoppingCart,
            color: Colors.white,
            size: 28,
          ),
        ),
      ),
    );
  }
}

class _GlassCard extends StatelessWidget {
  const _GlassCard({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(28),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.20),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.18),
                blurRadius: 30,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }
}

class _GlassDivider extends StatelessWidget {
  const _GlassDivider();
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 1,
      margin: const EdgeInsets.symmetric(horizontal: 18),
      color: Colors.white.withValues(alpha: 0.10),
    );
  }
}

class _ModernInput extends StatefulWidget {
  const _ModernInput({
    required this.controller,
    required this.label,
    required this.hint,
    required this.icon,
    this.obscure = false,
    this.keyboardType,
    this.suffix,
    this.validator,
    this.onSubmit,
  });

  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData icon;
  final bool obscure;
  final TextInputType? keyboardType;
  final Widget? suffix;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onSubmit;

  @override
  State<_ModernInput> createState() => _ModernInputState();
}

class _ModernInputState extends State<_ModernInput> {
  late final FocusNode _focus = FocusNode()..addListener(_onFocus);
  bool _focused = false;

  void _onFocus() {
    setState(() => _focused = _focus.hasFocus);
  }

  @override
  void dispose() {
    _focus.removeListener(_onFocus);
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color =
        _focused ? Colors.white : Colors.white.withValues(alpha: 0.7);
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 14),
      child: Row(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: _focused
                  ? AppColors.brand.withValues(alpha: 0.45)
                  : Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(widget.icon, color: color, size: 18),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  widget.label.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    letterSpacing: 1.6,
                    fontWeight: FontWeight.w700,
                    color: Colors.white.withValues(alpha: 0.55),
                  ),
                ),
                const SizedBox(height: 2),
                TextFormField(
                  controller: widget.controller,
                  focusNode: _focus,
                  obscureText: widget.obscure,
                  keyboardType: widget.keyboardType,
                  textInputAction: widget.onSubmit == null
                      ? TextInputAction.next
                      : TextInputAction.done,
                  onFieldSubmitted: widget.onSubmit,
                  validator: widget.validator,
                  autocorrect: false,
                  cursorColor: Colors.white,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                  decoration: InputDecoration(
                    hintText: widget.hint,
                    hintStyle: TextStyle(
                      color: Colors.white.withValues(alpha: 0.35),
                      fontWeight: FontWeight.w500,
                    ),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    errorBorder: InputBorder.none,
                    focusedErrorBorder: InputBorder.none,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 4),
                    errorStyle: TextStyle(
                      color: Colors.orange.shade200,
                      fontSize: 11,
                      height: 1.2,
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (widget.suffix != null) ...[
            const SizedBox(width: 8),
            widget.suffix!,
          ],
        ],
      ),
    );
  }
}

class _GlowButton extends StatelessWidget {
  const _GlowButton({
    required this.label,
    required this.icon,
    required this.onPressed,
    required this.loading,
  });
  final String label;
  final IconData icon;
  final VoidCallback? onPressed;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null;
    return GestureDetector(
      onTap: disabled ? null : onPressed,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 240),
        height: 62,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF00FF95), Color(0xFF00C16A)],
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: disabled
              ? null
              : [
                  BoxShadow(
                    color: const Color(0xFF00FF95).withValues(alpha: 0.55),
                    blurRadius: 30,
                    spreadRadius: 1,
                    offset: const Offset(0, 10),
                  ),
                ],
        ),
        child: Center(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 220),
            child: loading
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.4,
                      valueColor: AlwaysStoppedAnimation(Color(0xFF003318)),
                    ),
                  )
                : Row(
                    key: const ValueKey('label'),
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        label,
                        style: const TextStyle(
                          color: Color(0xFF003318),
                          fontWeight: FontWeight.w800,
                          fontSize: 17,
                          letterSpacing: 0.2,
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Icon(
                        LucideIcons.arrowRight,
                        size: 20,
                        color: Color(0xFF003318),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

class _OutlineGlassButton extends StatelessWidget {
  const _OutlineGlassButton({
    required this.label,
    required this.icon,
    required this.onPressed,
  });
  final String label;
  final IconData icon;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
          child: Container(
            height: 54,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.30),
                width: 1.2,
              ),
            ),
            child: Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, color: Colors.white, size: 18),
                  const SizedBox(width: 10),
                  Text(
                    label,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      letterSpacing: 0.2,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Orb extends StatelessWidget {
  const _Orb({
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
  final double? top, bottom, left, right;

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
