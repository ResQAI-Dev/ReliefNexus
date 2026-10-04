import 'package:flutter/material.dart';
import '../../../profile/presentation/screens/profile_screen.dart';
import 'package:provider/provider.dart';

import '../providers/dashboard_provider.dart';
import '../widgets/dashboard_widgets.dart';

import '../../../disaster_reports/presentation/screens/report_disaster_screen.dart';
import '../../../risk_predictions/presentation/screens/risk_predictions_screen.dart';
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
                      if (v == 4) {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const ProfileScreen(),
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
        const PremiumActionCard(
          icon: Icons.task_alt_rounded,
          title: 'My Tasks',
          subtitle: 'Assigned operations',
          accent: Color(0xFF1769FF),
        ),
        const PremiumActionCard(
          icon: Icons.location_on_rounded,
          title: 'Live Location',
          subtitle: 'Share field location',
          accent: Color(0xFF19C7E8),
        ),
        const PremiumActionCard(
          icon: Icons.warning_amber_rounded,
          title: 'Incidents',
          subtitle: 'Report field incidents',
          accent: Color(0xFFFF5570),
        ),
        const PremiumActionCard(
          icon: Icons.notifications_active_rounded,
          title: 'Alerts',
          subtitle: 'Emergency updates',
          accent: Color(0xFF875CF6),
        ),
      ];
    }
    if (_role.contains('coordinator')) {
      return [
        const PremiumActionCard(
          icon: Icons.description_rounded,
          title: 'Disaster Reports',
          subtitle: 'Review incidents',
          accent: Color(0xFFFF5570),
        ),
        const PremiumActionCard(
          icon: Icons.inventory_2_rounded,
          title: 'Resources',
          subtitle: 'Coordinate resources',
          accent: Color(0xFF16B77A),
        ),
        const PremiumActionCard(
          icon: Icons.auto_graph_rounded,
          title: 'Risk Predictions',
          subtitle: 'Agent 01 intelligence',
          accent: Color(0xFF1769FF),
        ),
        const PremiumActionCard(
          icon: Icons.notifications_active_rounded,
          title: 'Alerts',
          subtitle: 'Emergency coordination',
          accent: Color(0xFF875CF6),
        ),
      ];
    }
    return [
      PremiumActionCard(
        icon: Icons.report_problem_rounded,
        title: 'Report Disaster',
        subtitle: 'Submit a new report',
        accent: const Color(0xFFFF5570),
        onTap: () => Navigator.of(
          context,
        ).push(MaterialPageRoute(builder: (_) => const ReportDisasterScreen())),
      ),
      PremiumActionCard(
        icon: Icons.auto_graph_rounded,
        title: 'Risk Prediction',
        subtitle: 'View AI assessment',
        accent: const Color(0xFF1769FF),
        onTap: () => Navigator.of(
          context,
        ).push(MaterialPageRoute(builder: (_) => const RiskPredictionsPage())),
      ),
      PremiumActionCard(
        icon: Icons.notifications_active_rounded,
        title: 'Emergency Alerts',
        subtitle: 'Stay informed',
        accent: const Color(0xFFFF5570),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => const AffectedUserEmergencyAlertsPage(),
          ),
        ),
      ),
      PremiumActionCard(
        icon: Icons.volunteer_activism_rounded,
        title: 'Relief Resources',
        subtitle: 'Find available support',
        accent: const Color(0xFF16B77A),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const ResourceOptimizationPage()),
        ),
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
      PremiumKpiCard(
        icon: Icons.assignment_rounded,
        value: '${data.requests}',
        label: 'Assistance Requests',
        accent: const Color(0xFF875CF6),
      ),
      PremiumKpiCard(
        icon: Icons.shield_rounded,
        value: data.riskLevel,
        label: 'Current Risk',
        accent: const Color(0xFF16B77A),
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


