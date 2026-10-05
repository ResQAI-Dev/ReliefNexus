import '../datasources/users_remote_datasource.dart';
import '../models/admin_user_model.dart';

class UsersRepository {
  final UsersRemoteDataSource _remoteDataSource;

  UsersRepository(this._remoteDataSource);

  Future<List<AdminUserModel>> getUsers() {
    return _remoteDataSource.getUsers();
  }

  Future<AdminUserModel> getUserById(String id) {
    return _remoteDataSource.getUserById(id);
  }

  Future<void> deleteUser(String id) {
    return _remoteDataSource.deleteUser(id);
  }

  String errorMessage(Object error) {
    return _remoteDataSource.errorMessage(error);
  }
}
