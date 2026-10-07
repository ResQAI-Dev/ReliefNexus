import 'package:flutter/material.dart';

class EmergencyAlertCard extends StatelessWidget {
  final Map<String, dynamic> assessment;
  final VoidCallback onTap;

  const EmergencyAlertCard({
    super.key,
    required this.assessment,
    required this.onTap,
  });

  String value(String key1, String key2) {
    return '${assessment[key1] ?? assessment[key2] ?? '-'}';
  }

  @override
  Widget build(BuildContext context) {
    final location = value('location', 'Location');
    final disaster = value('disasterType', 'DisasterType');
    final risk = value('riskLevel', 'RiskLevel');

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFF101C35),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: Colors.white.withOpacity(.08),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 54,
              height: 54,
              decoration: BoxDecoration(
                color: const Color(0xFF2563EB).withOpacity(.15),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.warning_amber_rounded,
                color: Color(0xFF60A5FA),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    location,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    '$disaster  $risk',
                    style: const TextStyle(
                      color: Colors.white60,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              color: Colors.white54,
            ),
          ],
        ),
      ),
    );
  }
}

