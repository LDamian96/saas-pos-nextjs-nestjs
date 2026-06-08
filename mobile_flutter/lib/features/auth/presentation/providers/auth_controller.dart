// =============================================================================
// auth_controller.dart
// AuthController (Riverpod Notifier) — estado de sesión de la app.
// Expone métodos para login (credenciales / PIN / biometría) y logout.
// =============================================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pos_mobile/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:pos_mobile/features/auth/domain/entities/user.dart';
import 'package:pos_mobile/features/auth/domain/repositories/auth_repository.dart';

sealed class AuthState {
  const AuthState();
}

class AuthInitial extends AuthState {
  const AuthInitial();
}

class AuthChecking extends AuthState {
  const AuthChecking();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated({this.message});
  final String? message;
}

class AuthAuthenticated extends AuthState {
  const AuthAuthenticated(this.user);
  final User user;
}

class AuthPinRequired extends AuthState {
  const AuthPinRequired(this.cachedUser);
  final User cachedUser;
}

class AuthSetupRequired extends AuthState {
  const AuthSetupRequired();
}

class AuthController extends Notifier<AuthState> {
  late AuthRepository _repo;

  @override
  AuthState build() {
    _repo = ref.read(authRepositoryProvider);
    return const AuthInitial();
  }

  /// Llamado al inicializar la app. Determina dónde se debe redirigir.
  Future<void> bootstrap() async {
    state = const AuthChecking();
    final hasPin = await _repo.hasPin();
    if (!hasPin) {
      state = const AuthUnauthenticated(); // → login con credenciales
      return;
    }
    final userEither = await _repo.getCurrentUser();
    userEither.fold(
      (_) => state = const AuthUnauthenticated(),
      (user) {
        if (user == null) {
          state = const AuthUnauthenticated();
        } else {
          state = AuthPinRequired(user); // → screen de PIN
        }
      },
    );
  }

  /// Login inicial con email + password (primera vez).
  Future<void> loginWithCredentials(String email, String password) async {
    state = const AuthLoading();
    final result = await _repo.loginWithCredentials(
      email: email,
      password: password,
    );
    result.fold(
      (fail) => state = AuthUnauthenticated(message: fail.message),
      (user) => state = const AuthSetupRequired(),
    );
  }

  /// Verifica PIN. Si OK → sesión activa.
  Future<bool> verifyPin(String pin) async {
    final result = await _repo.verifyPin(pin);
    return result.fold((_) => false, (ok) async {
      if (ok) {
        final userEither = await _repo.getCurrentUser();
        userEither.fold(
          (_) => state = const AuthUnauthenticated(),
          (user) {
            if (user != null) state = AuthAuthenticated(user);
          },
        );
      }
      return ok;
    });
  }

  /// Setup inicial del PIN (después del login con credenciales).
  Future<bool> savePin(String pin) async {
    final result = await _repo.savePin(pin);
    return result.fold((_) => false, (_) async {
      // Después del setup, vuelve a pedir el PIN para confirmar entrada.
      final userEither = await _repo.getCurrentUser();
      userEither.fold(
        (_) => state = const AuthUnauthenticated(),
        (user) {
          if (user != null) state = AuthAuthenticated(user);
        },
      );
      return true;
    });
  }

  Future<bool> authenticateWithBiometric() async {
    final enabled = await _repo.isBiometricEnabled();
    if (!enabled) return false;
    final result = await _repo.authenticateWithBiometric();
    return result.fold((_) => false, (ok) async {
      if (ok) {
        final userEither = await _repo.getCurrentUser();
        userEither.fold(
          (_) => state = const AuthUnauthenticated(),
          (user) {
            if (user != null) state = AuthAuthenticated(user);
          },
        );
      }
      return ok;
    });
  }

  Future<void> setBiometricEnabled(bool enabled) =>
      _repo.setBiometricEnabled(enabled);

  Future<bool> isBiometricEnabled() => _repo.isBiometricEnabled();

  Future<void> logout() async {
    state = const AuthLoading();
    await _repo.logout();
    state = const AuthUnauthenticated();
  }
}

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);
