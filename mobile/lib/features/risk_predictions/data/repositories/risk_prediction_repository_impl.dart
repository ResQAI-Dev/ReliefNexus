import '../../../../core/network/api_client.dart';
import '../../domain/repositories/risk_prediction_repository.dart';
import '../datasources/risk_prediction_remote_datasource.dart';
import '../models/risk_prediction_model.dart';

class RiskPredictionRepositoryImpl implements RiskPredictionRepository {
  final RiskPredictionRemoteDataSource _remote;

  RiskPredictionRepositoryImpl()
    : _remote = RiskPredictionRemoteDataSource(ApiClient());

  @override
  Future<RiskPredictionModel> create(Map<String, dynamic> data) {
    return _remote.create(data);
  }

  @override
  Future<List<RiskPredictionModel>> getRecent() {
    return _remote.getRecent();
  }

  @override
  Future<RiskPredictionModel> getById(String id) {
    return _remote.getById(id);
  }

  @override
  Future<dynamic> explain(String id) {
    return _remote.explain(id);
  }

  @override
  Future<Map<String, dynamic>> geocode(String query) {
    return _remote.geocode(query);
  }

  @override
  Future<Map<String, dynamic>> getEnvironment({
    required double latitude,
    required double longitude,
    String? location,
  }) {
    return _remote.getEnvironment(
      latitude: latitude,
      longitude: longitude,
      location: location,
    );
  }

  @override
  Future<RiskPredictionModel> approve(String id) {
    return _remote.approve(id);
  }

  @override
  Future<RiskPredictionModel> reject(String id) {
    return _remote.reject(id);
  }
}
