import '../datasources/profile_remote_datasource.dart';
import '../models/user_profile_model.dart';

class ProfileRepository {
  final ProfileRemoteDataSource remote;

  ProfileRepository(this.remote);

  Future<UserProfileModel> getMyProfile() async {
    final data = await remote.getMyProfile();
    return UserProfileModel.fromJson(data);
  }

  Future<UserProfileModel> updateMyProfile({
    required String fullName,
    required String email,
  }) async {
    final data = await remote.updateMyProfile(
      fullName: fullName,
      email: email,
    );

    return UserProfileModel.fromJson(data);
  }
}
