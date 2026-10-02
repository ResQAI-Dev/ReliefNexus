import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform, TargetPlatform;

/// Centralised API configuration for the ReliefNexus ASP.NET Core backend.
///
/// URL selection strategy:
///  - Chrome Web (kIsWeb)       → localhost:5003  (same machine, no proxy needed)
///  - Android Emulator          → 10.0.2.2:5003   (AVD loopback alias for host machine)
///  - iOS Simulator             → localhost:5003   (shares host network)
///  - Physical device (dev)     → Set [physicalDeviceIp] to your machine's LAN IP
///
/// To run the backend: `dotnet run` from the ReliefNexus.API folder.
/// Default Kestrel HTTP port: 5003  (check launchSettings.json or update below).
class ApiConfig {
  ApiConfig._(); // Prevent instantiation.

  // ── Ports ────────────────────────────────────────────────────────────────────

  /// HTTP port exposed by the ASP.NET Core Kestrel server (local dev).
  static const int _localPort = 5003;

  /// Set this to your machine's LAN IP when testing on a physical device.
  /// Example: '192.168.1.42'
  static const String _physicalDeviceIp = '192.168.1.100';

  // ── Base URL resolver ────────────────────────────────────────────────────────

  /// Returns the correct base URL for the current runtime target.
  static String get baseUrl {
    if (kIsWeb) {
      // Flutter Web (Chrome): The backend runs on the same machine.
      return 'http://localhost:$_localPort';
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        // Android emulator maps 10.0.2.2 → host machine localhost.
        return 'http://10.0.2.2:$_localPort';

      case TargetPlatform.iOS:
        // iOS simulator shares host network, localhost works directly.
        return 'http://localhost:$_localPort';

      default:
        // Physical device or desktop – use LAN IP.
        return 'http://$_physicalDeviceIp:$_localPort';
    }
  }

  // ── API endpoint paths ───────────────────────────────────────────────────────

  // Auth
  static String get authLogin => '$baseUrl/api/auth/login';
  static String get authRegister => '$baseUrl/api/auth/register';
  static String get authRefresh => '$baseUrl/api/auth/refresh';

  // Risk Predictions
  static String get riskPredictions => '$baseUrl/api/risk-predictions';
  static String get riskPredictionsHighRisk => '$baseUrl/api/risk-predictions/high-risk';
  static String get riskPredictionsPendingApproval => '$baseUrl/api/risk-predictions/pending-approval';
  static String get riskPredictionsHistory => '$baseUrl/api/risk-predictions/history';
  static String get riskPredictionsExternalEvents => '$baseUrl/api/risk-predictions/external-events';
  static String riskPredictionById(String id) => '$baseUrl/api/risk-predictions/$id';
  static String riskPredictionByLocation(String location) =>
      '$baseUrl/api/risk-predictions/location/$location';
  static String riskPredictionApprove(String id) => '$baseUrl/api/risk-predictions/$id/approve';
  static String riskPredictionReject(String id) => '$baseUrl/api/risk-predictions/$id/reject';
  static String riskPredictionExplain(String id) => '$baseUrl/api/risk-predictions/$id/explain';

  // Vulnerability & Impact Assessment
  static String get vulnerabilitySnapshots => '$baseUrl/api/vulnerability/snapshots';
  static String vulnerabilitySnapshotByArea(String areaId) =>
      '$baseUrl/api/vulnerability/snapshots/$areaId';
  static String get vulnerabilityInfrastructure => '$baseUrl/api/vulnerability/infrastructure';
  static String vulnerabilityInfrastructureByArea(String areaId) =>
      '$baseUrl/api/vulnerability/infrastructure/$areaId';
  static String get vulnerabilityCalculateImpact => '$baseUrl/api/vulnerability/calculate-impact';
  static String vulnerabilityImpactAssessments(String disasterEventId) =>
      '$baseUrl/api/vulnerability/impact-assessments/$disasterEventId';

  // ── Request timeouts ─────────────────────────────────────────────────────────

  /// Standard timeout for most API requests.
  static const Duration defaultTimeout = Duration(seconds: 30);

  /// Longer timeout for AI-backed prediction generation requests.
  static const Duration predictionTimeout = Duration(seconds: 90);
}
