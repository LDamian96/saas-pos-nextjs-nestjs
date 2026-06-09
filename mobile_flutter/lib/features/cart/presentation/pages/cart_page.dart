// =============================================================================
// cart_page.dart — Carrito de compras: lista de items, qty +/-, eliminar,
// total y botón Cobrar. UI sobria premium con animaciones suaves.
// =============================================================================

import 'package:cached_network_image/cached_network_image.dart';
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
import 'package:pos_mobile/features/cart/domain/cart_item.dart';
import 'package:pos_mobile/features/cart/presentation/cart_controller.dart';

class CartPage extends ConsumerWidget {
  const CartPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartControllerProvider);
    final ctrl = ref.read(cartControllerProvider.notifier);

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FA),
      body: SafeArea(
        child: Column(
          children: [
            _Header(count: cart.count, onClear: ctrl.clear)
                .animate()
                .fadeIn(duration: 280.ms)
                .slideY(begin: -0.2, end: 0, curve: Curves.easeOutCubic),
            if (cart.items.isEmpty)
              Expanded(child: _EmptyCart())
            else
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                  physics: const BouncingScrollPhysics(),
                  itemCount: cart.items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    final item = cart.items[i];
                    return _CartTile(
                      item: item,
                      onInc: () => ctrl.updateQuantity(
                          item.varianteId, item.cantidad + 1),
                      onDec: () => ctrl.updateQuantity(
                          item.varianteId, item.cantidad - 1),
                      onRemove: () => ctrl.removeItem(item.varianteId),
                    )
                        .animate(delay: Duration(milliseconds: i * 40))
                        .fadeIn(duration: 280.ms)
                        .slideY(
                            begin: 0.08, end: 0, curve: Curves.easeOutCubic);
                  },
                ),
              ),
            if (cart.items.isNotEmpty)
              _Footer(total: cart.total)
                  .animate()
                  .fadeIn(duration: 280.ms)
                  .slideY(begin: 0.2, end: 0, curve: Curves.easeOutCubic),
          ],
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.count, required this.onClear});
  final int count;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 12),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(LucideIcons.arrowLeft),
            onPressed: () => context.pop(),
          ),
          Expanded(
            child: Text(
              count > 0 ? 'Carrito · $count' : 'Carrito',
              style: context.text.headlineSmall?.copyWith(
                fontWeight: FontWeight.w800,
                letterSpacing: -0.3,
              ),
            ),
          ),
          if (count > 0)
            TextButton.icon(
              icon: const Icon(LucideIcons.trash2,
                  size: 16, color: AppColors.danger),
              label: const Text('Vaciar',
                  style: TextStyle(
                      color: AppColors.danger,
                      fontWeight: FontWeight.w700,
                      fontSize: 13)),
              onPressed: () {
                HapticFeedback.heavyImpact();
                onClear();
              },
            ),
        ],
      ),
    );
  }
}

class _CartTile extends StatelessWidget {
  const _CartTile({
    required this.item,
    required this.onInc,
    required this.onDec,
    required this.onRemove,
  });
  final CartItem item;
  final VoidCallback onInc;
  final VoidCallback onDec;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final atMax = item.cantidad >= item.stock;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFF1F3F2)),
        boxShadow: const [
          BoxShadow(
              color: Color(0x0A000000), blurRadius: 12, offset: Offset(0, 4)),
        ],
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: SizedBox(
                  width: 64,
                  height: 64,
                  child: item.imagen != null
                      ? CachedNetworkImage(
                          imageUrl: item.imagen!,
                          fit: BoxFit.cover,
                          errorWidget: (_, __, ___) =>
                              _MiniPlaceholder(letter: item.nombre[0]),
                        )
                      : _MiniPlaceholder(letter: item.nombre[0]),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.nombre,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.lightText,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${item.precio.toSoles} c/u',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF8A938D),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () {
                  HapticFeedback.mediumImpact();
                  onRemove();
                },
                icon: const Icon(LucideIcons.x,
                    size: 18, color: Color(0xFF8A938D)),
                style: IconButton.styleFrom(
                  backgroundColor: const Color(0xFFF7F8FA),
                  shape: const CircleBorder(),
                  fixedSize: const Size(32, 32),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: Color(0xFFF1F3F2)),
          const SizedBox(height: 12),
          Row(
            children: [
              _QtyButton(
                icon: LucideIcons.minus,
                onTap: () {
                  HapticFeedback.lightImpact();
                  onDec();
                },
              ),
              SizedBox(
                width: 44,
                child: Center(
                  child: Text(
                    '${item.cantidad}',
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: AppColors.lightText,
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
                  ),
                ),
              ),
              _QtyButton(
                icon: LucideIcons.plus,
                filled: !atMax,
                disabled: atMax,
                onTap: atMax
                    ? null
                    : () {
                        HapticFeedback.lightImpact();
                        onInc();
                      },
              ),
              const Spacer(),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text(
                    'SUBTOTAL',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.4,
                      color: Color(0xFF8A938D),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    item.subtotal.toSoles,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: AppColors.success,
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QtyButton extends StatelessWidget {
  const _QtyButton({
    required this.icon,
    required this.onTap,
    this.filled = false,
    this.disabled = false,
  });
  final IconData icon;
  final VoidCallback? onTap;
  final bool filled;
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    final bg = disabled
        ? const Color(0xFFE5E7E6)
        : filled
            ? AppColors.brand
            : const Color(0xFFF7F8FA);
    final fg = disabled
        ? const Color(0xFF8A938D)
        : filled
            ? Colors.white
            : const Color(0xFF5E6A63);
    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: filled ? AppColors.brand : const Color(0xFFE5E7E6),
            ),
          ),
          child: Icon(icon, size: 18, color: fg),
        ),
      ),
    );
  }
}

class _MiniPlaceholder extends StatelessWidget {
  const _MiniPlaceholder({required this.letter});
  final String letter;
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.brandTint,
      alignment: Alignment.center,
      child: Text(
        letter.toUpperCase(),
        style: const TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w800,
          color: AppColors.brand,
        ),
      ),
    );
  }
}

class _Footer extends StatelessWidget {
  const _Footer({required this.total});
  final double total;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
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
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Total',
                  style: context.text.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF5E6A63))),
              Text(
                total.toSoles,
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: AppColors.lightText,
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.brand,
                minimumSize: const Size.fromHeight(56),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
              ),
              onPressed: () {
                HapticFeedback.mediumImpact();
                context.push(RouteNames.cobrar);
              },
              child: Text(
                'Cobrar ${total.toSoles}',
                style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                    letterSpacing: 0.2),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyCart extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F3F2),
              borderRadius: BorderRadius.circular(32),
            ),
            child: const Icon(LucideIcons.shoppingCart,
                size: 40, color: Color(0xFF8A938D)),
          )
              .animate()
              .scale(
                  begin: const Offset(0.7, 0.7),
                  end: const Offset(1, 1),
                  duration: 380.ms,
                  curve: Curves.easeOutBack)
              .fadeIn(duration: 300.ms),
          const SizedBox(height: 16),
          Text('Tu carrito está vacío', style: context.text.titleLarge),
          const SizedBox(height: 6),
          Text(
            'Agrega productos desde el POS',
            style: context.text.bodySmall,
          ),
          const SizedBox(height: 20),
          FilledButton.tonal(
            onPressed: () => context.pop(),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.brandTint,
              foregroundColor: AppColors.brand,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            child: const Text('Volver al POS',
                style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}
