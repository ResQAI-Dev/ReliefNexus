class UserProfileModel {
  final String id;
  final String fullName;
  final String email;
  final String role;
  final bool isActive;
  final String? phoneNumber;
  final DateTime? dateOfBirth;
  final String? gender;
  final String? address;
  final String? district;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final String? profileImageUrl;

  const UserProfileModel({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    required this.isActive,
    this.phoneNumber,
    this.dateOfBirth,
    this.gender,
    this.address,
    this.district,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.profileImageUrl,
  });

  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    return UserProfileModel(
      id: '${json['id'] ?? ''}',
      fullName: '${json['fullName'] ?? ''}',
      email: '${json['email'] ?? ''}',
      role: '${json['role'] ?? ''}',
      isActive: json['isActive'] == true,
      phoneNumber: json['phoneNumber']?.toString(),
      dateOfBirth: DateTime.tryParse('${json['dateOfBirth'] ?? ''}'),
      gender: json['gender']?.toString(),
      address: json['address']?.toString(),
      district: json['district']?.toString(),
      emergencyContactName:
          json['emergencyContactName']?.toString(),
      emergencyContactPhone:
          json['emergencyContactPhone']?.toString(),
      profileImageUrl: json['profileImageUrl']?.toString(),
    );
  }
}
