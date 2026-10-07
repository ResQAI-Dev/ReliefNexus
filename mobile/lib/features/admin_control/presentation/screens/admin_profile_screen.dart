import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import 'package:reliefnexus_mobile/core/network/api_client.dart';
import 'package:reliefnexus_mobile/core/storage/secure_storage_service.dart';
import 'package:reliefnexus_mobile/features/auth/presentation/screens/login_screen.dart';

class AdminProfilePage extends StatefulWidget {
  const AdminProfilePage({super.key});

  @override
  State<AdminProfilePage> createState() => _AdminProfilePageState();
}

class _AdminProfilePageState extends State<AdminProfilePage> {
  static const _navy = Color(0xFF061B3A);
  static const _blue = Color(0xFF1769FF);
  static const _cyan = Color(0xFF19C7E8);
  static const _bg = Color(0xFFF1F6FB);
  static const _textColor = Color(0xFF10243E);
  static const _muted = Color(0xFF71809B);
  static const _green = Color(0xFF18A66A);

  final ApiClient _client = ApiClient();
  final ImagePicker _picker = ImagePicker();

  bool _loading = true;
  bool _saving = false;
  bool _uploading = false;

  String? _error;
  Map<String, dynamic>? _user;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final response = await _client.dio.get('/Users/me');

      if (!mounted) return;

      final data = response.data;

