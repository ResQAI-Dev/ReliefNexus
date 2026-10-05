import 'package:flutter/material.dart';
import '../models/risk_alert.dart';
import '../theme/app_theme.dart';

class RiskLevelCard extends StatelessWidget {
  final RiskLevel currentLevel;
  final ValueChanged<RiskLevel>? onLevelChanged;

  const RiskLevelCard({
    super.key,
    required this.currentLevel,
    this.onLevelChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: currentLevel.color.withValues(alpha: 0.4), width: 1.5),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Accent Bar
            Container(
              height: 6,
              color: currentLevel.color,
            ),
            Padding(
              padding: const EdgeInsets.all(18.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Zone Header & Selector
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: AppTheme.surfaceSubtle,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: AppTheme.borderLight),
                              ),
                              child: const Icon(
                                Icons.location_on,
                                size: 16,
                                color: AppTheme.primaryBlue,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Flexible(
                              child: Text(
                                'CURRENT ZONE: SECTOR 4 (RIVERBED)',
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.textMuted,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Interactive dropdown to simulate switching risk levels
                      PopupMenuButton<RiskLevel>(
                        onSelected: onLevelChanged,
                        tooltip: 'Switch Risk Level (Demo)',
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceSubtle,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppTheme.borderLight),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'Change Risk',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                              SizedBox(width: 4),
                              Icon(Icons.arrow_drop_down, size: 16, color: AppTheme.textSecondary),
                            ],
                          ),
                        ),
                        itemBuilder: (context) => [
                          _buildPopupItem(RiskLevel.safe),
                          _buildPopupItem(RiskLevel.warning),
                          _buildPopupItem(RiskLevel.danger),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Risk Level Banner
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: currentLevel.backgroundColor,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: currentLevel.color.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: currentLevel.color,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            currentLevel.icon,
                            color: Colors.white,
                            size: 26,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Wrap(
                                crossAxisAlignment: WrapCrossAlignment.center,
                                spacing: 8,
                                children: [
                                  Text(
                                    'Risk Level: ${currentLevel.label.toUpperCase()}',
                                    style: TextStyle(
                                      fontSize: 17,
                                      fontWeight: FontWeight.bold,
                                      color: currentLevel.color,
                                    ),
                                  ),
                                  _buildLiveBadge(currentLevel.color),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _getRiskDescription(currentLevel),
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppTheme.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Key Quick Stats Row
                  const Divider(color: AppTheme.borderLight, height: 1),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatItem(
                          icon: Icons.shield_outlined,
                          value: '3 Open',
                          label: 'Shelters',
                          color: AppTheme.primaryBlue,
                        ),
                      ),
                      Container(width: 1, height: 36, color: AppTheme.borderLight),
                      Expanded(
                        child: _buildStatItem(
                          icon: Icons.group_outlined,
                          value: '24 Field',
                          label: 'Volunteers',
                          color: AppTheme.secondaryTeal,
                        ),
                      ),
                      Container(width: 1, height: 36, color: AppTheme.borderLight),
                      Expanded(
                        child: _buildStatItem(
                          icon: Icons.medical_services_outlined,
                          value: '1 Triage',
                          label: 'Medical Post',
                          color: const Color(0xFF8B5CF6),
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

  PopupMenuItem<RiskLevel> _buildPopupItem(RiskLevel level) {
    return PopupMenuItem<RiskLevel>(
      value: level,
      child: Row(
        children: [
          Icon(level.icon, color: level.color, size: 18),
          const SizedBox(width: 8),
          Text(
            level.label,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: level.color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLiveBadge(Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            'LIVE',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String value,
    required String label,
    required Color color,
  }) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                value,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          label,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: 11,
            color: AppTheme.textMuted,
          ),
        ),
      ],
    );
  }

  String _getRiskDescription(RiskLevel level) {
    switch (level) {
      case RiskLevel.safe:
        return 'No immediate hazards reported in Sector 4. Standard monitoring active.';
      case RiskLevel.warning:
        return 'Elevated water levels and weather alert. Prepare emergency kits and stay alert.';
      case RiskLevel.danger:
        return 'Flash flood danger present! Immediate evacuation required for low-lying zones.';
    }
  }
}
