// =============================================================================
// network_info.dart
// Detecta conectividad real (no solo "hay WiFi"). Wrap de connectivity_plus
// + internet_connection_checker_plus para validar acceso real al backend.
// =============================================================================

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:internet_connection_checker_plus/internet_connection_checker_plus.dart';

abstract interface class NetworkInfo {
  Future<bool> get isConnected;
  Stream<bool> get onStatusChange;
}

final networkInfoProvider = Provider<NetworkInfo>((ref) {
  return NetworkInfoImpl();
});

class NetworkInfoImpl implements NetworkInfo {
  final InternetConnection _checker = InternetConnection();

  @override
  Future<bool> get isConnected async {
    final connectivity = await Connectivity().checkConnectivity();
    if (connectivity.contains(ConnectivityResult.none)) return false;
    return _checker.hasInternetAccess;
  }

  @override
  Stream<bool> get onStatusChange => _checker.onStatusChange.map(
        (status) => status == InternetStatus.connected,
      );
}
