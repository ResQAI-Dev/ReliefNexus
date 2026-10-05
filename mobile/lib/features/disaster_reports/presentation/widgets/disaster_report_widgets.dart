import 'package:flutter/material.dart';

import '../../data/models/disaster_report_model.dart';

class PremiumDisasterReportCard extends StatelessWidget {
  final DisasterReportModel item;
  final VoidCallback onViewDetails;

  const PremiumDisasterReportCard({
    super.key,
    required this.item,
    required this.onViewDetails,
  });

  Color get accent {
    return const Color(0xFF0EA5E9);
  }

  IconData get disasterIcon {
    final type = item.disasterType.toLowerCase();

    if (type.contains('flood')) return Icons.water_rounded;
    if (type.contains('landslide')) return Icons.terrain_rounded;
    if (type.contains('drought')) return Icons.wb_sunny_rounded;
    if (type.contains('earthquake')) return Icons.public_rounded;
    if (type.contains('storm') || type.contains('cyclone')) {
      return Icons.air_rounded;
    }
    if (type.contains('fire')) {
      return Icons.local_fire_department_rounded;
    }

    return Icons.warning_amber_rounded;
  }

  Color get severityColor {
    switch (item.severity.toLowerCase()) {
      case 'critical':
        return const Color(0xFFE91E45);
      case 'high':
        return const Color(0xFFFF6B35);
      case 'medium':
        return const Color(0xFFFFA000);
      case 'low':
        return const Color(0xFF16B77A);
      default:
        return const Color(0xFF71809B);
    }
  }

  String get statusText {
    final value = item.status.trim();
    if (value.isEmpty) return 'UNKNOWN';

    return value.replaceAll('_', ' ').replaceAll('-', ' ').toUpperCase();
  }

  String get locationText {
    final value = item.location.trim();
    return value.isEmpty ? 'Location unavailable' : value;
  }

  String get reporterText {
    final value = item.reporterName.trim();
    return value.isEmpty ? 'Unknown reporter' : value;
  }

  String get descriptionText {
    final value = item.description.trim();
    return value.isEmpty ? 'No incident description provided.' : value;
  }

  String get dateText {
    final d = item.createdAt;

    if (d == null) {
      return 'Date unavailable';
    }

    final day = d.day.toString().padLeft(2, '0');
    final month = d.month.toString().padLeft(2, '0');
    final year = d.year.toString();

    final hour = d.hour.toString().padLeft(2, '0');
    final minute = d.minute.toString().padLeft(2, '0');

    return '$day/$month/$year $hour:$minute';
  }

  @override
  Widget build(BuildContext context) {
    final color = accent;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(25),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            color.withValues(alpha: .09),
            Colors.white,
            color.withValues(alpha: .035),
          ],
        ),
        border: Border.all(color: color.withValues(alpha: .18), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: .10),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
          const BoxShadow(
            color: Color(0x0A071A3D),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(25),
        child: Stack(
          children: [
            Positioned(
              left: 0,
              top: 22,
              bottom: 22,
              child: Container(
                width: 5,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: const BorderRadius.horizontal(
                    right: Radius.circular(8),
                  ),
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 58,
                        height: 58,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [color, color.withValues(alpha: .72)],
                          ),
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: [
                            BoxShadow(
                              color: color.withValues(alpha: .22),
                              blurRadius: 14,
                              offset: const Offset(0, 7),
                            ),
                          ],
                        ),
                        child: Icon(
                          disasterIcon,
                          color: Colors.white,
                          size: 29,
                        ),
                      ),

                      const SizedBox(width: 13),

                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.disasterType.isEmpty
                                  ? 'Disaster Incident'
                                  : item.disasterType,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Color(0xFF071A3D),
                                fontSize: 17,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                const Icon(
                                  Icons.location_on_rounded,
                                  size: 15,
                                  color: Color(0xFF71809B),
                                ),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    locationText,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: Color(0xFF71809B),
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
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
                          horizontal: 10,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: severityColor.withValues(alpha: .09),
                          borderRadius: BorderRadius.circular(30),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.warning_rounded,
                              color: severityColor,
                              size: 13,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              item.severity.toUpperCase(),
                              style: TextStyle(
                                color: severityColor,
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 13,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF6F8FD),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE8EDF6)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 31,
                          height: 31,
                          decoration: BoxDecoration(
                            color: const Color(
                              0xFF7657E8,
                            ).withValues(alpha: .10),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.notes_rounded,
                            color: Color(0xFF7657E8),
                            size: 17,
                          ),
                        ),
                        const SizedBox(width: 9),
                        Expanded(
                          child: Text(
                            descriptionText,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Color(0xFF14264A),
                              fontSize: 10.5,
                              height: 1.35,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 14),

                  Row(
                    children: [
                      const Icon(
                        Icons.person_outline_rounded,
                        color: Color(0xFF7A8AA6),
                        size: 16,
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        'Reporter',
                        style: TextStyle(
                          color: Color(0xFF8A98AE),
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(width: 5),
                      Expanded(
                        child: Text(
                          reporterText,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Color(0xFF071A3D),
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 9,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFF7657E8).withValues(alpha: .07),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          statusText,
                          style: const TextStyle(
                            color: Color(0xFF7657E8),
                            fontSize: 8,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 10),

                  Row(
                    children: [
                      const Icon(
                        Icons.groups_rounded,
                        color: Color(0xFF7A8AA6),
                        size: 16,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          item.assignedVolunteerName?.trim().isNotEmpty == true
                              ? item.assignedVolunteerName!
                              : 'Awaiting volunteer',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Color(0xFF71809B),
                            fontSize: 9.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const Icon(
                        Icons.schedule_rounded,
                        color: Color(0xFF8A98AE),
                        size: 15,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        dateText,
                        style: const TextStyle(
                          color: Color(0xFF71809B),
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 13),

                  Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: onViewDetails,
                      borderRadius: BorderRadius.circular(17),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 9,
                        ),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: .075),
                          borderRadius: BorderRadius.circular(17),
                          border: Border.all(
                            color: color.withValues(alpha: .14),
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: color.withValues(alpha: .10),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                item.latitude != null && item.longitude != null
                                    ? Icons.my_location_rounded
                                    : Icons.location_disabled_rounded,
                                color: color,
                                size: 17,
                              ),
                            ),
                            const SizedBox(width: 9),
                            Expanded(
                              child: Text(
                                item.latitude != null && item.longitude != null
                                    ? 'Location coordinates available'
                                    : 'Location coordinates unavailable',
                                style: TextStyle(
                                  color: color,
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 9,
                              ),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [color, color.withValues(alpha: .82)],
                                ),
                                borderRadius: BorderRadius.circular(13),
                                boxShadow: [
                                  BoxShadow(
                                    color: color.withValues(alpha: .20),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    'VIEW DETAILS',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 8.5,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: .3,
                                    ),
                                  ),
                                  SizedBox(width: 5),
                                  Icon(
                                    Icons.arrow_forward_rounded,
                                    color: Colors.white,
                                    size: 15,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
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
}
