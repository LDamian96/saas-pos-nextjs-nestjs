// =============================================================================
// biometric_service.dart
// Encapsula local_auth. Verifica disponibilidad, autentica con huella/FaceID.
// Inglés de mensajes evitado — todo en español para UX nativa.
// =============================================================================

import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';
import 'package:local_auth_android/local_auth_android.dart';
import 'package:local_auth_darwin/local_auth_darwin.dart';

final biometricServiceProvider = Provider<BiometricService>((ref) {
  return BiometricService();
});

class BiometricService {
  BiometricService() : _auth = LocalAuthentication();
  final LocalAuthentication _auth;

  Future<bool> isAvailable() async {
    try {
      final isSupported = await _auth.isDeviceSupported();
      if (!isSupported) return false;
      final canCheck = await _auth.canCheckBiometrics;
      return canCheck;
    } on PlatformException {
      return false;
    }
  }

  Future<List<BiometricType>> getAvailableTypes() async {
    try {
      return await _auth.getAvailableBiometrics();
    } on PlatformException {
      return const [];
    }
  }

  /// Autentica con huella / Face ID.
  /// Devuelve `true` si autenticó OK. False en cualquier otro caso.
  Future<bool> authenticate({String? reason}) async {
    try {
      final ok = await _auth.authenticate(
        localizedReason: reason ?? 'Confirma tu identidad para continuar',
        options: const AuthenticationOptions(
          biometricOnly: true,
          stickyAuth: true,
          useErrorDialogs: true,
        ),
        authMessages: const [
          AndroidAuthMessages(
            signInTitle: 'Verifica tu identidad',
            biometricHint: 'Toca el sensor',
            cancelButton: 'Cancelar',
          ),
          IOSAuthMessages(
            cancelButton: 'Cancelar',
            goToSettingsButton: 'Ajustes',
            goToSettingsDescription: 'Activa Face ID en Ajustes',
          ),
        ],
      );
      return ok;
    } on PlatformException {
      return false;
    }
  }
}
