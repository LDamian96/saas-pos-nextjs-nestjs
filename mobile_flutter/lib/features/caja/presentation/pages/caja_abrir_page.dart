// =============================================================================
// caja_abrir_page.dart — Abre la caja con monto inicial. UI sobria premium.
// =============================================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:pos_mobile/app/theme/app_colors.dart';
import 'package:pos_mobile/core/extensions/context_x.dart';
import 'package:pos_mobile/core/services/toast_service.dart';
import 'package:pos_mobile/features/caja/data/caja_repository.dart';

class CajaAbrirPage extends ConsumerStatefulWidget {
  const CajaAbrirPage({super.key});
  @override
  ConsumerState<CajaAbrirPage> createState() => _CajaAbrirPageState();
}

class _CajaAbrirPageState extends ConsumerState<CajaAbrirPage> {
  final _ctrl = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _abrir() async {
    final monto = double.tryParse(_ctrl.text.trim()) ?? 0;
    if (monto < 0) return;
    final toast = ref.read(toastServiceProvider);
    setState(() => _submitting = true);
    try {
      await ref.read(cajaRepositoryProvider).abrir(montoInicial: monto);
      ref.invalidate(cajaActualProvider);
      if (!mounted) return;
      toast.success(context, message: 'Caja abierta correctamente');
      context.pop();
    } catch (e) {
      if (!mounted) return;
      toast.error(context, message: e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FA),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  IconButton(
                    icon: const Icon(LucideIcons.arrowLeft),
                    onPressed: () => context.pop(),
                  ),
                  const Spacer(),
                ],
              ),
              const SizedBox(height: 20),
              const Icon(LucideIcons.wallet,
                      size: 56, color: AppColors.brand)
                  .animate()
                  .scale(
                      begin: const Offset(0.7, 0.7),
                      end: const Offset(1, 1),
                      duration: 380.ms,
                      curve: Curves.easeOutBack)
                  .fadeIn(duration: 320.ms),
              const SizedBox(height: 20),
              Text(
                'Abrir caja',
                textAlign: TextAlign.center,
                style: context.text.headlineLarge,
              ).animate(delay: 120.ms).fadeIn(duration: 320.ms),
              const SizedBox(height: 6),
              Text(
                'Ingresa el monto inicial de efectivo',
                textAlign: TextAlign.center,
                style: context.text.bodyMedium?.copyWith(
                  color: context.colors.onSurface.withValues(alpha: 0.6),
                ),
              ).animate(delay: 200.ms).fadeIn(duration: 320.ms),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE5E7E6)),
                ),
                child: Row(
                  children: [
                    const Text(
                      'S/',
                      style: TextStyle(
                        fontSize: 30,
                        fontWeight: FontWeight.w800,
                        color: AppColors.brand,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _ctrl,
                        autofocus: true,
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        style: const TextStyle(
                          fontSize: 36,
                          fontWeight: FontWeight.w800,
                          color: AppColors.lightText,
                          fontFeatures: [FontFeature.tabularFigures()],
                        ),
                        decoration: const InputDecoration(
                          hintText: '0.00',
                          border: InputBorder.none,
                          isCollapsed: true,
                          contentPadding: EdgeInsets.symmetric(vertical: 18),
                        ),
                      ),
                    ),
                  ],
                ),
              )
                  .animate(delay: 300.ms)
                  .fadeIn(duration: 320.ms)
                  .slideY(begin: 0.15, end: 0, curve: Curves.easeOutCubic),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.brand,
                    minimumSize: const Size.fromHeight(56),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  onPressed: _submitting ? null : _abrir,
                  child: _submitting
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.4,
                            valueColor:
                                AlwaysStoppedAnimation(Colors.white),
                          ),
                        )
                      : const Text(
                          'Abrir caja',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                          ),
                        ),
                ),
              ).animate(delay: 400.ms).fadeIn(duration: 320.ms),
            ],
          ),
        ),
      ),
    );
  }
}
