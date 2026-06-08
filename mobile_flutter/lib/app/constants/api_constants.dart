// =============================================================================
// api_constants.dart
// Configuración estática del backend. Cambiar solo aquí.
// =============================================================================

class ApiConstants {
  ApiConstants._();

  /// Backend base URL (NestJS desplegado en VPS Contabo).
  static const String baseUrl = 'https://api-pos.ldmapp.com/api/v1';

  /// Timeouts conservadores para conexiones móviles inestables.
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);

  // ─── Endpoints ───────────────────────────────────────────────────
  static const String authLogin = '/auth/login';
  static const String authLogout = '/auth/logout';
  static const String authRefresh = '/auth/refresh';
  static const String authMe = '/auth/me';

  static const String productos = '/productos';
  static const String categorias = '/categorias';
  static const String marcas = '/marcas';
  static const String sucursales = '/sucursales';

  static const String ventas = '/ventas';
  static const String caja = '/caja';
  static const String cajaAbrir = '/caja/abrir';
  static const String cajaActual = '/caja/actual';
  static const String cajaCerrar = '/caja/cerrar';

  static const String metodosPago = '/ventas/metodos-pago';

  static const String reportesDashboard = '/reportes/dashboard';
  static const String alertasInventarioResumen = '/alertas-inventario/resumen';
}

class StorageKeys {
  StorageKeys._();

  // ─── Secure storage (KeyStore / Keychain) ───────────────────────
  static const String accessToken = 'access_token';
  static const String refreshToken = 'refresh_token';
  static const String userPin = 'user_pin_hash';
  static const String biometricEnabled = 'biometric_enabled';

  // ─── Shared preferences (no sensible) ───────────────────────────
  static const String themeMode = 'theme_mode';
  static const String firstLaunch = 'first_launch';
  static const String lastUserEmail = 'last_user_email';
  static const String settingsNubefactEnabled = 'settings_nubefact_enabled';
  static const String settingsBluetoothEnabled = 'settings_bluetooth_enabled';
  static const String settingsWhatsappEnabled = 'settings_whatsapp_enabled';
}
