class DisasterRiskModel {
  final String disasterType;
  final double? riskScore;
  final String riskLevel;
  final bool dataAvailable;
  final String dataSource;

  const DisasterRiskModel({
    required this.disasterType,
    required this.riskScore,
    required this.riskLevel,
    required this.dataAvailable,
    required this.dataSource,
  });

  factory DisasterRiskModel.fromJson(Map<String, dynamic> json) {
    double? number(dynamic value) {
      if (value == null) return null;
      return double.tryParse(value.toString());
    }

    bool boolean(dynamic value) {
      if (value is bool) return value;

      final text = value?.toString().toLowerCase().trim();

      if (text == 'true' || text == '1' || text == 'yes') {
        return true;
      }

      return false;
    }

    return DisasterRiskModel(
      disasterType: json['disasterType']?.toString() ?? 'Unknown',
      riskScore: number(json['riskScore']),
      riskLevel: json['riskLevel']?.toString() ?? 'DataUnavailable',
      dataAvailable: boolean(json['dataAvailable']),
      dataSource: json['dataSource']?.toString() ?? '',
    );
  }
}

class RiskFactorModel {
  final String factor;
  final double? value;
  final String impact;
  final double? contribution;

  const RiskFactorModel({
    required this.factor,
    required this.value,
    required this.impact,
    required this.contribution,
  });

  factory RiskFactorModel.fromJson(Map<String, dynamic> json) {
    double? number(dynamic value) {
      if (value == null) return null;
      return double.tryParse(value.toString());
    }

    return RiskFactorModel(
      factor: json['factor']?.toString() ?? '',
      value: number(json['value']),
      impact: json['impact']?.toString() ?? '',
      contribution: number(json['contribution']),
    );
  }
}

class RiskPredictionModel {
  final String id;
  final String location;
  final double? latitude;
  final double? longitude;

  final double? rainfall1h;
  final double? rainfall3h;
  final double? rainfall24h;

  final double? riverLevel;
  final double? riverFlow;

  final double? temperature;
  final double? humidity;
  final double? windSpeed;
  final double? soilMoisture;

  final double? elevation;
  final double? populationDensity;

  final double? historicalFloodCount;
  final double? historicalSeverity;
  final double? drainageCapacity;
  final double? forecastRainfall;

  final String disasterType;
  final double riskScore;
  final String riskLevel;
  final double confidence;

  final List<DisasterRiskModel> disasterRisks;
  final List<RiskFactorModel> riskFactors;

  final List<String> recommendations;

  final String predictionSource;
  final String modelVersion;

  final bool requiresHumanApproval;
  final bool isApproved;
  final String? approvalStatus;

  final DateTime? createdAt;

  const RiskPredictionModel({
    required this.id,
    required this.location,
    required this.latitude,
    required this.longitude,
    this.rainfall1h,
    this.rainfall3h,
    this.rainfall24h,
    this.riverLevel,
    this.riverFlow,
    this.temperature,
    this.humidity,
    this.windSpeed,
    this.soilMoisture,
    this.elevation,
    this.populationDensity,
    this.historicalFloodCount,
    this.historicalSeverity,
    this.drainageCapacity,
    this.forecastRainfall,
    required this.disasterType,
    required this.riskScore,
    required this.riskLevel,
    required this.confidence,
    this.disasterRisks = const [],
    this.riskFactors = const [],
    required this.recommendations,
    required this.predictionSource,
    required this.modelVersion,
    this.requiresHumanApproval = false,
    this.isApproved = false,
    this.approvalStatus,
    required this.createdAt,
  });

  factory RiskPredictionModel.fromJson(Map<String, dynamic> json) {
    double number(dynamic value) =>
        double.tryParse(value?.toString() ?? '') ?? 0;

    double? nullableNumber(dynamic value) {
      if (value == null) return null;
      return double.tryParse(value.toString());
    }

    bool boolean(dynamic value) {
      if (value is bool) return value;

      final text = value?.toString().toLowerCase().trim();

      if (text == 'true' || text == '1' || text == 'yes') {
        return true;
      }

      return false;
    }

    final rawDisasterRisks = json['disasterRisks'];

    final disasterRisks = rawDisasterRisks is List
        ? rawDisasterRisks
            .whereType<Map>()
            .map(
              (item) => DisasterRiskModel.fromJson(
                Map<String, dynamic>.from(item),
              ),
            )
            .toList()
        : <DisasterRiskModel>[];

    final rawRiskFactors = json['riskFactors'];

    final riskFactors = rawRiskFactors is List
        ? rawRiskFactors
            .whereType<Map>()
            .map(
              (item) => RiskFactorModel.fromJson(
                Map<String, dynamic>.from(item),
              ),
            )
            .toList()
        : <RiskFactorModel>[];

    final rawRecommendations = json['recommendations'];

    final recommendations = rawRecommendations is List
        ? rawRecommendations.map((item) => item.toString()).toList()
        : <String>[];

    return RiskPredictionModel(
      id: json['id']?.toString() ?? '',
      location: json['location']?.toString() ?? '',
      latitude: nullableNumber(json['latitude']),
      longitude: nullableNumber(json['longitude']),

      rainfall1h: nullableNumber(json['rainfall1h']),
      rainfall3h: nullableNumber(json['rainfall3h']),
      rainfall24h: nullableNumber(json['rainfall24h']),

      riverLevel: nullableNumber(json['riverLevel']),
      riverFlow: nullableNumber(json['riverFlow']),

      temperature: nullableNumber(json['temperature']),
      humidity: nullableNumber(json['humidity']),
      windSpeed: nullableNumber(json['windSpeed']),
      soilMoisture: nullableNumber(json['soilMoisture']),

      elevation: nullableNumber(json['elevation']),
      populationDensity: nullableNumber(json['populationDensity']),

      historicalFloodCount:
          nullableNumber(json['historicalFloodCount']),

      historicalSeverity:
          nullableNumber(json['historicalSeverity']),

      drainageCapacity:
          nullableNumber(json['drainageCapacity']),

      forecastRainfall:
          nullableNumber(json['forecastRainfall']),

      disasterType:
          json['disasterType']?.toString() ?? '',

      riskScore:
          number(json['riskScore']),

      riskLevel:
          json['riskLevel']?.toString() ?? 'Unknown',

      confidence:
          number(json['confidence']),

      disasterRisks:
          disasterRisks,

      riskFactors:
          riskFactors,

      recommendations:
          recommendations,

      predictionSource:
          json['predictionSource']?.toString() ?? '',

      modelVersion:
          json['modelVersion']?.toString() ?? '',

      requiresHumanApproval:
          boolean(json['requiresHumanApproval']),

      isApproved:
          boolean(json['isApproved']),

      approvalStatus:
          json['approvalStatus']?.toString(),

      createdAt:
          DateTime.tryParse(
            json['createdAt']?.toString() ?? '',
          ),
    );
  }
}