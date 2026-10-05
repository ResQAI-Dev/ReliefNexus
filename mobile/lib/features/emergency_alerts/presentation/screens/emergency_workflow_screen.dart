import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:reliefnexus_mobile/core/network/api_client.dart';

class EmergencyWorkflowPage extends StatefulWidget {
  final Map<String, dynamic> assessment;

  const EmergencyWorkflowPage({super.key, required this.assessment});

  @override
  State<EmergencyWorkflowPage> createState() => _EmergencyWorkflowPageState();
}

class _EmergencyWorkflowPageState extends State<EmergencyWorkflowPage> {
  final ApiClient _client = ApiClient();

  static const Color navy = Color(0xFF001A2B);
  static const Color navy2 = Color(0xFF003B5C);
  static const Color card = Color(0xFF064B6E);
  static const Color card2 = Color(0xFF075E83);
  static const Color blue = Color(0xFF03A9F4);
  static const Color blue2 = Color(0xFF03A9F4);
  static const Color green = Color(0xFF22C55E);
  static const Color amber = Color(0xFF81D4FA);
  static const Color red = Color(0xFFEF4444);
  static const Color purple = Color(0xFF00C8FF);

  int step = 1;

  bool loading = true;
  bool running = false;
  bool completed = false;

  String? error;

  Map<String, dynamic> liveAssessment = {};
  List<dynamic> allocations = [];
  dynamic result;

  String get assessmentId =>
      '${widget.assessment['id'] ?? widget.assessment['Id'] ?? ''}';

  @override
  void initState() {
    super.initState();

    liveAssessment = Map<String, dynamic>.from(widget.assessment);

    _loadData();
  }

