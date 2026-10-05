import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../auth/providers/auth_provider.dart';

import '../../../../core/network/api_client.dart';
import '../../data/datasources/profile_remote_datasource.dart';
import '../../data/repositories/profile_repository.dart';
import '../providers/profile_provider.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => ProfileProvider(
        ProfileRepository(
          ProfileRemoteDataSource(ApiClient()),
        ),
      )..loadProfile(),
      child: const _ProfileView(),
    );
  }
}

class _ProfileView extends StatefulWidget {
  const _ProfileView();

  @override
  State<_ProfileView> createState() => _ProfileViewState();
}

class _ProfileViewState extends State<_ProfileView> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _nameController;
  late final TextEditingController _emailController;

  bool _editing = false;
  bool _controllersReady = false;

  static const mint = Color(0xFF19B89A);
  static const darkMint = Color(0xFF087F70);
  static const background = Color(0xFFF7FBFA);
  static const textDark = Color(0xFF102A2A);
  static const textGrey = Color(0xFF718383);

  @override
  void initState() {
    super.initState();

    _nameController = TextEditingController();
    _emailController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  void _syncControllers(ProfileProvider provider) {
    final profile = provider.profile;

    if (profile == null || _controllersReady) {
      return;
    }

    _nameController.text = profile.fullName;
    _emailController.text = profile.email;
    _controllersReady = true;
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final provider = context.read<ProfileProvider>();

    final success = await provider.updateProfile(
      fullName: _nameController.text.trim(),
      email: _emailController.text.trim(),
    );

    if (!mounted) return;

    if (success) {
      setState(() {
        _editing = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile updated successfully.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _cancelEdit(ProfileProvider provider) {
    final profile = provider.profile;

    if (profile != null) {
      _nameController.text = profile.fullName;
      _emailController.text = profile.email;
    }

    setState(() {
      _editing = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ProfileProvider>(
      builder: (context, provider, _) {
        _syncControllers(provider);

        return Scaffold(
          backgroundColor: background,
          appBar: AppBar(
            backgroundColor: background,
            elevation: 0,
            scrolledUnderElevation: 0,
            leading: IconButton(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(
                Icons.arrow_back_rounded,
                color: textDark,
              ),
            ),
            title: const Text(
              'My Profile',
              style: TextStyle(
                color: textDark,
                fontSize: 19,
                fontWeight: FontWeight.w800,
              ),
            ),
            centerTitle: true,
            actions: [
              if (provider.profile != null && !_editing)
                IconButton(
                  onPressed: () {
                    setState(() {
                      _editing = true;
                    });
                  },
                  icon: const Icon(
                    Icons.edit_rounded,
                    color: darkMint,
                  ),
                ),
            ],
          ),
          body: provider.isLoading
              ? const Center(
                  child: CircularProgressIndicator(
                    color: mint,
                  ),
                )
              : provider.profile == null
                  ? _buildError(provider)
                  : RefreshIndicator(
                      color: mint,
                      onRefresh: provider.loadProfile,
                      child: Form(
                        key: _formKey,
                        child: ListView(
                          physics: const AlwaysScrollableScrollPhysics(
                            parent: BouncingScrollPhysics(),
                          ),
                          padding: const EdgeInsets.fromLTRB(
                            18,
                            10,
                            18,
                            32,
                          ),
                          children: [
                            _buildProfileHeader(provider),
                            const SizedBox(height: 20),
                            _buildAccountCard(provider),
                            const SizedBox(height: 18),
                            _buildPersonalCard(provider),
                            const SizedBox(height: 18),
                            _buildContactCard(provider),
                            if (_editing) ...[
                              const SizedBox(height: 22),
                              _buildSaveButtons(provider),
                            ],
                          ],
                        ),
                      ),
                    ),
        );
      },
    );
  }

  Widget _buildProfileHeader(ProfileProvider provider) {
    final profile = provider.profile!;

    final initials = profile.fullName.trim().isEmpty
        ? '?'
        : profile.fullName
            .trim()
            .split(RegExp(r'\s+'))
            .take(2)
            .map((e) => e[0].toUpperCase())
            .join();

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFFE7FAF5),
            Color(0xFFD9F4EE),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
          color: mint.withValues(alpha: 0.12),
        ),
      ),
      child: Column(
        children: [
          Stack(
            alignment: Alignment.bottomRight,
            children: [
              Container(
                width: 92,
                height: 92,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.07),
                      blurRadius: 18,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    initials,
                    style: const TextStyle(
                      color: darkMint,
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: darkMint,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white,
                    width: 3,
                  ),
                ),
                child: const Icon(
                  Icons.person_rounded,
                  color: Colors.white,
                  size: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 15),
          Text(
            profile.fullName,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: textDark,
              fontSize: 21,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            profile.email,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: textGrey,
              fontSize: 12.5,
            ),
          ),
          const SizedBox(height: 13),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 13,
              vertical: 7,
            ),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.85),
              borderRadius: BorderRadius.circular(30),
            ),
            child: Text(
              profile.role,
              style: const TextStyle(
                color: darkMint,
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAccountCard(ProfileProvider provider) {
    final profile = provider.profile!;

    return _ProfileCard(
      title: 'Account Information',
      icon: Icons.verified_user_outlined,
      children: [
        if (_editing)
          _InputField(
            controller: _nameController,
            label: 'Full Name',
            icon: Icons.person_outline_rounded,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Full name is required';
              }
              return null;
            },
          )
        else
          _InfoRow(
            icon: Icons.person_outline_rounded,
            label: 'Full Name',
            value: profile.fullName,
          ),
        const SizedBox(height: 14),
        if (_editing)
          _InputField(
            controller: _emailController,
            label: 'Email Address',
            icon: Icons.email_outlined,
            keyboardType: TextInputType.emailAddress,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Email is required';
              }

              if (!value.contains('@')) {
                return 'Enter a valid email address';
              }

              return null;
            },
          )
        else
          _InfoRow(
            icon: Icons.email_outlined,
            label: 'Email Address',
            value: profile.email,
          ),
        const SizedBox(height: 14),
        _InfoRow(
          icon: Icons.badge_outlined,
          label: 'Role',
          value: profile.role,
        ),
        const SizedBox(height: 14),
        _InfoRow(
          icon: Icons.circle,
          label: 'Account Status',
          value: profile.isActive ? 'Active' : 'Inactive',
          valueColor:
              profile.isActive ? darkMint : const Color(0xFFB42318),
        ),
      ],
    );
  }

  Widget _buildPersonalCard(ProfileProvider provider) {
    final profile = provider.profile!;

    return _ProfileCard(
      title: 'Personal Information',
      icon: Icons.account_circle_outlined,
      children: [
        _InfoRow(
          icon: Icons.phone_outlined,
          label: 'Phone Number',
          value: _displayValue(profile.phoneNumber),
        ),
        const SizedBox(height: 14),
        _InfoRow(
          icon: Icons.cake_outlined,
          label: 'Date of Birth',
          value: profile.dateOfBirth == null
              ? 'Not provided'
              : '${profile.dateOfBirth!.day.toString().padLeft(2, '0')}/'
                  '${profile.dateOfBirth!.month.toString().padLeft(2, '0')}/'
                  '${profile.dateOfBirth!.year}',
        ),
        const SizedBox(height: 14),
        _InfoRow(
          icon: Icons.person_outline,
          label: 'Gender',
          value: _displayValue(profile.gender),
        ),
        const SizedBox(height: 14),
        _InfoRow(
          icon: Icons.location_city_outlined,
          label: 'District',
          value: _displayValue(profile.district),
        ),
        const SizedBox(height: 14),
        _InfoRow(
          icon: Icons.home_outlined,
          label: 'Address',
          value: _displayValue(profile.address),
        ),
      ],
    );
  }

  Widget _buildContactCard(ProfileProvider provider) {
    final profile = provider.profile!;

    return _ProfileCard(
      title: 'Emergency Contact',
      icon: Icons.contact_emergency_outlined,
      children: [
        _InfoRow(
          icon: Icons.person_outline_rounded,
          label: 'Contact Name',
          value: _displayValue(profile.emergencyContactName),
        ),
        const SizedBox(height: 14),
        _InfoRow(
          icon: Icons.phone_in_talk_outlined,
          label: 'Contact Phone',
          value: _displayValue(profile.emergencyContactPhone),
        ),
      ],
    );
  }

  Widget _buildSaveButtons(ProfileProvider provider) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: provider.isSaving
                ? null
                : () => _cancelEdit(provider),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
              foregroundColor: darkMint,
              side: const BorderSide(color: Color(0xFFBFDCD6)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            child: const Text(
              'Cancel',
              style: TextStyle(
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: FilledButton(
            onPressed: provider.isSaving ? null : _saveProfile,
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
              backgroundColor: darkMint,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            child: provider.isSaving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text(
                    'Save Changes',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildError(ProfileProvider provider) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                color: const Color(0xFFFDECEC),
                borderRadius: BorderRadius.circular(22),
              ),
              child: const Icon(
                Icons.person_off_outlined,
                color: Color(0xFFB42318),
                size: 32,
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              'Unable to load profile',
              style: TextStyle(
                color: textDark,
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              provider.error ?? 'Please try again.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: textGrey,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: provider.loadProfile,
              style: FilledButton.styleFrom(
                backgroundColor: darkMint,
              ),
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSignOutButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () async {
          final confirmed = await showDialog<bool>(
            context: context,
            builder: (dialogContext) => AlertDialog(
              title: const Text('Sign Out'),
              content: const Text('Are you sure you want to sign out?'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext, false),
                  child: const Text('Cancel'),
                ),
                FilledButton(
                  onPressed: () => Navigator.pop(dialogContext, true),
                  child: const Text('Sign Out'),
                ),
              ],
            ),
          );

          if (confirmed != true || !context.mounted) return;

          await context.read<AuthProvider>().logout();

          if (!context.mounted) return;

          Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
        },
        icon: const Icon(Icons.logout_rounded),
        label: const Text('Sign Out'),
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          foregroundColor: const Color(0xFFB42318),
          side: const BorderSide(color: Color(0xFFF0B8B8)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }

  String _displayValue(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Not provided';
    }

    return value;
  }
}

class _ProfileCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<Widget> children;

  const _ProfileCard({
    required this.title,
    required this.icon,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: const Color(0xFFE3ECEA),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.025),
            blurRadius: 15,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F8F4),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(
                  icon,
                  color: const Color(0xFF087F70),
                  size: 20,
                ),
              ),
              const SizedBox(width: 11),
              Text(
                title,
                style: const TextStyle(
                  color: Color(0xFF173333),
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
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
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          icon,
          size: 19,
          color: const Color(0xFF19B89A),
        ),
        const SizedBox(width: 11),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: Color(0xFF899898),
                  fontSize: 10.5,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                value,
                style: TextStyle(
                  color: valueColor ?? const Color(0xFF263C3C),
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  height: 1.3,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _InputField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final IconData icon;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;

  const _InputField({
    required this.controller,
    required this.label,
    required this.icon,
    this.keyboardType,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: validator,
      style: const TextStyle(
        fontSize: 13.5,
        fontWeight: FontWeight.w600,
      ),
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(
          icon,
          color: const Color(0xFF19B89A),
          size: 21,
        ),
        filled: true,
        fillColor: const Color(0xFFF8FBFA),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: const BorderSide(
            color: Color(0xFFE0EAE7),
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: const BorderSide(
            color: Color(0xFFE0EAE7),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: const BorderSide(
            color: Color(0xFF19B89A),
            width: 1.5,
          ),
        ),
      ),
    );
  }
}

