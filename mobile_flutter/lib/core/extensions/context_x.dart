// =============================================================================
// context_x.dart
// Sugar sobre BuildContext: theme, colors, navegación y haptic.
// =============================================================================

import 'package:flutter/material.dart';

extension ContextX on BuildContext {
  ThemeData get theme => Theme.of(this);
  ColorScheme get colors => Theme.of(this).colorScheme;
  TextTheme get text => Theme.of(this).textTheme;

  MediaQueryData get mq => MediaQuery.of(this);
  Size get screen => MediaQuery.of(this).size;
  EdgeInsets get padding => MediaQuery.of(this).padding;

  bool get isDark => Theme.of(this).brightness == Brightness.dark;
  bool get isCompact => MediaQuery.of(this).size.width < 360;
}
