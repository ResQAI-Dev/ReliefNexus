import '../../../ai_optimization/presentation/screens/ai_optimization_page.dart';
import 'package:flutter/material.dart';
import '../../../profile/presentation/screens/profile_screen.dart';
import 'package:provider/provider.dart';

import '../providers/dashboard_provider.dart';
import '../widgets/dashboard_widgets.dart';

import '../../../disaster_reports/presentation/screens/report_disaster_screen.dart';
import '../../../risk_predictions/presentation/screens/risk_predictions_screen.dart';
import '../../../disaster_reports/presentation/screens/field_volunteer_operations_screen.dart';
import '../../../emergency_alerts/presentation/screens/affected_user_emergency_alerts_screen.dart';
import '../../../resource_optimization/presentation/screens/resource_optimization_screen.dart';

class UserDashboard extends StatefulWidget {
  final String fullName;
  final String userRole;
  const UserDashboard({
    super.key,
    required this.fullName,
    required this.userRole,
  });

  @override
  State<UserDashboard> createState() => _UserDashboardState();
}

class _UserDashboardState extends State<UserDashboard> {
  int _selected = 0;

  static const _hero =
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80';
  static const _photos = [
    'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80',
  ];

  String get _role => widget.userRole.trim().toLowerCase();

  String get _roleTitle {
    if (_role == 'fieldvolunteer' || _role == 'field volunteer') {
      return 'Field Volunteer';
    }
    if (_role == 'reliefcoordinator' || _role == 'relief coordinator') {
      return 'Relief Coordinator';
    }
    return 'Affected User';
  }

  String get _firstName {
    final n = widget.fullName.trim();
    return n.isEmpty ? 'Welcome' : n.split(' ').first;
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => DashboardProvider()..loadDashboard(),
      child: Consumer<DashboardProvider>(
        builder: (context, data, _) => Scaffold(
          backgroundColor: const Color(0xFFF4F7FC),
          body: SafeArea(
            child: Stack(
              children: [
                CustomScrollView(
                  physics: const ClampingScrollPhysics(),
                  slivers: [
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(18, 14, 18, 100),
                      sliver: SliverList(
                        delegate: SliverChildListDelegate([
                          _TopBar(name: _firstName, role: _roleTitle),
                          const SizedBox(height: 16),
                          DashboardPhotoHero(
                            title: 'Stay Safe. Stay Connected.',
                            subtitle:
                                'Report incidents, view risk intelligence and access coordinated disaster support.',
                            imageUrl: _hero,
                            badge: _roleTitle.toUpperCase(),
                          ),
                          const SizedBox(height: 16),
                          const DashboardSectionTitle(
                            title: 'Response Pulse',
                            subtitle:
                                'A quick overview of disaster response activity.',
                          ),
                          GridView.count(
                            crossAxisCount: 2,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 10,
                            childAspectRatio: 1.35,
                            children: [
                              PremiumKpiCard(
                                icon: Icons.assignment_rounded,
                                value: '${data.requests}',
                                label: 'My Requests',
                                accent: const Color(0xFF875CF6),
                              ),
                              PremiumKpiCard(
                                icon: Icons.shield_rounded,
                                value: data.riskLevel,
                                label: 'Current Risk',
                                accent: const Color(0xFFFF5570),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),
                          _KpiGrid(data: data),
                          const SizedBox(height: 28),
                          DashboardSectionTitle(
                            title: _sectionTitle,
                            subtitle: _sectionSubtitle,
                          ),
                          _grid(_actions),
                          const SizedBox(height: 28),
                          const DashboardSectionTitle(
                            title: 'Response Gallery',
                            subtitle:
                                'Latest visual updates from the response network.',
                          ),
                          const DashboardPhotoStrip(images: _photos),
                          const SizedBox(height: 28),
                          const DashboardSectionTitle(
                            title: 'Risk Intelligence',
                            subtitle:
                                'AI-powered information connected to your response workflow.',
                          ),
                          _RiskCard(data: data),
                        ]),
                      ),
                    ),
                  ],
                ),
                Align(
                  alignment: Alignment.bottomCenter,
                  child: DashboardBottomNav(
                    showUsers: false,
                    selected: _selected,
                    onChanged: (v) {
                      if (v == 3) {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const ProfileScreen(),
                          ),
                        );
                        return;
                      }

                      if (v == 1) {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) =>
                                const AffectedUserEmergencyAlertsPage(),
                          ),
                        );
                        return;
                      }

                      if (v == 2) {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const ResourceOptimizationPage(),
                          ),
                        );
                        return;
                      }

                      setState(() => _selected = v);
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String get _sectionTitle {
    if (_role.contains('volunteer')) {
      return 'Field Operations';
    }
    if (_role.contains('coordinator')) {
      return 'Response Operations';
    }
    return 'Quick Response';
  }

  String get _sectionSubtitle {
    if (_role.contains('volunteer')) {
      return 'Tasks, incidents, location and emergency coordination.';
    }
    if (_role.contains('coordinator')) {
      return 'Monitor incidents, resources, risk and alerts.';
    }
    return 'Everything you need to report and stay informed.';
  }

  List<Widget> get _actions {
    if (_role.contains('volunteer')) {
      return [
        PremiumActionCard(
          icon: Icons.assignment_rounded,
          title: 'Field Operations',
          subtitle: 'View assigned tasks and submit field updates',
          accent: const Color(0xFF059669),
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => const FieldVolunteerOperationsScreen(),
            ),
          ),
        ),
        PremiumActionCard(
          icon: Icons.auto_graph_rounded,
          title: 'Risk Prediction',
          subtitle: 'View AI risk assessment',
          accent: const Color(0xFF1769FF),
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const RiskPredictionsPage()),
          ),
        ),
      ];
    }

