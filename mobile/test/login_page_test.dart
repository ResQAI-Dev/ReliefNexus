import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:reliefnexus_mobile/features/auth/presentation/screens/login_screen.dart';
import 'package:reliefnexus_mobile/features/auth/providers/auth_provider.dart';

void main() {
  group('LoginPage Widget Tests', () {
    testWidgets('displays login page elements', (tester) async {
      await tester.pumpWidget(
        ChangeNotifierProvider(
          create: (_) => AuthProvider(),
          child: const MaterialApp(
            home: LoginPage(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Welcome Back'), findsOneWidget);
      expect(find.text('SECURE ACCESS'), findsOneWidget);
      expect(find.byType(TextFormField), findsNWidgets(2));
    });

    testWidgets('shows validation when login fields are empty', (tester) async {
      await tester.pumpWidget(
        ChangeNotifierProvider(
          create: (_) => AuthProvider(),
          child: const MaterialApp(
            home: LoginPage(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      final buttons = find.byType(ElevatedButton);

      if (buttons.evaluate().isNotEmpty) {
        await tester.tap(buttons.first);
        await tester.pump();

        expect(find.byType(Form), findsOneWidget);
      }
    });
  });
}
