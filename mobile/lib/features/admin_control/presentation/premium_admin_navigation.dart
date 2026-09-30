import 'package:flutter/material.dart';

import '../admin_control_center_screen.dart';
import 'screens/admin_profile_screen.dart';

import '../../users/presentation/screens/user_management_screen.dart';
import '../../emergency_alerts/presentation/screens/emergency_alerts_screen.dart';
import '../../resource_optimization/presentation/screens/resource_optimization_screen.dart';
import '../../vulnerability_impact/presentation/screens/vulnerability_impact_screen.dart';
import '../../risk_predictions/presentation/screens/risk_predictions_screen.dart';
import '../../disaster_reports/presentation/screens/disaster_reports_screen.dart';
import '../../role_requests/presentation/screens/role_requests_screen.dart';

class PremiumAdminNavigation extends StatefulWidget {
  const PremiumAdminNavigation({super.key});

  @override
  State<PremiumAdminNavigation> createState() => _PremiumAdminNavigationState();
}

class _PremiumAdminNavigationState extends State<PremiumAdminNavigation>
    with TickerProviderStateMixin {
  int _selected = 0;

  late final AnimationController _fadeController;
  late final AnimationController _heroController;

  @override
  void initState() {
    super.initState();

    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );

    _heroController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    )..repeat(reverse: true);

    _fadeController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _heroController.dispose();
    super.dispose();
  }

  void _open(BuildContext context, Widget page) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F8FC),
      body: SafeArea(
        child: IndexedStack(
          index: _selected,
          children: [
            _overview(),
            const UserManagementPage(),
            const EmergencyAlertsPage(),
            _systemControlCenter(),
            const AdminProfilePage(),
          ],
        ),
      ),
      bottomNavigationBar: _bottomNavigation(),
    );
  }

  // ============================================================
  // OVERVIEW
  // ============================================================

  Widget _overview() {
    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(child: _adminHeader()),

        SliverToBoxAdapter(child: _heroBanner()),

        SliverPadding(
          padding: const EdgeInsets.fromLTRB(18, 18, 18, 30),
          sliver: SliverToBoxAdapter(
            child: FadeTransition(
              opacity: CurvedAnimation(
                parent: _fadeController,
                curve: Curves.easeOut,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _statsSection(),

                  const SizedBox(height: 26),

                  _sectionHeader(
                    'ADMINISTRATION',
                    'Manage users, permissions, approvals and incident intelligence.',
                    onViewAll: () {
                      setState(() => _selected = 1);
                    },
                  ),

                  const SizedBox(height: 12),

                  _adminCards(),

                  const SizedBox(height: 28),

                  _sectionHeader(
                    'OPERATIONS',
                    'Monitor the complete disaster response network.',
                  ),

                  const SizedBox(height: 12),

                  _operationCards(),

                  const SizedBox(height: 28),

                  _sectionHeader(
                    'RESPONSE GALLERY',
                    'Visual snapshots from the disaster response network.',
                  ),

                  const SizedBox(height: 12),

                  _responseGallery(),

                  const SizedBox(height: 28),

                  _sectionHeader(
                    'SYSTEM',
                    'Security, records and configuration.',
                  ),

                  const SizedBox(height: 12),

                  _systemCards(),

                  const SizedBox(height: 14),

                  _platformHealth(),

                  const SizedBox(height: 15),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ============================================================
  // HEADER
  // ============================================================

  Widget _adminHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(22, 18, 22, 12),
      child: Row(
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF38BDF8), Color(0xFF2563EB)],
              ),
              borderRadius: BorderRadius.circular(19),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x302563EB),
                  blurRadius: 14,
                  offset: Offset(0, 7),
                ),
              ],
            ),
            child: const Icon(
              Icons.admin_panel_settings_rounded,
              color: Colors.white,
              size: 31,
            ),
          ),

          const SizedBox(width: 13),

          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Administration',
                  style: TextStyle(
                    color: Color(0xFF7890A8),
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'System',
                  style: TextStyle(
                    color: Color(0xFF06152F),
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 1),
                Text(
                  'System Administrator',
                  style: TextStyle(color: Color(0xFF8799AD), fontSize: 9),
                ),
              ],
            ),
          ),

          _headerButton(Icons.notifications_none_rounded, badge: true),

          const SizedBox(width: 9),

          _headerButton(Icons.grid_view_rounded),
        ],
      ),
    );
  }

  Widget _headerButton(IconData icon, {bool badge = false}) {
    return Stack(
      children: [
        Container(
          width: 54,
          height: 54,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE1EAF3)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0906152F),
                blurRadius: 10,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Icon(icon, color: const Color(0xFF06152F), size: 23),
        ),
        if (badge)
          Positioned(
            right: 12,
            top: 10,
            child: Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: Color(0xFFFF4D67),
                shape: BoxShape.circle,
              ),
            ),
          ),
      ],
    );
  }

  // ============================================================
  // HERO
  // ============================================================

  Widget _heroBanner() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18),
      child: AnimatedBuilder(
        animation: _heroController,
        builder: (context, child) {
          final value = _heroController.value;

          return Container(
            height: 245,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(30),
              gradient: const LinearGradient(
                colors: [
                  Color(0xFF06152F),
                  Color(0xFF073B68),
                  Color(0xFF0798D5),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x3006152F),
                  blurRadius: 25,
                  offset: Offset(0, 12),
                ),
              ],
            ),
            child: Stack(
              clipBehavior: Clip.hardEdge,
              children: [
                Positioned(
                  right: -40 + (value * 12),
                  top: -55,
                  child: Container(
                    width: 200,
                    height: 200,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withOpacity(.08),
                    ),
                  ),
                ),

                Positioned(
                  right: -25,
                  bottom: -50,
                  child: Container(
                    width: 160,
                    height: 160,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(0xFF38BDF8).withOpacity(.12),
                    ),
                  ),
                ),

                Padding(
                  padding: const EdgeInsets.all(22),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 7,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(.10),
                          borderRadius: BorderRadius.circular(30),
                          border: Border.all(
                            color: Colors.white.withOpacity(.16),
                          ),
                        ),
                        child: const Text(
                          'SYSTEM CONTROL CENTER',
                          style: TextStyle(
                            color: Color(0xFF9DE7FF),
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.4,
                          ),
                        ),
                      ),

                      const Spacer(),

                      const Text(
                        'ReliefNexus',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 30,
                          fontWeight: FontWeight.w900,
                        ),
                      ),

                      const SizedBox(height: 5),

                      const SizedBox(
                        width: 290,
                        child: Text(
                          'Intelligent disaster response, coordination and recovery in one command center.',
                          style: TextStyle(
                            color: Color(0xD9FFFFFF),
                            fontSize: 12,
                            height: 1.45,
                          ),
                        ),
                      ),

                      const SizedBox(height: 15),

                      Row(
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            decoration: const BoxDecoration(
                              color: Color(0xFF4ADE80),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'LIVE SYSTEM',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1,
                            ),
                          ),
                          const SizedBox(width: 10),
                          const Icon(
                            Icons.monitor_heart_rounded,
                            color: Color(0xFF67E8F9),
                            size: 17,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                Positioned(
                  right: 20,
                  bottom: 18,
                  child: Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(.10),
                      borderRadius: BorderRadius.circular(19),
                      border: Border.all(color: Colors.white.withOpacity(.15)),
                    ),
                    child: const Icon(
                      Icons.shield_rounded,
                      color: Color(0xFFB9F3FF),
                      size: 31,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // ============================================================
  // STATS
  // ============================================================

  Widget _statsSection() {
    return SizedBox(
      height: 154,
      child: ListView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        children: const [
          _PremiumStatCard(
            icon: Icons.people_alt_rounded,
            value: '22',
            label: 'Users',
            accent: Color(0xFF1677FF),
            trend: '+2 this week',
          ),
          _PremiumStatCard(
            icon: Icons.admin_panel_settings_rounded,
            value: '0',
            label: 'Role Requests',
            accent: Color(0xFF8B5CF6),
            trend: 'No pending',
          ),
          _PremiumStatCard(
            icon: Icons.description_rounded,
            value: '17',
            label: 'Disaster Reports',
            accent: Color(0xFFFF5A72),
            trend: '+5 this week',
          ),
          _PremiumStatCard(
            icon: Icons.notifications_active_rounded,
            value: '19',
            label: 'Emergency Alerts',
            accent: Color(0xFFFF9F1C),
            trend: '+3 this week',
          ),
        ],
      ),
    );
  }

  // ============================================================
  // SECTION HEADER
  // ============================================================

  Widget _sectionHeader(
    String eyebrow,
    String title, {
    VoidCallback? onViewAll,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 4,
          height: 37,
          margin: const EdgeInsets.only(right: 11),
          decoration: BoxDecoration(
            color: const Color(0xFF149CE8),
            borderRadius: BorderRadius.circular(10),
          ),
        ),

        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                eyebrow,
                style: const TextStyle(
                  color: Color(0xFF149CE8),
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                title,
                style: const TextStyle(
                  color: Color(0xFF06152F),
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  height: 1.15,
                ),
              ),
            ],
          ),
        ),

        if (onViewAll != null)
          GestureDetector(
            onTap: onViewAll,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(30),
                border: Border.all(color: const Color(0xFFD9E6F2)),
              ),
              child: const Row(
                children: [
                  Text(
                    'View All',
                    style: TextStyle(
                      color: Color(0xFF1677FF),
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  SizedBox(width: 4),
                  Icon(
                    Icons.chevron_right_rounded,
                    color: Color(0xFF1677FF),
                    size: 16,
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  // ============================================================
  // ADMINISTRATION
  // ============================================================

  Widget _adminCards() {
    return _twoColumn([
      _premiumAction(
        icon: Icons.people_alt_rounded,
        title: 'User Management',
        subtitle: 'Users & accounts',
        color: const Color(0xFF1677FF),
        onTap: () => _open(context, const UserManagementPage()),
      ),
      _premiumAction(
        icon: Icons.admin_panel_settings_rounded,
        title: 'Role Requests',
        subtitle: 'Approve permissions',
        color: const Color(0xFF8B5CF6),
        onTap: () => _open(context, const RoleRequestsPage()),
      ),
      _premiumAction(
        icon: Icons.description_rounded,
        title: 'Disaster Reports',
        subtitle: 'Review incidents',
        color: const Color(0xFFFF5A72),
        onTap: () => _open(context, const DisasterReportsPage()),
      ),
      _premiumAction(
        icon: Icons.auto_graph_rounded,
        title: 'Risk Predictions',
        subtitle: 'Agent 01 intelligence',
        color: const Color(0xFF2563EB),
        onTap: () => _open(context, const RiskPredictionsPage()),
      ),
    ]);
  }

  // ============================================================
  // OPERATIONS
  // ============================================================

  Widget _operationCards() {
    return _twoColumn([
      _premiumAction(
        icon: Icons.shield_rounded,
        title: 'Vulnerability & Impact',
        subtitle: 'Agent 02 analysis',
        color: const Color(0xFF16B981),
        onTap: () => _open(context, const VulnerabilityImpactPage()),
      ),
      _premiumAction(
        icon: Icons.inventory_2_rounded,
        title: 'Resources',
        subtitle: 'Agent 03 optimization',
        color: const Color(0xFF0798D5),
        onTap: () => _open(context, const ResourceOptimizationPage()),
      ),
      _premiumAction(
        icon: Icons.notifications_active_rounded,
        title: 'Emergency Alerts',
        subtitle: 'Live emergency network',
        color: const Color(0xFFFF9F1C),
        onTap: () => _open(context, const EmergencyAlertsPage()),
      ),
      _premiumAction(
        icon: Icons.monitor_heart_rounded,
        title: 'System Monitoring',
        subtitle: 'Live platform status',
        color: const Color(0xFF0284C7),
        onTap: () => _open(context, const AdminSystemMonitoringPage()),
      ),
    ]);
  }

  Widget _twoColumn(List<Widget> children) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.55,
      children: children,
    );
  }

  // ============================================================
  // RESPONSE GALLERY
  // ============================================================

  Widget _responseGallery() {
    return SizedBox(
      height: 155,
      child: ListView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        children: [
          _galleryCard(
            title: 'Flood Response',
            subtitle: 'Sri Lanka',
            gradient: const LinearGradient(
              colors: [Color(0xFF0B355B), Color(0xFF147DB4)],
            ),
            icon: Icons.water_damage_rounded,
          ),
          _galleryCard(
            title: 'Disaster Impact',
            subtitle: 'Regional response',
            gradient: const LinearGradient(
              colors: [Color(0xFF163B62), Color(0xFF2384B7)],
            ),
            icon: Icons.map_rounded,
          ),
          _galleryCard(
            title: 'Rescue Operations',
            subtitle: 'Emergency response',
            gradient: const LinearGradient(
              colors: [Color(0xFF173D53), Color(0xFF0B7896)],
            ),
            icon: Icons.groups_rounded,
          ),
        ],
      ),
    );
  }

  Widget _galleryCard({
    required String title,
    required String subtitle,
    required Gradient gradient,
    required IconData icon,
  }) {
    return Container(
      width: 245,
      margin: const EdgeInsets.only(right: 12),
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1806152F),
            blurRadius: 12,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -30,
            top: -35,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(.08),
              ),
            ),
          ),

          Positioned(
            left: 16,
            top: 16,
            child: Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(.13),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: Colors.white, size: 22),
            ),
          ),

          Positioned(
            left: 16,
            bottom: 16,
            right: 16,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: Colors.white.withOpacity(.72),
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ============================================================
  // SYSTEM
  // ============================================================

  Widget _systemCards() {
    return _twoColumn([
      _premiumAction(
        icon: Icons.receipt_long_rounded,
        title: 'Audit Logs',
        subtitle: 'Activity records',
        color: const Color(0xFF0284C7),
        onTap: () => _open(context, const AdminAuditLogsPage()),
      ),
      _premiumAction(
        icon: Icons.settings_rounded,
        title: 'System Settings',
        subtitle: 'Permissions & administration',
        color: const Color(0xFF0284C7),
        onTap: () => _open(context, const AdminSystemSettingsPage()),
      ),
    ]);
  }

  Widget _platformHealth() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE9FFF4), Color(0xFFF2FFF9)],
        ),
        borderRadius: BorderRadius.circular(21),
        border: Border.all(color: const Color(0xFFA7E8C5)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1000A86B),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 45,
            height: 45,
            decoration: const BoxDecoration(
              color: Color(0xFF16B981),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_rounded,
              color: Colors.white,
              size: 26,
            ),
          ),

          const SizedBox(width: 12),

          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Platform Health',
                  style: TextStyle(
                    color: Color(0xFF073B2B),
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  'ReliefNexus services are ready for operations.',
                  style: TextStyle(color: Color(0xFF719486), fontSize: 10),
                ),
              ],
            ),
          ),

          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(.75),
              borderRadius: BorderRadius.circular(30),
              border: Border.all(color: const Color(0xFFA7E8C5)),
            ),
            child: const Text(
              'Operational',
              style: TextStyle(
                color: Color(0xFF129663),
                fontSize: 10,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ============================================================
  // ACTION CARD
  // ============================================================

  Widget _premiumAction({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          padding: const EdgeInsets.all(15),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: const Color(0xFFE0EAF3)),
          ),
          child: Stack(
            children: [
              Positioned(
                right: -18,
                top: -22,
                child: Container(
                  width: 78,
                  height: 78,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: color.withOpacity(.035),
                  ),
                ),
              ),

              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 46,
                        height: 46,
                        decoration: BoxDecoration(
                          color: color.withOpacity(.10),
                          borderRadius: BorderRadius.circular(15),
                        ),
                        child: Icon(icon, color: color, size: 23),
                      ),
                      const Spacer(),
                      Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: color.withOpacity(.05),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.arrow_forward_rounded,
                          color: color,
                          size: 17,
                        ),
                      ),
                    ],
                  ),

                  const Spacer(),

                  Text(
                    title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF06152F),
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                    ),
                  ),

                  const SizedBox(height: 4),

                  Row(
                    children: [
                      Container(
                        width: 5,
                        height: 5,
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          subtitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Color(0xFF8294A9),
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ============================================================
  // SYSTEM CONTROL CENTER
  // ============================================================

  Widget _systemControlCenter() {
    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(
          child: Container(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 28),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Color(0xFF06152F),
                  Color(0xFF083B68),
                  Color(0xFF0798D5),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(30)),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'SYSTEM CONTROL CENTER',
                  style: TextStyle(
                    color: Color(0xFF9DE7FF),
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.5,
                  ),
                ),
                SizedBox(height: 10),
                Text(
                  'System Control Center',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 25,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'Security, records and configuration.',
                  style: TextStyle(color: Color(0xCCDCEEFF), fontSize: 13),
                ),
              ],
            ),
          ),
        ),

        SliverPadding(
          padding: const EdgeInsets.all(18),
          sliver: SliverToBoxAdapter(
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _systemOption(
                        Icons.receipt_long_rounded,
                        'Audit Logs',
                        'Activity records',
                        () => _open(context, const AdminAuditLogsPage()),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _systemOption(
                        Icons.settings_rounded,
                        'System Settings',
                        'Permissions & administration',
                        () => _open(context, const AdminSystemSettingsPage()),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                Row(
                  children: [
                    Expanded(
                      child: _systemOption(
                        Icons.monitor_heart_rounded,
                        'System Monitoring',
                        'Live platform status',
                        () => _open(context, const AdminSystemMonitoringPage()),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _systemOption(
                        Icons.storage_rounded,
                        'Data Management',
                        'Backup & maintenance',
                        null,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 18),

                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(17),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEAF8F0),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFC7EAD5)),
                  ),
                  child: const Row(
                    children: [
                      Icon(
                        Icons.check_circle_rounded,
                        color: Color(0xFF16A34A),
                        size: 28,
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'All Systems Operational',
                              style: TextStyle(
                                color: Color(0xFF146B40),
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            SizedBox(height: 3),
                            Text(
                              'Platform running smoothly',
                              style: TextStyle(
                                color: Color(0xFF56816A),
                                fontSize: 11,
                              ),
                            ),
                          ],
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
    );
  }

  Widget _systemOption(
    IconData icon,
    String title,
    String subtitle,
    VoidCallback? onTap,
  ) {
    final enabled = onTap != null;

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          height: 155,
          padding: const EdgeInsets.all(15),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: const Color(0xFFE0EAF3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 47,
                height: 47,
                decoration: BoxDecoration(
                  color: enabled
                      ? const Color(0xFFE8F7FF)
                      : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Icon(
                  icon,
                  color: enabled
                      ? const Color(0xFF0798D5)
                      : const Color(0xFF94A3B8),
                  size: 23,
                ),
              ),

              const Spacer(),

              Text(
                title,
                style: TextStyle(
                  color: enabled
                      ? const Color(0xFF06152F)
                      : const Color(0xFF64748B),
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                ),
              ),

              const SizedBox(height: 5),

              Text(
                subtitle,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Color(0xFF8294A9), fontSize: 10),
              ),

              const SizedBox(height: 6),

              Icon(
                enabled
                    ? Icons.arrow_forward_rounded
                    : Icons.lock_outline_rounded,
                color: enabled
                    ? const Color(0xFF0798D5)
                    : const Color(0xFF94A3B8),
                size: 17,
              ),
            ],
          ),
        ),
      ),
    );
  }
  // ============================================================
  // BOTTOM NAVIGATION
  // ============================================================

  Widget _profilePage() {
    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 28, 20, 120),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              const Text(
                'Profile',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF071A3D),
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Account information and session',
                style: TextStyle(color: Color(0xFF71809B)),
              ),
              const SizedBox(height: 22),

              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x10071A3D),
                      blurRadius: 16,
                      offset: Offset(0, 6),
                    ),
                  ],
                ),
                child: const Column(
                  children: [
                    CircleAvatar(
                      radius: 42,
                      backgroundColor: Color(0xFFEAF2FF),
                      child: Icon(
                        Icons.person_rounded,
                        size: 46,
                        color: Color(0xFF1769FF),
                      ),
                    ),
                    SizedBox(height: 14),
                    Text(
                      'System Administrator',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF071A3D),
                      ),
                    ),
                    SizedBox(height: 5),
                    Text(
                      'Administration',
                      style: TextStyle(color: Color(0xFF71809B)),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: ListTile(
                  leading: const Icon(
                    Icons.logout_rounded,
                    color: Color(0xFFE53935),
                  ),
                  title: const Text(
                    'Sign Out',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: Color(0xFFE53935),
                    ),
                  ),
                  subtitle: const Text('Sign out from this account'),
                  trailing: const Icon(
                    Icons.chevron_right_rounded,
                    color: Color(0xFF8EA0B8),
                  ),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Sign Out action will use the existing authentication flow.',
                        ),
                      ),
                    );
                  },
                ),
              ),
            ]),
          ),
        ),
      ],
    );
  }

  Widget _bottomNavigation() {
    const items = [
      (icon: Icons.grid_view_rounded, label: 'Overview'),
      (icon: Icons.people_alt_rounded, label: 'Users'),
      (icon: Icons.notifications_none_rounded, label: 'Alerts'),
      (icon: Icons.settings_rounded, label: 'System'),
      (icon: Icons.person_rounded, label: 'Profile'),
    ];

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(27),
        border: Border.all(color: const Color(0xFFE1EAF3)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1806152F),
            blurRadius: 24,
            offset: Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.all(5),
          child: Row(
            children: List.generate(items.length, (index) {
              final selected = _selected == index;

              return Expanded(
                child: GestureDetector(
                  onTap: () {
                    setState(() {
                      _selected = index;
                    });
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    curve: Curves.easeOut,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: selected
                          ? const Color(0xFFE8F1FF)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(22),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          items[index].icon,
                          size: 21,
                          color: selected
                              ? const Color(0xFF1769FF)
                              : const Color(0xFF8395AA),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          items[index].label,
                          style: TextStyle(
                            color: selected
                                ? const Color(0xFF1769FF)
                                : const Color(0xFF8395AA),
                            fontSize: 9,
                            fontWeight: selected
                                ? FontWeight.w900
                                : FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

// ================================================================
// STAT CARD
// ================================================================

class _PremiumStatCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color accent;
  final String trend;

  const _PremiumStatCard({
    required this.icon,
    required this.value,
    required this.label,
    required this.accent,
    required this.trend,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 160,
      margin: const EdgeInsets.only(right: 11),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(21),
        border: Border.all(color: const Color(0xFFE0EAF3)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0D06152F),
            blurRadius: 12,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: accent.withOpacity(.10),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: accent, size: 21),
              ),
              const Spacer(),
              Icon(Icons.trending_up_rounded, color: accent, size: 18),
            ],
          ),

          const Spacer(),

          Text(
            value,
            style: const TextStyle(
              color: Color(0xFF06152F),
              fontSize: 24,
              fontWeight: FontWeight.w900,
            ),
          ),

          Text(
            label,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),

          const SizedBox(height: 5),

          Text(
            trend,
            style: TextStyle(
              color: accent,
              fontSize: 9,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

