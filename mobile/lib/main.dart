import 'package:flutter/material.dart';
<<<<<<< HEAD
import 'theme/app_theme.dart';
import 'views/dashboard_screen.dart';

/// Main entry point for the ReliefNexus Flutter application.
///
/// Bypasses authentication during local development & testing on the
/// feature/Vulnerability-&-Impact branch, launching directly into the
/// [DashboardScreen].
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ReliefNexusApp());
}

/// Root application widget.
class ReliefNexusApp extends StatelessWidget {
  const ReliefNexusApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ReliefNexus - Disaster Relief & Risk Management',
      debugShowCheckedModeBanner: false,
      // Enforces the clean Material 3 White / Light Theme.
      theme: AppTheme.lightTheme,
      home: const DashboardScreen(),
    );
  }
=======
import 'package:provider/provider.dart';

import 'app/app.dart';
import 'features/auth/providers/auth_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: const ReliefNexusApp(),
    ),
  );
>>>>>>> e607c09081109747a894baa16772e0eb4a19a0ef
}
