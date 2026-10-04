import '../datasources/notification_remote_datasource.dart';
import '../models/notification_model.dart';

class NotificationRepository {
  final NotificationRemoteDataSource _remoteDataSource;

  NotificationRepository(this._remoteDataSource);

  Future<List<NotificationModel>> getNotifications() {
    return _remoteDataSource.getNotifications();
  }

  Future<NotificationModel> markAsRead(String id) {
    return _remoteDataSource.markAsRead(id);
  }

  Future<void> markAllAsRead() {
    return _remoteDataSource.markAllAsRead();
  }
}
