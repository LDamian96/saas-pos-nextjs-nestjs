// =============================================================================
// sales_page.dart — POS principal (vender).
// UI sobria premium: fondo claro plano, cards blancas con sombra suave,
// verde brand solo en acentos (badges, FAB, totales). Animaciones de entrada
// stagger en grid de productos.
// =============================================================================

import 'dart:async';
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
import 'package:pos_mobile/core/services/toast_service.dart';
import 'package:pos_mobile/features/caja/data/caja_repository.dart';
import 'package:pos_mobile/features/cart/domain/cart_item.dart';
import 'package:pos_mobile/features/cart/presentation/cart_controller.dart';
import 'package:pos_mobile/features/productos/data/productos_repository.dart';
import 'package:pos_mobile/features/productos/domain/entities/producto.dart';

class SalesPage extends ConsumerStatefulWidget {
  const SalesPage({super.key});

  @override
  ConsumerState<SalesPage> createState() => _SalesPageState();
}

class _SalesPageState extends ConsumerState<SalesPage> {
  final _searchCtrl = TextEditingController();
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onSearchChanged(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 320), () {
      final current = ref.read(productosFiltersProvider);
      ref.read(productosFiltersProvider.notifier).state =
          (search: v.trim(), categoriaId: current.categoriaId);
    });
  }

  void _onCategoria(String? id) {
    final current = ref.read(productosFiltersProvider);
    ref.read(productosFiltersProvider.notifier).state =
        (search: current.search, categoriaId: id);
  }

  void _onTapProducto(Producto p) {
    final v = p.primeraVariante;
    if (v == null) {
      ref
          .read(toastServiceProvider)
          .warning(context, message: 'Producto sin variantes');
      return;
    }
    HapticFeedback.lightImpact();
    ref.read(cartControllerProvider.notifier).addItem(
          CartItem(
            varianteId: v.id,
            productoId: p.id,
            nombre: p.nombre,
            imagen: p.imagenPrincipal,
            precio: v.precioVenta > 0 ? v.precioVenta : p.precioVenta,
            stock: v.stock,
          ),
        );
    ref
        .read(toastServiceProvider)
        .success(context, message: 'Agregado al carrito', title: p.nombre);
  }

  @override
  Widget build(BuildContext context) {
    final productosAsync = ref.watch(productosListProvider);
    final categoriasAsync = ref.watch(categoriasListProvider);
    final cajaAsync = ref.watch(cajaActualProvider);
    final cart = ref.watch(cartControllerProvider);
    final filters = ref.watch(productosFiltersProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FA),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _Header(caja: cajaAsync.valueOrNull)
                .animate()
                .fadeIn(duration: 320.ms)
                .slideY(begin: -0.15, end: 0, curve: Curves.easeOutCubic),
            const SizedBox(height: 12),
            _SearchBar(
              controller: _searchCtrl,
              onChanged: _onSearchChanged,
            ).animate(delay: 80.ms).fadeIn(duration: 280.ms),
            const SizedBox(height: 12),
            _CategoriasBar(
              categorias: categoriasAsync.valueOrNull ?? const [],
              selectedId: filters.categoriaId,
              onSelect: _onCategoria,
            ).animate(delay: 140.ms).fadeIn(duration: 280.ms),
            const SizedBox(height: 8),
            if (cajaAsync.valueOrNull?.id == null)
              const _NoCajaWarn()
                  .animate()
                  .fadeIn(duration: 280.ms)
                  .scale(
                    begin: const Offset(0.96, 0.96),
                    end: const Offset(1, 1),
                    duration: 280.ms,
                    curve: Curves.easeOutCubic,
                  ),
            Expanded(
              child: productosAsync.when(
                loading: () => const _GridSkeleton(),
                error: (e, _) => _ErrorState(
                  message: e.toString(),
                  onRetry: () => ref.invalidate(productosListProvider),
                ),
                data: (productos) => productos.isEmpty
                    ? _EmptyProductos(search: filters.search)
                    : _ProductosGrid(
                        productos: productos,
                        onTap: _onTapProducto,
                      ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: cart.count > 0
          ? _CartFab(count: cart.count, total: cart.total)
              .animate()
              .scale(
                begin: const Offset(0.5, 0.5),
                end: const Offset(1, 1),
                duration: 280.ms,
                curve: Curves.easeOutBack,
              )
              .fadeIn(duration: 220.ms)
          : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }
}

// ---------------------------------------------------------------------------
// Header con título y badge de caja.
// ---------------------------------------------------------------------------
class _Header extends StatelessWidget {
  const _Header({required this.caja});
  final CajaActual? caja;

  @override
  Widget build(BuildContext context) {
    final abierta = caja?.id.isNotEmpty == true;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Punto de venta',
                  style: context.text.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  abierta
                      ? 'Listo para vender'
                      : 'Abre la caja para comenzar',
                  style: context.text.bodySmall?.copyWith(
                    color: context.colors.onSurface.withValues(alpha: 0.55),
                  ),
                ),
              ],
            ),
          ),
          _CajaBadge(abierta: abierta),
        ],
      ),
    );
  }
}

