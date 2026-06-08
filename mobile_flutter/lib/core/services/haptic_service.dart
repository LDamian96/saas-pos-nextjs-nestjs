// =============================================================================
// haptic_service.dart
// Patrones de feedback háptico. Usado en taps, errores, éxitos.
// =============================================================================

import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final hapticServiceProvider = Provider<HapticService>((ref) => HapticService());

class HapticService {
  Future<void> light() => HapticFeedback.lightImpact();
  Future<void> medium() => HapticFeedback.mediumImpact();
  Future<void> heavy() => HapticFeedback.heavyImpact();
  Future<void> selection() => HapticFeedback.selectionClick();

  Future<void> success() async {
    await HapticFeedback.lightImpact();
    await Future<void>.delayed(const Duration(milliseconds: 60));
    await HapticFeedback.mediumImpact();
  }

  Future<void> error() async {
    await HapticFeedback.heavyImpact();
    await Future<void>.delayed(const Duration(milliseconds: 80));
    await HapticFeedback.heavyImpact();
  }
}
