// =============================================================================
// app.dart
// Root widget. MaterialApp.router + tema + toastification.
// =============================================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pos_mobile/app/router/app_router.dart';
import 'package:pos_mobile/app/theme/app_theme.dart';
import 'package:toastification/toastification.dart';

class PosShopApp extends ConsumerWidget {
  const PosShopApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        systemNavigationBarColor: Colors.transparent,
      ),
    );

    final router = ref.watch(goRouterProvider);
    return ToastificationWrapper(
      child: MaterialApp.router(
        title: 'POS Shop',
        debugShowCheckedModeBanner: false,
        routerConfig: router,
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        themeMode: ThemeMode.system,
      ),
    );
  }
}
