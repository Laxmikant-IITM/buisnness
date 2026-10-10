import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Small session-storage boundary required by the video players.
///
/// The secure store is authoritative. Shared preferences are read only as a
/// fallback for devices where secure storage is temporarily unavailable.
class TokenStorage {
  const TokenStorage();

  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const String _tokenKey = 'lms_auth_token';
  static const String _userIdKey = 'lms_auth_user_id';

  Future<String?> read() async {
    try {
      final value = await _secureStorage.read(key: _tokenKey);
      if (value != null && value.isNotEmpty) return value;
    } catch (_) {
      // Fall through so a transient platform-channel error does not crash UI.
    }
    try {
      return (await SharedPreferences.getInstance()).getString(_tokenKey);
    } catch (_) {
      return null;
    }
  }

  Future<String?> userId() async {
    try {
      final value = await _secureStorage.read(key: _userIdKey);
      if (value != null && value.isNotEmpty) return value;
    } catch (_) {
      // Fall through to the compatibility store.
    }
    try {
      return (await SharedPreferences.getInstance()).getString(_userIdKey);
    } catch (_) {
      return null;
    }
  }

  /// Called by the future authentication flow after the server issues a token.
  Future<void> save({required String token, required String userId}) async {
    await Future.wait([
      _secureStorage.write(key: _tokenKey, value: token),
      _secureStorage.write(key: _userIdKey, value: userId),
    ]);
  }

  Future<void> clear() async {
    await Future.wait([
      _secureStorage.delete(key: _tokenKey),
      _secureStorage.delete(key: _userIdKey),
    ]);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userIdKey);
  }
}
