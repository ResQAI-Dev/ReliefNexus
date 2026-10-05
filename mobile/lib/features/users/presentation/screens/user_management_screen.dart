import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../providers/users_provider.dart';
import '../widgets/user_management_widgets.dart';
import '../../data/models/admin_user_model.dart';

class UserManagementPage extends StatelessWidget {
  const UserManagementPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => UsersProvider()..loadUsers(),
      child: const _UserManagementView(),
    );
  }
}

class _UserManagementView extends StatelessWidget {
  const _UserManagementView();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<UsersProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF6F8FC),
      appBar: AppBar(
        title: const Text(
          'User Management',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: provider.loadUsers,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: UserManagementHero(
                  totalUsers: provider.users.length,
                  activeUsers: provider.activeCount,
                  inactiveUsers: provider.inactiveCount,
                ),
              ),
              SliverToBoxAdapter(
                child: UserSearchField(onChanged: provider.setSearchQuery),
              ),
              if (provider.isLoading)
                const SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (provider.error != null && provider.users.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: UserErrorState(
                    message: provider.error!,
                    onRetry: provider.loadUsers,
                  ),
                )
              else if (provider.filteredUsers.isEmpty)
                const SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Text(
                      'No users found.',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                  sliver: SliverList.builder(
                    itemCount: provider.filteredUsers.length,
                    itemBuilder: (context, index) {
                      final user = provider.filteredUsers[index];

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: UserCard(
                          user: user,
                          onTap: () => _showUserDetails(context, user),
                          onDelete: () => _confirmDelete(context, user),
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _showUserDetails(
    BuildContext context,
    AdminUserModel user,
  ) async {
    final provider = context.read<UsersProvider>();

    await provider.loadUser(user.id);

    if (!context.mounted) return;

    final selectedUser = provider.selectedUser ?? user;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _UserDetailsSheet(user: selectedUser),
    );
  }

  Future<void> _confirmDelete(BuildContext context, AdminUserModel user) async {
    final provider = context.read<UsersProvider>();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Delete User'),
          content: Text('Are you sure you want to delete ${user.fullName}?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(dialogContext, true),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirmed != true || !context.mounted) return;

    final success = await provider.deleteUser(user.id);

    if (!context.mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success
              ? 'User deleted successfully.'
              : provider.error ?? 'Unable to delete user.',
        ),
      ),
    );
  }
}

class _UserDetailsSheet extends StatelessWidget {
  final AdminUserModel user;

  const _UserDetailsSheet({required this.user});

  @override
  Widget build(BuildContext context) {
    final image = user.profileImageUrl;
    final name = user.fullName.trim().isEmpty ? 'Unnamed User' : user.fullName;

    return Container(
      constraints: const BoxConstraints(maxHeight: 850),
      decoration: const BoxDecoration(
        color: Color(0xFFF4F7FC),
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 46,
                  height: 5,
                  decoration: BoxDecoration(
                    color: const Color(0xFFD6DDE8),
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ),
              const SizedBox(height: 15),

              // PROFILE HEADER
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFF061735),
                      Color(0xFF1254D8),
                      Color(0xFF19B9D7),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(27),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x351769FF),
                      blurRadius: 25,
                      offset: Offset(0, 11),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 76,
                          height: 76,
                          padding: const EdgeInsets.all(3),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withValues(alpha: .35),
                          ),
                          child: CircleAvatar(
                            backgroundColor: const Color(0xFFEAF1FF),
                            backgroundImage: image != null && image.isNotEmpty
                                ? NetworkImage(image)
                                : null,
                            child: image == null || image.isEmpty
                                ? Text(
                                    name[0].toUpperCase(),
                                    style: const TextStyle(
                                      color: Color(0xFF1769FF),
                                      fontSize: 28,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  )
                                : null,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 5,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: .14),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Text(
                                  'RELIEFNEXUS USER',
                                  style: TextStyle(
                                    color: Color(0xFF9DEFFF),
                                    fontSize: 8,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1.2,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 7),
                              Text(
                                name,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                user.email,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 10,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _ProfilePill(
                            icon: Icons.badge_rounded,
                            text: user.role,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _ProfilePill(
                            icon: user.isActive
                                ? Icons.check_circle_rounded
                                : Icons.pause_circle_rounded,
                            text: user.isActive ? 'Active' : 'Inactive',
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              const _SectionHeader(
                icon: Icons.dashboard_customize_rounded,
                title: 'ACCOUNT OVERVIEW',
              ),
              const SizedBox(height: 9),

              _InfoCard(
                children: [
                  _InfoRow(
                    icon: Icons.badge_outlined,
                    label: 'Role',
                    value: user.role,
                    color: const Color(0xFF1769FF),
                  ),
                  _InfoRow(
                    icon: Icons.verified_outlined,
                    label: 'Status',
                    value: user.isActive ? 'Active' : 'Inactive',
                    color: const Color(0xFF16B77A),
                  ),
                  _InfoRow(
                    icon: Icons.email_outlined,
                    label: 'Email',
                    value: user.email,
                    color: const Color(0xFF1769FF),
                  ),
                  _InfoRow(
                    icon: Icons.phone_outlined,
                    label: 'Phone',
                    value: user.phoneNumber,
                    color: const Color(0xFF1769FF),
                  ),
                ],
              ),

              const SizedBox(height: 18),

              const _SectionHeader(
                icon: Icons.person_outline_rounded,
                title: 'PERSONAL INFORMATION',
              ),
              const SizedBox(height: 9),

              _InfoCard(
                children: [
                  _InfoRow(
                    icon: Icons.wc_outlined,
                    label: 'Gender',
                    value: user.gender,
                    color: const Color(0xFF7C4DFF),
                  ),
                  _InfoRow(
                    icon: Icons.location_on_outlined,
                    label: 'District',
                    value: user.district,
                    color: const Color(0xFF1769FF),
                  ),
                  _InfoRow(
                    icon: Icons.home_outlined,
                    label: 'Address',
                    value: user.address,
                    color: const Color(0xFF1769FF),
                  ),
                ],
              ),

              const SizedBox(height: 18),

              const _SectionHeader(icon: Icons.map_outlined, title: 'LOCATION'),
              const SizedBox(height: 9),

              _LocationCard(district: user.district, address: user.address),

              const SizedBox(height: 18),

              const _SectionHeader(
                icon: Icons.contact_emergency_outlined,
                title: 'EMERGENCY CONTACT',
              ),
              const SizedBox(height: 9),

              _EmergencyCard(
                name: user.emergencyContactName,
                phone: user.emergencyContactPhone,
              ),

              if (user.permissions.isNotEmpty) ...[
                const SizedBox(height: 18),

                const _SectionHeader(
                  icon: Icons.security_rounded,
                  title: 'ACCESS & PERMISSIONS',
                ),
                const SizedBox(height: 9),

                _PermissionsCard(permissions: user.permissions),
              ],

              const SizedBox(height: 18),

              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 13,
                  vertical: 11,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF1FF),
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(color: const Color(0xFFD7E4FF)),
                ),
                child: const Row(
                  children: [
                    Icon(
                      Icons.lock_outline_rounded,
                      color: Color(0xFF1769FF),
                      size: 16,
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Protected administrator view  Live backend data',
                        style: TextStyle(
                          color: Color(0xFF31558F),
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
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
    );
  }
}

class _ProfilePill extends StatelessWidget {
  final IconData icon;
  final String text;

  const _ProfilePill({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: .13),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: .18)),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white, size: 13),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 8,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;

  const _SectionHeader({required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: const Color(0xFFEAF1FF),
            borderRadius: BorderRadius.circular(9),
          ),
          child: Icon(icon, color: const Color(0xFF1769FF), size: 14),
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            color: Color(0xFF65748B),
            fontSize: 9,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.05,
          ),
        ),
      ],
    );
  }
}

class _InfoCard extends StatelessWidget {
  final List<Widget> children;

  const _InfoCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(21),
        border: Border.all(color: const Color(0xFFE1E8F2)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x09071A3D),
            blurRadius: 18,
            offset: Offset(0, 7),
          ),
        ],
      ),
      child: Column(children: children),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? value;
  final Color color;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final display = value == null || value!.trim().isEmpty
        ? 'Not provided'
        : value!;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: color.withValues(alpha: .09),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 15),
          ),
          const SizedBox(width: 10),
          SizedBox(
            width: 76,
            child: Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                label,
                style: const TextStyle(
                  color: Color(0xFF8A96A8),
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          const SizedBox(width: 5),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                display,
                style: const TextStyle(
                  color: Color(0xFF071A3D),
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LocationCard extends StatelessWidget {
  final String? district;
  final String? address;

  const _LocationCard({required this.district, required this.address});

  static const LatLng _registeredArea = LatLng(6.9393, 80.0044);

  @override
  Widget build(BuildContext context) {
    final districtText = district == null || district!.trim().isEmpty
        ? 'District not provided'
        : district!;

    final addressText = address == null || address!.trim().isEmpty
        ? 'Address not provided'
        : address!;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(23),
        border: Border.all(color: const Color(0xFFDDE6F2)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A071A3D),
            blurRadius: 18,
            offset: Offset(0, 7),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // LOCATION HEADER
          Padding(
            padding: const EdgeInsets.fromLTRB(15, 15, 15, 12),
            child: Row(
              children: [
                Container(
                  width: 43,
                  height: 43,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1769FF), Color(0xFF19C7E8)],
                    ),
                    borderRadius: BorderRadius.circular(13),
                  ),
                  child: const Icon(
                    Icons.location_on_rounded,
                    color: Colors.white,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 11),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Registered Location',
                        style: TextStyle(
                          color: Color(0xFF071A3D),
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        districtText,
                        style: const TextStyle(
                          color: Color(0xFF1769FF),
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEAF2FF),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.explore_rounded,
                        color: Color(0xFF1769FF),
                        size: 13,
                      ),
                      SizedBox(width: 4),
                      Text(
                        'MAP',
                        style: TextStyle(
                          color: Color(0xFF1769FF),
                          fontSize: 8,
                          fontWeight: FontWeight.w900,
                          letterSpacing: .8,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // INTERACTIVE MAP
          ClipRRect(
            borderRadius: const BorderRadius.vertical(
              bottom: Radius.circular(23),
            ),
            child: SizedBox(
              height: 205,
              child: Stack(
                children: [
                  FlutterMap(
                    options: const MapOptions(
                      initialCenter: _registeredArea,
                      initialZoom: 15.2,
                      minZoom: 11,
                      maxZoom: 19,
                    ),
                    children: [
                      TileLayer(
                        urlTemplate:
                            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                        userAgentPackageName: 'com.reliefnexus.mobile',
                      ),
                      MarkerLayer(
                        markers: [
                          Marker(
                            point: _registeredArea,
                            width: 58,
                            height: 70,
                            child: Column(
                              children: [
                                Container(
                                  width: 43,
                                  height: 43,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF1769FF),
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: Colors.white,
                                      width: 4,
                                    ),
                                    boxShadow: const [
                                      BoxShadow(
                                        color: Color(0x501769FF),
                                        blurRadius: 13,
                                        offset: Offset(0, 5),
                                      ),
                                    ],
                                  ),
                                  child: const Icon(
                                    Icons.location_on_rounded,
                                    color: Colors.white,
                                    size: 22,
                                  ),
                                ),
                                Container(
                                  width: 9,
                                  height: 9,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF1769FF),
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: Colors.white,
                                      width: 2,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),

                  // MAP LABEL
                  Positioned(
                    left: 12,
                    top: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: .94),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x18071A3D),
                            blurRadius: 10,
                            offset: Offset(0, 3),
                          ),
                        ],
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.location_searching_rounded,
                            color: Color(0xFF1769FF),
                            size: 15,
                          ),
                          SizedBox(width: 6),
                          Text(
                            'Registered area',
                            style: TextStyle(
                              color: Color(0xFF071A3D),
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // ADDRESS OVERLAY
                  Positioned(
                    left: 12,
                    right: 12,
                    bottom: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xF5071A3D),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.home_work_outlined,
                            color: Color(0xFF8EDFFF),
                            size: 16,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              addressText,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 9.5,
                                height: 1.25,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
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
}

class _EmergencyCard extends StatelessWidget {
  final String? name;
  final String? phone;

  const _EmergencyCard({required this.name, required this.phone});

  @override
  Widget build(BuildContext context) {
    final nameText = name == null || name!.trim().isEmpty
        ? 'No emergency contact'
        : name!;

    final phoneText = phone == null || phone!.trim().isEmpty
        ? 'Phone not provided'
        : phone!;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFF3EE), Color(0xFFFFFBF9)],
        ),
        borderRadius: BorderRadius.circular(21),
        border: Border.all(color: const Color(0xFFFFDDD2)),
      ),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: const Color(0xFFFFE5DB),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.contact_emergency_rounded,
              color: Color(0xFFE85D35),
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  nameText,
                  style: const TextStyle(
                    color: Color(0xFF071A3D),
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  phoneText,
                  style: const TextStyle(
                    color: Color(0xFF7B8799),
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(11),
            ),
            child: const Icon(
              Icons.phone_outlined,
              color: Color(0xFFE85D35),
              size: 17,
            ),
          ),
        ],
      ),
    );
  }
}

class _PermissionsCard extends StatelessWidget {
  final List<String> permissions;

  const _PermissionsCard({required this.permissions});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(21),
        border: Border.all(color: const Color(0xFFE1E8F2)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x09071A3D),
            blurRadius: 18,
            offset: Offset(0, 7),
          ),
        ],
      ),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: permissions.map((permission) {
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
            decoration: BoxDecoration(
              color: const Color(0xFFF3F7FF),
              borderRadius: BorderRadius.circular(13),
              border: Border.all(color: const Color(0xFFDCE6FA)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE4EDFF),
                    borderRadius: BorderRadius.circular(7),
                  ),
                  child: const Icon(
                    Icons.check_rounded,
                    color: Color(0xFF1769FF),
                    size: 13,
                  ),
                ),
                const SizedBox(width: 7),
                Text(
                  permission,
                  style: const TextStyle(
                    color: Color(0xFF263A5A),
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}


