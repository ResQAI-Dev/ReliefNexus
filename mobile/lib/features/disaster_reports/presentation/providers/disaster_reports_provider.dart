import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../../../core/network/api_client.dart';
import '../../data/datasources/disaster_report_remote_datasource.dart';
import '../../data/models/disaster_report_model.dart';
import '../../data/repositories/disaster_report_repository.dart';

class VolunteerOption {
  final String id;
  final String name;
  final String email;

  const VolunteerOption({
    required this.id,
    required this.name,
    required this.email,
  });

  factory VolunteerOption.fromJson(Map<String, dynamic> json) {
    return VolunteerOption(
      id: '${json['id'] ?? ''}',
      name: '${json['fullName'] ?? 'Unknown volunteer'}',
      email: '${json['email'] ?? ''}',
    );
  }
}

class DisasterReportsProvider extends ChangeNotifier {
  final DisasterReportRepository _repository = DisasterReportRepository(
    DisasterReportRemoteDataSource(ApiClient()),
  );

  bool _loading = false;
  String? _error;

  List<DisasterReportModel> _items = [];
  List<VolunteerOption> _volunteers = [];

  String _query = '';
  String _severity = 'All';
  String _status = 'All';

  String? _processingId;

  bool get loading => _loading;
  String? get error => _error;
  String? get processingId => _processingId;

  String get query => _query;
  String get severity => _severity;
  String get status => _status;

  List<DisasterReportModel> get items => List.unmodifiable(_items);

  List<VolunteerOption> get volunteers => List.unmodifiable(_volunteers);

  List<String> get severities => const [
    'All',
    'Critical',
    'High',
    'Medium',
    'Low',
  ];

  List<String> get statuses {
    final result = <String>{'All'};

    for (final item in _items) {
      if (item.status.trim().isNotEmpty) {
        result.add(item.status);
      }
    }

    return result.toList();
  }

  List<DisasterReportModel> get filtered {
    final q = _query.trim().toLowerCase();

    return _items.where((item) {
      final text =
          '${item.disasterType} '
                  '${item.location} '
                  '${item.reporterName} '
                  '${item.reporterEmail} '
                  '${item.description} '
                  '${item.assignedVolunteerName ?? ''}'
              .toLowerCase();

      final queryOk = q.isEmpty || text.contains(q);

      final severityOk =
          _severity == 'All' ||
          item.severity.toLowerCase() == _severity.toLowerCase();

      final statusOk =
          _status == 'All' ||
          item.status.toLowerCase() == _status.toLowerCase();

      return queryOk && severityOk && statusOk;
    }).toList();
  }

  int countSeverity(String value) {
    return _items
        .where((item) => item.severity.toLowerCase() == value.toLowerCase())
        .length;
  }

  Future<void> load() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _items = await _repository.getAll();
      await _loadVolunteers();
    } catch (e) {
      _error = _message(e);
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> _loadVolunteers() async {
    try {
      final rows = await _repository.getUsers();

      _volunteers = rows
          .where(
            (user) => '${user['role'] ?? ''}'.toLowerCase() == 'fieldvolunteer',
          )
          .where((user) => user['isActive'] != false)
          .map(VolunteerOption.fromJson)
          .where((volunteer) => volunteer.id.isNotEmpty)
          .toList();
    } catch (_) {
      _volunteers = [];
    }
  }

  void setQuery(String value) {
    _query = value;
    notifyListeners();
  }

  void setSeverity(String value) {
    _severity = value;
    notifyListeners();
  }

  void setStatus(String value) {
    _status = value;
    notifyListeners();
  }

  Future<bool> create({
    required String disasterType,
    required String location,
    required String description,
    required String severity,
    double? latitude,
    double? longitude,
  }) async {
    try {
      _error = null;

      await _repository.create({
        'disasterType': disasterType,
        'description': description,
        'location': location,
        'severity': severity,
        'latitude': latitude,
        'longitude': longitude,
      });

      await load();

      return true;
    } catch (e) {
      _error = _message(e);
      notifyListeners();
      return false;
    }
  }

  Future<bool> review(DisasterReportModel item) =>
      _run(item, () => _repository.review(item.id));

  Future<bool> verify(DisasterReportModel item) =>
      _run(item, () => _repository.verify(item.id));

  Future<bool> assign(DisasterReportModel item, String volunteerId) =>
      _run(item, () => _repository.assign(item.id, volunteerId));

  Future<bool> resolve(DisasterReportModel item) =>
      _run(item, () => _repository.resolve(item.id));

  Future<bool> reject(DisasterReportModel item) =>
      _run(item, () => _repository.reject(item.id));

  Future<bool> fieldStart(DisasterReportModel item) =>
      _run(item, () => _repository.fieldStart(item.id));

  Future<bool> fieldComplete(DisasterReportModel item) =>
      _run(item, () => _repository.fieldComplete(item.id));

  Future<bool> fieldUpdate(
    DisasterReportModel item, {
    required String notes,
    String? situation,
    double? latitude,
    double? longitude,
  }) => _run(
    item,
    () => _repository.fieldUpdate(
      item.id,
      notes: notes,
      situation: situation,
      latitude: latitude,
      longitude: longitude,
    ),
  );

  Future<bool> updateStatus(DisasterReportModel item, String status) =>
      _run(item, () => _repository.updateStatus(item.id, status));

  Future<bool> _run(
    DisasterReportModel item,
    Future<void> Function() action,
  ) async {
    _processingId = item.id;
    _error = null;
    notifyListeners();

    try {
      await action();
      await load();
      return true;
    } catch (e) {
      debugPrint('DISASTER ACTION ERROR: $e');

      if (e is DioException) {
        debugPrint('DISASTER ACTION STATUS: ${e.response?.statusCode}');
        debugPrint('DISASTER ACTION RESPONSE: ${e.response?.data}');
        debugPrint('DISASTER ACTION URL: ${e.requestOptions.uri}');
      }

      _error = _message(e);
      notifyListeners();
      return false;
    } finally {
      _processingId = null;
      notifyListeners();
    }
  }

  String _message(Object error) {
    if (error is DioException) {
      final code = error.response?.statusCode;

      if (code == 401) {
        return 'Your session has expired. Please sign in again.';
      }

      if (code == 403) {
        return 'This action is not permitted for the current account.';
      }

      if (code == 404) {
        return 'The requested incident record was not found.';
      }

      if (code == 400) {
        final data = error.response?.data;
        if (data != null) {
          return data.toString();
        }
      }
    }

    return 'The disaster report operation could not be completed.';
  }
}
