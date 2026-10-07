import 'package:reliefnexus_mobile/features/emergency_alerts/presentation/screens/emergency_alerts_screen.dart';
import 'package:flutter/material.dart';
import '../resource_optimization/presentation/screens/resource_optimization_screen.dart';
import 'package:reliefnexus_mobile/core/network/api_client.dart';
import 'package:reliefnexus_mobile/features/users/presentation/screens/user_management_screen.dart';
import 'package:reliefnexus_mobile/features/role_requests/presentation/screens/role_requests_screen.dart';
import 'package:reliefnexus_mobile/features/disaster_reports/presentation/screens/disaster_reports_screen.dart';
import 'package:reliefnexus_mobile/features/risk_predictions/presentation/screens/risk_predictions_screen.dart';
import 'package:reliefnexus_mobile/features/vulnerability_impact/presentation/screens/vulnerability_impact_screen.dart';

class AdminControlCenterPage extends StatefulWidget {
  const AdminControlCenterPage({super.key});

  @override
  State<AdminControlCenterPage> createState() => _AdminControlCenterPageState();
}

class _AdminControlCenterPageState extends State<AdminControlCenterPage> {
  final ApiClient _client = ApiClient();

  bool _loading = true;
  String? _error;

  int _users = 0;
  int _roleRequests = 0;
  int _disasterReports = 0;
  int _alerts = 0;
  int _riskPredictions = 0;
  int _resources = 0;
  int _reliefRequests = 0;
  int _auditLogs = 0;
  int _locations = 0;

  @override
  void initState() {
    super.initState();
    _loadOverview();
  }

  Future<dynamic> _get(String path) async {
    final response = await _client.dio.get(path);
    return response.data;
  }

  List<dynamic> _list(dynamic value) {
    if (value is List) {
      return value;
    }

    if (value is Map) {
      for (final key in [
        'data',
        'items',
        'results',
        'users',
        'records',
        'predictions',
        'resources',
        'allocations',
      ]) {
        final candidate = value[key];
        if (candidate is List) {
          return candidate;
        }
      }
    }

    return const [];
  }

  Future<void> _loadOverview() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final results = await Future.wait<dynamic>([
        _get('/Users'),
        _get('/Users/pending-role-requests'),
        _get('/disaster-reports'),
        _get('/emergency-alerts'),
        _get(
          '/risk-predictions?page=1&pageSize=10&sortBy=createdAt&sortOrder=desc',
        ),
        _get('/resource-optimization/resources'),
        _get('/relief-requests'),
        _get('/audit-logs'),
        _get('/location-sharing'),
      ]);

      if (!mounted) return;

