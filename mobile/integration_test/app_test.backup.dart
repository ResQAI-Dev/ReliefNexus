import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:reliefnexus_mobile/main.dart' as app;
import 'package:reliefnexus_mobile/features/dashboard/presentation/screens/role_dashboard.dart';
import 'package:reliefnexus_mobile/features/risk_predictions/presentation/screens/risk_predictions_screen.dart';
import 'package:reliefnexus_mobile/features/vulnerability_impact/presentation/screens/vulnerability_impact_screen.dart';
import 'package:reliefnexus_mobile/features/vulnerability_impact/presentation/screens/vulnerability_impact_details_screen.dart';
import 'package:reliefnexus_mobile/features/resource_optimization/presentation/screens/resource_optimization_screen.dart';
import 'package:reliefnexus_mobile/features/emergency_alerts/presentation/screens/emergency_alerts_screen.dart';
import 'package:reliefnexus_mobile/features/emergency_alerts/presentation/screens/emergency_workflow_screen.dart';
import 'package:reliefnexus_mobile/features/resource_optimization/presentation/screens/agent03_workflow_screen.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets(
    'MOBILE-E2E-001..006 - complete mobile AI operational workflow',
    (WidgetTester tester) async {
      const email = String.fromEnvironment('E2E_MOBILE_EMAIL');
      const password = String.fromEnvironment('E2E_MOBILE_PASSWORD');

      if (email.isEmpty || password.isEmpty) {
        fail('Pass E2E_MOBILE_EMAIL and E2E_MOBILE_PASSWORD using --dart-define.');
      }

      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // MOBILE-E2E-001 â€” App Launch
      expect(find.byType(MaterialApp), findsOneWidget);
      print('MOBILE-E2E-001 PASS - App launched successfully');

      // First-run onboarding can appear on a fresh emulator.
      if (find.text('Skip').evaluate().isNotEmpty) {
        await tester.tap(find.text('Skip').first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      // MOBILE-E2E-002 â€” Login â†’ Dashboard
      expect(find.bySemanticsLabel('Email Address'), findsOneWidget);
      expect(find.bySemanticsLabel('Password'), findsOneWidget);

      await tester.enterText(find.bySemanticsLabel('Email Address'), email);
      await tester.enterText(find.bySemanticsLabel('Password'), password);
      await tester.tap(find.text('Sign In').first);
      await tester.pumpAndSettle(const Duration(seconds: 8));

      expect(find.byType(RoleDashboard), findsOneWidget);
      print('MOBILE-E2E-002 PASS - Login reached role dashboard');

      // MOBILE-E2E-003 â€” Risk Prediction workflow
      final dashboardContext = tester.element(find.byType(RoleDashboard));
      Navigator.of(dashboardContext).push(
        MaterialPageRoute(builder: (_) => const RiskPredictionsPage()),
      );
      await tester.pumpAndSettle(const Duration(seconds: 5));

      expect(find.text('Risk Predictions'), findsOneWidget);
      final riskDropdown = find.byType(DropdownButtonFormField<String>);
      expect(riskDropdown, findsOneWidget);

      // Use a real persisted Agent 01 prediction supplied by the backend.
      await tester.tap(riskDropdown);
      await tester.pumpAndSettle();
      final predictionItem = find.byType(DropdownMenuItem<String>).first;
      expect(predictionItem, findsOneWidget);
      await tester.tap(predictionItem);
      await tester.pumpAndSettle();

      expect(find.text('RUN ASSESSMENT'), findsOneWidget);
      print('MOBILE-E2E-003 PASS - Real Agent 01 prediction selected');

      // MOBILE-E2E-004 â€” Vulnerability & Impact
      await tester.tap(find.text('RUN ASSESSMENT').first);
      await tester.pumpAndSettle(const Duration(seconds: 10));

      expect(find.byType(VulnerabilityImpactDetailsPage), findsOneWidget);
      print('MOBILE-E2E-004 PASS - Agent 02 assessment completed and details opened');

      await tester.pageBack();
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // MOBILE-E2E-005 â€” Resource Optimization
      Navigator.of(tester.element(find.byType(RoleDashboard))).push(
        MaterialPageRoute(builder: (_) => const ResourceOptimizationPage()),
      );
      await tester.pumpAndSettle(const Duration(seconds: 6));

      expect(find.text('Resource Optimization'), findsWidgets);
      expect(find.text('Run Agent 03 Assessment'), findsOneWidget);

      await tester.tap(find.text('Run Agent 03 Assessment').first);
      await tester.pumpAndSettle(const Duration(seconds: 4));

      expect(find.byType(Agent03WorkflowPage), findsOneWidget);
      expect(find.text('Confirm & Run Agent 03'), findsOneWidget);

      await tester.tap(find.text('Confirm & Run Agent 03').first);
      await tester.pumpAndSettle(const Duration(seconds: 12));

      expect(
        find.textContaining('Agent 03'),
        findsWidgets,
      );
      print('MOBILE-E2E-005 PASS - Agent 03 workflow executed');

      await tester.pageBack();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // MOBILE-E2E-006 â€” Early Warning / approval-controlled execution
      Navigator.of(tester.element(find.byType(RoleDashboard))).push(
        MaterialPageRoute(builder: (_) => const EmergencyAlertsPage()),
      );
      await tester.pumpAndSettle(const Duration(seconds: 6));

      expect(find.text('Emergency Warning & Coordination'), findsOneWidget);
      expect(find.text('VIEW ASSESSMENT & RUN'), findsWidgets);

      await tester.tap(find.text('VIEW ASSESSMENT & RUN').first);
      await tester.pumpAndSettle(const Duration(seconds: 5));

      expect(find.byType(EmergencyWorkflowPage), findsOneWidget);
      expect(find.text('CONTINUE TO WARNING ANALYSIS'), findsOneWidget);
      await tester.tap(find.text('CONTINUE TO WARNING ANALYSIS').first);
      await tester.pumpAndSettle();

      expect(find.text('CONTINUE TO COORDINATION'), findsOneWidget);
      await tester.tap(find.text('CONTINUE TO COORDINATION').first);
      await tester.pumpAndSettle();

      expect(find.text('CONTINUE TO REVIEW'), findsOneWidget);
      await tester.tap(find.text('CONTINUE TO REVIEW').first);
      await tester.pumpAndSettle();

      expect(find.text('RUN AGENT 04 GENERATE WARNING'), findsOneWidget);
      await tester.tap(find.text('RUN AGENT 04 GENERATE WARNING').first);
      await tester.pumpAndSettle(const Duration(seconds: 12));

      final completed = find.text('EMERGENCY WARNING');
      final generated = find.text('Emergency Warning Generated');
      expect(completed.evaluate().isNotEmpty || generated.evaluate().isNotEmpty, isTrue);

      print('MOBILE-E2E-006 PASS - Agent 04 warning workflow completed');
      print('MOBILE-E2E-FINAL PASS - 6/6 mobile E2E stages completed');
    },
    timeout: const Timeout(Duration(minutes: 8)),
  );
}