      setState(() {
        _user = data is Map
            ? Map<String, dynamic>.from(data)
            : <String, dynamic>{};
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _loading = false;
        _error = 'Unable to load your profile.';
      });
    }
  }

  String _text(String key, [String fallback = 'Not provided']) {
    final value = _user?[key];

    if (value == null) return fallback;

    final text = value.toString().trim();

    if (text.isEmpty || text == 'null') {
      return fallback;
    }

    return text;
  }

  String _date(String key) {
    final value = _user?[key];

    if (value == null) return 'Not provided';

    final date = DateTime.tryParse(value.toString());

    if (date == null) return value.toString();

    return '${date.day.toString().padLeft(2, '0')}/'
        '${date.month.toString().padLeft(2, '0')}/'
        '${date.year}';
  }

  List<String> _permissions() {
    final value = _user?['permissions'];

    if (value is List) {
      return value.map((e) => e.toString()).toList();
    }

    return const [];
  }

  bool get _isActive => _user?['isActive'] == true;

  String? get _profileImage {
    final value = _user?['profileImageUrl']?.toString().trim();

    if (value == null || value.isEmpty || value == 'null') {
      return null;
    }

    return value;
  }

  Future<void> _editProfile() async {
    final fullNameController = TextEditingController(
      text: _text('fullName', ''),
    );

    final emailController = TextEditingController(text: _text('email', ''));

    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
            ),
            padding: const EdgeInsets.fromLTRB(22, 12, 22, 24),
            child: SafeArea(
              top: false,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 42,
                      height: 4,
                      decoration: BoxDecoration(
                        color: const Color(0xFFD7E1EC),
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Edit Profile',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: _navy,
                    ),
                  ),
                  const SizedBox(height: 5),
                  const Text(
                    'Update your account information.',
                    style: TextStyle(fontSize: 13, color: _muted),
                  ),
                  const SizedBox(height: 22),
                  _field(
                    controller: fullNameController,
                    label: 'Full Name',
                    icon: Icons.person_outline_rounded,
                  ),
                  const SizedBox(height: 14),
                  _field(
                    controller: emailController,
                    label: 'Email Address',
                    icon: Icons.email_outlined,
                    keyboardType: TextInputType.emailAddress,
                  ),
                  const SizedBox(height: 22),
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed: _saving
                          ? null
                          : () async {
                              final name = fullNameController.text.trim();
                              final email = emailController.text.trim();

                              if (name.isEmpty || email.isEmpty) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'Full name and email are required.',
                                    ),
                                  ),
                                );
                                return;
                              }

                              Navigator.pop(context, true);

                              await _saveProfile(name, email);
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _blue,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(17),
                        ),
                      ),
                      child: _saving
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: Colors.white,
                              ),
                            )
                          : const Text(
                              'Save Changes',
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 15,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );

    fullNameController.dispose();
    emailController.dispose();

    if (result == true && mounted) {
      await _loadProfile();
    }
  }

  Future<void> _saveProfile(String fullName, String email) async {
    setState(() {
      _saving = true;
    });

    try {
      final response = await _client.dio.put(
        '/Users/me',
        data: {'fullName': fullName, 'email': email},
      );

      if (!mounted) return;

      final data = response.data;

      setState(() {
        if (data is Map) {
          _user = Map<String, dynamic>.from(data);
        }
        _saving = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile updated successfully.'),
          backgroundColor: _green,
        ),
      );
    } on DioException catch (e) {
      if (!mounted) return;

      setState(() {
        _saving = false;
      });

      final message = e.response?.data is Map
          ? e.response?.data['message']?.toString()
          : null;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message ?? 'Unable to update your profile.')),
      );
    } catch (_) {
      if (!mounted) return;

      setState(() {
        _saving = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to update your profile.')),
      );
    }
  }

  Future<void> _changePhoto() async {
    try {
      final image = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 88,
        maxWidth: 1600,
        maxHeight: 1600,
      );

      if (image == null) return;

      setState(() {
        _uploading = true;
      });

      final formData = FormData.fromMap({
        'image': await MultipartFile.fromFile(image.path, filename: image.name),
      });

      final response = await _client.dio.post(
        '/Users/me/profile-image',
        data: formData,
      );

      if (!mounted) return;

      final data = response.data;

      setState(() {
        if (data is Map) {
          _user = Map<String, dynamic>.from(data);
        }
        _uploading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile photo updated.'),
          backgroundColor: _green,
        ),
      );
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _uploading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to upload profile photo.')),
      );
    }
  }

  Future<void> _removePhoto() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Remove profile photo?'),
          content: const Text('Your current profile photo will be removed.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Remove'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) return;

    try {
      setState(() {
        _uploading = true;
      });

      final response = await _client.dio.delete('/Users/me/profile-image');

      if (!mounted) return;

      final data = response.data;

      setState(() {
        if (data is Map) {
          _user = Map<String, dynamic>.from(data);
        } else {
          _user?['profileImageUrl'] = null;
        }
        _uploading = false;
      });

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Profile photo removed.')));
    } catch (_) {
      if (!mounted) return;

      setState(() {
        _uploading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to remove profile photo.')),
      );
    }
  }

  Widget _field({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: _blue),
        filled: true,
        fillColor: const Color(0xFFF5F8FC),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }

  void _photoOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 22),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Profile Photo',
                  style: TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w900,
                    color: _navy,
                  ),
                ),
                const SizedBox(height: 16),
                ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Color(0xFFEAF2FF),
                    child: Icon(Icons.photo_library_rounded, color: _blue),
                  ),
                  title: const Text('Choose Photo'),
                  subtitle: const Text('Select a new profile image'),
                  onTap: () {
                    Navigator.pop(context);
                    _changePhoto();
                  },
                ),
                if (_profileImage != null)
                  ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: Color(0xFFFFEEEE),
                      child: Icon(
                        Icons.delete_outline_rounded,
                        color: Colors.red,
                      ),
                    ),
                    title: const Text('Remove Photo'),
                    subtitle: const Text('Remove your current profile image'),
                    onTap: () {
                      Navigator.pop(context);
                      _removePhoto();
                    },
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _avatar() {
    final image = _profileImage;

    return Stack(
      alignment: Alignment.bottomRight,
      children: [
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(colors: [_cyan, _blue]),
            boxShadow: const [
              BoxShadow(
                color: Color(0x25071A3D),
                blurRadius: 20,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: CircleAvatar(
            radius: 58,
            backgroundColor: Colors.white,
            backgroundImage: image != null ? NetworkImage(image) : null,
            child: image == null
                ? Text(
                    _text('fullName', 'A').trim().isNotEmpty
                        ? _text(
                            'fullName',
                            'A',
                          ).trim().substring(0, 1).toUpperCase()
                        : 'A',
                    style: const TextStyle(
                      fontSize: 38,
                      fontWeight: FontWeight.w900,
                      color: _blue,
                    ),
                  )
                : null,
          ),
        ),
        GestureDetector(
          onTap: _uploading ? null : _photoOptions,
          child: Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: _blue,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 3),
            ),
            child: _uploading
                ? const Padding(
                    padding: EdgeInsets.all(9),
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(
                    Icons.camera_alt_rounded,
                    color: Colors.white,
                    size: 18,
                  ),
          ),
        ),
      ],
    );
  }

  Widget _infoCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE1EAF4)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0D071A3D),
            blurRadius: 18,
            offset: Offset(0, 7),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF7FF),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(icon, color: _blue, size: 20),
              ),
              const SizedBox(width: 11),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  color: _navy,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          ...children,
        ],
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 19, color: _muted),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: _muted,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: _textColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _permissionChips() {
    final permissions = _permissions();

    if (permissions.isEmpty) {
      return const Text(
        'No permissions assigned',
        style: TextStyle(color: _muted, fontWeight: FontWeight.w600),
      );
    }

    return Wrap(
      spacing: 7,
      runSpacing: 7,
      children: permissions.map((permission) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
          decoration: BoxDecoration(
            color: const Color(0xFFEAF2FF),
            borderRadius: BorderRadius.circular(30),
          ),
          child: Text(
            permission,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: _blue,
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _profileBody() {
    final fullName = _text('fullName', 'User');
    final role = _text('role', 'User');

    return RefreshIndicator(
      onRefresh: _loadProfile,
      color: _blue,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        slivers: [
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 30),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [_navy, Color(0xFF0B3760), _blue],
                ),
                borderRadius: BorderRadius.vertical(
                  bottom: Radius.circular(34),
                ),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'My Profile',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: _loadProfile,
                        icon: const Icon(
                          Icons.refresh_rounded,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _avatar(),
                  const SizedBox(height: 16),
                  Text(
                    fullName,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 23,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    role,
                    style: const TextStyle(
                      color: Color(0xFFBDEBFF),
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 13),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 13,
                      vertical: 7,
                    ),
                    decoration: BoxDecoration(
                      color: _isActive
                          ? const Color(0x3322C55E)
                          : const Color(0x33FFFFFF),
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(
                        color: _isActive
                            ? const Color(0x6648E58A)
                            : const Color(0x55FFFFFF),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 7,
                          height: 7,
                          decoration: BoxDecoration(
                            color: _isActive
                                ? const Color(0xFF55E89A)
                                : Colors.white,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 7),
                        Text(
                          _isActive ? 'Active Account' : 'Inactive Account',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: _editProfile,
                      icon: const Icon(Icons.edit_rounded, size: 18),
                      label: const Text(
                        'Edit Profile',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: _blue,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 30),
            sliver: SliverToBoxAdapter(
              child: Column(
                children: [
                  _infoCard(
                    title: 'Personal Information',
                    icon: Icons.person_outline_rounded,
                    children: [
                      _detailRow(
                        Icons.person_outline_rounded,
                        'Full Name',
                        fullName,
                      ),
                      _detailRow(
                        Icons.email_outlined,
                        'Email Address',
                        _text('email'),
                      ),
                      _detailRow(
                        Icons.phone_outlined,
                        'Phone Number',
                        _text('phoneNumber'),
                      ),
                      _detailRow(
                        Icons.location_on_outlined,
                        'Address',
                        _text('address'),
                      ),
                      _detailRow(
                        Icons.map_outlined,
                        'District',
                        _text('district'),
                      ),
                      _detailRow(
                        Icons.cake_outlined,
                        'Date of Birth',
                        _date('dateOfBirth'),
                      ),
                      _detailRow(Icons.wc_outlined, 'Gender', _text('gender')),
                    ],
                  ),

                  _infoCard(
                    title: 'Emergency Contact',
                    icon: Icons.emergency_outlined,
                    children: [
                      _detailRow(
                        Icons.person_outline_rounded,
                        'Contact Name',
                        _text('emergencyContactName'),
                      ),
                      _detailRow(
                        Icons.phone_outlined,
                        'Contact Phone',
                        _text('emergencyContactPhone'),
                      ),
                    ],
                  ),

                  _infoCard(
                    title: 'Account & Security',
                    icon: Icons.security_rounded,
                    children: [
                      _detailRow(Icons.badge_outlined, 'Account Role', role),
                      _detailRow(
                        Icons.calendar_today_outlined,
                        'Member Since',
                        _date('createdAt'),
                      ),
                      _detailRow(
                        _isActive
                            ? Icons.check_circle_outline_rounded
                            : Icons.block_outlined,
                        'Account Status',
                        _isActive ? 'Active' : 'Inactive',
                      ),
                      const Text(
                        'Permissions',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: _muted,
                        ),
                      ),
                      const SizedBox(height: 10),
                      _permissionChips(),
                    ],
                  ),

                  const SizedBox(height: 20),

                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFE8D7D7)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x0D061B3A),
                          blurRadius: 18,
                          offset: Offset(0, 7),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Account Actions',
                          style: TextStyle(
                            color: _textColor,
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 5),
                        const Text(
                          'Sign out from your ReliefNexus account.',
                          style: TextStyle(
                            color: _muted,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 13),
                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: OutlinedButton.icon(
                            onPressed: _saving ? null : _signOut,
                            icon: const Icon(Icons.logout_rounded, size: 19),
                            label: const Text(
                              'Sign Out',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFFE53935),
                              side: const BorderSide(
                                color: Color(0xFFE53935),
                                width: 1.4,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(15),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _signOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.logout_rounded, color: Color(0xFFE53935)),
            SizedBox(width: 10),
            Text('Sign Out', style: TextStyle(fontWeight: FontWeight.w800)),
          ],
        ),
        content: const Text(
          'Are you sure you want to sign out of your account?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE53935),
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'Sign Out',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _saving = true);

    try {
      await SecureStorageService.clear();

      if (!mounted) return;

      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginPage()),
        (route) => false,
      );
    } catch (_) {
      if (!mounted) return;

      setState(() => _saving = false);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to sign out. Please try again.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: _blue))
            : _error != null
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.cloud_off_rounded,
                        size: 50,
                        color: _muted,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _error!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: _muted,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 18),
                      ElevatedButton(
                        onPressed: _loadProfile,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              )
            : _profileBody(),
      ),
    );
  }
}

