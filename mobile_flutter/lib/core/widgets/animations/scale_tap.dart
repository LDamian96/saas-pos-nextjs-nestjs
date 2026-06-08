// =============================================================================
// scale_tap.dart
// Wrapper que aplica feedback de "presión" suave a cualquier widget tappable.
// Bounce sutil + haptic ligero al press.
// =============================================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class ScaleTap extends StatefulWidget {
  const ScaleTap({
    required this.child,
    required this.onTap,
    super.key,
    this.scaleDown = 0.96,
    this.duration = const Duration(milliseconds: 90),
    this.haptic = true,
  });

  final Widget child;
  final VoidCallback? onTap;
  final double scaleDown;
  final Duration duration;
  final bool haptic;

  @override
  State<ScaleTap> createState() => _ScaleTapState();
}

class _ScaleTapState extends State<ScaleTap>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: widget.duration,
    lowerBound: 0,
    upperBound: 1,
  );

  late final Animation<double> _scale = Tween<double>(
    begin: 1,
    end: widget.scaleDown,
  ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _onTap() async {
    if (widget.haptic) {
      unawaited(HapticFeedback.lightImpact());
    }
    widget.onTap?.call();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: widget.onTap == null ? null : (_) => _ctrl.forward(),
      onTapUp: widget.onTap == null ? null : (_) => _ctrl.reverse(),
      onTapCancel: widget.onTap == null ? null : () => _ctrl.reverse(),
      onTap: widget.onTap == null ? null : _onTap,
      behavior: HitTestBehavior.opaque,
      child: ScaleTransition(scale: _scale, child: widget.child),
    );
  }
}

void unawaited(Future<void> future) {}
