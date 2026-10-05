class ResourceModel {
  final String id;
  final String resourceType;
  final String resourceName;
  final int availableQuantity;
  final int allocatedQuantity;
  final String location;
  final String status;
  final DateTime? createdAt;

  const ResourceModel({
    required this.id,
    required this.resourceType,
    required this.resourceName,
    required this.availableQuantity,
    required this.allocatedQuantity,
    required this.location,
    required this.status,
    this.createdAt,
  });

  int get remainingQuantity =>
      (availableQuantity - allocatedQuantity).clamp(0, 999999999);

  factory ResourceModel.fromJson(Map<String, dynamic> json) {
    return ResourceModel(
      id: (json['id'] ?? '').toString(),
      resourceType: (json['resourceType'] ?? '').toString(),
      resourceName: (json['resourceName'] ?? '').toString(),
      availableQuantity: _toInt(json['availableQuantity']),
      allocatedQuantity: _toInt(json['allocatedQuantity']),
      location: (json['location'] ?? '').toString(),
      status: (json['status'] ?? 'Available').toString(),
      createdAt: _toDate(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'resourceType': resourceType,
      'resourceName': resourceName,
      'availableQuantity': availableQuantity,
      'allocatedQuantity': allocatedQuantity,
      'location': location,
      'status': status,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
    };
  }

  ResourceModel copyWith({
    String? id,
    String? resourceType,
    String? resourceName,
    int? availableQuantity,
    int? allocatedQuantity,
    String? location,
    String? status,
    DateTime? createdAt,
  }) {
    return ResourceModel(
      id: id ?? this.id,
      resourceType: resourceType ?? this.resourceType,
      resourceName: resourceName ?? this.resourceName,
      availableQuantity: availableQuantity ?? this.availableQuantity,
      allocatedQuantity: allocatedQuantity ?? this.allocatedQuantity,
      location: location ?? this.location,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  static DateTime? _toDate(dynamic value) {
    if (value == null) return null;
    return DateTime.tryParse(value.toString());
  }
}