import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Store Supabase refresh/access session material in Android encrypted storage.
class SecureSupabaseStorage extends LocalStorage {
  SecureSupabaseStorage()
      : _storage = const FlutterSecureStorage(
          aOptions: AndroidOptions(encryptedSharedPreferences: true),
        );

  final FlutterSecureStorage _storage;

  @override
  Future<void> initialize() async {}

  @override
  Future<String?> accessToken() =>
      _storage.read(key: supabasePersistSessionKey);

  @override
  Future<bool> hasAccessToken() async =>
      await _storage.containsKey(key: supabasePersistSessionKey);

  @override
  Future<void> persistSession(String persistSessionString) => _storage.write(
      key: supabasePersistSessionKey, value: persistSessionString);

  @override
  Future<void> removePersistedSession() =>
      _storage.delete(key: supabasePersistSessionKey);
}
