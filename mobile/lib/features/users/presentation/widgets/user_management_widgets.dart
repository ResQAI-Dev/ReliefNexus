import 'package:flutter/material.dart';

import '../../data/models/admin_user_model.dart';

class UserManagementHero extends StatelessWidget {
  final int totalUsers;
  final int activeUsers;
  final int inactiveUsers;

  const UserManagementHero({
    super.key,
    required this.totalUsers,
    required this.activeUsers,
    required this.inactiveUsers,
  });

  static const imageUrl =
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=90';

  @override
  Widget build(BuildContext context) {
    final activePercentage = totalUsers == 0
        ? 0
        : ((activeUsers / totalUsers) * 100).round();

    return Container(
      height: 242,
      margin: const EdgeInsets.fromLTRB(16, 18, 16, 14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(30),
        boxShadow: const [
          BoxShadow(
            color: Color(0x26071A3D),
            blurRadius: 30,
            offset: Offset(0, 14),
          ),
        ],
        image: const DecorationImage(
          image: NetworkImage(imageUrl),
          fit: BoxFit.cover,
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(30),
        child: Stack(
          children: [
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      const Color(0xF2071A3D),
                      const Color(0xC11769FF),
                      const Color(0x5019C7E8),
                      Colors.transparent,
                    ],
                    stops: const [0, .42, .72, 1],
                  ),
                ),
              ),
            ),

            Positioned(
              top: 17,
              right: 17,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: .13),
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: .28),
                  ),
                ),
                child: const Row(
                  children: [
                    Icon(
                      Icons.verified_user_rounded,
                      color: Colors.white,
                      size: 13,
                    ),
                    SizedBox(width: 6),
                    Text(
                      'ADMIN CONTROL',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        letterSpacing: .9,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            Positioned(
              left: 22,
              bottom: 22,
              right: 22,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(
                        Icons.people_alt_rounded,
                        color: Color(0xFF8FEAFF),
                        size: 14,
                      ),
                      SizedBox(width: 6),
                      Text(
                        'USER MANAGEMENT',
                        style: TextStyle(
                          color: Color(0xFF8FEAFF),
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.7,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Manage ReliefNexus Users',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 25,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -.4,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      Text(
                        '$totalUsers registered',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        width: 4,
                        height: 4,
                        decoration: const BoxDecoration(
                          color: Color(0xFF8FEAFF),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '$activePercentage% active',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class UserSearchField extends StatelessWidget {
  final ValueChanged<String> onChanged;

  const UserSearchField({super.key, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 2, 20, 15),
      child: TextField(
        onChanged: onChanged,
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: 'Search users, email, role or district...',
          hintStyle: const TextStyle(color: Color(0xFF8A96AA), fontSize: 12),
          prefixIcon: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFEAF1FF),
              borderRadius: BorderRadius.circular(11),
            ),
            child: const Icon(
              Icons.search_rounded,
              color: Color(0xFF1769FF),
              size: 19,
            ),
          ),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(vertical: 15),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(19),
            borderSide: const BorderSide(color: Color(0xFFE2E8F2)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(19),
            borderSide: const BorderSide(color: Color(0xFFE2E8F2)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(19),
            borderSide: const BorderSide(color: Color(0xFF1769FF), width: 1.4),
          ),
        ),
      ),
    );
  }
}

class UserCard extends StatelessWidget {
  final AdminUserModel user;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const UserCard({
    super.key,
    required this.user,
    required this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(23),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(23),
            border: Border.all(color: const Color(0xFFE4EAF3)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0D071A3D),
                blurRadius: 20,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            children: [
              _PremiumAvatar(user: user),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.fullName.isEmpty ? 'Unnamed User' : user.fullName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF071A3D),
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      user.email,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF7C889B),
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        UserRoleBadge(role: user.role),
                        const SizedBox(width: 7),
                        UserStatusBadge(isActive: user.isActive),
                        if (user.district != null &&
                            user.district!.trim().isNotEmpty) ...[
                          const SizedBox(width: 7),
                          Flexible(
                            child: UserInfoBadge(
                              icon: Icons.location_on_outlined,
                              text: user.district!,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 4),
              PopupMenuButton<String>(
                icon: const Icon(
                  Icons.more_vert_rounded,
                  color: Color(0xFF071A3D),
                  size: 21,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(17),
                ),
                elevation: 8,
                onSelected: (value) {
                  if (value == 'details') onTap();
                  if (value == 'delete') onDelete();
                },
                itemBuilder: (_) => const [
                  PopupMenuItem(
                    value: 'details',
                    child: Row(
                      children: [
                        Icon(
                          Icons.person_outline_rounded,
                          size: 19,
                          color: Color(0xFF1769FF),
                        ),
                        SizedBox(width: 10),
                        Text('View Profile'),
                      ],
                    ),
                  ),
                  PopupMenuItem(
                    value: 'delete',
                    child: Row(
                      children: [
                        Icon(
                          Icons.delete_outline_rounded,
                          size: 19,
                          color: Color(0xFFE5484D),
                        ),
                        SizedBox(width: 10),
                        Text('Delete User'),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PremiumAvatar extends StatelessWidget {
  final AdminUserModel user;

  const _PremiumAvatar({required this.user});

  @override
  Widget build(BuildContext context) {
    final image = user.profileImageUrl;

    return Container(
      width: 54,
      height: 54,
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          colors: [Color(0xFF1769FF), Color(0xFF19C7E8)],
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x221769FF),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: const Color(0xFFE8EEFF),
          image: image != null && image.isNotEmpty
              ? DecorationImage(image: NetworkImage(image), fit: BoxFit.cover)
              : null,
        ),
        alignment: Alignment.center,
        child: image == null || image.isEmpty
            ? Text(
                user.fullName.isNotEmpty ? user.fullName[0].toUpperCase() : '?',
                style: const TextStyle(
                  color: Color(0xFF1769FF),
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                ),
              )
            : null,
      ),
    );
  }
}

class UserRoleBadge extends StatelessWidget {
  final String role;

  const UserRoleBadge({super.key, required this.role});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFEAF1FF), Color(0xFFF1F5FF)],
        ),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        role,
        style: const TextStyle(
          color: Color(0xFF1769FF),
          fontSize: 8,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class UserStatusBadge extends StatelessWidget {
  final bool isActive;

  const UserStatusBadge({super.key, required this.isActive});

  @override
  Widget build(BuildContext context) {
    final color = isActive ? const Color(0xFF16B77A) : const Color(0xFF71809B);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .09),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 5,
            height: 5,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 5),
          Text(
            isActive ? 'Active' : 'Inactive',
            style: TextStyle(
              color: color,
              fontSize: 8,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class UserInfoBadge extends StatelessWidget {
  final IconData icon;
  final String text;

  const UserInfoBadge({super.key, required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F4F8),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: const Color(0xFF71809B)),
          const SizedBox(width: 3),
          Flexible(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFF71809B),
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

class UserDetailsSheet extends StatelessWidget {
  final AdminUserModel user;

  const UserDetailsSheet({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    final image = user.profileImageUrl;

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
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 30),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 46,
                  height: 5,
                  decoration: BoxDecoration(
                    color: const Color(0xFFD5DCE7),
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ),
              const SizedBox(height: 15),

              // PREMIUM PROFILE HEADER
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(18, 18, 18, 17),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFF061735),
                      Color(0xFF124DC2),
                      Color(0xFF19B8D6),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(27),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x301769FF),
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
                                    user.fullName.isNotEmpty
                                        ? user.fullName[0].toUpperCase()
                                        : '?',
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
                                  color: Colors.white.withValues(alpha: .13),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Text(
                                  'RELIEFNEXUS USER',
                                  style: TextStyle(
                                    color: Color(0xFF9DEFFF),
                                    fontSize: 8,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1.1,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 7),
                              Text(
                                user.fullName.isEmpty
                                    ? 'Unnamed User'
                                    : user.fullName,
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

              const _PremiumSectionTitle(
                icon: Icons.dashboard_customize_rounded,
                title: 'ACCOUNT OVERVIEW',
              ),
              const SizedBox(height: 9),

              _PremiumInformationCard(
                children: [
                  _PremiumInformationRow(
                    icon: Icons.badge_outlined,
                    label: 'Role',
                    value: user.role,
                    color: const Color(0xFF1769FF),
                  ),
                  _PremiumInformationRow(
                    icon: Icons.verified_outlined,
                    label: 'Status',
                    value: user.isActive ? 'Active' : 'Inactive',
                    color: const Color(0xFF16B77A),
                  ),
                  _PremiumInformationRow(
                    icon: Icons.email_outlined,
                    label: 'Email',
                    value: user.email,
                    color: const Color(0xFF1769FF),
                  ),
                  _PremiumInformationRow(
                    icon: Icons.phone_outlined,
                    label: 'Phone',
                    value: user.phoneNumber,
                    color: const Color(0xFF1769FF),
                  ),
                ],
              ),

              const SizedBox(height: 18),

              const _PremiumSectionTitle(
                icon: Icons.person_outline_rounded,
                title: 'PERSONAL INFORMATION',
              ),
              const SizedBox(height: 9),

              _PremiumInformationCard(
                children: [
                  _PremiumInformationRow(
                    icon: Icons.wc_outlined,
                    label: 'Gender',
                    value: user.gender,
                    color: const Color(0xFF7C4DFF),
                  ),
                  _PremiumInformationRow(
                    icon: Icons.location_on_outlined,
                    label: 'District',
                    value: user.district,
                    color: const Color(0xFF1769FF),
                  ),
                  _PremiumInformationRow(
                    icon: Icons.home_outlined,
                    label: 'Address',
                    value: user.address,
                    color: const Color(0xFF1769FF),
                  ),
                ],
              ),

              const SizedBox(height: 18),

              const _PremiumSectionTitle(
                icon: Icons.emergency_outlined,
                title: 'EMERGENCY CONTACT',
              ),
              const SizedBox(height: 9),

              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFFF4EF), Color(0xFFFFFBF9)],
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
                            user.emergencyContactName == null ||
                                    user.emergencyContactName!.trim().isEmpty
                                ? 'No emergency contact'
                                : user.emergencyContactName!,
                            style: const TextStyle(
                              color: Color(0xFF071A3D),
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            user.emergencyContactPhone == null ||
                                    user.emergencyContactPhone!.trim().isEmpty
                                ? 'Phone not provided'
                                : user.emergencyContactPhone!,
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
                        Icons.call_outlined,
                        color: Color(0xFFE85D35),
                        size: 17,
                      ),
                    ),
                  ],
                ),
              ),

              if (user.permissions.isNotEmpty) ...[
                const SizedBox(height: 18),

                const _PremiumSectionTitle(
                  icon: Icons.security_rounded,
                  title: 'ACCESS & PERMISSIONS',
                ),
                const SizedBox(height: 9),

                Container(
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
                    children: user.permissions.map((permission) {
                      return Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 11,
                          vertical: 9,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF4F7FF),
                          borderRadius: BorderRadius.circular(12),
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
                ),
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
        border: Border.all(color: Colors.white.withValues(alpha: .17)),
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

class _PremiumSectionTitle extends StatelessWidget {
  final IconData icon;
  final String title;

  const _PremiumSectionTitle({required this.icon, required this.title});

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

class _PremiumInformationCard extends StatelessWidget {
  final List<Widget> children;

  const _PremiumInformationCard({required this.children});

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

class _PremiumInformationRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? value;
  final Color color;

  const _PremiumInformationRow({
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
            width: 78,
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

class _ProfileHeader extends StatelessWidget {
  final AdminUserModel user;

  const _ProfileHeader({required this.user});

  @override
  Widget build(BuildContext context) {
    final image = user.profileImageUrl;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF061735), Color(0xFF135DDE), Color(0xFF19B9D6)],
        ),
        borderRadius: BorderRadius.circular(26),
        boxShadow: const [
          BoxShadow(
            color: Color(0x301769FF),
            blurRadius: 24,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 70,
                height: 70,
                padding: const EdgeInsets.all(2.5),
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
                          user.fullName.isNotEmpty
                              ? user.fullName[0].toUpperCase()
                              : '?',
                          style: const TextStyle(
                            color: Color(0xFF1769FF),
                            fontSize: 25,
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
                    const Text(
                      'RELIEFNEXUS USER',
                      style: TextStyle(
                        color: Color(0xFF9CEFFF),
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.3,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      user.fullName.isEmpty ? 'Unnamed User' : user.fullName,
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
          const SizedBox(height: 15),
          Row(
            children: [
              Expanded(
                child: _HeaderMiniStat(
                  icon: Icons.badge_rounded,
                  label: user.role,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _HeaderMiniStat(
                  icon: user.isActive
                      ? Icons.circle
                      : Icons.pause_circle_filled_rounded,
                  label: user.isActive ? 'Active' : 'Inactive',
                ),
              ),
              if (user.district != null &&
                  user.district!.trim().isNotEmpty) ...[
                const SizedBox(width: 8),
                Expanded(
                  child: _HeaderMiniStat(
                    icon: Icons.location_on_rounded,
                    label: user.district!,
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _HeaderMiniStat extends StatelessWidget {
  final IconData icon;
  final String label;

  const _HeaderMiniStat({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: .12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: .15)),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white, size: 12),
          const SizedBox(width: 5),
          Expanded(
            child: Text(
              label,
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

class _SectionLabel extends StatelessWidget {
  final IconData icon;
  final String title;

  const _SectionLabel({required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 27,
          height: 27,
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
            color: Color(0xFF5F6E84),
            fontSize: 9,
            fontWeight: FontWeight.w900,
            letterSpacing: 1,
          ),
        ),
      ],
    );
  }
}

class _GlassInfoCard extends StatelessWidget {
  final List<Widget> children;

  const _GlassInfoCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE1E8F2)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A071A3D),
            blurRadius: 18,
            offset: Offset(0, 7),
          ),
        ],
      ),
      child: Column(children: children),
    );
  }
}

class _PremiumDetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? value;
  final Color accent;

  const _PremiumDetailRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.accent,
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
            width: 31,
            height: 31,
            decoration: BoxDecoration(
              color: accent.withValues(alpha: .09),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: accent, size: 15),
          ),
          const SizedBox(width: 10),
          SizedBox(
            width: 83,
            child: Padding(
              padding: const EdgeInsets.only(top: 7),
              child: Text(
                label,
                style: const TextStyle(
                  color: Color(0xFF8793A6),
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          const SizedBox(width: 5),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 7),
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

class _EmergencyContactCard extends StatelessWidget {
  final AdminUserModel user;

  const _EmergencyContactCard({required this.user});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFF6F2), Color(0xFFFFFBF9)],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFFDDD2)),
      ),
      child: Row(
        children: [
          Container(
            width: 43,
            height: 43,
            decoration: BoxDecoration(
              color: const Color(0xFFFFE8E0),
              borderRadius: BorderRadius.circular(13),
            ),
            child: const Icon(
              Icons.emergency_rounded,
              color: Color(0xFFE85D35),
              size: 21,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.emergencyContactName == null ||
                          user.emergencyContactName!.trim().isEmpty
                      ? 'No emergency contact'
                      : user.emergencyContactName!,
                  style: const TextStyle(
                    color: Color(0xFF071A3D),
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  user.emergencyContactPhone == null ||
                          user.emergencyContactPhone!.trim().isEmpty
                      ? 'Phone not provided'
                      : user.emergencyContactPhone!,
                  style: const TextStyle(
                    color: Color(0xFF7B8799),
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.call_outlined, color: Color(0xFFE85D35), size: 18),
        ],
      ),
    );
  }
}

class _PermissionGrid extends StatelessWidget {
  final List<String> permissions;

  const _PermissionGrid({required this.permissions});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: permissions.map((permission) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 9),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(13),
            border: Border.all(color: const Color(0xFFDCE5F4)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x08071A3D),
                blurRadius: 10,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF1FF),
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
    );
  }
}

class UserDetailsRow extends StatelessWidget {
  final String label;
  final String? value;

  const UserDetailsRow({super.key, required this.label, required this.value});

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
          SizedBox(
            width: 105,
            child: Text(
              label,
              style: const TextStyle(
                color: Color(0xFF8490A4),
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(
            child: Text(
              display,
              style: const TextStyle(
                color: Color(0xFF071A3D),
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class UserErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const UserErrorState({
    super.key,
    required this.message,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: const Color(0xFFFFEEF0),
                borderRadius: BorderRadius.circular(22),
              ),
              child: const Icon(
                Icons.cloud_off_rounded,
                color: Color(0xFFE5484D),
                size: 32,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFF071A3D),
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}


