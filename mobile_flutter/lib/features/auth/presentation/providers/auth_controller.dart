// =============================================================================
// auth_controller.dart
// AuthController (Riverpod Notifier) — estado de sesión de la app.
// Expone métodos para login (credenciales / PIN / biometría) y logout.
// =============================================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pos_mobile/core/services/remote_logger.dart';
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
  late RemoteLogger _logger;

  @override
  AuthState build() {
    _repo = ref.read(authRepositoryProvider);
    _logger = ref.read(remoteLoggerProvider);
    return const AuthInitial();
  }

  void _bindSession(User user) {
    _logger.setSession(userId: user.id, empresaId: user.empresaId);
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
          _bindSession(user);
          state = AuthPinRequired(user); // → screen de PIN
        }
      },
    );
  }

  /// Login inicial con email + password (primera vez).
  Future<void> loginWithCredentials(String email, String password) async {
    state = const AuthLoading();
    _logger.info('login_attempt', extra: {'email': email});
    final result = await _repo.loginWithCredentials(
      email: email,
      password: password,
    );
    result.fold(
      (fail) {
        _logger.warning('login_failed', extra: {
          'email': email,
          'reason': fail.message,
        });
        state = AuthUnauthenticated(message: fail.message);
      },
      (user) {
        _bindSession(user);
        _logger.info('login_success', extra: {'userId': user.id});
        state = const AuthSetupRequired();
      },
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
    _logger.info('logout');
    await _repo.logout();
    _logger.setSession();
    state = const AuthUnauthenticated();
  }
}

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);
