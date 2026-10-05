import 'package:reliefnexus_mobile/core/network/api_client.dart';
import 'package:reliefnexus_mobile/features/admin_control/admin_control_center_entry.dart';
import 'package:reliefnexus_mobile/features/admin_control/admin_control_center_screen.dart';
import 'package:flutter/material.dart';
import '../../../admin_control/presentation/screens/admin_profile_screen.dart';
import 'package:provider/provider.dart';

import '../providers/dashboard_provider.dart';
import '../widgets/dashboard_widgets.dart';
import '../../../risk_predictions/presentation/screens/risk_predictions_screen.dart';
import '../../../role_requests/presentation/screens/role_requests_screen.dart';
import '../../../disaster_reports/presentation/screens/disaster_reports_screen.dart';
import '../../../vulnerability_impact/presentation/screens/vulnerability_impact_screen.dart';
import '../../../users/presentation/screens/user_management_screen.dart';
import '../../../resource_optimization/presentation/screens/resource_optimization_screen.dart';
import '../../../emergency_alerts/presentation/screens/emergency_alerts_screen.dart';

// ============================================================================
// RELIEFNEXUS  PREMIUM ADMIN DASHBOARD
// Existing provider/API data and existing feature pages are preserved.
// ============================================================================

// ============================================================================
// PREMIUM NOTIFICATIONS
// Existing backend: GET /notifications
// ============================================================================

class AdminNotificationsPage extends StatefulWidget {
  const AdminNotificationsPage({super.key});

  @override
  State<AdminNotificationsPage> createState() => _AdminNotificationsPageState();
}

