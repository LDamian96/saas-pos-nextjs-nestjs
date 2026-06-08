// Smoke test del entrypoint. Verifica que la app renderiza sin crashear.

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pos_mobile/app/app.dart';
import 'package:pos_mobile/core/storage/prefs_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});

  testWidgets('App smoke test', (tester) async {
    final prefs = await SharedPreferences.getInstance();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
        child: const PosShopApp(),
      ),
    );
    await tester.pump();
    expect(find.byType(PosShopApp), findsOneWidget);
  });
}
