// =============================================================================
// cart_item.dart — item del carrito en memoria.
// =============================================================================

class CartItem {
  CartItem({
    required this.varianteId,
    required this.productoId,
    required this.nombre,
    required this.precio,
    required this.stock,
    this.imagen,
    this.cantidad = 1,
  });

  final String varianteId;
  final String productoId;
  final String nombre;
  final String? imagen;
  final double precio;
  final int stock;
  int cantidad;

  double get subtotal => precio * cantidad;

  CartItem copyWith({int? cantidad}) => CartItem(
        varianteId: varianteId,
        productoId: productoId,
        nombre: nombre,
        imagen: imagen,
        precio: precio,
        stock: stock,
        cantidad: cantidad ?? this.cantidad,
      );
}
