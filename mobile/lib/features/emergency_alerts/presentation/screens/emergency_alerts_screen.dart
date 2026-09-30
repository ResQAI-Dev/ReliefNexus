import 'package:flutter/material.dart';
import 'package:reliefnexus_mobile/core/network/api_client.dart';
import 'package:reliefnexus_mobile/features/risk_predictions/presentation/screens/risk_predictions_screen.dart';
import 'assessment_report_details_screen.dart';

import 'emergency_workflow_screen.dart';

class EmergencyAlertsPage extends StatefulWidget {
  const EmergencyAlertsPage({super.key});

  @override
  State<EmergencyAlertsPage> createState() => _EmergencyAlertsPageState();
}

class _EmergencyAlertsPageState extends State<EmergencyAlertsPage> {
  final ApiClient _client = ApiClient();

  static const Color navy = Color(0xFF031525);
  static const Color panel = Color(0xFF08233A);
  static const Color blue = Color(0xFF38BDF8);
  static const Color green = Color(0xFF22C55E);
  static const Color amber = Color(0xFF38BDF8);

  bool loading = true;
  String? error;

  List<Map<String, dynamic>> assessments = [];

  @override
  void initState() {
    super.initState();
    _loadAssessments();
  }

  Future<void> _loadAssessments() async {
    if (mounted) {
      setState(() {
        loading = true;
        error = null;
      });
    }

    try {
      final response = await _client.dio.get('/vulnerability-impact');

      final raw = _extractList(response.data);

      final items = raw
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .toList();

      items.sort((a, b) {
        final aDate = _date(a);
        final bDate = _date(b);
        return bDate.compareTo(aDate);
      });

      if (!mounted) return;

      debugPrint('===== AGENT 02 ASSESSMENTS =====');
for (final item in items) {
  debugPrint(
    'ID= | '
    'Location= | '
    'Disaster= | '
    'Created= | '
    'AssessmentDate= | '
    'Updated='
  );
}
debugPrint('===== END AGENT 02 ASSESSMENTS =====');

setState(() {
        assessments = items;
        loading = false;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        loading = false;
        error = e.toString();
      });
    }
  }

  List<dynamic> _extractList(dynamic data) {
    if (data is List) {
      return data;
    }

    if (data is Map) {
      final value =
          data['items'] ??
          data['data'] ??
          data['results'] ??
          data['assessments'] ??
          data['vulnerabilityAssessments'];

      if (value is List) {
        return value;
      }
    }

    return [];
  }

