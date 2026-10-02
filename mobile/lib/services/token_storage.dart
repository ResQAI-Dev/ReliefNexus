import 'package:shared_preferences/shared_preferences.dart';

/// Manages JWT access and refresh token lifecycle via SharedPreferences.
///
/// Tokens are stored locally and survive app restarts.
/// On logout, both tokens are removed from storage.
class TokenStorage {
  TokenStorage._();
  static const _accessKey = 'rn_access_token';
  static const _refreshKey = 'rn_refresh_token';
  static const _roleKey = 'rn_user_role';
  static const _userIdKey = 'rn_user_id';

  // ── Write ────────────────────────────────────────────────────────────────────

  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessKey, accessToken);
    await prefs.setString(_refreshKey, refreshToken);
  }

  static Future<void> saveUserMeta({
    required String role,
    required String userId,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_roleKey, role);
    await prefs.setString(_userIdKey, userId);
  }

  // ── Read ─────────────────────────────────────────────────────────────────────

  static Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_accessKey);
  }

  static Future<String?> getRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_refreshKey);
  }

  static Future<String?> getRole() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_roleKey);
  }

  static Future<String?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userIdKey);
  }

  static Future<bool> hasAccessToken() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }

  // ── Clear ────────────────────────────────────────────────────────────────────

  static Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessKey);
    await prefs.remove(_refreshKey);
    await prefs.remove(_roleKey);
    await prefs.remove(_userIdKey);
  }
}
