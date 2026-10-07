import '../datasources/disaster_report_remote_datasource.dart';
import '../models/disaster_report_model.dart';

class DisasterReportRepository {
  final DisasterReportRemoteDataSource remote;

  DisasterReportRepository(this.remote);

  Future<List<DisasterReportModel>> getAll() async {
    final rows = await remote.getAll();
    return rows.map(DisasterReportModel.fromJson).toList();
  }

  Future<List<DisasterReportModel>> getMy() async {
    final rows = await remote.getMy();
    return rows.map(DisasterReportModel.fromJson).toList();
  }

  Future<List<DisasterReportModel>> getAssignedToMe() async {
    final rows = await remote.getAssignedToMe();
    return rows.map(DisasterReportModel.fromJson).toList();
  }

  Future<DisasterReportModel> create(Map<String, dynamic> body) async {
    final row = await remote.create(body);
    return DisasterReportModel.fromJson(row);
  }

  Future<void> review(String id) => remote.review(id);

  Future<void> verify(String id) => remote.verify(id);

  Future<void> assign(String id, String volunteerId) =>
      remote.assign(id, volunteerId);

  Future<void> resolve(String id) => remote.resolve(id);

  Future<void> reject(String id) => remote.reject(id);

  Future<void> fieldStart(String id) => remote.fieldStart(id);

  Future<void> fieldUpdate(
    String id, {
    required String notes,
    String? situation,
    double? latitude,
    double? longitude,
  }) => remote.fieldUpdate(
    id,
    notes: notes,
    situation: situation,
    latitude: latitude,
    longitude: longitude,
  );

  Future<void> fieldComplete(String id) => remote.fieldComplete(id);

  Future<void> updateStatus(String id, String status) =>
      remote.updateStatus(id, status);

  Future<List<Map<String, dynamic>>> getUsers() => remote.getUsers();
}
