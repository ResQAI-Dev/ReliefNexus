import '../datasources/emergency_alert_remote_datasource.dart';

class EmergencyAlertRepository {

  Future<List<dynamic>> getUserEmergencyAlerts() {
    return _source.getUserEmergencyAlerts();
  }

  final EmergencyAlertRemoteDataSource _source;

  EmergencyAlertRepository({
    EmergencyAlertRemoteDataSource? source,
  }) : _source = source ?? EmergencyAlertRemoteDataSource();

  Future<List<dynamic>> getRecentAssessments() {
    return _source.getRecentAssessments();
  }

  Future<Map<String, dynamic>> getAssessment(String id) {
    return _source.getAssessment(id);
  }

  Future<Map<String, dynamic>> getDemand(String id) {
    return _source.getDemand(id);
  }

  Future<List<dynamic>> getAllocations(String id) {
    return _source.getAllocations(id);
  }

  Future<EmergencyAlertResponse> runEmergencyAssessment(
    String id,
  ) {
    return _source.runEmergencyAssessment(id);
  }
}