class _AdminNotificationsPageState extends State<AdminNotificationsPage>
    with SingleTickerProviderStateMixin {
  final ApiClient _api = ApiClient();

  late final AnimationController _controller;

  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  String? _error;
  int _filter = 0;

  static const _mint = Color(0xFF16BFA2);
  static const _navy = Color(0xFF061A3A);
  static const _bg = Color(0xFFF2FAF8);

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _load();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final response = await _api.dio.get('/notifications');
      final raw = response.data;

      List<dynamic> list;
      if (raw is List) {
        list = raw;
      } else if (raw is Map<String, dynamic>) {
        final candidate = raw['data'] ?? raw['items'] ?? raw['notifications'];
        list = candidate is List ? candidate : [raw];
      } else {
        list = [];
      }

      _items = list
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();

      if (!mounted) return;
      setState(() => _loading = false);
      _controller
        ..reset()
        ..forward();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Unable to load notifications right now.';
      });
    }
  }

  String _value(Map<String, dynamic> item, String key) {
    final value = item[key];
    return value == null ? '' : value.toString();
  }

  bool _isRead(Map<String, dynamic> item) {
    final value = item['isRead'];
    if (value is bool) return value;
    return value?.toString().toLowerCase() == 'true';
  }

  int get _unreadCount => _items.where((e) => !_isRead(e)).length;

  List<Map<String, dynamic>> get _filtered {
    if (_filter == 0) return _items;
    if (_filter == 1) return _items.where((e) => !_isRead(e)).toList();

    return _items.where((e) {
      final type = _value(e, 'type').toLowerCase();
      final title = _value(e, 'title').toLowerCase();

      if (_filter == 2) {
        return type.contains('system') || title.contains('system');
      }

      return type.contains('security') ||
          type.contains('role') ||
          title.contains('login');
    }).toList();
  }

  IconData _icon(Map<String, dynamic> item) {
    final type = _value(item, 'type').toLowerCase();
    final title = _value(item, 'title').toLowerCase();

    if (type.contains('role') || title.contains('role')) {
      return Icons.person_add_alt_1_rounded;
    }
    if (type.contains('alert') || title.contains('alert')) {
      return Icons.warning_amber_rounded;
    }
    if (type.contains('report') || title.contains('report')) {
      return Icons.description_rounded;
    }
    if (type.contains('security') || title.contains('login')) {
      return Icons.shield_rounded;
    }
    return Icons.notifications_active_rounded;
  }

  Color _accent(Map<String, dynamic> item) {
    final type = _value(item, 'type').toLowerCase();
    final title = _value(item, 'title').toLowerCase();

    if (type.contains('alert') || title.contains('alert')) {
      return const Color(0xFFFFA21A);
    }
    if (type.contains('report') || title.contains('report')) {
      return const Color(0xFFFF5B75);
    }
    if (type.contains('security') || title.contains('login')) {
      return const Color(0xFF865CF5);
    }
    return _mint;
  }

  String _time(String raw) {
    if (raw.isEmpty) return 'Live';

    final date = DateTime.tryParse(raw);
    if (date == null) return raw;

    final diff = DateTime.now().difference(date.toLocal());

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} hr ago';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays} days ago';

    return '${date.day.toString().padLeft(2, '0')}/'
        '${date.month.toString().padLeft(2, '0')}/'
        '${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    final items = _filtered;

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _navy,
        foregroundColor: Colors.white,
        elevation: 0,
        titleSpacing: 4,
        title: const Text(
          'Notifications',
          style: TextStyle(fontSize: 21, fontWeight: FontWeight.w900),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            onPressed: _loading ? null : _load,
            icon: const Icon(Icons.refresh_rounded),
          ),
          const SizedBox(width: 5),
        ],
      ),
      body: RefreshIndicator(
        color: _mint,
        onRefresh: _load,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(
            parent: AlwaysScrollableScrollPhysics(),
          ),
          slivers: [
            SliverToBoxAdapter(
              child: Container(
                padding: const EdgeInsets.fromLTRB(18, 2, 18, 20),
                decoration: const BoxDecoration(
                  color: _navy,
                  borderRadius: BorderRadius.vertical(
                    bottom: Radius.circular(30),
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        const Expanded(
                          child: Text(
                            'Live platform activity, approvals and system updates.',
                            style: TextStyle(
                              color: Color(0xBFFFFFFF),
                              fontSize: 9,
                              height: 1.4,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 7,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0x202FE0C1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0x4230E0C1)),
                          ),
                          child: Text(
                            '$_unreadCount unread',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 8,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        _NotificationFilter(
                          label: 'All',
                          selected: _filter == 0,
                          onTap: () => setState(() => _filter = 0),
                        ),
                        const SizedBox(width: 7),
                        _NotificationFilter(
                          label: 'Unread',
                          selected: _filter == 1,
                          onTap: () => setState(() => _filter = 1),
                        ),
                        const SizedBox(width: 7),
                        _NotificationFilter(
                          label: 'System',
                          selected: _filter == 2,
                          onTap: () => setState(() => _filter = 2),
                        ),
                        const SizedBox(width: 7),
                        _NotificationFilter(
                          label: 'Security',
                          selected: _filter == 3,
                          onTap: () => setState(() => _filter = 3),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            if (_loading)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(child: CircularProgressIndicator(color: _mint)),
              )
            else if (_error != null)
              SliverFillRemaining(
                hasScrollBody: false,
                child: _NotificationEmptyState(
                  title: 'Notifications unavailable',
                  subtitle: _error!,
                  action: _load,
                ),
              )
            else if (items.isEmpty)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: _NotificationEmptyState(
                  title: 'No notifications',
                  subtitle: 'There are no notifications in this category.',
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
                sliver: SliverList.separated(
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 11),
                  itemBuilder: (_, index) {
                    final item = items[index];
                    return _AnimatedNotificationCard(
                      animation: _controller,
                      index: index,
                      item: item,
                      icon: _icon(item),
                      accent: _accent(item),
                      timeLabel: _time(_value(item, 'createdAt')),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _NotificationFilter extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _NotificationFilter({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 240),
            height: 38,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: selected ? Colors.white : const Color(0x162FE0C1),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: selected ? Colors.white : const Color(0x3A2FE0C1),
              ),
            ),
            child: Text(
              label,
              style: TextStyle(
                color: selected ? const Color(0xFF061A3A) : Colors.white,
                fontSize: 8,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _AnimatedNotificationCard extends StatefulWidget {
  final AnimationController animation;
  final int index;
  final Map<String, dynamic> item;
  final IconData icon;
  final Color accent;
  final String timeLabel;

  const _AnimatedNotificationCard({
    required this.animation,
    required this.index,
    required this.item,
    required this.icon,
    required this.accent,
    required this.timeLabel,
  });

  @override
  State<_AnimatedNotificationCard> createState() =>
      _AnimatedNotificationCardState();
}

class _AnimatedNotificationCardState extends State<_AnimatedNotificationCard> {
  bool _expanded = false;

  String _value(String key) {
    final value = widget.item[key];
    return value == null ? '' : value.toString();
  }

  bool get _read {
    final value = widget.item['isRead'];
    if (value is bool) return value;
    return value?.toString().toLowerCase() == 'true';
  }

  @override
  Widget build(BuildContext context) {
    final title = _value('title').isEmpty ? 'Notification' : _value('title');
    final message = _value('message');
    final type = _value('type').isEmpty ? 'SYSTEM' : _value('type');

    return AnimatedBuilder(
      animation: widget.animation,
      builder: (_, child) {
        final begin = (widget.index * .06).clamp(0.0, .65);
        final end = (begin + .35).clamp(0.0, 1.0);
        final curve = CurvedAnimation(
          parent: widget.animation,
          curve: Interval(begin, end, curve: Curves.easeOutCubic),
        );

        return FadeTransition(
          opacity: curve,
          child: SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0, .08),
              end: Offset.zero,
            ).animate(curve),
            child: child,
          ),
        );
      },
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => setState(() => _expanded = !_expanded),
          borderRadius: BorderRadius.circular(24),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 260),
            curve: Curves.easeOutCubic,
            padding: const EdgeInsets.all(13),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: _read
                    ? const Color(0xFFE0E9E8)
                    : widget.accent.withValues(alpha: .35),
                width: _read ? 1 : 1.25,
              ),
              boxShadow: [
                BoxShadow(
                  color: widget.accent.withValues(alpha: _read ? .04 : .09),
                  blurRadius: _expanded ? 25 : 17,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 47,
                      height: 47,
                      decoration: BoxDecoration(
                        color: widget.accent.withValues(alpha: .10),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Icon(widget.icon, color: widget.accent, size: 22),
                    ),
                    const SizedBox(width: 11),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: const Color(0xFF061A3A),
                              fontSize: 12.5,
                              fontWeight: _read
                                  ? FontWeight.w700
                                  : FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 7,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: widget.accent.withValues(alpha: .10),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  type.toUpperCase(),
                                  style: TextStyle(
                                    color: widget.accent,
                                    fontSize: 6.5,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: .5,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 7),
                              Text(
                                widget.timeLabel,
                                style: const TextStyle(
                                  color: Color(0xFF8795A8),
                                  fontSize: 7.5,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      _expanded
                          ? Icons.keyboard_arrow_up_rounded
                          : Icons.keyboard_arrow_down_rounded,
                      color: const Color(0xFF64748B),
                    ),
                  ],
                ),
                if (_expanded) ...[
                  const SizedBox(height: 13),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF7FAFC),
                      borderRadius: BorderRadius.circular(17),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (message.isNotEmpty)
                          Text(
                            message,
                            style: const TextStyle(
                              color: Color(0xFF52647B),
                              fontSize: 9,
                              height: 1.45,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        if (message.isNotEmpty) const SizedBox(height: 9),
                        _NotificationDetail(label: 'ID', value: _value('id')),
                        _NotificationDetail(
                          label: 'User ID',
                          value: _value('userId'),
                        ),
                        _NotificationDetail(
                          label: 'Status',
                          value: _read ? 'Read' : 'Unread',
                        ),
                        _NotificationDetail(
                          label: 'Created At',
                          value: _value('createdAt'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {},
                          style: OutlinedButton.styleFrom(
                            foregroundColor: widget.accent,
                            side: BorderSide(
                              color: widget.accent.withValues(alpha: .35),
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: Text(
                            _read ? 'Read' : 'Mark as Read',
                            style: const TextStyle(
                              fontSize: 8,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 9),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            elevation: 0,
                            backgroundColor: widget.accent,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: const Text(
                            'View Details',
                            style: TextStyle(
                              fontSize: 8,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NotificationDetail extends StatelessWidget {
  final String label;
  final String value;

  const _NotificationDetail({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    if (value.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 62,
            child: Text(
              label,
              style: const TextStyle(
                color: Color(0xFF7C8BA0),
                fontSize: 7,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: Color(0xFF33445C),
                fontSize: 7.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NotificationEmptyState extends StatelessWidget {
  final String title;
  final String subtitle;
  final VoidCallback? action;

  const _NotificationEmptyState({
    required this.title,
    required this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(30),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 74,
              height: 74,
              decoration: BoxDecoration(
                color: const Color(0x1516BFA2),
                borderRadius: BorderRadius.circular(25),
              ),
              child: const Icon(
                Icons.notifications_none_rounded,
                color: Color(0xFF16BFA2),
                size: 35,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                color: Color(0xFF061A3A),
                fontSize: 16,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 7),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFF7A8AA2),
                fontSize: 9,
                height: 1.4,
              ),
            ),
            if (action != null) ...[
              const SizedBox(height: 15),
              ElevatedButton(
                onPressed: action,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF16BFA2),
                  foregroundColor: Colors.white,
                  elevation: 0,
                ),
                child: const Text('Retry'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class AdminDashboard extends StatefulWidget {
  final String fullName;

  const AdminDashboard({super.key, required this.fullName});

  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  int _selected = 0;

  static const Color _bg = Color(0xFFF5F8FD);
  static const Color _navy = Color(0xFF061A3A);
  static const Color _blue = Color(0xFF16BFA2);
  static const Color _cyan = Color(0xFF2FE0C1);
  static const Color _muted = Color(0xFF73829B);

  static const _hero =
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1400&q=90';

  static const _photos = [
    'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=900&q=90',
    'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=900&q=90',
    'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=90',
    'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=90',
  ];

  String get _firstName {
    final name = widget.fullName.trim();
    return name.isEmpty ? 'Administrator' : name.split(' ').first;
  }

  void _push(Widget page) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
  }

  void _openUsers() => _push(const UserManagementPage());
  void _openAlerts() => _push(const EmergencyAlertsPage());
  void _openNotifications() => _push(const AdminNotificationsPage());
  void _openSystem() => _push(const AdminControlCenterPage());

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => DashboardProvider()..loadDashboard(),
      child: Consumer<DashboardProvider>(
        builder: (context, data, _) {
          return Scaffold(
            backgroundColor: _bg,
            body: SafeArea(
              bottom: false,
              child: Stack(
                children: [
                  Positioned.fill(
                    child: IgnorePointer(
                      child: CustomPaint(
                        painter: _DashboardBackgroundPainter(),
                      ),
                    ),
                  ),

                  CustomScrollView(
                    physics: const BouncingScrollPhysics(),
                    slivers: [
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(18, 12, 18, 118),
                        sliver: SliverList(
                          delegate: SliverChildListDelegate([
                            _PremiumTopBar(
                              name: _firstName,
                              onNotifications: _openNotifications,
                              onSystem: _openSystem,
                            ),

                            const SizedBox(height: 18),

                            const _PremiumHero(imageUrl: _hero),

                            const SizedBox(height: 18),

                            _PremiumLiveBar(
                              users: data.users,
                              alerts: data.alerts,
                            ),

                            const SizedBox(height: 18),

                            _PremiumKpiGrid(
                              users: data.users.toString(),
                              requests: data.requests.toString(),
                              reports: data.reports.toString(),
                              alerts: data.alerts.toString(),
                            ),

                            const SizedBox(height: 30),

                            _PremiumSectionHeader(
                              title: 'Administration',
                              subtitle:
                                  'Manage users, permissions, approvals and incident intelligence.',
                              onTap: _openUsers,
                            ),

                            const SizedBox(height: 13),

                            _grid([
                              PremiumActionCard(
                                icon: Icons.people_alt_rounded,
                                title: 'User Management',
                                subtitle: 'Users & accounts',
                                accent: _blue,
                                onTap: _openUsers,
                              ),
                              PremiumActionCard(
                                icon: Icons.admin_panel_settings_rounded,
                                title: 'Role Requests',
                                subtitle: 'Approve permissions',
                                accent: const Color(0xFF855CF7),
                                onTap: () => _push(const RoleRequestsPage()),
                              ),
                              PremiumActionCard(
                                icon: Icons.description_rounded,
                                title: 'Disaster Reports',
                                subtitle: 'Review incidents',
                                accent: const Color(0xFFFF5872),
                                onTap: () => _push(const DisasterReportsPage()),
                              ),
                              PremiumActionCard(
                                icon: Icons.lock_person_rounded,
                                title: 'Permissions',
                                subtitle: 'Roles & access control',
                                accent: const Color(0xFF16BFA2),
                                onTap: () =>
                                    _push(const AdminSystemSettingsPage()),
                              ),
                              PremiumActionCard(
                                icon: Icons.auto_graph_rounded,
                                title: 'Risk Predictions',
                                subtitle: 'Agent 01 intelligence',
                                accent: _blue,
                                onTap: () => _push(const RiskPredictionsPage()),
                              ),
                            ]),

                            const SizedBox(height: 31),

                            _PremiumSectionHeader(
                              title: 'Operations',
                              subtitle:
                                  'Monitor the complete disaster response network.',
                              onTap: _openAlerts,
                            ),

                            const SizedBox(height: 13),

                            _grid([
                              PremiumActionCard(
                                icon: Icons.shield_rounded,
                                title: 'Vulnerability & Impact',
                                subtitle: 'Agent 02 analysis',
                                accent: const Color(0xFF12B981),
                                onTap: () =>
                                    _push(const VulnerabilityImpactPage()),
                              ),
                              PremiumActionCard(
                                icon: Icons.inventory_2_rounded,
                                title: 'Resources',
                                subtitle: 'Agent 03 optimization',
                                accent: const Color(0xFF0B9ED7),
                                onTap: () =>
                                    _push(const ResourceOptimizationPage()),
                              ),
                              PremiumActionCard(
                                icon: Icons.notifications_active_rounded,
                                title: 'Emergency Alerts',
                                subtitle: 'Live emergency network',
                                accent: const Color(0xFFFFA21A),
                                onTap: _openAlerts,
                              ),
                              PremiumActionCard(
                                icon: Icons.monitor_heart_rounded,
                                title: 'System Monitoring',
                                subtitle: 'Live platform status',
                                accent: const Color(0xFF119B91),
                                onTap: () => _push(const _AdminHealthPage()),
                              ),
                            ]),

                            const SizedBox(height: 31),

                            _PremiumSectionHeader(
                              title: 'Response Gallery',
                              subtitle:
                                  'Visual snapshots from the disaster response network.',
                              onTap: () {},
                            ),

                            const SizedBox(height: 13),

                            const _PremiumPhotoGallery(images: _photos),

                            const SizedBox(height: 31),

                            _PremiumSectionHeader(
                              title: 'System',
                              subtitle: 'Security, records and configuration.',
                              onTap: _openSystem,
                            ),

                            const SizedBox(height: 13),

                            _grid([
                              PremiumActionCard(
                                icon: Icons.receipt_long_rounded,
                                title: 'Audit Logs',
                                subtitle: 'Activity records',
                                accent: const Color(0xFF119B91),
                                onTap: () => _push(
                                  const _AdminLivePage(
                                    title: 'Audit Logs',
                                    endpoint: '/audit-logs',
                                    icon: Icons.receipt_long_rounded,
                                  ),
                                ),
                              ),
                              PremiumActionCard(
                                icon: Icons.settings_rounded,
                                title: 'System Settings',
                                subtitle: 'Permissions & administration',
                                accent: const Color(0xFF119B91),
                                onTap: _openSystem,
                              ),
                            ]),

                            const SizedBox(height: 14),

                            const _PremiumHealthCard(),

                            const SizedBox(height: 8),
                          ]),
                        ),
                      ),
                    ],
                  ),

                  Align(
                    alignment: Alignment.bottomCenter,
                    child: DashboardBottomNav(
                      selected: _selected,
                      onChanged: (value) {
                        if (value == 4) {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => const AdminProfilePage(),
                            ),
                          );
                          return;
                        }

                        setState(() => _selected = value);

                        if (value == 1) {
                          _openUsers();
                        } else if (value == 2) {
                          _openNotifications();
                        } else if (value == 3) {
                          _openSystem();
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _grid(List<Widget> cards) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 13,
      crossAxisSpacing: 13,
      childAspectRatio: 1.30,
      children: [
        for (var i = 0; i < cards.length; i++)
          _DashboardEntrance(index: i, child: cards[i]),
      ],
    );
  }
}

// ============================================================================
// TOP HEADER
// ============================================================================

class _DashboardEntrance extends StatefulWidget {
  final int index;
  final Widget child;

  const _DashboardEntrance({required this.index, required this.child});

  @override
  State<_DashboardEntrance> createState() => _DashboardEntranceState();
}

class _DashboardEntranceState extends State<_DashboardEntrance>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 650),
    );

    Future.delayed(Duration(milliseconds: 70 * widget.index), () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final animation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    );

    return FadeTransition(
      opacity: animation,
      child: SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0, .07),
          end: Offset.zero,
        ).animate(animation),
        child: widget.child,
      ),
    );
  }
}

class _PremiumTopBar extends StatelessWidget {
  final String name;
  final VoidCallback onNotifications;
  final VoidCallback onSystem;

  const _PremiumTopBar({
    required this.name,
    required this.onNotifications,
    required this.onSystem,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: 57,
              height: 57,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF16BFA2), Color(0xFF2FE0C1)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(19),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x301769FF),
                    blurRadius: 18,
                    offset: Offset(0, 7),
                  ),
                ],
              ),
              child: const Icon(
                Icons.person_rounded,
                color: Colors.white,
                size: 29,
              ),
            ),
            Positioned(
              right: -2,
              bottom: -2,
              child: Container(
                width: 18,
                height: 18,
                decoration: BoxDecoration(
                  color: const Color(0xFF14C77B),
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFFF5F8FD), width: 3),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Administration',
                style: TextStyle(
                  color: Color(0xFF7A8AA2),
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  letterSpacing: .2,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xFF061A3A),
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -.3,
                ),
              ),
              const SizedBox(height: 2),
              const Text(
                'System Administrator',
                style: TextStyle(
                  color: Color(0xFF7A8AA2),
                  fontSize: 8.5,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        _TopIconButton(
          icon: Icons.notifications_none_rounded,
          badge: true,
          onTap: onNotifications,
        ),
        const SizedBox(width: 8),
        _TopIconButton(icon: Icons.grid_view_rounded, onTap: onSystem),
      ],
    );
  }
}

class _TopIconButton extends StatelessWidget {
  final IconData icon;
  final bool badge;
  final VoidCallback onTap;

  const _TopIconButton({
    required this.icon,
    required this.onTap,
    this.badge = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(17),
        child: Ink(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(17),
            border: Border.all(color: const Color(0xFFE1E8F1)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x10071A3D),
                blurRadius: 13,
                offset: Offset(0, 5),
              ),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Icon(icon, color: const Color(0xFF061A3A), size: 22),
              if (badge)
                Positioned(
                  right: 9,
                  top: 8,
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
          ),
        ),
      ),
    );
  }
}

// ============================================================================
// HERO
// ============================================================================

class _PremiumHero extends StatelessWidget {
  final String imageUrl;

  const _PremiumHero({required this.imageUrl});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(30),
      child: SizedBox(
        height: 226,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.network(
              imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF061A3A), Color(0xFF16BFA2)],
                  ),
                ),
              ),
            ),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Color(0xF5061A3A),
                    Color(0xA8061A3A),
                    Color(0x180EA5E9),
                  ],
                  begin: Alignment.bottomLeft,
                  end: Alignment.topRight,
                ),
              ),
            ),

            // Decorative glass circle.
            Positioned(
              right: -42,
              top: -48,
              child: Container(
                width: 155,
                height: 155,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0x2419C7E8),
                  border: Border.all(color: const Color(0x3819C7E8)),
                ),
              ),
            ),

            Positioned(
              right: 19,
              bottom: 19,
              child: Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  color: const Color(0x2619C7E8),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0x559BEFFF)),
                ),
                child: const Icon(
                  Icons.shield_rounded,
                  color: Colors.white,
                  size: 30,
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 7,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0x2AFFFFFF),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0x42FFFFFF)),
                    ),
                    child: const Text(
                      'SYSTEM CONTROL CENTER',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.15,
                      ),
                    ),
                  ),

                  const Spacer(),

                  const Text(
                    'ReliefNexus',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 30,
                      height: 1,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -.7,
                    ),
                  ),

                  const SizedBox(height: 8),

                  const SizedBox(
                    width: 280,
                    child: Text(
                      'Intelligent disaster response, coordination and recovery in one command center.',
                      style: TextStyle(
                        color: Color(0xE8FFFFFF),
                        fontSize: 10.5,
                        height: 1.38,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Container(
                        width: 9,
                        height: 9,
                        decoration: const BoxDecoration(
                          color: Color(0xFF19D58A),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 7),
                      const Text(
                        'LIVE SYSTEM',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.15,
                        ),
                      ),
                      const SizedBox(width: 9),
                      const Icon(
                        Icons.monitor_heart_rounded,
                        color: Color(0xFF62E9FF),
                        size: 16,
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

// ============================================================================
// LIVE STATUS BAR
// ============================================================================

class _PremiumLiveBar extends StatelessWidget {
  final int users;
  final int alerts;

  const _PremiumLiveBar({required this.users, required this.alerts});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 58,
      padding: const EdgeInsets.symmetric(horizontal: 13),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF061A3A), Color(0xFF0B315C)],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x18061A3A),
            blurRadius: 18,
            offset: Offset(0, 7),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 31,
            height: 31,
            decoration: BoxDecoration(
              color: const Color(0x1C19D58A),
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0x3A19D58A)),
            ),
            child: const Center(
              child: Icon(
                Icons.bolt_rounded,
                color: Color(0xFF58E9A8),
                size: 17,
              ),
            ),
          ),
          const SizedBox(width: 9),
          const Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'LIVE PLATFORM',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'ReliefNexus services are online',
                  style: TextStyle(color: Color(0xAFFFFFFF), fontSize: 7.5),
                ),
              ],
            ),
          ),
          _LiveMiniStat(value: users.toString(), label: 'Users'),
          const SizedBox(width: 12),
          _LiveMiniStat(value: alerts.toString(), label: 'Alerts'),
        ],
      ),
    );
  }
}