  DateTime _date(Map<String, dynamic> data) {
    final raw =
        data['createdAt'] ??
        data['CreatedAt'] ??
        data['assessmentDate'] ??
        data['AssessmentDate'] ??
        data['updatedAt'] ??
        data['UpdatedAt'];

    return DateTime.tryParse('$raw') ?? DateTime.fromMillisecondsSinceEpoch(0);
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

  String _disasterPhoto(String disaster) {
    final d = disaster.toLowerCase();

    if (d.contains('flood')) {
      return 'assets/images/disasters/flood.jpg';
    }

    if (d.contains('drought')) {
      return 'assets/images/disasters/drought.jpg';
    }

    if (d.contains('landslide')) {
      return 'assets/images/disasters/landslide.jpg';
    }

    if (d.contains('cyclone') || d.contains('storm')) {
      return 'assets/images/disasters/cyclone.jpg';
    }

    if (d.contains('earthquake')) {
      return 'assets/images/disasters/earthquake.jpg';
    }

    if (d.contains('wildfire') || d.contains('fire')) {
      return 'assets/images/disasters/wildfire.jpg';
    }

    if (d.contains('tsunami')) {
      return 'assets/images/disasters/tsunami.jpg';
    }

    if (d.contains('avalanche')) {
      return 'assets/images/disasters/avalanche.jpg';
    }

    if (d.contains('lightning')) {
      return 'assets/images/disasters/lightning.jpg';
    }

    if (d.contains('volcan')) {
      return 'assets/images/disasters/volcanic-eruption.jpg';
    }

    return 'assets/images/disasters/disaster_default.jpg';
  }

  Color _riskColor(String risk) {
    final r = risk.toLowerCase();

    if (r.contains('critical')) {
      return const Color(0xFFFF4568);
    }

    if (r.contains('high')) {
      return const Color(0xFFFF9F43);
    }

    if (r.contains('medium')) {
      return const Color(0xFFFFC107);
    }

    if (r.contains('low')) {
      return green;
    }

    return blue;
  }

  void _openRiskPredictions() {
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const RiskPredictionsPage()));
  }

  void _openWorkflow(Map<String, dynamic> assessment) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => EmergencyWorkflowPage(assessment: assessment),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: navy,
      appBar: AppBar(
        backgroundColor: navy,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Emergency Warning & Coordination',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
        ),
        actions: [
          IconButton(
            onPressed: _loadAssessments,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: blue))
          : error != null
          ? _errorView()
          : RefreshIndicator(
              color: blue,
              onRefresh: _loadAssessments,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 7, 16, 35),
                children: [
                  _heroHeader(),
                  const SizedBox(height: 17),

                  _predictionButton(),

                  const SizedBox(height: 25),

                  _latestSection(),

                  const SizedBox(height: 27),

                  _recentSection(),
                ],
              ),
            ),
    );
  }

  Widget _heroHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0B2545), Color(0xFF075985)],
        ),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: blue.withOpacity(.16)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(11),
                decoration: BoxDecoration(
                  color: blue.withOpacity(.13),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: const Icon(
                  Icons.crisis_alert_rounded,
                  color: Color(0xFF7DD3FC),
                  size: 22,
                ),
              ),
              const SizedBox(width: 11),
              const Expanded(
                child: Text(
                  'AGENT 04',
                  style: TextStyle(
                    color: Color(0xFFBAE6FD),
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.4,
                  ),
                ),
              ),
              _statusPill('LIVE'),
            ],
          ),
          const SizedBox(height: 16),
          const Text(
            'Emergency Coordination',
            style: TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Generate operational emergency warnings '
            'using verified Agent 02 assessments and '
            'Agent 03 resource coordination.',
            style: TextStyle(
              color: Colors.white.withOpacity(.68),
              fontSize: 10,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _agent('01', 'RISK'),
              _agent('02', 'IMPACT'),
              _agent('03', 'RESOURCE'),
              _agent('04', 'WARNING'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _agent(String number, String title) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 2),
        padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 3),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(.055),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(
              'AGENT $number',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 7,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: const TextStyle(color: Colors.white54, fontSize: 6),
            ),
          ],
        ),
      ),
    );
  }

  Widget _predictionButton() {
    return InkWell(
      onTap: _openRiskPredictions,
      borderRadius: BorderRadius.circular(19),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: panel,
          borderRadius: BorderRadius.circular(19),
          border: Border.all(color: blue.withOpacity(.16)),
        ),
        child: Row(
          children: [
            Container(
              width: 47,
              height: 47,
              decoration: BoxDecoration(
                color: blue.withOpacity(.11),
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Icon(Icons.auto_graph_rounded, color: blue),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'CREATE / RUN RISK PREDICTION',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Start with Agent 01 Risk Prediction.',
                    style: TextStyle(color: Colors.white54, fontSize: 9),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, color: blue, size: 14),
          ],
        ),
      ),
    );
  }

  Widget _latestSection() {
    if (assessments.isEmpty) {
      return _noAssessment();
    }

    final latest = assessments.reduce(
  (current, item) =>
      _date(item).isAfter(_date(current)) ? item : current,
);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'LATEST ASSESSMENT',
                    style: TextStyle(
                      color: blue,
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.1,
                    ),
                  ),
                  SizedBox(height: 3),
                  Text(
                    'Ready for Agent 04',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 19,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ),
            _statusPill('LATEST'),
          ],
        ),
        const SizedBox(height: 12),
        _latestCard(latest),
      ],
    );
  }

  Widget _latestCard(Map<String, dynamic> assessment) {
    final disaster = _value(assessment, [
      'disasterType',
      'DisasterType',
    ], 'Disaster');

    final location = _value(assessment, [
      'location',
      'Location',
    ], 'Unknown location');

    final risk = _value(assessment, [
      'riskLevel',
      'RiskLevel',
      'priority',
    ], 'Pending');

    final affected = _value(assessment, [
      'affectedPopulation',
      'AffectedPopulation',
    ], ' ');

    final riskScore = _value(assessment, ['riskScore', 'RiskScore'], ' ');

    final vulnerability = _value(assessment, [
      'vulnerabilityScore',
      'VulnerabilityScore',
    ], ' ');

    final impact = _value(assessment, ['impactScore', 'ImpactScore'], ' ');

    return Container(
      decoration: BoxDecoration(
        color: panel,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: blue.withOpacity(.28), width: 1.2),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          SizedBox(
            height: 285,
            width: double.infinity,
            child: Stack(
              fit: StackFit.expand,
              children: [
                _disasterImage(disaster),
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withOpacity(.94),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  top: 13,
                  left: 13,
                  child: _imagePill('AGENT 02 VERIFIED'),
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
                      color: _riskColor(risk),
                      borderRadius: BorderRadius.circular(30),
                    ),
                    child: Text(
                      risk.toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  left: 16,
                  bottom: 16,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        location,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        disaster,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              children: [
                Row(
                  children: [
                    _metric('Affected', affected, Icons.groups_rounded),
                    _metric('Risk', riskScore, Icons.speed_rounded),
                    _metric(
                      'Vulnerability',
                      vulnerability,
                      Icons.shield_rounded,
                    ),
                    _metric('Impact', impact, Icons.warning_amber_rounded),
                  ],
                ),

                const SizedBox(height: 12),

                Container(
                  padding: const EdgeInsets.all(11),
                  decoration: BoxDecoration(
                    color: navy,
                    borderRadius: BorderRadius.circular(13),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.verified_rounded, color: green, size: 16),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Verified Agent 02 assessment Ready for Agent 04',
                          style: TextStyle(color: Colors.white60, fontSize: 8),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => _openWorkflow(assessment),
                    icon: const Icon(Icons.arrow_forward_rounded, size: 17),
                    label: const Text('VIEW ASSESSMENT & RUN'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0EA5E9),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _recentSection() {
    if (assessments.length <= 1) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle(
            'RECENT ASSESSMENTS',
            'No older assessments available.',
          ),
          const SizedBox(height: 12),
          _emptyRecent(),
        ],
      );
    }

    final recent = assessments.skip(1).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionTitle(
          'RECENT ASSESSMENTS',
          '${recent.length} previous assessment${recent.length == 1 ? '' : 's'}',
        ),
        const SizedBox(height: 12),
        ...recent.map(_recentCard),
      ],
    );
  }

  Widget _recentCard(Map<String, dynamic> assessment) {
    final disaster = _value(assessment, [
      'disasterType',
      'DisasterType',
    ], 'Disaster');

    final location = _value(assessment, ['location', 'Location'], 'Unknown');

    final risk = _value(assessment, [
      'riskLevel',
      'RiskLevel',
      'priority',
    ], 'Pending');

    final affected = _value(assessment, [
      'affectedPopulation',
      'AffectedPopulation',
    ], ' ');

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: panel,
        borderRadius: BorderRadius.circular(19),
        border: Border.all(color: blue.withOpacity(.10)),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) =>
                  AssessmentReportDetailsPage(assessment: assessment),
            ),
          );
        },
        child: Row(
          children: [
            SizedBox(width: 112, height: 125, child: _disasterImage(disaster)),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            location,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 7,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: _riskColor(risk).withOpacity(.16),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            risk.toUpperCase(),
                            style: TextStyle(
                              color: _riskColor(risk),
                              fontSize: 7,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      disaster,
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 9,
                      ),
                    ),
                    const SizedBox(height: 9),
                    Row(
                      children: [
                        const Icon(Icons.groups_rounded, color: blue, size: 13),
                        const SizedBox(width: 4),
                        Text(
                          affected,
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 8,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const Spacer(),
                        const Icon(
                          Icons.arrow_forward_ios_rounded,
                          color: blue,
                          size: 11,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String title, String subtitle) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 19,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                subtitle,
                style: const TextStyle(color: Colors.white54, fontSize: 9),
              ),
            ],
          ),
        ),
        _statusPill('${assessments.length} TOTAL'),
      ],
    );
  }

  Widget _detailMiniRow(
    String label,
    String value,
    IconData icon, {
    bool last = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 9),
      decoration: BoxDecoration(
        border: last
            ? null
            : Border(bottom: BorderSide(color: Colors.white.withOpacity(.06))),
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF7DD3FC), size: 15),
          const SizedBox(width: 9),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white38,
              fontSize: 8,
              fontWeight: FontWeight.w700,
            ),
          ),
          const Spacer(),
          Flexible(
            child: Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.right,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 8,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _metric(String title, String data, IconData icon) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 2),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 2),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(.035),
          borderRadius: BorderRadius.circular(11),
        ),
        child: Column(
          children: [
            Icon(icon, color: blue, size: 15),
            const SizedBox(height: 4),
            Text(
              data,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 9,
                fontWeight: FontWeight.w900,
              ),
            ),
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white38, fontSize: 6),
            ),
          ],
        ),
      ),
    );
  }

  Widget _disasterImage(String disaster) {
    final asset = _disasterPhoto(disaster);

    return Image.asset(
      asset,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) {
        return Container(
          color: const Color(0xFF10243D),
          child: const Center(
            child: Icon(
              Icons.landscape_rounded,
              color: Colors.white24,
              size: 35,
            ),
          ),
        );
      },
    );
  }

  Widget _statusPill(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(.07),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xFFBAE6FD),
          fontSize: 7,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }

  Widget _imagePill(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: navy.withOpacity(.82),
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

  Widget _emptyRecent() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: panel,
        borderRadius: BorderRadius.circular(18),
      ),
      child: const Column(
        children: [
          Icon(Icons.history_rounded, color: blue, size: 35),
          SizedBox(height: 9),
          Text(
            'No previous assessments',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }

  Widget _noAssessment() {
    return Container(
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: panel,
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Column(
        children: [
          Icon(Icons.assignment_outlined, color: blue, size: 40),
          SizedBox(height: 10),
          Text(
            'No Agent 02 Assessment Found',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w800,
            ),
          ),
          SizedBox(height: 5),
          Text(
            'Create a Risk Prediction first, then '
            'complete the Agent 02 assessment.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white54, fontSize: 9, height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _errorView() {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        const SizedBox(height: 150),
        Padding(
          padding: const EdgeInsets.all(25),
          child: Column(
            children: [
              const Icon(Icons.cloud_off_rounded, color: blue, size: 45),
              const SizedBox(height: 12),
              const Text(
                'Unable to load assessments',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                error ?? 'Backend error',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white54, fontSize: 9),
              ),
              const SizedBox(height: 15),
              ElevatedButton.icon(
                onPressed: _loadAssessments,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('RETRY'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}