    if (_role.contains('coordinator')) {
      return [
        PremiumActionCard(
          icon: Icons.auto_awesome_rounded,
          title: 'AI Optimization',
          subtitle: 'AI planning and resource intelligence',
          accent: const Color(0xFF7C3AED),
          onTap: () => Navigator.of(
            context,
          ).push(MaterialPageRoute(builder: (_) => const AiOptimizationPage())),
        ),
        PremiumActionCard(
          icon: Icons.description_rounded,
          title: 'Disaster Reports',
          subtitle: 'Review incidents',
          accent: const Color(0xFFFF5570),
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const ReportDisasterScreen()),
          ),
        ),
        PremiumActionCard(
          icon: Icons.inventory_2_rounded,
          title: 'Resources',
          subtitle: 'Coordinate resources',
          accent: const Color(0xFF16B77A),
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const ResourceOptimizationPage()),
          ),
        ),
        PremiumActionCard(
          icon: Icons.auto_graph_rounded,
          title: 'Risk Predictions',
          subtitle: 'Agent 01 intelligence',
          accent: const Color(0xFF1769FF),
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const RiskPredictionsPage()),
          ),
        ),
        PremiumActionCard(
          icon: Icons.notifications_active_rounded,
          title: 'Alerts',
          subtitle: 'Emergency coordination',
          accent: const Color(0xFF875CF6),
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => const AffectedUserEmergencyAlertsPage(),
            ),
          ),
        ),
      ];
    }

    return [
      PremiumActionCard(
        icon: Icons.description_rounded,
        title: 'Report Disaster',
        subtitle: 'Submit a disaster or incident report',
        accent: const Color(0xFFFF5570),
        onTap: () => Navigator.of(
          context,
        ).push(MaterialPageRoute(builder: (_) => const ReportDisasterScreen())),
      ),
      PremiumActionCard(
        icon: Icons.notifications_active_rounded,
        title: 'Emergency Alerts',
        subtitle: 'View emergency notifications',
        accent: const Color(0xFF1769FF),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => const AffectedUserEmergencyAlertsPage(),
          ),
        ),
      ),
      PremiumActionCard(
        icon: Icons.auto_graph_rounded,
        title: 'Risk Prediction',
        subtitle: 'View AI risk assessment',
        accent: const Color(0xFF7C3AED),
        onTap: () => Navigator.of(
          context,
        ).push(MaterialPageRoute(builder: (_) => const RiskPredictionsPage())),
      ),
      PremiumActionCard(
        icon: Icons.auto_awesome_rounded,
        title: 'AI Optimization',
        subtitle: 'AI-powered disaster response intelligence',
        accent: const Color(0xFF7C3AED),
        onTap: () => Navigator.of(
          context,
        ).push(MaterialPageRoute(builder: (_) => const AiOptimizationPage())),
      ),
      PremiumActionCard(
        icon: Icons.location_on_rounded,
        title: 'Location Sharing',
        subtitle: 'Manage your location',
        accent: const Color(0xFF0891B2),
        onTap: () => Navigator.of(
          context,
        ).push(MaterialPageRoute(builder: (_) => const ProfileScreen())),
      ),
    ];
  }

  Widget _grid(List<Widget> cards) => GridView.count(
    crossAxisCount: 2,
    shrinkWrap: true,
    physics: const NeverScrollableScrollPhysics(),
    mainAxisSpacing: 11,
    crossAxisSpacing: 11,
    childAspectRatio: 1.20,
    children: cards,
  );
}

