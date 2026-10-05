import 'package:flutter/material.dart';
import 'agent03_workflow_screen.dart';
import '../widgets/agent03/agent03_assessment_details_sheet.dart';
import 'package:dio/dio.dart';

import 'package:reliefnexus_mobile/core/network/api_client.dart';

class ResourceOptimizationPage extends StatefulWidget {
  const ResourceOptimizationPage({super.key});

  @override
  State<ResourceOptimizationPage> createState() =>
      _ResourceOptimizationPageState();
}

class _ResourceOptimizationPageState extends State<ResourceOptimizationPage> {
  final ApiClient _client = ApiClient();

  bool _loading = true;
  bool _running = false;
  String? _error;

  List<Map<String, dynamic>> _resources = [];
  List<Map<String, dynamic>> _assessments = [];
  List<Map<String, dynamic>> _allocations = [];

  Map<String, dynamic>? _selectedAssessment;
  Map<String, dynamic>? _demand;
  List<Map<String, dynamic>> _demandLines = [];

  static const Color _navy = Color(0xFF071A33);
  static const Color _navy2 = Color(0xFF0B2A4A);
  static const Color _blue = Color(0xFF2563EB);
  static const Color _cyan = Color(0xFF06B6D4);
  static const Color _bg = Color(0xFFF3F7FC);
  static const Color _text = Color(0xFF10243E);
  static const Color _muted = Color(0xFF718096);
  static const Color _green = Color(0xFF16A34A);
  static const Color _orange = Color(0xFFF59E0B);
  static const Color _red = Color(0xFFDC2626);

  // Real remote photos used only as visual presentation.
  // All quantities/statuses remain live backend values.
  static const String _heroPhoto =
      'assets/images/disasters/disaster_default.jpg';

  static const String _floodPhoto = 'assets/images/disasters/flood.jpg';

  static const String _resourcePhoto =
      'assets/images/resources/resource_default.jpg';

  static const String _medicalPhoto = 'assets/images/resources/first_aid.jpg';

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  // ---------------------------------------------------------------------------
  // API
  // ---------------------------------------------------------------------------

  dynamic _unwrap(dynamic data) {
    if (data is Map<String, dynamic>) {
      if (data['data'] != null) return _unwrap(data['data']);
      if (data['items'] != null) return _unwrap(data['items']);
      if (data['result'] != null) return _unwrap(data['result']);
      if (data['results'] != null) return _unwrap(data['results']);
    }

    return data;
  }

  List<Map<String, dynamic>> _asList(dynamic data) {
    final value = _unwrap(data);

    if (value is List) {
      return value
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    }

    if (value is Map) {
      return [Map<String, dynamic>.from(value)];
    }

    return [];
  }

  Map<String, dynamic>? _asMap(dynamic data) {
    final value = _unwrap(data);

    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }

