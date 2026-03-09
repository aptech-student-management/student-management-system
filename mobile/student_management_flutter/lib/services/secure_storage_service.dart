import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  static const _storage = FlutterSecureStorage();
  static const _keyAccessToken = 'access_token';

  static Future<void> saveAccessToken(String token) async {
    await _storage.write(key: _keyAccessToken, value: token);
  }

  static Future<String?> getAccessToken() async {
    return _storage.read(key: _keyAccessToken);
  }

  static Future<void> clearAccessToken() async {
    await _storage.delete(key: _keyAccessToken);
  }
}

