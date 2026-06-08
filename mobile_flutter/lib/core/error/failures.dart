// =============================================================================
// failures.dart
// Modelos de error de dominio (NO excepciones). Usados con Either<Failure, T>
// para forzar manejo explícito en lugar de try/catch implícito.
// =============================================================================

sealed class Failure {
  const Failure({required this.message, this.code});

  final String message;
  final String? code;

  @override
  String toString() => 'Failure($runtimeType): $message';
}

class NetworkFailure extends Failure {
  const NetworkFailure({super.message = 'Sin conexión a internet', super.code});
}

class ServerFailure extends Failure {
  const ServerFailure({required super.message, super.code, this.statusCode});
  final int? statusCode;
}

class AuthFailure extends Failure {
  const AuthFailure({super.message = 'Credenciales inválidas', super.code});
}

class SessionExpiredFailure extends Failure {
  const SessionExpiredFailure({
    super.message = 'Sesión expirada, vuelve a iniciar',
  });
}

class ValidationFailure extends Failure {
  const ValidationFailure({required super.message, super.code, this.fields});
  final Map<String, String>? fields;
}

class CacheFailure extends Failure {
  const CacheFailure({super.message = 'Error de almacenamiento local'});
}

class BiometricFailure extends Failure {
  const BiometricFailure({required super.message, super.code});
}

class UnknownFailure extends Failure {
  const UnknownFailure({super.message = 'Algo salió mal'});
}
