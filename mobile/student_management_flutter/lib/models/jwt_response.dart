class JwtResponse {
  final String accessToken;

  JwtResponse({
    required this.accessToken,
  });

  factory JwtResponse.fromJson(Map<String, dynamic> json) {
    return JwtResponse(
      accessToken: json['accessToken'] as String,
    );
  }
}


