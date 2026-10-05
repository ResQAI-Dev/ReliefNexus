/// Strongly-typed result wrapper returned by every [ApiService] method.
///
/// Pattern:
/// ```dart
/// final result = await apiService.login(...);
/// if (result.isSuccess) {
///   final auth = result.data!;
/// } else {
///   showErrorSnackBar(result.errorMessage!);
/// }
/// ```
class ApiResult<T> {
  /// Non-null when the call succeeded.
  final T? data;

  /// Non-null when the call failed.
  final String? errorMessage;

  /// HTTP status code returned by the server (null if the request never completed).
  final int? statusCode;

  const ApiResult._({this.data, this.errorMessage, this.statusCode});

  /// Construct a successful result carrying [data].
  factory ApiResult.success(T data, {int? statusCode}) =>
      ApiResult._(data: data, statusCode: statusCode);

  /// Construct a failed result carrying [errorMessage].
  factory ApiResult.failure(String errorMessage, {int? statusCode}) =>
      ApiResult._(errorMessage: errorMessage, statusCode: statusCode);

  bool get isSuccess => errorMessage == null;
  bool get isFailure => !isSuccess;
}

// =============================================================================
// AUTH MODELS  (mirrors ReliefNexus.API.DTOs.AuthDto + UserDto)
// =============================================================================

class AuthResponse {
  final String? accessToken;
  final String? refreshToken;
  final String? role;
  final UserResponse? user;

  const AuthResponse({
    this.accessToken,
    this.refreshToken,
    this.role,
    this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
        accessToken: json['accessToken'] as String?,
        refreshToken: json['refreshToken'] as String?,
        role: json['role'] as String?,
        user: json['user'] != null
            ? UserResponse.fromJson(json['user'] as Map<String, dynamic>)
            : null,
      );
}

class UserResponse {
  final String id;
  final String fullName;
  final String email;
  final String role;
  final bool isActive;
  final DateTime createdAt;

  const UserResponse({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    required this.isActive,
    required this.createdAt,
  });

  factory UserResponse.fromJson(Map<String, dynamic> json) => UserResponse(
        id: json['id'] as String,
        fullName: json['fullName'] as String,
        email: json['email'] as String,
        role: json['role'] as String? ?? 'User',
        isActive: json['isActive'] as bool? ?? false,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}

// =============================================================================
// RISK PREDICTION MODELS  (mirrors RiskPredictionDto + nested DTOs)
// =============================================================================

class RiskPrediction {
  final String? id;
  final String location;
  final double? latitude;
  final double? longitude;
  final double rainfall1h;
  final double rainfall3h;
  final double rainfall24h;
  final double riverLevel;
  final double riverFlow;
  final double temperature;
  final double humidity;
  final double windSpeed;
  final double soilMoisture;
  final double elevation;
  final double populationDensity;
  final int historicalFloodCount;
  final double historicalSeverity;
  final double drainageCapacity;
  final double forecastRainfall;
  final String disasterType;
  final double riskScore;
  final String riskLevel;
  final double confidence;
  final List<DisasterRisk> disasterRisks;
  final List<RiskFactor> riskFactors;
  final List<String> recommendations;
  final String predictionSource;
  final String modelVersion;
  final bool requiresHumanApproval;
  final bool isApproved;
  final String approvalStatus;
  final DateTime createdAt;

  const RiskPrediction({
    this.id,
    required this.location,
    this.latitude,
    this.longitude,
    required this.rainfall1h,
    required this.rainfall3h,
    required this.rainfall24h,
    required this.riverLevel,
    required this.riverFlow,
    required this.temperature,
    required this.humidity,
    required this.windSpeed,
    required this.soilMoisture,
    required this.elevation,
    required this.populationDensity,
    required this.historicalFloodCount,
    required this.historicalSeverity,
    required this.drainageCapacity,
    required this.forecastRainfall,
    required this.disasterType,
    required this.riskScore,
    required this.riskLevel,
    required this.confidence,
    required this.disasterRisks,
    required this.riskFactors,
    required this.recommendations,
    required this.predictionSource,
    required this.modelVersion,
    required this.requiresHumanApproval,
    required this.isApproved,
    required this.approvalStatus,
    required this.createdAt,
  });

