import 'package:flutter/material.dart';

enum RiskLevel { safe, warning, danger }

extension RiskLevelExtension on RiskLevel {
  String get label {
    switch (this) {
      case RiskLevel.safe:
        return 'Safe';
      case RiskLevel.warning:
        return 'Warning';
      case RiskLevel.danger:
        return 'Danger';
    }
  }

  Color get color {
    switch (this) {
      case RiskLevel.safe:
        return const Color(0xFF16A34A); // Vibrant green
      case RiskLevel.warning:
        return const Color(0xFFD97706); // Amber/Orange
      case RiskLevel.danger:
        return const Color(0xFFDC2626); // Bright Red
    }
  }

  Color get backgroundColor {
    switch (this) {
      case RiskLevel.safe:
        return const Color(0xFFF0FDF4);
      case RiskLevel.warning:
        return const Color(0xFFFFFBEB);
      case RiskLevel.danger:
        return const Color(0xFFFEF2F2);
    }
  }

  IconData get icon {
    switch (this) {
      case RiskLevel.safe:
        return Icons.check_circle_outline;
      case RiskLevel.warning:
        return Icons.warning_amber_rounded;
      case RiskLevel.danger:
        return Icons.gpp_bad_outlined;
    }
  }
}

class RiskAlert {
  final String id;
  final String title;
  final String description;
  final RiskLevel level;
  final String location;
  final DateTime timestamp;
  final String actionRequired;

  const RiskAlert({
    required this.id,
    required this.title,
    required this.description,
    required this.level,
    required this.location,
    required this.timestamp,
    required this.actionRequired,
  });
}
