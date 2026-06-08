// =============================================================================
// fade_slide.dart
// Helpers para animaciones declarativas estilo GSAP usando flutter_animate.
// =============================================================================

import 'package:flutter/widgets.dart';
import 'package:flutter_animate/flutter_animate.dart';

extension FadeSlideX on Widget {
  /// Fade + slide up — entrada estándar de elementos en pantalla.
  Widget fadeSlideUp({Duration? delay, double offset = 16}) {
    return animate(delay: delay)
        .fadeIn(duration: 380.ms, curve: Curves.easeOutCubic)
        .slideY(begin: offset / 100, end: 0, curve: Curves.easeOutCubic);
  }

  /// Fade + slide down — para tooltips, notifications.
  Widget fadeSlideDown({Duration? delay, double offset = 16}) {
    return animate(delay: delay)
        .fadeIn(duration: 380.ms, curve: Curves.easeOutCubic)
        .slideY(begin: -offset / 100, end: 0, curve: Curves.easeOutCubic);
  }

  /// Scale + fade — entrada con bounce sutil.
  Widget scaleIn({Duration? delay, double begin = 0.92}) {
    return animate(delay: delay)
        .fadeIn(duration: 320.ms)
        .scale(
          begin: Offset(begin, begin),
          end: const Offset(1, 1),
          duration: 380.ms,
          curve: Curves.easeOutBack,
        );
  }

  /// Stagger en listas — cada item con delay incremental.
  Widget staggered(int index, {int stepMs = 60}) {
    return animate(delay: Duration(milliseconds: index * stepMs))
        .fadeIn(duration: 320.ms, curve: Curves.easeOutCubic)
        .slideY(begin: 0.12, end: 0, curve: Curves.easeOutCubic);
  }

  /// Shimmer brand — luz de marca pasando una vez.
  Widget brandShimmer({Color color = const Color(0xFF00932C)}) {
    return animate(onPlay: (controller) => controller.repeat()).shimmer(
      duration: 2400.ms,
      color: color.withValues(alpha: 0.15),
      size: 0.8,
    );
  }
}
