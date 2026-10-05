import 'package:flutter/foundation.dart';

import '../data/models/notification_model.dart';
import '../data/repositories/notification_repository.dart';

class NotificationProvider extends ChangeNotifier {
  final NotificationRepository repository;

  NotificationProvider({
    required this.repository,
  });

  bool loading = false;
  bool markingAllRead = false;

  String? error;

  List<NotificationModel> notifications = [];

  int get unreadCount =>
      notifications.where((notification) => !notification.isRead).length;

  Future<void> loadNotifications() async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      notifications = await repository.getNotifications();
    } catch (e) {
      error = e.toString();
    }

    loading = false;
    notifyListeners();
  }

  Future<bool> markAsRead(String id) async {
    try {
      final updated = await repository.markAsRead(id);

      final index =
          notifications.indexWhere((notification) => notification.id == id);

      if (index != -1) {
        notifications[index] = updated;
        notifyListeners();
      }

      return true;
    } catch (e) {
      error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> markAllAsRead() async {
    if (unreadCount == 0) return true;

    markingAllRead = true;
    error = null;
    notifyListeners();

    try {
      await repository.markAllAsRead();

      notifications = notifications
          .map(
            (notification) => notification.copyWith(isRead: true),
          )
          .toList();

      return true;
    } catch (e) {
      error = e.toString();
      return false;
    } finally {
      markingAllRead = false;
      notifyListeners();
    }
  }
}
