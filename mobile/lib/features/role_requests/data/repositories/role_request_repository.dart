import '../datasources/role_request_remote_datasource.dart';
import '../models/role_request_model.dart';

class RoleRequestRepository {
  final RoleRequestRemoteDataSource remote;
  RoleRequestRepository(this.remote);

  Future<List<RoleRequestModel>> getPending() async {
    final rows = await remote.getPending();
    return rows.map(RoleRequestModel.fromJson).toList();
  }

  Future<void> approve(String id) => remote.approve(id);
  Future<void> reject(String id) => remote.reject(id);
}
