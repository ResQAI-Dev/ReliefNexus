import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../../../core/network/api_client.dart';

class OperationalWorkflowPage extends StatefulWidget {
  final Map<String, dynamic> prediction;

  const OperationalWorkflowPage({
    super.key,
    required this.prediction,
  });

  @override
  State<OperationalWorkflowPage> createState() =>
      _OperationalWorkflowPageState();
}

class _OperationalWorkflowPageState
    extends State<OperationalWorkflowPage> {
  static const sky = Color(0xFF03A9F4);
  static const deepBlue = Color(0xFF0288D1);
  static const navy = Color(0xFF003B5C);
  static const background = Color(0xFFF5FAFD);
  static const line = Color(0xFFD7ECF6);
  static const muted = Color(0xFF607D8B);

  final ApiClient _client = ApiClient();

  int _page = 0;
  bool _loading = true;
  String? _error;

  Map<String, dynamic>? _assessment;
  Map<String, dynamic>? _demand;
  List<dynamic> _allocations = [];
  Map<String, dynamic>? _alert;
  Map<String, dynamic>? _report;

  final List<String> _titles = const [
    'Report Submitted',
    'Risk Prediction',
    'Vulnerability & Impact',
    'Resource Optimization',
    'Early Warning',
    'Volunteer Assignment',
    'Field Response',
    'Resolution',
  ];

  final List<String> _shortTitles = const [
    'Report',
    'Agent 01',
    'Agent 02',
    'Agent 03',
    'Agent 04',
    'Volunteer',
    'Field',
    'Resolution',
  ];

  String _text(dynamic value, [String fallback = 'N/A']) {
    final v = value?.toString().trim() ?? '';
    return v.isEmpty || v == 'null' ? fallback : v;
  }

  double _number(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse('$value') ?? 0;
  }

  String _score(dynamic value) {
    final n = _number(value);
    return n == 0 && value == null
        ? 'N/A'
        : n % 1 == 0
            ? n.toInt().toString()
            : n.toStringAsFixed(1);
  }

  String _disaster() =>
      _text(widget.prediction['disasterType'], 'Disaster');

  String _location() =>
      _text(widget.prediction['location'], 'Unknown location');

  String _riskLevel() =>
      _text(widget.prediction['riskLevel'], 'Unknown');

  String _photo(String disaster) {
    final d = disaster.toLowerCase();

    if (d.contains('drought')) {
      return 'assets/images/disasters/drought.jpg';
    }
    if (d.contains('flood')) {
      return 'assets/images/disasters/flood.jpg';
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
    if (d.contains('volcan')) {
      return 'assets/images/disasters/volcanic-eruption.jpg';
    }

    return 'assets/images/disasters/disaster_default.jpg';
  }

  @override
  void initState() {
    super.initState();
    _loadWorkflowData();
  }

  Future<void> _loadWorkflowData() async {
    try {
      final predictionId =
          _text(widget.prediction['id'], '');

      if (predictionId.isEmpty) {
        throw Exception('Risk prediction ID is missing.');
      }

      final assessmentResponse = await _client.dio.get(
        '/vulnerability-impact',
      );

      final assessments = _asList(assessmentResponse.data);

      Map<String, dynamic>? assessment;

      for (final item in assessments) {
        final map = Map<String, dynamic>.from(item);
        final riskId = _text(
          map['riskPredictionId'] ?? map['RiskPredictionId'],
          '',
        );

        if (riskId == predictionId) {
          assessment = map;
          break;
        }
      }

      if (assessment != null) {
        _assessment = assessment;

        final assessmentId = _text(
          assessment['id'] ?? assessment['Id'],
          '',
        );

        if (assessmentId.isNotEmpty) {
          try {
            final demandResponse = await _client.dio.get(
              '/resource-optimization/$assessmentId/demand',
            );

            if (demandResponse.data is Map) {
              _demand =
                  Map<String, dynamic>.from(demandResponse.data);
            }
          } catch (_) {}

          try {
            final allocationResponse = await _client.dio.get(
              '/resource-optimization/$assessmentId',
            );

            _allocations = _asList(allocationResponse.data);
          } catch (_) {}

          try {
            final alertResponse = await _client.dio.get(
              '/emergency-alerts/assessment/$assessmentId',
            );

            if (alertResponse.data is Map) {
              _alert =
                  Map<String, dynamic>.from(alertResponse.data);
            }
          } catch (_) {}
        }
      }

      try {
        final reportsResponse = await _client.dio.get(
          '/disaster-reports',
        );

        final reports = _asList(reportsResponse.data);

        for (final item in reports) {
          final report = Map<String, dynamic>.from(item);

          final linkedPrediction = _text(
            report['riskPredictionId'] ??
                report['RiskPredictionId'],
            '',
          );

          if (linkedPrediction == predictionId) {
            _report = report;
            break;
          }
        }
      } catch (_) {}

      if (!mounted) return;

      setState(() {
        _loading = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  List<dynamic> _asList(dynamic data) {
    if (data is List) return data;

    if (data is Map) {
      final value =
          data['items'] ??
          data['data'] ??
          data['results'] ??
          data['allocations'] ??
          data['assessments'];

      if (value is List) return value;

      if (value is Map) return [value];
    }

    return [];
  }

  Color _riskColor(String level) {
    switch (level.toLowerCase()) {
      case 'critical':
        return const Color(0xFFD92D4F);
      case 'high':
        return const Color(0xFFE67E22);
      case 'medium':
        return const Color(0xFFF59E0B);
      case 'low':
        return const Color(0xFF16A673);
      default:
        return deepBlue;
    }
  }

  void _next() {
    if (_page < 7) {
      setState(() => _page++);
    }
  }

  void _back() {
    if (_page > 0) {
      setState(() => _page--);
    } else {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: navy,
        elevation: 0,
        titleSpacing: 18,
        title: Text(
          '${(_page + 1).toString().padLeft(2, '0')} / 08  ${_shortTitles[_page]}',
          style: const TextStyle(
            color: navy,
            fontSize: 14,
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: sky),
            )
          : _error != null
              ? _errorView()
              : Column(
                  children: [
                    _progress(),
                    Expanded(
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 220),
                        child: KeyedSubtree(
                          key: ValueKey(_page),
                          child: _pageBody(),
                        ),
                      ),
                    ),
                    _bottomAction(),
                  ],
                ),
    );
  }

  Widget _progress() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
      color: Colors.white,
      child: Row(
        children: List.generate(
          8,
          (index) => Expanded(
            child: Container(
              height: 4,
              margin: EdgeInsets.only(
                right: index == 7 ? 0 : 4,
              ),
              decoration: BoxDecoration(
                color: index <= _page ? sky : line,
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _pageBody() {
    switch (_page) {
      case 0:
        return _reportPage();
      case 1:
        return _agent01Page();
      case 2:
        return _agent02Page();
      case 3:
        return _agent03Page();
      case 4:
        return _agent04Page();
      case 5:
        return _volunteerPage();
      case 6:
        return _fieldPage();
      default:
        return _resolutionPage();
    }
  }

  Widget _scroll(List<Widget> children) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
      children: children,
    );
  }

  Widget _hero({
    required String step,
    required String title,
    required String subtitle,
  }) {
    return Container(
      height: 190,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset(
            _photo(_disaster()),
            fit: BoxFit.cover,
          ),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0x22001A2B),
                  Color(0xDD003B5C),
                ],
              ),
            ),
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 16,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  step,
                  style: const TextStyle(
                    color: Color(0xFFB9E8FF),
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.4,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _reportPage() {
    return _scroll([
      _hero(
        step: '01  INCIDENT INTAKE',
        title: _disaster(),
        subtitle: _location(),
      ),
      const SizedBox(height: 14),
      _summaryCard(
        title: 'INCIDENT SUMMARY',
        icon: Icons.report_problem_outlined,
        children: [
          _row('Disaster', _disaster()),
          _row('Location', _location()),
          _row(
            'Status',
            _text(
              _report?['status'],
              'Linked to Risk Prediction',
            ),
          ),
          _row(
            'Submitted',
            _text(_report?['createdAt'], 'N/A'),
          ),
        ],
      ),
      if (_report?['description'] != null)
        _summaryCard(
          title: 'DESCRIPTION',
          icon: Icons.notes_rounded,
          children: [
            Text(
              _text(_report?['description']),
              style: const TextStyle(
                color: muted,
                fontSize: 12,
                height: 1.4,
              ),
            ),
          ],
        ),
    ]);
  }

  Widget _agent01Page() {
    final level = _riskLevel();

    return _scroll([
      _hero(
        step: '02  AGENT 01',
        title: 'Risk Prediction',
        subtitle: '${_disaster()}    ${_location()}',
      ),
      const SizedBox(height: 14),
      Row(
        children: [
          Expanded(
            child: _metric(
              'RISK SCORE',
              '${_score(widget.prediction['riskScore'])}%',
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _metric(
              'LEVEL',
              level.toUpperCase(),
              color: _riskColor(level),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _metric(
              'CONFIDENCE',
              '${_score(widget.prediction['confidence'])}%',
            ),
          ),
        ],
      ),
      _summaryCard(
        title: 'AI SUMMARY',
        icon: Icons.auto_graph_rounded,
        children: [
          _row(
            'Model',
            _text(
              widget.prediction['modelVersion'],
              'AI Risk Prediction',
            ),
          ),
          _row(
            'Source',
            _text(
              widget.prediction['predictionSource'],
              'Backend Agent 01',
            ),
          ),
          _row(
            'Status',
            _text(
              widget.prediction['approvalStatus'],
              'Pending',
            ),
          ),
        ],
      ),
      _summaryCard(
        title: 'KEY RISK FACTORS',
        icon: Icons.warning_amber_rounded,
        children: [
          _bullet('Primary disaster risk: ${_disaster()}'),
          _bullet('Risk level: ${level.toUpperCase()}'),
          _bullet(
            'Prediction score: ${_score(widget.prediction['riskScore'])}%',
          ),
        ],
      ),
    ]);
  }

  Widget _agent02Page() {
    final a = _assessment;

    return _scroll([
      _hero(
        step: '03  AGENT 02',
        title: 'Vulnerability & Impact',
        subtitle: _location(),
      ),
      const SizedBox(height: 14),
      Row(
        children: [
          Expanded(
            child: _metric(
              'AFFECTED',
              _score(a?['affectedPopulation']),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _metric(
              'VULNERABILITY',
              _score(a?['vulnerabilityScore']),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _metric(
              'IMPACT',
              _score(a?['impactScore']),
            ),
          ),
        ],
      ),
      _summaryCard(
        title: 'ASSESSMENT SUMMARY',
        icon: Icons.groups_rounded,
        children: [
          _row(
            'Vulnerability',
            _text(a?['vulnerabilityLevel']),
          ),
          _row(
            'Impact',
            _text(a?['impactLevel']),
          ),
          _row(
            'Priority',
            _text(a?['riskLevel']),
          ),
          _row(
            'Status',
            a == null ? 'Not assessed' : 'Assessment available',
          ),
        ],
      ),
      if (a == null)
        _infoCard(
          'Agent 02 assessment is not yet linked to this Agent 01 prediction.',
        )
      else
        _summaryCard(
          title: 'KEY FINDINGS',
          icon: Icons.analytics_rounded,
          children: [
            _bullet(
              _text(
                a['mainVulnerabilities'],
                'No vulnerability summary returned.',
              ),
            ),
            _bullet(
              _text(
                a['recommendedActions'],
                'No recommended action returned.',
              ),
            ),
          ],
        ),
    ]);
  }

  Widget _agent03Page() {
    final d = _demand;

    return _scroll([
      _hero(
        step: '04  AGENT 03',
        title: 'Resource Optimization',
        subtitle: _location(),
      ),
      const SizedBox(height: 14),
      Row(
        children: [
          Expanded(
            child: _metric(
              'POPULATION',
              _score(
                d?['affectedPopulation'] ??
                    _assessment?['affectedPopulation'],
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _metric(
              'PRIORITY',
              _text(
                d?['priority'] ??
                    _assessment?['riskLevel'],
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _metric(
              'ALLOCATIONS',
              '${_allocations.length}',
            ),
          ),
        ],
      ),
      _summaryCard(
        title: 'RESOURCE SUMMARY',
        icon: Icons.inventory_2_outlined,
        children: [
          _row(
            'Required',
            _text(
              d?['totalRequired'] ??
                  d?['requiredQuantity'],
              'See allocation plan',
            ),
          ),
          _row(
            'Available',
            _text(
              d?['totalAvailable'] ??
                  d?['availableQuantity'],
              'See allocation plan',
            ),
          ),
          _row(
            'Gap',
            _text(
              d?['totalGap'] ??
                  d?['gapQuantity'],
              'See allocation plan',
            ),
          ),
        ],
      ),
      _infoCard(
        _allocations.isEmpty
            ? 'No allocation records are currently available.'
            : '${_allocations.length} live allocation record(s) returned by Agent 03.',
      ),
    ]);
  }

  Widget _agent04Page() {
    final alert = _alert;

    return _scroll([
      _hero(
        step: '05  AGENT 04',
        title: 'Early Warning',
        subtitle: _location(),
      ),
      const SizedBox(height: 14),
      _summaryCard(
        title: 'WARNING SUMMARY',
        icon: Icons.crisis_alert_rounded,
        children: [
          _row(
            'Severity',
            _text(alert?['severity'], _riskLevel()),
          ),
          _row(
            'Title',
            _text(
              alert?['title'] ??
                  alert?['warningTitle'],
              'Warning pending',
            ),
          ),
          _row(
            'Status',
            _text(alert?['status'], 'Not generated'),
          ),
        ],
      ),
      _summaryCard(
        title: 'MESSAGE',
        icon: Icons.message_outlined,
        children: [
          Text(
            _text(
              alert?['message'] ??
                  alert?['warningMessage'],
              'No warning message is currently available.',
            ),
            style: const TextStyle(
              color: muted,
              fontSize: 12,
              height: 1.4,
            ),
          ),
        ],
      ),
    ]);
  }

  Widget _volunteerPage() {
    return _scroll([
      _hero(
        step: '06  FIELD OPERATIONS',
        title: 'Volunteer Assignment',
        subtitle: _location(),
      ),
      const SizedBox(height: 14),
      _summaryCard(
        title: 'ASSIGNMENT SUMMARY',
        icon: Icons.person_pin_circle_outlined,
        children: [
          _row(
            'Volunteer',
            _text(
              _report?['assignedVolunteerName'],
              'Not assigned',
            ),
          ),
          _row(
            'Status',
            _text(
              _report?['status'],
              'Waiting for assignment',
            ),
          ),
          _row(
            'Location',
            _location(),
          ),
        ],
      ),
      _infoCard(
        'Volunteer assignment is controlled by the verified incident workflow.',
      ),
    ]);
  }

  Widget _fieldPage() {
    return _scroll([
      _hero(
        step: '07  FIELD OPERATIONS',
        title: 'Field Response',
        subtitle: _location(),
      ),
      const SizedBox(height: 14),
      _summaryCard(
        title: 'FIELD SUMMARY',
        icon: Icons.location_searching_rounded,
        children: [
          _row(
            'Volunteer',
            _text(
              _report?['assignedVolunteerName'],
              'Not assigned',
            ),
          ),
          _row(
            'Status',
            _text(_report?['status'], 'Pending'),
          ),
          _row(
            'Situation',
            _text(
              _report?['fieldSituation'],
              'No field situation submitted.',
            ),
          ),
          _row(
            'Latest update',
            _text(
              _report?['fieldUpdateNotes'],
              'No field update submitted.',
            ),
          ),
        ],
      ),
    ]);
  }

  Widget _resolutionPage() {
    return _scroll([
      _hero(
        step: '08  CASE CLOSURE',
        title: 'Resolution',
        subtitle: _location(),
      ),
      const SizedBox(height: 14),
      _summaryCard(
        title: 'FINAL CASE SUMMARY',
        icon: Icons.task_alt_rounded,
        children: [
          _row('Disaster', _disaster()),
          _row('Location', _location()),
          _row(
            'Risk',
            '${_score(widget.prediction['riskScore'])}%  ${_riskLevel()}',
          ),
          _row(
            'Volunteer',
            _text(
              _report?['assignedVolunteerName'],
              'Not assigned',
            ),
          ),
          _row(
            'Final status',
            _text(_report?['status'], 'Open'),
          ),
        ],
      ),
      _infoCard(
        'The case can be resolved after the field response has been completed.',
      ),
    ]);
  }

  Widget _bottomAction() {
    final last = _page == 7;

    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(
            top: BorderSide(color: line),
          ),
        ),
        child: Row(
          children: [
            if (_page > 0)
              OutlinedButton(
                onPressed: _back,
                style: OutlinedButton.styleFrom(
                  foregroundColor: deepBlue,
                  side: const BorderSide(color: line),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: const Text('BACK'),
              ),
            if (_page > 0) const SizedBox(width: 10),
            Expanded(
              child: FilledButton.icon(
                onPressed: last ? () => Navigator.pop(context) : _next,
                style: FilledButton.styleFrom(
                  backgroundColor: sky,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(48),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                icon: Icon(
                  last
                      ? Icons.check_circle_outline
                      : Icons.arrow_forward_rounded,
                ),
                label: Text(
                  last ? 'FINISH' : 'NEXT    ${_shortTitles[_page + 1]}',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _metric(
    String label,
    String value, {
    Color color = navy,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: muted,
              fontSize: 7,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }

  Widget _summaryCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: line),
        boxShadow: const [
          BoxShadow(
            color: Color(0x10003B5C),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: sky, size: 18),
              const SizedBox(width: 7),
              Text(
                title,
                style: const TextStyle(
                  color: navy,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: .5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 11),
          ...children,
        ],
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 92,
            child: Text(
              label,
              style: const TextStyle(
                color: muted,
                fontSize: 10,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: navy,
                fontSize: 10,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _bullet(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 7),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 4),
            child: Icon(
              Icons.circle,
              size: 6,
              color: sky,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: muted,
                fontSize: 11,
                height: 1.35,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoCard(String text) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFEAF7FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFB9E8FF)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.info_outline_rounded,
            color: deepBlue,
            size: 18,
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: navy,
                fontSize: 11,
                height: 1.35,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _errorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: _infoCard(
          'Workflow data could not be loaded. Please refresh and try again.',
        ),
      ),
    );
  }
}

