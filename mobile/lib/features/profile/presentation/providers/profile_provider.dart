import 'package:flutter/foundation.dart';

import '../../data/models/user_profile_model.dart';
import '../../data/repositories/profile_repository.dart';

class ProfileProvider extends ChangeNotifier {
  final ProfileRepository repository;

  ProfileProvider(this.repository);

  UserProfileModel? _profile;
  bool _isLoading = false;
  bool _isSaving = false;
  String? _error;

  UserProfileModel? get profile => _profile;
  bool get isLoading => _isLoading;
  bool get isSaving => _isSaving;
  String? get error => _error;

  Future<void> loadProfile() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _profile = await repository.getMyProfile();
    } catch (e) {
      _error = 'Unable to load your profile.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateProfile({
    required String fullName,
    required String email,
  }) async {
    _isSaving = true;
    _error = null;
    notifyListeners();

    try {
      _profile = await repository.updateMyProfile(
        fullName: fullName,
        email: email,
      );

      return true;
    } catch (e) {
      _error = 'Unable to update your profile.';
      return false;
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }
}

