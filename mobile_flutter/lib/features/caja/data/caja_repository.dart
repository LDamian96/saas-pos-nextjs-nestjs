// =============================================================================
// caja_repository.dart — endpoints /caja.
// =============================================================================

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pos_mobile/core/network/dio_client.dart';

class CajaActual {
  const CajaActual({
    required this.id,
    required this.sucursalId,
    this.numero,
    this.montoInicial = 0,
    this.totalVentas = 0,
  });

  final String id;
  final String sucursalId;
  final String? numero;
  final double montoInicial;
  final double totalVentas;

  factory CajaActual.fromJson(Map<String, dynamic> j) => CajaActual(
        id: (j['id'] ?? '') as String,
        sucursalId: (j['sucursalId'] ?? '') as String,
        numero: j['numero'] as String?,
        montoInicial: _toDouble(j['montoInicial']),
        totalVentas: _toDouble(j['totalVentas']),
      );
}

class CajaRepository {
  CajaRepository(this._dio);
  final Dio _dio;

  Future<CajaActual?> obtenerActual() async {
    try {
      final r = await _dio.get<Map<String, dynamic>>('/caja/actual');
      final body = r.data?['data'] ?? r.data;
      if (body == null || body is! Map<String, dynamic>) return null;
      if (body['id'] == null) return null;
      return CajaActual.fromJson(body);
    } on DioException {
      return null;
    }
  }

  Future<CajaActual> abrir({required double montoInicial}) async {
    final r = await _dio.post<Map<String, dynamic>>(
      '/caja/abrir',
      data: {'montoInicial': montoInicial},
    );
    final body = r.data?['data'] ?? r.data ?? const <String, dynamic>{};
    return CajaActual.fromJson(body as Map<String, dynamic>);
  }

  Future<void> cerrar({
    required String cajaId,
    required double montoFinal,
    String? observaciones,
  }) async {
    await _dio.post<dynamic>('/caja/cerrar', data: {
      'cajaId': cajaId,
      'montoFinal': montoFinal,
      if (observaciones != null) 'observaciones': observaciones,
    });
  }
}

final cajaRepositoryProvider = Provider<CajaRepository>(
  (ref) => CajaRepository(ref.watch(dioClientProvider)),
);

final cajaActualProvider = FutureProvider<CajaActual?>((ref) async {
  return ref.watch(cajaRepositoryProvider).obtenerActual();
});

double _toDouble(Object? v) {
  if (v is num) return v.toDouble();
  if (v is String) return double.tryParse(v) ?? 0;
  return 0;
}
