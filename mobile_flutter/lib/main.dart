// =============================================================================
// main.dart
// Punto de entrada. Inicializa SharedPreferences, overrides Riverpod y
// configura orientación portrait-only en producción.
// =============================================================================

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pos_mobile/app/app.dart';
import 'package:pos_mobile/core/storage/prefs_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);

  final prefs = await SharedPreferences.getInstance();

  runApp(
    ProviderScope(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(prefs),
      ],
      child: const PosShopApp(),
    ),
  );
}
