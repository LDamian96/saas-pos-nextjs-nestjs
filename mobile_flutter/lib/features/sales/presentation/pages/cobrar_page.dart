// =============================================================================
// cobrar_page.dart — Pago mixto + comprobantes (Ticket/Boleta/Factura).
// Stage 1: monto + selector método → se agrega como línea de pago.
// Stage 2: cuando suma >= total → muestra estado "Pago completo".
// Stage 3: tipo de comprobante + DNI/RUC condicional.
// Submit → POST /ventas → navega a éxito.
// =============================================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:pos_mobile/app/router/route_names.dart';
import 'package:pos_mobile/app/theme/app_colors.dart';
import 'package:pos_mobile/core/extensions/context_x.dart';
import 'package:pos_mobile/core/extensions/num_x.dart';
import 'package:pos_mobile/core/services/toast_service.dart';
import 'package:pos_mobile/features/caja/data/caja_repository.dart';
import 'package:pos_mobile/features/cart/presentation/cart_controller.dart';
import 'package:pos_mobile/features/sales/data/ventas_repository.dart';

class CobrarPage extends ConsumerStatefulWidget {
  const CobrarPage({super.key});

  @override
  ConsumerState<CobrarPage> createState() => _CobrarPageState();
}

class _CobrarPageState extends ConsumerState<CobrarPage> {
  final _montoCtrl = TextEditingController();
  final _docCtrl = TextEditingController();
  final List<PagoLinea> _pagos = [];
  bool _submitting = false;

  double get _sumaPagos =>
      _pagos.fold(0.0, (s, p) => s + p.monto);

  @override
  void dispose() {
    _montoCtrl.dispose();
    _docCtrl.dispose();
    super.dispose();
  }

  double get _restante {
    final total = ref.read(cartControllerProvider).total;
    return ((total - _sumaPagos) * 100).round() / 100;
  }

  void _agregarPago(MetodoPago metodo, double restante) {
    final montoIngresado = double.tryParse(_montoCtrl.text.trim()) ?? 0;
    final monto = montoIngresado > 0
        ? (montoIngresado > restante ? restante : montoIngresado)
        : restante;
    HapticFeedback.mediumImpact();
    setState(() {
      _pagos.add(PagoLinea(
        metodoPagoId: metodo.id,
        nombre: metodo.nombre,
        tipo: metodo.tipo,
        monto: monto,
      ));
      _montoCtrl.clear();
    });
  }

  void _eliminarPago(int idx) {
    HapticFeedback.lightImpact();
    setState(() => _pagos.removeAt(idx));
  }

