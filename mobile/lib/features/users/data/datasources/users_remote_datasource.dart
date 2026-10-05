import 'package:dio/dio.dart';

import '../../../../core/network/api_client.dart';
import '../models/admin_user_model.dart';

class UsersRemoteDataSource {
  final ApiClient _client;

  UsersRemoteDataSource(this._client);

  Future<List<AdminUserModel>> getUsers() async {
    final response = await _client.dio.get('/Users');

    final data = response.data;

    if (data is! List) {
      throw Exception('Invalid users response.');
    }

    return data
        .map(
          (item) =>
              AdminUserModel.fromJson(Map<String, dynamic>.from(item as Map)),
        )
        .toList();
  }

  Future<AdminUserModel> getUserById(String id) async {
    final response = await _client.dio.get('/Users/$id');

    return AdminUserModel.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<void> deleteUser(String id) async {
    await _client.dio.delete('/Users/$id');
  }

  String errorMessage(Object error) {
    if (error is DioException) {
      final data = error.response?.data;

      if (data is Map && data['message'] != null) {
        return data['message'].toString();
      }

      if (error.response?.statusCode == 401 ||
          error.response?.statusCode == 403) {
        return 'You are not authorized to manage users.';
      }

      if (error.response?.statusCode == 404) {
        return 'User not found.';
      }

      if (error.type == DioExceptionType.connectionError) {
        return 'Cannot connect to ReliefNexus server.';
      }

      return 'Request failed. Please try again.';
    }

    return 'Something went wrong. Please try again.';
  }
}
