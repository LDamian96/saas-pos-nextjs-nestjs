// =============================================================================
// auth_remote_datasource.dart
// Llamadas HTTP al backend NestJS. Maneja excepciones técnicas (lanza
// ServerException / UnauthorizedException), no Failures.
// =============================================================================

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pos_mobile/app/constants/api_constants.dart';
import 'package:pos_mobile/core/error/exceptions.dart';
import 'package:pos_mobile/core/network/dio_client.dart';
import 'package:pos_mobile/features/auth/data/models/user_model.dart';

class LoginResponse {
  const LoginResponse({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
  });
  final UserModel user;
  final String accessToken;
  final String refreshToken;
}

abstract interface class AuthRemoteDataSource {
  Future<LoginResponse> login({
    required String email,
    required String password,
  });

  Future<UserModel> me();

  Future<void> logout();
}

final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  return AuthRemoteDataSourceImpl(ref.watch(dioClientProvider));
});

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  AuthRemoteDataSourceImpl(this._dio);
  final Dio _dio;

  @override
  Future<LoginResponse> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        ApiConstants.authLogin,
        data: {'email': email, 'password': password},
      );
      final body = response.data?['data'] as Map<String, dynamic>? ??
          response.data ??
          {};
      final access = body['accessToken'] as String?;
      final refresh = body['refreshToken'] as String?;
      final userJson = body['user'] as Map<String, dynamic>?;
      if (access == null || refresh == null || userJson == null) {
        throw ServerException(message: 'Respuesta de login incompleta');
      }
      return LoginResponse(
        user: UserModel.fromJson(userJson),
        accessToken: access,
        refreshToken: refresh,
      );
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  @override
  Future<UserModel> me() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        ApiConstants.authMe,
      );
      final json = response.data?['data'] as Map<String, dynamic>? ??
          response.data ??
          {};
      return UserModel.fromJson(json);
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  @override
  Future<void> logout() async {
    try {
      await _dio.post<dynamic>(ApiConstants.authLogout);
    } on DioException {
      // Logout offline-safe: si falla la red, igual limpiamos local.
    }
  }

  Exception _mapDioError(DioException e) {
    final status = e.response?.statusCode;
    if (status == 401) {
      return UnauthorizedException(
        (e.response?.data?['message'] as String?) ?? 'Credenciales inválidas',
      );
    }
    if (e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.connectionTimeout) {
      return NetworkException();
    }
    final msg = (e.response?.data?['message'] as String?) ??
        e.message ??
        'Error del servidor';
    return ServerException(message: msg, statusCode: status);
  }
}
