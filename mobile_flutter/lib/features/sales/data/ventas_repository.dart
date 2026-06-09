// =============================================================================
// ventas_repository.dart — /ventas + /metodos-pago.
// =============================================================================

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pos_mobile/core/network/dio_client.dart';
import 'package:pos_mobile/features/cart/domain/cart_item.dart';

class MetodoPago {
  const MetodoPago({
    required this.id,
    required this.nombre,
    required this.tipo,
  });
  final String id;
  final String nombre;
  final String tipo;

  factory MetodoPago.fromJson(Map<String, dynamic> j) => MetodoPago(
        id: (j['id'] ?? '') as String,
        nombre: (j['nombre'] ?? '') as String,
        tipo: (j['tipo'] ?? '') as String,
      );
}

class PagoLinea {
  PagoLinea({
    required this.metodoPagoId,
    required this.nombre,
    required this.tipo,
    required this.monto,
  });
  final String metodoPagoId;
  final String nombre;
  final String tipo;
  double monto;
}

class VentaResultado {
  const VentaResultado({
    required this.id,
    required this.numero,
    required this.total,
  });
  final String id;
  final String numero;
  final double total;
  factory VentaResultado.fromJson(Map<String, dynamic> j) => VentaResultado(
        id: (j['id'] ?? '') as String,
        numero: (j['numeroVenta'] ?? j['numero'] ?? '') as String,
        total: (j['total'] is num) ? (j['total'] as num).toDouble() : 0,
      );
}

class VentasRepository {
  VentasRepository(this._dio);
  final Dio _dio;

  Future<List<MetodoPago>> listarMetodosPago() async {
    final r = await _dio.get<Map<String, dynamic>>(
      '/metodos-pago',
      queryParameters: {'activo': true},
    );
    final list = _extractList(r.data);
    return list
        .whereType<Map<String, dynamic>>()
        .map(MetodoPago.fromJson)
        .toList(growable: false);
  }

  Future<VentaResultado> crear({
    required String sucursalId,
    required String cajaId,
    required String tipoComprobante,
    required List<CartItem> items,
    required List<PagoLinea> pagos,
    String? clienteDocumento,
  }) async {
    final body = <String, dynamic>{
      'sucursalId': sucursalId,
      'cajaId': cajaId,
      'tipoComprobante': tipoComprobante,
      if (clienteDocumento != null && clienteDocumento.isNotEmpty)
        'clienteDocumento': clienteDocumento,
      'items': items
          .map((i) => {
                'varianteId': i.varianteId,
                'cantidad': i.cantidad,
                'precioUnitario': i.precio,
              })
          .toList(),
      'pagos': pagos
          .map((p) => {'metodoPagoId': p.metodoPagoId, 'monto': p.monto})
          .toList(),
    };
    final r = await _dio.post<Map<String, dynamic>>('/ventas', data: body);
    final venta = (r.data?['data'] ?? r.data) as Map<String, dynamic>;
    return VentaResultado.fromJson(venta);
  }

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

final ventasRepositoryProvider = Provider<VentasRepository>(
  (ref) => VentasRepository(ref.watch(dioClientProvider)),
);

final metodosPagoProvider = FutureProvider<List<MetodoPago>>((ref) async {
  return ref.watch(ventasRepositoryProvider).listarMetodosPago();
});
