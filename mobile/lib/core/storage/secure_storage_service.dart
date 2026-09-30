import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  static const String tokenKey = 'reliefnexus_access_token';
  static const String roleKey = 'reliefnexus_role';
  static const String userIdKey = 'reliefnexus_user_id';
  static const String userNameKey = 'reliefnexus_user_name';
  static const String userEmailKey = 'reliefnexus_user_email';

  static Future<void> saveSession({
    required String token,
    required String role,
    required String userId,
    required String userName,
    required String userEmail,
  }) async {
    await _storage.write(key: tokenKey, value: token);
    await _storage.write(key: roleKey, value: role);
    await _storage.write(key: userIdKey, value: userId);
    await _storage.write(key: userNameKey, value: userName);
    await _storage.write(key: userEmailKey, value: userEmail);
  }

  static Future<String?> getToken() => _storage.read(key: tokenKey);

  static Future<String?> getRole() => _storage.read(key: roleKey);

  static Future<String?> getUserId() => _storage.read(key: userIdKey);

  static Future<String?> getUserName() => _storage.read(key: userNameKey);

  static Future<String?> getUserEmail() => _storage.read(key: userEmailKey);

  static Future<void> clear() => _storage.deleteAll();
}
