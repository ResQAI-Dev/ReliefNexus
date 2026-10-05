class UserModel {
  final String id;
  final String fullName;
  final String email;
  final String role;
  final bool isActive;
  final List<String> permissions;

  const UserModel({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    required this.isActive,
    this.permissions = const [],
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? '',
      isActive: json['isActive'] == true,
      permissions: json['permissions'] is List
          ? List<String>.from(
              (json['permissions'] as List).map((e) => e.toString()),
            )
          : const [],
    );
  }
}
