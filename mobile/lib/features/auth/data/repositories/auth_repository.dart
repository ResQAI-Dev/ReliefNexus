import '../../../../core/network/api_client.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../../../../models/user_model.dart';
import '../datasources/auth_remote_datasource.dart';

class AuthRepository {
  final AuthRemoteDataSource _remote;

  AuthRepository() : _remote = AuthRemoteDataSource(ApiClient());

  Future<UserModel> login({
    required String email,
    required String password,
  }) async {
    try {
      final data = await _remote.login(email: email.trim(), password: password);

      final userData = data['user'];

      if (userData is! Map) {
        throw Exception('Invalid user response.');
      }

      final user = UserModel.fromJson(Map<String, dynamic>.from(userData));

      final token = data['accessToken']?.toString() ?? '';
      final role = data['role']?.toString() ?? user.role;

      if (token.isEmpty) {
        throw Exception('No access token received.');
      }

      await SecureStorageService.saveSession(
        token: token,
        role: role,
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
      );

      return user;
    } catch (e) {
      throw Exception(_remote.errorMessage(e));
    }
  }

  Future<String> register({
    required String fullName,
    required String email,
    required String password,
    required String role,
  }) async {
    try {
      await _remote.register(
        fullName: fullName,
        email: email,
        password: password,
        role: role,
      );

      return 'Registration submitted successfully. '
          'Your role request is pending administrator approval.';
    } catch (e) {
      throw Exception(_remote.errorMessage(e));
    }
  }

  Future<void> logout() async {
    await SecureStorageService.clear();
  }
}
