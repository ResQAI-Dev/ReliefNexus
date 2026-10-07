import 'package:flutter/foundation.dart';
import '../../../../core/network/api_client.dart';

class DashboardProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  bool _loading = false;
  String? _error;
  int _users = 0;
  int _alerts = 0;
  int _reports = 0;
  int _requests = 0;
  int _resources = 0;
  String _riskLevel = 'No Data';
  double _riskScore = 0;

  bool get loading => _loading;
  String? get error => _error;
  int get users => _users;
  int get alerts => _alerts;
  int get reports => _reports;
  int get requests => _requests;
  int get resources => _resources;
  String get riskLevel => _riskLevel;
  double get riskScore => _riskScore;

  Future<void> loadDashboard() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _count('/Users'),
        _count('/Users/pending-role-requests'),
        _count('/disaster-reports'),
        _count('/emergency-alerts'),
      ]);

      _users = results[0];
      _requests = results[1];
      _reports = results[2];
      _alerts = results[3];
    } catch (e) {
      _error = e.toString();
      debugPrint('Dashboard API error: 11558');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<int> _count(String endpoint) async {
    try {
      final response = await _apiClient.dio.get(endpoint);
      final data = response.data;

      debugPrint('DASHBOARD API [] status= data=');

      if (data is List) return data.length;

      if (data is Map) {
        for (final key in ['totalCount', 'total', 'count']) {
          final value = data[key];
          if (value is int) return value;
          if (value is num) return value.toInt();
        }

        for (final key in ['items', 'data', 'results']) {
          final value = data[key];
          if (value is List) return value.length;
          if (value is Map) {
            for (final countKey in ['totalCount', 'total', 'count']) {
              final count = value[countKey];
              if (count is int) return count;
              if (count is num) return count.toInt();
            }
          }
        }
      }

      return 0;
    } catch (e) {
      debugPrint('DASHBOARD API ERROR []: 11558');
      return 0;
    }
  }

  void updateSummary({
    required int alerts,
    required int reports,
    required int requests,
    required int resources,
    required String riskLevel,
    required double riskScore,
  }) {
    _alerts = alerts;
    _reports = reports;
    _requests = requests;
    _resources = resources;
    _riskLevel = riskLevel;
    _riskScore = riskScore;
    notifyListeners();
  }
}
