import 'package:dio/dio.dart';

import '../../../../core/network/api_client.dart';

class RoleRequestRemoteDataSource {
  final ApiClient apiClient;
  RoleRequestRemoteDataSource(this.apiClient);

  Future<List<Map<String, dynamic>>> getPending() async {
    final response = await apiClient.dio.get('/Users/pending-role-requests');
    final data = response.data;
    if (data is List) {
      return data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    return const [];
  }

  Future<void> approve(String id) async {
    await apiClient.dio.put('/Users/$id/approve-role');
  }

  Future<void> reject(String id) async {
    await apiClient.dio.put('/Users/$id/reject-role');
  }
}
