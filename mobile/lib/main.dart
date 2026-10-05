import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'theme/app_theme.dart';
import 'views/dashboard_screen.dart';
import 'features/auth/providers/auth_provider.dart';

/// Main entry point for the ReliefNexus Flutter application.
void main() {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: const ReliefNexusApp(),
    ),
  );
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
}