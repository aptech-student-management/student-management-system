class ApiConfig {
  /// 与 Web 前端一致的基础地址，只是在模拟器上需要用 10.0.2.2 访问本机。
  ///
  /// - 如果在 Android 模拟器上跑、后端在本机：使用 10.0.2.2
  /// - 如果在真机上跑：改成你电脑的局域网 IP，例如 http://192.168.1.100:8080/api
  static const String baseUrl = 'http://10.0.2.2:8080/api';
}

