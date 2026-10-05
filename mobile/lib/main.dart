import 'package:flutter_test/flutter_test.dart';
import 'package:reliefnexus_mobile/main.dart';

void main() {
  testWidgets('ReliefNexus initial app smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const ReliefNexusApp());

    // Verify that the title text is rendered.
    expect(find.text('ReliefNexus - Disaster Relief & Risk Management'), findsOneWidget);
  });
}