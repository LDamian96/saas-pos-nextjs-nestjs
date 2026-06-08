// =============================================================================
// auth_local_datasource.dart
// Gestiona PIN, tokens y datos de usuario locales.
// PIN se guarda como hash SHA-256 + salt simple. NO se guarda el PIN crudo.
// =============================================================================

import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pos_mobile/app/constants/api_constants.dart';
import 'package:pos_mobile/core/storage/prefs_service.dart';
import 'package:pos_mobile/core/storage/secure_storage_service.dart';
import 'package:pos_mobile/features/auth/data/models/user_model.dart';

abstract interface class AuthLocalDataSource {
  Future<void> saveTokens({
    required String access,
    required String refresh,
  });

  Future<String?> readAccessToken();
  Future<String?> readRefreshToken();
  Future<void> clearTokens();

  Future<void> saveUser(UserModel user);
  Future<UserModel?> readUser();
  Future<void> clearUser();

  Future<void> savePin(String pin);
  Future<bool> verifyPin(String pin);
  Future<bool> hasPin();
  Future<void> clearPin();

  Future<void> setBiometricEnabled(bool enabled);
  Future<bool> isBiometricEnabled();
}

final authLocalDataSourceProvider = Provider<AuthLocalDataSource>((ref) {
  return AuthLocalDataSourceImpl(
    secureStorage: ref.watch(secureStorageProvider),
    prefs: ref.watch(prefsServiceProvider),
  );
});

class AuthLocalDataSourceImpl implements AuthLocalDataSource {
  AuthLocalDataSourceImpl({
    required this.secureStorage,
    required this.prefs,
  });

  final SecureStorageService secureStorage;
  final PrefsService prefs;

  static const _userPrefsKey = 'cached_user_json';
  static const _pinSalt = 'pos_shop_pin_v1';

  @override
  Future<void> saveTokens({
    required String access,
    required String refresh,
  }) async {
    await secureStorage.write(StorageKeys.accessToken, access);
    await secureStorage.write(StorageKeys.refreshToken, refresh);
  }

  @override
  Future<String?> readAccessToken() =>
      secureStorage.read(StorageKeys.accessToken);

  @override
  Future<String?> readRefreshToken() =>
      secureStorage.read(StorageKeys.refreshToken);

  @override
  Future<void> clearTokens() async {
    await secureStorage.delete(StorageKeys.accessToken);
    await secureStorage.delete(StorageKeys.refreshToken);
  }

  @override
  Future<void> saveUser(UserModel user) async {
    await prefs.setString(_userPrefsKey, jsonEncode(user.toJson()));
  }

  @override
  Future<UserModel?> readUser() async {
    final raw = prefs.getString(_userPrefsKey);
    if (raw == null) return null;
    try {
      return UserModel.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> clearUser() async {
    await prefs.remove(_userPrefsKey);
  }

  String _hashPin(String pin) {
    final bytes = utf8.encode('$pin$_pinSalt');
    return sha256.convert(bytes).toString();
  }

  @override
  Future<void> savePin(String pin) async {
    await secureStorage.write(StorageKeys.userPin, _hashPin(pin));
  }

  @override
  Future<bool> verifyPin(String pin) async {
    final stored = await secureStorage.read(StorageKeys.userPin);
    if (stored == null) return false;
    return stored == _hashPin(pin);
  }

  @override
  Future<bool> hasPin() async {
    final stored = await secureStorage.read(StorageKeys.userPin);
    return stored != null && stored.isNotEmpty;
  }

  @override
  Future<void> clearPin() async {
    await secureStorage.delete(StorageKeys.userPin);
  }

  @override
  Future<void> setBiometricEnabled(bool enabled) async {
    await secureStorage.write(
      StorageKeys.biometricEnabled,
      enabled ? '1' : '0',
    );
  }

  @override
  Future<bool> isBiometricEnabled() async {
    final v = await secureStorage.read(StorageKeys.biometricEnabled);
    return v == '1';
  }
}
