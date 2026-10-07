import '../datasources/resource_remote_data_source.dart';
import '../models/resource_model.dart';

class ResourceRepository {
  final ResourceRemoteDataSource remoteDataSource;

  ResourceRepository(this.remoteDataSource);

  Future<List<ResourceModel>> getResources() {
    return remoteDataSource.getResources();
  }

  Future<ResourceModel> updateResource(ResourceModel resource) {
    return remoteDataSource.updateResource(resource);
  }

  Future<void> deleteResource(String id) {
    return remoteDataSource.deleteResource(id);
  }
}