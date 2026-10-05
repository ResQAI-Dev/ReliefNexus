import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/api_models.dart';
import 'token_storage.dart';

/// Central HTTP service for all ReliefNexus API communication.
///
/// Architecture overview:
/// ┌─────────────────────────────────────────────┐
/// │              Flutter Widgets                │
/// │  call ApiService methods, handle ApiResult  │
/// └───────────────────┬─────────────────────────┘
///                     │
/// ┌───────────────────▼─────────────────────────┐
/// │                ApiService                   │
/// │  _get / _post / _put helpers                │
/// │  Attaches Bearer token automatically        │
/// │  Returns `ApiResult<T>` (never throws)        │
/// └───────────────────┬─────────────────────────┘
///                     │
/// ┌───────────────────▼─────────────────────────┐
/// │         ASP.NET Core Backend                │
/// │  api/auth  · api/risk-predictions           │
/// │  api/vulnerability                          │
/// └─────────────────────────────────────────────┘
class ApiService {
  // Singleton instance for application-wide reuse.
  ApiService._internal();
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  // Underlying http.Client – reused for connection keep-alive.
  final http.Client _client = http.Client();

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE HTTP HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Builds the Authorization header with the stored JWT access token.
  Future<Map<String, String>> _authHeaders() async {
    final token = await TokenStorage.getAccessToken();
    return {
      HttpHeaders.contentTypeHeader: 'application/json',
      HttpHeaders.acceptHeader: 'application/json',
      if (token != null && token.isNotEmpty)
        HttpHeaders.authorizationHeader: 'Bearer $token',
    };
  }

  /// Generic GET with JWT auth and error handling.
  Future<ApiResult<Map<String, dynamic>>> _get(
    String url, {
    Map<String, String>? queryParams,
    Duration timeout = ApiConfig.defaultTimeout,
  }) async {
    try {
      final uri = queryParams != null
          ? Uri.parse(url).replace(queryParameters: queryParams)
          : Uri.parse(url);

      final response = await _client
          .get(uri, headers: await _authHeaders())
          .timeout(timeout);

      return _parseResponse(response);
    } on SocketException {
      return ApiResult.failure(
        'Cannot reach the server. Check your network or backend URL (${ApiConfig.baseUrl}).',
      );
    } on http.ClientException catch (e) {
      return ApiResult.failure('HTTP error: ${e.message}');
    } catch (e) {
      return ApiResult.failure('Unexpected error: $e');
    }
  }

  /// Generic GET that returns a JSON array.
  Future<ApiResult<List<dynamic>>> _getList(
    String url, {
    Map<String, String>? queryParams,
    Duration timeout = ApiConfig.defaultTimeout,
  }) async {
    try {
      final uri = queryParams != null
          ? Uri.parse(url).replace(queryParameters: queryParams)
          : Uri.parse(url);

      final response = await _client
          .get(uri, headers: await _authHeaders())
          .timeout(timeout);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);
        if (decoded is List) {
          return ApiResult.success(decoded, statusCode: response.statusCode);
        }
        return ApiResult.failure('Expected a list but got ${decoded.runtimeType}');
      }