      setState(() {
        _users = _list(results[0]).length;
        _roleRequests = _list(results[1]).length;
        _disasterReports = _list(results[2]).length;
        _alerts = _list(results[3]).length;
        _riskPredictions = _list(results[4]).length;
        _resources = _list(results[5]).length;
        _reliefRequests = _list(results[6]).length;
        _auditLogs = _list(results[7]).length;
        _locations = _list(results[8]).length;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _loading = false;
        _error = 'Some live admin data could not be loaded.';
      });
    }
  }

  void _open(Widget page) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F6FB),
      body: RefreshIndicator(
        onRefresh: _loadOverview,
        color: const Color(0xFF38BDF8),
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(child: _hero()),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 30),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  if (_error != null) _errorCard(),

                  const SizedBox(height: 16),

                  _sectionTitle('ADMIN OVERVIEW', 'Live system intelligence'),

                  const SizedBox(height: 12),

                  _kpiGrid(),

                  const SizedBox(height: 26),

                  _sectionTitle('USER MANAGEMENT', 'Users, roles and access'),

                  const SizedBox(height: 12),

                  _moduleCard(
                    icon: Icons.people_alt_rounded,
                    title: 'User Management',
                    subtitle:
                        'Affected users, volunteers, coordinators and profiles',
                    value: '$_users users',
                    onTap: () => _open(const UserManagementPage()),
                  ),

                  _moduleCard(
                    icon: Icons.admin_panel_settings_rounded,
                    title: 'Role Requests',
                    subtitle:
                        'Review pending role requests and approve or reject',
                    value: '$_roleRequests pending',
                    onTap: () => _open(const RoleRequestsPage()),
                  ),

                  _moduleCard(
                    icon: Icons.security_rounded,
                    title: 'Permissions',
                    subtitle:
                        'Configure role permissions using the existing backend',
                    value: 'RBAC',
                    onTap: () => _open(const _PermissionsPage()),
                  ),

                  const SizedBox(height: 26),

                  _sectionTitle(
                    'DISASTER RESPONSE',
                    'Live operational modules',
                  ),

                  const SizedBox(height: 12),

                  _moduleCard(
                    icon: Icons.warning_amber_rounded,
                    title: 'Disaster Reports',
                    subtitle:
                        'Review, verify, assign, resolve and reject incidents',
                    value: '$_disasterReports reports',
                    onTap: () => _open(const DisasterReportsPage()),
                  ),

                  _moduleCard(
                    icon: Icons.medical_services_rounded,
                    title: 'Relief Requests',
                    subtitle:
                        'Review and manage real relief assistance requests',
                    value: '$_reliefRequests requests',
                    onTap: () => _open(
                      const _LiveCollectionPage(
                        title: 'Relief Requests',
                        endpoint: '/relief-requests',
                        icon: Icons.medical_services_rounded,
                      ),
                    ),
                  ),

                  _moduleCard(
                    icon: Icons.notifications_active_rounded,
                    title: 'Emergency Alerts',
                    subtitle: 'Review active alerts and operational status',
                    value: '$_alerts alerts',
                    onTap: () => _open(
                      const _LiveCollectionPage(
                        title: 'Emergency Alerts',
                        endpoint: '/emergency-alerts',
                        icon: Icons.notifications_active_rounded,
                      ),
                    ),
                  ),

                  _moduleCard(
                    icon: Icons.location_on_rounded,
                    title: 'Location Sharing',
                    subtitle: 'Review live location sharing records',
                    value: '$_locations locations',
                    onTap: () => _open(
                      const _LiveCollectionPage(
                        title: 'Location Sharing',
                        endpoint: '/location-sharing',
                        icon: Icons.location_on_rounded,
                      ),
                    ),
                  ),

                  const SizedBox(height: 26),

                  _sectionTitle(
                    'AI INTELLIGENCE',
                    'Multi-agent disaster intelligence',
                  ),

                  const SizedBox(height: 12),

                  _agentCard(
                    '01',
                    'Risk Prediction',
                    'Multi-hazard disaster risk intelligence',
                    Icons.analytics_rounded,
                    const Color(0xFF38BDF8),
                    () => _open(const RiskPredictionsPage()),
                  ),

                  _agentCard(
                    '02',
                    'Vulnerability & Impact',
                    'Assess affected population and disaster impact',
                    Icons.groups_rounded,
                    const Color(0xFF60A5FA),
                    () => _open(const VulnerabilityImpactPage()),
                  ),

                  _agentCard(
                    '03',
                    'Resource Optimization',
                    'Resources, allocations and optimization',
                    Icons.inventory_2_rounded,
                    const Color(0xFF22C55E),
                    () => _open(const _ResourceOptimizationPage()),
                  ),

                  _agentCard(
                    '04',
                    'Emergency Warning & Coordination',
                    'Emergency warnings, coordination and response actions',
                    Icons.crisis_alert_rounded,
                    const Color(0xFFF59E0B),
                    () => _open(const EmergencyAlertsPage()),
                  ),

                  const SizedBox(height: 26),

                  _sectionTitle(
                    'SYSTEM INTELLIGENCE',
                    'Administration and observability',
                  ),

                  const SizedBox(height: 12),

                  _moduleCard(
                    icon: Icons.monitor_heart_rounded,
                    title: 'System Monitoring',
                    subtitle:
                        'API and system health from the authenticated backend',
                    value: 'LIVE',
                    onTap: () => _open(const _SystemHealthPage()),
                  ),

                  _moduleCard(
                    icon: Icons.history_rounded,
                    title: 'Audit Logs',
                    subtitle: 'Review administrator activity and system events',
                    value: '$_auditLogs logs',
                    onTap: () => _open(
                      const _LiveCollectionPage(
                        title: 'Audit Logs',
                        endpoint: '/audit-logs',
                        icon: Icons.history_rounded,
                      ),
                    ),
                  ),

                  _moduleCard(
                    icon: Icons.assessment_rounded,
                    title: 'Reports',
                    subtitle:
                        'Live operational summary generated from real API data',
                    value: 'LIVE DATA',
                    onTap: () => _open(
                      _ReportsPage(
                        users: _users,
                        roleRequests: _roleRequests,
                        disasterReports: _disasterReports,
                        alerts: _alerts,
                        predictions: _riskPredictions,
                        resources: _resources,
                        reliefRequests: _reliefRequests,
                      ),
                    ),
                  ),

                  _moduleCard(
                    icon: Icons.settings_rounded,
                    title: 'System Settings',
                    subtitle:
                        'Backend-supported administration and permissions',
                    value: 'CONFIG',
                    onTap: () => _open(const _PermissionsPage()),
                  ),

                  const SizedBox(height: 26),

                  _sectionTitle(
                    'OPERATIONS',
                    'Field response and coordination',
                  ),

                  const SizedBox(height: 12),

                  _moduleCard(
                    icon: Icons.volunteer_activism_rounded,
                    title: 'Volunteer Assignment',
                    subtitle:
                        'Use the existing volunteer recommendation workflow',
                    value: 'LIVE API',
                    onTap: () => _open(
                      const _LiveCollectionPage(
                        title: 'Volunteer Assignment',
                        endpoint: '/volunteer-assignment/recommend',
                        icon: Icons.volunteer_activism_rounded,
                      ),
                    ),
                  ),

                  _moduleCard(
                    icon: Icons.notifications_none_rounded,
                    title: 'Notifications',
                    subtitle: 'Review authenticated user notifications',
                    value: 'LIVE API',
                    onTap: () => _open(
                      const _LiveCollectionPage(
                        title: 'Notifications',
                        endpoint: '/notifications',
                        icon: Icons.notifications_none_rounded,
                      ),
                    ),
                  ),

                  const SizedBox(height: 30),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _hero() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.fromLTRB(22, 20, 22, 18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: const LinearGradient(
          colors: [Color(0xFF06152F), Color(0xFF0A3158), Color(0xFF0EA5E9)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x2506152F),
            blurRadius: 24,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -45,
            top: -60,
            child: Container(
              width: 190,
              height: 190,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(.08),
              ),
            ),
          ),

          Positioned(
            right: 18,
            bottom: 16,
            child: Container(
              width: 62,
              height: 62,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(.08),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(
                Icons.admin_panel_settings_rounded,
                color: Color(0xFF7DD3FC),
                size: 32,
              ),
            ),
          ),

          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 11,
                  vertical: 7,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(.10),
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(color: Colors.white.withOpacity(.10)),
                ),
                child: const Text(
                  'SYSTEM ADMINISTRATOR',
                  style: TextStyle(
                    color: Color(0xFF7DD3FC),
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.3,
                  ),
                ),
              ),

              const SizedBox(height: 15),

              const Text(
                'Admin Control Center',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                ),
              ),

              const SizedBox(height: 7),

              SizedBox(
                width: 285,
                child: Text(
                  'Live disaster response operations, AI intelligence and system administration.',
                  style: TextStyle(
                    color: Colors.white.withOpacity(.78),
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
              ),

              const SizedBox(height: 14),

              Row(
                children: [
                  const Icon(Icons.circle, color: Color(0xFF4ADE80), size: 8),
                  const SizedBox(width: 7),
                  Text(
                    _loading ? 'SYNCING LIVE DATA' : 'LIVE SYSTEM',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: .8,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: _loadOverview,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    icon: const Icon(
                      Icons.refresh_rounded,
                      color: Colors.white,
                      size: 22,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String eyebrow, String title) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          eyebrow,
          style: const TextStyle(
            color: Color(0xFF0EA5E9),
            fontSize: 10,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.4,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          title,
          style: const TextStyle(
            color: Color(0xFF06152F),
            fontSize: 20,
            fontWeight: FontWeight.w900,
          ),
        ),
      ],
    );
  }

  Widget _kpiGrid() {
    final items = [
      ('Users', _users, Icons.people_alt_rounded),
      ('Role Requests', _roleRequests, Icons.admin_panel_settings_rounded),
      ('Reports', _disasterReports, Icons.warning_amber_rounded),
      ('Alerts', _alerts, Icons.notifications_active_rounded),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: items.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 1.55,
      ),
      itemBuilder: (_, index) {
        final item = items[index];

        return Container(
          padding: const EdgeInsets.all(15),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFD8E5F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(item.$3, color: const Color(0xFF0EA5E9), size: 21),
              const Spacer(),
              Text(
                '${item.$2}',
                style: const TextStyle(
                  color: Color(0xFF06152F),
                  fontSize: 23,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                item.$1,
                style: const TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _moduleCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required String value,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 11),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(21),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(21),
          child: Padding(
            padding: const EdgeInsets.all(17),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8F7FF),
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: Icon(icon, color: const Color(0xFF0284C7)),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          color: Color(0xFF06152F),
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 11,
                          height: 1.35,
                        ),
                      ),
                      const SizedBox(height: 7),
                      Text(
                        value,
                        style: const TextStyle(
                          color: Color(0xFF0EA5E9),
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: Color(0xFF94A3B8),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _agentCard(
    String number,
    String title,
    String subtitle,
    IconData icon,
    Color accent,
    VoidCallback onTap,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(23),
        gradient: const LinearGradient(
          colors: [Color(0xFF06152F), Color(0xFF0B315C)],
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(23),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: accent.withOpacity(.15),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: accent.withOpacity(.35)),
                  ),
                  child: Center(
                    child: Text(
                      number,
                      style: TextStyle(
                        color: accent,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: TextStyle(
                          color: Colors.white.withOpacity(.68),
                          fontSize: 11,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(icon, color: accent, size: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _errorCard() {
    return Container(
      margin: const EdgeInsets.only(top: 14),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFED7AA)),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline_rounded, color: Color(0xFFF97316)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              _error!,
              style: const TextStyle(color: Color(0xFF9A3412), fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}

class AdminAuditLogsPage extends StatelessWidget {
  const AdminAuditLogsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const _LiveCollectionPage(
      title: 'Audit Logs',
      endpoint: '/audit-logs',
      icon: Icons.history_rounded,
    );
  }
}

class AdminSystemMonitoringPage extends StatelessWidget {
  const AdminSystemMonitoringPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const _SystemHealthPage();
  }
}

class AdminSystemSettingsPage extends StatelessWidget {
  const AdminSystemSettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const _PermissionsPage();
  }
}

class _LiveCollectionPage extends StatefulWidget {
  final String title;
  final String endpoint;
  final IconData icon;

  const _LiveCollectionPage({
    required this.title,
    required this.endpoint,
    required this.icon,
  });

  @override
  State<_LiveCollectionPage> createState() => _LiveCollectionPageState();
}

class _LiveCollectionPageState extends State<_LiveCollectionPage> {
  final ApiClient _client = ApiClient();
  final TextEditingController _searchController = TextEditingController();

  bool _loading = true;
  String? _error;
  List<dynamic> _items = [];
  String _filter = 'All';

  @override
  void initState() {
    super.initState();
    _load();
    _searchController.addListener(() {
      setState(() {});
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<dynamic> _list(dynamic value) {
    if (value is List) return value;

    if (value is Map) {
      for (final key in ['data', 'items', 'results', 'records']) {
        if (value[key] is List) {
          return value[key] as List;
        }
      }
    }

    return const [];
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final response = await _client.dio.get(widget.endpoint);

      if (!mounted) return;

      setState(() {
        _items = _list(response.data);
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;

      setState(() {
        _loading = false;
        _error = 'Unable to load live data from the backend.';
      });
    }
  }

  List<dynamic> get _filteredItems {
    final query = _searchController.text.trim().toLowerCase();

    return _items.where((raw) {
      final data = raw is Map
          ? Map<String, dynamic>.from(raw)
          : <String, dynamic>{};

      final text = data.values
          .map((value) => value.toString())
          .join(' ')
          .toLowerCase();

      final status =
          (data['status'] ?? data['severity'] ?? data['role'] ?? 'Live')
              .toString()
              .toLowerCase();

      final matchesSearch = query.isEmpty || text.contains(query);

      final matchesFilter = _filter == 'All' || status == _filter.toLowerCase();

      return matchesSearch && matchesFilter;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F6FB),
      appBar: AppBar(
        backgroundColor: const Color(0xFF06152F),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Audit Logs',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Text(
                _error!,
                style: const TextStyle(color: Color(0xFF64748B)),
              ),
            )
          : Column(
              children: [
                _auditHeader(),

                Expanded(
                  child: _filteredItems.isEmpty
                      ? const Center(
                          child: Text(
                            'No matching audit records.',
                            style: TextStyle(
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _load,
                          color: const Color(0xFF0EA5E9),
                          child: ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 30),
                            itemCount: _filteredItems.length,
                            itemBuilder: (_, index) {
                              return _recordCard(
                                _filteredItems[index],
                                index + 1,
                              );
                            },
                          ),
                        ),
                ),
              ],
            ),
    );
  }

  Widget _auditHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
      color: const Color(0xFFF1F6FB),
      child: Column(
        children: [
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search logs...',
              prefixIcon: const Icon(Icons.search_rounded),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      onPressed: _searchController.clear,
                      icon: const Icon(Icons.close_rounded),
                    )
                  : null,
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(17),
                borderSide: BorderSide.none,
              ),
            ),
          ),

          const SizedBox(height: 12),

          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: ['All', 'Success', 'Warning', 'Error'].map((filter) {
                final selected = _filter == filter;

                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(filter),
                    selected: selected,
                    onSelected: (_) {
                      setState(() {
                        _filter = filter;
                      });
                    },
                    selectedColor: const Color(0xFF0EA5E9),
                    labelStyle: TextStyle(
                      color: selected ? Colors.white : const Color(0xFF64748B),
                      fontWeight: FontWeight.w700,
                    ),
                    backgroundColor: Colors.white,
                    side: BorderSide.none,
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _recordCard(dynamic raw, int number) {
    final data = raw is Map
        ? Map<String, dynamic>.from(raw)
        : <String, dynamic>{};

    final title =
        data['action'] ??
        data['title'] ??
        data['description'] ??
        'Record $number';

    final status = data['status'] ?? data['severity'] ?? data['role'] ?? 'Live';

    final statusText = status.toString();

    final statusLower = statusText.toLowerCase();

    final statusColor = statusLower == 'success'
        ? const Color(0xFF16A34A)
        : statusLower == 'error'
        ? const Color(0xFFDC2626)
        : statusLower == 'warning'
        ? const Color(0xFFD97706)
        : const Color(0xFF0284C7);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(21),
        border: Border.all(color: const Color(0xFFD8E5F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0906152F),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 15, vertical: 4),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        leading: Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            color: const Color(0xFFE8F7FF),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(widget.icon, color: const Color(0xFF0284C7), size: 22),
        ),
        title: Text(
          title.toString(),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: Color(0xFF06152F),
            fontWeight: FontWeight.w800,
          ),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            statusText,
            style: TextStyle(
              color: statusColor,
              fontWeight: FontWeight.w800,
              fontSize: 11,
            ),
          ),
        ),
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF7FAFD),
              borderRadius: BorderRadius.circular(15),
            ),
            child: Column(
              children: data.entries
                  .take(12)
                  .map(
                    (entry) =>
                        _detailRow(entry.key, entry.value?.toString() ?? ''),
                  )
                  .toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _detailRow(String key, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              key,
              style: const TextStyle(
                color: Color(0xFF64748B),
                fontSize: 10,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: Color(0xFF06152F),
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SystemHealthPage extends StatefulWidget {
  const _SystemHealthPage();

  @override
  State<_SystemHealthPage> createState() => _SystemHealthPageState();
}

class _SystemHealthPageState extends State<_SystemHealthPage> {
  final ApiClient _client = ApiClient();

  bool _loading = true;
  dynamic _data;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final response = await _client.dio.get('/auth/system-health');

      if (!mounted) return;

      setState(() {
        _data = response.data;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;

      setState(() {
        _loading = false;
        _error = 'System health could not be retrieved.';
      });
    }
  }

  double _number(dynamic value) {
    if (value is num) return value.toDouble();

    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  double _progress(double value) {
    if (value < 0) return 0;
    if (value > 100) return 100;
    return value;
  }

  Color _healthColor(double value) {
    if (value >= 90) return const Color(0xFF16A34A);
    if (value >= 70) return const Color(0xFF0EA5E9);
    if (value >= 50) return const Color(0xFFD97706);
    return const Color(0xFFDC2626);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F6FB),
      appBar: AppBar(
        backgroundColor: const Color(0xFF06152F),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'System Monitoring',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Text(
                _error!,
                style: const TextStyle(color: Color(0xFF64748B)),
              ),
            )
          : _buildHealth(),
    );
  }

  Widget _buildHealth() {
    final map = _data is Map
        ? Map<String, dynamic>.from(_data)
        : <String, dynamic>{};

    final metrics = <String, dynamic>{
      'apiAvailability': map['apiAvailability'] ?? 0,
      'databaseHealth': map['databaseHealth'] ?? 0,
      'aiServices': map['aiServices'] ?? 0,
      'storage': map['storage'] ?? 0,
      'cpuUtilization': map['cpuUtilization'] ?? 0,
      'memoryUtilization': map['memoryUtilization'] ?? 0,
      'diskUtilization': map['diskUtilization'] ?? 0,
      'apiResponseHealth': map['apiResponseHealth'] ?? 0,
      'overallHealth': map['overallHealth'] ?? 0,
    };

    final overall = _number(metrics['overallHealth']);

    return RefreshIndicator(
      onRefresh: _load,
      color: const Color(0xFF0EA5E9),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 30),
        children: [
          _healthHero(overall),

          const SizedBox(height: 18),

          _statusBanner(overall),

          const SizedBox(height: 22),

          const Text(
            'SYSTEM METRICS',
            style: TextStyle(
              color: Color(0xFF0EA5E9),
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.4,
            ),
          ),

          const SizedBox(height: 10),

          ...metrics.entries.map(
            (entry) => _metricCard(entry.key, _number(entry.value)),
          ),

          if (map['checkedAt'] != null) ...[
            const SizedBox(height: 10),
            _checkedCard(map['checkedAt'].toString()),
          ],
        ],
      ),
    );
  }

  Widget _healthHero(double overall) {
    final color = _healthColor(overall);

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(25),
        gradient: const LinearGradient(
          colors: [Color(0xFF06152F), Color(0xFF0A3158), Color(0xFF0EA5E9)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'SYSTEM INTELLIGENCE',
                  style: TextStyle(
                    color: Color(0xFF7DD3FC),
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.4,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Live System Health',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 23,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 7),
                Text(
                  'Authenticated backend health and platform performance.',
                  style: TextStyle(
                    color: Colors.white.withOpacity(.72),
                    fontSize: 11,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color.withOpacity(.16),
              border: Border.all(color: color.withOpacity(.45), width: 2),
            ),
            child: Center(
              child: Text(
                overall.toStringAsFixed(0),
                style: TextStyle(
                  color: color,
                  fontSize: 21,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusBanner(double overall) {
    final color = _healthColor(overall);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(.08),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withOpacity(.20)),
      ),
      child: Row(
        children: [
          Icon(
            overall >= 70 ? Icons.check_circle_rounded : Icons.warning_rounded,
            color: color,
            size: 27,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  overall >= 70
                      ? 'All Systems Operational'
                      : 'System Attention Required',
                  style: TextStyle(color: color, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 3),
                Text(
                  'Overall health ${overall.toStringAsFixed(0)}%',
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _metricCard(String key, double value) {
    final color = _healthColor(
      key == 'cpuUtilization' ||
              key == 'memoryUtilization' ||
              key == 'diskUtilization'
          ? 100 - value
          : value,
    );

    final label = key
        .replaceAllMapped(RegExp(r'([A-Z])'), (match) => ' ${match.group(1)}')
        .replaceFirst(key[0], key[0].toUpperCase());

    return Container(
      margin: const EdgeInsets.only(bottom: 11),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(19),
        border: Border.all(color: const Color(0xFFDCE7F1)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
              Text(
                value % 1 == 0
                    ? value.toStringAsFixed(0)
                    : value.toStringAsFixed(1),
                style: const TextStyle(
                  color: Color(0xFF06152F),
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: LinearProgressIndicator(
              minHeight: 7,
              value: _progress(value) / 100,
              backgroundColor: const Color(0xFFE8EEF5),
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ],
      ),
    );
  }

  Widget _checkedCard(String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(19),
        border: Border.all(color: const Color(0xFFDCE7F1)),
      ),
      child: Row(
        children: [
          const Icon(Icons.schedule_rounded, color: Color(0xFF0EA5E9)),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Last Checked',
              style: TextStyle(
                color: Color(0xFF64748B),
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
            ),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                color: Color(0xFF06152F),
                fontSize: 10,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ReportsPage extends StatelessWidget {
  final int users;
  final int roleRequests;
  final int disasterReports;
  final int alerts;
  final int predictions;
  final int resources;
  final int reliefRequests;

  const _ReportsPage({
    required this.users,
    required this.roleRequests,
    required this.disasterReports,
    required this.alerts,
    required this.predictions,
    required this.resources,
    required this.reliefRequests,
  });

  @override
  Widget build(BuildContext context) {
    final values = [
      ('Users', users, Icons.people_alt_rounded),
      ('Role Requests', roleRequests, Icons.admin_panel_settings_rounded),
      ('Disaster Reports', disasterReports, Icons.warning_rounded),
      ('Emergency Alerts', alerts, Icons.notifications_active_rounded),
      ('Risk Predictions', predictions, Icons.analytics_rounded),
      ('Resources', resources, Icons.inventory_2_rounded),
      ('Relief Requests', reliefRequests, Icons.medical_services_rounded),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF1F6FB),
      appBar: AppBar(
        backgroundColor: const Color(0xFF06152F),
        foregroundColor: Colors.white,
        title: const Text('Operational Reports'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF06152F), Color(0xFF0EA5E9)],
              ),
              borderRadius: BorderRadius.circular(25),
            ),
            child: const Text(
              'Live Operational Summary',
              style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          const SizedBox(height: 15),
          ...values.map(
            (item) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(19),
              ),
              child: Row(
                children: [
                  Icon(item.$3, color: const Color(0xFF0EA5E9)),
                  const SizedBox(width: 13),
                  Expanded(
                    child: Text(
                      item.$1,
                      style: const TextStyle(
                        color: Color(0xFF06152F),
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  Text(
                    '${item.$2}',
                    style: const TextStyle(
                      color: Color(0xFF06152F),
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
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

class _PermissionsPage extends StatefulWidget {
  const _PermissionsPage();

  @override
  State<_PermissionsPage> createState() => _PermissionsPageState();
}

class _PermissionsPageState extends State<_PermissionsPage> {
  final ApiClient _client = ApiClient();

  final roles = const [
    'AffectedUser',
    'FieldVolunteer',
    'ReliefCoordinator',
    'SystemAdministrator',
  ];

  final permissions = const [
    'View Risk Information',
    'Report Disaster',
    'Share Location',
    'View Emergency Alerts',
    'Manage Relief Requests',
    'Manage Relief Resources',
    'Manage Users',
    'Manage Role Requests',
    'AI Agent Monitoring',
    'Configure Permissions',
    'View Audit Logs',
    'View Reports',
  ];

  String role = 'FieldVolunteer';

  final Set<String> selected = {};

  bool _saving = false;
  String? _message;

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _message = null;
    });

    try {
      await _client.dio.put(
        '/permissions/role',
        data: {'role': role, 'permissions': selected.toList()},
      );

      if (!mounted) return;

      setState(() {
        _saving = false;
        _message = 'Permissions saved successfully.';
      });
    } catch (_) {
      if (!mounted) return;

      setState(() {
        _saving = false;
        _message = 'Permission update was rejected by the backend.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F6FB),
      appBar: AppBar(
        backgroundColor: const Color(0xFF06152F),
        foregroundColor: Colors.white,
        title: const Text('Permissions'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'ROLE',
            style: TextStyle(
              color: Color(0xFF0EA5E9),
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.3,
            ),
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: role,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
            ),
            items: roles
                .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                .toList(),
            onChanged: (value) {
              if (value != null) {
                setState(() => role = value);
              }
            },
          ),
          const SizedBox(height: 20),
          ...permissions.map(
            (permission) => CheckboxListTile(
              value: selected.contains(permission),
              onChanged: (value) {
                setState(() {
                  if (value == true) {
                    selected.add(permission);
                  } else {
                    selected.remove(permission);
                  }
                });
              },
              title: Text(
                permission,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF06152F),
                ),
              ),
              activeColor: const Color(0xFF0EA5E9),
              tileColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14),
            ),
          ),
          const SizedBox(height: 18),
          SizedBox(
            height: 54,
            child: ElevatedButton.icon(
              onPressed: _saving ? null : _save,
              icon: const Icon(Icons.save_rounded),
              label: Text(_saving ? 'Saving...' : 'Save Permissions'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF06152F),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(17),
                ),
              ),
            ),
          ),
          if (_message != null) ...[
            const SizedBox(height: 12),
            Text(
              _message!,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFF0284C7),
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ResourceOptimizationPage extends StatelessWidget {
  const _ResourceOptimizationPage();

  @override
  Widget build(BuildContext context) {
    return const ResourceOptimizationPage();
  }
}
