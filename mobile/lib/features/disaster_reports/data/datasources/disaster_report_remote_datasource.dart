import 'package:dio/dio.dart';

import '../../../../core/network/api_client.dart';

class DisasterReportRemoteDataSource {
  final ApiClient apiClient;

  DisasterReportRemoteDataSource(this.apiClient);

  Future<List<Map<String, dynamic>>> _list(String path) async {
    final response = await apiClient.dio.get(path);
    final data = response.data;

    if (data is List) {
      return data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }

    return const [];
  }

  Future<List<Map<String, dynamic>>> getAll() => _list('/disaster-reports');

  Future<List<Map<String, dynamic>>> getMy() => _list('/disaster-reports/my');

  Future<List<Map<String, dynamic>>> getAssignedToMe() =>
      _list('/disaster-reports/assigned-to-me');

  Future<Map<String, dynamic>> create(Map<String, dynamic> body) async {
    final response = await apiClient.dio.post('/disaster-reports', data: body);

    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<void> review(String id) async {
    await apiClient.dio.patch('/disaster-reports/$id/review');
  }

  Future<void> verify(String id) async {
    await apiClient.dio.patch('/disaster-reports/$id/verify');
  }

  Future<void> assign(String id, String volunteerUserId) async {
    await apiClient.dio.patch(
      '/disaster-reports/$id/assign',
      data: {'volunteerUserId': volunteerUserId},
    );
  }

  Future<void> resolve(String id) async {
    await apiClient.dio.patch('/disaster-reports/$id/resolve');
  }

  Future<void> reject(String id) async {
    await apiClient.dio.patch('/disaster-reports/$id/reject');
  }

  Future<void> fieldStart(String id) async {
    await apiClient.dio.patch('/disaster-reports/$id/field-start');
  }

  Future<void> fieldUpdate(
    String id, {
    required String notes,
    String? situation,
    double? latitude,
    double? longitude,
  }) async {
    await apiClient.dio.patch(
      '/disaster-reports/$id/field-update',
      data: {
        'notes': notes,
        'situation': situation,
        'latitude': latitude,
        'longitude': longitude,
      },
    );
  }

  Future<void> fieldComplete(String id) async {
    await apiClient.dio.patch('/disaster-reports/$id/field-complete');
  }

  Future<void> updateStatus(String id, String status) async {
    await apiClient.dio.put(
      '/disaster-reports/$id/status',
      data: {'status': status},
    );
  }

  Future<List<Map<String, dynamic>>> getUsers() => _list('/Users');
}
