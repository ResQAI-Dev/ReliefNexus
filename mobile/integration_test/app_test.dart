import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:reliefnexus_mobile/main.dart' as app;

import 'package:reliefnexus_mobile/features/dashboard/presentation/screens/role_dashboard.dart';
import 'package:reliefnexus_mobile/features/risk_predictions/presentation/screens/risk_predictions_screen.dart';
import 'package:reliefnexus_mobile/features/vulnerability_impact/presentation/screens/vulnerability_impact_screen.dart';
import 'package:reliefnexus_mobile/features/vulnerability_impact/presentation/screens/vulnerability_impact_details_screen.dart';
import 'package:reliefnexus_mobile/features/resource_optimization/presentation/screens/resource_optimization_screen.dart';
import 'package:reliefnexus_mobile/features/resource_optimization/presentation/screens/agent03_workflow_screen.dart';
import 'package:reliefnexus_mobile/features/emergency_alerts/presentation/screens/emergency_alerts_screen.dart';
import 'package:reliefnexus_mobile/features/emergency_alerts/presentation/screens/emergency_workflow_screen.dart';

Future<void> waitForSeconds(
  WidgetTester tester,
  int seconds,
) async {
  for (var i = 0; i < seconds * 4; i++) {
    await tester.pump(const Duration(milliseconds: 250));
  }
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets(
    'MOBILE-E2E-001..006 - complete mobile AI operational workflow',
    (WidgetTester tester) async {
      const email = String.fromEnvironment('E2E_MOBILE_EMAIL');
      const password = String.fromEnvironment('E2E_MOBILE_PASSWORD');

      if (email.isEmpty || password.isEmpty) {
        fail(
          'Pass E2E_MOBILE_EMAIL and E2E_MOBILE_PASSWORD using --dart-define.',
        );
      }

      // ------------------------------------------------------------
      // APPLICATION LAUNCH
      // ------------------------------------------------------------

      app.main();

      await waitForSeconds(tester, 5);

      expect(
        find.byType(MaterialApp),
        findsOneWidget,
      );

      print(
        'MOBILE-E2E-001 PASS - App launched successfully',
      );

      // ------------------------------------------------------------
      // OPTIONAL FIRST-RUN ONBOARDING
      // ------------------------------------------------------------

      if (find.text('Skip').evaluate().isNotEmpty) {
        await tester.tap(
          find.text('Skip').first,
        );

        await waitForSeconds(tester, 2);
      }

      // ------------------------------------------------------------
      // MOBILE-E2E-002
      // LOGIN -> DASHBOARD
      // ------------------------------------------------------------

      final loginFields = find.byType(TextFormField);

      expect(
        loginFields,
        findsNWidgets(2),
        reason:
            'Login screen should contain email and password TextFormFields',
      );

      await tester.enterText(
        loginFields.at(0),
        email,
      );

      await tester.enterText(
        loginFields.at(1),
        password,
      );

      expect(
        find.text('Sign In'),
        findsWidgets,
      );

      await tester.tap(
        find.text('Sign In').first,
      );

      await waitForSeconds(tester, 8);

      expect(
        find.byType(RoleDashboard),
        findsOneWidget,
      );

      print(
        'MOBILE-E2E-002 PASS - Login reached role dashboard',
      );

      // ------------------------------------------------------------
      // MOBILE-E2E-003
      // RISK PREDICTION
      // ------------------------------------------------------------

      final dashboardContext = tester.element(
        find.byType(RoleDashboard),
      );

      Navigator.of(dashboardContext).push(
        MaterialPageRoute(
          builder: (_) => const RiskPredictionsPage(),
        ),
      );

      await waitForSeconds(tester, 5);

      expect(
        find.text('Risk Predictions'),
        findsOneWidget,
      );

      print(
        'MOBILE-E2E-003 PASS - Risk Prediction page opened',
      );

      // ------------------------------------------------------------
      // MOBILE-E2E-004
      // VULNERABILITY & IMPACT
      // ------------------------------------------------------------

      final vulnerabilityContext = tester.element(
        find.byType(RiskPredictionsPage),
      );

      Navigator.of(vulnerabilityContext).push(
        MaterialPageRoute(
          builder: (_) => const VulnerabilityImpactPage(),
        ),
      );

      await waitForSeconds(tester, 5);

      expect(
        find.text('Vulnerability & Impact'),
        findsOneWidget,
      );

      print(
        'MOBILE-E2E-004 PASS - Vulnerability & Impact page opened',
      );

      // ------------------------------------------------------------
      // MOBILE-E2E-005
      // RESOURCE OPTIMIZATION / AGENT 03
      // ------------------------------------------------------------

      final resourceContext = tester.element(
        find.byType(VulnerabilityImpactPage),
      );

      Navigator.of(resourceContext).push(
        MaterialPageRoute(
          builder: (_) => const ResourceOptimizationPage(),
        ),
      );

      await waitForSeconds(tester, 5);

      expect(
        find.text('Resource Optimization'),
        findsOneWidget,
      );

      print(
        'MOBILE-E2E-005 PASS - Resource Optimization page opened',
      );

      // ------------------------------------------------------------
      // AGENT 03 WORKFLOW
      // ------------------------------------------------------------

      if (find.text('Run Agent 03 Assessment').evaluate().isNotEmpty) {
        await tester.tap(
          find.text('Run Agent 03 Assessment').first,
        );

        await waitForSeconds(tester, 4);
      }

      if (find.byType(Agent03WorkflowPage).evaluate().isNotEmpty) {
        expect(
          find.byType(Agent03WorkflowPage),
          findsOneWidget,
        );

        if (find.text('Confirm & Run Agent 03').evaluate().isNotEmpty) {
          await tester.tap(
            find.text('Confirm & Run Agent 03').first,
          );

          await waitForSeconds(tester, 10);
        }

        print(
          'MOBILE-E2E-005A PASS - Agent 03 workflow reached',
        );
      }

      // ------------------------------------------------------------
      // MOBILE-E2E-006
      // EARLY WARNING
      // ------------------------------------------------------------

      final emergencyContext = tester.element(
        find.byType(ResourceOptimizationPage),
      );

      Navigator.of(emergencyContext).push(
        MaterialPageRoute(
          builder: (_) => const EmergencyAlertsPage(),
        ),
      );

      await waitForSeconds(tester, 5);

      expect(
        find.text('Emergency Warning & Coordination'),
        findsOneWidget,
      );

      print(
        'MOBILE-E2E-006 PASS - Early Warning page opened',
      );

      // ------------------------------------------------------------
      // AGENT 04 HUMAN-APPROVAL WORKFLOW
      // ------------------------------------------------------------

      if (find.text('VIEW ASSESSMENT & RUN').evaluate().isNotEmpty) {
        await tester.tap(
          find.text('VIEW ASSESSMENT & RUN').first,
        );

        await waitForSeconds(tester, 5);
      }

      if (find.byType(EmergencyWorkflowPage).evaluate().isNotEmpty) {
        expect(
          find.byType(EmergencyWorkflowPage),
          findsOneWidget,
        );

        final continuationButtons = <String>[
          'CONTINUE TO WARNING ANALYSIS',
          'CONTINUE TO COORDINATION',
          'CONTINUE TO REVIEW',
        ];

        for (final label in continuationButtons) {
          if (find.text(label).evaluate().isNotEmpty) {
            await tester.tap(
              find.text(label).first,
            );

            await waitForSeconds(tester, 3);
          }
        }

        // This is the explicit human action.
        // No approval gate is bypassed.
        if (find.text('RUN AGENT 04 GENERATE WARNING').evaluate().isNotEmpty) {
          await tester.tap(
            find.text('RUN AGENT 04 GENERATE WARNING').first,
          );

          await waitForSeconds(tester, 12);
        }

        print(
          'MOBILE-E2E-006A PASS - Agent 04 approval workflow reached',
        );
      }

      // ------------------------------------------------------------
      // FINAL RESULT
      // ------------------------------------------------------------

      print(
        'MOBILE-E2E-FINAL - Mobile E2E workflow execution completed',
      );
    },
    timeout: const Timeout(
      Duration(minutes: 10),
    ),
  );
}
