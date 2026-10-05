import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../data/datasources/resource_remote_data_source.dart';
import '../data/models/resource_model.dart';
import '../data/repositories/resource_repository.dart';

class ResourceOptimizationProvider extends ChangeNotifier {
  late final ResourceRepository repository;

  ResourceOptimizationProvider() {
    final apiClient = ApiClient();
    final dataSource = ResourceRemoteDataSource(apiClient);
    repository = ResourceRepository(dataSource);
  }

  List<ResourceModel> resources = [];

  bool isLoading = false;
  bool isUpdating = false;
  bool isDeleting = false;

  String? errorMessage;

  int get totalResourceTypes => resources.length;

  int get totalAvailable {
    return resources.fold(
      0,
      (sum, resource) => sum + resource.availableQuantity,
    );
  }

  int get totalAllocated {
    return resources.fold(
      0,
      (sum, resource) => sum + resource.allocatedQuantity,
    );
  }

  int get totalRemaining {
    return resources.fold(
      0,
      (sum, resource) => sum + resource.remainingQuantity,
    );
  }

  double get allocationCoverage {
    final total = totalAvailable + totalAllocated;

    if (total <= 0) return 0;

    return totalAllocated / total;
  }

  Future<void> loadResources() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      resources = await repository.getResources();
    } catch (e) {
      errorMessage = _friendlyError(e);
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateResource(ResourceModel resource) async {
    isUpdating = true;
    errorMessage = null;
    notifyListeners();

    try {
      final updated = await repository.updateResource(resource);

      final index = resources.indexWhere(
        (item) => item.id == updated.id,
      );

      if (index != -1) {
        resources[index] = updated;
      } else {
        resources.add(updated);
      }

      return true;
    } catch (e) {
      errorMessage = _friendlyError(e);
      return false;
    } finally {
      isUpdating = false;
      notifyListeners();
    }
  }

  Future<bool> deleteResource(String id) async {
    isDeleting = true;
    errorMessage = null;
    notifyListeners();

    try {
      await repository.deleteResource(id);

      resources.removeWhere(
        (resource) => resource.id == id,
      );

      return true;
    } catch (e) {
      errorMessage = _friendlyError(e);
      return false;
    } finally {
      isDeleting = false;
      notifyListeners();
    }
  }

  String _friendlyError(Object error) {
    if (error is DioException) {
      final statusCode = error.response?.statusCode;

      if (statusCode == 401) {
        return 'Your session has expired. Please sign in again.';
      }

      if (statusCode == 403) {
        return 'You do not have permission to manage resources.';
      }

      if (statusCode == 404) {
        return 'The requested resource was not found.';
      }

      final data = error.response?.data;

      if (data is Map && data['message'] != null) {
        return data['message'].toString();
      }

      return error.message ?? 'Unable to connect to the server.';
    }

    return error.toString().replaceFirst('Exception: ', '');
  }
}