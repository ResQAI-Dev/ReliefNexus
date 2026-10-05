import 'package:flutter/material.dart';

class AppTheme {
  static const Color navy = Color(0xFF071A3D);
  static const Color navy2 = Color(0xFF0B1736);
  static const Color textDark = Color(0xFF0B1736);
  static const Color primary = Color(0xFF1769FF);
  static const Color blue = primary;
  static const Color primaryDark = Color(0xFF0E55E8);
  static const Color cyan = Color(0xFF19C7E8);
  static const Color background = Color(0xFFF6F8FC);
  static const Color surface = Colors.white;
  static const Color muted = Color(0xFF71809B);
  static const Color textMuted = Color(0xFF71809B);

  static ThemeData light = ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: background,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primary,
      primary: primary,
      secondary: cyan,
      brightness: Brightness.light,
    ),
    fontFamily: 'Roboto',
    splashFactory: InkRipple.splashFactory,
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
    ),
  );
}
