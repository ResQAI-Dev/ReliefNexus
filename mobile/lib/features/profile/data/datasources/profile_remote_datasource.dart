import '../../../../core/network/api_client.dart';

class ProfileRemoteDataSource {
  final ApiClient apiClient;

  ProfileRemoteDataSource(this.apiClient);

  Future<Map<String, dynamic>> getMyProfile() async {
    final response = await apiClient.dio.get('/Users/me');

    return Map<String, dynamic>.from(
      response.data as Map,
    );
  }

  Future<Map<String, dynamic>> updateMyProfile({
    required String fullName,
    required String email,
  }) async {
    final response = await apiClient.dio.put(
      '/Users/me',
      data: {
        'fullName': fullName,
        'email': email,
      },
    );

    return Map<String, dynamic>.from(
      response.data as Map,
    );
  }
}