class _LiveMiniStat extends StatelessWidget {
  final String value;
  final String label;

  const _LiveMiniStat({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w900,
          ),
        ),
        Text(
          label,
          style: const TextStyle(color: Color(0xAFFFFFFF), fontSize: 7),
        ),
      ],
    );
  }
}

// ============================================================================
// KPI GRID
// ============================================================================

class _PremiumKpiGrid extends StatelessWidget {
  final String users;
  final String requests;
  final String reports;
  final String alerts;

  const _PremiumKpiGrid({
    required this.users,
    required this.requests,
    required this.reports,
    required this.alerts,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 11,
      crossAxisSpacing: 11,
      childAspectRatio: 1.82,
      children: [
        _MetricCard(
          icon: Icons.people_alt_rounded,
          value: users,
          label: 'Users',
          accent: const Color(0xFF16BFA2),
        ),
        _MetricCard(
          icon: Icons.admin_panel_settings_rounded,
          value: requests,
          label: 'Role Requests',
          accent: const Color(0xFF855CF7),
        ),
        _MetricCard(
          icon: Icons.description_rounded,
          value: reports,
          label: 'Disaster Reports',
          accent: const Color(0xFFFF5872),
        ),
        _MetricCard(
          icon: Icons.notifications_active_rounded,
          value: alerts,
          label: 'Emergency Alerts',
          accent: const Color(0xFFFFA21A),
        ),
      ],
    );
  }
}

