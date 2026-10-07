import 'package:flutter/foundation.dart';

import '../../data/models/risk_prediction_model.dart';
import '../../data/repositories/risk_prediction_repository_impl.dart';
import '../../domain/repositories/risk_prediction_repository.dart';

class RiskPredictionsProvider extends ChangeNotifier {
  final RiskPredictionRepository _repository = RiskPredictionRepositoryImpl();

  List<RiskPredictionModel> _predictions = [];
  RiskPredictionModel? _selected;

  bool _loading = false;
  String? _error;

  List<RiskPredictionModel> get predictions => _predictions;
  RiskPredictionModel? get selected => _selected;
  bool get loading => _loading;
  String? get error => _error;

  int get total => _predictions.length;

  int get highOrCritical => _predictions.where((e) {
    final level = e.riskLevel.toLowerCase();
    return level == 'high' || level == 'critical';
  }).length;

  Future<void> load() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _predictions = await _repository.getRecent();

      _predictions.sort((a, b) {
        final aTime = a.createdAt;
        final bTime = b.createdAt;

        if (aTime == null && bTime == null) return 0;
        if (aTime == null) return 1;
        if (bTime == null) return -1;

        return bTime.compareTo(aTime);
      });
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> predict(Map<String, dynamic> data) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      print('========================================');
      print('MOBILE AGENT 01 PREDICTION START');
      print('POST /risk-predictions');
      print('========================================');

      final created = await _repository.create(data);

      print('========================================');
      print('MOBILE AGENT 01 PREDICTION SUCCESS');
      print('ID: ${created.id}');
      print('DISASTER: ${created.disasterType}');
      print('RISK SCORE: ${created.riskScore}');
      print('========================================');

      _selected = created;

      _predictions = [
        created,
        ..._predictions.where((item) => item.id != created.id),
      ];
    } catch (e, stack) {
      _error = e.toString();

      print('========================================');
      print('MOBILE AGENT 01 PREDICTION ERROR');
      print(e);
      print(stack);
      print('========================================');

      rethrow;
    } finally {
      _loading = false;
      notifyListeners();

      print('MOBILE AGENT 01 LOADING = FALSE');
    }
  }

  Future<void> select(String id) async {
    _loading = true;
    notifyListeners();

    try {
      _selected = await _repository.getById(id);
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<dynamic> explain(String id) {
    return _repository.explain(id);
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Future<Map<String, dynamic>> geocode(String query) {
    return _repository.geocode(query);
  }

  Future<Map<String, dynamic>> getEnvironment({
    required double latitude,
    required double longitude,
    String? location,
  }) {
    return _repository.getEnvironment(
      latitude: latitude,
      longitude: longitude,
      location: location,
    );
  }

  Future<void> approve(String id) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final updated = await _repository.approve(id);

      _selected = updated;

      _predictions = _predictions
          .map((item) => item.id == updated.id ? updated : item)
          .toList();
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> reject(String id) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final updated = await _repository.reject(id);

      _selected = updated;

      _predictions = _predictions
          .map((item) => item.id == updated.id ? updated : item)
          .toList();
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }
}