class _TopBar extends StatelessWidget {
  final String name;
  final String role;
  const _TopBar({required this.name, required this.role});

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Container(
        width: 52,
        height: 52,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF1769FF), Color(0xFF19C7E8)],
          ),
          borderRadius: BorderRadius.all(Radius.circular(17)),
        ),
        child: const Icon(
          Icons.volunteer_activism_rounded,
          color: Colors.white,
          size: 27,
        ),
      ),
      const SizedBox(width: 12),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              role,
              style: const TextStyle(color: Color(0xFF71809B), fontSize: 9),
            ),
            Text(
              name,
              style: const TextStyle(
                color: Color(0xFF071A3D),
                fontSize: 21,
                fontWeight: FontWeight.w900,
              ),
            ),
            const Text(
              'ReliefNexus response platform',
              style: TextStyle(color: Color(0xFF71809B), fontSize: 8),
            ),
          ],
        ),
      ),
      Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(17),
          border: Border.all(color: Color(0xFFE5EAF2)),
        ),
        child: const Icon(
          Icons.notifications_none_rounded,
          color: Color(0xFF071A3D),
          size: 23,
        ),
      ),
    ],
  );
}

class _KpiGrid extends StatelessWidget {
  final DashboardProvider data;
  const _KpiGrid({required this.data});

  @override
  Widget build(BuildContext context) => GridView.count(
    crossAxisCount: 2,
    shrinkWrap: true,
    physics: const NeverScrollableScrollPhysics(),
    crossAxisSpacing: 10,
    mainAxisSpacing: 10,
    childAspectRatio: 1.15,
    children: [
      PremiumKpiCard(
        icon: Icons.description_rounded,
        value: '${data.reports}',
        label: 'My Reports',
        accent: const Color(0xFFFF5570),
      ),
      PremiumKpiCard(
        icon: Icons.notifications_active_rounded,
        value: '${data.alerts}',
        label: 'Emergency Alerts',
        accent: const Color(0xFF1769FF),
      ),
    ],
  );
}

class _RiskCard extends StatelessWidget {
  final DashboardProvider data;
  const _RiskCard({required this.data});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        colors: [Color(0xFF071A3D), Color(0xFF1769FF)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      borderRadius: BorderRadius.circular(24),
      boxShadow: const [
        BoxShadow(
          color: Color(0x2407193D),
          blurRadius: 22,
          offset: Offset(0, 10),
        ),
      ],
    ),
    child: Row(
      children: [
        Container(
          width: 54,
          height: 54,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: .12),
            borderRadius: BorderRadius.circular(17),
          ),
          child: const Icon(
            Icons.auto_awesome_rounded,
            color: Colors.white,
            size: 27,
          ),
        ),
        const SizedBox(width: 13),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'AI RISK INTELLIGENCE',
                style: TextStyle(
                  color: Color(0xFFB9D5FF),
                  fontSize: 8,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 5),
              Text(
                data.riskLevel,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 3),
              const Text(
                'Latest risk information from Agent 01.',
                style: TextStyle(color: Colors.white70, fontSize: 9),
              ),
            ],
          ),
        ),
        Text(
          data.riskScore.toStringAsFixed(0),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 28,
            fontWeight: FontWeight.w900,
          ),
        ),
      ],
    ),
  );
}
