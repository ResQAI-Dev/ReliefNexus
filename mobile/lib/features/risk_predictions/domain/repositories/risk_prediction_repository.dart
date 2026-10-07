import '../../data/models/risk_prediction_model.dart';

abstract class RiskPredictionRepository {
  Future<RiskPredictionModel> create(Map<String, dynamic> data);

  Future<List<RiskPredictionModel>> getRecent();

  Future<RiskPredictionModel> getById(String id);

  Future<dynamic> explain(String id);

  Future<RiskPredictionModel> approve(String id);

  Future<RiskPredictionModel> reject(String id);

  Future<Map<String, dynamic>> geocode(String query);
  Future<Map<String, dynamic>> getEnvironment({
    required double latitude,
    required double longitude,
    String? location,
  });
}