  Future<void> _cobrar() async {
    final cart = ref.read(cartControllerProvider);
    final caja = ref.read(cajaActualProvider).valueOrNull;
    final toast = ref.read(toastServiceProvider);

    if (caja == null || caja.id.isEmpty) {
      toast.error(context, title: 'Sin caja', message: 'Abre la caja primero');
      return;
    }
    if (_sumaPagos + 0.01 < cart.total) {
      toast.warning(context, title: 'Falta', message: 'Aún faltan ${(_restante).toSoles}');
      return;
    }
    final tipo = cart.tipoComprobante;
    final doc = _docCtrl.text.trim();
    if (tipo == 'boleta' && doc.length != 8) {
      toast.warning(context, title: 'DNI', message: 'DNI debe tener 8 dígitos');
      return;
    }
    if (tipo == 'factura' && doc.length != 11) {
      toast.warning(context, title: 'RUC', message: 'RUC debe tener 11 dígitos');
      return;
    }

    setState(() => _submitting = true);
    try {
      final venta = await ref.read(ventasRepositoryProvider).crear(
            sucursalId: caja.sucursalId,
            cajaId: caja.id,
            tipoComprobante: tipo,
            clienteDocumento: tipo == 'ticket' ? null : doc,
            items: cart.items,
            pagos: _pagos,
          );
      ref.read(cartControllerProvider.notifier).clear();
      ref.invalidate(cajaActualProvider);
      if (!mounted) return;
      toast.success(context, title: 'Venta exitosa', message: venta.numero);
      context.go(RouteNames.cobrarExito);
    } catch (e) {
      if (!mounted) return;
      toast.error(context, message: e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartControllerProvider);
    final metodosAsync = ref.watch(metodosPagoProvider);
    final restante = _restante;
    final canCobrar = _pagos.isNotEmpty && restante <= 0.01 && !_submitting;

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FA),
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 4, 12, 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(LucideIcons.arrowLeft),
                    onPressed: () => context.pop(),
                  ),
                  Expanded(
                    child: Text(
                      'Cobrar',
                      style: context.text.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3,
                      ),
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ).animate().fadeIn(duration: 280.ms),

            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                physics: const BouncingScrollPhysics(),
                children: [
                  _TotalCard(total: cart.total, items: cart.items.length)
                      .animate()
                      .fadeIn(duration: 320.ms)
                      .slideY(begin: 0.15, end: 0, curve: Curves.easeOutCubic),
                  const SizedBox(height: 16),
                  if (_pagos.isNotEmpty) ...[
                    _Section('Pagos registrados'),
                    const SizedBox(height: 8),
                    for (int i = 0; i < _pagos.length; i++)
                      _PagoTile(
                        pago: _pagos[i],
                        onRemove: () => _eliminarPago(i),
                      )
                          .animate()
                          .fadeIn(duration: 220.ms)
                          .slideX(begin: -0.05, end: 0),
                    const SizedBox(height: 16),
                  ],
                  if (restante > 0.01)
                    metodosAsync.when(
                      loading: () => const Padding(
                        padding: EdgeInsets.all(12),
                        child: Center(child: CircularProgressIndicator()),
                      ),
                      error: (e, _) => _ErrorBox(message: e.toString()),
                      data: (metodos) => _PagoInput(
                        restante: restante,
                        montoCtrl: _montoCtrl,
                        metodos: metodos,
                        onTapMetodo: (m) => _agregarPago(m, restante),
                      ),
                    )
                  else
                    _PagoCompleto(
                            vuelto:
                                (_sumaPagos - cart.total).clamp(0, 99999999)
                                    as double)
                        .animate()
                        .fadeIn(duration: 300.ms)
                        .scale(
                            begin: const Offset(0.96, 0.96),
                            end: const Offset(1, 1),
                            curve: Curves.easeOutBack),
                  const SizedBox(height: 16),
                  _Section('Comprobante'),
                  const SizedBox(height: 8),
                  _ComprobanteRow(
                    selected: cart.tipoComprobante,
                    onSelect: (v) {
                      HapticFeedback.selectionClick();
                      ref
                          .read(cartControllerProvider.notifier)
                          .setComprobante(v);
                      _docCtrl.clear();
                    },
                  ),
                  if (cart.tipoComprobante == 'boleta' ||
                      cart.tipoComprobante == 'factura') ...[
                    const SizedBox(height: 10),
                    _DocInput(
                      controller: _docCtrl,
                      hint: cart.tipoComprobante == 'boleta'
                          ? 'DNI (8 dígitos)'
                          : 'RUC (11 dígitos)',
                      maxLength: cart.tipoComprobante == 'boleta' ? 8 : 11,
                    ),
                  ],
                ],
              ),
            ),

            // Footer
            Container(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Color(0xFFF1F3F2))),
                boxShadow: [
                  BoxShadow(
                    color: Color(0x10000000),
                    blurRadius: 16,
                    offset: Offset(0, -4),
                  ),
                ],
              ),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: canCobrar
                        ? AppColors.brand
                        : const Color(0xFFCBD5C9),
                    minimumSize: const Size.fromHeight(56),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  onPressed: canCobrar ? _cobrar : null,
                  child: _submitting
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              strokeWidth: 2.4,
                              valueColor:
                                  AlwaysStoppedAnimation(Colors.white)),
                        )
                      : Text(
                          canCobrar
                              ? 'Cobrar ${cart.total.toSoles}'
                              : restante > 0
                                  ? 'Falta ${restante.toSoles}'
                                  : 'Selecciona un método',
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                            letterSpacing: 0.2,
                          ),
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------

class _TotalCard extends StatelessWidget {
  const _TotalCard({required this.total, required this.items});
  final double total;
  final int items;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF00932C), Color(0xFF006920)],
        ),
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: AppColors.brand.withValues(alpha: 0.24),
            blurRadius: 22,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        children: [
          const Text(
            'TOTAL A COBRAR',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.6,
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            total.toSoles,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 40,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.8,
              fontFeatures: [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            items == 1 ? '1 producto' : '$items productos',
            style: TextStyle(
              fontSize: 12,
              color: Colors.white.withValues(alpha: 0.75),
            ),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section(this.title);
  final String title;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 6, bottom: 0),
      child: Text(
        title,
        style: context.text.titleSmall?.copyWith(
          fontWeight: FontWeight.w700,
          color: const Color(0xFF5E6A63),
        ),
      ),
    );
  }
}

class _PagoTile extends StatelessWidget {
  const _PagoTile({required this.pago, required this.onRemove});
  final PagoLinea pago;
  final VoidCallback onRemove;
  @override
  Widget build(BuildContext context) {
    final icon = _iconFor(pago.tipo, pago.nombre);
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFE8F5EC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFCCE9D5)),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppColors.success, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  pago.nombre,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF15803D),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  pago.monto.toSoles,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF15803D),
                    fontFeatures: [FontFeature.tabularFigures()],
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: onRemove,
            icon: const Icon(LucideIcons.x, size: 16),
            style: IconButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppColors.danger,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: const BorderSide(color: Color(0xFFFECACA)),
              ),
              fixedSize: const Size(32, 32),
            ),
          ),
        ],
      ),
    );
  }

  static IconData _iconFor(String tipo, String nombre) {
    final t = tipo.toLowerCase();
    final n = nombre.toLowerCase();
    if (t.contains('efectivo') || n.contains('efectivo')) {
      return LucideIcons.banknote;
    }
    if (t.contains('tarjeta') || n.contains('tarjeta')) {
      return LucideIcons.creditCard;
    }
    if (n.contains('yape') || n.contains('plin')) return LucideIcons.smartphone;
    if (t.contains('transferencia')) return LucideIcons.landmark;
    return LucideIcons.wallet;
  }
}

