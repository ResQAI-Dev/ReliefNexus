import 'package:flutter/material.dart';

import 'theme/app_theme.dart';
import '../features/onboarding/presentation/screens/splash_screen.dart';

class ReliefNexusApp extends StatelessWidget {
  const ReliefNexusApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ReliefNexus',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const SplashPage(),
    );
  }
}