class _MetricCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color accent;

  const _MetricCard({
    required this.icon,
    required this.value,
    required this.label,
    required this.accent,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(23),
        border: Border.all(color: const Color(0xFFE4EAF2)),
        boxShadow: [
          BoxShadow(
            color: accent.withValues(alpha: .07),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 45,
            height: 45,
            decoration: BoxDecoration(
              color: accent.withValues(alpha: .10),
              borderRadius: BorderRadius.circular(15),
            ),
            child: Icon(icon, color: accent, size: 22),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF061A3A),
                    fontSize: 24,
                    height: 1,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF7A8AA2),
                    fontSize: 8.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// SECTION HEADER
// ============================================================================

class _PremiumSectionHeader extends StatelessWidget {
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  const _PremiumSectionHeader({
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 4,
          height: 40,
          decoration: BoxDecoration(
            color: const Color(0xFF16BFA2),
            borderRadius: BorderRadius.circular(10),
            boxShadow: const [
              BoxShadow(color: Color(0x451769FF), blurRadius: 7),
            ],
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: Color(0xFF061A3A),
                  fontSize: 19,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -.25,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                subtitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xFF7A8AA2),
                  fontSize: 8.5,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        if (onTap != null)
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onTap,
              borderRadius: BorderRadius.circular(22),
              child: Ink(
                padding: const EdgeInsets.symmetric(
                  horizontal: 11,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: const Color(0xFFDCE5EF)),
                ),
                child: const Row(
                  children: [
                    Text(
                      'View All',
                      style: TextStyle(
                        color: Color(0xFF16BFA2),
                        fontSize: 8.5,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    SizedBox(width: 2),
                    Icon(
                      Icons.chevron_right_rounded,
                      color: Color(0xFF16BFA2),
                      size: 16,
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

// ============================================================================
// RESPONSE GALLERY
// ============================================================================

class _PremiumPhotoGallery extends StatelessWidget {
  final List<String> images;

  const _PremiumPhotoGallery({required this.images});

  @override
  Widget build(BuildContext context) {
    const titles = [
      'Flood Response',
      'Disaster Impact',
      'Rescue Operations',
      'Regional Response',
    ];

    const subtitles = [
      'Colombo, Sri Lanka',
      'Kalutara District',
      'Emergency Response',
      'Disaster Network',
    ];

    return SizedBox(
      height: 154,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: images.length,
        separatorBuilder: (_, __) => const SizedBox(width: 11),
        itemBuilder: (_, index) {
          return ClipRRect(
            borderRadius: BorderRadius.circular(23),
            child: SizedBox(
              width: 220,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    images[index],
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF061A3A), Color(0xFF0B4D7A)],
                        ),
                      ),
                      child: Icon(
                        Icons.image_outlined,
                        color: Colors.white,
                        size: 30,
                      ),
                    ),
                  ),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Color(0xED061A3A)],
                      ),
                    ),
                  ),
                  Positioned(
                    left: 12,
                    right: 12,
                    bottom: 11,
                    child: Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: const Color(0x2BFFFFFF),
                            borderRadius: BorderRadius.circular(11),
                            border: Border.all(color: const Color(0x4DFFFFFF)),
                          ),
                          child: const Icon(
                            Icons.image_outlined,
                            color: Colors.white,
                            size: 17,
                          ),
                        ),
                        const SizedBox(width: 9),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                titles[index],
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                subtitles[index],
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Color(0xD9FFFFFF),
                                  fontSize: 8,
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
          );
        },
      ),
    );
  }
}

