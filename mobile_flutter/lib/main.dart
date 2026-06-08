// =============================================================================
// main.dart
// Punto de entrada. Inicializa SharedPreferences, RemoteLogger global,
// orientación portrait y captura TODOS los errors (local + remoto al backend).
// =============================================================================

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pos_mobile/app/app.dart';
import 'package:pos_mobile/core/services/device_info_service.dart';
import 'package:pos_mobile/core/services/remote_logger.dart';
import 'package:pos_mobile/core/storage/prefs_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<void> main() async {
  await runZonedGuarded<Future<void>>(
    () async {
      WidgetsFlutterBinding.ensureInitialized();
      await SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp,
      ]);

      final prefs = await SharedPreferences.getInstance();

      // Logger global compartido para handlers de error que no tienen ref.
      final deviceInfo = DeviceInfoService();
      final logger = RemoteLogger(deviceInfo: deviceInfo);

      // 1. Errors de Flutter (build, paint, gestures).
      FlutterError.onError = (details) {
        logger.error(
          'FlutterError: ${details.exceptionAsString()}',
          error: details.exception,
          stackTrace: details.stack,
          extra: {
            'library': details.library,
            'context': details.context?.toDescription(),
          },
        );
        if (kDebugMode) FlutterError.presentError(details);
      };

      // 2. Errors de la plataforma nativa (Android/iOS).
      PlatformDispatcher.instance.onError = (error, stack) {
        logger.fatal('PlatformError', error: error, stackTrace: stack);
        return true;
      };

      runApp(
        ProviderScope(
          overrides: [
            sharedPreferencesProvider.overrideWithValue(prefs),
            deviceInfoServiceProvider.overrideWithValue(deviceInfo),
            remoteLoggerProvider.overrideWithValue(logger),
          ],
          child: const PosShopApp(),
        ),
      );
    },
    (error, stack) {
      // 3. Errors de zonas asíncronas (futures sin .catchError, streams).
      // No tenemos provider aquí — usamos un logger nuevo standalone.
      final fallback = RemoteLogger(deviceInfo: DeviceInfoService());
      fallback.fatal('ZoneError', error: error, stackTrace: stack);
    },
  );
}