  factory RiskPrediction.fromJson(Map<String, dynamic> j) => RiskPrediction(
        id: j['id'] as String?,
        location: j['location'] as String? ?? '',
        latitude: (j['latitude'] as num?)?.toDouble(),
        longitude: (j['longitude'] as num?)?.toDouble(),
        rainfall1h: (j['rainfall1h'] as num?)?.toDouble() ?? 0,
        rainfall3h: (j['rainfall3h'] as num?)?.toDouble() ?? 0,
        rainfall24h: (j['rainfall24h'] as num?)?.toDouble() ?? 0,
        riverLevel: (j['riverLevel'] as num?)?.toDouble() ?? 0,
        riverFlow: (j['riverFlow'] as num?)?.toDouble() ?? 0,
        temperature: (j['temperature'] as num?)?.toDouble() ?? 0,
        humidity: (j['humidity'] as num?)?.toDouble() ?? 0,
        windSpeed: (j['windSpeed'] as num?)?.toDouble() ?? 0,
        soilMoisture: (j['soilMoisture'] as num?)?.toDouble() ?? 0,
        elevation: (j['elevation'] as num?)?.toDouble() ?? 0,
        populationDensity: (j['populationDensity'] as num?)?.toDouble() ?? 0,
        historicalFloodCount: (j['historicalFloodCount'] as num?)?.toInt() ?? 0,
        historicalSeverity: (j['historicalSeverity'] as num?)?.toDouble() ?? 0,
        drainageCapacity: (j['drainageCapacity'] as num?)?.toDouble() ?? 0,
        forecastRainfall: (j['forecastRainfall'] as num?)?.toDouble() ?? 0,
        disasterType: j['disasterType'] as String? ?? '',
        riskScore: (j['riskScore'] as num?)?.toDouble() ?? 0,
        riskLevel: j['riskLevel'] as String? ?? 'UNKNOWN',
        confidence: (j['confidence'] as num?)?.toDouble() ?? 0,
        disasterRisks: (j['disasterRisks'] as List<dynamic>? ?? [])
            .map((e) => DisasterRisk.fromJson(e as Map<String, dynamic>))
            .toList(),
        riskFactors: (j['riskFactors'] as List<dynamic>? ?? [])
            .map((e) => RiskFactor.fromJson(e as Map<String, dynamic>))
            .toList(),
        recommendations: (j['recommendations'] as List<dynamic>? ?? [])
            .map((e) => e as String)
            .toList(),
        predictionSource: j['predictionSource'] as String? ?? '',
        modelVersion: j['modelVersion'] as String? ?? '',
        requiresHumanApproval: j['requiresHumanApproval'] as bool? ?? false,
        isApproved: j['isApproved'] as bool? ?? false,
        approvalStatus: j['approvalStatus'] as String? ?? 'NotRequired',
        createdAt: DateTime.tryParse(j['createdAt'] as String? ?? '') ?? DateTime.now(),
      );

  Map<String, dynamic> toJson() => {
        if (id != null) 'id': id,
        'location': location,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        'rainfall1h': rainfall1h,
        'rainfall3h': rainfall3h,
        'rainfall24h': rainfall24h,
        'riverLevel': riverLevel,
        'riverFlow': riverFlow,
        'temperature': temperature,
        'humidity': humidity,
        'windSpeed': windSpeed,
        'soilMoisture': soilMoisture,
        'elevation': elevation,
        'populationDensity': populationDensity,
        'historicalFloodCount': historicalFloodCount,
        'historicalSeverity': historicalSeverity,
        'drainageCapacity': drainageCapacity,
        'forecastRainfall': forecastRainfall,
        'disasterType': disasterType,
        'riskScore': riskScore,
        'riskLevel': riskLevel,
        'confidence': confidence,
      };
}

class DisasterRisk {
  final String disasterType;
  final double? riskScore;
  final String riskLevel;
  final bool dataAvailable;
  final String dataSource;