// ============================================================================
// PLATFORM HEALTH
// ============================================================================

class _PremiumHealthCard extends StatelessWidget {
  const _PremiumHealthCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFEFFFF8), Color(0xFFF9FFFC)],
        ),
        borderRadius: BorderRadius.circular(23),
        border: Border.all(color: const Color(0xFFB7EBD0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1116B77A),
            blurRadius: 18,
            offset: Offset(0, 7),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 45,
            height: 45,
            decoration: const BoxDecoration(
              color: Color(0xFF12B889),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_rounded,
              color: Colors.white,
              size: 26,
            ),
          ),
          const SizedBox(width: 11),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Platform Health',
                  style: TextStyle(
                    color: Color(0xFF061A3A),
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  'ReliefNexus services are ready for operations.',
                  style: TextStyle(color: Color(0xFF71809B), fontSize: 8.5),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
            decoration: BoxDecoration(
              color: const Color(0xFFDDF9F1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text(
              'Operational',
              style: TextStyle(
                color: Color(0xFF0E9F78),
                fontSize: 8,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// SUBTLE BACKGROUND
// ============================================================================

class _DashboardBackgroundPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..shader =
          const RadialGradient(
            colors: [Color(0x141769FF), Color(0x001769FF)],
          ).createShader(
            Rect.fromCircle(
              center: Offset(size.width * .85, size.height * .16),
              radius: 220,
            ),
          );

    canvas.drawCircle(Offset(size.width * .85, size.height * .16), 220, paint);

    final second = Paint()
      ..shader =
          const RadialGradient(
            colors: [Color(0x1019C7E8), Color(0x0019C7E8)],
          ).createShader(
            Rect.fromCircle(
              center: Offset(size.width * .05, size.height * .72),
              radius: 180,
            ),
          );

    canvas.drawCircle(Offset(size.width * .05, size.height * .72), 180, second);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _AdminLivePage extends StatefulWidget {
  final String title;
  final String endpoint;
  final IconData icon;

  const _AdminLivePage({
    required this.title,
    required this.endpoint,
    required this.icon,
  });

  @override
  State<_AdminLivePage> createState() => _AdminLivePageState();
}

class _AdminLivePageState extends State<_AdminLivePage> {
  final ApiClient _client = ApiClient();

  bool loading = true;
  String? error;
  List<dynamic> items = [];

  @override
  void initState() {
    super.initState();
    load();
  }

  List<dynamic> normalize(dynamic value) {
    if (value is List) return value;

    if (value is Map) {
      for (final key in [
        'data',
        'items',
        'results',
        'records',
        'resources',
        'allocations',
      ]) {
        final valueForKey = value[key];
        if (valueForKey is List) {
          return valueForKey;
        }
      }
    }

    return const [];
  }

  Future<void> load() async {
    setState(() {
      loading = true;
      error = null;
    });

    try {
      final response = await _client.dio.get(widget.endpoint);

      if (!mounted) return;

      setState(() {
        items = normalize(response.data);
        loading = false;
      });
    } catch (_) {
      if (!mounted) return;

      setState(() {
        loading = false;
        error = 'Unable to load data from the ReliefNexus backend.';
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
        title: Text(widget.title),
        actions: [
          IconButton(onPressed: load, icon: const Icon(Icons.refresh_rounded)),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: load,
        color: const Color(0xFF38BDF8),
        child: loading
            ? const Center(
                child: CircularProgressIndicator(color: Color(0xFF38BDF8)),
              )
            : error != null
            ? ListView(
                children: [
                  const SizedBox(height: 180),
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        error!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              )
            : items.isEmpty
            ? ListView(
                children: const [
                  SizedBox(height: 180),
                  Center(
                    child: Text(
                      'No records available.',
                      style: TextStyle(
                        color: Color(0xFF64748B),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                itemBuilder: (_, index) {
                  final raw = items[index];

                  final data = raw is Map
                      ? Map<String, dynamic>.from(raw)
                      : <String, dynamic>{};

                  final title =
                      data['name'] ??
                      data['title'] ??
                      data['disasterType'] ??
                      data['resourceName'] ??
                      'Record ${index + 1}';

                  final status =
                      data['status'] ??
                      data['riskLevel'] ??
                      data['severity'] ??
                      'LIVE';

                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFD8E5F0)),
                    ),
                    child: ExpansionTile(
                      leading: Container(
                        width: 45,
                        height: 45,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE8F7FF),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Icon(
                          widget.icon,
                          color: const Color(0xFF119B91),
                        ),
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
                      subtitle: Text(
                        status.toString(),
                        style: const TextStyle(
                          color: Color(0xFF119B91),
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          child: Column(
                            children: data.entries
                                .take(12)
                                .map(
                                  (entry) => Padding(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 5,
                                    ),
                                    child: Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        SizedBox(
                                          width: 105,
                                          child: Text(
                                            entry.key,
                                            style: const TextStyle(
                                              color: Color(0xFF64748B),
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ),
                                        Expanded(
                                          child: Text(
                                            entry.value.toString(),
                                            style: const TextStyle(
                                              color: Color(0xFF06152F),
                                              fontSize: 11,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                )
                                .toList(),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }
}

class _AdminHealthPage extends StatefulWidget {
  const _AdminHealthPage();

  @override
  State<_AdminHealthPage> createState() => _AdminHealthPageState();
}

class _AdminHealthPageState extends State<_AdminHealthPage> {
  final ApiClient _client = ApiClient();

  bool loading = true;
  dynamic health;
  String? error;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      final response = await _client.dio.get('/auth/system-health');

      if (!mounted) return;

      setState(() {
        health = response.data;
        loading = false;
      });
    } catch (_) {
      if (!mounted) return;

      setState(() {
        loading = false;
        error = 'Unable to retrieve system health.';
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
        title: const Text('System Monitoring'),
        actions: [
          IconButton(onPressed: load, icon: const Icon(Icons.refresh_rounded)),
        ],
      ),
      body: loading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF38BDF8)),
            )
          : error != null
          ? Center(child: Text(error!))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [
                        Color(0xFF06152F),
                        Color(0xFF0B315C),
                        Color(0xFF16BFA2),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(25),
                  ),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'SYSTEM INTELLIGENCE',
                        style: TextStyle(
                          color: Color(0xFF7DD3FC),
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.4,
                        ),
                      ),
                      SizedBox(height: 7),
                      Text(
                        'Live System Health',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                if (health is Map)
                  ...Map<String, dynamic>.from(health).entries.map(
                    (entry) => Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(17),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              entry.key,
                              style: const TextStyle(
                                color: Color(0xFF64748B),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          Text(
                            entry.value.toString(),
                            style: const TextStyle(
                              color: Color(0xFF06152F),
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


