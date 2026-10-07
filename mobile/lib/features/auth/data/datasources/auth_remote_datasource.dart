import 'package:dio/dio.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';

class AuthRemoteDataSource {
  final ApiClient _client;

  AuthRemoteDataSource(this._client);

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await _client.dio.post(
      ApiEndpoints.login,
      data: {'email': email, 'password': password},
    );

    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> register({
    required String fullName,
    required String email,
    required String password,
    required String role,
  }) async {
    final response = await _client.dio.post(
      ApiEndpoints.register,
      data: {
        'fullName': fullName,
        'email': email,
        'password': password,
        'role': role,
      },
    );

    return Map<String, dynamic>.from(response.data as Map);
  }

  String errorMessage(Object error) {
    if (error is DioException) {
      final data = error.response?.data;

      if (data is Map && data['message'] != null) {
        return data['message'].toString();
      }

      if (error.response?.statusCode == 401) {
        return 'Invalid email or password.';
      }

      if (error.response?.statusCode == 409) {
        return 'This account already exists.';
      }

      if (error.response?.statusCode == 400) {
        return 'Please check your information.';
      }

      if (error.type == DioExceptionType.connectionError) {
        return 'Cannot connect to ReliefNexus server.';
      }

      return 'Request failed. Please try again.';
    }

    return 'Something went wrong. Please try again.';
  }
}
