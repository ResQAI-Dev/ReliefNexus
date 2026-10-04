import 'package:flutter/material.dart';
import 'package:reliefnexus_mobile/core/network/api_client.dart';

import 'emergency_workflow_screen.dart';

class AssessmentReportDetailsPage extends StatefulWidget {
  final Map<String, dynamic> assessment;

  const AssessmentReportDetailsPage({super.key, required this.assessment});

  @override
  State<AssessmentReportDetailsPage> createState() =>
      _AssessmentReportDetailsPageState();
}

class _AssessmentReportDetailsPageState
    extends State<AssessmentReportDetailsPage> {
  final ApiClient _client = ApiClient();

  static const Color navy = Color(0xFF001A2B);
  static const Color panel = Color(0xFF063B5A);
  static const Color panel2 = Color(0xFF0A5278);
  static const Color blue = Color(0xFF03A9F4);
  static const Color cyan = Color(0xFF00C8FF);
  static const Color green = Color(0xFF22C55E);

  bool loading = true;
  String? error;
  Map<String, dynamic> report = {};

  @override
  void initState() {
    super.initState();
    report = Map<String, dynamic>.from(widget.assessment);
    _loadReport();
  }

  String _id(Map<String, dynamic> data) {
    return '${data['id'] ?? data['Id'] ?? ''}';
  }

  String _value(
    Map<String, dynamic> data,
    List<String> keys, [
    String fallback = '-',
  ]) {
    for (final key in keys) {
      final value = data[key];

      if (value != null && '$value'.trim().isNotEmpty && '$value' != 'null') {
        return '$value';
      }
    }

    return fallback;
  }

  double _number(Map<String, dynamic> data, List<String> keys) {
    for (final key in keys) {
      final value = data[key];

      if (value is num) {
        return value.toDouble();
      }

      final parsed = double.tryParse('$value');

      if (parsed != null) {
        return parsed;
      }
    }

    return 0;
  }

  Future<void> _loadReport() async {
    final id = _id(widget.assessment);

    if (id.isEmpty) {
      if (mounted) {
        setState(() {
          loading = false;
          error = 'Assessment ID is not available.';
        });
      }
      return;
    }

    try {
      final response = await _client.dio.get('/vulnerability-impact/$id');

      dynamic data = response.data;

      if (data is Map) {
        data = data['data'] ?? data['result'] ?? data['assessment'] ?? data;
      }

      if (data is Map) {
        if (!mounted) return;

        setState(() {
          report = Map<String, dynamic>.from(data);
          loading = false;
          error = null;
        });

        return;
      }

      throw Exception('Invalid assessment response.');
    } catch (e) {
      if (!mounted) return;

      setState(() {
        loading = false;
        error = 'Unable to load the submitted assessment.';
      });
    }
  }

  String _photo(String disaster) {
    final value = disaster.toLowerCase();

    if (value.contains('flood')) {
      return 'assets/images/disasters/flood.jpg';
    }

    if (value.contains('drought')) {
      return 'assets/images/disasters/drought.jpg';
    }

    if (value.contains('landslide')) {
      return 'assets/images/disasters/landslide.jpg';
    }

    if (value.contains('cyclone') || value.contains('storm')) {
      return 'assets/images/disasters/cyclone.jpg';
    }

    if (value.contains('earthquake')) {
      return 'assets/images/disasters/earthquake.jpg';
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

  Color _riskColor(String risk) {
    final value = risk.toLowerCase();

    if (value.contains('critical')) {
      return const Color(0xFFFF4568);
    }

    if (value.contains('high')) {
      return const Color(0xFFFF9F43);
    }

    if (value.contains('medium')) {
      return const Color(0xFFFFC107);
    }

    if (value.contains('low')) {
      return green;
    }

    return blue;
  }

  String _formatDate(String value) {
    final date = DateTime.tryParse(value);

    if (date == null) {
      return value;
    }

    final local = date.toLocal();

    String two(int n) => n.toString().padLeft(2, '0');

    return '${local.year}-${two(local.month)}-${two(local.day)} '
        '${two(local.hour)}:${two(local.minute)}';
  }

  List<String> _lines(String value) {
    if (value.trim().isEmpty || value == '-') {
      return [];
    }

    return value
        .split(RegExp(r'[\r\n;]+'))
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .map((item) {
          if (item.startsWith('-')) {
            return item.substring(1).trim();
          }

          return item;
        })
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final location = _value(report, [
      'location',
      'Location',
    ], 'Unknown location');

    final disaster = _value(report, [
      'disasterType',
      'DisasterType',
    ], 'Disaster');

    final riskLevel = _value(report, ['riskLevel', 'RiskLevel'], 'Pending');

    final riskScore = _number(report, ['riskScore', 'RiskScore']);

    final vulnerabilityScore = _number(report, [
      'vulnerabilityScore',
      'VulnerabilityScore',
    ]);

    final impactScore = _number(report, ['impactScore', 'ImpactScore']);

    final affected = _value(report, [
      'affectedPopulation',
      'AffectedPopulation',
    ], '0');

    final vulnerabilityLevel = _value(report, [
      'vulnerabilityLevel',
      'VulnerabilityLevel',
    ], 'Pending');

    final impactLevel = _value(report, [
      'impactLevel',
      'ImpactLevel',
    ], 'Pending');

    final createdAt = _value(report, ['createdAt', 'CreatedAt'], '-');

    final assessmentId = _id(report);

    final riskPredictionId = _value(report, [
      'riskPredictionId',
      'RiskPredictionId',
    ], '-');

    final vulnerabilities = _lines(
      _value(report, ['mainVulnerabilities', 'MainVulnerabilities'], ''),
    );

    final actions = _lines(
      _value(report, ['recommendedActions', 'RecommendedActions'], ''),
    );

    return Scaffold(
      backgroundColor: const Color(0xFF0288D1),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0288D1),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Assessment Report',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
        ),
        actions: [
          IconButton(
            onPressed: _loadReport,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: blue))
          : RefreshIndicator(
              color: blue,
              onRefresh: _loadReport,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 35),
                children: [
                  _hero(location, disaster, riskLevel),

                  const SizedBox(height: 16),

                  _sectionHeader(
                    'ASSESSMENT SUMMARY',
                    'Submitted Agent 02 vulnerability and impact assessment',
                  ),

                  const SizedBox(height: 10),

                  _scoreGrid(
                    riskScore,
                    vulnerabilityScore,
                    impactScore,
                    affected,
                  ),

                  const SizedBox(height: 16),

                  _sectionHeader(
                    'ASSESSMENT INFORMATION',
                    'Verified backend assessment record',
                  ),

                  const SizedBox(height: 10),

                  _infoCard([
                    _infoRow(Icons.location_on_rounded, 'Location', location),
                    _infoRow(
                      Icons.crisis_alert_rounded,
                      'Disaster Type',
                      disaster,
                    ),
                    _infoRow(
                      Icons.warning_amber_rounded,
                      'Risk Level',
                      riskLevel,
                      _riskColor(riskLevel),
                    ),
                    _infoRow(
                      Icons.groups_rounded,
                      'Affected Population',
                      affected,
                    ),
                    _infoRow(
                      Icons.shield_rounded,
                      'Vulnerability Level',
                      vulnerabilityLevel,
                    ),
                    _infoRow(
                      Icons.analytics_rounded,
                      'Impact Level',
                      impactLevel,
                    ),
                    _infoRow(
                      Icons.calendar_month_rounded,
                      'Assessment Date',
                      _formatDate(createdAt),
                    ),
                  ]),

                  const SizedBox(height: 16),

                  _sectionHeader(
                    'AGENT INTELLIGENCE LINEAGE',
                    'Traceable flow behind this submitted report',
                  ),

                  const SizedBox(height: 10),

                  _lineageCard(riskPredictionId, assessmentId),

                  const SizedBox(height: 16),

                  _sectionHeader(
                    'VULNERABILITY ANALYSIS',
                    'Disaster-specific vulnerabilities identified by Agent 02',
                  ),

                  const SizedBox(height: 10),

                  _bulletCard(
                    title: 'Main Vulnerabilities',
                    icon: Icons.shield_rounded,
                    items: vulnerabilities,
                  ),

                  const SizedBox(height: 16),

                  _sectionHeader(
                    'RECOMMENDED ACTIONS',
                    'Actions generated as part of the submitted assessment',
                  ),

                  const SizedBox(height: 10),

                  _bulletCard(
                    title: 'Recommended Response Actions',
                    icon: Icons.task_alt_rounded,
                    items: actions,
                  ),

                  const SizedBox(height: 16),

                  _sectionHeader(
                    'ASSESSMENT IDENTIFIERS',
                    'Backend traceability information',
                  ),

                  const SizedBox(height: 10),

                  _infoCard([
                    _infoRow(
                      Icons.fingerprint_rounded,
                      'Assessment ID',
                      assessmentId,
                    ),
                    _infoRow(
                      Icons.auto_graph_rounded,
                      'Risk Prediction ID',
                      riskPredictionId,
                    ),
                  ]),

                  const SizedBox(height: 18),

                  Container(
                    padding: const EdgeInsets.all(15),
                    decoration: BoxDecoration(
                      color: panel,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: green.withOpacity(.25)),
                    ),
                    child: const Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.verified_rounded, color: green, size: 21),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'This report is loaded from the submitted Agent 02 backend assessment. The displayed values are not generated or replaced by the mobile UI.',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 10,
                              height: 1.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 18),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) =>
                                EmergencyWorkflowPage(assessment: report),
                          ),
                        );
                      },
                      icon: const Icon(Icons.arrow_forward_rounded),
                      label: const Text('CONTINUE TO AGENT 04'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: blue,
                        foregroundColor: navy,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _hero(String location, String disaster, String risk) {
    return Container(
      height: 280,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: blue.withValues(alpha: 0.35)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset(
            _photo(disaster),
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) {
              return Container(color: panel2);
            },
          ),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withOpacity(.15),
                  Colors.black.withOpacity(.88),
                ],
              ),
            ),
          ),
          Positioned(
            top: 14,
            left: 14,
            child: _pill('SUBMITTED AGENT 02 REPORT', blue),
          ),
          Positioned(
            top: 14,
            right: 14,
            child: _pill(risk.toUpperCase(), _riskColor(risk)),
          ),
          Positioned(
            left: 18,
            right: 18,
            bottom: 18,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'CURRENT ASSESSMENT',
                  style: TextStyle(
                    color: cyan,
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  location,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 27,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  disaster,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _scoreGrid(
    double risk,
    double vulnerability,
    double impact,
    String affected,
  ) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 1.75,
      children: [
        _scoreCard(
          'RISK SCORE',
          risk.toStringAsFixed(2),
          Icons.speed_rounded,
          blue,
        ),
        _scoreCard(
          'VULNERABILITY',
          vulnerability.toStringAsFixed(2),
          Icons.shield_rounded,
          cyan,
        ),
        _scoreCard(
          'IMPACT SCORE',
          impact.toStringAsFixed(2),
          Icons.warning_amber_rounded,
          const Color(0xFFFF6B6B),
        ),
        _scoreCard(
          'AFFECTED POPULATION',
          affected,
          Icons.groups_rounded,
          green,
        ),
      ],
    );
  }

  Widget _scoreCard(String title, String value, IconData icon, Color accent) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: panel,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: accent.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: accent, size: 18),
          const Spacer(),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 7,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoCard(List<Widget> children) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
      decoration: BoxDecoration(
        color: panel,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: blue.withValues(alpha: 0.18)),
      ),
      child: Column(children: children),
    );
  }

  Widget _infoRow(
    IconData icon,
    String label,
    String value, [
    Color valueColor = Colors.white,
  ]) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.white10)),
      ),
      child: Row(
        children: [
          Icon(icon, color: blue, size: 16),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 9,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                color: valueColor,
                fontSize: 9,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _lineageCard(String riskPredictionId, String assessmentId) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: panel,
        borderRadius: BorderRadius.circular(19),
        border: Border.all(color: blue.withValues(alpha: 0.25)),
      ),
      child: Column(
        children: [
          _lineageStep(
            '01',
            'Risk Prediction',
            riskPredictionId,
            Icons.auto_graph_rounded,
          ),
          _lineageArrow(),
          _lineageStep(
            '02',
            'Vulnerability & Impact',
            assessmentId,
            Icons.shield_rounded,
          ),
          _lineageArrow(),
          _lineageStep(
            '03',
            'Resource Optimization',
            'Ready after Agent 02',
            Icons.inventory_2_rounded,
          ),
          _lineageArrow(),
          _lineageStep(
            '04',
            'Emergency Warning',
            'Ready to execute',
            Icons.crisis_alert_rounded,
          ),
        ],
      ),
    );
  }

  Widget _lineageStep(
    String number,
    String title,
    String value,
    IconData icon,
  ) {
    return Row(
      children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: blue.withValues(alpha: 0.18),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: blue, size: 18),
        ),
        const SizedBox(width: 11),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'AGENT $number',
                style: const TextStyle(
                  color: blue,
                  fontSize: 7,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Colors.white38, fontSize: 7),
              ),
            ],
          ),
        ),
        const Icon(Icons.check_circle_rounded, color: green, size: 17),
      ],
    );
  }

  Widget _lineageArrow() {
    return Container(
      height: 18,
      alignment: Alignment.centerLeft,
      padding: const EdgeInsets.only(left: 18),
      child: const Icon(
        Icons.arrow_downward_rounded,
        color: Colors.white24,
        size: 14,
      ),
    );
  }

  Widget _bulletCard({
    required String title,
    required IconData icon,
    required List<String> items,
  }) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: panel,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: blue.withValues(alpha: 0.18)),
      ),
      child: items.isEmpty
          ? Row(
              children: [
                Icon(icon, color: blue, size: 18),
                const SizedBox(width: 9),
                const Text(
                  'No detailed entries available.',
                  style: TextStyle(color: Colors.white70, fontSize: 9),
                ),
              ],
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(icon, color: blue, size: 18),
                    const SizedBox(width: 9),
                    Text(
                      title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ...items.asMap().entries.map((entry) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 9),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 7,
                          height: 7,
                          margin: const EdgeInsets.only(top: 4),
                          decoration: const BoxDecoration(
                            color: blue,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 9),
                        Expanded(
                          child: Text(
                            entry.value,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 9,
                              height: 1.45,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
    );
  }

  Widget _sectionHeader(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          subtitle,
          style: const TextStyle(color: Colors.white70, fontSize: 8),
        ),
      ],
    );
  }

  Widget _pill(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(.90),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 7,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}
