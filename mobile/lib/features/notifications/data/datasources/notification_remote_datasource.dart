import '../../../../core/network/api_client.dart';
import '../models/notification_model.dart';

class NotificationRemoteDataSource {
  final ApiClient _apiClient;

  NotificationRemoteDataSource(this._apiClient);

  Future<List<NotificationModel>> getNotifications() async {
    final response = await _apiClient.dio.get('/api/notifications');

    final data = response.data;

    if (data is! List) {
      return const [];
    }

    return data
        .whereType<Map>()
        .map(
          (item) => NotificationModel.fromJson(
            Map<String, dynamic>.from(item),
          ),
        )
        .toList();
  }

  Future<NotificationModel> markAsRead(String id) async {
    final response =
        await _apiClient.dio.put('/api/notifications/$id/read');

    return NotificationModel.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<void> markAllAsRead() async {
    await _apiClient.dio.put('/api/notifications/read-all');
  }
}
