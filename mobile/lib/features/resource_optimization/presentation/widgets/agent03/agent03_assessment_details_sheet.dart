import 'package:flutter/material.dart';
import 'package:dio/dio.dart';

import 'package:reliefnexus_mobile/core/network/api_client.dart';

class Agent03AssessmentDetailsSheet extends StatefulWidget {
  final Map<String, dynamic> assessment;
  final VoidCallback? onRunAgent03;

  const Agent03AssessmentDetailsSheet({
    super.key,
    required this.assessment,
    this.onRunAgent03,
  });

  @override
  State<Agent03AssessmentDetailsSheet> createState() =>
      _Agent03AssessmentDetailsSheetState();
}

class _Agent03AssessmentDetailsSheetState
    extends State<Agent03AssessmentDetailsSheet> {
  final ApiClient _client = ApiClient();

  bool loading = true;
  String? error;

  Map<String, dynamic>? demand;
  List<Map<String, dynamic>> demandLines = [];
  List<Map<String, dynamic>> allocations = [];
  List<Map<String, dynamic>> resources = [];

  static const navy = Color(0xFF102A43);
  static const blue = Color(0xFF1976D2);
  static const text = Color(0xFF172B4D);
  static const muted = Color(0xFF6B7C93);
  static const green = Color(0xFF159570);
  static const red = Color(0xFFD64545);
  static const orange = Color(0xFFEA8A00);

  String _string(
    Map<String, dynamic> map,
    List<String> keys, [
    String fallback = '',
  ]) {
    for (final key in keys) {
      final value = map[key];
      if (value != null && value.toString().trim().isNotEmpty) {
        return value.toString();
      }
    }
    return fallback;
  }

  double _number(Map<String, dynamic> map, List<String> keys) {
    for (final key in keys) {
      final value = map[key];
      if (value is num) return value.toDouble();
      final parsed = double.tryParse(value?.toString() ?? '');
      if (parsed != null) return parsed;
    }
    return 0;
  }

  int _int(Map<String, dynamic> map, List<String> keys) =>
      _number(map, keys).round();

  String _id(Map<String, dynamic> map) =>
      (map['id'] ?? map['Id'] ?? '').toString();

  String _formatNumber(num value) {
    final raw = value % 1 == 0
        ? value.toInt().toString()
        : value.toStringAsFixed(1);

    return raw.replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
      (match) => '${match[1]},',
    );
  }

  String _disasterAsset(String disaster) {
    final value = disaster.toLowerCase();

    if (value.contains('drought')) {
      return 'assets/images/disasters/drought.jpg';
    }
    if (value.contains('flood')) {
      return 'assets/images/disasters/flood.jpg';
    }
    if (value.contains('landslide')) {
      return 'assets/images/disasters/landslide.jpg';
    }
    if (value.contains('earthquake')) {
      return 'assets/images/disasters/earthquake.jpg';
    }
    if (value.contains('cyclone')) {
      return 'assets/images/disasters/cyclone.jpg';
    }
    if (value.contains('wildfire') || value.contains('fire')) {
      return 'assets/images/disasters/wildfire.jpg';
    }
    if (value.contains('tsunami')) {
      return 'assets/images/disasters/tsunami.jpg';
    }
    if (value.contains('avalanche')) {
      return 'assets/images/disasters/avalanche.jpg';
    }
    if (value.contains('lightning')) {
      return 'assets/images/disasters/lightning.jpg';
    }
    if (value.contains('volcan')) {
      return 'assets/images/disasters/volcanic-eruption.jpg';
    }

    return 'assets/images/disasters/disaster_default.jpg';
  }

  String _resourceAsset(String name, String type) {
    final value = '$name $type'.toLowerCase();

    if (value.contains('first aid') ||
        value.contains('medical') ||
        value.contains('medicine')) {
      return 'assets/images/resources/first_aid.jpg';
    }
    if (value.contains('water') ||
        value.contains('drinking') ||
        value.contains('bottle')) {
      return 'assets/images/resources/water.jpg';
    }
    if (value.contains('food') ||
        value.contains('ration') ||
        value.contains('meal') ||
        value.contains('pack')) {
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
    if (value.contains('hygiene') ||
        value.contains('sanitary') ||
        value.contains('soap')) {
      return 'assets/images/resources/hygiene.jpg';
    }

    return 'assets/images/resources/resource_default.jpg';
  }

  Color _riskColor(String value) {
    switch (value.toLowerCase()) {
      case 'critical':
        return red;
      case 'high':
        return orange;
      case 'medium':
        return const Color(0xFFB7791F);
      default:
        return green;
    }
  }

  String _riskLevel() {
    final explicit = _string(widget.assessment, ['riskLevel', 'RiskLevel'], '');

    if (explicit.isNotEmpty) return explicit;

    final score = _number(widget.assessment, [
      'riskScore',
      'RiskScore',
      'risk',
    ]);

    if (score >= 75) return 'Critical';
    if (score >= 50) return 'High';
    if (score >= 25) return 'Medium';
    return 'Low';
  }

  @override
  void initState() {
    super.initState();
    _loadDetails();
  }

  Future<void> _loadDetails() async {
    final id = _id(widget.assessment);

    if (id.isEmpty) {
      if (!mounted) return;
      setState(() {
        loading = false;
        error = 'This assessment has no valid ID.';
      });
      return;
    }

    try {
      final responses = await Future.wait([
        _client.dio.get('/resource-optimization/$id/demand'),
        _client.dio.get('/resource-optimization/$id'),
        _client.dio.get('/resource-optimization/resources'),
      ]);

      final demandData = responses[0].data;
      final allocationData = responses[1].data;
      final resourceData = responses[2].data;

      final newDemand = demandData is Map
          ? Map<String, dynamic>.from(demandData)
          : <String, dynamic>{};

      final rawLines =
          newDemand['resources'] ??
          newDemand['resourceDemands'] ??
          newDemand['demandLines'] ??
          [];

      final newDemandLines = rawLines is List
          ? rawLines
                .whereType<Map>()
                .map((e) => Map<String, dynamic>.from(e))
                .toList()
          : <Map<String, dynamic>>[];

      final newAllocations = allocationData is List
          ? allocationData
                .whereType<Map>()
                .map((e) => Map<String, dynamic>.from(e))
                .toList()
          : <Map<String, dynamic>>[];

      final newResources = resourceData is List
          ? resourceData
                .whereType<Map>()
                .map((e) => Map<String, dynamic>.from(e))
                .toList()
          : <Map<String, dynamic>>[];

      if (!mounted) return;

      setState(() {
        demand = newDemand;
        demandLines = newDemandLines;
        allocations = newAllocations;
        resources = newResources;
        loading = false;
      });
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() {
        loading = false;
        error =
            e.response?.data?.toString() ??
            e.message ??
            'Unable to load assessment details.';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        loading = false;
        error = e.toString();
      });
    }
  }

  Widget _metric(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(13),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE1E8F1)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 19, color: color),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                color: muted,
                fontSize: 9,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: text,
                fontSize: 16,
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _section(String title, IconData icon, Widget child) {
    return Container(
      margin: const EdgeInsets.only(bottom: 13),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE1E8F1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: blue.withValues(alpha: .09),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 18, color: blue),
              ),
              const SizedBox(width: 9),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: text,
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  Widget _detail(String label, String value, {IconData? icon}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16, color: blue),
            const SizedBox(width: 8),
          ],
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                color: muted,
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                color: text,
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _resourceRow(Map<String, dynamic> item, {bool allocation = false}) {
    final name = _string(item, ['resourceName', 'ResourceName'], 'Resource');
    final type = _string(item, ['resourceType', 'ResourceType'], '');

    final required = _int(item, ['requiredQuantity', 'RequiredQuantity']);
    final available = _int(item, ['availableQuantity', 'AvailableQuantity']);
    final gap = _int(item, ['gapQuantity', 'GapQuantity']);
    final recommended = _int(item, [
      'recommendedQuantity',
      'RecommendedQuantity',
      'allocatableQuantity',
      'AllocatableQuantity',
    ]);
    final allocated = _int(item, ['allocatedQuantity', 'AllocatedQuantity']);

    final location = _string(item, ['location', 'Location'], '');

    return Container(
      margin: const EdgeInsets.only(bottom: 9),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFF7FAFE),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E9F1)),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.asset(
              _resourceAsset(name, type),
              width: 48,
              height: 48,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: text,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  type.isEmpty ? location : '$type  $location',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: muted,
                    fontSize: 9.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: allocation
                ? [
                    Text(
                      'Recommended $recommended',
                      style: const TextStyle(
                        color: text,
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      'Allocated $allocated',
                      style: const TextStyle(
                        color: green,
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      'Gap $gap',
                      style: TextStyle(
                        color: gap > 0 ? red : green,
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ]
                : [
                    Text(
                      'Required $required',
                      style: const TextStyle(
                        color: text,
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      'Available $available',
                      style: const TextStyle(
                        color: green,
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      'Gap $gap',
                      style: TextStyle(
                        color: gap > 0 ? red : green,
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final location = _string(widget.assessment, [
      'location',
      'Location',
    ], 'Unknown location');

    final disaster = _string(widget.assessment, [
      'disasterType',
      'DisasterType',
    ], 'Unknown disaster');

    final risk = _riskLevel();
    final riskColor = _riskColor(risk);

    final riskScore = _number(widget.assessment, [
      'riskScore',
      'RiskScore',
      'risk',
    ]);

    final vulnerability = _number(widget.assessment, [
      'vulnerabilityScore',
      'VulnerabilityScore',
    ]);

    final impact = _number(widget.assessment, ['impactScore', 'ImpactScore']);

    final affected = _int(widget.assessment, [
      'affectedPopulation',
      'AffectedPopulation',
    ]);

    final priorityAffected = _int(widget.assessment, [
      'priorityAffectedPopulation',
      'PriorityAffectedPopulation',
    ]);

    final severity = _number(widget.assessment, [
      'severityIndex',
      'SeverityIndex',
      'severity',
    ]);

    final totalRequired = demandLines.fold<int>(
      0,
      (sum, item) => sum + _int(item, ['requiredQuantity', 'RequiredQuantity']),
    );

    final totalAvailable = demandLines.fold<int>(
      0,
      (sum, item) =>
          sum + _int(item, ['availableQuantity', 'AvailableQuantity']),
    );

    final totalGap = demandLines.fold<int>(
      0,
      (sum, item) => sum + _int(item, ['gapQuantity', 'GapQuantity']),
    );

    final totalAllocated = allocations.fold<int>(
      0,
      (sum, item) =>
          sum +
          _int(item, [
            'allocatedQuantity',
            'AllocatedQuantity',
            'recommendedQuantity',
            'RecommendedQuantity',
          ]),
    );

    final coverage = totalRequired > 0
        ? ((totalRequired - totalGap).clamp(0, totalRequired) /
              totalRequired *
              100)
        : 0.0;

    return Material(
      color: const Color(0xFFF3F7FC),
      child: SafeArea(
        top: false,
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.fromLTRB(18, 10, 10, 14),
              color: Colors.white,
              child: Column(
                children: [
                  Container(
                    width: 42,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFD4DDE8),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(
                        Icons.analytics_rounded,
                        color: navy,
                        size: 25,
                      ),
                      const SizedBox(width: 9),
                      const Expanded(
                        child: Text(
                          'Assessment Details',
                          style: TextStyle(
                            color: text,
                            fontSize: 17,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(15, 15, 15, 28),
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(22),
                    child: SizedBox(
                      height: 190,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          Image.asset(
                            _disasterAsset(disaster),
                            fit: BoxFit.cover,
                          ),
                          DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.transparent,
                                  Colors.black.withValues(alpha: .75),
                                ],
                              ),
                            ),
                          ),
                          Positioned(
                            top: 13,
                            right: 13,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: riskColor,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                risk,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                          ),
                          Positioned(
                            left: 17,
                            bottom: 15,
                            right: 17,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  location,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 24,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                Text(
                                  disaster,
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      _metric(
                        'RISK',
                        '${riskScore.toStringAsFixed(1)} / 100',
                        Icons.warning_amber_rounded,
                        orange,
                      ),
                      const SizedBox(width: 8),
                      _metric(
                        'VULNERABILITY',
                        '${vulnerability.toStringAsFixed(1)} / 100',
                        Icons.shield_rounded,
                        const Color(0xFF7657F7),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _metric(
                        'IMPACT',
                        '${impact.toStringAsFixed(1)} / 100',
                        Icons.bolt_rounded,
                        blue,
                      ),
                      const SizedBox(width: 8),
                      _metric(
                        'AFFECTED',
                        _formatNumber(affected),
                        Icons.groups_rounded,
                        navy,
                      ),
                    ],
                  ),
                  const SizedBox(height: 13),

                  _section(
                    'Assessment Information',
                    Icons.assignment_rounded,
                    Column(
                      children: [
                        _detail(
                          'Assessment ID',
                          _id(widget.assessment),
                          icon: Icons.fingerprint_rounded,
                        ),
                        _detail(
                          'Location',
                          location,
                          icon: Icons.location_on_rounded,
                        ),
                        _detail(
                          'Disaster Type',
                          disaster,
                          icon: Icons.public_rounded,
                        ),
                        _detail(
                          'Risk Level',
                          risk,
                          icon: Icons.warning_rounded,
                        ),
                        _detail(
                          'Affected Population',
                          _formatNumber(affected),
                          icon: Icons.groups_rounded,
                        ),
                        _detail(
                          'Priority Population',
                          _formatNumber(priorityAffected),
                        ),
                        _detail('Severity Index', severity.toStringAsFixed(1)),
                        _detail(
                          'Created At',
                          _string(widget.assessment, [
                            'createdAt',
                            'CreatedAt',
                          ]),
                          icon: Icons.schedule_rounded,
                        ),
                      ],
                    ),
                  ),

                  _section(
                    'Agent Lineage',
                    Icons.account_tree_rounded,
                    Column(
                      children: [
                        _lineage(
                          'AGENT 01',
                          'Risk Prediction',
                          'Original risk intelligence',
                          Icons.analytics_rounded,
                          blue,
                        ),
                        const SizedBox(height: 8),
                        _lineage(
                          'AGENT 02',
                          'Vulnerability & Impact',
                          'Selected assessment context',
                          Icons.shield_rounded,
                          const Color(0xFF7657F7),
                        ),
                        const SizedBox(height: 8),
                        _lineage(
                          'AGENT 03',
                          'Resource Optimization',
                          allocations.isEmpty
                              ? 'Ready to optimize'
                              : '${allocations.length} allocation record(s)',
                          Icons.inventory_2_rounded,
                          const Color(0xFF0088A8),
                        ),
                      ],
                    ),
                  ),

                  if (loading)
                    const Padding(
                      padding: EdgeInsets.all(30),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else ...[
                    _section(
                      'Resource Demand',
                      Icons.bar_chart_rounded,
                      Column(
                        children: [
                          Row(
                            children: [
                              _metric(
                                'REQUIRED',
                                _formatNumber(totalRequired),
                                Icons.inventory_rounded,
                                blue,
                              ),
                              const SizedBox(width: 8),
                              _metric(
                                'AVAILABLE',
                                _formatNumber(totalAvailable),
                                Icons.warehouse_rounded,
                                green,
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              _metric(
                                'GAP',
                                _formatNumber(totalGap),
                                Icons.warning_rounded,
                                red,
                              ),
                              const SizedBox(width: 8),
                              _metric(
                                'COVERAGE',
                                '${coverage.toStringAsFixed(1)}%',
                                Icons.pie_chart_rounded,
                                orange,
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          if (demandLines.isEmpty)
                            Text(
                              error ?? 'No resource demand records returned.',
                              style: const TextStyle(
                                color: muted,
                                fontSize: 11,
                              ),
                            )
                          else
                            ...demandLines.map((item) => _resourceRow(item)),
                        ],
                      ),
                    ),

                    _section(
                      'Resource Allocations',
                      Icons.local_shipping_rounded,
                      Column(
                        children: [
                          Row(
                            children: [
                              _metric(
                                'RECORDS',
                                '${allocations.length}',
                                Icons.inventory_2_rounded,
                                blue,
                              ),
                              const SizedBox(width: 8),
                              _metric(
                                'ALLOCATED',
                                _formatNumber(totalAllocated),
                                Icons.check_circle_rounded,
                                green,
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          if (allocations.isEmpty)
                            const Text(
                              'No Agent 03 allocations exist for this assessment yet.',
                              style: TextStyle(color: muted, fontSize: 11),
                            )
                          else
                            ...allocations.map(
                              (item) => _resourceRow(item, allocation: true),
                            ),
                        ],
                      ),
                    ),

                    _section(
                      'Live Resource Inventory',
                      Icons.warehouse_rounded,
                      Column(
                        children: [
                          if (resources.isEmpty)
                            const Text(
                              'No inventory records returned.',
                              style: TextStyle(color: muted, fontSize: 11),
                            )
                          else
                            ...resources.take(8).map((item) {
                              final name = _string(item, [
                                'resourceName',
                                'ResourceName',
                              ], 'Resource');
                              final type = _string(item, [
                                'resourceType',
                                'ResourceType',
                              ], '');
                              final available = _int(item, [
                                'availableQuantity',
                                'AvailableQuantity',
                              ]);
                              final location = _string(item, [
                                'location',
                                'Location',
                              ], '');

                              return Padding(
                                padding: const EdgeInsets.only(bottom: 9),
                                child: Row(
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(9),
                                      child: Image.asset(
                                        _resourceAsset(name, type),
                                        width: 42,
                                        height: 42,
                                        fit: BoxFit.cover,
                                      ),
                                    ),
                                    const SizedBox(width: 9),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            name,
                                            style: const TextStyle(
                                              color: text,
                                              fontSize: 11.5,
                                              fontWeight: FontWeight.w900,
                                            ),
                                          ),
                                          Text(
                                            '$type  $location',
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              color: muted,
                                              fontSize: 9.5,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      _formatNumber(available),
                                      style: const TextStyle(
                                        color: green,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }),
                        ],
                      ),
                    ),
                  ],

                  Container(
                    margin: const EdgeInsets.only(bottom: 13),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: navy,
                      borderRadius: BorderRadius.circular(17),
                    ),
                    child: const Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          Icons.verified_user_rounded,
                          color: Colors.white,
                          size: 22,
                        ),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Backend-authoritative data: this screen loads the selected assessment, demand, allocations, and resource inventory from the live Agent 03 APIs.',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 10.5,
                              height: 1.4,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  SizedBox(
                    width: double.infinity,
                    height: 53,
                    child: ElevatedButton.icon(
                      onPressed: widget.onRunAgent03,
                      icon: const Icon(Icons.play_arrow_rounded),
                      label: const Text(
                        'Run Agent 03 on This Assessment',
                        style: TextStyle(fontWeight: FontWeight.w900),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: navy,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
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

  Widget _lineage(
    String agent,
    String title,
    String subtitle,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(11),
      decoration: BoxDecoration(
        color: const Color(0xFFF7FAFE),
        borderRadius: BorderRadius.circular(13),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 21),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  agent,
                  style: TextStyle(
                    color: color,
                    fontSize: 8.5,
                    fontWeight: FontWeight.w900,
                    letterSpacing: .5,
                  ),
                ),
                Text(
                  title,
                  style: const TextStyle(
                    color: text,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(color: muted, fontSize: 9.5),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}


