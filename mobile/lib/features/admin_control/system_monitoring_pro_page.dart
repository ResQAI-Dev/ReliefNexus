import 'package:flutter/material.dart';
import 'package:reliefnexus_mobile/core/network/api_client.dart';

class SystemMonitoringProPage extends StatefulWidget {
  const SystemMonitoringProPage({super.key});

  @override
  State<SystemMonitoringProPage> createState() =>
      _SystemMonitoringProPageState();
}

class _SystemMonitoringProPageState extends State<SystemMonitoringProPage> {
  final ApiClient _client = ApiClient();

  bool _loading = true;
  String? _error;
  Map<String, dynamic> _health = {};
  List<Map<String, dynamic>> _executions = [];

  static const _navy = Color(0xFF06152F);
  static const _blue = Color(0xFF0284C7);
  static const _cyan = Color(0xFF14B8A6);
  static const _bg = Color(0xFFF1F6FB);
  static const _muted = Color(0xFF64748B);
  static const _border = Color(0xFFE2E8F0);

  static const _agents = [
    ('Risk Prediction Agent', Icons.analytics_rounded),
    ('Vulnerability & Impact Assessment', Icons.health_and_safety_rounded),
    ('Resource Demand & Optimization', Icons.inventory_2_rounded),
    ('Early Warning & Coordination', Icons.campaign_rounded),
    ('Volunteer Assignment', Icons.groups_rounded),
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        _client.dio.get('/auth/system-health'),
        _client.dio.get('/risk-predictions/agent-executions'),
      ]);

      if (!mounted) return;

      setState(() {
        _health = _asMap(results[0].data);
        _executions = _asList(results[1].data);
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Unable to load system monitoring data.';
      });
    }
  }

  Map<String, dynamic> _asMap(dynamic value) {
    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }
    return {};
  }

  List<Map<String, dynamic>> _asList(dynamic value) {
    dynamic source = value;

    if (value is Map) {
      for (final key in ['data', 'items', 'results', 'records']) {
        if (value[key] is List) {
          source = value[key];
          break;
        }
      }
    }

    if (source is! List) return [];

    return source
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  double _number(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  String _text(dynamic value, [String fallback = 'â€”']) {
    final text = value?.toString().trim() ?? '';
    return text.isEmpty ? fallback : text;
  }

  double _percent(dynamic value) {
    final number = _number(value);
    if (number < 0) return 0;
    if (number > 100) return 100;
    return number;
  }

  String _pretty(String value) {
    final spaced = value
        .replaceAllMapped(RegExp(r'([a-z])([A-Z])'), (m) => '${m[1]} ${m[2]}')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ');
    return spaced
        .split(' ')
        .where((e) => e.isNotEmpty)
        .map((e) => '${e[0].toUpperCase()}${e.substring(1)}')
        .join(' ');
  }

  Color _statusColor(String status) {
    final value = status.toLowerCase();
    if (value.contains('fail') ||
        value.contains('reject') ||
        value.contains('error')) {
      return const Color(0xFFDC2626);
    }
    if (value.contains('pending') ||
        value.contains('revision') ||
        value.contains('warning') ||
        value.contains('start')) {
      return const Color(0xFFD97706);
    }
    if (value.contains('complete') ||
        value.contains('approve') ||
        value.contains('success')) {
      return const Color(0xFF16A34A);
    }
    if (value.contains('running')) return _blue;
    return _muted;
  }

  String _healthLabel(double value) {
    if (value >= 90) return 'Healthy';
    if (value >= 70) return 'Good';
    if (value >= 50) return 'Warning';
    return 'Critical';
  }

  Color _healthColor(double value) {
    if (value >= 90) return const Color(0xFF16A34A);
    if (value >= 70) return _blue;
    if (value >= 50) return const Color(0xFFD97706);
    return const Color(0xFFDC2626);
  }

  Map<String, dynamic>? _latestFor(String agentName) {
    final matches = _executions
        .where(
          (item) =>
              _text(item['agentName'], '').toLowerCase() ==
              agentName.toLowerCase(),
        )
        .toList();

    if (matches.isEmpty) return null;

    matches.sort((a, b) {
      final aa =
          DateTime.tryParse(_text(a['startedAt'], '')) ??
          DateTime.fromMillisecondsSinceEpoch(0);
      final bb =
          DateTime.tryParse(_text(b['startedAt'], '')) ??
          DateTime.fromMillisecondsSinceEpoch(0);
      return bb.compareTo(aa);
    });

    return matches.first;
  }

  int _countStatus(String value) {
    return _executions
        .where(
          (item) =>
              _text(item['status'], '').toLowerCase() == value.toLowerCase(),
        )
        .length;
  }

  int get _pendingApprovals {
    return _executions.where((item) {
      final approval = _text(item['approvalStatus'], '').toLowerCase();
      return approval == 'pending' || approval == 'needsrevision';
    }).length;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _navy,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'System Monitoring',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _load,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? _ErrorView(message: _error!, onRetry: _load)
          : RefreshIndicator(
              onRefresh: _load,
              color: _blue,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
                children: [
                  _buildHero(),
                  const SizedBox(height: 14),
                  _buildHealthOverview(),
                  const SizedBox(height: 22),
                  _sectionLabel('AI AGENT MONITORING'),
                  const SizedBox(height: 5),
                  const Text(
                    'AI Agent Execution Center',
                    style: TextStyle(
                      color: _navy,
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildExecutionSummary(),
                  const SizedBox(height: 18),
                  _buildAgentRegistry(),
                  const SizedBox(height: 22),
                  _sectionLabel('WORKFLOW'),
                  const SizedBox(height: 5),
                  const Text(
                    'Full Disaster Response Workflow',
                    style: TextStyle(
                      color: _navy,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildWorkflow(),
                  const SizedBox(height: 22),
                  _sectionLabel('LATEST EXECUTIONS'),
                  const SizedBox(height: 5),
                  const Text(
                    'Latest Agent Executions',
                    style: TextStyle(
                      color: _navy,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (_executions.isEmpty)
                    _emptyCard()
                  else
                    ..._executions.take(8).map(_buildExecutionCard),
                  const SizedBox(height: 18),
                  _buildSystemInformation(),
                ],
              ),
            ),
    );
  }

  Widget _buildHero() {
    final overall = _percent(_health['overallHealth']);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [_navy, Color(0xFF0B315C), _cyan],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: _navy.withOpacity(.12),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'SYSTEM INTELLIGENCE',
                  style: TextStyle(
                    color: Color(0xFF7DD3FC),
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: 7),
                const Text(
                  'Live System Health',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 23,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Platform status, infrastructure and agentic AI execution monitoring.',
                  style: TextStyle(
                    color: Colors.white.withOpacity(.78),
                    fontSize: 12,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            width: 62,
            height: 62,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(.14),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.white.withOpacity(.18)),
            ),
            child: const Icon(
              Icons.monitor_heart_rounded,
              color: Colors.white,
              size: 30,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHealthOverview() {
    final overall = _percent(_health['overallHealth']);
    final api = _percent(_health['apiAvailability']);
    final database = _percent(_health['databaseHealth']);
    final ai = _percent(_health['aiServices']);
    final storage = _percent(_health['storage']);
    final response = _percent(_health['apiResponseHealth']);
    final cpu = _percent(_health['cpuUtilization']);
    final memory = _percent(_health['memoryUtilization']);
    final disk = _percent(_health['diskUtilization']);

    return Column(
      children: [
        _card(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: _healthColor(overall).withOpacity(.10),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  overall >= 70
                      ? Icons.check_circle_rounded
                      : Icons.warning_rounded,
                  color: _healthColor(overall),
                  size: 22,
                ),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'All Systems Operational',
                      style: TextStyle(
                        color: _blue,
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Overall health ${overall.toStringAsFixed(0)}% • ${_healthLabel(overall)}',
                      style: const TextStyle(color: _muted, fontSize: 9.5),
                    ),
                  ],
                ),
              ),
              Text(
                '${overall.toStringAsFixed(0)}%',
                style: TextStyle(
                  color: _healthColor(overall),
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        _smallHeading('SYSTEM SERVICES'),
        const SizedBox(height: 8),

        Row(
          children: [
            Expanded(
              child: _compactMetric(
                'API Availability',
                api,
                Icons.cloud_done_rounded,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _compactMetric(
                'Database Health',
                database,
                Icons.storage_rounded,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),

        Row(
          children: [
            Expanded(
              child: _compactMetric(
                'AI Services',
                ai,
                Icons.auto_awesome_rounded,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _compactMetric(
                'API Response',
                response,
                Icons.speed_rounded,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),

        Row(
          children: [
            Expanded(
              child: _compactMetric('Storage', storage, Icons.folder_rounded),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _compactMetric('Disk', disk, Icons.sd_storage_rounded),
            ),
          ],
        ),

        const SizedBox(height: 12),

        _card(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _smallHeading('RESOURCE UTILIZATION'),
              const SizedBox(height: 11),
              _progressRow('CPU Utilization', cpu, Icons.memory_rounded),
              _divider(),
              _progressRow(
                'Memory Utilization',
                memory,
                Icons.developer_board_rounded,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _compactMetric(String title, double value, IconData icon) {
    final color = _healthColor(value);

    return _card(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: color.withOpacity(.10),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(icon, color: color, size: 17),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: _muted,
                    fontSize: 8.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${value.toStringAsFixed(0)}%',
                  style: TextStyle(
                    color: color,
                    fontSize: 14,
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

  Widget _metricCard(
    String title,
    double value,
    IconData icon, {
    bool wide = false,
  }) {
    final color = _healthColor(value);

    return _card(
      padding: const EdgeInsets.all(15),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withOpacity(.10),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: wide ? 1 : 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: _muted,
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${value.toStringAsFixed(1)}%',
                  style: TextStyle(
                    color: color,
                    fontSize: 17,
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

  Widget _buildExecutionSummary() {
    final running = _countStatus('Running');
    final completed = _countStatus('Completed');
    final failed = _countStatus('Failed');

    return Row(
      children: [
        Expanded(
          child: _countCard(
            'Total',
            _executions.length,
            Icons.list_alt_rounded,
            _blue,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _countCard('Running', running, Icons.sync_rounded, _cyan),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _countCard(
            'Pending',
            _pendingApprovals,
            Icons.pending_actions_rounded,
            const Color(0xFFD97706),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _countCard(
            'Done',
            completed,
            Icons.check_circle_rounded,
            const Color(0xFF16A34A),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _countCard(
            'Failed',
            failed,
            Icons.error_rounded,
            const Color(0xFFDC2626),
          ),
        ),
      ],
    );
  }

  Widget _countCard(String label, int value, IconData icon, Color color) {
    return _card(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      child: Column(
        children: [
          Icon(icon, color: color, size: 19),
          const SizedBox(height: 7),
          Text(
            '$value',
            style: const TextStyle(
              color: _navy,
              fontSize: 17,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              color: _muted,
              fontSize: 9,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAgentRegistry() {
    return _card(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Agent Registry',
                  style: TextStyle(
                    color: _navy,
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              _pill('${_agents.length} agents', _blue),
            ],
          ),
          const SizedBox(height: 12),
          ...List.generate(_agents.length, (index) {
            final agent = _agents[index];
            final execution = _latestFor(agent.$1);
            final status = execution == null
                ? 'No recent execution'
                : _text(execution['status'], 'Unknown');
            final color = execution == null ? _muted : _statusColor(status);

            return Padding(
              padding: EdgeInsets.only(
                bottom: index == _agents.length - 1 ? 0 : 8,
              ),
              child: Container(
                padding: const EdgeInsets.all(11),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: _border),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: _blue.withOpacity(.09),
                        borderRadius: BorderRadius.circular(11),
                      ),
                      child: Icon(agent.$2, color: _blue, size: 19),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            agent.$1,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: _navy,
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            execution == null
                                ? 'No execution record returned'
                                : 'Current step: ${_text(execution['currentStep'])}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: _muted,
                              fontSize: 9.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 7),
                    _statusPill(status, color),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildWorkflow() {
    final stages = [
      (
        'Disaster Report',
        'Incident received and registered',
        Icons.report_problem_rounded,
        null,
      ),
      (
        'Risk Prediction',
        'Risk level and probability analysis',
        Icons.analytics_rounded,
        'Risk Prediction Agent',
      ),
      (
        'Vulnerability & Impact',
        'Population and impact assessment',
        Icons.health_and_safety_rounded,
        'Vulnerability & Impact Assessment',
      ),
      (
        'Resource Optimization',
        'Resource demand and allocation planning',
        Icons.inventory_2_rounded,
        'Resource Demand & Optimization',
      ),
      (
        'Early Warning & Coordination',
        'Alert and response coordination',
        Icons.campaign_rounded,
        'Early Warning & Coordination',
      ),
      (
        'Volunteer Assignment',
        'Volunteer matching and assignment',
        Icons.groups_rounded,
        'Volunteer Assignment',
      ),
      (
        'Field Response',
        'Operational response execution',
        Icons.support_agent_rounded,
        null,
      ),
      (
        'Resolution',
        'Incident closure and outcome',
        Icons.check_circle_rounded,
        null,
      ),
    ];

    return _card(
      padding: const EdgeInsets.fromLTRB(14, 16, 14, 8),
      child: Column(
        children: List.generate(stages.length, (index) {
          final stage = stages[index];
          final agentName = stage.$4;

          Map<String, dynamic>? execution;
          if (agentName != null) {
            execution = _latestFor(agentName);
          }

          final status = agentName == null
              ? 'Workflow Stage'
              : execution == null
              ? 'Waiting'
              : _text(execution['status'], 'Unknown');

          final color = agentName == null
              ? _blue
              : execution == null
              ? const Color(0xFF94A3B8)
              : _statusColor(status);

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 36,
                child: Column(
                  children: [
                    Container(
                      width: 31,
                      height: 31,
                      decoration: BoxDecoration(
                        color: color.withOpacity(.10),
                        shape: BoxShape.circle,
                        border: Border.all(color: color.withOpacity(.30)),
                      ),
                      child: Icon(stage.$3, color: color, size: 16),
                    ),
                    if (index < stages.length - 1)
                      Container(width: 2, height: 42, color: _border),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 0, bottom: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'STAGE ${index + 1}',
                        style: const TextStyle(
                          color: _blue,
                          fontSize: 8,
                          fontWeight: FontWeight.w900,
                          letterSpacing: .8,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        stage.$1,
                        style: const TextStyle(
                          color: _navy,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        execution == null
                            ? stage.$2
                            : _text(execution['currentStep'], stage.$2),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: _muted, fontSize: 9.5),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 6),
              _statusPill(status, color),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildExecutionCard(Map<String, dynamic> data) {
    final status = _text(data['status'], 'Unknown');
    final approval = _text(data['approvalStatus'], 'NotRequired');
    final statusColor = _statusColor(status);
    final approvalColor = _statusColor(approval);

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: _card(
        padding: EdgeInsets.zero,
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 15, vertical: 5),
          childrenPadding: const EdgeInsets.fromLTRB(15, 0, 15, 15),
          iconColor: _blue,
          collapsedIconColor: _muted,
          title: Row(
            children: [
              Expanded(
                child: Text(
                  _text(data['agentName'], 'AI Agent'),
                  style: const TextStyle(
                    color: _navy,
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              _statusPill(status, statusColor),
            ],
          ),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(
              _text(data['currentStep'], 'Workflow initialized'),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: _muted, fontSize: 10),
            ),
          ),
          children: [
            Wrap(
              spacing: 7,
              runSpacing: 7,
              children: [
                _infoPill('Approval', approval, approvalColor),
                _infoPill(
                  'Model',
                  _text(data['modelName'], 'Not recorded'),
                  _blue,
                ),
                _infoPill('Tokens', _text(data['totalTokens'], '0'), _cyan),
              ],
            ),
            const SizedBox(height: 12),
            _detailBlock('Objective', _text(data['objective'])),
            _detailBlock('Input Summary', _text(data['inputSummary'])),
            _detailBlock('Output Summary', _text(data['outputSummary'])),
            _detailBlock('Completed Steps', _text(data['completedSteps'])),
            _detailBlock('Tool Results', _text(data['toolResults'])),
            _detailBlock('Validation', _text(data['validationResults'])),
            _detailBlock('Final Outcome', _text(data['finalOutcome'])),
            if (_text(data['errorMessage'], '').isNotEmpty)
              _detailBlock('Error', _text(data['errorMessage'])),
            const SizedBox(height: 4),
            _detailRow('Workflow ID', _text(data['workflowId'])),
            _detailRow('Started', _formatDate(data['startedAt'])),
            _detailRow('Completed', _formatDate(data['completedAt'])),
            _detailRow('Approval User', _text(data['approvalUser'])),
            _detailRow('Approval Time', _formatDate(data['approvalTimestamp'])),
            _detailRow('Estimated Cost', _text(data['estimatedCost'])),
          ],
        ),
      ),
    );
  }

  Widget _buildSystemInformation() {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _smallHeading('SYSTEM INFORMATION'),
          const SizedBox(height: 12),
          _detailRow('Latest Check', _formatDate(_health['checkedAt'])),
          _detailRow(
            'Database Response',
            _health['databaseResponseMs'] == null
                ? 'Not reported'
                : '${_number(_health['databaseResponseMs']).toStringAsFixed(2)} ms',
          ),
          _detailRow(
            'AI Agents Available',
            _text(_health['aiAgentsAvailable']),
          ),
          _detailRow('Disk Total', _text(_health['diskTotal'])),
          _detailRow('Disk Free', _text(_health['diskFree'])),
        ],
      ),
    );
  }

  Widget _detailBlock(String title, String value) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(11),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: _blue,
              fontSize: 9,
              fontWeight: FontWeight.w900,
              letterSpacing: .6,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(color: _navy, fontSize: 10.5, height: 1.35),
          ),
        ],
      ),
    );
  }

  Widget _detailRow(String title, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 105,
            child: Text(
              title,
              style: const TextStyle(
                color: _muted,
                fontSize: 10,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: _navy,
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _progressRow(String title, double value, IconData icon) {
    final color = _healthColor(value);

    return Row(
      children: [
        Icon(icon, color: _blue, size: 17),
        const SizedBox(width: 9),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: const TextStyle(
                        color: _navy,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  Text(
                    '${value.toStringAsFixed(1)}%',
                    style: TextStyle(
                      color: color,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: LinearProgressIndicator(
                  minHeight: 6,
                  value: value / 100,
                  backgroundColor: const Color(0xFFE8EEF4),
                  valueColor: AlwaysStoppedAnimation<Color>(color),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _statusPill(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(.09),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Text(
        _pretty(text),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          color: color,
          fontSize: 8.5,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }

  Widget _infoPill(String title, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 7),
      decoration: BoxDecoration(
        color: color.withOpacity(.07),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(.15)),
      ),
      child: RichText(
        text: TextSpan(
          children: [
            TextSpan(
              text: '$title: ',
              style: TextStyle(
                color: color,
                fontSize: 8.5,
                fontWeight: FontWeight.w900,
              ),
            ),
            TextSpan(
              text: value,
              style: const TextStyle(
                color: _navy,
                fontSize: 8.5,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _pill(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(.08),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 9,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }

  Widget _smallHeading(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: _blue,
        fontSize: 9,
        fontWeight: FontWeight.w900,
        letterSpacing: 1.2,
      ),
    );
  }

  Widget _sectionLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: _blue,
        fontSize: 9,
        fontWeight: FontWeight.w900,
        letterSpacing: 1.3,
      ),
    );
  }

  Widget _card({
    required Widget child,
    EdgeInsetsGeometry padding = const EdgeInsets.all(16),
  }) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _border),
      ),
      child: child,
    );
  }

  Widget _divider() {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 11),
      child: Divider(height: 1, color: _border),
    );
  }

  Widget _emptyCard() {
    return _card(
      child: Column(
        children: [
          const Icon(Icons.hourglass_empty_rounded, color: _muted, size: 30),
          const SizedBox(height: 8),
          const Text(
            'No agent executions found',
            style: TextStyle(color: _navy, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 4),
          Text(
            'The backend has not returned any execution records yet.',
            textAlign: TextAlign.center,
            style: TextStyle(color: _muted.withOpacity(.9), fontSize: 10),
          ),
        ],
      ),
    );
  }

  String _formatDate(dynamic value) {
    if (value == null) return 'â€”';
    final raw = value.toString();
    if (raw.trim().isEmpty) return 'â€”';

    final parsed = DateTime.tryParse(raw);
    if (parsed == null) return raw;

    final local = parsed.toLocal();
    String two(int n) => n.toString().padLeft(2, '0');

    return '${local.year}-${two(local.month)}-${two(local.day)} '
        '${two(local.hour)}:${two(local.minute)}:${two(local.second)}';
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorView({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.cloud_off_rounded,
              color: Color(0xFFDC2626),
              size: 42,
            ),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFF06152F),
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 14),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