class _CajaBadge extends StatelessWidget {
  const _CajaBadge({required this.abierta});
  final bool abierta;
  @override
  Widget build(BuildContext context) {
    final color = abierta ? AppColors.success : AppColors.danger;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: color.withValues(alpha: 0.22), width: 0.8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 8),
          Text(
            abierta ? 'Caja abierta' : 'Sin caja',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Search + Scanner.
// ---------------------------------------------------------------------------
class _SearchBar extends StatelessWidget {
  const _SearchBar({required this.controller, required this.onChanged});
  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 48,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7E6)),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.search,
                      size: 18, color: Color(0xFF8A938D)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: controller,
                      onChanged: onChanged,
                      decoration: const InputDecoration(
                        hintText: 'Buscar producto…',
                        border: InputBorder.none,
                        isCollapsed: true,
                      ),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: AppColors.lightText,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 10),
          Material(
            color: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: const BorderSide(color: Color(0xFFE5E7E6)),
            ),
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () {
                HapticFeedback.lightImpact();
                // TODO: navegar a /scanner cuando esté implementado.
              },
              child: const SizedBox(
                width: 48,
                height: 48,
                child: Icon(LucideIcons.scanLine,
                    size: 22, color: AppColors.lightText),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Pills horizontales de categorías.
// ---------------------------------------------------------------------------
class _CategoriasBar extends StatelessWidget {
  const _CategoriasBar({
    required this.categorias,
    required this.selectedId,
    required this.onSelect,
  });
  final List<Categoria> categorias;
  final String? selectedId;
  final ValueChanged<String?> onSelect;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 38,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          _Pill(
            label: 'Todos',
            active: selectedId == null,
            onTap: () => onSelect(null),
          ),
          for (final c in categorias)
            _Pill(
              label: c.nombre,
              active: selectedId == c.id,
              onTap: () => onSelect(c.id),
            ),
        ],
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill(
      {required this.label, required this.active, required this.onTap});
  final String label;
  final bool active;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Material(
        color: active ? AppColors.brand : Colors.white,
        borderRadius: BorderRadius.circular(99),
        child: InkWell(
          borderRadius: BorderRadius.circular(99),
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOutCubic,
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(99),
              border: Border.all(
                color: active ? AppColors.brand : const Color(0xFFE5E7E6),
              ),
            ),
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: active ? Colors.white : const Color(0xFF5E6A63),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Grid de productos.
// ---------------------------------------------------------------------------
class _ProductosGrid extends StatelessWidget {
  const _ProductosGrid({required this.productos, required this.onTap});
  final List<Producto> productos;
  final ValueChanged<Producto> onTap;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 120),
      physics: const BouncingScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.74,
      ),
      itemCount: productos.length,
      itemBuilder: (_, i) => _ProductoCard(
        producto: productos[i],
        onTap: () => onTap(productos[i]),
      )
          .animate(delay: Duration(milliseconds: i * 35))
          .fadeIn(duration: 320.ms, curve: Curves.easeOutCubic)
          .slideY(begin: 0.1, end: 0, curve: Curves.easeOutCubic),
    );
  }
}

