import 'package:flutter/material.dart';
import 'package:dio/dio.dart';

import '../../../../core/network/api_client.dart';
import '../../data/models/disaster_report_model.dart';

class DisasterReportProcessPage extends StatefulWidget {
  final DisasterReportModel report;

  const DisasterReportProcessPage({
    super.key,
    required this.report,
  });

  @override
  State<DisasterReportProcessPage> createState() =>
      _DisasterReportProcessPageState();
}

class _DisasterReportProcessPageState
    extends State<DisasterReportProcessPage> {
  static const _navy = Color(0xFF06243A);
  static const _blue = Color(0xFF159FE8);
  static const _cyan = Color(0xFF48C8FF);
  static const _bg = Color(0xFFF4FAFD);
  static const _line = Color(0xFFD9EAF3);
  static const _muted = Color(0xFF6B8090);
  static const _green = Color(0xFF16A978);
  static const _orange = Color(0xFFF29B38);
  static const _red = Color(0xFFE95757);

  final ApiClient _client = ApiClient();

  Map<String, dynamic>? _risk;
  Map<String, dynamic>? _vulnerability;
  List<dynamic>? _resource;
  Map<String, dynamic>? _alert;

  bool _loading = true;
  bool _runningAgent02 = false;
  bool _runningAgent03 = false;
  bool _runningAgent04 = false;
  String? _error;

  String get _riskId => widget.report.riskPredictionId?.toString() ?? '';

  String get _incidentType => widget.report.disasterType;

  String get _incidentLocation => widget.report.location;

  String get _incidentSeverity => widget.report.severity;

  String get _reportStatus => widget.report.status;
  String get _reportId => widget.report.id;
  String get _assignedVolunteer =>
      widget.report.assignedVolunteerName?.trim().isNotEmpty == true
          ? widget.report.assignedVolunteerName!
          : 'Not assigned';

  @override
  void initState() {
    super.initState();
    _loadProcess();
  }

  String? _string(dynamic value) {
    if (value == null) return null;
    final text = value.toString().trim();
    return text.isEmpty ? null : text;
  }

  double _number(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  int _int(dynamic value) {
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  Map<String, dynamic> _map(dynamic value) {
    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }
    return <String, dynamic>{};
  }

  List<dynamic> _list(dynamic value) {
    if (value is List) return value;
    if (value is Map && value['items'] is List) {
      return value['items'] as List;
    }
    if (value is Map && value['data'] is List) {
      return value['data'] as List;
    }
    return const [];
  }

  String _photoFor(String type) {
    final v = type.toLowerCase();

    if (v.contains('flood')) return 'assets/images/disasters/flood.jpg';
    if (v.contains('drought')) return 'assets/images/disasters/drought.jpg';
    if (v.contains('landslide')) {
      return 'assets/images/disasters/landslide.jpg';
    }
    if (v.contains('earthquake')) {
      return 'assets/images/disasters/earthquake.jpg';
    }
    if (v.contains('cyclone') || v.contains('storm')) {
      return 'assets/images/disasters/cyclone.jpg';
    }
    if (v.contains('wildfire') || v.contains('fire')) {
      return 'assets/images/disasters/wildfire.jpg';
    }
    if (v.contains('tsunami')) {
      return 'assets/images/disasters/tsunami.jpg';
    }
    if (v.contains('lightning')) {
      return 'assets/images/disasters/lightning.jpg';
    }
    if (v.contains('volcan')) {
      return 'assets/images/disasters/volcanic-eruption.jpg';
    }

    return 'assets/images/disasters/disaster_default.jpg';
  }

  Future<void> _loadProcess() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final riskId = _riskId;

      if (riskId.isEmpty) {
        setState(() {
          _loading = false;
          _error =
              'This disaster report does not have a linked Agent 01 Risk Prediction yet.';
        });
        return;
      }

      final riskResponse =
          await _client.dio.get('/risk-predictions/$riskId');

      _risk = _map(riskResponse.data);

      await _loadLinkedAssessment(riskId);

      if (mounted) {
        setState(() => _loading = false);
      }
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = _dioMessage(e);
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _loadLinkedAssessment(String riskId) async {
    try {
      final response = await _client.dio.get('/vulnerability-impact');
      final rows = _list(response.data);

      Map<String, dynamic>? found;

      for (final row in rows) {
        final item = _map(row);
        final linkedId =
            _string(item['riskPredictionId'] ?? item['RiskPredictionId']);

        if (linkedId == riskId) {
          found = item;
          break;
        }
      }

      if (found == null) {
        return;
      }

      _vulnerability = found;

      final assessmentId =
          _string(found['id'] ?? found['Id']);

      if (assessmentId == null) return;

      try {
        final resourceResponse =
            await _client.dio.get('/resource-optimization/$assessmentId');

        _resource = resourceResponse.data is List ? List<dynamic>.from(resourceResponse.data) : null;
      } catch (_) {
        // Agent 03 may not have been executed yet.
      }

      try {
        final alertResponse =
            await _client.dio.get('/emergency-alerts');

        final alerts = _list(alertResponse.data);

        for (final row in alerts) {
          final item = _map(row);
          final linkedAssessment = _string(
            item['vulnerabilityAssessmentId'] ??
                item['VulnerabilityAssessmentId'],
          );

          if (linkedAssessment == assessmentId) {
            _alert = item;
            break;
          }
        }
      } catch (_) {
        // Agent 04 may not have been executed yet.
      }
    } catch (_) {
      // No Agent 02 assessment yet.
    }
  }

  Future<void> _runAgent02() async {
    final riskId = _riskId;
    if (riskId.isEmpty) return;

    setState(() => _runningAgent02 = true);

    try {
      final response = await _client.dio.post(
        '/vulnerability-impact/$riskId/assess',
      );

      _vulnerability = _map(response.data);

      final assessmentId = _string(
        _vulnerability?['id'] ?? _vulnerability?['Id'],
      );

      if (assessmentId != null) {
        try {
          final resourceResponse = await _client.dio.get(
            '/resource-optimization/$assessmentId',
          );
          _resource = resourceResponse.data is List ? List<dynamic>.from(resourceResponse.data) : null;
        } catch (_) {}
      }

      if (mounted) {
        setState(() {});
        _snack('Agent 02 assessment completed.');
      }
    } on DioException catch (e) {
      if (mounted) _snack(_dioMessage(e));
    } catch (e) {
      if (mounted) _snack(e.toString());
    } finally {
      if (mounted) setState(() => _runningAgent02 = false);
    }
  }

  Future<void> _runAgent03() async {
    final assessmentId =
        _string(_vulnerability?['id'] ?? _vulnerability?['Id']);

    if (assessmentId == null) {
      _snack('Run Agent 02 first.');
      return;
    }

    setState(() => _runningAgent03 = true);

    try {
      final response = await _client.dio.post(
        '/resource-optimization/$assessmentId/optimize',
      );

      _resource = response.data is List ? List<dynamic>.from(response.data) : null;

      if (mounted) {
        setState(() {});
        _snack('Agent 03 resource optimization completed.');
      }
    } on DioException catch (e) {
      if (mounted) _snack(_dioMessage(e));
    } catch (e) {
      if (mounted) _snack(e.toString());
    } finally {
      if (mounted) setState(() => _runningAgent03 = false);
    }
  }

  Future<void> _runAgent04() async {
    final assessmentId =
        _string(_vulnerability?['id'] ?? _vulnerability?['Id']);

    if (assessmentId == null) {
      _snack('Run Agent 02 first.');
      return;
    }

    setState(() => _runningAgent04 = true);

    try {
      final response = await _client.dio.post(
        '/emergency-alerts/assessment/$assessmentId',
      );

      _alert = _map(response.data);

      if (mounted) {
        setState(() {});
        _snack('Agent 04 emergency coordination completed.');
      }
    } on DioException catch (e) {
      if (mounted) _snack(_dioMessage(e));
    } catch (e) {
      if (mounted) _snack(e.toString());
    } finally {
      if (mounted) setState(() => _runningAgent04 = false);
    }
  }

  String _dioMessage(DioException e) {
    final data = e.response?.data;

    if (data is Map) {
      final message = data['message'] ?? data['error'] ?? data['title'];
      if (message != null) return message.toString();
    }

    return e.message ?? 'Request failed.';
  }

  void _snack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final disasterType =
        _string(_risk?['disasterType'] ?? _risk?['DisasterType']) ??
            _incidentType;

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _navy,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Disaster Report Process',
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 17,
          ),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadProcess,
              color: _blue,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 34),
                children: [
                  _hero(disasterType),
                  const SizedBox(height: 12),
                  _reportSummaryCard(disasterType),
                  const SizedBox(height: 16),
                  if (_error != null) _errorCard(),
                  _stepCard(
                    number: '01',
                    title: 'Risk Prediction',
                    subtitle: 'Agent 01 - AI Risk Intelligence',
                    icon: Icons.analytics_rounded,
                    color: _blue,
                    active: _risk != null,
                    child: _riskSection(),
                  ),
                  _connector(),
                  _stepCard(
                    number: '02',
                    title: 'Vulnerability & Impact',
                    subtitle: 'Agent 02 - Population & Impact Assessment',
                    icon: Icons.groups_rounded,
                    color: const Color(0xFF7C67EE),
                    active: _vulnerability != null,
                    child: _vulnerabilitySection(),
                  ),
                  _connector(),
                  _stepCard(
                    number: '03',
                    title: 'Resource Optimization',
                    subtitle: 'Agent 03 - Resource Demand & Allocation',
                    icon: Icons.inventory_2_rounded,
                    color: _orange,
                    active: _resource != null,
                    child: _resourceSection(),
                  ),
                  _connector(),
                  _stepCard(
                    number: '04',
                    title: 'Early Warning',
                    subtitle: 'Agent 04 - Emergency Warning & Coordination',
                    icon: Icons.campaign_rounded,
                    color: _red,
                    active: _alert != null,
                    child: _alertSection(),
                  ),
                  _connector(),
                  _volunteerAssignmentCard(),
                  _connector(),
                  _fieldResponseCard(),
                  _connector(),
                  _resolutionCard(),
                ],
              ),
            ),
    );
  }

  Widget _hero(String disasterType) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(26),
      child: SizedBox(
        height: 220,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.asset(
              _photoFor(disasterType),
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(color: _navy),
            ),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withOpacity(.05),
                    Colors.black.withOpacity(.78),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  const Text(
                    'LIVE INCIDENT WORKFLOW',
                    style: TextStyle(
                      color: _cyan,
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    disasterType,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _incidentLocation,
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
    );
  }

  Widget _reportSummaryCard(String disasterType) {
    final status = _reportStatus.trim().isEmpty ? 'Unknown' : _reportStatus;

    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _line),
        boxShadow: [
          BoxShadow(
            color: _navy.withOpacity(.035),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: _blue.withOpacity(.10),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.description_rounded,
                  color: _blue,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Disaster Report Details',
                  style: TextStyle(
                    color: _navy,
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              _pill(status, _statusColor(status)),
            ],
          ),
          const SizedBox(height: 13),
          _infoRow('Disaster', disasterType),
          _infoRow('Location', _incidentLocation),
          _infoRow('Severity', _incidentSeverity),
          _infoRow('Report ID', _reportId),
          _infoRow('Assigned volunteer', _assignedVolunteer),
        ],
      ),
    );
  }

  Color _statusColor(String status) {
    final value = status.toLowerCase().replaceAll(' ', '');
    if (value == 'resolved' || value == 'completed') {
      return _green;
    }
    if (value == 'rejected' || value == 'cancelled') {
      return _red;
    }
    if (value == 'assigned' ||
        value == 'inprogress' ||
        value == 'fieldupdatesubmitted') {
      return _blue;
    }
    return _orange;
  }

  Widget _errorCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFFFD1D1)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error_outline_rounded, color: _red),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              _error!,
              style: const TextStyle(
                color: _navy,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _stepCard({
    required String number,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required bool active,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: active ? color.withOpacity(.28) : _line),
        boxShadow: [
          BoxShadow(
            color: _navy.withOpacity(.04),
            blurRadius: 16,
            offset: const Offset(0, 7),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: color.withOpacity(.11),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'STEP $number',
                      style: TextStyle(
                        color: color,
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.3,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      title,
                      style: const TextStyle(
                        color: _navy,
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: _muted,
                        fontSize: 9,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                active
                    ? Icons.check_circle_rounded
                    : Icons.radio_button_unchecked_rounded,
                color: active ? _green : _line,
                size: 22,
              ),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  Widget _connector() {
    return Container(
      margin: const EdgeInsets.only(left: 36),
      height: 20,
      width: 2,
      color: _line,
    );
  }

  Widget _riskSection() {
    if (_risk == null) {
      return _notReady(
        'Agent 01 data is not available for this report.',
      );
    }

    final score = _number(_risk!['riskScore'] ?? _risk!['RiskScore']);
    final level =
        _string(_risk!['riskLevel'] ?? _risk!['RiskLevel']) ?? 'N/A';
    final confidence =
        _number(_risk!['confidence'] ?? _risk!['Confidence']);

    final factors = _list(
      _risk!['riskFactors'] ?? _risk!['RiskFactors'],
    );

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _metric(
                'RISK SCORE',
                score.toStringAsFixed(1),
                Icons.speed_rounded,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _metric(
                'LEVEL',
                level,
                Icons.warning_amber_rounded,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _metric(
                'CONFIDENCE',
                '${confidence <= 1 ? (confidence * 100).toStringAsFixed(0) : confidence.toStringAsFixed(0)}%',
                Icons.verified_rounded,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _infoRow(
          'Location',
          _string(_risk!['location'] ?? _risk!['Location']) ??
              _incidentLocation,
        ),
        if (factors.isNotEmpty) ...[
          const SizedBox(height: 10),
          _smallTitle('Risk drivers'),
          const SizedBox(height: 7),
          ...factors.take(4).map(
                (e) => _bullet(_factorText(e)),
              ),
        ],
      ],
    );
  }

  Widget _vulnerabilitySection() {
    if (_vulnerability == null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _notReady(
            'Agent 02 has not produced a vulnerability assessment yet.',
          ),
          const SizedBox(height: 10),
          _actionButton(
            'RUN AGENT 02',
            Icons.play_arrow_rounded,
            _runningAgent02 ? null : _runAgent02,
            const Color(0xFF7C67EE),
          ),
        ],
      );
    }

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _metric(
                'AFFECTED',
                '${_int(_vulnerability!['affectedPopulation'] ?? _vulnerability!['AffectedPopulation'])}',
                Icons.groups_rounded,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _metric(
                'VULNERABILITY',
                _string(
                      _vulnerability!['vulnerabilityLevel'] ??
                          _vulnerability!['VulnerabilityLevel'],
                    ) ??
                    'N/A',
                Icons.shield_rounded,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _metric(
                'IMPACT',
                _string(
                      _vulnerability!['impactLevel'] ??
                          _vulnerability!['ImpactLevel'],
                    ) ??
                    'N/A',
                Icons.bolt_rounded,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _infoRow(
          'Vulnerability score',
          _number(
            _vulnerability!['vulnerabilityScore'] ??
                _vulnerability!['VulnerabilityScore'],
          ).toStringAsFixed(1),
        ),
        _infoRow(
          'Impact score',
          _number(
            _vulnerability!['impactScore'] ??
                _vulnerability!['ImpactScore'],
          ).toStringAsFixed(1),
        ),
        const SizedBox(height: 10),
        _actionButton(
          'RE-RUN AGENT 02',
          Icons.refresh_rounded,
          _runningAgent02 ? null : _runAgent02,
          const Color(0xFF7C67EE),
        ),
      ],
    );
  }

  Widget _resourceSection() {
    if (_resource == null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _notReady(
            'Agent 03 has not produced a resource optimization result yet.',
          ),
          const SizedBox(height: 10),
          _actionButton(
            'RUN AGENT 03',
            Icons.inventory_2_rounded,
            _runningAgent03 ? null : _runAgent03,
            _orange,
          ),
        ],
      );
    }

    final rows = _resource!;
    final resourceStatus = rows.isEmpty ? 'No allocations' : 'Processed';

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _metric(
                'RESOURCES',
                '${rows.length}',
                Icons.inventory_2_rounded,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _metric(
                'STATUS',
                resourceStatus,
                Icons.task_alt_rounded,
              ),
            ),
          ],
        ),
        if (rows.isNotEmpty) ...[
          const SizedBox(height: 12),
          ...rows.take(5).map((row) {
            final item = _map(row);
            final name = _string(
                  item['resourceName'] ?? item['ResourceName'],
                ) ??
                _string(item['resourceType'] ?? item['ResourceType']) ??
                'Resource';

            final required = _int(
              item['recommendedQuantity'] ??
                  item['RecommendedQuantity'] ??
                  item['requiredQuantity'] ??
                  item['RequiredQuantity'],
            );

            final available = _int(
              item['availableQuantity'] ??
                  item['AvailableQuantity'],
            );

            final gap = _int(
              item['gapQuantity'] ?? item['GapQuantity'],
            );

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(11),
              decoration: BoxDecoration(
                color: _bg,
                borderRadius: BorderRadius.circular(13),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.inventory_2_outlined,
                    color: _orange,
                    size: 18,
                  ),
                  const SizedBox(width: 9),
                  Expanded(
                    child: Text(
                      name,
                      style: const TextStyle(
                        color: _navy,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  Text(
                    '$required / $available',
                    style: const TextStyle(
                      color: _navy,
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  if (gap > 0) ...[
                    const SizedBox(width: 7),
                    Text(
                      'Gap $gap',
                      style: const TextStyle(
                        color: _red,
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ],
              ),
            );
          }),
        ],
        const SizedBox(height: 4),
        _actionButton(
          'RUN AGENT 03',
          Icons.refresh_rounded,
          _runningAgent03 ? null : _runAgent03,
          _orange,
        ),
      ],
    );
  }

  Widget _alertSection() {
    if (_alert == null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _notReady(
            'Agent 04 has not generated an emergency warning for this assessment.',
          ),
          const SizedBox(height: 10),
          _actionButton(
            'RUN AGENT 04',
            Icons.campaign_rounded,
            _runningAgent04 ? null : _runAgent04,
            _red,
          ),
        ],
      );
    }

    final title =
        _string(_alert!['title'] ?? _alert!['Title']) ?? 'Emergency Alert';
    final message =
        _string(_alert!['message'] ?? _alert!['Message']) ?? '';
    final severity =
        _string(_alert!['severity'] ?? _alert!['Severity']) ?? 'Active';
    final status =
        _string(_alert!['status'] ?? _alert!['Status']) ?? 'Active';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  color: _navy,
                  fontSize: 15,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            _pill(severity, _red),
          ],
        ),
        const SizedBox(height: 9),
        Text(
          message,
          style: const TextStyle(
            color: _muted,
            fontSize: 10,
            height: 1.45,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 10),
        _infoRow('Alert status', status),
        _actionButton(
          'RE-RUN AGENT 04',
          Icons.refresh_rounded,
          _runningAgent04 ? null : _runAgent04,
          _red,
        ),
      ],
    );
  }

  Widget _volunteerAssignmentCard() {
    final assigned = _assignedVolunteer;
    final status = _reportStatus.trim().toLowerCase();
    final active = widget.report.assignedVolunteerUserId != null ||
        assigned != 'Not assigned' ||
        status == 'assigned' ||
        status == 'inprogress' ||
        status == 'fieldupdatesubmitted' ||
        status == 'resolved';

    return _stepCard(
      number: '05',
      title: 'Volunteer Assignment',
      subtitle: 'Field Volunteer - Operational Assignment',
      icon: Icons.person_add_alt_1_rounded,
      color: const Color(0xFF16A978),
      active: active,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _infoRow('Assigned volunteer', assigned),
          _infoRow('Report status', _reportStatus),
          _infoRow('Report ID', _reportId),
          const SizedBox(height: 4),
          Text(
            active
                ? 'A field volunteer is assigned to this incident.'
                : 'Volunteer assignment is waiting for the operational workflow.',
            style: const TextStyle(
              color: _muted,
              fontSize: 10,
              height: 1.4,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _fieldResponseCard() {
    final status = _reportStatus.toLowerCase();

    final assigned = _assignedVolunteer;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _navy,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: _blue.withOpacity(.16),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: const Icon(
                  Icons.groups_rounded,
                  color: _cyan,
                ),
              ),
              const SizedBox(width: 11),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'STEP 06',
                      style: TextStyle(
                        color: _cyan,
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.3,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Field Response',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.location_on_rounded,
                color: _cyan,
              ),
            ],
          ),
          const SizedBox(height: 15),
          _darkRow('Current status', _reportStatus),
          _darkRow('Assigned volunteer', assigned),
          _darkRow('Report ID', _reportId),
          const SizedBox(height: 9),
          Text(
            status == 'resolved'
                ? 'Incident lifecycle completed.'
                : 'Field response continues through the existing Disaster Reports operational controls.',
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 10,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _resolutionCard() {
    final status = _reportStatus.trim().toLowerCase();
    final resolved = status == 'resolved';

    return _stepCard(
      number: '07',
      title: 'Resolution',
      subtitle: 'Relief Coordinator - Incident Closure',
      icon: Icons.task_alt_rounded,
      color: const Color(0xFF0F8F68),
      active: resolved,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _infoRow('Current status', _reportStatus),
          _infoRow('Incident', _incidentType),
          _infoRow('Location', _incidentLocation),
          const SizedBox(height: 4),
          Text(
            resolved
                ? 'The disaster report has reached the resolution stage.'
                : 'Resolution remains pending until the field response is completed and the incident is closed.',
            style: const TextStyle(
              color: _muted,
              fontSize: 10,
              height: 1.4,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _metric(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: _bg,
        borderRadius: BorderRadius.circular(13),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: _blue, size: 17),
          const SizedBox(height: 7),
          Text(
            label,
            style: const TextStyle(
              color: _muted,
              fontSize: 7,
              fontWeight: FontWeight.w900,
              letterSpacing: .6,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: _navy,
              fontSize: 12,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 7),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: _muted,
                fontSize: 9,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                color: _navy,
                fontSize: 9,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _darkRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white54,
                fontSize: 9,
              ),
            ),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 9,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _pill(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 9,
        vertical: 5,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(.10),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 7,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }

  Widget _notReady(String text) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _bg,
        borderRadius: BorderRadius.circular(13),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: _muted,
          fontSize: 9,
          height: 1.4,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _smallTitle(String text) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          color: _navy,
          fontSize: 8,
          fontWeight: FontWeight.w900,
          letterSpacing: 1,
        ),
      ),
    );
  }

  Widget _bullet(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 4),
            child: Icon(
              Icons.circle,
              size: 5,
              color: _blue,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: _muted,
                fontSize: 9,
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _factorText(dynamic value) {
    if (value is Map) {
      return _string(
            value['factor'] ??
                value['Factor'] ??
                value['name'] ??
                value['Name'] ??
                value['description'] ??
                value['Description'],
          ) ??
          value.toString();
    }
    return value.toString();
  }

  Widget _actionButton(
    String text,
    IconData icon,
    VoidCallback? onPressed,
    Color color,
  ) {
    return SizedBox(
      width: double.infinity,
      height: 46,
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: onPressed == null
            ? const SizedBox(
                width: 15,
                height: 15,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : Icon(icon, size: 17),
        label: Text(
          text,
          style: const TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w900,
            letterSpacing: .8,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      ),
    );
  }
}






