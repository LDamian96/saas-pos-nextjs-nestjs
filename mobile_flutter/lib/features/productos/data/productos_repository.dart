// =============================================================================
// productos_repository.dart — Llamadas a /productos y /categorias.
// =============================================================================

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pos_mobile/core/network/dio_client.dart';
import 'package:pos_mobile/features/productos/domain/entities/producto.dart';

class ProductosRepository {
  ProductosRepository(this._dio);
  final Dio _dio;

  Future<List<Producto>> listar({
    String? search,
    String? categoriaId,
    int limit = 100,
  }) async {
    final params = <String, dynamic>{
      'activo': true,
      'visiblePos': true,
      'limit': limit,
    };
    if (search != null && search.isNotEmpty) params['search'] = search;
    if (categoriaId != null) params['categoriaId'] = categoriaId;

    final r = await _dio.get<Map<String, dynamic>>(
      '/productos',
      queryParameters: params,
    );
    final list = _extractList(r.data);
    return list
        .whereType<Map<String, dynamic>>()
        .map(Producto.fromJson)
        .toList(growable: false);
  }

  Future<List<Categoria>> listarCategorias() async {
    final r = await _dio.get<Map<String, dynamic>>('/categorias');
    final list = _extractList(r.data);
    return list
        .whereType<Map<String, dynamic>>()
        .map(Categoria.fromJson)
        .toList(growable: false);
  }

  /// Normaliza estructuras tipo {success, data: {data: [...]}} o {data: [...]}.
  static List<dynamic> _extractList(Map<String, dynamic>? body) {
    if (body == null) return const [];
    final data = body['data'];
    if (data is List) return data;
    if (data is Map<String, dynamic>) {
      final inner = data['data'];
      if (inner is List) return inner;
    }
    return const [];
  }
}

final productosRepositoryProvider = Provider<ProductosRepository>((ref) {
  return ProductosRepository(ref.watch(dioClientProvider));
});

/// Lista de productos con filtros reactivos.
final productosFiltersProvider = StateProvider<({String search, String? categoriaId})>(
  (_) => (search: '', categoriaId: null),
);

final productosListProvider = FutureProvider<List<Producto>>((ref) async {
  final filters = ref.watch(productosFiltersProvider);
  final repo = ref.watch(productosRepositoryProvider);
  return repo.listar(search: filters.search, categoriaId: filters.categoriaId);
});

final categoriasListProvider = FutureProvider<List<Categoria>>((ref) async {
  final repo = ref.watch(productosRepositoryProvider);
  return repo.listarCategorias();
});
