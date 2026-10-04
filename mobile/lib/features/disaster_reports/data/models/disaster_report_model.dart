class DisasterReportModel {
  final String id;
  final String? reporterUserId;
  final String? riskPredictionId;
  final String reporterName;
  final String reporterEmail;
  final String disasterType;
  final String description;
  final String location;
  final double? latitude;
  final double? longitude;
  final String severity;
  final String status;
  final String? assignedVolunteerUserId;
  final String? assignedVolunteerName;
  final DateTime? assignedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const DisasterReportModel({
    required this.id,
    this.reporterUserId,
    this.riskPredictionId,
    required this.reporterName,
    required this.reporterEmail,
    required this.disasterType,
    required this.description,
    required this.location,
    this.latitude,
    this.longitude,
    required this.severity,
    required this.status,
    this.assignedVolunteerUserId,
    this.assignedVolunteerName,
    this.assignedAt,
    this.createdAt,
    this.updatedAt,
  });

  factory DisasterReportModel.fromJson(Map<String, dynamic> json) {
    double? numValue(dynamic v) =>
        v is num ? v.toDouble() : double.tryParse('$v');
    return DisasterReportModel(
      id: '${json['id'] ?? ''}',
      reporterUserId: json['reporterUserId']?.toString(),
      riskPredictionId: json['riskPredictionId']?.toString(),
      reporterName: '${json['reporterName'] ?? 'Unknown reporter'}',
      reporterEmail: '${json['reporterEmail'] ?? ''}',
      disasterType: '${json['disasterType'] ?? 'Unknown'}',
      description: '${json['description'] ?? ''}',
      location: '${json['location'] ?? 'Location unavailable'}',
      latitude: numValue(json['latitude']),
      longitude: numValue(json['longitude']),
      severity: '${json['severity'] ?? 'Unknown'}',
      status: '${json['status'] ?? 'Unknown'}',
      assignedVolunteerUserId: json['assignedVolunteerUserId']?.toString(),
      assignedVolunteerName: json['assignedVolunteerName']?.toString(),
      assignedAt: DateTime.tryParse('${json['assignedAt'] ?? ''}'),
      createdAt: DateTime.tryParse('${json['createdAt'] ?? ''}'),
      updatedAt: DateTime.tryParse('${json['updatedAt'] ?? ''}'),
    );
  }
}
