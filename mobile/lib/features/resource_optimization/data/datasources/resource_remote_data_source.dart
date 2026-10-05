import 'package:dio/dio.dart';

import '../../../../core/network/api_client.dart';
import '../models/resource_model.dart';

class ResourceRemoteDataSource {
  final ApiClient apiClient;

  ResourceRemoteDataSource(this.apiClient);

  Future<List<ResourceModel>> getResources() async {
    final response = await apiClient.dio.get(
      '/resource-optimization/resources',
    );

    final data = response.data;

    if (data is! List) {
      throw Exception('Invalid resource inventory response.');
    }

    return data
        .map(
          (item) => ResourceModel.fromJson(
            Map<String, dynamic>.from(item as Map),
          ),
        )
        .toList();
  }

  Future<ResourceModel> updateResource(ResourceModel resource) async {
    final response = await apiClient.dio.put(
      '/resource-optimization/resources/${resource.id}',
      data: resource.toJson(),
    );

    if (response.data is! Map) {
      throw Exception('Invalid updated resource response.');
    }

    return ResourceModel.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<void> deleteResource(String id) async {
    await apiClient.dio.delete(
      '/resource-optimization/resources/$id',
    );
  }
}