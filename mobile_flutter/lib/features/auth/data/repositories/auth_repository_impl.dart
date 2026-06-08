// =============================================================================
// auth_repository_impl.dart
// Implementación del AuthRepository. Orquesta remote + local + biometric.
// Mapea excepciones técnicas → Failures de dominio.
// =============================================================================

import 'package:dartz/dartz.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pos_mobile/core/error/exceptions.dart';
import 'package:pos_mobile/core/error/failures.dart';
import 'package:pos_mobile/core/network/network_info.dart';
import 'package:pos_mobile/core/services/biometric_service.dart';
import 'package:pos_mobile/features/auth/data/datasources/auth_local_datasource.dart';
import 'package:pos_mobile/features/auth/data/datasources/auth_remote_datasource.dart';
import 'package:pos_mobile/features/auth/domain/entities/user.dart';
import 'package:pos_mobile/features/auth/domain/repositories/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(
    remote: ref.watch(authRemoteDataSourceProvider),
    local: ref.watch(authLocalDataSourceProvider),
    network: ref.watch(networkInfoProvider),
    biometric: ref.watch(biometricServiceProvider),
  );
});

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl({
    required this.remote,
    required this.local,
    required this.network,
    required this.biometric,
  });

  final AuthRemoteDataSource remote;
  final AuthLocalDataSource local;
  final NetworkInfo network;
  final BiometricService biometric;

  @override
  Future<Either<Failure, User>> loginWithCredentials({
    required String email,
    required String password,
  }) async {
    if (!await network.isConnected) {
      return const Left(NetworkFailure());
    }
    try {
      final response = await remote.login(email: email, password: password);
      await local.saveTokens(
        access: response.accessToken,
        refresh: response.refreshToken,
      );
      await local.saveUser(response.user);
      return Right(response.user.toEntity());
    } on UnauthorizedException catch (e) {
      return Left(AuthFailure(message: e.message));
    } on NetworkException catch (_) {
      return const Left(NetworkFailure());
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, statusCode: e.statusCode));
    } catch (e) {
      return Left(UnknownFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, bool>> verifyPin(String pin) async {
    try {
      final ok = await local.verifyPin(pin);
      return Right(ok);
    } catch (_) {
      return const Left(CacheFailure());
    }
  }

  @override
  Future<Either<Failure, void>> savePin(String pin) async {
    try {
      await local.savePin(pin);
      return const Right(null);
    } catch (_) {
      return const Left(CacheFailure(message: 'No se pudo guardar el PIN'));
    }
  }

  @override
  Future<bool> hasPin() => local.hasPin();

  @override
  Future<Either<Failure, bool>> authenticateWithBiometric() async {
    final available = await biometric.isAvailable();
    if (!available) {
      return const Left(
        BiometricFailure(message: 'Tu dispositivo no soporta biometría'),
      );
    }
    final ok = await biometric.authenticate(
      reason: 'Verifica tu identidad para abrir tu negocio',
    );
    return Right(ok);
  }

  @override
  Future<void> setBiometricEnabled(bool enabled) =>
      local.setBiometricEnabled(enabled);

  @override
  Future<bool> isBiometricEnabled() => local.isBiometricEnabled();

  @override
  Future<Either<Failure, User?>> getCurrentUser() async {
    final cached = await local.readUser();
    if (cached != null) return Right(cached.toEntity());
    return const Right(null);
  }

  @override
  Future<void> logout() async {
    await remote.logout();
    await local.clearTokens();
    await local.clearUser();
    await local.clearPin();
    await local.setBiometricEnabled(false);
  }

  @override
  Future<void> clearSessionTokens() async {
    await local.clearTokens();
  }
}
