// =============================================================================
// remote_logger.dart
// Envía logs / errores al backend (POST /logs/mobile) de forma asíncrona
// y NO bloqueante. Hace fire-and-forget: si falla, no spamea ni rompe UI.
//
// Errors locales (Logger console) + remotos (backend stdout). Doble visibilidad.
//
// Como leer en el VPS:
//   ssh root@62.146.228.180 "docker logs -f pos_ldmapp_backend 2>&1 | grep MOBILE_LOG"
// =============================================================================

import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logger/logger.dart';
import 'package:pos_mobile/app/constants/api_constants.dart';
import 'package:pos_mobile/core/services/device_info_service.dart';

final remoteLoggerProvider = Provider<RemoteLogger>((ref) {
  return RemoteLogger(
    deviceInfo: ref.watch(deviceInfoServiceProvider),
  );
});

enum LogLevel { debug, info, warning, error, fatal }

class RemoteLogger {
  RemoteLogger({required DeviceInfoService deviceInfo})
      : _device = deviceInfo,
        _sessionId = DateTime.now().millisecondsSinceEpoch.toString(),
        _dio = Dio(
          BaseOptions(
            baseUrl: ApiConstants.baseUrl,
            connectTimeout: const Duration(seconds: 6),
            receiveTimeout: const Duration(seconds: 6),
            sendTimeout: const Duration(seconds: 6),
            contentType: 'application/json',
            headers: const {'Accept': 'application/json'},
          ),
        ),
        _local = Logger(
          printer: PrettyPrinter(
            methodCount: 0,
            errorMethodCount: 6,
            lineLength: 100,
            printEmojis: true,
            dateTimeFormat: DateTimeFormat.onlyTimeAndSinceStart,
          ),
        );

  final DeviceInfoService _device;
  final Dio _dio;
  final Logger _local;
  final String _sessionId;

  String? _userId;
  String? _empresaId;
  String? _currentRoute;

  /// Setea el contexto de sesión actual. Llamar después del login y en logout.
  void setSession({String? userId, String? empresaId}) {
    _userId = userId;
    _empresaId = empresaId;
  }

  /// Setea la ruta actual (útil para saber dónde ocurrió el error).
  void setRoute(String? route) {
    _currentRoute = route;
  }

  void debug(String message, {Map<String, Object?>? extra}) =>
      _send(LogLevel.debug, message, extra: extra);

  void info(String message, {Map<String, Object?>? extra}) =>
      _send(LogLevel.info, message, extra: extra);

  void warning(String message, {Map<String, Object?>? extra}) =>
      _send(LogLevel.warning, message, extra: extra);

  void error(
    String message, {
    Object? error,
    StackTrace? stackTrace,
    Map<String, Object?>? extra,
  }) =>
      _send(
        LogLevel.error,
        message,
        error: error,
        stackTrace: stackTrace,
        extra: extra,
      );

  void fatal(
    String message, {
    Object? error,
    StackTrace? stackTrace,
    Map<String, Object?>? extra,
  }) =>
      _send(
        LogLevel.fatal,
        message,
        error: error,
        stackTrace: stackTrace,
        extra: extra,
      );

  void _send(
    LogLevel level,
    String message, {
    Object? error,
    StackTrace? stackTrace,
    Map<String, Object?>? extra,
  }) {
    // 1. Log local (siempre, también en release para que el dev vea).
    switch (level) {
      case LogLevel.fatal:
      case LogLevel.error:
        _local.e(message, error: error, stackTrace: stackTrace);
      case LogLevel.warning:
        _local.w(message);
      case LogLevel.info:
        _local.i(message);
      case LogLevel.debug:
        _local.d(message);
    }

    // 2. Envio remoto fire-and-forget.
    unawaited(_postRemote(level, message, error, stackTrace, extra));
  }

  Future<void> _postRemote(
    LogLevel level,
    String message,
    Object? error,
    StackTrace? stackTrace,
    Map<String, Object?>? extra,
  ) async {
    try {
      final body = <String, dynamic>{
        'level': level.name,
        'message': message.length > 500 ? message.substring(0, 500) : message,
        if (error != null)
          'error': error.toString().length > 2000
              ? error.toString().substring(0, 2000)
              : error.toString(),
        if (stackTrace != null)
          'stackTrace': stackTrace.toString().length > 8000
              ? stackTrace.toString().substring(0, 8000)
              : stackTrace.toString(),
        if (_currentRoute != null) 'route': _currentRoute,
        if (_userId != null) 'userId': _userId,
        if (_empresaId != null) 'empresaId': _empresaId,
        'sessionId': _sessionId,
        'timestamp': DateTime.now().toIso8601String(),
        'device': _device.snapshot.toJson(),
        if (extra != null && extra.isNotEmpty) 'extra': extra.toString(),
      };

      await _dio.post<dynamic>('/logs/mobile', data: body);
    } catch (e) {
      // Falló el envío remoto: NO bucle infinito ni toast. Solo log local.
      if (kDebugMode) {
        // ignore: avoid_print
        print('[RemoteLogger] no se pudo enviar: $e');
      }
    }
  }
}

/// NavigatorObserver que actualiza la ruta actual en el RemoteLogger.
/// Así cualquier error tiene el contexto de dónde ocurrió.
class RemoteLoggerRouteObserver extends NavigatorObserver {
  RemoteLoggerRouteObserver(this._logger);
  final RemoteLogger _logger;

  void _update(Route<dynamic>? route) {
    final name = route?.settings.name;
    if (name != null) _logger.setRoute(name);
  }

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) =>
      _update(route);

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) =>
      _update(newRoute);

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) =>
      _update(previousRoute);
}