  Future<void> _loadData() async {
    if (assessmentId.isEmpty) {
      setState(() {
        loading = false;
        error = 'Assessment ID is missing.';
      });
      return;
    }

    try {
      final responses = await Future.wait([
        _client.dio.get('/vulnerability-impact/$assessmentId'),
        _client.dio.get('/resource-optimization/$assessmentId'),
      ]);

      if (!mounted) return;

      if (responses[0].data is Map) {
        liveAssessment = Map<String, dynamic>.from(responses[0].data);
      }

      allocations = _extractList(responses[1].data);

      setState(() {
        loading = false;
        error = null;
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
    if (data is List) return data;

    if (data is Map) {
      final value =
          data['allocations'] ??
          data['items'] ??
          data['data'] ??
          data['results'];

      if (value is List) return value;
    }

    return [];
  }

  String _value(List<String> keys, [String fallback = '-']) {
    for (final key in keys) {
      final value = liveAssessment[key];

      if (value != null && '$value'.trim().isNotEmpty && '$value' != 'null') {
        return '$value';
      }
    }

    return fallback;
  }

  String _resultValue(List<String> keys, [String fallback = '-']) {
    if (result is! Map) return fallback;

    final map = Map<String, dynamic>.from(result);

    for (final key in keys) {
      final value = map[key];

      if (value != null && '$value'.trim().isNotEmpty && '$value' != 'null') {
        return '$value';
      }
    }

    return fallback;
  }

  String _photoFor(String disaster) {
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

    if (d.contains('lightning')) {
      return 'assets/images/disasters/lightning.jpg';
    }

    if (d.contains('avalanche')) {
      return 'assets/images/disasters/avalanche.jpg';
    }

    if (d.contains('volcan')) {
      return 'assets/images/disasters/volcanic-eruption.jpg';
    }

    return 'assets/images/disasters/disaster_default.jpg';
  }

  String _resourcePhoto(String name, String type) {
    final value = '$name $type'.toLowerCase();

    if (value.contains('first aid') ||
        value.contains('first-aid') ||
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

    if (value.contains('cloth') ||
        value.contains('clothing') ||
        value.contains('wear')) {
      return 'assets/images/resources/clothing.jpg';
    }

    if (value.contains('hygiene') ||
        value.contains('sanitary') ||
        value.contains('soap')) {
      return 'assets/images/resources/hygiene.jpg';
    }

    return 'assets/images/resources/resource_default.jpg';
  }

  Color _riskColor(String risk) {
    final value = risk.toLowerCase();

    if (value.contains('critical')) {
      return red;
    }

    if (value.contains('high')) {
      return const Color(0xFFFF8A3D);
    }

    if (value.contains('medium')) {
      return amber;
    }

    if (value.contains('low')) {
      return green;
    }

    return blue;
  }

  Future<void> _runAgent04() async {
    if (running || assessmentId.isEmpty) {
      return;
    }

    setState(() {
      running = true;
      completed = false;
      error = null;
      result = null;
    });

    try {
      final response = await _client.dio.post(
        '/emergency-alerts/assessment/$assessmentId',
      );

      if (!mounted) return;

      setState(() {
        result = response.data;
        running = false;
        completed = true;
        step = 4;
      });
    } on DioException catch (e) {
      if (!mounted) return;

      setState(() {
        running = false;
        error =
            e.response?.data?.toString() ??
            e.message ??
            'Agent 04 request failed.';
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        running = false;
        error = e.toString();
      });
    }
  }

  void _next() {
    if (step < 4) {
      setState(() => step++);
    }
  }

  void _back() {
    if (step > 1) {
      setState(() => step--);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: navy,
      appBar: AppBar(
        backgroundColor: navy,
        foregroundColor: Colors.white,
        elevation: 0,
        titleSpacing: 4,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: blue.withOpacity(.1),
                borderRadius: BorderRadius.circular(9),
              ),
              child: const Icon(
                Icons.crisis_alert_rounded,
                color: blue,
                size: 17,
              ),
            ),
            const SizedBox(width: 9),
            const Text(
              'Agent 04',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
            ),
            const Text(
              ' Emergency Warning',
              style: TextStyle(
                color: Colors.white54,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: blue))
          : RefreshIndicator(
              color: blue,
              onRefresh: _loadData,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(15, 6, 15, 35),
                children: [
                  _workflowProgress(),
                  const SizedBox(height: 18),
                  if (error != null) _errorCard(),
                  if (completed) _completedResult() else _stepContent(),
                ],
              ),
            ),
    );
  }

  Widget _workflowProgress() {
    final labels = ['Assessment', 'Analysis', 'Coordination', 'Confirm'];

    return Container(
      padding: const EdgeInsets.fromLTRB(12, 13, 12, 11),
      decoration: BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withOpacity(.05)),
      ),
      child: Column(
        children: [
          Row(
            children: List.generate(4, (index) {
              final number = index + 1;
              final active = number <= step;

              return Expanded(
                child: Container(
                  margin: EdgeInsets.only(right: number == 4 ? 0 : 5),
                  height: 4,
                  decoration: BoxDecoration(
                    color: active
                        ? const Color(0xFF03A9F4)
                        : const Color(0xFF0B6B91),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 9),
          Row(
            children: List.generate(4, (index) {
              final number = index + 1;
              final active = number <= step;

              return Expanded(
                child: Text(
                  '0$number ${labels[index]}',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: active ? blue : Colors.white30,
                    fontSize: 7,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _stepContent() {
    switch (step) {
      case 1:
        return _step01();
      case 2:
        return _step02();
      case 3:
        return _step03();
      default:
        return _step04();
    }
  }

  Widget _step01() {
    final location = _value(['location', 'Location'], 'Unknown');

    final disaster = _value(['disasterType', 'DisasterType'], 'Disaster');

    final risk = _value(['riskLevel', 'RiskLevel', 'priority'], 'Pending');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeading(
          '01',
          'Assessment Overview',
          'Verify the intelligence before generating an emergency warning.',
        ),
        const SizedBox(height: 15),
        _assessmentHero(location, disaster, risk),
        const SizedBox(height: 14),
        _intelligenceGrid(),
        const SizedBox(height: 14),
        _assessmentDetails(),
        const SizedBox(height: 14),
        _lineageCard(),
        const SizedBox(height: 18),
        _nextButton('CONTINUE TO WARNING ANALYSIS', _next),
      ],
    );
  }

  Widget _assessmentHero(String location, String disaster, String risk) {
    return Container(
      height: 300,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(.06)),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset(
            _photoFor(disaster),
            fit: BoxFit.cover,
            errorBuilder: (context, error, stack) {
              return Container(
                color: navy2,
                child: const Center(
                  child: Icon(
                    Icons.landscape_rounded,
                    color: Colors.white24,
                    size: 55,
                  ),
                ),
              );
            },
          ),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withOpacity(.12),
                  Colors.black.withOpacity(.88),
                ],
              ),
            ),
          ),
          Positioned(top: 13, left: 13, child: _darkPill('AGENT 02 VERIFIED')),
          Positioned(top: 13, right: 13, child: _severityPill(risk)),
          Positioned(
            left: 17,
            right: 17,
            bottom: 17,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'CURRENT ASSESSMENT',
                  style: TextStyle(
                    color: Colors.white60,
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  location,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 25,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    const Icon(
                      Icons.warning_rounded,
                      color: Colors.white70,
                      size: 14,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      disaster,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _intelligenceGrid() {
    final metrics = [
      (
        'AFFECTED',
        _value(['affectedPopulation', 'AffectedPopulation']),
        Icons.groups_rounded,
        blue,
      ),
      (
        'RISK SCORE',
        _value(['riskScore', 'RiskScore']),
        Icons.speed_rounded,
        amber,
      ),
      (
        'VULNERABILITY',
        _value(['vulnerabilityScore', 'VulnerabilityScore']),
        Icons.shield_rounded,
        purple,
      ),
      (
        'IMPACT',
        _value(['impactScore', 'ImpactScore']),
        Icons.warning_amber_rounded,
        red,
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: metrics.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        childAspectRatio: 2.5,
      ),
      itemBuilder: (context, index) {
        final item = metrics[index];

        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: item.$4.withOpacity(.12)),
          ),
          child: Row(
            children: [
              Container(
                width: 35,
                height: 35,
                decoration: BoxDecoration(
                  color: item.$4.withOpacity(.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(item.$3, color: item.$4, size: 17),
              ),
              const SizedBox(width: 9),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.$1,
                      style: const TextStyle(
                        color: Colors.white38,
                        fontSize: 6,
                        fontWeight: FontWeight.w900,
                        letterSpacing: .5,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      item.$2,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _assessmentDetails() {
    return _premiumCard(
      title: 'ASSESSMENT DETAILS',
      icon: Icons.analytics_rounded,
      child: Column(
        children: [
          _detailRow(
            'Location',
            _value(['location', 'Location']),
            Icons.location_on_rounded,
          ),
          _detailRow(
            'Disaster Type',
            _value(['disasterType', 'DisasterType']),
            Icons.public_rounded,
          ),
          _detailRow(
            'Risk Level',
            _value(['riskLevel', 'RiskLevel', 'priority']),
            Icons.warning_rounded,
          ),
          _detailRow(
            'Severity Index',
            _value(['severityIndex', 'SeverityIndex']),
            Icons.equalizer_rounded,
          ),
          _detailRow(
            'Priority',
            _value(['priority', 'Priority']),
            Icons.priority_high_rounded,
          ),
          _detailRow(
            'Assessment ID',
            assessmentId,
            Icons.fingerprint_rounded,
            last: true,
          ),
        ],
      ),
    );
  }

  Widget _lineageCard() {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF075E83), Color(0xFF003B5C)],
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: blue.withOpacity(.12)),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: blue.withOpacity(.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.account_tree_rounded,
              color: blue,
              size: 20,
            ),
          ),
          const SizedBox(width: 11),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'INTELLIGENCE LINEAGE',
                  style: TextStyle(
                    color: blue,
                    fontSize: 7,
                    fontWeight: FontWeight.w900,
                    letterSpacing: .8,
                  ),
                ),
                SizedBox(height: 5),
                Text(
                  'Agent 01 Agent 02 Agent 03 Agent 04',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _step02() {
    final risk = _value(['riskLevel', 'RiskLevel', 'priority'], 'Pending');

    final riskScore = _value(['riskScore', 'RiskScore']);

    final vulnerability = _value(['vulnerabilityScore', 'VulnerabilityScore']);

    final impact = _value(['impactScore', 'ImpactScore']);

    final severity = _value(['severityIndex', 'SeverityIndex']);

    final population = _value(['affectedPopulation', 'AffectedPopulation']);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeading(
          '02',
          'Warning Analysis',
          'Review the factors that will support the emergency warning.',
        ),
        const SizedBox(height: 15),

        _analysisBanner(risk),

        const SizedBox(height: 13),

        _premiumCard(
          title: 'RISK INTELLIGENCE',
          icon: Icons.insights_rounded,
          child: Column(
            children: [
              _scoreBar('Risk Score', riskScore, blue),
              _scoreBar('Vulnerability Score', vulnerability, purple),
              _scoreBar('Impact Score', impact, red),
              _scoreBar('Severity Index', severity, amber),
            ],
          ),
        ),

        const SizedBox(height: 13),

        _premiumCard(
          title: 'POPULATION & EXPOSURE',
          icon: Icons.groups_rounded,
          child: Column(
            children: [
              _bigValue(
                population,
                'Affected Population',
                Icons.groups_rounded,
              ),
              const SizedBox(height: 10),
              _detailRow(
                'Location',
                _value(['location', 'Location']),
                Icons.location_on_rounded,
              ),
              _detailRow(
                'Disaster',
                _value(['disasterType', 'DisasterType']),
                Icons.public_rounded,
                last: true,
              ),
            ],
          ),
        ),

        const SizedBox(height: 13),

        _decisionCard(),

        const SizedBox(height: 13),

        _operationalFactors(),

        const SizedBox(height: 20),

        _navigation('CONTINUE TO COORDINATION', _next),
      ],
    );
  }

  Widget _analysisBanner(String risk) {
    final color = _riskColor(risk);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(.08),
        borderRadius: BorderRadius.circular(19),
        border: Border.all(color: color.withOpacity(.22)),
      ),
      child: Row(
        children: [
          Container(
            width: 43,
            height: 43,
            decoration: BoxDecoration(
              color: color.withOpacity(.13),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.warning_rounded, color: color, size: 21),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'CURRENT RISK CLASSIFICATION',
                  style: TextStyle(
                    color: Colors.white38,
                    fontSize: 7,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  risk.toUpperCase(),
                  style: TextStyle(
                    color: color,
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.verified_rounded, color: green, size: 19),
        ],
      ),
    );
  }

  Widget _scoreBar(String title, String rawValue, Color color) {
    final number = double.tryParse(rawValue) ?? 0;

    final normalized = (number / 100).clamp(0.0, 1.0);

    return Padding(
      padding: const EdgeInsets.only(bottom: 15),
      child: Column(
        children: [
          Row(
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Spacer(),
              Text(
                rawValue,
                style: TextStyle(
                  color: color,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 7),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              minHeight: 6,
              value: normalized,
              backgroundColor: Colors.white.withOpacity(.06),
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ],
      ),
    );
  }

  Widget _bigValue(String value, String label, IconData icon) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: navy2,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Row(
        children: [
          Container(
            width: 43,
            height: 43,
            decoration: BoxDecoration(
              color: blue.withOpacity(.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: blue, size: 20),
          ),
          const SizedBox(width: 11),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 19,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                label,
                style: const TextStyle(color: Colors.white38, fontSize: 8),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _decisionCard() {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: card2,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: blue.withOpacity(.14)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.auto_awesome_rounded, color: blue, size: 20),
          const SizedBox(width: 10),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AGENT 04 DECISION CONTEXT',
                  style: TextStyle(
                    color: blue,
                    fontSize: 7,
                    fontWeight: FontWeight.w900,
                    letterSpacing: .7,
                  ),
                ),
                SizedBox(height: 5),
                Text(
                  'The final emergency warning is generated by the backend using the verified assessment and current coordination data.',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 9,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _step03() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeading(
          '03',
          'Resource Coordination',
          'Review Agent 03 allocations linked to this assessment.',
        ),
        const SizedBox(height: 15),

        _resourceSummary(),

        const SizedBox(height: 13),

        if (allocations.isEmpty)
          _noResources()
        else
          ...allocations.map(_allocationCard),

        const SizedBox(height: 15),

        _coordinationNote(),

        const SizedBox(height: 13),

        _resourceReadiness(),

        const SizedBox(height: 20),

        _navigation('CONTINUE TO REVIEW', _next),
      ],
    );
  }

  Widget _resourceSummary() {
    int required = 0;
    int available = 0;
    int allocated = 0;
    int gap = 0;

    for (final item in allocations) {
      if (item is! Map) continue;

      final map = Map<String, dynamic>.from(item);

      required += _number(map, [
        'recommendedQuantity',
        'RecommendedQuantity',
        'requiredQuantity',
        'RequiredQuantity',
      ]);

      available += _number(map, ['availableQuantity', 'AvailableQuantity']);

      allocated += _number(map, ['allocatedQuantity', 'AllocatedQuantity']);

      gap += _number(map, ['gapQuantity', 'GapQuantity']);
    }

    return Row(
      children: [
        _summaryMetric(
          'REQUIRED',
          '$required',
          blue,
          Icons.inventory_2_rounded,
        ),
        _summaryMetric(
          'AVAILABLE',
          '$available',
          green,
          Icons.check_circle_rounded,
        ),
        _summaryMetric(
          'ALLOCATED',
          '$allocated',
          purple,
          Icons.local_shipping_rounded,
        ),
        _summaryMetric(
          'GAP',
          '$gap',
          gap > 0 ? red : green,
          Icons.warning_rounded,
        ),
      ],
    );
  }

  int _number(Map<String, dynamic> map, List<String> keys) {
    for (final key in keys) {
      final value = int.tryParse('${map[key] ?? ''}');

      if (value != null) return value;
    }

    return 0;
  }

  Widget _summaryMetric(
    String title,
    String value,
    Color color,
    IconData icon,
  ) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 2),
        padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 3),
        decoration: BoxDecoration(
          color: card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(.1)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 16),
            const SizedBox(height: 5),
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w900,
              ),
            ),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white38,
                fontSize: 6,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _allocationCard(dynamic item) {
    if (item is! Map) {
      return const SizedBox.shrink();
    }

    final map = Map<String, dynamic>.from(item);

    final name = '${map['resourceName'] ?? map['ResourceName'] ?? 'Resource'}';

    final type = '${map['resourceType'] ?? map['ResourceType'] ?? ''}';

    final location = '${map['location'] ?? map['Location'] ?? 'Unknown'}';

    final required =
        '${map['recommendedQuantity'] ?? map['RecommendedQuantity'] ?? map['requiredQuantity'] ?? map['RequiredQuantity'] ?? 0}';

    final available =
        '${map['availableQuantity'] ?? map['AvailableQuantity'] ?? 0}';

    final allocated =
        '${map['allocatedQuantity'] ?? map['AllocatedQuantity'] ?? 0}';

    final gap = '${map['gapQuantity'] ?? map['GapQuantity'] ?? 0}';

    final status = '${map['status'] ?? map['Status'] ?? 'Pending'}';

    final photo = _resourcePhoto(name, type);

    return Container(
      margin: const EdgeInsets.only(bottom: 11),
      decoration: BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(.06)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          Row(
            children: [
              SizedBox(
                width: 92,
                height: 94,
                child: Image.asset(
                  photo,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stack) {
                    return Container(
                      color: navy2,
                      child: const Icon(
                        Icons.inventory_2_rounded,
                        color: Colors.white24,
                      ),
                    );
                  },
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        type,
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 8,
                        ),
                      ),
                      const SizedBox(height: 7),
                      Row(
                        children: [
                          const Icon(
                            Icons.location_on_rounded,
                            color: blue,
                            size: 12,
                          ),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              location,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white54,
                                fontSize: 8,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(10, 0, 10, 10),
            child: Row(
              children: [
                _resourceNumber('Required', required),
                _resourceNumber('Available', available),
                _resourceNumber('Allocated', allocated),
                _resourceNumber('Gap', gap, gap != '0' ? red : green),
              ],
            ),
          ),

          Container(
            margin: const EdgeInsets.fromLTRB(10, 0, 10, 10),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: green.withOpacity(.07),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Icon(
                  status.toLowerCase().contains('available')
                      ? Icons.check_circle_rounded
                      : Icons.info_outline_rounded,
                  color: green,
                  size: 13,
                ),
                const SizedBox(width: 6),
                Text(
                  status.toUpperCase(),
                  style: const TextStyle(
                    color: green,
                    fontSize: 7,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _resourceNumber(
    String title,
    String value, [
    Color color = Colors.white,
  ]) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: const TextStyle(color: Colors.white38, fontSize: 6),
          ),
        ],
      ),
    );
  }

  Widget _coordinationNote() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: blue.withOpacity(.06),
        borderRadius: BorderRadius.circular(17),
        border: Border.all(color: blue.withOpacity(.12)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.security_rounded, color: blue, size: 19),
          SizedBox(width: 9),
          Expanded(
            child: Text(
              'Resource data shown here is read from the backend. Agent 04 does not manually override Agent 03 allocation decisions.',
              style: TextStyle(color: Colors.white60, fontSize: 8, height: 1.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _noResources() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(19),
      ),
      child: const Column(
        children: [
          Icon(Icons.inventory_2_outlined, color: blue, size: 38),
          SizedBox(height: 9),
          Text(
            'No Agent 03 Allocations',
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w800,
            ),
          ),
          SizedBox(height: 5),
          Text(
            'Agent 04 can still generate the warning from the verified Agent 02 assessment.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white54, fontSize: 8, height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _operationalFactors() {
    final factors = [
      (
        'RISK ASSESSMENT',
        _value(['riskScore', 'RiskScore'], 'Not available'),
        Icons.speed_rounded,
      ),
      (
        'VULNERABILITY',
        _value(['vulnerabilityScore', 'VulnerabilityScore'], 'Not available'),
        Icons.shield_rounded,
      ),
      (
        'IMPACT',
        _value(['impactScore', 'ImpactScore'], 'Not available'),
        Icons.warning_amber_rounded,
      ),
      (
        'AFFECTED POPULATION',
        _value(['affectedPopulation', 'AffectedPopulation'], 'Not available'),
        Icons.groups_rounded,
      ),
    ];

    return _premiumCard(
      title: 'OPERATIONAL FACTORS',
      icon: Icons.monitor_heart_rounded,
      child: Column(
        children: [
          for (var i = 0; i < factors.length; i++)
            Container(
              margin: EdgeInsets.only(bottom: i == factors.length - 1 ? 0 : 9),
              padding: const EdgeInsets.all(11),
              decoration: BoxDecoration(
                color: navy2,
                borderRadius: BorderRadius.circular(13),
              ),
              child: Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: blue.withOpacity(.08),
                      borderRadius: BorderRadius.circular(9),
                    ),
                    child: Icon(factors[i].$3, color: blue, size: 16),
                  ),
                  const SizedBox(width: 9),
                  Expanded(
                    child: Text(
                      factors[i].$1,
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 7,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  Text(
                    factors[i].$2,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _resourceReadiness() {
    int totalRequired = 0;
    int totalAvailable = 0;
    int totalAllocated = 0;
    int totalGap = 0;

    for (final item in allocations) {
      if (item is! Map) continue;

      final map = Map<String, dynamic>.from(item);

      totalRequired += _number(map, [
        'recommendedQuantity',
        'RecommendedQuantity',
        'requiredQuantity',
        'RequiredQuantity',
      ]);

      totalAvailable += _number(map, [
        'availableQuantity',
        'AvailableQuantity',
      ]);

      totalAllocated += _number(map, [
        'allocatedQuantity',
        'AllocatedQuantity',
      ]);

      totalGap += _number(map, ['gapQuantity', 'GapQuantity']);
    }

    final coverage = totalRequired <= 0
        ? 0.0
        : (totalAllocated / totalRequired).clamp(0.0, 1.0);

    return _premiumCard(
      title: 'RESOURCE READINESS',
      icon: Icons.health_and_safety_rounded,
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _readinessValue('Required', '$totalRequired', blue),
              ),
              Expanded(
                child: _readinessValue(
                  'Available',
                  '$totalAvailable',
                  const Color(0xFF00C8FF),
                ),
              ),
              Expanded(
                child: _readinessValue('Allocated', '$totalAllocated', green),
              ),
              Expanded(
                child: _readinessValue(
                  'Gap',
                  '$totalGap',
                  totalGap > 0 ? red : green,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              const Text(
                'Allocation Coverage',
                style: TextStyle(
                  color: Colors.white54,
                  fontSize: 8,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Spacer(),
              Text(
                '${(coverage * 100).toStringAsFixed(0)}%',
                style: const TextStyle(
                  color: blue,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 7),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              minHeight: 7,
              value: coverage,
              backgroundColor: Colors.white.withOpacity(.06),
              valueColor: const AlwaysStoppedAnimation<Color>(blue),
            ),
          ),
        ],
      ),
    );
  }

  Widget _readinessValue(String title, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            color: color,
            fontSize: 13,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 3),
        Text(title, style: const TextStyle(color: Colors.white38, fontSize: 6)),
      ],
    );
  }

  Widget _executionChecklist() {
    final checks = [
      ('Agent 02 assessment verified', true, Icons.verified_rounded),
      (
        'Assessment ID available',
        assessmentId.isNotEmpty,
        Icons.fingerprint_rounded,
      ),
      (
        'Agent 03 allocation data loaded',
        allocations.isNotEmpty,
        Icons.inventory_2_rounded,
      ),
      ('Backend Agent 04 endpoint ready', true, Icons.cloud_done_rounded),
    ];

    return _premiumCard(
      title: 'EXECUTION READINESS',
      icon: Icons.fact_check_rounded,
      child: Column(
        children: [
          for (var i = 0; i < checks.length; i++)
            Container(
              margin: EdgeInsets.only(bottom: i == checks.length - 1 ? 0 : 9),
              padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 10),
              decoration: BoxDecoration(
                color: checks[i].$2
                    ? green.withOpacity(.045)
                    : red.withOpacity(.045),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(
                    checks[i].$2
                        ? Icons.check_circle_rounded
                        : Icons.error_outline_rounded,
                    color: checks[i].$2 ? green : red,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      checks[i].$1,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 8,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  Icon(checks[i].$3, color: Colors.white24, size: 14),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _step04() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeading(
          '04',
          'Review & Confirm',
          'Review the complete operational context before execution.',
        ),
        const SizedBox(height: 15),

        _finalReview(),

        const SizedBox(height: 14),

        _executionInfo(),

        const SizedBox(height: 13),

        _executionChecklist(),

        const SizedBox(height: 20),

        if (running) _runningCard() else _runButton(),

        const SizedBox(height: 9),

        if (!running)
          Center(
            child: TextButton.icon(
              onPressed: _back,
              icon: const Icon(Icons.arrow_back_rounded, size: 15),
              label: const Text('Review previous step'),
              style: TextButton.styleFrom(foregroundColor: Colors.white54),
            ),
          ),
      ],
    );
  }

  Widget _finalReview() {
    final risk = _value(['riskLevel', 'RiskLevel', 'priority'], 'Pending');

    return _premiumCard(
      title: 'FINAL ASSESSMENT',
      icon: Icons.fact_check_rounded,
      child: Column(
        children: [
          _reviewItem(
            'Location',
            _value(['location', 'Location']),
            Icons.location_on_rounded,
          ),
          _reviewItem(
            'Disaster',
            _value(['disasterType', 'DisasterType']),
            Icons.public_rounded,
          ),
          _reviewItem(
            'Risk Level',
            risk,
            Icons.warning_rounded,
            valueColor: _riskColor(risk),
          ),
          _reviewItem(
            'Affected Population',
            _value(['affectedPopulation', 'AffectedPopulation']),
            Icons.groups_rounded,
          ),
          _reviewItem(
            'Agent 03 Allocations',
            '${allocations.length}',
            Icons.inventory_2_rounded,
          ),
          _reviewItem(
            'Assessment ID',
            assessmentId,
            Icons.fingerprint_rounded,
            last: true,
          ),
        ],
      ),
    );
  }

  Widget _executionInfo() {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: blue.withOpacity(.06),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: blue.withOpacity(.15)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.lock_rounded, color: blue, size: 19),
          SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'BACKEND-AUTHORITATIVE EXECUTION',
                  style: TextStyle(
                    color: blue,
                    fontSize: 7,
                    fontWeight: FontWeight.w900,
                    letterSpacing: .6,
                  ),
                ),
                SizedBox(height: 5),
                Text(
                  'The final warning, severity, recommended actions and resource summary will be generated by the backend.',
                  style: TextStyle(
                    color: Colors.white60,
                    fontSize: 8,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _runningCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(21),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF075E83), Color(0xFF003B5C)],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Column(
        children: [
          SizedBox(
            width: 29,
            height: 29,
            child: CircularProgressIndicator(strokeWidth: 3, color: blue),
          ),
          SizedBox(height: 13),
          Text(
            'GENERATING EMERGENCY WARNING',
            style: TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w900,
            ),
          ),
          SizedBox(height: 5),
          Text(
            'Agent 04 is processing the verified assessment and coordination data.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white54, fontSize: 8, height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _runButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: _runAgent04,
        icon: const Icon(Icons.crisis_alert_rounded, size: 19),
        label: const Text('RUN AGENT 04 GENERATE WARNING'),
        style: ElevatedButton.styleFrom(
          backgroundColor: blue,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 17),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }

  Widget _completedResult() {
    final title = _resultValue([
      'title',
      'Title',
    ], 'Emergency Warning Generated');

    final severity = _resultValue(['severity', 'Severity'], 'Generated');

    final message = _resultValue([
      'message',
      'Message',
    ], 'No message returned.');

    final actions = _resultValue([
      'recommendedActions',
      'RecommendedActions',
    ], 'No recommended actions returned.');

    final resources = _resultValue([
      'resourceSummary',
      'ResourceSummary',
    ], 'No resource summary returned.');

    final status = _resultValue([
      'alertStatus',
      'AlertStatus',
      'status',
      'Status',
    ], 'Active');

    final alertId = _resultValue(['id', 'Id', 'alertId', 'AlertId'], '-');

    final generatedAt = _resultValue([
      'createdAt',
      'CreatedAt',
      'generatedAt',
      'GeneratedAt',
    ], '-');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _successBanner(severity),

        const SizedBox(height: 14),

        _resultCard(
          'EMERGENCY WARNING',
          title,
          Icons.crisis_alert_rounded,
          blue,
        ),

        _resultCard(
          'SEVERITY',
          severity,
          Icons.warning_rounded,
          _riskColor(severity),
        ),

        _resultCard('WARNING MESSAGE', message, Icons.message_rounded, blue),

        _resultCard(
          'RECOMMENDED ACTIONS',
          actions,
          Icons.checklist_rounded,
          green,
        ),

        _resultCard(
          'RESOURCE SUMMARY',
          resources,
          Icons.inventory_2_rounded,
          purple,
        ),

        _resultCard(
          'ALERT STATUS',
          status,
          Icons.notifications_active_rounded,
          green,
        ),

        _technicalResultCard(alertId, generatedAt),

        const SizedBox(height: 15),

        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _exportFullReport,
            icon: const Icon(Icons.picture_as_pdf_rounded, size: 19),
            label: const Text('EXPORT FULL AGENT 04 REPORT'),
            style: ElevatedButton.styleFrom(
              backgroundColor: blue,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(vertical: 17),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _exportFullReport,
            icon: const Icon(Icons.save_alt_rounded, size: 19),
            label: const Text('SAVE FULL REPORT'),
            style: ElevatedButton.styleFrom(
              backgroundColor: blue,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(vertical: 17),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: _sendEmergencyReport,
            icon: const Icon(Icons.campaign_rounded, size: 19),
            label: const Text('SEND EMERGENCY ALERT + REPORT'),
            style: OutlinedButton.styleFrom(
              foregroundColor: blue,
              side: const BorderSide(color: blue, width: 1.2),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ),
        _completedFooter(),
      ],
    );
  }

  Widget _successBanner(String severity) {
    return Container(
      padding: const EdgeInsets.all(17),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF075E46), Color(0xFF064E3B)],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: green.withOpacity(.2)),
      ),
      child: Row(
        children: [
          Container(
            width: 43,
            height: 43,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_rounded,
              color: Color(0xFF86EFAC),
              size: 25,
            ),
          ),
          const SizedBox(width: 11),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AGENT 04 COMPLETED',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Emergency warning generated successfully by the backend.',
                  style: TextStyle(color: Colors.white70, fontSize: 8),
                ),
              ],
            ),
          ),
          Text(
            severity.toUpperCase(),
            style: const TextStyle(
              color: Color(0xFF86EFAC),
              fontSize: 7,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }

  Widget _resultCard(String title, String value, IconData icon, Color color) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withOpacity(.1)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 37,
            height: 37,
            decoration: BoxDecoration(
              color: color.withOpacity(.09),
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: color,
                    fontSize: 7,
                    fontWeight: FontWeight.w900,
                    letterSpacing: .7,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  value,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    height: 1.55,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _technicalResultCard(String alertId, String generatedAt) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: navy2,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withOpacity(.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'EXECUTION DETAILS',
            style: TextStyle(
              color: blue,
              fontSize: 7,
              fontWeight: FontWeight.w900,
              letterSpacing: .8,
            ),
          ),
          const SizedBox(height: 9),
          _resultDetail('Alert ID', alertId, Icons.fingerprint_rounded),
          _resultDetail(
            'Assessment ID',
            assessmentId,
            Icons.assignment_rounded,
          ),
          _resultDetail('Generated', generatedAt, Icons.schedule_rounded),
          _resultDetail(
            'Engine',
            'Agent 04 Backend',
            Icons.memory_rounded,
            last: true,
          ),
        ],
      ),
    );
  }

  Widget _resultDetail(
    String title,
    String value,
    IconData icon, {
    bool last = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        border: last
            ? null
            : const Border(bottom: BorderSide(color: Colors.white10)),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white38, size: 14),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(color: Colors.white38, fontSize: 8),
          ),
          const Spacer(),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 8,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _exportFullReport() async {
    if (!completed || result is! Map) return;

    try {
      final pdf = pw.Document();

      final disaster = _value(['disasterType', 'DisasterType'], 'Disaster');
      final location = _value(['location', 'Location'], 'Unknown');
      final risk = _value(['riskLevel', 'RiskLevel', 'priority'], 'Pending');
      final affected = _value([
        'affectedPopulation',
        'AffectedPopulation',
      ], '-');
      final riskScore = _value(['riskScore', 'RiskScore'], '-');
      final vulnerability = _value([
        'vulnerabilityScore',
        'VulnerabilityScore',
      ], '-');
      final impact = _value(['impactScore', 'ImpactScore'], '-');
      final severityIndex = _value(['severityIndex', 'SeverityIndex'], '-');
      final priority = _value(['priority', 'Priority'], '-');

      final title = _resultValue([
        'title',
        'Title',
      ], 'Emergency Warning Generated');
      final severity = _resultValue(['severity', 'Severity'], 'Generated');
      final message = _resultValue([
        'message',
        'Message',
      ], 'No message returned.');
      final actions = _resultValue([
        'recommendedActions',
        'RecommendedActions',
      ], 'No recommended actions returned.');
      final resourceSummary = _resultValue([
        'resourceSummary',
        'ResourceSummary',
      ], 'No resource summary returned.');
      final status = _resultValue([
        'alertStatus',
        'AlertStatus',
        'status',
        'Status',
      ], 'Active');
      final alertId = _resultValue(['id', 'Id', 'alertId', 'AlertId'], '-');
      final generatedAt = _resultValue([
        'createdAt',
        'CreatedAt',
        'generatedAt',
        'GeneratedAt',
      ], DateTime.now().toIso8601String());

      pw.MemoryImage? disasterImage;
      try {
        final bytes = await rootBundle.load(_photoFor(disaster));
        disasterImage = pw.MemoryImage(bytes.buffer.asUint8List());
      } catch (_) {}

      final resourceImages = <String, pw.MemoryImage>{};
      for (final item in allocations) {
        if (item is! Map) continue;
        final map = Map<String, dynamic>.from(item);
        final name =
            '${map['resourceName'] ?? map['ResourceName'] ?? 'Resource'}';
        final type = '${map['resourceType'] ?? map['ResourceType'] ?? ''}';

        try {
          final bytes = await rootBundle.load(_resourcePhoto(name, type));
          resourceImages[name] = pw.MemoryImage(bytes.buffer.asUint8List());
        } catch (_) {}
      }

      pw.Widget sectionTitle(String text) {
        return pw.Container(
          margin: const pw.EdgeInsets.only(top: 18, bottom: 9),
          padding: const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 9),
          decoration: pw.BoxDecoration(
            color: PdfColor.fromHex('#075E83'),
            borderRadius: pw.BorderRadius.circular(7),
          ),
          child: pw.Text(
            text,
            style: pw.TextStyle(
              color: PdfColors.white,
              fontSize: 12,
              fontWeight: pw.FontWeight.bold,
            ),
          ),
        );
      }

      pw.Widget infoRow(String label, String value) {
        return pw.Container(
          padding: const pw.EdgeInsets.symmetric(vertical: 6),
          decoration: const pw.BoxDecoration(
            border: pw.Border(
              bottom: pw.BorderSide(color: PdfColors.grey300, width: .5),
            ),
          ),
          child: pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.SizedBox(
                width: 145,
                child: pw.Text(
                  label,
                  style: pw.TextStyle(
                    fontSize: 9,
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColor.fromHex('#075E83'),
                  ),
                ),
              ),
              pw.Expanded(
                child: pw.Text(value, style: const pw.TextStyle(fontSize: 9)),
              ),
            ],
          ),
        );
      }

      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.fromLTRB(34, 36, 34, 38),
          header: (context) {
            return pw.Container(
              margin: const pw.EdgeInsets.only(bottom: 10),
              child: pw.Row(
                children: [
                  pw.Container(
                    width: 30,
                    height: 30,
                    decoration: pw.BoxDecoration(
                      color: PdfColor.fromHex('#03A9F4'),
                      borderRadius: pw.BorderRadius.circular(7),
                    ),
                    child: pw.Center(
                      child: pw.Text(
                        '04',
                        style: pw.TextStyle(
                          color: PdfColors.white,
                          fontSize: 12,
                          fontWeight: pw.FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  pw.SizedBox(width: 9),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'RELIEFNEXUS',
                        style: pw.TextStyle(
                          color: PdfColor.fromHex('#075E83'),
                          fontSize: 10,
                          fontWeight: pw.FontWeight.bold,
                        ),
                      ),
                      pw.Text(
                        'Agent 04 - Emergency Warning & Coordination',
                        style: const pw.TextStyle(
                          fontSize: 8,
                          color: PdfColors.grey700,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
          footer: (context) {
            return pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text(
                  'Backend-authoritative Agent 04 report',
                  style: const pw.TextStyle(
                    fontSize: 7,
                    color: PdfColors.grey600,
                  ),
                ),
                pw.Text(
                  'Page ${context.pageNumber} / ${context.pagesCount}',
                  style: const pw.TextStyle(
                    fontSize: 7,
                    color: PdfColors.grey600,
                  ),
                ),
              ],
            );
          },
          build: (context) => [
            pw.Container(
              padding: const pw.EdgeInsets.all(18),
              decoration: pw.BoxDecoration(
                gradient: pw.LinearGradient(
                  colors: [
                    PdfColor.fromHex('#003B5C'),
                    PdfColor.fromHex('#075E83'),
                  ],
                ),
                borderRadius: pw.BorderRadius.circular(12),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'AGENT 04',
                    style: pw.TextStyle(
                      color: PdfColor.fromHex('#81D4FA'),
                      fontSize: 10,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.SizedBox(height: 5),
                  pw.Text(
                    'Emergency Warning & Coordination Report',
                    style: pw.TextStyle(
                      color: PdfColors.white,
                      fontSize: 20,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.SizedBox(height: 7),
                  pw.Text(
                    '$location  |  $disaster  |  $risk',
                    style: const pw.TextStyle(
                      color: PdfColors.white,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),

            if (disasterImage != null) ...[
              pw.SizedBox(height: 14),
              pw.ClipRRect(
                horizontalRadius: 10,
                verticalRadius: 10,
                child: pw.Image(
                  disasterImage,
                  height: 190,

                  fit: pw.BoxFit.cover,
                ),
              ),
            ],

            sectionTitle('1. ASSESSMENT OVERVIEW'),
            infoRow('Location', location),
            infoRow('Disaster Type', disaster),
            infoRow('Risk Level', risk),
            infoRow('Affected Population', affected),
            infoRow('Risk Score', riskScore),
            infoRow('Vulnerability Score', vulnerability),
            infoRow('Impact Score', impact),
            infoRow('Severity Index', severityIndex),
            infoRow('Priority', priority),
            infoRow('Assessment ID', assessmentId),

            sectionTitle('2. INTELLIGENCE LINEAGE'),
            pw.Container(
              padding: const pw.EdgeInsets.all(12),
              color: PdfColor.fromHex('#EAF8FF'),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'Agent 01 -> Agent 02 -> Agent 03 -> Agent 04',
                    style: pw.TextStyle(
                      fontSize: 11,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColor.fromHex('#075E83'),
                    ),
                  ),
                  pw.SizedBox(height: 5),
                  pw.Text(
                    'Agent 04 uses the verified Agent 02 assessment and the Agent 03 resource coordination data before generating the final warning.',
                    style: const pw.TextStyle(
                      fontSize: 9,
                      color: PdfColors.grey800,
                    ),
                  ),
                ],
              ),
            ),

            sectionTitle('3. AGENT 03 RESOURCE COORDINATION'),

            if (allocations.isEmpty)
              pw.Container(
                padding: const pw.EdgeInsets.all(12),
                child: pw.Text(
                  'No Agent 03 allocation records were available.',
                  style: const pw.TextStyle(fontSize: 9),
                ),
              )
            else
              ...allocations.map((item) {
                if (item is! Map) {
                  return pw.SizedBox();
                }

                final map = Map<String, dynamic>.from(item);
                final name =
                    '${map['resourceName'] ?? map['ResourceName'] ?? 'Resource'}';
                final type =
                    '${map['resourceType'] ?? map['ResourceType'] ?? ''}';
                final itemLocation =
                    '${map['location'] ?? map['Location'] ?? 'Unknown'}';
                final required =
                    '${map['recommendedQuantity'] ?? map['RecommendedQuantity'] ?? map['requiredQuantity'] ?? map['RequiredQuantity'] ?? 0}';
                final available =
                    '${map['availableQuantity'] ?? map['AvailableQuantity'] ?? 0}';
                final allocated =
                    '${map['allocatedQuantity'] ?? map['AllocatedQuantity'] ?? 0}';
                final gap = '${map['gapQuantity'] ?? map['GapQuantity'] ?? 0}';
                final itemStatus =
                    '${map['status'] ?? map['Status'] ?? 'Pending'}';

                return pw.Container(
                  margin: const pw.EdgeInsets.only(bottom: 10),
                  padding: const pw.EdgeInsets.all(10),
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: PdfColor.fromHex('#B7DFF2')),
                    borderRadius: pw.BorderRadius.circular(8),
                  ),
                  child: pw.Row(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      if (resourceImages[name] != null)
                        pw.Container(
                          width: 68,
                          height: 68,
                          margin: const pw.EdgeInsets.only(right: 10),
                          child: pw.ClipRRect(
                            horizontalRadius: 6,
                            verticalRadius: 6,
                            child: pw.Image(
                              resourceImages[name]!,
                              fit: pw.BoxFit.cover,
                            ),
                          ),
                        ),
                      pw.Expanded(
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Text(
                              name,
                              style: pw.TextStyle(
                                fontSize: 11,
                                fontWeight: pw.FontWeight.bold,
                                color: PdfColor.fromHex('#075E83'),
                              ),
                            ),
                            pw.Text(
                              type,
                              style: const pw.TextStyle(
                                fontSize: 8,
                                color: PdfColors.grey600,
                              ),
                            ),
                            pw.SizedBox(height: 6),
                            pw.Wrap(
                              spacing: 12,
                              runSpacing: 5,
                              children: [
                                pw.Text(
                                  'Required: $required',
                                  style: const pw.TextStyle(fontSize: 8),
                                ),
                                pw.Text(
                                  'Available: $available',
                                  style: const pw.TextStyle(fontSize: 8),
                                ),
                                pw.Text(
                                  'Allocated: $allocated',
                                  style: const pw.TextStyle(fontSize: 8),
                                ),
                                pw.Text(
                                  'Gap: $gap',
                                  style: const pw.TextStyle(fontSize: 8),
                                ),
                              ],
                            ),
                            pw.SizedBox(height: 4),
                            pw.Text(
                              'Location: $itemLocation    Status: $itemStatus',
                              style: const pw.TextStyle(fontSize: 8),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),

            sectionTitle('4. AGENT 04 EMERGENCY WARNING'),

            pw.Container(
              padding: const pw.EdgeInsets.all(14),
              decoration: pw.BoxDecoration(
                color: PdfColor.fromHex('#EAF8FF'),
                borderRadius: pw.BorderRadius.circular(9),
                border: pw.Border.all(color: PdfColor.fromHex('#03A9F4')),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    title,
                    style: pw.TextStyle(
                      fontSize: 15,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColor.fromHex('#075E83'),
                    ),
                  ),
                  pw.SizedBox(height: 8),
                  infoRow('Severity', severity),
                  infoRow('Alert Status', status),
                  infoRow('Alert ID', alertId),
                  infoRow('Generated', generatedAt),
                ],
              ),
            ),

            sectionTitle('5. WARNING MESSAGE'),
            pw.Container(
              padding: const pw.EdgeInsets.all(13),
              color: PdfColors.grey100,
              child: pw.Text(
                message,
                style: const pw.TextStyle(fontSize: 10, lineSpacing: 3),
              ),
            ),

            sectionTitle('6. RECOMMENDED ACTIONS'),
            pw.Container(
              padding: const pw.EdgeInsets.all(13),
              color: PdfColors.grey100,
              child: pw.Text(
                actions,
                style: const pw.TextStyle(fontSize: 10, lineSpacing: 3),
              ),
            ),

            sectionTitle('7. RESOURCE SUMMARY'),
            pw.Container(
              padding: const pw.EdgeInsets.all(13),
              color: PdfColors.grey100,
              child: pw.Text(
                resourceSummary,
                style: const pw.TextStyle(fontSize: 10, lineSpacing: 3),
              ),
            ),

            sectionTitle('8. EXECUTION DETAILS'),
            infoRow('Alert ID', alertId),
            infoRow('Assessment ID', assessmentId),
            infoRow('Generated At', generatedAt),
            infoRow('Execution Engine', 'Agent 04 Backend'),
            infoRow(
              'Authority',
              'Backend-authoritative emergency warning generation',
            ),

            pw.SizedBox(height: 18),
            pw.Container(
              padding: const pw.EdgeInsets.all(12),
              decoration: pw.BoxDecoration(
                color: PdfColor.fromHex('#E8F7EF'),
                borderRadius: pw.BorderRadius.circular(8),
              ),
              child: pw.Text(
                'This report was generated from the submitted Agent 02 assessment, Agent 03 coordination records and the persisted Agent 04 backend result.',
                style: pw.TextStyle(
                  fontSize: 8,
                  color: PdfColor.fromHex('#14532D'),
                ),
              ),
            ),
          ],
        ),
      );

      final bytes = await pdf.save();

      final safeLocation = location.replaceAll(RegExp(r'[^A-Za-z0-9]+'), '_');
      final filename = 'Agent04_Emergency_Report_$safeLocation.pdf';

      await Printing.sharePdf(bytes: bytes, filename: filename);
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('PDF export failed: $e'), backgroundColor: red),
      );
    }
  }

  Future<void> _sendEmergencyReport() async {
    if (!completed) return;

    try {
      final pdf = pw.Document();

      final disaster = _value(['disasterType', 'DisasterType'], 'Disaster');
      final location = _value(['location', 'Location'], 'Unknown');
      final risk = _value(['riskLevel', 'RiskLevel', 'priority'], 'Pending');

      final title = _resultValue([
        'title',
        'Title',
      ], 'Emergency Warning Generated');
      final severity = _resultValue(['severity', 'Severity'], 'Generated');
      final message = _resultValue([
        'message',
        'Message',
      ], 'No emergency message returned.');
      final actions = _resultValue([
        'recommendedActions',
        'RecommendedActions',
      ], 'No recommended actions returned.');
      final resourceSummary = _resultValue([
        'resourceSummary',
        'ResourceSummary',
      ], 'No resource summary returned.');
      final status = _resultValue([
        'alertStatus',
        'AlertStatus',
        'status',
        'Status',
      ], 'Active');

      pw.Widget row(String label, String value) {
        return pw.Padding(
          padding: const pw.EdgeInsets.symmetric(vertical: 5),
          child: pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.SizedBox(
                width: 105,
                child: pw.Text(
                  label,
                  style: pw.TextStyle(
                    fontSize: 9,
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColor.fromHex('#075E83'),
                  ),
                ),
              ),
              pw.Expanded(
                child: pw.Text(value, style: const pw.TextStyle(fontSize: 9)),
              ),
            ],
          ),
        );
      }

      pw.Widget heading(String text) {
        return pw.Container(
          width: double.infinity,
          margin: const pw.EdgeInsets.only(top: 12, bottom: 7),
          padding: const pw.EdgeInsets.all(8),
          color: PdfColor.fromHex('#075E83'),
          child: pw.Text(
            text,
            style: pw.TextStyle(
              color: PdfColors.white,
              fontSize: 10,
              fontWeight: pw.FontWeight.bold,
            ),
          ),
        );
      }

      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(32),
          build: (_) => [
            pw.Container(
              width: double.infinity,
              padding: const pw.EdgeInsets.all(15),
              color: PdfColor.fromHex('#003B5C'),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'RELIEFNEXUS - AGENT 04',
                    style: pw.TextStyle(
                      color: PdfColors.white,
                      fontSize: 14,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.SizedBox(height: 5),
                  pw.Text(
                    'Emergency Warning & Coordination',
                    style: const pw.TextStyle(
                      color: PdfColors.white,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
            heading('EMERGENCY WARNING'),
            row('Location', location),
            row('Disaster', disaster),
            row('Risk Level', risk),
            row('Severity', severity),
            row('Status', status),
            heading('WARNING MESSAGE'),
            pw.Container(
              padding: const pw.EdgeInsets.all(11),
              color: PdfColor.fromHex('#EAF8FF'),
              child: pw.Text(
                message,
                style: const pw.TextStyle(fontSize: 10, lineSpacing: 2),
              ),
            ),
            heading('RECOMMENDED ACTIONS'),
            pw.Text(
              actions,
              style: const pw.TextStyle(fontSize: 10, lineSpacing: 2),
            ),
            heading('RESOURCE SUMMARY'),
            pw.Text(
              resourceSummary,
              style: const pw.TextStyle(fontSize: 10, lineSpacing: 2),
            ),
            pw.SizedBox(height: 15),
            pw.Text(
              'Full Agent 04 assessment report is attached with this emergency alert.',
              style: pw.TextStyle(
                fontSize: 9,
                fontWeight: pw.FontWeight.bold,
                color: PdfColor.fromHex('#075E83'),
              ),
            ),
          ],
        ),
      );

      final bytes = await pdf.save();
      final safeLocation = location.replaceAll(RegExp(r'[^A-Za-z0-9]+'), '_');
      final filename = 'Agent04_Emergency_Report_$safeLocation.pdf';

      final shareText =
          '''
RELIEFNEXUS - EMERGENCY WARNING

Location: $location
Disaster: $disaster
Risk Level: $risk
Severity: $severity
Status: $status

WARNING MESSAGE:
$message

RECOMMENDED ACTIONS:
$actions

RESOURCE SUMMARY:
$resourceSummary

A full Agent 04 emergency assessment report is attached.
''';

      await Printing.sharePdf(bytes: bytes, filename: filename);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Emergency report sharing failed: $e'),
          backgroundColor: red,
        ),
      );
    }
  }

  Widget _completedFooter() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: green.withOpacity(.05),
        borderRadius: BorderRadius.circular(17),
        border: Border.all(color: green.withOpacity(.12)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.verified_user_rounded, color: green, size: 19),
          SizedBox(width: 9),
          Expanded(
            child: Text(
              'This result is based on the backend-generated Agent 04 operation for the selected Agent 02 assessment.',
              style: TextStyle(color: Colors.white54, fontSize: 8, height: 1.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _premiumCard({
    required String title,
    required IconData icon,
    required Widget child,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(19),
        border: Border.all(color: Colors.white.withOpacity(.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 31,
                height: 31,
                decoration: BoxDecoration(
                  color: blue.withOpacity(.08),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Icon(icon, color: blue, size: 16),
              ),
              const SizedBox(width: 9),
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  letterSpacing: .7,
                ),
              ),
            ],
          ),
          const SizedBox(height: 13),
          child,
        ],
      ),
    );
  }

  Widget _detailRow(
    String title,
    String value,
    IconData icon, {
    bool last = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 9),
      decoration: BoxDecoration(
        border: last
            ? null
            : const Border(bottom: BorderSide(color: Colors.white10)),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white38, size: 14),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(color: Colors.white38, fontSize: 8),
          ),
          const Spacer(),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 8,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _reviewItem(
    String title,
    String value,
    IconData icon, {
    Color valueColor = Colors.white,
    bool last = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 9),
      decoration: BoxDecoration(
        border: last
            ? null
            : const Border(bottom: BorderSide(color: Colors.white10)),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white38, size: 14),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(color: Colors.white38, fontSize: 8),
          ),
          const Spacer(),
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

  Widget _sectionHeading(String number, String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
              decoration: BoxDecoration(
                color: blue.withOpacity(.08),
                borderRadius: BorderRadius.circular(7),
              ),
              child: Text(
                'STEP $number / 04',
                style: const TextStyle(
                  color: blue,
                  fontSize: 7,
                  fontWeight: FontWeight.w900,
                  letterSpacing: .8,
                ),
              ),
            ),
            const Spacer(),
            const Icon(Icons.verified_rounded, color: green, size: 15),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 23,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: const TextStyle(
            color: Colors.white54,
            fontSize: 9,
            height: 1.45,
          ),
        ),
      ],
    );
  }

  Widget _navigation(String label, VoidCallback onNext) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: _back,
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.white70,
              side: const BorderSide(color: Colors.white12),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(13),
              ),
            ),
            child: const Text(
              'BACK',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          flex: 2,
          child: ElevatedButton(
            onPressed: onNext,
            style: ElevatedButton.styleFrom(
              backgroundColor: blue,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(13),
              ),
            ),
            child: Text(
              label,
              style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900),
            ),
          ),
        ),
      ],
    );
  }

  Widget _nextButton(String label, VoidCallback action) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: action,
        icon: const Icon(Icons.arrow_forward_rounded, size: 16),
        label: Text(
          label,
          style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: blue,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 15),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15),
          ),
        ),
      ),
    );
  }

  Widget _darkPill(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
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

  Widget _severityPill(String risk) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: _riskColor(risk),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Text(
        risk.toUpperCase(),
        style: const TextStyle(
          color: Colors.white,
          fontSize: 7,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }

  Widget _errorCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 13),
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: red.withOpacity(.08),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: red.withOpacity(.18)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error_outline_rounded, color: red, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              error ?? 'Request failed.',
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 8,
                height: 1.45,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
