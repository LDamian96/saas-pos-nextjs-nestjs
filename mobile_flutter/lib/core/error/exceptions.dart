// =============================================================================
// exceptions.dart
// Excepciones técnicas (capa data). Se mapean a Failures en repositories.
// =============================================================================

class ServerException implements Exception {
  ServerException({required this.message, this.statusCode, this.code});
  final String message;
  final int? statusCode;
  final String? code;
}

class NetworkException implements Exception {
  NetworkException([this.message = 'Sin conexión']);
  final String message;
}

class UnauthorizedException implements Exception {
  UnauthorizedException([this.message = 'No autorizado']);
  final String message;
}

class CacheException implements Exception {
  CacheException([this.message = 'Error de cache']);
  final String message;
}

class BiometricException implements Exception {
  BiometricException(this.message, {this.code});
  final String message;
  final String? code;
}
