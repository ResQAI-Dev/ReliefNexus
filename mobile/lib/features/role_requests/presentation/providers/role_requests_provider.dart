import 'package:flutter/foundation.dart';

import '../../../../core/network/api_client.dart';
import '../../data/datasources/role_request_remote_datasource.dart';
import '../../data/models/role_request_model.dart';
import '../../data/repositories/role_request_repository.dart';

class RoleRequestsProvider extends ChangeNotifier {
  final RoleRequestRepository _repository = RoleRequestRepository(
    RoleRequestRemoteDataSource(ApiClient()),
  );

  bool _loading = false;
  String? _error;
  String? _processingId;
  List<RoleRequestModel> _items = [];

  bool get loading => _loading;
  String? get error => _error;
  String? get processingId => _processingId;
  List<RoleRequestModel> get items => List.unmodifiable(_items);

  int get total => _items.length;

  Future<void> load() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _items = await _repository.getPending();
    } catch (e) {
      _error = _message(e);
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<bool> approve(RoleRequestModel item) async {
    return _process(item, approve: true);
  }

  Future<bool> reject(RoleRequestModel item) async {
    return _process(item, approve: false);
  }

  Future<bool> _process(RoleRequestModel item, {required bool approve}) async {
    _processingId = item.id;
    _error = null;
    notifyListeners();

    try {
      if (approve) {
        await _repository.approve(item.id);
      } else {
        await _repository.reject(item.id);
      }
      _items.removeWhere((e) => e.id == item.id);
      return true;
    } catch (e) {
      _error = _message(e);
      return false;
    } finally {
      _processingId = null;
      notifyListeners();
    }
  }

  String _message(Object e) {
    if (e.toString().contains('403'))
      return 'Administrator permission is required.';
    if (e.toString().contains('401'))
      return 'Your session has expired. Please sign in again.';
    return 'Unable to complete the request. Please try again.';
  }
}
