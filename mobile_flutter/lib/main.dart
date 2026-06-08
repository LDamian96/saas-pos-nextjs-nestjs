// =============================================================================
// main.dart
// Punto de entrada. Inicializa SharedPreferences, overrides Riverpod,
// orientación portrait, captura global de errores y zona de ejecución.
// =============================================================================

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logger/logger.dart';
import 'package:pos_mobile/app/app.dart';
import 'package:pos_mobile/core/storage/prefs_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

final appLogger = Logger(
  printer: PrettyPrinter(
    methodCount: 0,
    errorMethodCount: 8,
    lineLength: 100,
    printEmojis: true,
    dateTimeFormat: DateTimeFormat.onlyTimeAndSinceStart,
  ),
);

Future<void> main() async {
  // Capturar todos los errores en una zona única para que NINGUNO quede oculto.
  await runZonedGuarded<Future<void>>(
    () async {
      WidgetsFlutterBinding.ensureInitialized();
      await SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp,
      ]);

      // 1. Captura errors de Flutter (build, paint, gestures).
      FlutterError.onError = (details) {
        appLogger.e(
          'FlutterError: ${details.exceptionAsString()}',
          error: details.exception,
          stackTrace: details.stack,
        );
        if (kDebugMode) {
          FlutterError.presentError(details);
        }
      };

      // 2. Captura errors de la plataforma nativa (Android/iOS).
      PlatformDispatcher.instance.onError = (error, stack) {
        appLogger.e('PlatformError', error: error, stackTrace: stack);
        return true;
      };

      final prefs = await SharedPreferences.getInstance();

      runApp(
        ProviderScope(
          overrides: [
            sharedPreferencesProvider.overrideWithValue(prefs),
          ],
          child: const PosShopApp(),
        ),
      );
    },
    (error, stack) {
      // 3. Captura errors de zonas asíncronas (futures, streams sin handler).
      appLogger.e('ZoneError', error: error, stackTrace: stack);
    },
  );
}
