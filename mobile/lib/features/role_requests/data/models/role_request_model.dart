class RoleRequestModel {
  final String id;
  final String fullName;
  final String email;
  final String role;
  final bool isActive;
  final DateTime? createdAt;
  final List<String> permissions;
  final String? phoneNumber;
  final String? district;
  final String? address;

  const RoleRequestModel({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    required this.isActive,
    required this.createdAt,
    required this.permissions,
    this.phoneNumber,
    this.district,
    this.address,
  });

  factory RoleRequestModel.fromJson(Map<String, dynamic> json) {
    return RoleRequestModel(
      id: '${json['id'] ?? ''}',
      fullName: '${json['fullName'] ?? 'Unknown user'}',
      email: '${json['email'] ?? ''}',
      role: '${json['role'] ?? 'Requested role'}',
      isActive: json['isActive'] == true,
      createdAt: DateTime.tryParse('${json['createdAt'] ?? ''}'),
      permissions: (json['permissions'] is List)
          ? (json['permissions'] as List).map((e) => '$e').toList()
          : const [],
      phoneNumber: json['phoneNumber']?.toString(),
      district: json['district']?.toString(),
      address: json['address']?.toString(),
    );
  }
}
