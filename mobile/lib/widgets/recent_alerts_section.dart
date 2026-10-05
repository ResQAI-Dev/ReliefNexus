import 'package:flutter/material.dart';
import '../models/risk_alert.dart';
import '../services/alert_service.dart';
import '../theme/app_theme.dart';

class RecentAlertsSection extends StatefulWidget {
  const RecentAlertsSection({super.key});

  @override
  State<RecentAlertsSection> createState() => _RecentAlertsSectionState();
}

class _RecentAlertsSectionState extends State<RecentAlertsSection> {
  final AlertService _alertService = AlertService();
  RiskLevel? _selectedFilter;

  @override
  Widget build(BuildContext context) {
    final alerts = _alertService.getAlertsByLevel(_selectedFilter);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header & Filter Chips
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Row(
                children: [
                  const Icon(Icons.notifications_active_outlined, color: AppTheme.primaryBlue, size: 22),
                  const SizedBox(width: 8),
                  const Flexible(
                    child: Text(
                      'Recent Risk & Disaster Alerts',
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${alerts.length} Active',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryBlue,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Filter Chips Row
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildFilterChip('All', null),
              const SizedBox(width: 8),
              _buildFilterChip('Danger', RiskLevel.danger),
              const SizedBox(width: 8),
              _buildFilterChip('Warning', RiskLevel.warning),
              const SizedBox(width: 8),
              _buildFilterChip('Safe', RiskLevel.safe),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Alerts List
        if (alerts.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.borderLight),
            ),
            child: const Center(
              child: Text(
                'No active alerts matching selected filter.',
                style: TextStyle(color: AppTheme.textMuted, fontSize: 14),
              ),
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: alerts.length,
            separatorBuilder: (context, index) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final alert = alerts[index];
              return _buildAlertCard(alert);
            },
          ),
      ],
    );
  }

  Widget _buildFilterChip(String label, RiskLevel? level) {
    final isSelected = _selectedFilter == level;
    final chipColor = level?.color ?? AppTheme.primaryBlue;

    return ChoiceChip(
      label: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          color: isSelected ? Colors.white : AppTheme.textSecondary,
        ),
      ),
      selected: isSelected,
      selectedColor: chipColor,
      backgroundColor: Colors.white,
      side: BorderSide(
        color: isSelected ? chipColor : AppTheme.borderLight,
      ),
      onSelected: (selected) {
        setState(() {
          _selectedFilter = selected ? level : null;
        });
      },
    );
  }

  Widget _buildAlertCard(RiskAlert alert) {
    final formattedTime = _formatTimeAgo(alert.timestamp);

    return Card(
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: const BorderSide(color: AppTheme.borderLight, width: 1),
      ),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          border: Border(
            left: BorderSide(color: alert.level.color, width: 4),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Level Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: alert.level.backgroundColor,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: alert.level.color.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(alert.level.icon, size: 14, color: alert.level.color),
                      const SizedBox(width: 4),
                      Text(
                        alert.level.label.toUpperCase(),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: alert.level.color,
                        ),
                      ),
                    ],
                  ),
                ),
                Flexible(
                  child: Text(
                    formattedTime,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              alert.title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              alert.description,
              style: const TextStyle(
                fontSize: 13,
                color: AppTheme.textSecondary,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.surfaceSubtle,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_sharp, size: 16, color: AppTheme.textMuted),
                  const SizedBox(width: 8),
                  Expanded(
                    child: RichText(
                      text: TextSpan(
                        style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                        children: [
                          const TextSpan(
                            text: 'Action Required: ',
                            style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                          ),
                          TextSpan(text: alert.actionRequired),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTimeAgo(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else {
      return '${diff.inDays}d ago';
    }
  }
}
