import 'package:flutter/foundation.dart';

import '../api/auth_api.dart';
import '../models/jwt_response.dart';
import '../services/secure_storage_service.dart';

class AuthProvider extends ChangeNotifier {
  String? _accessToken;
  bool _loading = false;
  String? _error;

  String? get accessToken => _accessToken;
  bool get isAuthenticated => _accessToken != null;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> init() async {
    _accessToken = await SecureStorageService.getAccessToken();
    notifyListeners();
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    try {
      _loading = true;
      _error = null;
      notifyListeners();

      final JwtResponse res =
          await AuthApi.login(email: email, password: password);

      _accessToken = res.accessToken;
      await SecureStorageService.saveAccessToken(res.accessToken);

      notifyListeners();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _accessToken = null;
    await SecureStorageService.clearAccessToken();
    notifyListeners();
  }
}

