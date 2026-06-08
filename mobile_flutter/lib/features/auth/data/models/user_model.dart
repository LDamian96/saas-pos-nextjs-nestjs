// =============================================================================
// user_model.dart
// DTO ↔ Entity. Mapeo defensivo: tolera campos faltantes del backend.
// =============================================================================

import 'package:pos_mobile/features/auth/domain/entities/user.dart';

class UserModel {
  const UserModel({
    required this.id,
    required this.email,
    required this.nombre,
    required this.apellido,
    required this.empresaId,
    required this.empresaNombre,
    required this.rolCodigo,
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
  final String rolCodigo;
  final String? sucursalId;
  final String? sucursalNombre;
  final String? avatarUrl;

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final empresa = json['empresa'] as Map<String, dynamic>? ?? const {};
    final rol = json['rol'] as Map<String, dynamic>? ?? const {};
    final sucursal = json['sucursal'] as Map<String, dynamic>?;

    return UserModel(
      id: (json['id'] ?? '') as String,
      email: (json['email'] ?? '') as String,
      nombre: (json['nombre'] ?? '') as String,
      apellido: (json['apellido'] ?? '') as String,
      empresaId: (empresa['id'] ?? json['empresaId'] ?? '') as String,
      empresaNombre:
          (empresa['nombreComercial'] ?? empresa['nombre'] ?? '') as String,
      rolCodigo: (rol['codigo'] ?? json['rol'] ?? '') as String,
      sucursalId: sucursal?['id'] as String?,
      sucursalNombre: sucursal?['nombre'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
    );
  }

  User toEntity() => User(
        id: id,
        email: email,
        nombre: nombre,
        apellido: apellido,
        empresaId: empresaId,
        empresaNombre: empresaNombre,
        rol: rolCodigo,
        sucursalId: sucursalId,
        sucursalNombre: sucursalNombre,
        avatarUrl: avatarUrl,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'nombre': nombre,
        'apellido': apellido,
        'empresaId': empresaId,
        'empresaNombre': empresaNombre,
        'rolCodigo': rolCodigo,
        'sucursalId': sucursalId,
        'sucursalNombre': sucursalNombre,
        'avatarUrl': avatarUrl,
      };
}
