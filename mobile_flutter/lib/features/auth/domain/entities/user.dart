// =============================================================================
// user.dart
// Entidad de dominio Usuario. Sin dependencias técnicas, pure Dart.
// =============================================================================

class User {
  const User({
    required this.id,
    required this.email,
    required this.nombre,
    required this.apellido,
    required this.empresaId,
    required this.empresaNombre,
    required this.rol,
    this.sucursalId,
    this.sucursalNombre,
    this.avatarUrl,
  });

  final String id;
  final String email;
  final String nombre;
  final String apellido;
  final String empresaId;
  final String empresaNombre;
  final String rol;
  final String? sucursalId;
  final String? sucursalNombre;
  final String? avatarUrl;

  String get fullName => '$nombre $apellido'.trim();
  String get initials {
    final n = nombre.isNotEmpty ? nombre[0] : '';
    final a = apellido.isNotEmpty ? apellido[0] : '';
    return '$n$a'.toUpperCase();
  }

  bool get sedeFija => const {'vendedor', 'cajero', 'almacenero'}.contains(rol);
}
