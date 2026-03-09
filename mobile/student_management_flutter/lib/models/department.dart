class Department {
  final String id;
  final String name;
  final String code;
  final String? description;

  Department({
    required this.id,
    required this.name,
    required this.code,
    this.description,
  });

  factory Department.fromJson(Map<String, dynamic> json) {
    return Department(
      id: json['id'] as String,
      name: json['name'] as String,
      code: json['code'] as String,
      description: json['description'] as String?,
    );
  }
}

