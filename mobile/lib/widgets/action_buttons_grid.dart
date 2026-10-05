import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class ActionButtonsGrid extends StatelessWidget {
  final VoidCallback onViewTasks;
  final VoidCallback onSubmitEvidence;
  final VoidCallback onRequestSOS;
  final VoidCallback onViewMap;
  final int assignedTaskCount;

  const ActionButtonsGrid({
    super.key,
    required this.onViewTasks,
    required this.onSubmitEvidence,
    required this.onRequestSOS,
    required this.onViewMap,
    required this.assignedTaskCount,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(Icons.bolt, color: AppTheme.primaryBlue, size: 22),
            SizedBox(width: 8),
            Text(
              'Field Workflows & Quick Actions',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),

        LayoutBuilder(
          builder: (context, constraints) {
            // Responsive grid column count for Chrome Web vs Mobile screen sizes
            final isWide = constraints.maxWidth > 650;
            final crossAxisCount = isWide ? 4 : 2;

            return GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: crossAxisCount,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: isWide ? 1.4 : 1.25,
              children: [
                _buildActionButton(
                  context: context,
                  title: 'View Assigned Tasks',
                  subtitle: '$assignedTaskCount active assigned',
                  icon: Icons.assignment_outlined,
                  accentColor: AppTheme.primaryBlue,
                  badgeCount: assignedTaskCount,
                  onTap: onViewTasks,
                ),
                _buildActionButton(
                  context: context,
                  title: 'Submit Status & Evidence',
                  subtitle: 'Upload photo & report',
                  icon: Icons.add_a_photo_outlined,
                  accentColor: AppTheme.secondaryTeal,
                  onTap: onSubmitEvidence,
                ),
                _buildActionButton(
                  context: context,
                  title: 'Request Emergency SOS',
                  subtitle: 'Immediate beacon',
                  icon: Icons.sos_rounded,
                  accentColor: const Color(0xFFDC2626),
                  isEmergency: true,
                  onTap: onRequestSOS,
                ),
                _buildActionButton(
                  context: context,
                  title: 'Shelters & Supply Map',
                  subtitle: 'Find open shelters',
                  icon: Icons.map_outlined,
                  accentColor: const Color(0xFF8B5CF6),
                  onTap: onViewMap,
                ),
              ],
            );
          },
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required BuildContext context,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color accentColor,
    required VoidCallback onTap,
    int? badgeCount,
    bool isEmergency = false,
  }) {
    return Material(
      color: isEmergency ? const Color(0xFFFEF2F2) : Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        hoverColor: accentColor.withValues(alpha: 0.04),
        splashColor: accentColor.withValues(alpha: 0.1),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isEmergency ? const Color(0xFFFCA5A5) : AppTheme.borderLight,
              width: isEmergency ? 1.5 : 1.0,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: accentColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      icon,
                      color: accentColor,
                      size: 20,
                    ),
                  ),
                  if (badgeCount != null && badgeCount > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: accentColor,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '$badgeCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
              const Spacer(),
              Text(
                title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  height: 1.2,
                  color: isEmergency ? const Color(0xFF991B1B) : AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 11,
                  color: isEmergency ? const Color(0xFFB91C1C) : AppTheme.textMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