      return ApiResult.failure(
        _extractError(response),
        statusCode: response.statusCode,
      );
    } on SocketException {
      return ApiResult.failure(
        'Cannot reach the server. Check your network or backend URL (${ApiConfig.baseUrl}).',
      );
    } catch (e) {
      return ApiResult.failure('Unexpected error: $e');
    }
  }

  /// Generic POST with JWT auth and error handling.
  Future<ApiResult<Map<String, dynamic>>> _post(
    String url,
    Map<String, dynamic> body, {
    Duration timeout = ApiConfig.defaultTimeout,
    bool requiresAuth = true,
  }) async {
    try {
      final headers = requiresAuth
          ? await _authHeaders()
          : {
              HttpHeaders.contentTypeHeader: 'application/json',
              HttpHeaders.acceptHeader: 'application/json',
            };

      final response = await _client
          .post(Uri.parse(url), headers: headers, body: jsonEncode(body))
          .timeout(timeout);

      return _parseResponse(response);
    } on SocketException {
      return ApiResult.failure(
        'Cannot reach the server. Check your network or backend URL (${ApiConfig.baseUrl}).',
      );
    } catch (e) {
      return ApiResult.failure('Unexpected error: $e');
    }
  }

  /// Generic PUT with JWT auth.
  Future<ApiResult<Map<String, dynamic>>> _put(
    String url, {
    Map<String, dynamic>? body,
    Duration timeout = ApiConfig.defaultTimeout,
  }) async {
    try {
      final response = await _client
          .put(
            Uri.parse(url),
            headers: await _authHeaders(),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(timeout);

      return _parseResponse(response);
    } on SocketException {
      return ApiResult.failure(
        'Cannot reach the server. Check your network or backend URL (${ApiConfig.baseUrl}).',
      );
    } catch (e) {
      return ApiResult.failure('Unexpected error: $e');
    }
  }

  /// Decodes a successful 2xx JSON object response or returns a failure.
  ApiResult<Map<String, dynamic>> _parseResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) {
        return ApiResult.success({}, statusCode: response.statusCode);
      }
      try {
        final decoded = jsonDecode(response.body) as Map<String, dynamic>;
        return ApiResult.success(decoded, statusCode: response.statusCode);
      } catch (_) {
        return ApiResult.failure(
          'Invalid JSON response from server.',
          statusCode: response.statusCode,
        );
      }
    }

    return ApiResult.failure(
      _extractError(response),
      statusCode: response.statusCode,
    );
  }

  /// Extracts a human-readable error from a non-2xx response body.
  String _extractError(http.Response response) {
    try {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final msg = body['message'] ?? body['title'] ?? body['error'];
      if (msg != null) return msg.toString();
    } catch (_) {}

    return switch (response.statusCode) {
      400 => 'Bad request. Check the submitted data.',
      401 => 'Unauthorized. Please log in again.',
      403 => 'Access denied. Insufficient permissions.',
      404 => 'Resource not found.',
      409 => 'Conflict. The record may already exist.',
      500 => 'Server error. Please try again later.',
      _ => 'Error ${response.statusCode}: ${response.reasonPhrase}',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH  –  api/auth
  // ═══════════════════════════════════════════════════════════════════════════

  /// POST api/auth/login
  ///
  /// Returns [AuthResponse] and persists JWT tokens to [TokenStorage].
  Future<ApiResult<AuthResponse>> login({
    required String email,
    required String password,
  }) async {
    final result = await _post(
      ApiConfig.authLogin,
      {'email': email, 'password': password},
      requiresAuth: false,
    );

    if (result.isFailure) {
      return ApiResult.failure(result.errorMessage!, statusCode: result.statusCode);
    }

    try {
      final auth = AuthResponse.fromJson(result.data!);

      // Persist tokens so subsequent requests are automatically authorized.
      if (auth.accessToken != null && auth.refreshToken != null) {
        await TokenStorage.saveTokens(
          accessToken: auth.accessToken!,
          refreshToken: auth.refreshToken!,
        );
      }
      if (auth.user != null) {
        await TokenStorage.saveUserMeta(
          role: auth.role ?? 'User',
          userId: auth.user!.id,
        );
      }

      return ApiResult.success(auth, statusCode: result.statusCode);
    } catch (e) {
      return ApiResult.failure('Failed to parse login response: $e');
    }
  }

  /// POST api/auth/register
  Future<ApiResult<AuthResponse>> register({
    required String fullName,
    required String email,
    required String password,
  }) async {
    final result = await _post(
      ApiConfig.authRegister,
      {'fullName': fullName, 'email': email, 'password': password},
      requiresAuth: false,
    );

    if (result.isFailure) {
      return ApiResult.failure(result.errorMessage!, statusCode: result.statusCode);
    }
    try {
      return ApiResult.success(
        AuthResponse.fromJson(result.data!),
        statusCode: result.statusCode,
      );
    } catch (e) {
      return ApiResult.failure('Failed to parse register response: $e');
    }
  }

  /// POST api/auth/refresh – silently refreshes the access token.
  Future<bool> refreshToken() async {
    final refreshToken = await TokenStorage.getRefreshToken();
    if (refreshToken == null) return false;

    final result = await _post(
      ApiConfig.authRefresh,
      {'refreshToken': refreshToken},
      requiresAuth: false,
    );

    if (result.isSuccess) {
      final auth = AuthResponse.fromJson(result.data!);
      if (auth.accessToken != null && auth.refreshToken != null) {
        await TokenStorage.saveTokens(
          accessToken: auth.accessToken!,
          refreshToken: auth.refreshToken!,
        );
        return true;
      }
    }
    return false;
  }

  /// Clears stored tokens – effectively logs the user out.
  Future<void> logout() => TokenStorage.clearAll();

  // ═══════════════════════════════════════════════════════════════════════════
  // RISK PREDICTIONS  –  api/risk-predictions
  // ═══════════════════════════════════════════════════════════════════════════

  /// GET api/risk-predictions  (paginated, filterable)
  ///
  /// [query] maps to [RiskPredictionQueryDto] on the backend.
  Future<ApiResult<PaginatedRiskPredictions>> getRiskPredictions({
    RiskPredictionQuery query = const RiskPredictionQuery(),
  }) async {
    final result = await _get(
      ApiConfig.riskPredictions,
      queryParams: query.toQueryParameters(),
    );

    if (result.isFailure) {
      return ApiResult.failure(result.errorMessage!, statusCode: result.statusCode);
    }
    try {
      return ApiResult.success(
        PaginatedRiskPredictions.fromJson(result.data!),
        statusCode: result.statusCode,
      );
    } catch (e) {
      return ApiResult.failure('Failed to parse predictions: $e');
    }
  }

  /// GET api/risk-predictions/high-risk
  Future<ApiResult<List<RiskPrediction>>> getHighRiskPredictions() async {
    final result = await _getList(ApiConfig.riskPredictionsHighRisk);
    if (result.isFailure) {
      return ApiResult.failure(result.errorMessage!, statusCode: result.statusCode);
    }
    try {
      final list = result.data!
          .map((e) => RiskPrediction.fromJson(e as Map<String, dynamic>))
          .toList();
      return ApiResult.success(list, statusCode: result.statusCode);
    } catch (e) {
      return ApiResult.failure('Failed to parse high-risk predictions: $e');
    }
  }

  /// GET api/risk-predictions/pending-approval
  ///
  /// Returns predictions marked [requiresHumanApproval = true] that have
  /// not yet been reviewed by an authorized operator.
  Future<ApiResult<List<RiskPrediction>>> getPendingApprovalPredictions() async {
    final result = await _getList(ApiConfig.riskPredictionsPendingApproval);
    if (result.isFailure) {
      return ApiResult.failure(result.errorMessage!, statusCode: result.statusCode);
    }
    try {
      final list = result.data!
          .map((e) => RiskPrediction.fromJson(e as Map<String, dynamic>))
          .toList();
      return ApiResult.success(list, statusCode: result.statusCode);
    } catch (e) {
      return ApiResult.failure('Failed to parse pending predictions: $e');
    }
  }

  /// GET api/risk-predictions/history
  Future<ApiResult<List<RiskPrediction>>> getRiskPredictionHistory() async {
    final result = await _getList(ApiConfig.riskPredictionsHistory);
    if (result.isFailure) {
      return ApiResult.failure(result.errorMessage!, statusCode: result.statusCode);
    }
    try {
      final list = result.data!
          .map((e) => RiskPrediction.fromJson(e as Map<String, dynamic>))
          .toList();
      return ApiResult.success(list, statusCode: result.statusCode);
    } catch (e) {
      return ApiResult.failure('Failed to parse prediction history: $e');
    }
  }

  /// GET api/risk-predictions/location/{location}
  Future<ApiResult<List<RiskPrediction>>> getRiskPredictionsByLocation(
    String location,
  ) async {
    final result =
        await _getList(ApiConfig.riskPredictionByLocation(location));
    if (result.isFailure) {
      return ApiResult.failure(result.errorMessage!, statusCode: result.statusCode);
    }
    try {
      final list = result.data!
          .map((e) => RiskPrediction.fromJson(e as Map<String, dynamic>))
          .toList();
      return ApiResult.success(list, statusCode: result.statusCode);
    } catch (e) {
      return ApiResult.failure('Failed to parse location predictions: $e');
    }
  }

  /// GET api/risk-predictions/{id}
  Future<ApiResult<RiskPrediction>> getRiskPredictionById(String id) async {
    final result = await _get(ApiConfig.riskPredictionById(id));
    if (result.isFailure) {
      return ApiResult.failure(result.errorMessage!, statusCode: result.statusCode);
    }
    try {
      return ApiResult.success(
        RiskPrediction.fromJson(result.data!),
        statusCode: result.statusCode,
      );
    } catch (e) {
      return ApiResult.failure('Failed to parse prediction: $e');
    }
  }

  /// GET api/risk-predictions/external-events
  ///
  /// Returns live external disaster events fetched by the AI agent tool.
  Future<ApiResult<List<dynamic>>> getExternalDisasterEvents() async {
    return _getList(ApiConfig.riskPredictionsExternalEvents);
  }

  /// POST api/risk-predictions
  ///
  /// Triggers the AI risk assessment agent. This call may take up to
  /// [ApiConfig.predictionTimeout] seconds as the agent fetches weather
  /// and disaster data from external sources.
  Future<ApiResult<RiskPrediction>> createRiskPrediction(
    RiskPrediction request,
  ) async {
    final result = await _post(
      ApiConfig.riskPredictions,
      request.toJson(),
      timeout: ApiConfig.predictionTimeout,
    );

    if (result.isFailure) {
      return ApiResult.failure(result.errorMessage!, statusCode: result.statusCode);
    }
    try {
      return ApiResult.success(
        RiskPrediction.fromJson(result.data!),
        statusCode: result.statusCode,
      );
    } catch (e) {
      return ApiResult.failure('Failed to parse created prediction: $e');
    }
  }

  /// PUT api/risk-predictions/{id}/approve
  Future<ApiResult<RiskPrediction>> approvePrediction(String id) async {
    final result = await _put(ApiConfig.riskPredictionApprove(id));
    if (result.isFailure) {
      return ApiResult.failure(result.errorMessage!, statusCode: result.statusCode);
    }
    try {
      return ApiResult.success(
        RiskPrediction.fromJson(result.data!),
        statusCode: result.statusCode,
      );
    } catch (e) {
      return ApiResult.failure('Failed to parse approved prediction: $e');
    }
  }

  /// PUT api/risk-predictions/{id}/reject
  Future<ApiResult<RiskPrediction>> rejectPrediction(String id) async {
    final result = await _put(ApiConfig.riskPredictionReject(id));
    if (result.isFailure) {
      return ApiResult.failure(result.errorMessage!, statusCode: result.statusCode);
    }
    try {
      return ApiResult.success(
        RiskPrediction.fromJson(result.data!),
        statusCode: result.statusCode,
      );
    } catch (e) {
      return ApiResult.failure('Failed to parse rejected prediction: $e');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VULNERABILITY & IMPACT  –  api/vulnerability
  // ═══════════════════════════════════════════════════════════════════════════

  /// GET api/vulnerability/snapshots/{areaId}
  ///
  /// Returns the latest population demographic snapshot for an affected area.
  Future<ApiResult<PopulationSnapshot>> getPopulationSnapshot(
    String areaId,
  ) async {
    final result = await _get(ApiConfig.vulnerabilitySnapshotByArea(areaId));
    if (result.isFailure) {
      return ApiResult.failure(result.errorMessage!, statusCode: result.statusCode);
    }
    try {
      return ApiResult.success(
        PopulationSnapshot.fromJson(result.data!),
        statusCode: result.statusCode,
      );
    } catch (e) {
      return ApiResult.failure('Failed to parse population snapshot: $e');
    }
  }

  /// POST api/vulnerability/snapshots
  Future<ApiResult<PopulationSnapshot>> createPopulationSnapshot({
    required String affectedAreaId,
    required int totalPopulation,
    required int childrenCount,
    required int elderlyCount,
    required int disabledCount,
    String? dataSource,
  }) async {
    final result = await _post(
      ApiConfig.vulnerabilitySnapshots,
      {
        'affectedAreaId': affectedAreaId,
        'totalPopulation': totalPopulation,
        'childrenCount': childrenCount,
        'elderlyCount': elderlyCount,
        'disabledCount': disabledCount,
        if (dataSource != null) 'dataSource': dataSource,
      },
    );

    if (result.isFailure) {
      return ApiResult.failure(result.errorMessage!, statusCode: result.statusCode);
    }
    try {
      return ApiResult.success(
        PopulationSnapshot.fromJson(result.data!),
        statusCode: result.statusCode,
      );
    } catch (e) {
      return ApiResult.failure('Failed to parse created snapshot: $e');
    }
  }

  /// GET api/vulnerability/infrastructure/{areaId}
  Future<ApiResult<List<CriticalInfrastructure>>> getInfrastructureByArea(
    String areaId,
  ) async {
    final result =
        await _getList(ApiConfig.vulnerabilityInfrastructureByArea(areaId));
    if (result.isFailure) {
      return ApiResult.failure(result.errorMessage!, statusCode: result.statusCode);
    }
    try {
      final list = result.data!
          .map((e) =>
              CriticalInfrastructure.fromJson(e as Map<String, dynamic>))
          .toList();
      return ApiResult.success(list, statusCode: result.statusCode);
    } catch (e) {
      return ApiResult.failure('Failed to parse infrastructure: $e');
    }
  }

  /// POST api/vulnerability/calculate-impact
  ///
  /// Core business operation: calculates population exposure, vulnerability
  /// weight, and severity classification for a disaster event.
  Future<ApiResult<ImpactAssessment>> calculateImpact({
    required String disasterEventId,
    required String affectedAreaId,
    required String hazardSeverity, // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    double? floodDepthOrRadius,
    String? workflowId,
  }) async {
    final result = await _post(
      ApiConfig.vulnerabilityCalculateImpact,
      {
        'disasterEventId': disasterEventId,
        'affectedAreaId': affectedAreaId,
        'hazardSeverity': hazardSeverity,
        if (floodDepthOrRadius != null)
          'floodDepthOrRadius': floodDepthOrRadius,
        if (workflowId != null) 'workflowId': workflowId,
      },
    );

    if (result.isFailure) {
      return ApiResult.failure(result.errorMessage!, statusCode: result.statusCode);
    }
    try {
      return ApiResult.success(
        ImpactAssessment.fromJson(result.data!),
        statusCode: result.statusCode,
      );
    } catch (e) {
      return ApiResult.failure('Failed to parse impact assessment: $e');
    }
  }

  /// GET api/vulnerability/impact-assessments/{disasterEventId}
  Future<ApiResult<List<ImpactAssessment>>> getImpactAssessments(
    String disasterEventId,
  ) async {
    final result = await _getList(
      ApiConfig.vulnerabilityImpactAssessments(disasterEventId),
    );
    if (result.isFailure) {
      return ApiResult.failure(result.errorMessage!, statusCode: result.statusCode);
    }
    try {
      final list = result.data!
          .map((e) => ImpactAssessment.fromJson(e as Map<String, dynamic>))
          .toList();
      return ApiResult.success(list, statusCode: result.statusCode);
    } catch (e) {
      return ApiResult.failure('Failed to parse impact assessments: $e');
    }
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  /// Disposes the underlying HTTP client. Call on app teardown.
  void dispose() => _client.close();
}
