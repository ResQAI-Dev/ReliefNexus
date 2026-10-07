import 'package:dio/dio.dart';
import 'package:reliefnexus_mobile/core/network/api_client.dart';

class EmergencyAlertRemoteDataSource {
  Future<List<dynamic>> getUserEmergencyAlerts() async {
    final response = await _client.dio.get('/emergency-alerts');

    final data = response.data;

    if (data is List) return data;

    if (data is Map<String, dynamic>) {
      return (data['items'] ??
              data['data'] ??
              data['alerts'] ??
              data['Alerts'] ??
              [])
          as List;
    }

    return [];
  }

  final ApiClient _client = ApiClient();

  Future<List<dynamic>> getRecentAssessments() async {
    final response = await _client.dio.get('/vulnerability-impact');

    final data = response.data;

    if (data is List) return data;

    if (data is Map<String, dynamic>) {
      return (data['items'] ??
              data['data'] ??
              data['assessments'] ??
              data['Assessments'] ??
              [])
          as List;
    }

    return [];
  }

  Future<Map<String, dynamic>> getAssessment(String id) async {
    final response =
        await _client.dio.get('/vulnerability-impact/$id');

    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> getDemand(String id) async {
    final response =
        await _client.dio.get('/resource-optimization/$id/demand');

    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<List<dynamic>> getAllocations(String id) async {
    final response =
        await _client.dio.get('/resource-optimization/$id');

    final data = response.data;

    if (data is List) return data;

    if (data is Map<String, dynamic>) {
      return (data['allocations'] ??
              data['Allocations'] ??
              data['items'] ??
              data['data'] ??
              [])
          as List;
    }

    return [];
  }

  Future<EmergencyAlertResponse> runEmergencyAssessment(
    String vulnerabilityAssessmentId,
  ) async {
    final response = await _client.dio.post(
      '/emergency-alerts/assessment/$vulnerabilityAssessmentId',
    );

    return EmergencyAlertResponse.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }
}

class EmergencyAlertResponse {
  final Map<String, dynamic> data;

  const EmergencyAlertResponse(this.data);

  factory EmergencyAlertResponse.fromJson(
    Map<String, dynamic> json,
  ) {
    return EmergencyAlertResponse(json);
  }
}
