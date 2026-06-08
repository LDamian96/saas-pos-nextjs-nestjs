// =============================================================================
// auth_repository.dart
// Contrato del repositorio de auth — implementado en la capa data.
// Devuelve Either<Failure, T> para forzar manejo de errores explícito.
// =============================================================================

import 'package:dartz/dartz.dart';
import 'package:pos_mobile/core/error/failures.dart';
import 'package:pos_mobile/features/auth/domain/entities/user.dart';

abstract interface class AuthRepository {
  /// Login inicial con email + password. Guarda tokens en secure storage.
  Future<Either<Failure, User>> loginWithCredentials({
    required String email,
    required String password,
  });

  /// Verifica PIN contra el hash guardado localmente. Devuelve true/false.
  Future<Either<Failure, bool>> verifyPin(String pin);

  /// Guarda nuevo PIN (hash bcrypt-like). Solo en setup inicial / cambio.
  Future<Either<Failure, void>> savePin(String pin);

  /// ¿Hay un PIN configurado en este dispositivo?
  Future<bool> hasPin();

  /// Autentica con biometría (huella o Face ID).
  Future<Either<Failure, bool>> authenticateWithBiometric();

  /// Activa o desactiva biometría como método rápido de login.
  Future<void> setBiometricEnabled(bool enabled);
  Future<bool> isBiometricEnabled();

  /// Obtiene el usuario actualmente logueado (si existe sesión).
  Future<Either<Failure, User?>> getCurrentUser();

  /// Cierra sesión. Limpia tokens y PIN.
  Future<void> logout();

  /// Solo limpia tokens, mantiene PIN (para lock-screen pattern).
  Future<void> clearSessionTokens();
}