class _PagoInput extends StatelessWidget {
  const _PagoInput({
    required this.restante,
    required this.montoCtrl,
    required this.metodos,
    required this.onTapMetodo,
  });
  final double restante;
  final TextEditingController montoCtrl;
  final List<MetodoPago> metodos;
  final ValueChanged<MetodoPago> onTapMetodo;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF1F3F2)),
        boxShadow: const [
          BoxShadow(
              color: Color(0x08000000), blurRadius: 10, offset: Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Por cobrar: ${restante.toSoles}',
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 14,
              color: AppColors.lightText,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: const Color(0xFFF7F8FA),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE5E7E6)),
            ),
            child: Row(
              children: [
                const Text(
                  'S/',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppColors.brand,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: montoCtrl,
                    keyboardType: const TextInputType.numberWithOptions(
                        decimal: true),
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: AppColors.lightText,
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
                    decoration: InputDecoration(
                      hintText: restante.toStringAsFixed(2),
                      hintStyle: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF8A938D).withValues(alpha: 0.4),
                      ),
                      border: InputBorder.none,
                      isCollapsed: true,
                      contentPadding:
                          const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          const Text(
            'MÉTODO DE PAGO',
            style: TextStyle(
              fontSize: 10,
              letterSpacing: 1.4,
              fontWeight: FontWeight.w700,
              color: Color(0xFF8A938D),
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: metodos.map((m) {
              return _MetodoChip(
                metodo: m,
                onTap: () => onTapMetodo(m),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _MetodoChip extends StatelessWidget {
  const _MetodoChip({required this.metodo, required this.onTap});
  final MetodoPago metodo;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFFF7F8FA),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE5E7E6), width: 1.4),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                _PagoTile._iconFor(metodo.tipo, metodo.nombre),
                size: 18,
                color: AppColors.brand,
              ),
              const SizedBox(width: 8),
              Text(
                metodo.nombre,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF475569),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PagoCompleto extends StatelessWidget {
  const _PagoCompleto({required this.vuelto});
  final double vuelto;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: const Color(0xFFE8F5EC),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFCCE9D5)),
      ),
      child: Column(
        children: [
          const Icon(LucideIcons.circleCheck,
              size: 36, color: AppColors.success),
          const SizedBox(height: 10),
          const Text(
            'Pago completo',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: Color(0xFF15803D),
            ),
          ),
          if (vuelto > 0.009) ...[
            const SizedBox(height: 16),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                children: [
                  const Text(
                    'VUELTO',
                    style: TextStyle(
                      fontSize: 10,
                      letterSpacing: 1.4,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF15803D),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    vuelto.toSoles,
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: AppColors.success,
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ComprobanteRow extends StatelessWidget {
  const _ComprobanteRow({required this.selected, required this.onSelect});
  final String selected;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    final tipos = const [
      ('ticket', 'Ticket', LucideIcons.receipt),
      ('boleta', 'Boleta', LucideIcons.fileText),
      ('factura', 'Factura', LucideIcons.fileSpreadsheet),
    ];
    return Row(
      children: [
        for (final t in tipos) ...[
          Expanded(
            child: _ComprobanteChip(
              label: t.$2,
              icon: t.$3,
              active: selected == t.$1,
              onTap: () => onSelect(t.$1),
            ),
          ),
          if (t != tipos.last) const SizedBox(width: 10),
        ],
      ],
    );
  }
}

class _ComprobanteChip extends StatelessWidget {
  const _ComprobanteChip({
    required this.label,
    required this.icon,
    required this.active,
    required this.onTap,
  });
  final String label;
  final IconData icon;
  final bool active;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    return Material(
      color: active ? AppColors.brandTint : Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: active ? AppColors.brand : const Color(0xFFE5E7E6),
              width: 1.4,
            ),
          ),
          child: Column(
            children: [
              Icon(icon,
                  size: 20,
                  color: active ? AppColors.brand : const Color(0xFF5E6A63)),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: active ? AppColors.brand : const Color(0xFF5E6A63),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DocInput extends StatelessWidget {
  const _DocInput({
    required this.controller,
    required this.hint,
    required this.maxLength,
  });
  final TextEditingController controller;
  final String hint;
  final int maxLength;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7E6), width: 1.4),
      ),
      child: TextField(
        controller: controller,
        keyboardType: TextInputType.number,
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly,
          LengthLimitingTextInputFormatter(maxLength),
        ],
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          letterSpacing: 2,
        ),
        decoration: InputDecoration(
          hintText: hint,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 14),
          counterText: '',
        ),
      ),
    );
  }
}

class _ErrorBox extends StatelessWidget {
  const _ErrorBox({required this.message});
  final String message;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Text(
        message,
        style: const TextStyle(color: AppColors.danger),
        maxLines: 3,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }
}
