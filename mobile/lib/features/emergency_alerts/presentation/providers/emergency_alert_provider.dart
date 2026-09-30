import 'package:flutter/foundation.dart';

import '../../data/models/emergency_alert_model.dart';
import '../../data/repositories/emergency_alert_repository.dart';

class EmergencyAlertProvider extends ChangeNotifier {
  final EmergencyAlertRepository repository;

  EmergencyAlertProvider({EmergencyAlertRepository? repository})
    : repository = repository ?? EmergencyAlertRepository();

  bool loading = false;
  bool running = false;

  String? error;

  List<dynamic> recentAssessments = [];

  List<EmergencyAlertModel> userAlerts = [];

  Map<String, dynamic>? selectedAssessment;
  Map<String, dynamic>? demand;
  List<dynamic> allocations = [];

  Map<String, dynamic>? result;

  Future<void> loadUserAlerts() async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      final data = await repository.getUserEmergencyAlerts();

      userAlerts = data
          .whereType<Map>()
          .map(
            (item) =>
                EmergencyAlertModel.fromJson(Map<String, dynamic>.from(item)),
          )
          .toList();
    } catch (e) {
      error = e.toString();
    }

    loading = false;
    notifyListeners();
  }

  Future<void> loadRecentAssessments() async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      recentAssessments = await repository.getRecentAssessments();
    } catch (e) {
      error = e.toString();
    }

    loading = false;
    notifyListeners();
  }

  Future<void> loadAssessment(String id) async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      selectedAssessment = await repository.getAssessment(id);

      demand = await repository.getDemand(id);

      allocations = await repository.getAllocations(id);
    } catch (e) {
      error = e.toString();
    }

    loading = false;
    notifyListeners();
  }

  Future<void> runEmergency(String id) async {
    running = true;
    error = null;
    notifyListeners();

    try {
      final response = await repository.runEmergencyAssessment(id);

      result = response.data;
    } catch (e) {
      error = e.toString();
    }

    running = false;
    notifyListeners();
  }
}
