// =============================================================================
// failure_messages.dart
// Mapea Failures de dominio a mensajes amigables en español que el usuario
// va a leer en toasts/pantallas. Centralizado para consistencia.
// =============================================================================

import 'package:pos_mobile/core/error/failures.dart';

class FailureMessages {
  FailureMessages._();

  /// Convierte un Failure en un mensaje legible para el usuario.
  /// Mantiene el mensaje original del Failure si ya es amigable, o lo
  /// sustituye por uno más claro si es técnico.
  static String forUser(Failure failure) {
    return switch (failure) {
      NetworkFailure() => 'Sin conexión. Revisa tu internet.',
      SessionExpiredFailure() => 'Tu sesión expiró. Vuelve a iniciar.',
      AuthFailure() => failure.message.isNotEmpty
          ? failure.message
          : 'Correo o contraseña incorrectos.',
      ValidationFailure() => failure.message,
      BiometricFailure() => failure.message,
      CacheFailure() => 'Error guardando datos en tu dispositivo.',
      ServerFailure(:final statusCode, :final message) => switch (statusCode) {
          400 => 'Datos inválidos: $message',
          403 => 'No tienes permiso para hacer esto.',
          404 => 'No se encontró lo que buscas.',
          422 => 'Datos rechazados por el servidor.',
          500 || 502 || 503 || 504 =>
            'El servidor tuvo un problema. Intenta de nuevo.',
          _ => message.isNotEmpty ? message : 'Error del servidor.',
        },
      UnknownFailure() => 'Algo salió mal. Intenta de nuevo.',
    };
  }

  /// Título corto para el toast/dialog según el tipo de Failure.
  static String titleFor(Failure failure) {
    return switch (failure) {
      NetworkFailure() => 'Sin conexión',
      SessionExpiredFailure() => 'Sesión expirada',
      AuthFailure() => 'No pudimos entrar',
      ValidationFailure() => 'Revisa los datos',
      BiometricFailure() => 'Huella no disponible',
      CacheFailure() => 'Error de almacenamiento',
      ServerFailure() => 'Error del servidor',
      UnknownFailure() => 'Algo salió mal',
    };
  }
}
