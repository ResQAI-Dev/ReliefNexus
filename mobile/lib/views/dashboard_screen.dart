import 'package:flutter/material.dart';
import '../models/risk_alert.dart';
import '../services/alert_service.dart';
import '../services/task_service.dart';
import '../theme/app_theme.dart';
import '../widgets/action_buttons_grid.dart';
import '../widgets/assigned_tasks_modal.dart';
import '../widgets/recent_alerts_section.dart';
import '../widgets/risk_level_card.dart';
import '../widgets/submit_evidence_modal.dart';

/// DashboardScreen is the primary interactive view for ReliefNexus.
/// Designed with responsive layout adaptation for Chrome Web and mobile devices.
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final AlertService _alertService = AlertService();
  final TaskService _taskService = TaskService();

  late RiskLevel _currentRiskLevel;
  String _userPersona = 'Volunteer'; // 'Volunteer' or 'Affected Resident'

  @override
  void initState() {
    super.initState();
    _currentRiskLevel = _alertService.currentZoneRiskLevel;
    _taskService.addListener(_onTaskServiceUpdated);
  }

  @override
  void dispose() {
    _taskService.removeListener(_onTaskServiceUpdated);
    super.dispose();
  }

  void _onTaskServiceUpdated() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final pendingTasksCount = _taskService.pendingCount + _taskService.inProgressCount;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppTheme.primaryBlue,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.medical_services_rounded,
                color: Colors.white,
                size: 18,
              ),
            ),
            const SizedBox(width: 8),
            const Flexible(
              child: Text(
                'ReliefNexus - Field & Volunteer',
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: AppTheme.textPrimary,
                ),
              ),
            ),
          ],
        ),
        actions: [
          // Network Connectivity Status Indicator
          Center(
            child: Container(
              margin: const EdgeInsets.only(right: 6),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.wifi, size: 12, color: Color(0xFF16A34A)),
                  SizedBox(width: 4),
                  Text(
                    'Online',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF15803D),
                    ),
                  ),
                ],
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.notifications_none_outlined, color: AppTheme.textPrimary, size: 22),
            tooltip: 'Alert Notifications',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Notifications synchronized.'),
                  duration: Duration(seconds: 1),
                ),
              );
            },
          ),
          const SizedBox(width: 4),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(
            color: AppTheme.borderLight,
            height: 1.0,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1180),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Persona & Welcome Bar
                    _buildWelcomeBanner(context),
                    const SizedBox(height: 20),

                    // Responsive Web / Mobile Layout Builder
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final isDesktopWeb = constraints.maxWidth >= 900;

                        if (isDesktopWeb) {
                          // Desktop Web Layout: 2 Columns Side-by-Side
                          return Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Left Column: Risk Card & Action Buttons
                              Expanded(
                                flex: 6,
                                child: Column(
                                  children: [
                                    RiskLevelCard(
                                      currentLevel: _currentRiskLevel,
                                      onLevelChanged: (newLevel) {
                                        setState(() {
                                          _currentRiskLevel = newLevel;
                                        });
                                      },
                                    ),
                                    const SizedBox(height: 24),
                                    ActionButtonsGrid(
                                      assignedTaskCount: pendingTasksCount,
                                      onViewTasks: _handleViewTasks,
                                      onSubmitEvidence: _handleSubmitEvidence,
                                      onRequestSOS: _handleRequestSOS,
                                      onViewMap: _handleViewMap,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 24),

                              // Right Column: Recent Alerts Feed
                              Expanded(
                                flex: 5,
                                child: Column(
                                  children: [
                                    _buildVolunteerQuickSummaryCard(),
                                    const SizedBox(height: 20),
                                    const RecentAlertsSection(),
                                  ],
                                ),
                              ),
                            ],
                          );
                        } else {
                          // Mobile / Tablet Narrow Screen Vertical Stack Layout
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              RiskLevelCard(
                                currentLevel: _currentRiskLevel,
                                onLevelChanged: (newLevel) {
                                  setState(() {
                                    _currentRiskLevel = newLevel;
                                  });
                                },
                              ),
                              const SizedBox(height: 20),
                              ActionButtonsGrid(
                                assignedTaskCount: pendingTasksCount,
                                onViewTasks: _handleViewTasks,
                                onSubmitEvidence: _handleSubmitEvidence,
                                onRequestSOS: _handleRequestSOS,
                                onViewMap: _handleViewMap,
                              ),
                              const SizedBox(height: 24),
                              _buildVolunteerQuickSummaryCard(),
                              const SizedBox(height: 24),
                              const RecentAlertsSection(),
                            ],
                          );
                        }
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildWelcomeBanner(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surfaceSubtle,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final isNarrow = constraints.maxWidth < 650;

          final titleContent = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Flexible(
                    child: Text(
                      'Welcome, Field Responder',
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'VOL-8842',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryBlue,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Active Dispatch • Sector 4 Command Center',
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
              ),
            ],
          );

          final personaControl = SegmentedButton<String>(
            segments: const [
              ButtonSegment(
                value: 'Volunteer',
                label: Text('Volunteer', style: TextStyle(fontSize: 12)),
                icon: Icon(Icons.badge_outlined, size: 14),
              ),
              ButtonSegment(
                value: 'Resident',
                label: Text('Resident', style: TextStyle(fontSize: 12)),
                icon: Icon(Icons.person_outline, size: 14),
              ),
            ],
            selected: {_userPersona},
            onSelectionChanged: (Set<String> newSelection) {
              setState(() {
                _userPersona = newSelection.first;
              });
            },
            style: const ButtonStyle(
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              visualDensity: VisualDensity.compact,
            ),
          );

          if (isNarrow) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                titleContent,
                const SizedBox(height: 12),
                personaControl,
              ],
            );
          } else {
            return Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: titleContent),
                const SizedBox(width: 12),
                personaControl,
              ],
            );
          }
        },
      ),
    );
  }

  Widget _buildVolunteerQuickSummaryCard() {
    return Card(
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.dashboard_outlined, color: AppTheme.primaryBlue, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Field Dispatch Overview',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: _handleViewTasks,
                  child: const Text('Manage Tasks'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildSummaryBadge(
                    label: 'Pending',
                    count: '${_taskService.pendingCount}',
                    color: const Color(0xFF64748B),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildSummaryBadge(
                    label: 'In Progress',
                    count: '${_taskService.inProgressCount}',
                    color: AppTheme.primaryBlue,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildSummaryBadge(
                    label: 'Evidence Sent',
                    count: '${_taskService.completedCount}',
                    color: const Color(0xFF16A34A),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryBadge({
    required String label,
    required String count,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Text(
            count,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }

  void _handleViewTasks() {
    AssignedTasksModal.show(context);
  }

  void _handleSubmitEvidence() {
    SubmitEvidenceModal.show(context, _taskService.tasks);
  }

  void _handleRequestSOS() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626), size: 28),
            SizedBox(width: 10),
            Text('Trigger Emergency SOS?'),
          ],
        ),
        content: const Text(
          'This will transmit your real-time GPS location and high-priority distress beacon to HQ Command.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
            onPressed: () {
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('EMERGENCY SOS BEACON DISPATCHED TO COMMAND CENTER!'),
                  backgroundColor: Color(0xFFDC2626),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
            child: const Text('SEND SOS BEACON'),
          ),
        ],
      ),
    );
  }

  void _handleViewMap() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.map_outlined, color: AppTheme.primaryBlue, size: 24),
            SizedBox(width: 10),
            Text('Relief Shelters & Resource Map'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Active Emergency Shelters in Sector 4:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            _buildShelterTile('Shelter A - Highland High School', 'Capacity: 85% (Occupied)', 'Medical Post Active'),
            const SizedBox(height: 8),
            _buildShelterTile('Shelter B - Community Stadium', 'Capacity: 40% (Available)', 'Water & Food Supply Center'),
            const SizedBox(height: 8),
            _buildShelterTile('Shelter C - East Armory Center', 'Capacity: 10% (Open)', 'Helipad & Logistics Hub'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildShelterTile(String name, String capacity, String status) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppTheme.surfaceSubtle,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 2),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(capacity, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
              Text(status, style: const TextStyle(fontSize: 11, color: AppTheme.primaryBlue, fontWeight: FontWeight.bold)),
            ],
          ),
        ],
      ),
    );
  }
}
