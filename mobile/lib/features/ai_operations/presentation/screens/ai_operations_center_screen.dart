import 'package:flutter/material.dart';
import 'package:reliefnexus_mobile/core/network/api_client.dart';

class AIOperationsCenterScreen extends StatefulWidget {
  const AIOperationsCenterScreen({super.key});

  @override
  State<AIOperationsCenterScreen> createState() => _AIOperationsCenterScreenState();
}

class _AIOperationsCenterScreenState extends State<AIOperationsCenterScreen> {
  final ApiClient _client = ApiClient();
  final _promptController = TextEditingController(
    text:
        'Assess the flood risk in Colombo, identify vulnerable people, check available resources, prepare an emergency warning, and prepare a volunteer response plan.',
  );
  final _locationController = TextEditingController(text: 'Colombo');

  bool _loading = true;
  bool _running = false;
  String? _error;
  String _message = '';
  Map<String, dynamic> _health = {};
  List<Map<String, dynamic>> _executions = [];

  static const _navy = Color(0xFF06152F);
  static const _blue = Color(0xFF0284C7);
  static const _cyan = Color(0xFF14B8A6);
  static const _bg = Color(0xFFF1F6FB);
  static const _muted = Color(0xFF64748B);

  static const _agents = [
    ('Risk Prediction Agent', Icons.analytics_rounded),
    ('Vulnerability & Impact Agent', Icons.health_and_safety_rounded),
    ('Resource Optimization Agent', Icons.inventory_2_rounded),
    ('Early Warning & Coordination Agent', Icons.campaign_rounded),
    ('Volunteer Assignment Agent', Icons.groups_rounded),
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _promptController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
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
        _error = null;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Unable to load AI operations data.';
      });
    }
  }

  Map<String, dynamic> _asMap(dynamic value) =>
      value is Map ? Map<String, dynamic>.from(value) : {};

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

  Map<String, dynamic>? _latest(String name) {
    final matches = _executions
        .where(
          (e) =>
              (e['agentName']?.toString() ?? '').toLowerCase() ==
              name.toLowerCase(),
        )
        .toList();
    if (matches.isEmpty) return null;
    matches.sort((a, b) {
      final aa =
          DateTime.tryParse(a['startedAt']?.toString() ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0);
      final bb =
          DateTime.tryParse(b['startedAt']?.toString() ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0);
      return bb.compareTo(aa);
    });
    return matches.first;
  }

  int get _pending => _executions.where((e) {
        final s = (e['approvalStatus']?.toString() ?? '').toLowerCase();
        return s == 'pending' || s == 'needsrevision';
      }).length;

  Future<void> _runWorkflow() async {
    if (_promptController.text.trim().isEmpty || _running) return;
    setState(() {
      _running = true;
      _message = '';
      _error = null;
    });
    try {
      final response = await _client.dio.post(
        '/ai/orchestrator/run',
        data: {
          'prompt': _promptController.text.trim(),
          'riskInput': {
            'location': _locationController.text.trim(),
            'latitude': 6.9271,
            'longitude': 79.8612,
          },
          'executeAgents': true,
          'maxReplans': 2,
        },
      );
      final workflow =
          response.data?['workflow_id'] ?? response.data?['workflowId'];
      if (!mounted) return;
      setState(() {
        _message = workflow == null
            ? 'AI workflow started successfully.'
            : 'Workflow $workflow started successfully.';
      });
      await _load();
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'The AI workflow could not be started.');
    } finally {
      if (mounted) setState(() => _running = false);
    }
  }

  Future<void> _approve(Map<String, dynamic> execution, String status) async {
    final id = execution['id']?.toString();
    if (id == null || id.isEmpty) return;
    try {
      await _client.dio.put(
        '/risk-predictions/agent-executions/$id/approval',
        data: {'status': status},
      );
      if (!mounted) return;
      setState(() {
        _message = status == 'Approved'
            ? 'Approved. The same execution will resume.'
            : 'Approval status changed to $status.';
      });
      await _load();
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Approval action could not be completed.');
    }
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
          'AI Operations Center',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
        actions: [
          IconButton(
            onPressed: _load,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              color: _blue,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                children: [
                  _hero(),
                  const SizedBox(height: 14),
                  _missionComposer(),
                  const SizedBox(height: 20),
                  _section('AGENTIC AI', 'Live agent execution registry'),
                  const SizedBox(height: 10),
                  ..._agents.map(_agentCard),
                  const SizedBox(height: 20),
                  _workflow(),
                  const SizedBox(height: 20),
                  _approvals(),
                  const SizedBox(height: 20),
                  _healthCard(),
                  const SizedBox(height: 20),
                  _activity(),
                ],
              ),
            ),
    );
  }

  Widget _hero() {
    final running = _executions
        .where((e) => (e['status']?.toString() ?? '').toLowerCase() == 'running')
        .length;
    final completed = _executions
        .where((e) => (e['status']?.toString() ?? '').toLowerCase() == 'completed')
        .length;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [_navy, Color(0xFF0B315C), _cyan],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(26),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1806152F),
            blurRadius: 22,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'AGENTIC AI OPERATIONS',
            style: TextStyle(
              color: Color(0xFF9DE7FF),
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 7),
          const Text(
            'Plan â€¢ Execute â€¢ Replan â€¢ Govern',
            style: TextStyle(
              color: Colors.white,
              fontSize: 23,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'One operational workspace for the five disaster response agents.',
            style: TextStyle(color: Colors.white.withOpacity(.75), fontSize: 11),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _heroMetric('Running', '$running'),
              const SizedBox(width: 8),
              _heroMetric('Pending', '$_pending'),
              const SizedBox(width: 8),
              _heroMetric('Completed', '$completed'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _heroMetric(String label, String value) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(.09),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withOpacity(.10)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: const TextStyle(
                      color: Color(0xFFB9D8F0),
                      fontSize: 8,
                      fontWeight: FontWeight.w800)),
              const SizedBox(height: 3),
              Text(value,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w900)),
            ],
          ),
        ),
      );

  Widget _missionComposer() => _card(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _section('MISSION', 'Natural-language orchestration'),
            const SizedBox(height: 9),
            TextField(
              controller: _promptController,
              maxLines: 4,
              decoration: _input('Tell ReliefNexus what to accomplish...'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _locationController,
              decoration: _input('Operational location'),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _running ? null : _runWorkflow,
                icon: const Icon(Icons.auto_awesome_rounded, size: 18),
                label: Text(_running ? 'AI IS PLANNING...' : 'RUN AI WORKFLOW'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _blue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
            if (_message.isNotEmpty)
              _notice(_message, const Color(0xFFDCFCE7), const Color(0xFF15803D)),
            if (_error != null)
              _notice(_error!, const Color(0xFFFEE2E2), const Color(0xFFB91C1C)),
          ],
        ),
      );

  InputDecoration _input(String hint) => InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: const Color(0xFFF8FAFC),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(13),
          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(13),
          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
      );

  Widget _agentCard((String, IconData) agent) {
    final name = agent.$1;
    final execution = _latest(name);
    final status = execution?['status']?.toString() ?? 'No execution';
    final approval = execution?['approvalStatus']?.toString() ?? 'Not required';
    final pending = approval.toLowerCase() == 'pending';

    return Container(
      margin: const EdgeInsets.only(bottom: 9),
      child: _card(
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  width: 43,
                  height: 43,
                  decoration: BoxDecoration(
                    color: _blue.withOpacity(.09),
                    borderRadius: BorderRadius.circular(13),
                  ),
                  child: Icon(agent.$2, color: _blue),
                ),
                const SizedBox(width: 11),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name,
                          style: const TextStyle(
                              color: _navy,
                              fontSize: 12,
                              fontWeight: FontWeight.w900)),
                      const SizedBox(height: 3),
                      Text(
                        execution?['currentStep']?.toString() ?? 'Ready for execution',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: _muted, fontSize: 9),
                      ),
                    ],
                  ),
                ),
                _statusPill(status),
              ],
            ),
            if (execution != null) ...[
              const SizedBox(height: 11),
              Row(
                children: [
                  Expanded(child: _mini('Approval', approval)),
                  Expanded(child: _mini('Workflow', execution['workflowId']?.toString() ?? 'â€”')),
                ],
              ),
              if (pending && name == 'Early Warning & Coordination Agent') ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => _approve(execution, 'Approved'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF16A34A),
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('APPROVE & RESUME',
                            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900)),
                      ),
                    ),
                    const SizedBox(width: 7),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _approve(execution, 'NeedsRevision'),
                        child: const Text('REVISION',
                            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900)),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }

  Widget _statusPill(String status) {
    final lower = status.toLowerCase();
    Color color = _muted;
    Color bg = const Color(0xFFF1F5F9);
    if (lower.contains('complete')) {
      color = const Color(0xFF15803D);
      bg = const Color(0xFFDCFCE7);
    } else if (lower.contains('running')) {
      color = _blue;
      bg = const Color(0xFFE0F2FE);
    } else if (lower.contains('pending') || lower.contains('await')) {
      color = const Color(0xFFB45309);
      bg = const Color(0xFFFEF3C7);
    } else if (lower.contains('fail')) {
      color = const Color(0xFFB91C1C);
      bg = const Color(0xFFFEE2E2);
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(status,
          style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.w900)),
    );
  }

  Widget _workflow() => _card(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _section('AI DECISION PIPELINE', 'Dynamic orchestration'),
            const SizedBox(height: 12),
            Row(
              children: [
                _step('01', 'Understand'),
                _arrow(),
                _step('02', 'Plan'),
                _arrow(),
                _step('03', 'Execute'),
                _arrow(),
                _step('04', 'Replan'),
                _arrow(),
                _step('05', 'Govern'),
              ],
            ),
          ],
        ),
      );

  Widget _step(String n, String label) => Expanded(
        child: Column(
          children: [
            Container(
              width: 34,
              height: 34,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: _blue.withOpacity(.08),
                shape: BoxShape.circle,
              ),
              child: Text(n,
                  style: const TextStyle(
                      color: _blue, fontSize: 9, fontWeight: FontWeight.w900)),
            ),
            const SizedBox(height: 5),
            Text(label,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    color: _navy, fontSize: 7.5, fontWeight: FontWeight.w800)),
          ],
        ),
      );

  Widget _arrow() => const Padding(
        padding: EdgeInsets.only(bottom: 20),
        child: Icon(Icons.chevron_right_rounded, color: Color(0xFFCBD5E1), size: 15),
      );

  Widget _approvals() {
    final items = _executions.where((e) {
      final s = e['approvalStatus']?.toString().toLowerCase() ?? '';
      return s == 'pending' || s == 'needsrevision';
    }).toList();

    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _section('HUMAN-IN-THE-LOOP', 'Pending governance decisions'),
          const SizedBox(height: 10),
          if (items.isEmpty)
            const Text('No pending approvals.',
                style: TextStyle(color: _muted, fontSize: 10))
          else
            ...items.map(
              (e) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const CircleAvatar(
                    backgroundColor: Color(0xFFFFF7ED),
                    child: Icon(Icons.gpp_maybe_rounded, color: Color(0xFFD97706)),
                  ),
                  title: Text(e['agentName']?.toString() ?? 'Agent',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900)),
                  subtitle: Text(
                    e['currentStep']?.toString() ?? 'Awaiting approval',
                    style: const TextStyle(fontSize: 9, color: _muted),
                  ),
                  trailing: e['agentName']?.toString() ==
                          'Early Warning & Coordination Agent'
                      ? IconButton(
                          onPressed: () => _approve(e, 'Approved'),
                          icon: const Icon(Icons.check_circle_rounded,
                              color: Color(0xFF16A34A)),
                        )
                      : null,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _healthCard() {
    final items = [
      ['API', _health['apiAvailability']],
      ['Database', _health['databaseHealth']],
      ['AI', _health['aiServices']],
      ['Storage', _health['storage']],
    ];
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _section('PLATFORM HEALTH', 'Live infrastructure signals'),
          const SizedBox(height: 10),
          ...items.map((item) {
            final value = item[1] is num ? (item[1] as num).toDouble() : 0.0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                children: [
                  SizedBox(
                    width: 70,
                    child: Text(item[0].toString(),
                        style: const TextStyle(
                            color: _muted, fontSize: 9, fontWeight: FontWeight.w800)),
                  ),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: LinearProgressIndicator(
                        minHeight: 7,
                        value: (value / 100).clamp(0, 1),
                        backgroundColor: const Color(0xFFE2E8F0),
                        color: const Color(0xFF16A34A),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text('${value.toStringAsFixed(0)}%',
                      style: const TextStyle(
                          color: _navy, fontSize: 9, fontWeight: FontWeight.w900)),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _activity() => _card(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _section('EXECUTION TRACE', 'Latest agent activity'),
            const SizedBox(height: 8),
            if (_executions.isEmpty)
              const Text('No execution activity yet.',
                  style: TextStyle(color: _muted, fontSize: 10))
            else
              ..._executions.take(8).map(
                (e) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 7),
                  child: Row(
                    children: [
                      const Icon(Icons.circle, size: 7, color: _blue),
                      const SizedBox(width: 9),
                      Expanded(
                        child: Text(
                          '${e['agentName'] ?? 'Agent'} â€¢ ${e['currentStep'] ?? e['status'] ?? 'Execution'}',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: _navy, fontSize: 9, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      );

  Widget _mini(String label, String value) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 7,
                  fontWeight: FontWeight.w800)),
          const SizedBox(height: 2),
          Text(value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                  color: _navy, fontSize: 8.5, fontWeight: FontWeight.w900)),
        ],
      );

  Widget _notice(String text, Color bg, Color color) => Container(
        margin: const EdgeInsets.only(top: 9),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(text,
            style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w700)),
      );

  Widget _section(String eyebrow, String title) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(eyebrow,
              style: const TextStyle(
                  color: _blue,
                  fontSize: 8,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2)),
          const SizedBox(height: 2),
          Text(title,
              style: const TextStyle(
                  color: _navy, fontSize: 15, fontWeight: FontWeight.w900)),
        ],
      );

  Widget _card({required Widget child}) => Container(
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0806152F),
              blurRadius: 14,
              offset: Offset(0, 5),
            ),
          ],
        ),
        child: child,
      );
}




