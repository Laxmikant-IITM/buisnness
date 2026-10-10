import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Small session-storage boundary required by the video players.
///
/// LMS bearer tokens stay in Android encrypted storage and are never copied
/// into ordinary shared preferences.
class TokenStorage {
  const TokenStorage();

  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const String _tokenKey = 'lms_auth_token';
  static const String _userIdKey = 'lms_auth_user_id';

  Future<String?> read() async {
    try {
      return await _secureStorage.read(key: _tokenKey);
    } catch (_) {
      return null;
    }
  }

  Future<String?> userId() async {
    try {
      return await _secureStorage.read(key: _userIdKey);
    } catch (_) {
      return null;
    }
  }

  /// Called by the future authentication flow after the server issues a token.
  Future<void> save({required String token, required String userId}) async {
    await _secureStorage.write(key: _tokenKey, value: token);
    await _secureStorage.write(key: _userIdKey, value: userId);
  }

  Future<void> clear() async {
    await _secureStorage.delete(key: _tokenKey);
    await _secureStorage.delete(key: _userIdKey);
  }
}
