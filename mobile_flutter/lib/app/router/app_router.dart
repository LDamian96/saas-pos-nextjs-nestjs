// =============================================================================
// app_router.dart
// Configuración de go_router con transiciones modernas.
// =============================================================================

import 'package:animations/animations.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pos_mobile/app/router/route_names.dart';
import 'package:pos_mobile/features/auth/presentation/pages/login_credentials_page.dart';
import 'package:pos_mobile/features/auth/presentation/pages/login_pin_page.dart';
import 'package:pos_mobile/features/auth/presentation/pages/setup_pin_page.dart';
import 'package:pos_mobile/features/auth/presentation/pages/splash_page.dart';
import 'package:pos_mobile/features/home/presentation/pages/home_shell_page.dart';

final goRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: RouteNames.splash,
    debugLogDiagnostics: false,
    routes: [
      GoRoute(
        path: RouteNames.splash,
        pageBuilder: (_, __) => const NoTransitionPage(child: SplashPage()),
      ),
      GoRoute(
        path: RouteNames.loginCredentials,
        pageBuilder: (_, state) => _fadeThrough(const LoginCredentialsPage()),
      ),
      GoRoute(
        path: RouteNames.setupPin,
        pageBuilder: (_, state) => _fadeThrough(const SetupPinPage()),
      ),
      GoRoute(
        path: RouteNames.loginPin,
        pageBuilder: (_, state) => _fadeThrough(const LoginPinPage()),
      ),
      GoRoute(
        path: RouteNames.home,
        pageBuilder: (_, state) => _fadeThrough(const HomeShellPage()),
      ),
    ],
  );
});

CustomTransitionPage<T> _fadeThrough<T>(Widget child) {
  return CustomTransitionPage<T>(
    child: child,
    transitionDuration: const Duration(milliseconds: 380),
    reverseTransitionDuration: const Duration(milliseconds: 300),
    transitionsBuilder: (context, animation, secondary, child) {
      return FadeThroughTransition(
        animation: animation,
        secondaryAnimation: secondary,
        child: child,
      );
    },
  );
}