    return null;
  }

  Future<void> _loadAll() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final assessmentResponse = await _client.dio.get('/vulnerability-impact');

      final resourceResponse = await _client.dio.get(
        '/resource-optimization/resources',
      );

      final assessments = _asList(assessmentResponse.data);
      final resources = _asList(resourceResponse.data);

      assessments.sort(
        (a, b) =>
            _dateValue(b['createdAt']).compareTo(_dateValue(a['createdAt'])),
      );

      if (!mounted) return;

      Map<String, dynamic>? selected;

      if (_selectedAssessment != null) {
        final selectedId = _id(_selectedAssessment);

        selected = assessments.cast<Map<String, dynamic>?>().firstWhere(
          (item) => _id(item) == selectedId,
          orElse: () => assessments.isNotEmpty ? assessments.first : null,
        );
      } else if (assessments.isNotEmpty) {
        selected = assessments.first;
      }

      setState(() {
        _assessments = assessments;
        _selectedAssessment = selected;

        _resources = resources;
        _allocations = [];
        _loading = false;
      });

      final selectedId = _id(selected);

      if (selectedId != null && selectedId.isNotEmpty) {
        await _loadDemand(selectedId);

        try {
          final allocationResponse = await _client.dio.get(
            '/resource-optimization/$selectedId',
          );

          final allocations = _asList(allocationResponse.data);

          if (!mounted) return;

          setState(() {
            _allocations = allocations;
          });
        } catch (_) {
          if (!mounted) return;

          setState(() {
            _allocations = [];
          });
        }
      }
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _loading = false;
        _error = _errorMessage(e);
      });
    }
  }

  Future<void> _loadDemand(String? assessmentId) async {
    if (assessmentId == null || assessmentId.isEmpty) return;

    try {
      final response = await _client.dio.get(
        '/resource-optimization/$assessmentId/demand',
      );

      final map = _asMap(response.data);

      if (!mounted) return;

      setState(() {
        _demand = map;

        final rawLines =
            map?['resources'] ??
            map?['resourceDemands'] ??
            map?['demandLines'] ??
            [];

        _demandLines = _asList(rawLines);
      });
    } catch (_) {
      if (!mounted) return;

      setState(() {
        _demand = null;
        _demandLines = [];
      });
    }
  }

  Future<void> _openAgent03Workflow() async {
    final assessment = _selectedAssessment;

    if (assessment == null) {
      _showSnack('Please select an Agent 02 assessment first.', error: true);
      return;
    }

    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => Agent03WorkflowPage(assessment: assessment),
      ),
    );

    if (result == true && mounted) {
      await _loadAll();
    }
  }

  Future<void> _runOptimization() async {
    final assessment = _selectedAssessment;

    if (assessment == null) {
      _showSnack('Please select an Agent 02 assessment first.', error: true);
      return;
    }

    final id = _id(assessment);

    if (id == null || id.isEmpty) {
      _showSnack('Selected assessment has no valid ID.', error: true);
      return;
    }

    setState(() {
      _running = true;
    });

    try {
      await _client.dio.post('/resource-optimization/$id/optimize');

      await _loadAll();

      if (!mounted) return;

      _showSnack('Agent 03 optimization completed successfully.');
    } catch (e) {
      if (!mounted) return;

      _showSnack(_errorMessage(e), error: true);
    } finally {
      if (mounted) {
        setState(() {
          _running = false;
        });
      }
    }
  }

  Future<void> _createResource(Map<String, dynamic> payload) async {
    try {
      await _client.dio.post('/resource-optimization/resources', data: payload);

      await _loadAll();

      if (mounted) {
        _showSnack('Resource added successfully.');
      }
    } catch (e) {
      if (mounted) {
        _showSnack(_errorMessage(e), error: true);
      }
    }
  }

  Future<void> _updateResource(String id, Map<String, dynamic> payload) async {
    try {
      await _client.dio.put(
        '/resource-optimization/resources/$id',
        data: payload,
      );

      await _loadAll();

      if (mounted) {
        _showSnack('Resource updated successfully.');
      }
    } catch (e) {
      if (mounted) {
        _showSnack(_errorMessage(e), error: true);
      }
    }
  }

  Future<void> _deleteResource(String id) async {
    try {
      await _client.dio.delete('/resource-optimization/resources/$id');

      await _loadAll();

      if (mounted) {
        _showSnack('Resource deleted successfully.');
      }
    } catch (e) {
      if (mounted) {
        _showSnack(_errorMessage(e), error: true);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  String? _id(Map<String, dynamic>? item) {
    if (item == null) return null;

    final value =
        item['id'] ?? item['Id'] ?? item['resourceId'] ?? item['ResourceId'];

    if (value == null) return null;

    return value.toString();
  }

  String _string(
    Map<String, dynamic>? item,
    List<String> keys, {
    String fallback =
        '----------------------------------------------------------------------------------------------------------------------------------',
  }) {
    if (item == null) return fallback;

    for (final key in keys) {
      final value = item[key];

      if (value != null && value.toString().trim().isNotEmpty) {
        return value.toString();
      }
    }

    return fallback;
  }

  num _num(Map<String, dynamic>? item, List<String> keys) {
    if (item == null) return 0;

    for (final key in keys) {
      final value = item[key];

      if (value is num) return value;

      if (value != null) {
        final parsed = num.tryParse(value.toString());

        if (parsed != null) return parsed;
      }
    }

    return 0;
  }

  DateTime _dateValue(dynamic value) {
    if (value == null) {
      return DateTime.fromMillisecondsSinceEpoch(0);
    }

    return DateTime.tryParse(value.toString()) ??
        DateTime.fromMillisecondsSinceEpoch(0);
  }

  String _dateText(dynamic value) {
    final date = _dateValue(value);

    if (date.millisecondsSinceEpoch == 0) {
      return 'No date';
    }

    return '${date.day.toString().padLeft(2, '0')}/'
        '${date.month.toString().padLeft(2, '0')}/'
        '${date.year}';
  }

  String _errorMessage(dynamic error) {
    if (error is DioException) {
      final data = error.response?.data;

      if (data is Map) {
        final message =
            data['message'] ?? data['error'] ?? data['title'] ?? data['detail'];

        if (message != null) {
          return message.toString();
        }
      }

      if (data is String && data.isNotEmpty) {
        return data;
      }

      return error.message ?? 'Request failed.';
    }

    return error.toString().replaceFirst('Exception: ', '');
  }

  int get _totalResources {
    return _resources.fold(
      0,
      (sum, item) =>
          sum +
          _num(item, ['availableQuantity', 'AvailableQuantity']).toInt() +
          _num(item, ['allocatedQuantity', 'AllocatedQuantity']).toInt(),
    );
  }

  int get _availableResources {
    return _resources.fold(
      0,
      (sum, item) =>
          sum + _num(item, ['availableQuantity', 'AvailableQuantity']).toInt(),
    );
  }

  int get _allocatedResources {
    return _resources.fold(
      0,
      (sum, item) =>
          sum + _num(item, ['allocatedQuantity', 'AllocatedQuantity']).toInt(),
    );
  }

  int get _allocationGap {
    return _demandLines.fold(
      0,
      (sum, item) => sum + _num(item, ['gapQuantity', 'GapQuantity']).toInt(),
    );
  }

  String _riskLevel(Map<String, dynamic> item) {
    return _string(item, [
      'riskLevel',
      'RiskLevel',
      'priority',
      'Priority',
    ], fallback: 'Unknown');
  }

  Color _riskColor(String level) {
    final value = level.toLowerCase();

    if (value.contains('critical')) return _red;
    if (value.contains('high')) return const Color(0xFFEA580C);
    if (value.contains('medium')) return _orange;
    if (value.contains('low')) return _green;

    return _blue;
  }

  String _photoForResource(String type) {
    final value = type.toLowerCase();

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

  String _photoForAssessment(Map<String, dynamic> assessment) {
    final disaster = _string(assessment, [
      'disasterType',
      'DisasterType',
    ], fallback: '').toLowerCase();

    if (disaster.contains('drought')) {
      return 'assets/images/disasters/drought.jpg';
    }

    if (disaster.contains('flood')) {
      return 'assets/images/disasters/flood.jpg';
    }

    if (disaster.contains('landslide')) {
      return 'assets/images/disasters/landslide.jpg';
    }

    if (disaster.contains('earthquake')) {
      return 'assets/images/disasters/earthquake.jpg';
    }

    if (disaster.contains('cyclone')) {
      return 'assets/images/disasters/cyclone.jpg';
    }

    if (disaster.contains('wildfire') || disaster.contains('forest fire')) {
      return 'assets/images/disasters/wildfire.jpg';
    }

    if (disaster.contains('tsunami')) {
      return 'assets/images/disasters/tsunami.jpg';
    }

    if (disaster.contains('avalanche')) {
      return 'assets/images/disasters/avalanche.jpg';
    }

    if (disaster.contains('lightning')) {
      return 'assets/images/disasters/lightning.jpg';
    }

    if (disaster.contains('volcanic') || disaster.contains('volcano')) {
      return 'assets/images/disasters/volcanic-eruption.jpg';
    }

    return 'assets/images/disasters/disaster_default.jpg';
  }

  void _showSnack(String message, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        backgroundColor: error ? _red : _navy,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        content: Row(
          children: [
            Icon(
              error
                  ? Icons.error_outline_rounded
                  : Icons.check_circle_outline_rounded,
              color: Colors.white,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // BUILD
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: RefreshIndicator(
          color: _blue,
          onRefresh: _loadAll,
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : CustomScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  slivers: [
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 14, 16, 40),
                      sliver: SliverList(
                        delegate: SliverChildListDelegate([
                          _topBar(),
                          const SizedBox(height: 14),
                          _hero(),
                          const SizedBox(height: 16),
                          _kpiGrid(),
                          const SizedBox(height: 18),
                          _runAssessmentCard(),
                          const SizedBox(height: 18),
                          _recentAssessments(),
                          const SizedBox(height: 18),
                          _recommendationCard(),
                          const SizedBox(height: 18),
                          _demandCard(),
                          const SizedBox(height: 18),
                          _allocationsCard(),
                          const SizedBox(height: 18),
                          _inventoryCard(),
                          if (_error != null) ...[
                            const SizedBox(height: 16),
                            _errorCard(),
                          ],
                        ]),
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // TOP BAR
  // ---------------------------------------------------------------------------

  Widget _topBar() {
    return Row(
      children: [
        Container(
          height: 44,
          width: 44,
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [_navy, _blue]),
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: _blue.withValues(alpha: .18),
                blurRadius: 16,
                offset: const Offset(0, 7),
              ),
            ],
          ),
          child: const Icon(Icons.inventory_2_rounded, color: Colors.white),
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'AI Intelligence',
                style: TextStyle(
                  fontSize: 12,
                  color: _muted,
                  fontWeight: FontWeight.w700,
                ),
              ),
              SizedBox(height: 2),
              Text(
                'Resource Optimization',
                style: TextStyle(
                  fontSize: 19,
                  color: _text,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ),
        IconButton(
          onPressed: _loadAll,
          style: IconButton.styleFrom(backgroundColor: Colors.white),
          icon: const Icon(Icons.refresh_rounded, color: _navy),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // HERO
  // ---------------------------------------------------------------------------

  Widget _hero() {
    return Container(
      height: 238,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: _navy.withValues(alpha: .22),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset(
            _heroPhoto,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Container(color: _navy2),
          ),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
                colors: [
                  _navy.withValues(alpha: .20),
                  _navy.withValues(alpha: .78),
                  _navy.withValues(alpha: .98),
                ],
              ),
            ),
          ),
          Positioned(
            right: -25,
            top: -35,
            child: Container(
              height: 130,
              width: 130,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _cyan.withValues(alpha: .12),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: .13),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: .18),
                    ),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.auto_awesome_rounded,
                        size: 14,
                        color: Color(0xFF67E8F9),
                      ),
                      SizedBox(width: 6),
                      Text(
                        'AGENT 03',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Resource Optimization',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 27,
                    height: 1.05,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'AI-powered disaster resource planning & allocation',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: .82),
                    fontSize: 13,
                    height: 1.35,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // KPI
  // ---------------------------------------------------------------------------

  Widget _kpiGrid() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 1.58,
      children: [
        _kpi('TOTAL', _totalResources, Icons.inventory_2_rounded, _blue),
        _kpi(
          'AVAILABLE',
          _availableResources,
          Icons.check_circle_rounded,
          _green,
        ),
        _kpi(
          'ALLOCATED',
          _allocatedResources,
          Icons.local_shipping_rounded,
          _orange,
        ),
        _kpi('GAP', _allocationGap, Icons.warning_amber_rounded, _red),
      ],
    );
  }

  Widget _kpi(String title, int value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE6EDF6)),
        boxShadow: [
          BoxShadow(
            color: _navy.withValues(alpha: .045),
            blurRadius: 18,
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
                height: 32,
                width: 32,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: .10),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 17, color: color),
              ),
              const Spacer(),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 9,
                  color: _muted,
                  fontWeight: FontWeight.w900,
                  letterSpacing: .7,
                ),
              ),
            ],
          ),
          const Spacer(),
          Text(
            value.toString(),
            style: const TextStyle(
              fontSize: 23,
              color: _text,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // RUN ASSESSMENT
  // ---------------------------------------------------------------------------

  Widget _runAssessmentCard() {
    final selected = _selectedAssessment;

    return _sectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader(
            icon: Icons.auto_awesome_rounded,
            title: 'Run Agent 03 Assessment',
            subtitle: 'Use an Agent 02 vulnerability assessment',
            color: _blue,
          ),
          const SizedBox(height: 18),
          const Text(
            'Agent 02 Assessment',
            style: TextStyle(
              fontSize: 11,
              color: _muted,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 7),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFF7F9FC),
              borderRadius: BorderRadius.circular(15),
              border: Border.all(color: const Color(0xFFE0E8F2)),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<Map<String, dynamic>>(
                value: selected,
                isExpanded: true,
                icon: const Icon(
                  Icons.keyboard_arrow_down_rounded,
                  color: _navy,
                ),
                hint: const Text('Select Agent 02 assessment'),
                items: _assessments.map((assessment) {
                  final location = _string(assessment, [
                    'location',
                    'Location',
                  ], fallback: 'Unknown location');

                  final disaster = _string(assessment, [
                    'disasterType',
                    'DisasterType',
                  ], fallback: 'Disaster');

                  final risk = _riskLevel(assessment);

                  return DropdownMenuItem(
                    value: assessment,
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            '$location - $disaster - $risk',
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: _text,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
                onChanged: (value) async {
                  if (value == null) return;

                  setState(() {
                    _selectedAssessment = value;
                    _demand = null;
                    _demandLines = [];
                  });

                  await _loadDemand(_id(value));
                },
              ),
            ),
          ),
          const SizedBox(height: 14),
          if (selected != null) _selectedAssessmentPreview(selected),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 53,
            child: ElevatedButton.icon(
              onPressed: _running || selected == null
                  ? null
                  : _openAgent03Workflow,
              style: ElevatedButton.styleFrom(
                backgroundColor: _navy,
                disabledBackgroundColor: const Color(0xFFD5DEE9),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              icon: _running
                  ? const SizedBox(
                      height: 19,
                      width: 19,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.play_arrow_rounded),
              label: Text(
                _running ? 'Opening Agent 03...' : 'Run Agent 03 Assessment',
                style: const TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _selectedAssessmentPreview(Map<String, dynamic> assessment) {
    final risk = _riskLevel(assessment);
    final riskColor = _riskColor(risk);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF7FAFE),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: const Color(0xFFE3EAF3)),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(11),
            child: Image.asset(
              _photoForAssessment(assessment),
              height: 52,
              width: 52,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                height: 52,
                width: 52,
                color: _navy2,
                child: const Icon(Icons.flood_rounded, color: Colors.white),
              ),
            ),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _string(assessment, [
                    'location',
                    'Location',
                  ], fallback: 'Unknown location'),
                  style: const TextStyle(
                    color: _text,
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  _string(assessment, [
                    'disasterType',
                    'DisasterType',
                  ], fallback: 'Disaster'),
                  style: const TextStyle(
                    color: _muted,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          _pill(risk, riskColor),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // RECENT ASSESSMENTS
  // ---------------------------------------------------------------------------

  Widget _recentAssessments() {
    final rows = _assessments.take(5).toList();

    return _sectionCard(
      child: Column(
        children: [
          _sectionHeader(
            icon: Icons.history_rounded,
            title: 'Recent Assessments',
            trailing: TextButton(
              onPressed: () => _showAllAssessments(),
              child: const Text(
                'View All',
                style: TextStyle(color: _blue, fontWeight: FontWeight.w900),
              ),
            ),
          ),
          const SizedBox(height: 8),
          if (rows.isEmpty)
            _emptyState(
              Icons.analytics_outlined,
              'No Agent 02 assessments found.',
            )
          else
            ...rows.map((assessment) => _assessmentTile(assessment)),
        ],
      ),
    );
  }

  Widget _assessmentTile(Map<String, dynamic> assessment) {
    final location = _string(assessment, [
      'location',
      'Location',
    ], fallback: 'Unknown location');

    final disaster = _string(assessment, [
      'disasterType',
      'DisasterType',
    ], fallback: 'Disaster');

    final risk = _riskLevel(assessment);
    final riskColor = _riskColor(risk);

    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () => _showAssessmentDetails(assessment),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: Image.asset(
                _photoForAssessment(assessment),
                height: 62,
                width: 62,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  height: 62,
                  width: 62,
                  color: _navy2,
                  child: const Icon(Icons.flood_rounded, color: Colors.white),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    location,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: _text,
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          disaster,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: _muted,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 5),
                        child: Text(
                          '-----------------------',
                          style: TextStyle(color: _muted),
                        ),
                      ),
                      _pill(risk, riskColor, small: true),
                    ],
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: _muted),
          ],
        ),
      ),
    );
  }

  void _showAllAssessments() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) {
        return _bottomSheet(
          title: 'All Recent Assessments',
          child: ListView.separated(
            shrinkWrap: true,
            itemCount: _assessments.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, index) {
              return _assessmentTile(_assessments[index]);
            },
          ),
        );
      },
    );
  }

  // ---------------------------------------------------------------------------
  // RECOMMENDATION
  // ---------------------------------------------------------------------------

  Widget _recommendationCard() {
    final assessment = _selectedAssessment;

    return _sectionCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 12),
            child: _sectionHeader(
              icon: Icons.lightbulb_rounded,
              title: 'Agent 03 Recommendation',
              color: _orange,
            ),
          ),
          ClipRRect(
            borderRadius: const BorderRadius.vertical(
              bottom: Radius.circular(22),
            ),
            child: Stack(
              children: [
                Image.asset(
                  assessment == null
                      ? _resourcePhoto
                      : _photoForAssessment(assessment),
                  height: 155,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) =>
                      Container(height: 155, color: _navy2),
                ),
                Container(
                  height: 155,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        _navy.withValues(alpha: .92),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  left: 18,
                  right: 18,
                  bottom: 16,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        assessment == null
                            ? 'Select an assessment'
                            : _string(assessment, [
                                'location',
                                'Location',
                              ], fallback: 'Selected location'),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _recommendationText(),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: .82),
                          fontSize: 11,
                          height: 1.4,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _recommendationText() {
    if (_selectedAssessment == null) {
      return 'Choose an Agent 02 assessment to view live Agent 03 resource planning context.';
    }

    if (_demandLines.isEmpty) {
      return 'Run Agent 03 optimization to generate resource allocation recommendations from the backend.';
    }

    final gaps = _demandLines
        .where((line) => _num(line, ['gapQuantity', 'GapQuantity']).toInt() > 0)
        .length;

    if (gaps == 0) {
      return 'Current demand lines have no reported quantity gaps in the returned backend assessment.';
    }

    return '$gaps resource demand line(s) currently report a quantity gap. Review the demand and allocation details below.';
  }

  // ---------------------------------------------------------------------------
  // DEMAND
  // ---------------------------------------------------------------------------

  Widget _demandCard() {
    final line = _demandLines.isNotEmpty ? _demandLines.first : null;

    return _sectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader(
            icon: Icons.bar_chart_rounded,
            title: 'Demand Assessment',
            trailing: TextButton(
              onPressed: _demand == null ? null : () => _showDemandDetails(),
              child: const Text(
                'View Details',
                style: TextStyle(color: _blue, fontWeight: FontWeight.w900),
              ),
            ),
          ),
          const SizedBox(height: 13),
          if (line == null)
            _emptyState(
              Icons.query_stats_rounded,
              'No demand data returned for the selected assessment.',
            )
          else
            _demandPreview(line),
        ],
      ),
    );
  }

  Widget _demandPreview(Map<String, dynamic> line) {
    final name = _string(line, [
      'resourceName',
      'ResourceName',
    ], fallback: 'Resource');

    final required = _num(line, [
      'requiredQuantity',
      'RequiredQuantity',
    ]).toInt();

    final available = _num(line, [
      'availableQuantity',
      'AvailableQuantity',
    ]).toInt();

    final gap = _num(line, ['gapQuantity', 'GapQuantity']).toInt();

    return Row(
      children: [
        _photoBox(
          _photoForResource(
            _string(line, ['resourceType', 'ResourceType'], fallback: ''),
          ),
          60,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: const TextStyle(
                  color: _text,
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 9),
              Wrap(
                spacing: 6,
                runSpacing: 5,
                children: [
                  _miniStat('Required', required),
                  _miniStat('Available', available),
                  _miniStat('Gap', gap, color: gap > 0 ? _red : _green),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showDemandDetails() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) {
        return _bottomSheet(
          title: 'Demand Assessment Details',
          child: ListView.separated(
            shrinkWrap: true,
            itemCount: _demandLines.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, index) {
              final line = _demandLines[index];

              return _demandDetailRow(line);
            },
          ),
        );
      },
    );
  }

  Widget _demandDetailRow(Map<String, dynamic> line) {
    final name = _string(line, [
      'resourceName',
      'ResourceName',
    ], fallback: 'Resource');

    final required = _num(line, [
      'requiredQuantity',
      'RequiredQuantity',
    ]).toInt();

    final available = _num(line, [
      'availableQuantity',
      'AvailableQuantity',
    ]).toInt();

    final allocatable = _num(line, [
      'allocatableQuantity',
      'AllocatableQuantity',
    ]).toInt();

    final gap = _num(line, ['gapQuantity', 'GapQuantity']).toInt();

    final status = _string(line, [
      'coverageStatus',
      'CoverageStatus',
    ], fallback: 'Unknown');

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF7FAFE),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE3EAF3)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              _photoBox(
                _photoForResource(
                  _string(line, ['resourceType', 'ResourceType'], fallback: ''),
                ),
                48,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  name,
                  style: const TextStyle(
                    color: _text,
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              _pill(status, gap > 0 ? _red : _green, small: true),
            ],
          ),
          const SizedBox(height: 13),
          Row(
            children: [
              _detailMetric('Required', required.toString()),
              _detailMetric('Available', available.toString()),
              _detailMetric('Allocatable', allocatable.toString()),
              _detailMetric(
                'Gap',
                gap.toString(),
                valueColor: gap > 0 ? _red : _green,
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // ALLOCATIONS
  // ---------------------------------------------------------------------------

  Widget _allocationsCard() {
    final rows = _allocations.take(4).toList();

    return _sectionCard(
      child: Column(
        children: [
          _sectionHeader(
            icon: Icons.local_shipping_rounded,
            title: 'Resource Allocations',
            trailing: TextButton(
              onPressed: () => _showAllAllocations(),
              child: const Text(
                'View All',
                style: TextStyle(color: _blue, fontWeight: FontWeight.w900),
              ),
            ),
          ),
          const SizedBox(height: 8),
          if (rows.isEmpty)
            _emptyState(
              Icons.local_shipping_outlined,
              'No resource allocations returned.',
            )
          else
            ...rows.map((allocation) => _allocationTile(allocation)),
        ],
      ),
    );
  }

  Widget _allocationTile(Map<String, dynamic> allocation) {
    final name = _string(allocation, [
      'resourceName',
      'ResourceName',
    ], fallback: 'Resource');

    final type = _string(allocation, [
      'resourceType',
      'ResourceType',
    ], fallback: '');

    final recommended = _num(allocation, [
      'recommendedQuantity',
      'RecommendedQuantity',
    ]).toInt();

    final allocated = _num(allocation, [
      'allocatedQuantity',
      'AllocatedQuantity',
    ]).toInt();

    final priority = _string(allocation, [
      'priority',
      'Priority',
    ], fallback: 'Normal');

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          _photoBox(_photoForResource(type), 58),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: _text,
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  'Recommended $recommended ----------------------- Allocated $allocated',
                  style: const TextStyle(
                    color: _muted,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          _pill(priority, _priorityColor(priority), small: true),
        ],
      ),
    );
  }

  Color _priorityColor(String value) {
    final v = value.toLowerCase();

    if (v.contains('critical')) return _red;
    if (v.contains('high')) return const Color(0xFFEA580C);
    if (v.contains('medium')) return _orange;

    return _green;
  }

  void _showAllAllocations() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) {
        return _bottomSheet(
          title: 'All Resource Allocations',
          child: ListView.separated(
            shrinkWrap: true,
            itemCount: _allocations.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, index) {
              return _allocationTile(_allocations[index]);
            },
          ),
        );
      },
    );
  }

  // ---------------------------------------------------------------------------
  // INVENTORY + CRUD
  // ---------------------------------------------------------------------------

  Widget _inventoryCard() {
    final rows = _resources.take(7).toList();

    return _sectionCard(
      child: Column(
        children: [
          _sectionHeader(
            icon: Icons.inventory_2_rounded,
            title: 'Resource Inventory',
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${_resources.length}',
                  style: const TextStyle(
                    color: _muted,
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(width: 4),
                IconButton(
                  onPressed: () => _showResourceForm(),
                  style: IconButton.styleFrom(
                    backgroundColor: _navy,
                    foregroundColor: Colors.white,
                  ),
                  icon: const Icon(Icons.add_rounded, size: 19),
                ),
              ],
            ),
          ),
          const SizedBox(height: 9),
          if (rows.isEmpty)
            _emptyState(
              Icons.inventory_2_outlined,
              'No resources found in the live inventory.',
            )
          else
            ...rows.map((resource) => _resourceTile(resource)),
        ],
      ),
    );
  }

  Widget _resourceTile(Map<String, dynamic> resource) {
    final id = _id(resource);

    final type = _string(resource, [
      'resourceType',
      'ResourceType',
    ], fallback: '');

    final name = _string(resource, [
      'resourceName',
      'ResourceName',
    ], fallback: 'Unnamed resource');

    final available = _num(resource, [
      'availableQuantity',
      'AvailableQuantity',
    ]).toInt();

    final allocated = _num(resource, [
      'allocatedQuantity',
      'AllocatedQuantity',
    ]).toInt();

    final status = _string(resource, [
      'status',
      'Status',
    ], fallback: 'Available');

    final total = available + allocated;

    final progress = total <= 0 ? 0.0 : (available / total).clamp(0.0, 1.0);

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFD),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE7EDF5)),
      ),
      child: Row(
        children: [
          _photoBox(_photoForResource(type), 58),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: _text,
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Available $available / $total',
                  style: const TextStyle(
                    color: _muted,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 7),
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: LinearProgressIndicator(
                    value: progress,
                    minHeight: 5,
                    backgroundColor: const Color(0xFFE2EAF3),
                    valueColor: AlwaysStoppedAnimation(
                      progress > .5 ? _green : _orange,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 7),
          Column(
            children: [
              _iconAction(
                Icons.edit_rounded,
                _blue,
                id == null ? null : () => _showResourceForm(resource: resource),
              ),
              const SizedBox(height: 4),
              _iconAction(
                Icons.delete_outline_rounded,
                _red,
                id == null ? null : () => _confirmDelete(id, name),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _iconAction(IconData icon, Color color, VoidCallback? onPressed) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(9),
      child: Container(
        height: 31,
        width: 31,
        decoration: BoxDecoration(
          color: color.withValues(alpha: .09),
          borderRadius: BorderRadius.circular(9),
        ),
        child: Icon(icon, size: 16, color: onPressed == null ? _muted : color),
      ),
    );
  }

  Future<void> _confirmDelete(String id, String name) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
          ),
          title: const Text(
            'Delete Resource?',
            style: TextStyle(fontWeight: FontWeight.w900),
          ),
          content: Text(
            'This will permanently delete "$name" from the resource inventory.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(dialogContext, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: _red,
                foregroundColor: Colors.white,
              ),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (result == true) {
      await _deleteResource(id);
    }
  }

  Future<void> _showResourceForm({Map<String, dynamic>? resource}) async {
    final isEdit = resource != null;

    final typeController = TextEditingController(
      text:
          resource?['resourceType']?.toString() ??
          resource?['ResourceType']?.toString() ??
          '',
    );

    final nameController = TextEditingController(
      text:
          resource?['resourceName']?.toString() ??
          resource?['ResourceName']?.toString() ??
          '',
    );

    final availableController = TextEditingController(
      text:
          resource?['availableQuantity']?.toString() ??
          resource?['AvailableQuantity']?.toString() ??
          '0',
    );

    final allocatedController = TextEditingController(
      text:
          resource?['allocatedQuantity']?.toString() ??
          resource?['AllocatedQuantity']?.toString() ??
          '0',
    );

    final locationController = TextEditingController(
      text:
          resource?['location']?.toString() ??
          resource?['Location']?.toString() ??
          '',
    );

    final statusController = TextEditingController(
      text:
          resource?['status']?.toString() ??
          resource?['Status']?.toString() ??
          'Available',
    );

    final formKey = GlobalKey<FormState>();

    final result = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withOpacity(.45),
      builder: (dialogContext) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(dialogContext).viewInsets.bottom,
          ),
          child: Container(
            constraints: const BoxConstraints(maxHeight: 720),
            decoration: const BoxDecoration(
              color: Color(0xFFF7FAFD),
              borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
            ),
            child: SafeArea(
              top: false,
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                child: Form(
                  key: formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 42,
                          height: 5,
                          decoration: BoxDecoration(
                            color: const Color(0xFFD5DEE8),
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),

                      Row(
                        children: [
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF2563EB), Color(0xFF06B6D4)],
                              ),
                              borderRadius: BorderRadius.circular(17),
                            ),
                            child: const Icon(
                              Icons.inventory_2_rounded,
                              color: Colors.white,
                              size: 25,
                            ),
                          ),

                          const SizedBox(width: 14),

                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isEdit ? 'Edit Resource' : 'Add Resource',
                                  style: const TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFF0F2747),
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  isEdit
                                      ? 'Update live inventory details'
                                      : 'Add a resource to the live inventory',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFF71839A),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          IconButton(
                            onPressed: () => Navigator.pop(dialogContext),
                            icon: const Icon(
                              Icons.close_rounded,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 22),

                      _formField(
                        controller: typeController,
                        label: 'Resource Type',
                        icon: Icons.category_rounded,
                      ),

                      const SizedBox(height: 13),

                      _formField(
                        controller: nameController,
                        label: 'Resource Name',
                        icon: Icons.inventory_rounded,
                      ),

                      const SizedBox(height: 13),

                      Row(
                        children: [
                          Expanded(
                            child: _formField(
                              controller: availableController,
                              label: 'Available Quantity',
                              icon: Icons.check_circle_rounded,
                              number: true,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _formField(
                              controller: allocatedController,
                              label: 'Allocated Quantity',
                              icon: Icons.local_shipping_rounded,
                              number: true,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 13),

                      _formField(
                        controller: locationController,
                        label: 'Location',
                        icon: Icons.location_on_rounded,
                      ),

                      const SizedBox(height: 13),

                      _formField(
                        controller: statusController,
                        label: 'Status',
                        icon: Icons.verified_rounded,
                      ),

                      const SizedBox(height: 22),

                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFFD6E7FF)),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.info_outline_rounded,
                              color: Color(0xFF2563EB),
                              size: 20,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                isEdit
                                    ? 'Changes will be saved to the live resource inventory.'
                                    : 'This resource will be saved to the live ReliefNexus inventory.',
                                style: const TextStyle(
                                  fontSize: 11,
                                  height: 1.4,
                                  color: Color(0xFF52667F),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),

                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton(
                          onPressed: () {
                            if (!formKey.currentState!.validate()) {
                              return;
                            }

                            final available =
                                int.tryParse(availableController.text.trim()) ??
                                0;

                            final allocated =
                                int.tryParse(allocatedController.text.trim()) ??
                                0;

                            Navigator.pop(dialogContext, {
                              'resourceType': typeController.text.trim(),
                              'resourceName': nameController.text.trim(),
                              'availableQuantity': available,
                              'allocatedQuantity': allocated,
                              'location': locationController.text.trim(),
                              'status': statusController.text.trim().isEmpty
                                  ? 'Available'
                                  : statusController.text.trim(),
                            });
                          },
                          style: ElevatedButton.styleFrom(
                            elevation: 0,
                            backgroundColor: const Color(0xFF0B2A4A),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(18),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                isEdit
                                    ? Icons.save_rounded
                                    : Icons.add_circle_rounded,
                                size: 21,
                              ),
                              const SizedBox(width: 9),
                              Text(
                                isEdit ? 'Save Changes' : 'Add to Inventory',
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );

    typeController.dispose();
    nameController.dispose();
    availableController.dispose();
    allocatedController.dispose();
    locationController.dispose();
    statusController.dispose();

    if (result == null) return;

    final id = _id(resource);

    if (resource != null && id != null) {
      await _updateResource(id, result);
    } else {
      await _createResource(result);
    }
  }

  Widget _formField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool number = false,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: number ? TextInputType.number : TextInputType.text,
      validator: (value) {
        if (value == null || value.trim().isEmpty) {
          return 'Required';
        }

        if (number && int.tryParse(value.trim()) == null) {
          return 'Enter a valid number';
        }

        return null;
      },
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, size: 19),
        filled: true,
        fillColor: const Color(0xFFF7F9FC),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: const BorderSide(color: Color(0xFFE1E8F1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: const BorderSide(color: Color(0xFFE1E8F1)),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // DETAILS
  // ---------------------------------------------------------------------------

  void _showAssessmentDetails(Map<String, dynamic> assessment) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      useSafeArea: true,
      builder: (_) => Agent03AssessmentDetailsSheet(
        assessment: assessment,
        onRunAgent03: () {
          Navigator.pop(context);
          setState(() {
            _selectedAssessment = assessment;
          });
          _loadDemand(_id(assessment));
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _openAgent03Workflow();
          });
        },
      ),
    );
  }

  Widget _infoGrid(Map<String, dynamic> assessment) {
    final values = [
      [
        'Risk Score',
        _num(assessment, ['riskScore', 'RiskScore']).toString(),
      ],
      [
        'Affected Population',
        _num(assessment, [
          'affectedPopulation',
          'AffectedPopulation',
        ]).toInt().toString(),
      ],
      [
        'Vulnerability',
        _num(assessment, [
          'vulnerabilityScore',
          'VulnerabilityScore',
        ]).toString(),
      ],
      [
        'Impact',
        _num(assessment, ['impactScore', 'ImpactScore']).toString(),
      ],
      [
        'Created',
        _dateText(assessment['createdAt'] ?? assessment['CreatedAt']),
      ],
      [
        'Status',
        _string(assessment, ['status', 'Status'], fallback: 'Unknown'),
      ],
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 9,
        mainAxisSpacing: 9,
        childAspectRatio: 2.2,
      ),
      itemCount: values.length,
      itemBuilder: (_, index) {
        return Container(
          padding: const EdgeInsets.all(11),
          decoration: BoxDecoration(
            color: const Color(0xFFF7FAFE),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE5EBF3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                values[index][0],
                style: const TextStyle(
                  color: _muted,
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                values[index][1],
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: _text,
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // ---------------------------------------------------------------------------
  // COMMON UI
  // ---------------------------------------------------------------------------

  Widget _sectionCard({
    required Widget child,
    EdgeInsetsGeometry padding = const EdgeInsets.all(18),
  }) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE5EBF3)),
        boxShadow: [
          BoxShadow(
            color: _navy.withValues(alpha: .045),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }

  Widget _sectionHeader({
    required IconData icon,
    required String title,
    String? subtitle,
    Widget? trailing,
    Color color = _blue,
  }) {
    return Row(
      children: [
        Container(
          height: 39,
          width: 39,
          decoration: BoxDecoration(
            color: color.withValues(alpha: .10),
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
                style: const TextStyle(
                  color: _text,
                  fontSize: 15,
                  fontWeight: FontWeight.w900,
                ),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: _muted,
                    fontSize: 9.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ],
          ),
        ),
        if (trailing != null) trailing,
      ],
    );
  }

  Widget _pill(String text, Color color, {bool small = false}) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: small ? 7 : 10,
        vertical: small ? 4 : 6,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .10),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: small ? 8.5 : 10,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }

  Widget _photoBox(String asset, double size) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: Image.asset(
        asset,
        height: size,
        width: size,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => Container(
          height: size,
          width: size,
          color: _navy2,
          child: const Icon(
            Icons.inventory_2_rounded,
            color: Colors.white,
            size: 22,
          ),
        ),
      ),
    );
  }

  Widget _miniStat(String label, int value, {Color color = _blue}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .07),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '$label $value',
        style: TextStyle(
          color: color,
          fontSize: 8.5,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }

  Widget _detailMetric(String label, String value, {Color valueColor = _text}) {
    return Expanded(
      child: Column(
        children: [
          Text(
            label,
            style: const TextStyle(
              color: _muted,
              fontSize: 8,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            value,
            style: TextStyle(
              color: valueColor,
              fontSize: 13,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }

  Widget _emptyState(IconData icon, String text) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 25, horizontal: 15),
      child: Column(
        children: [
          Icon(icon, color: _muted, size: 34),
          const SizedBox(height: 8),
          Text(
            text,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: _muted,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _errorCard() {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: _red.withValues(alpha: .07),
        borderRadius: BorderRadius.circular(17),
        border: Border.all(color: _red.withValues(alpha: .18)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: _red),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              _error!,
              style: const TextStyle(
                color: _red,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _bottomSheet({required String title, required Widget child}) {
    return SafeArea(
      child: Container(
        constraints: const BoxConstraints(maxHeight: 720),
        padding: const EdgeInsets.fromLTRB(18, 12, 18, 20),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 42,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFD8E0EA),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 17),
              Text(
                title,
                style: const TextStyle(
                  color: _text,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 15),
              child,
            ],
          ),
        ),
      ),
    );
  }
}

class _ResourceFormSheet extends StatefulWidget {
  final Map<String, dynamic>? resource;

  const _ResourceFormSheet({required this.resource});

  @override
  State<_ResourceFormSheet> createState() => _ResourceFormSheetState();
}

class _ResourceFormSheetState extends State<_ResourceFormSheet> {
  late final TextEditingController _typeController;
  late final TextEditingController _nameController;
  late final TextEditingController _availableController;
  late final TextEditingController _allocatedController;
  late final TextEditingController _locationController;

  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  String _status = 'Available';

  bool get _isEdit => widget.resource != null;

  String _value(
    Map<String, dynamic>? data,
    List<String> keys, {
    String fallback = '',
  }) {
    if (data == null) return fallback;

    for (final key in keys) {
      final value = data[key];

      if (value != null && value.toString().trim().isNotEmpty) {
        return value.toString();
      }
    }

    return fallback;
  }

  int _number(
    Map<String, dynamic>? data,
    List<String> keys, {
    int fallback = 0,
  }) {
    if (data == null) return fallback;

    for (final key in keys) {
      final value = data[key];

      if (value is num) {
        return value.toInt();
      }

      final parsed = int.tryParse(value?.toString() ?? '');

      if (parsed != null) {
        return parsed;
      }
    }

    return fallback;
  }

  @override
  void initState() {
    super.initState();

    final resource = widget.resource;

    _typeController = TextEditingController(
      text: _value(resource, ['resourceType', 'ResourceType']),
    );

    _nameController = TextEditingController(
      text: _value(resource, ['resourceName', 'ResourceName']),
    );

    _availableController = TextEditingController(
      text: resource == null
          ? ''
          : _number(resource, [
              'availableQuantity',
              'AvailableQuantity',
            ]).toString(),
    );

    _allocatedController = TextEditingController(
      text: resource == null
          ? '0'
          : _number(resource, [
              'allocatedQuantity',
              'AllocatedQuantity',
            ]).toString(),
    );

    _locationController = TextEditingController(
      text: _value(resource, ['location', 'Location']),
    );

    final savedStatus = _value(resource, [
      'status',
      'Status',
    ], fallback: 'Available');

    if ([
      'Available',
      'Allocated',
      'Reserved',
      'Unavailable',
    ].contains(savedStatus)) {
      _status = savedStatus;
    }
  }

  @override
  void dispose() {
    _typeController.dispose();
    _nameController.dispose();
    _availableController.dispose();
    _allocatedController.dispose();
    _locationController.dispose();

    super.dispose();
  }

  void _submit() {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    final payload = <String, dynamic>{
      'resourceType': _typeController.text.trim(),
      'resourceName': _nameController.text.trim(),
      'availableQuantity': int.tryParse(_availableController.text.trim()) ?? 0,
      'allocatedQuantity': int.tryParse(_allocatedController.text.trim()) ?? 0,
      'location': _locationController.text.trim(),
      'status': _status,
    };

    FocusManager.instance.primaryFocus?.unfocus();

    Navigator.of(context).pop(payload);
  }

  @override
  Widget build(BuildContext context) {
    final keyboardHeight = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: keyboardHeight),
      child: SafeArea(
        top: false,
        child: Container(
          width: double.infinity,
          constraints: const BoxConstraints(maxHeight: 720),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: SingleChildScrollView(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 42,
                      height: 5,
                      decoration: BoxDecoration(
                        color: const Color(0xFFD6DEE8),
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),

                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEAF1FF),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(
                          Icons.inventory_2_rounded,
                          color: Color(0xFF173B78),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _isEdit ? 'Edit Resource' : 'Add Resource',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF10233F),
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () {
                          FocusManager.instance.primaryFocus?.unfocus();
                          Navigator.of(context).pop();
                        },
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  ),

                  const SizedBox(height: 18),

                  _field(
                    controller: _typeController,
                    label: 'Resource Type',
                    icon: Icons.category_rounded,
                  ),

                  const SizedBox(height: 11),

                  _field(
                    controller: _nameController,
                    label: 'Resource Name',
                    icon: Icons.inventory_2_rounded,
                  ),

                  const SizedBox(height: 11),

                  Row(
                    children: [
                      Expanded(
                        child: _field(
                          controller: _availableController,
                          label: 'Available Quantity',
                          icon: Icons.check_circle_outline_rounded,
                          number: true,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _field(
                          controller: _allocatedController,
                          label: 'Allocated Quantity',
                          icon: Icons.local_shipping_outlined,
                          number: true,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 11),

                  _field(
                    controller: _locationController,
                    label: 'Location',
                    icon: Icons.location_on_outlined,
                  ),

                  const SizedBox(height: 11),

                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF7F9FC),
                      borderRadius: BorderRadius.circular(15),
                      border: Border.all(color: const Color(0xFFE1E8F1)),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _status,
                        isExpanded: true,
                        icon: const Icon(Icons.keyboard_arrow_down_rounded),
                        items:
                            const [
                              'Available',
                              'Allocated',
                              'Reserved',
                              'Unavailable',
                            ].map((value) {
                              return DropdownMenuItem<String>(
                                value: value,
                                child: Text(value),
                              );
                            }).toList(),
                        onChanged: (value) {
                          if (value == null || !mounted) {
                            return;
                          }

                          setState(() {
                            _status = value;
                          });
                        },
                      ),
                    ),
                  ),

                  const SizedBox(height: 18),

                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF102F63),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                      ),
                      child: Text(
                        _isEdit ? 'Save Changes' : 'Add Resource',
                        style: const TextStyle(fontWeight: FontWeight.w900),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _field({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool number = false,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: number ? TextInputType.number : TextInputType.text,
      textInputAction: number ? TextInputAction.next : TextInputAction.next,
      validator: (value) {
        if (value == null || value.trim().isEmpty) {
          return 'Required';
        }

        if (number && int.tryParse(value.trim()) == null) {
          return 'Enter a valid number';
        }

        return null;
      },
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, size: 19),
        filled: true,
        fillColor: const Color(0xFFF7F9FC),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: const BorderSide(color: Color(0xFFE1E8F1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: const BorderSide(color: Color(0xFFE1E8F1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: const BorderSide(color: Color(0xFF315DA8), width: 1.5),
        ),
      ),
    );
  }
}
