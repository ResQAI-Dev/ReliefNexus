import '../models/risk_alert.dart';

class AlertService {
  // Singleton pattern for application-wide service instance
  static final AlertService _instance = AlertService._internal();
  factory AlertService() => _instance;
  AlertService._internal();

  RiskLevel currentZoneRiskLevel = RiskLevel.warning;

  final List<RiskAlert> _alerts = [
    RiskAlert(
      id: 'ALT-101',
      title: 'Flash Flood Warning - Sector 4',
      description: 'Rapidly rising water levels near Sector 4 Riverbed. Low-lying areas must evacuate immediately.',
      level: RiskLevel.danger,
      location: 'Sector 4, Riverbed Basin',
      timestamp: DateTime.now().subtract(const Duration(minutes: 25)),
      actionRequired: 'Evacuate to Shelter B (Highland School)',
    ),
    RiskAlert(
      id: 'ALT-102',
      title: 'Power Substation Distruption',
      description: 'Main grid outage reported. Emergency generator active at Primary Care Center.',
      level: RiskLevel.warning,
      location: 'Central District',
      timestamp: DateTime.now().subtract(const Duration(hours: 2)),
      actionRequired: 'Use backup communication channels',
    ),
    RiskAlert(
      id: 'ALT-103',
      title: 'Road Blockage Cleared - HWY 12',
      description: 'Debris cleared by volunteer clearing unit. Emergency transport route re-opened.',
      level: RiskLevel.safe,
      location: 'Highway 12 Junction',
      timestamp: DateTime.now().subtract(const Duration(hours: 4)),
      actionRequired: 'Proceed with caution',
    ),
    RiskAlert(
      id: 'ALT-104',
      title: 'Heavy Rainfall Advisory',
      description: 'Precipitation expected to exceed 80mm over the next 6 hours. High risk of landslides in hilly zones.',
      level: RiskLevel.warning,
      location: 'Northern Hills Region',
      timestamp: DateTime.now().subtract(const Duration(hours: 5)),
      actionRequired: 'Avoid non-essential travel',
    ),
  ];

  List<RiskAlert> getAllAlerts() => List.unmodifiable(_alerts);

  List<RiskAlert> getAlertsByLevel(RiskLevel? filterLevel) {
    if (filterLevel == null) return getAllAlerts();
    return _alerts.where((a) => a.level == filterLevel).toList();
  }

  void addAlert(RiskAlert alert) {
    _alerts.insert(0, alert);
  }
}
