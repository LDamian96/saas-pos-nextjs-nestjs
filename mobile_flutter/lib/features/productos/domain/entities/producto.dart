// =============================================================================
// producto.dart — entidades de dominio del catálogo.
// =============================================================================

class Variante {
  const Variante({
    required this.id,
    required this.sku,
    required this.precioVenta,
    required this.stock,
    this.nombre,
  });

  final String id;
  final String sku;
  final double precioVenta;
  final int stock;
  final String? nombre;

  factory Variante.fromJson(Map<String, dynamic> j) => Variante(
        id: (j['id'] ?? '') as String,
        sku: (j['sku'] ?? '') as String,
        precioVenta: _toDouble(j['precioVenta']),
        stock: (j['stock'] is num) ? (j['stock'] as num).toInt() : 0,
        nombre: j['nombre'] as String?,
      );
}

class Producto {
  const Producto({
    required this.id,
    required this.nombre,
    required this.sku,
    required this.precioVenta,
    this.imagenPrincipal,
    this.categoriaId,
    this.categoriaNombre,
    this.variantes = const [],
    this.stockTotal = 0,
  });

  final String id;
  final String nombre;
  final String sku;
  final double precioVenta;
  final String? imagenPrincipal;
  final String? categoriaId;
  final String? categoriaNombre;
  final List<Variante> variantes;
  final int stockTotal;

  Variante? get primeraVariante =>
      variantes.isNotEmpty ? variantes.first : null;

  String get inicial =>
      nombre.isNotEmpty ? nombre.substring(0, 1).toUpperCase() : '?';

  factory Producto.fromJson(Map<String, dynamic> j) {
    final cat = j['categoria'] as Map<String, dynamic>?;
    final vars = (j['variantes'] as List?) ?? const [];
    return Producto(
      id: (j['id'] ?? '') as String,
      nombre: (j['nombre'] ?? '') as String,
      sku: (j['sku'] ?? j['codigoInterno'] ?? '') as String,
      precioVenta: _toDouble(j['precioVenta']),
      imagenPrincipal: j['imagenPrincipal'] as String?,
      categoriaId: cat?['id'] as String?,
      categoriaNombre: cat?['nombre'] as String?,
      variantes: vars
          .whereType<Map<String, dynamic>>()
          .map(Variante.fromJson)
          .toList(growable: false),
      stockTotal: (j['stockTotal'] is num)
          ? (j['stockTotal'] as num).toInt()
          : (j['stock'] is num)
              ? (j['stock'] as num).toInt()
              : 0,
    );
  }
}

class Categoria {
  const Categoria({required this.id, required this.nombre});
  final String id;
  final String nombre;

  factory Categoria.fromJson(Map<String, dynamic> j) => Categoria(
        id: (j['id'] ?? '') as String,
        nombre: (j['nombre'] ?? '') as String,
      );
}

double _toDouble(Object? v) {
  if (v is num) return v.toDouble();
  if (v is String) return double.tryParse(v) ?? 0;
  return 0;
}
