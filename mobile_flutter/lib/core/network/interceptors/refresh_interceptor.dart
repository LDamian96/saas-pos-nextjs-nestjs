// =============================================================================
// refresh_interceptor.dart
// Al recibir 401, intenta refrescar el token transparentemente y reintentar
// la request original. Si falla el refresh, limpia storage y reenvía 401.
// =============================================================================

import 'package:dio/dio.dart';
import 'package:pos_mobile/app/constants/api_constants.dart';
import 'package:pos_mobile/core/storage/secure_storage_service.dart';

class RefreshInterceptor extends QueuedInterceptor {
  RefreshInterceptor(this._storage, this._dio);

  final SecureStorageService _storage;
  final Dio _dio;

  bool _isRefreshing = false;

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final isUnauthorized = err.response?.statusCode == 401;
    final isRefreshCall = err.requestOptions.path.endsWith(
      ApiConstants.authRefresh,
    );
    final isLoginCall = err.requestOptions.path.endsWith(
      ApiConstants.authLogin,
    );

    if (!isUnauthorized || isRefreshCall || isLoginCall || _isRefreshing) {
      return handler.next(err);
    }

    _isRefreshing = true;
    try {
      final refreshToken = await _storage.read(StorageKeys.refreshToken);
      if (refreshToken == null || refreshToken.isEmpty) {
        await _clearTokens();
        return handler.next(err);
      }

      final response = await Dio(
        BaseOptions(
          baseUrl: ApiConstants.baseUrl,
          connectTimeout: ApiConstants.connectTimeout,
          receiveTimeout: ApiConstants.receiveTimeout,
        ),
      ).post<Map<String, dynamic>>(
        ApiConstants.authRefresh,
        data: {'refreshToken': refreshToken},
      );

      final data = response.data?['data'] as Map<String, dynamic>? ??
          response.data ??
          {};
      final newAccess = data['accessToken'] as String?;
      final newRefresh = data['refreshToken'] as String?;

      if (newAccess == null) {
        await _clearTokens();
        return handler.next(err);
      }

      await _storage.write(StorageKeys.accessToken, newAccess);
      if (newRefresh != null) {
        await _storage.write(StorageKeys.refreshToken, newRefresh);
      }

      // Re-emite la request original con el nuevo token.
      err.requestOptions.headers['Authorization'] = 'Bearer $newAccess';
      final retried = await _dio.fetch<dynamic>(err.requestOptions);
      return handler.resolve(retried);
    } catch (_) {
      await _clearTokens();
      return handler.next(err);
    } finally {
      _isRefreshing = false;
    }
  }

  Future<void> _clearTokens() async {
    await _storage.delete(StorageKeys.accessToken);
    await _storage.delete(StorageKeys.refreshToken);
  }
}
