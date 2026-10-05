import 'package:dio/dio.dart';

import '../../../../core/network/api_client.dart';
import '../models/risk_prediction_model.dart';

class RiskPredictionRemoteDataSource {
  final ApiClient _client;

  RiskPredictionRemoteDataSource(this._client);

  Future<RiskPredictionModel> create(Map<String, dynamic> data) async {
    try {
      print('========================================');
      print('AGENT 01 REQUEST');
      print('POST /risk-predictions');
      print('PAYLOAD: $data');
      print('========================================');

      final response = await _client.dio.post('/risk-predictions', data: data);

      print('AGENT 01 STATUS: ${response.statusCode}');
      print('AGENT 01 RESPONSE: ${response.data}');

      return RiskPredictionModel.fromJson(
        Map<String, dynamic>.from(response.data as Map),
      );
    } on DioException catch (e) {
      print('========================================');
      print('AGENT 01 ERROR');
      print('STATUS: ${e.response?.statusCode}');
      print('RESPONSE: ${e.response?.data}');
      print('REQUEST URL: ${e.requestOptions.uri}');
      print('REQUEST DATA: ${e.requestOptions.data}');
      print('========================================');
      rethrow;
    }
  }

  Future<List<RiskPredictionModel>> getRecent() async {
    final response = await _client.dio.get('/risk-predictions/history');

    final raw = response.data;

    final List items = raw is List
        ? raw
        : raw is Map && raw['items'] is List
        ? raw['items']
        : [];

    return items
        .whereType<Map>()
        .map((e) => RiskPredictionModel.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  Future<RiskPredictionModel> getById(String id) async {
    final response = await _client.dio.get('/risk-predictions/$id');

    return RiskPredictionModel.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<dynamic> explain(String id) async {
    final response = await _client.dio.get('/risk-predictions/$id/explain');

    return response.data;
  }

  Future<Map<String, dynamic>> geocode(String query) async {
    final q = query.trim();

    if (q.isEmpty) {
      return <String, dynamic>{};
    }

    try {
      print('========================================');
      print('DIRECT LOCATION GEOCODING');
      print('QUERY: $q');

      final response = await _client.dio.get(
        'https://nominatim.openstreetmap.org/search',
        queryParameters: {
          'q': q,
          'format': 'json',
          'limit': 1,
          'addressdetails': 1,
          'countrycodes': 'lk',
        },
        options: Options(
          headers: {
            'User-Agent': 'ReliefNexus-Mobile/1.0',
            'Accept': 'application/json',
          },
        ),
      );

      print('GEOCODE STATUS: ${response.statusCode}');
      print('GEOCODE RESPONSE: ${response.data}');

      final raw = response.data;

      if (raw is! List || raw.isEmpty) {
        print('GEOCODE: NO RESULTS');
        print('========================================');
        return <String, dynamic>{};
      }

      final first = raw.first;

      if (first is! Map) {
        return <String, dynamic>{};
      }

      final item = Map<String, dynamic>.from(first);

      final lat = double.tryParse('${item['lat']}');
      final lon = double.tryParse('${item['lon']}');

      final displayName = item['display_name']?.toString().trim();

      if (lat == null ||
          lon == null ||
          lat < -90 ||
          lat > 90 ||
          lon < -180 ||
          lon > 180) {
        print('GEOCODE: INVALID COORDINATES');
        return <String, dynamic>{};
      }

      print('LATITUDE: $lat');
      print('LONGITUDE: $lon');
      print('DISPLAY NAME: $displayName');
      print('========================================');

      return <String, dynamic>{
        'latitude': lat,
        'longitude': lon,
        'displayName': displayName?.isNotEmpty == true ? displayName : q,
      };
    } on DioException catch (e) {
      print('========================================');
      print('GEOCODE ERROR');
      print('STATUS: ${e.response?.statusCode}');
      print('DATA: ${e.response?.data}');
      print('URL: ${e.requestOptions.uri}');
      print('========================================');

      return <String, dynamic>{};
    } catch (e) {
      print('GEOCODE ERROR: $e');
      return <String, dynamic>{};
    }
  }

  Future<Map<String, dynamic>> getEnvironment({
    required double latitude,
    required double longitude,
    String? location,
  }) async {
    final response = await _client.dio.get(
      '/risk-predictions/environment-live',
      queryParameters: {
        'latitude': latitude,
        'longitude': longitude,
        if (location != null && location.trim().isNotEmpty)
          'location': location.trim(),
      },
    );

    final data = response.data;

    if (data is Map<String, dynamic>) {
      return data;
    }

    if (data is Map) {
      return Map<String, dynamic>.from(data);
    }

    return <String, dynamic>{};
  }

  Future<RiskPredictionModel> approve(String id) async {
    try {
      print('========================================');
      print('AGENT 01 APPROVAL');
      print('PUT /risk-predictions/$id/approve');
      print('========================================');

      final response = await _client.dio.put('/risk-predictions/$id/approve');

      print('APPROVE STATUS: ${response.statusCode}');
      print('APPROVE RESPONSE: ${response.data}');

      return RiskPredictionModel.fromJson(
        Map<String, dynamic>.from(response.data as Map),
      );
    } on DioException catch (e) {
      print('APPROVE ERROR');
      print('STATUS: ${e.response?.statusCode}');
      print('DATA: ${e.response?.data}');
      rethrow;
    }
  }

  Future<RiskPredictionModel> reject(String id) async {
    try {
      print('========================================');
      print('AGENT 01 REJECTION');
      print('PUT /risk-predictions/$id/reject');
      print('========================================');

      final response = await _client.dio.put('/risk-predictions/$id/reject');

      print('REJECT STATUS: ${response.statusCode}');
      print('REJECT RESPONSE: ${response.data}');

      return RiskPredictionModel.fromJson(
        Map<String, dynamic>.from(response.data as Map),
      );
    } on DioException catch (e) {
      print('REJECT ERROR');
      print('STATUS: ${e.response?.statusCode}');
      print('DATA: ${e.response?.data}');
      rethrow;
    }
  }
}