  const DisasterRisk({
    required this.disasterType,
    this.riskScore,
    required this.riskLevel,
    required this.dataAvailable,
    required this.dataSource,
  });

  factory DisasterRisk.fromJson(Map<String, dynamic> j) => DisasterRisk(
        disasterType: j['disasterType'] as String? ?? '',
        riskScore: (j['riskScore'] as num?)?.toDouble(),
        riskLevel: j['riskLevel'] as String? ?? 'DataUnavailable',
        dataAvailable: j['dataAvailable'] as bool? ?? false,
        dataSource: j['dataSource'] as String? ?? '',
      );
}

class RiskFactor {
  final String factor;
  final double value;
  final String impact;
  final double contribution;

  const RiskFactor({
    required this.factor,
    required this.value,
    required this.impact,
    required this.contribution,
  });

  factory RiskFactor.fromJson(Map<String, dynamic> j) => RiskFactor(
        factor: j['factor'] as String? ?? '',
        value: (j['value'] as num?)?.toDouble() ?? 0,
        impact: j['impact'] as String? ?? '',
        contribution: (j['contribution'] as num?)?.toDouble() ?? 0,
      );
}

class PaginatedRiskPredictions {
  final List<RiskPrediction> items;
  final int page;
  final int pageSize;
  final int totalItems;
  final int totalPages;

  const PaginatedRiskPredictions({
    required this.items,
    required this.page,
    required this.pageSize,
    required this.totalItems,
    required this.totalPages,
  });

  factory PaginatedRiskPredictions.fromJson(Map<String, dynamic> j) =>
      PaginatedRiskPredictions(
        items: (j['items'] as List<dynamic>? ?? [])
            .map((e) => RiskPrediction.fromJson(e as Map<String, dynamic>))
            .toList(),
        page: (j['page'] as num?)?.toInt() ?? 1,
        pageSize: (j['pageSize'] as num?)?.toInt() ?? 10,
        totalItems: (j['totalItems'] as num?)?.toInt() ?? 0,
        totalPages: (j['totalPages'] as num?)?.toInt() ?? 0,
      );
}

// =============================================================================
// VULNERABILITY / POPULATION SNAPSHOT MODELS
// =============================================================================

class PopulationSnapshot {
  final String id;
  final String affectedAreaId;
  final int totalPopulation;
  final int childrenCount;
  final int elderlyCount;
  final int disabledCount;
  final int totalVulnerable;
  final double vulnerabilityRatio;
  final DateTime snapshotDate;
  final String? dataSource;
  final DateTime createdAt;

  const PopulationSnapshot({
    required this.id,
    required this.affectedAreaId,
    required this.totalPopulation,
    required this.childrenCount,
    required this.elderlyCount,
    required this.disabledCount,
    required this.totalVulnerable,
    required this.vulnerabilityRatio,
    required this.snapshotDate,
    this.dataSource,
    required this.createdAt,
  });

  factory PopulationSnapshot.fromJson(Map<String, dynamic> j) =>
      PopulationSnapshot(
        id: j['id'] as String,
        affectedAreaId: j['affectedAreaId'] as String,
        totalPopulation: (j['totalPopulation'] as num).toInt(),
        childrenCount: (j['childrenCount'] as num).toInt(),
        elderlyCount: (j['elderlyCount'] as num).toInt(),
        disabledCount: (j['disabledCount'] as num).toInt(),
        totalVulnerable: (j['totalVulnerable'] as num).toInt(),
        vulnerabilityRatio: (j['vulnerabilityRatio'] as num).toDouble(),
        snapshotDate: DateTime.parse(j['snapshotDate'] as String),
        dataSource: j['dataSource'] as String?,
        createdAt: DateTime.parse(j['createdAt'] as String),
      );
}

// =============================================================================
// CRITICAL INFRASTRUCTURE MODEL
// =============================================================================

class CriticalInfrastructure {
  final String id;
  final String affectedAreaId;
  final String name;
  final String type;
  final double latitude;
  final double longitude;
  final int? operationalCapacity;
  final bool isEmergencyHub;
  final DateTime createdAt;

