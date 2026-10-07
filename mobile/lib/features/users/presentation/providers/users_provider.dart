import 'package:flutter/foundation.dart';

import '../../../../core/network/api_client.dart';
import '../../data/datasources/users_remote_datasource.dart';
import '../../data/models/admin_user_model.dart';
import '../../data/repositories/users_repository.dart';

class UsersProvider extends ChangeNotifier {
  final UsersRepository _repository;

  UsersProvider()
    : _repository = UsersRepository(UsersRemoteDataSource(ApiClient()));

  List<AdminUserModel> _users = [];
  AdminUserModel? _selectedUser;

  bool _isLoading = false;
  bool _isDeleting = false;
  String? _error;

  String _searchQuery = '';

  List<AdminUserModel> get users => _users;

  AdminUserModel? get selectedUser => _selectedUser;

  bool get isLoading => _isLoading;

  bool get isDeleting => _isDeleting;

  String? get error => _error;

  String get searchQuery => _searchQuery;

  List<AdminUserModel> get filteredUsers {
    final query = _searchQuery.trim().toLowerCase();

    if (query.isEmpty) {
      return _users;
    }

    return _users.where((user) {
      return user.fullName.toLowerCase().contains(query) ||
          user.email.toLowerCase().contains(query) ||
          user.role.toLowerCase().contains(query) ||
          (user.district?.toLowerCase().contains(query) ?? false);
    }).toList();
  }

  int get activeCount => _users.where((user) => user.isActive).length;

  int get inactiveCount => _users.where((user) => !user.isActive).length;

  Map<String, int> get roleCounts {
    final counts = <String, int>{};

    for (final user in _users) {
      counts[user.role] = (counts[user.role] ?? 0) + 1;
    }

    return counts;
  }

  Future<void> loadUsers() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _users = await _repository.getUsers();
    } catch (error) {
      _error = _repository.errorMessage(error);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadUser(String id) async {
    _error = null;

    try {
      _selectedUser = await _repository.getUserById(id);
      notifyListeners();
    } catch (error) {
      _error = _repository.errorMessage(error);
      notifyListeners();
    }
  }

  Future<bool> deleteUser(String id) async {
    _isDeleting = true;
    _error = null;
    notifyListeners();

    try {
      await _repository.deleteUser(id);

      _users.removeWhere((user) => user.id == id);

      if (_selectedUser?.id == id) {
        _selectedUser = null;
      }

      return true;
    } catch (error) {
      _error = _repository.errorMessage(error);
      return false;
    } finally {
      _isDeleting = false;
      notifyListeners();
    }
  }

  void setSearchQuery(String value) {
    _searchQuery = value;
    notifyListeners();
  }

  void clearSelectedUser() {
    _selectedUser = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
