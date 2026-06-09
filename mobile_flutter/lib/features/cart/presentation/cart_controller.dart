// =============================================================================
// cart_controller.dart — store Riverpod del carrito (equivalente Zustand RN).
// =============================================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pos_mobile/features/cart/domain/cart_item.dart';

class CartState {
  const CartState({
    this.items = const [],
    this.tipoComprobante = 'ticket',
    this.dni = '',
    this.ruc = '',
  });

  final List<CartItem> items;
  final String tipoComprobante; // ticket | boleta | factura
  final String dni;
  final String ruc;

  int get count =>
      items.fold(0, (sum, it) => sum + it.cantidad);

  double get total =>
      items.fold(0.0, (sum, it) => sum + it.subtotal);

  CartState copyWith({
    List<CartItem>? items,
    String? tipoComprobante,
    String? dni,
    String? ruc,
  }) =>
      CartState(
        items: items ?? this.items,
        tipoComprobante: tipoComprobante ?? this.tipoComprobante,
        dni: dni ?? this.dni,
        ruc: ruc ?? this.ruc,
      );
}

class CartController extends Notifier<CartState> {
  @override
  CartState build() => const CartState();

  void addItem(CartItem item) {
    final idx = state.items.indexWhere((i) => i.varianteId == item.varianteId);
    if (idx >= 0) {
      final existing = state.items[idx];
      if (existing.cantidad >= existing.stock) return;
      final updated = [...state.items];
      updated[idx] = existing.copyWith(cantidad: existing.cantidad + 1);
      state = state.copyWith(items: updated);
    } else {
      state = state.copyWith(items: [...state.items, item]);
    }
  }

  void updateQuantity(String varianteId, int nueva) {
    if (nueva <= 0) {
      removeItem(varianteId);
      return;
    }
    final items = state.items.map((i) {
      if (i.varianteId != varianteId) return i;
      final clamped = nueva > i.stock ? i.stock : nueva;
      return i.copyWith(cantidad: clamped);
    }).toList();
    state = state.copyWith(items: items);
  }

  void removeItem(String varianteId) {
    state = state.copyWith(
      items: state.items
          .where((i) => i.varianteId != varianteId)
          .toList(growable: false),
    );
  }

  void clear() => state = state.copyWith(items: const [], dni: '', ruc: '');

  void setComprobante(String tipo) =>
      state = state.copyWith(tipoComprobante: tipo);

  void setDni(String v) => state = state.copyWith(dni: v);
  void setRuc(String v) => state = state.copyWith(ruc: v);
}

final cartControllerProvider =
    NotifierProvider<CartController, CartState>(CartController.new);
