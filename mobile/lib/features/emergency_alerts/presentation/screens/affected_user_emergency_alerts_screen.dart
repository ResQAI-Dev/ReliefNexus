import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/emergency_alert_provider.dart';
import '../../data/models/emergency_alert_model.dart';

class AffectedUserEmergencyAlertsPage extends StatelessWidget {
  const AffectedUserEmergencyAlertsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => EmergencyAlertProvider()..loadUserAlerts(),
      child: const _AffectedUserEmergencyAlertsView(),
    );
  }
}

class _AffectedUserEmergencyAlertsView extends StatelessWidget {
  const _AffectedUserEmergencyAlertsView();

  Color _severityColor(String severity) {
    switch (severity.toLowerCase()) {
      case 'critical':
        return const Color(0xFFB91C1C);
      case 'high':
        return const Color(0xFFDC2626);
      case 'medium':
      case 'moderate':
        return const Color(0xFFD97706);
      case 'low':
        return const Color(0xFF16A34A);
      default:
        return const Color(0xFF64748B);
    }
  }

  IconData _disasterIcon(String type) {
    final value = type.toLowerCase();

    if (value.contains('flood')) {
      return Icons.water_rounded;
    }
    if (value.contains('cyclone') || value.contains('storm')) {
      return Icons.air_rounded;
    }
    if (value.contains('landslide')) {
      return Icons.terrain_rounded;
    }
    if (value.contains('earthquake')) {
      return Icons.public_rounded;
    }
    if (value.contains('lightning')) {
      return Icons.bolt_rounded;
    }
    if (value.contains('wildfire') || value.contains('fire')) {
      return Icons.local_fire_department_rounded;
    }
    if (value.contains('tsunami')) {
      return Icons.waves_rounded;
    }
    if (value.contains('drought')) {
      return Icons.wb_sunny_rounded;
    }
    if (value.contains('heat')) {
      return Icons.thermostat_rounded;
    }
    if (value.contains('cold')) {
      return Icons.ac_unit_rounded;
    }

    return Icons.warning_amber_rounded;
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'Recently issued';

    final local = date.toLocal();

    String two(int value) => value.toString().padLeft(2, '0');

    return '${local.day}/${two(local.month)}/${local.year} '
        '${two(local.hour)}:${two(local.minute)}';
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<EmergencyAlertProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF3F7FC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF06152F),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Emergency Warnings',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 19),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: provider.loadUserAlerts,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.fromLTRB(16, 16, 16, 14),
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF06152F), Color(0xFF0B2A55)],
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x2206152F),
                      blurRadius: 18,
                      offset: Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 54,
                      height: 54,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFF5570).withValues(alpha: .16),
                        borderRadius: BorderRadius.circular(17),
                      ),
                      child: const Icon(
                        Icons.notifications_active_rounded,
                        color: Color(0xFFFF7187),
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Stay Alert',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Important emergency warnings '
                            'for your area will appear here.',
                            style: TextStyle(
                              color: Color(0xFFB9C7DA),
                              fontSize: 11,
                              height: 1.4,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            if (provider.loading && provider.userAlerts.isEmpty)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(child: CircularProgressIndicator()),
              )
            else if (provider.error != null && provider.userAlerts.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: _ErrorState(
                  message: provider.error!,
                  onRetry: provider.loadUserAlerts,
                ),
              )
            else if (provider.userAlerts.isEmpty)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: _NoAlertsState(),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 30),
                sliver: SliverList.separated(
                  itemCount: provider.userAlerts.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 14),
                  itemBuilder: (context, index) {
                    final alert = provider.userAlerts[index];

                    return _EmergencyWarningCard(
                      alert: alert,
                      severityColor: _severityColor(alert.severity),
                      disasterIcon: _disasterIcon(alert.disasterType),
                      issuedAt: _formatDate(alert.createdAt),
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

class _EmergencyWarningCard extends StatelessWidget {
  final EmergencyAlertModel alert;
  final Color severityColor;
  final IconData disasterIcon;
  final String issuedAt;

  const _EmergencyWarningCard({
    required this.alert,
    required this.severityColor,
    required this.disasterIcon,
    required this.issuedAt,
  });

  @override
  Widget build(BuildContext context) {
    final title = alert.title.trim().isEmpty
        ? 'Emergency Warning'
        : alert.title.trim();

    final disaster = alert.disasterType.trim().isEmpty
        ? 'Emergency'
        : alert.disasterType.trim();

    final location = alert.location.trim().isEmpty
        ? 'Location information unavailable'
        : alert.location.trim();

    final message = alert.message.trim().isEmpty
        ? 'Please stay alert and follow official emergency instructions.'
        : alert.message.trim();

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: severityColor.withValues(alpha: .18)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1206152F),
            blurRadius: 16,
            offset: Offset(0, 7),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: severityColor.withValues(alpha: .07),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(24),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: severityColor.withValues(alpha: .12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(disasterIcon, color: severityColor, size: 25),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        disaster,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF06152F),
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Row(
                        children: [
                          const Icon(
                            Icons.location_on_outlined,
                            size: 13,
                            color: Color(0xFF64748B),
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              location,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: severityColor,
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: Text(
                    alert.severity.isEmpty
                        ? 'WARNING'
                        : alert.severity.toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 8,
                      fontWeight: FontWeight.w900,
                      letterSpacing: .4,
                    ),
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(16, 17, 16, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF06152F),
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 10),

                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    message,
                    style: const TextStyle(
                      color: Color(0xFF334155),
                      fontSize: 12,
                      height: 1.55,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),

                if (alert.recommendedActions.isNotEmpty) ...[
                  const SizedBox(height: 18),
                  const Text(
                    'WHAT YOU SHOULD DO',
                    style: TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      letterSpacing: .9,
                    ),
                  ),
                  const SizedBox(height: 9),
                  ...alert.recommendedActions.asMap().entries.map(
                    (entry) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 22,
                            height: 22,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: severityColor.withValues(alpha: .10),
                              shape: BoxShape.circle,
                            ),
                            child: Text(
                              '${entry.key + 1}',
                              style: TextStyle(
                                color: severityColor,
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                          const SizedBox(width: 9),
                          Expanded(
                            child: Text(
                              entry.value,
                              style: const TextStyle(
                                color: Color(0xFF475569),
                                fontSize: 11,
                                height: 1.4,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],

                if (alert.resourceSummary != null &&
                    '${alert.resourceSummary}'.trim().isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(13),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.inventory_2_outlined,
                          size: 18,
                          color: Color(0xFF0284C7),
                        ),
                        const SizedBox(width: 9),
                        Expanded(
                          child: Text(
                            '${alert.resourceSummary}',
                            style: const TextStyle(
                              color: Color(0xFF155E75),
                              fontSize: 10,
                              height: 1.4,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 16),
                Row(
                  children: [
                    const Icon(
                      Icons.schedule_rounded,
                      size: 14,
                      color: Color(0xFF94A3B8),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      'Issued $issuedAt',
                      style: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const Spacer(),
                    if (alert.alertStatus.isNotEmpty)
                      Text(
                        alert.alertStatus.toUpperCase(),
                        style: TextStyle(
                          color: severityColor,
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          letterSpacing: .5,
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NoAlertsState extends StatelessWidget {
  const _NoAlertsState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 76,
              height: 76,
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5FF),
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Icon(
                Icons.verified_user_rounded,
                size: 38,
                color: Color(0xFF0284C7),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'No Active Emergency Warnings',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF06152F),
                fontSize: 17,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 7),
            const Text(
              'There are currently no emergency warnings '
              'assigned to your account.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF64748B),
                fontSize: 11,
                height: 1.45,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final Future<void> Function() onRetry;

  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.cloud_off_rounded,
              size: 42,
              color: Color(0xFF64748B),
            ),
            const SizedBox(height: 12),
            const Text(
              'Unable to load emergency warnings',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF06152F),
                fontSize: 16,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Please try again.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Try Again'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF06152F),
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
