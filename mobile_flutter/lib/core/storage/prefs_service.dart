// =============================================================================
// prefs_service.dart
// Wrapper de SharedPreferences para configuración no sensible:
// theme mode, first launch flag, settings de NubeFact / Bluetooth / WhatsApp.
// =============================================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError('Override en main()'),
);

final prefsServiceProvider = Provider<PrefsService>((ref) {
  return PrefsService(ref.watch(sharedPreferencesProvider));
});

class PrefsService {
  PrefsService(this._prefs);
  final SharedPreferences _prefs;

  bool? getBool(String key) => _prefs.getBool(key);
  String? getString(String key) => _prefs.getString(key);
  int? getInt(String key) => _prefs.getInt(key);

  Future<bool> setBool(String key, bool value) => _prefs.setBool(key, value);
  Future<bool> setString(String key, String value) =>
      _prefs.setString(key, value);
  Future<bool> setInt(String key, int value) => _prefs.setInt(key, value);

  Future<bool> remove(String key) => _prefs.remove(key);
  Future<bool> clear() => _prefs.clear();
}