class _ProductoCard extends StatelessWidget {
  const _ProductoCard({required this.producto, required this.onTap});
  final Producto producto;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFF1F3F2)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0A000000),
                blurRadius: 12,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ClipRRect(
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(18)),
                child: AspectRatio(
                  aspectRatio: 1.4,
                  child: producto.imagenPrincipal != null
                      ? CachedNetworkImage(
                          imageUrl: producto.imagenPrincipal!,
                          fit: BoxFit.cover,
                          placeholder: (_, __) =>
                              const ColoredBox(color: Color(0xFFF1F3F2)),
                          errorWidget: (_, __, ___) => _Placeholder(
                            initial: producto.inicial,
                          ),
                        )
                      : _Placeholder(initial: producto.inicial),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          producto.nombre,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                            color: AppColors.lightText,
                            height: 1.2,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        producto.sku,
                        style: const TextStyle(
                          fontSize: 11,
                          color: Color(0xFF8A938D),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        producto.precioVenta.toSoles,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: AppColors.success,
                          fontFeatures: [FontFeature.tabularFigures()],
                        ),
                      ),
                    ],
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

class _Placeholder extends StatelessWidget {
  const _Placeholder({required this.initial});
  final String initial;
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.brandTint,
      alignment: Alignment.center,
      child: Text(
        initial,
        style: const TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.w800,
          color: AppColors.brand,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// FAB carrito.
// ---------------------------------------------------------------------------
class _CartFab extends StatelessWidget {
  const _CartFab({required this.count, required this.total});
  final int count;
  final double total;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Material(
        color: AppColors.brand,
        borderRadius: BorderRadius.circular(18),
        elevation: 0,
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () {
            HapticFeedback.mediumImpact();
            context.push(RouteNames.cart);
          },
          child: Container(
            height: 58,
            padding: const EdgeInsets.symmetric(horizontal: 18),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: AppColors.brand.withValues(alpha: 0.35),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.shoppingCart,
                    color: Colors.white, size: 22),
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.22),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '$count',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  count == 1 ? '1 producto' : '$count productos',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.88),
                    fontWeight: FontWeight.w600,
                    fontSize: 13.5,
                  ),
                ),
                const Spacer(),
                Text(
                  total.toSoles,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 17,
                    fontFeatures: [FontFeature.tabularFigures()],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Estados auxiliares.
// ---------------------------------------------------------------------------
class _NoCajaWarn extends ConsumerWidget {
  const _NoCajaWarn();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 6, 20, 6),
      child: Material(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () => context.push(RouteNames.cajaAbrir),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFFDE68A)),
            ),
            child: Row(
              children: const [
                Icon(LucideIcons.triangleAlert,
                    color: Color(0xFFB45309), size: 18),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Abre la caja para empezar a vender',
                    style: TextStyle(
                      color: Color(0xFF92400E),
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                ),
                Icon(LucideIcons.chevronRight,
                    color: Color(0xFFB45309), size: 18),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _EmptyProductos extends StatelessWidget {
  const _EmptyProductos({required this.search});
  final String search;
  @override
  Widget build(BuildContext context) {
    final hasSearch = search.isNotEmpty;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F3F2),
              borderRadius: BorderRadius.circular(28),
            ),
            child: const Icon(LucideIcons.packageOpen,
                size: 32, color: Color(0xFF8A938D)),
          ),
          const SizedBox(height: 14),
          Text(
            hasSearch ? 'Sin resultados' : 'Aún no hay productos',
            style: context.text.titleMedium,
          ),
          const SizedBox(height: 4),
          Text(
            hasSearch
                ? 'Intenta con otro nombre'
                : 'Agrega productos desde el panel',
            style: context.text.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(LucideIcons.circleAlert,
                color: AppColors.danger, size: 32),
            const SizedBox(height: 12),
            Text('No se pudo cargar', style: context.text.titleMedium),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: context.text.bodySmall,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 16),
            FilledButton.tonal(
              onPressed: onRetry,
              child: const Text('Reintentar'),
            ),
          ],
        ),
      ),
    );
  }
}

class _GridSkeleton extends StatelessWidget {
  const _GridSkeleton();
  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 120),
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.74,
      ),
      itemCount: 6,
      itemBuilder: (_, __) => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFF1F3F2)),
        ),
      )
          .animate(onPlay: (c) => c.repeat())
          .shimmer(
            duration: 1200.ms,
            color: const Color(0x10000000),
          ),
    );
  }
}