  const CriticalInfrastructure({
    required this.id,
    required this.affectedAreaId,
    required this.name,
    required this.type,
    required this.latitude,
    required this.longitude,
    this.operationalCapacity,
    required this.isEmergencyHub,
    required this.createdAt,
  });

  factory CriticalInfrastructure.fromJson(Map<String, dynamic> j) =>
      CriticalInfrastructure(
        id: j['id'] as String,
        affectedAreaId: j['affectedAreaId'] as String,
        name: j['name'] as String,
        type: j['type'] as String,
        latitude: (j['latitude'] as num).toDouble(),
        longitude: (j['longitude'] as num).toDouble(),
        operationalCapacity: (j['operationalCapacity'] as num?)?.toInt(),
        isEmergencyHub: j['isEmergencyHub'] as bool? ?? false,
        createdAt: DateTime.parse(j['createdAt'] as String),
      );
}

// =============================================================================
// IMPACT ASSESSMENT MODEL
// =============================================================================

class ImpactAssessment {
  final String id;
  final String disasterEventId;
  final String affectedAreaId;
  final int estimatedPeopleAtRisk;
  final int estimatedVulnerableGroups;
  final String impactSeverity;
  final String? affectedFacilitiesSummary;
  final String? workflowId;
  final String generatedBy;
  final DateTime createdAt;

  const ImpactAssessment({
    required this.id,
    required this.disasterEventId,
    required this.affectedAreaId,
    required this.estimatedPeopleAtRisk,
    required this.estimatedVulnerableGroups,
    required this.impactSeverity,
    this.affectedFacilitiesSummary,
    this.workflowId,
    required this.generatedBy,
    required this.createdAt,
  });

  factory ImpactAssessment.fromJson(Map<String, dynamic> j) => ImpactAssessment(
        id: j['id'] as String,
        disasterEventId: j['disasterEventId'] as String,
        affectedAreaId: j['affectedAreaId'] as String,
        estimatedPeopleAtRisk: (j['estimatedPeopleAtRisk'] as num).toInt(),
        estimatedVulnerableGroups:
            (j['estimatedVulnerableGroups'] as num).toInt(),
        impactSeverity: j['impactSeverity'] as String,
        affectedFacilitiesSummary:
            j['affectedFacilitiesSummary'] as String?,
        workflowId: j['workflowId'] as String?,
        generatedBy: j['generatedBy'] as String? ?? '',
        createdAt: DateTime.parse(j['createdAt'] as String),
      );
}

// =============================================================================
// RISK PREDICTION QUERY PARAMETERS  (mirrors RiskPredictionQueryDto)
// =============================================================================

class RiskPredictionQuery {
  final String? search;
  final String? location;
  final String? riskLevel;
  final String? disasterType;
  final double? minRiskScore;
  final double? maxRiskScore;
  final int page;
  final int pageSize;
  final String sortBy;
  final String sortOrder;

  const RiskPredictionQuery({
    this.search,
    this.location,
    this.riskLevel,
    this.disasterType,
    this.minRiskScore,
    this.maxRiskScore,
    this.page = 1,
    this.pageSize = 10,
    this.sortBy = 'createdAt',
    this.sortOrder = 'desc',
  });

  Map<String, String> toQueryParameters() {
    final params = <String, String>{
      'page': '$page',
      'pageSize': '$pageSize',
      'sortBy': sortBy,
      'sortOrder': sortOrder,
    };
    if (search != null) params['search'] = search!;
    if (location != null) params['location'] = location!;
    if (riskLevel != null) params['riskLevel'] = riskLevel!;
    if (disasterType != null) params['disasterType'] = disasterType!;
    if (minRiskScore != null) params['minRiskScore'] = '$minRiskScore';
    if (maxRiskScore != null) params['maxRiskScore'] = '$maxRiskScore';
    return params;
  }
}
