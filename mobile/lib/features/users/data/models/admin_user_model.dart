class AdminUserModel {
  final String id;
  final String fullName;
  final String email;
  final String role;
  final bool isActive;
  final List<String> permissions;
  final DateTime? createdAt;
  final String? phoneNumber;
  final DateTime? dateOfBirth;
  final String? gender;
  final String? address;
  final String? district;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final String? profileImageUrl;

  const AdminUserModel({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    required this.isActive,
    this.permissions = const [],
    this.createdAt,
    this.phoneNumber,
    this.dateOfBirth,
    this.gender,
    this.address,
    this.district,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.profileImageUrl,
  });

  factory AdminUserModel.fromJson(Map<String, dynamic> json) {
    return AdminUserModel(
      id: json['id']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? 'User',
      isActive: json['isActive'] == true,
      permissions: json['permissions'] is List
          ? List<String>.from(
              (json['permissions'] as List).map((e) => e.toString()),
            )
          : const [],
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.tryParse(json['createdAt'].toString()),
      phoneNumber: json['phoneNumber']?.toString(),
      dateOfBirth: json['dateOfBirth'] == null
          ? null
          : DateTime.tryParse(json['dateOfBirth'].toString()),
      gender: json['gender']?.toString(),
      address: json['address']?.toString(),
      district: json['district']?.toString(),
      emergencyContactName: json['emergencyContactName']?.toString(),
      emergencyContactPhone: json['emergencyContactPhone']?.toString(),
      profileImageUrl: json['profileImageUrl']?.toString(),
    );
  }
}
