import 'package:flutter/material.dart';

import '../../data/models/risk_prediction_model.dart';

class RiskPredictionCard extends StatelessWidget {
  final RiskPredictionModel prediction;
  final VoidCallback onTap;

  const RiskPredictionCard({
    super.key,
    required this.prediction,
    required this.onTap,
  });

  Color levelColor(String level) {
    switch (level.toLowerCase()) {
      case 'critical':
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

  IconData disasterIcon(String type) {
    final value = type.toLowerCase();

    if (value.contains('flood')) return Icons.water_rounded;
    if (value.contains('drought')) return Icons.wb_sunny_rounded;
    if (value.contains('cyclone') || value.contains('storm')) {
      return Icons.air_rounded;
    }
    if (value.contains('earthquake')) return Icons.public_rounded;
    if (value.contains('landslide')) return Icons.terrain_rounded;
    if (value.contains('lightning')) return Icons.bolt_rounded;
    if (value.contains('wildfire') || value.contains('forest')) {
      return Icons.local_fire_department_rounded;
    }
    if (value.contains('cold')) return Icons.ac_unit_rounded;
    if (value.contains('heat')) return Icons.thermostat_rounded;
    if (value.contains('tsunami')) return Icons.waves_rounded;

    return Icons.radar_rounded;
  }

  @override
  Widget build(BuildContext context) {
    final color = levelColor(prediction.riskLevel);
    final disasterType = prediction.disasterType.isEmpty
        ? 'Risk Prediction'
        : prediction.disasterType;
    final location = prediction.location.isEmpty
        ? 'Location unavailable'
        : prediction.location;

    final isUnavailable =
        prediction.riskLevel.toLowerCase() == 'dataunavailable';

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isUnavailable
              ? const Color(0xFFE2E8F0)
              : const Color(0xFFD8E7F7),
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1206152F),
            blurRadius: 14,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(13),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: isUnavailable
                          ? const [
                              Color(0xFFF1F5F9),
                              Color(0xFFE2E8F0),
                            ]
                          : const [
                              Color(0xFFE8F5FF),
                              Color(0xFFD9EEFF),
                            ],
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    disasterIcon(disasterType),
                    color: isUnavailable
                        ? const Color(0xFF64748B)
                        : const Color(0xFF0284C7),
                    size: 25,
                  ),
                ),

                const SizedBox(width: 13),

                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              disasterType,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF06152F),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 9,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              color: color.withValues(alpha: .10),
                              borderRadius: BorderRadius.circular(30),
                            ),
                            child: Text(
                              prediction.riskLevel.isEmpty
                                  ? 'UNKNOWN'
                                  : prediction.riskLevel.toUpperCase(),
                              style: TextStyle(
                                color: color,
                                fontSize: 8,
                                fontWeight: FontWeight.w900,
                                letterSpacing: .3,
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 6),

                      Row(
                        children: [
                          const Icon(
                            Icons.location_on_outlined,
                            size: 14,
                            color: Color(0xFF94A3B8),
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              location,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 8),

                      Row(
                        children: [
                          const Text(
                            'RISK SCORE',
                            style: TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 8,
                              fontWeight: FontWeight.w900,
                              letterSpacing: .7,
                            ),
                          ),
                          const SizedBox(width: 7),
                          Text(
                            prediction.riskScore.toStringAsFixed(1),
                            style: TextStyle(
                              color: isUnavailable
                                  ? const Color(0xFF64748B)
                                  : color,
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const Spacer(),
                          const Icon(
                            Icons.chevron_right_rounded,
                            color: Color(0xFF94A3B8),
                            size: 22,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}