import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/api_response.dart';
import '../models/department.dart';

class DepartmentApi {
  /// 与 Web 端 departmentService 相同的 /api/departments 接口
  static Future<List<Department>> getDepartments(String accessToken) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/departments');

    final response = await http.get(
      uri,
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final Map<String, dynamic> body =
          jsonDecode(response.body) as Map<String, dynamic>;

      final apiResponse = ApiResponse<List<Department>>.fromJson(
        body,
        (json) {
          final list = json as List<dynamic>? ?? [];
          return list
              .map((e) => Department.fromJson(e as Map<String, dynamic>))
              .toList();
        },
      );

      if (!apiResponse.success) {
        throw Exception(apiResponse.message.isNotEmpty
            ? apiResponse.message
            : 'Không thể tải danh sách khoa');
      }

      return apiResponse.data;
    } else {
      throw Exception('Không thể tải danh sách khoa');
    }
  }
}

