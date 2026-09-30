import 'package:flutter/material.dart';

import '../../data/models/resource_model.dart';

String resourcePhotoAsset(String name, String type) {
  final value = '$name $type'.toLowerCase();

  if (value.contains('first aid') || value.contains('medical')) {
    return 'assets/images/resources/first_aid.jpg';
  }

  if (value.contains('water') ||
      value.contains('drinking') ||
      value.contains('bottle')) {
    return 'assets/images/resources/water.jpg';
  }

  if (value.contains('food') || value.contains('ration')) {
    return 'assets/images/resources/food.jpg';
  }

  if (value.contains('blanket')) {
    return 'assets/images/resources/blanket.jpg';
  }

  if (value.contains('shelter') || value.contains('tent')) {
    return 'assets/images/resources/shelter.jpg';
  }

  if (value.contains('cloth') || value.contains('clothing')) {
    return 'assets/images/resources/clothing.jpg';
  }

  if (value.contains('hygiene') || value.contains('sanitary')) {
    return 'assets/images/resources/hygiene.jpg';
  }

  if (value.contains('transport') || value.contains('vehicle')) {
    return 'assets/images/resources/transport.jpg';
  }

  return 'assets/images/resources/resource_default.jpg';
}

class ResourceInventoryCard extends StatelessWidget {
  final ResourceModel resource;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const ResourceInventoryCard({
    super.key,
    required this.resource,
    required this.onEdit,
    required this.onDelete,
  });

  Color get statusColor {
    final status = resource.status.toLowerCase();

    if (status.contains('available')) {
      return const Color(0xFF059669);
    }

    if (status.contains('low')) {
      return const Color(0xFFD97706);
    }

    if (status.contains('out')) {
      return const Color(0xFFDC2626);
    }

    return const Color(0xFF475569);
  }

  @override
  Widget build(BuildContext context) {
    final remaining = resource.remainingQuantity;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(.045),
            blurRadius: 18,
            offset: const Offset(0, 7),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(15),
                  child: SizedBox(
                    width: 64,
                    height: 64,
                    child: Image.asset(
                      resourcePhotoAsset(
                        resource.resourceName,
                        resource.resourceType,
                      ),
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          color: const Color(0xFFEFF6FF),
                          child: Icon(
                            _resourceIcon(resource.resourceType),
                            color: const Color(0xFF0369A1),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                const SizedBox(width: 13),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        resource.resourceName.isEmpty
                            ? 'Unnamed Resource'
                            : resource.resourceName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        resource.resourceType,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                _StatusBadge(text: resource.status, color: statusColor),
              ],
            ),

            const SizedBox(height: 17),

            Row(
              children: [
                Expanded(
                  child: _Metric(
                    label: 'Available',
                    value: resource.availableQuantity.toString(),
                  ),
                ),
                Expanded(
                  child: _Metric(
                    label: 'Allocated',
                    value: resource.allocatedQuantity.toString(),
                  ),
                ),
                Expanded(
                  child: _Metric(
                    label: 'Remaining',
                    value: remaining.toString(),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 15),

            Row(
              children: [
                const Icon(
                  Icons.location_on_outlined,
                  size: 17,
                  color: Color(0xFF64748B),
                ),
                const SizedBox(width: 5),
                Expanded(
                  child: Text(
                    resource.location.isEmpty
                        ? 'Location not specified'
                        : resource.location,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF64748B),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 15),

            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onEdit,
                    icon: const Icon(Icons.edit_rounded, size: 17),
                    label: const Text('Update'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF0369A1),
                      side: const BorderSide(color: Color(0xFFBAE6FD)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(13),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                IconButton(
                  onPressed: onDelete,
                  tooltip: 'Delete resource',
                  style: IconButton.styleFrom(
                    backgroundColor: const Color(0xFFFEF2F2),
                    foregroundColor: const Color(0xFFDC2626),
                  ),
                  icon: const Icon(Icons.delete_outline_rounded),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  IconData _resourceIcon(String type) {
    final value = type.toLowerCase();

    if (value.contains('water')) {
      return Icons.water_drop_rounded;
    }

    if (value.contains('food')) {
      return Icons.restaurant_rounded;
    }

    if (value.contains('medical') || value.contains('medicine')) {
      return Icons.medical_services_rounded;
    }

    if (value.contains('shelter')) {
      return Icons.home_work_rounded;
    }

    if (value.contains('clothing')) {
      return Icons.checkroom_rounded;
    }

    if (value.contains('vehicle') || value.contains('transport')) {
      return Icons.local_shipping_rounded;
    }

    return Icons.inventory_2_rounded;
  }
}

class _Metric extends StatelessWidget {
  final String label;
  final String value;

  const _Metric({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: Color(0xFF64748B),
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 19,
            color: Color(0xFF0F172A),
            fontWeight: FontWeight.w900,
          ),
        ),
      ],
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String text;
  final Color color;

  const _StatusBadge({required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(.09),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Text(
        text.toUpperCase(),
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w900,
          color: color,
          letterSpacing: .4,
        ),
      ),
    );
  }
}
