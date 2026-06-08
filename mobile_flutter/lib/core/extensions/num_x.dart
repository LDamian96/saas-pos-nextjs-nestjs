// =============================================================================
// num_x.dart
// Extensions sobre num para formateo de moneda peruana y tabular nums.
// =============================================================================

import 'package:intl/intl.dart';

final _soles = NumberFormat.currency(
  locale: 'es_PE',
  symbol: 'S/ ',
  decimalDigits: 2,
);
final _plain = NumberFormat('#,##0.00', 'es_PE');
final _integer = NumberFormat('#,##0', 'es_PE');

extension NumX on num {
  /// Formatea como moneda peruana: `S/ 1,250.50`.
  String get toSoles => _soles.format(this);

  /// Solo el número con coma de miles: `1,250.50`.
  String get toMoneyPlain => _plain.format(this);

  /// Sin decimales: `1,250`.
  String get toInteger => _integer.format(this);
}
