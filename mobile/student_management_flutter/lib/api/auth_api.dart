import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/api_response.dart';
import '../models/jwt_response.dart';

class AuthApi {
  /// 调用与 Web 相同的 /api/auth/login 接口
  static Future<JwtResponse> login({
    required String email,
    required String password,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/login');

    final response = await http.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final Map<String, dynamic> body =
          jsonDecode(response.body) as Map<String, dynamic>;

      final apiResponse = ApiResponse<JwtResponse>.fromJson(
        body,
        (json) => JwtResponse.fromJson(json as Map<String, dynamic>),
      );

      if (!apiResponse.success) {
        throw Exception(apiResponse.message.isNotEmpty
            ? apiResponse.message
            : 'Đăng nhập thất bại');
      }

      return apiResponse.data;
    } else {
      String message = 'Đăng nhập thất bại';
      try {
        final Map<String, dynamic> body =
            jsonDecode(response.body) as Map<String, dynamic>;
        if (body['message'] is String) {
          message = body['message'] as String;
        }
      } catch (_) {}
      throw Exception(message);
    }
  }
}
