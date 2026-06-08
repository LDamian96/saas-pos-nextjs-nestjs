// =============================================================================
// device_info_service.dart
// Info del dispositivo y app que se adjunta a TODOS los logs remotos.
// Cache en memoria — se obtiene una sola vez al arrancar.
// =============================================================================

import 'dart:io' show Platform;
import 'dart:ui' show PlatformDispatcher;

import 'package:flutter_riverpod/flutter_riverpod.dart';

final deviceInfoServiceProvider = Provider<DeviceInfoService>((ref) {
  return DeviceInfoService();
});

class DeviceInfoSnapshot {
  const DeviceInfoSnapshot({
    required this.platform,
    required this.osVersion,
    required this.model,
    required this.appVersion,
    required this.buildNumber,
    required this.locale,
  });

  final String platform;
  final String osVersion;
  final String model;
  final String appVersion;
  final String buildNumber;
  final String locale;

  Map<String, dynamic> toJson() => {
        'platform': platform,
        'osVersion': osVersion,
        'model': model,
        'appVersion': appVersion,
        'buildNumber': buildNumber,
        'locale': locale,
      };
}

class DeviceInfoService {
  DeviceInfoSnapshot? _cached;

  DeviceInfoSnapshot get snapshot {
    _cached ??= _build();
    return _cached!;
  }

  DeviceInfoSnapshot _build() {
    final locale =
        PlatformDispatcher.instance.locale.toLanguageTag();
    String platform = 'unknown';
    String osVersion = '';
    try {
      if (Platform.isAndroid) platform = 'android';
      if (Platform.isIOS) platform = 'ios';
      osVersion = Platform.operatingSystemVersion;
    } catch (_) {/* ok */}

    return DeviceInfoSnapshot(
      platform: platform,
      osVersion: osVersion,
      // model/appVersion se enriquecen luego con device_info_plus si se agrega.
      model: '',
      appVersion: '0.1.0',
      buildNumber: '1',
      locale: locale,
    );
  }
}
