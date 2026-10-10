import 'package:dio/dio.dart';
import 'package:reliefnexus_mobile/core/network/api_client.dart';

class ResolvedLocation {
  const ResolvedLocation({
    required this.displayName,
    required this.latitude,
    required this.longitude,
  });
  final String displayName;
  final double latitude;
  final double longitude;
}

class AiOptimizationService {
  AiOptimizationService(this._client);
  final ApiClient _client;
  final Dio _geocoder = Dio(BaseOptions(
    baseUrl: 'https://nominatim.openstreetmap.org',
    connectTimeout: const Duration(seconds: 12),
    receiveTimeout: const Duration(seconds: 12),
    headers: const {'Accept': 'application/json', 'User-Agent': 'ReliefNexus-Mobile/1.0'},
  ));

  Future<ResolvedLocation> resolveLocation(String query) async {
    if (query.trim().isEmpty) throw ArgumentError('Enter a location first.');
    final response = await _geocoder.get('/search', queryParameters: {
      'q': query.trim(), 'format': 'jsonv2', 'limit': 1,
    });
    final data = response.data;
    if (data is! List || data.isEmpty || data.first is! Map) {
      throw StateError('Location not found. Try a more specific town, city, or district.');
    }
    final item = Map<String, dynamic>.from(data.first as Map);
    final lat = double.tryParse(item['lat']?.toString() ?? '');
    final lon = double.tryParse(item['lon']?.toString() ?? '');
    if (lat == null || lon == null) throw StateError('Location coordinates are unavailable.');
    return ResolvedLocation(
      displayName: item['display_name']?.toString() ?? query.trim(),
      latitude: lat,
      longitude: lon,
    );
  }

  Future<Map<String, dynamic>> runWorkflow({
    required String prompt,
    required ResolvedLocation location,
  }) async {
    final response = await _client.dio.post('/ai/orchestrator/run', data: {
      'prompt': prompt.trim(),
      'riskInput': {
        'location': location.displayName,
        'latitude': location.latitude,
        'longitude': location.longitude,
      },
      'executeAgents': true,
      'maxReplans': 2,
      'executionMode': 'backend_execution',
    });
    return response.data is Map
        ? Map<String, dynamic>.from(response.data as Map)
        : {'result': response.data};
  }

  Future<List<Map<String, dynamic>>> loadAssessments() async {
    final response = await _client.dio.get('/vulnerability-impact');
    dynamic data = response.data;
    if (data is Map) data = data['data'] ?? data['items'] ?? data['results'] ?? data;
    if (data is! List) return [];
    return data.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<List<Map<String, dynamic>>> optimize(String assessmentId) async {
    final response = await _client.dio.post('/resource-optimization/$assessmentId/optimize');
    dynamic data = response.data;
    if (data is Map) data = data['data'] ?? data['items'] ?? data['results'] ?? data;
    if (data is List) return data.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    if (data is Map) return [Map<String, dynamic>.from(data)];
    return [];
  }
}
