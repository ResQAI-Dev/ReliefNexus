class EmergencyAlertModel {
  final String id;
  final String title;
  final String message;
  final String location;
  final String disasterType;
  final String severity;
  final List<String> recommendedActions;
  final dynamic resourceSummary;
  final String alertStatus;
  final DateTime? createdAt;

  const EmergencyAlertModel({
    this.id = '',
    this.title = '',
    this.message = '',
    this.location = '',
    this.disasterType = '',
    this.severity = '',
    this.recommendedActions = const [],
    this.resourceSummary,
    this.alertStatus = '',
    this.createdAt,
  });

  factory EmergencyAlertModel.fromJson(Map<String, dynamic> json) {
    final actions = json['recommendedActions'] ??
        json['RecommendedActions'] ??
        json['actions'] ??
        [];

    return EmergencyAlertModel(
      id: '${json['id'] ?? json['Id'] ?? ''}',
      title: '${json['title'] ?? json['Title'] ?? ''}',
      message: '${json['message'] ?? json['Message'] ?? ''}',
      location: '${json['location'] ?? json['Location'] ?? ''}',
      disasterType:
          '${json['disasterType'] ?? json['DisasterType'] ?? ''}',
      severity: '${json['severity'] ?? json['Severity'] ?? ''}',
      recommendedActions: actions is List
          ? actions.map((e) => '$e').toList()
          : const [],
      resourceSummary:
          json['resourceSummary'] ?? json['ResourceSummary'],
      alertStatus:
          '${json['alertStatus'] ?? json['AlertStatus'] ?? json['status'] ?? ''}',
      createdAt: DateTime.tryParse(
        '${json['createdAt'] ?? json['CreatedAt'] ?? ''}',
      ),
    );
  }
}