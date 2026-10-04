import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import 'package:reliefnexus_mobile/core/network/api_client.dart';

class Agent03WorkflowPage extends StatefulWidget {
  final Map<String, dynamic> assessment;

  const Agent03WorkflowPage({super.key, required this.assessment});

  @override
  State<Agent03WorkflowPage> createState() => _Agent03WorkflowPageState();
}

class _Agent03WorkflowPageState extends State<Agent03WorkflowPage> {
  final ApiClient _client = ApiClient();

  int step = 1;
  bool loading = true;
  bool running = false;
  bool completed = false;

  String? error;
  dynamic optimizationResult;

  Map<String, dynamic>? demand;
  List<dynamic> resources = [];
  List<dynamic> existingAllocations = [];

  String get assessmentId =>
      '${widget.assessment['id'] ?? widget.assessment['Id'] ?? ''}';

  String _text(dynamic value, [String fallback = ' ']) {
    if (value == null) return fallback;
    final text = value.toString().trim();
    if (text.isEmpty || text == 'null') return fallback;
    return text;
  }

  double _number(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse('${value ?? 0}') ?? 0;
  }

  int _int(dynamic value) {
    return _number(value).round();
  }

  String _location() {
    return _text(
      widget.assessment['location'] ??
          widget.assessment['Location'] ??
          demand?['location'] ??
          demand?['Location'],
      'Unknown location',
    );
  }

  String _disasterType() {
    return _text(
      widget.assessment['disasterType'] ??
          widget.assessment['DisasterType'] ??
          demand?['disasterType'] ??
          demand?['DisasterType'],
      'Disaster',
    );
  }

  String _riskLevel() {
    return _text(
      widget.assessment['riskLevel'] ??
          widget.assessment['RiskLevel'] ??
          demand?['priority'] ??
          demand?['Priority'],
      'Unknown',
    );
  }

  String disasterPhotoAsset(String disaster) {
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
    if (d.contains('wildfire') || d.contains('forest fire') || d == 'fire') {
      return 'assets/images/disasters/wildfire.jpg';
    }
    if (d.contains('earthquake')) {
      return 'assets/images/disasters/earthquake.jpg';
    }
    if (d.contains('cyclone') ||
        d.contains('hurricane') ||
        d.contains('storm')) {
      return 'assets/images/disasters/cyclone.jpg';
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
    if (d.contains('volcanic') || d.contains('volcano')) {
      return 'assets/images/disasters/volcanic-eruption.jpg';
    }

    return 'assets/images/disasters/disaster_default.jpg';
  }

  String resourcePhotoAsset(String name, String type) {
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

  List<Map<String, dynamic>> _demandLines() {
    final raw =
        demand?['resources'] ??
        demand?['Resources'] ??
        demand?['resourceDemands'] ??
        demand?['ResourceDemands'] ??
        demand?['demandLines'] ??
        demand?['DemandLines'] ??
        [];

    if (raw is! List) return [];

    return raw
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  String _value(
    Map<String, dynamic> map,
    List<String> keys, [
    String fallback = ' ',
  ]) {
    for (final key in keys) {
      if (map.containsKey(key) && map[key] != null) {
        return _text(map[key], fallback);
      }
    }
    return fallback;
  }

  int _mapInt(Map<String, dynamic> map, List<String> keys) {
    for (final key in keys) {
      if (map.containsKey(key)) return _int(map[key]);
    }
    return 0;
  }

  @override
  void initState() {
    super.initState();

    debugPrint('AGENT 03: initState -> loading workflow data');

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;

      _loadWorkflowData();
    });
  }

  Future<void> _loadWorkflowData() async {
    if (assessmentId.isEmpty) {
      if (!mounted) return;

      setState(() {
        loading = false;
        error = 'No valid Agent 02 assessment was selected.';
      });

      return;
    }

    // IMPORTANT:
    // Do not block the whole Agent 03 screen while API data loads.
    // Step 1 can render immediately using the selected Agent 02 assessment.
    if (mounted) {
      setState(() {
        loading = false;
        error = null;
      });
    }

    debugPrint('AGENT 03: starting background data load');
    debugPrint('Assessment ID: $assessmentId');

    try {
      final demandFuture = _client.dio
          .get('/resource-optimization/$assessmentId/demand')
          .timeout(const Duration(seconds: 8));

      final resourcesFuture = _client.dio
          .get('/resource-optimization/resources')
          .timeout(const Duration(seconds: 8));

      final allocationsFuture = _client.dio
          .get('/resource-optimization/$assessmentId')
          .timeout(const Duration(seconds: 8));

      final results = await Future.wait([
        demandFuture,
        resourcesFuture,
        allocationsFuture,
      ]);

      if (!mounted) return;

      final demandData = results[0].data;
      final resourcesData = results[1].data;
      final allocationsData = results[2].data;

      setState(() {
        demand = demandData is Map
            ? Map<String, dynamic>.from(demandData)
            : <String, dynamic>{};

        resources = resourcesData is List
            ? List<dynamic>.from(resourcesData)
            : <dynamic>[];

        existingAllocations = allocationsData is List
            ? List<dynamic>.from(allocationsData)
            : <dynamic>[];

        loading = false;
      });

      debugPrint(
        'AGENT 03: background data loaded successfully '
        'resources=${resources.length} '
        'allocations=${existingAllocations.length}',
      );
    } on TimeoutException {
      if (!mounted) return;

      setState(() {
        loading = false;
        error =
            'Agent 03 data request timed out. '
            'The screen is still available. Pull down to retry.';
      });

      debugPrint('AGENT 03: timeout');
    } on DioException catch (e) {
      if (!mounted) return;

      final status = e.response?.statusCode;
      final message =
          e.response?.data?.toString() ??
          e.message ??
          'Unable to load Agent 03 data.';

      setState(() {
        loading = false;
        error = status != null ? 'API Error $status: $message' : message;
      });

      debugPrint('AGENT 03 Dio error: $message');
    } catch (e) {
      if (!mounted) return;

      setState(() {
        loading = false;
        error = 'Unable to load Agent 03 data: $e';
      });

      debugPrint('AGENT 03 error: $e');
    }
  }

  Future<void> _runAgent03() async {
    if (running || assessmentId.isEmpty) return;

    setState(() {
      running = true;
      error = null;
      completed = false;
      optimizationResult = null;
    });

    try {
      final response = await _client.dio.post(
        '/resource-optimization/$assessmentId/optimize',
      );

      await _loadAfterOptimization(response.data);
    } on DioException catch (e) {
      if (!mounted) return;

      setState(() {
        running = false;
        error =
            e.response?.data?.toString() ??
            e.message ??
            'Unable to load Agent 03 data.';
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        running = false;
        error = e.toString();
      });
    }
  }

  Future<void> _loadAfterOptimization(dynamic result) async {
    try {
      final allocationResponse = await _client.dio.get(
        '/resource-optimization/$assessmentId',
      );

      if (!mounted) return;

      setState(() {
        optimizationResult = result;
        existingAllocations = allocationResponse.data is List
            ? List<dynamic>.from(allocationResponse.data)
            : [];
        running = false;
        completed = true;
        step = 4;
      });
    } catch (_) {
      if (!mounted) return;

      setState(() {
        optimizationResult = result;
        running = false;
        completed = true;
        step = 4;
      });
    }
  }

  void _next() {
    if (step < 4) {
      setState(() => step++);
    }
  }

  void _back() {
    if (step > 1 && !running) {
      setState(() => step--);
    }
  }

  int get _totalRequired {
    return _demandLines().fold<int>(
      0,
      (sum, line) =>
          sum + _mapInt(line, ['requiredQuantity', 'RequiredQuantity']),
    );
  }

  int get _totalAvailable {
    return _demandLines().fold<int>(
      0,
      (sum, line) =>
          sum + _mapInt(line, ['availableQuantity', 'AvailableQuantity']),
    );
  }

  int get _totalGap {
    return _demandLines().fold<int>(
      0,
      (sum, line) => sum + _mapInt(line, ['gapQuantity', 'GapQuantity']),
    );
  }

  int get _totalAllocatable {
    return _demandLines().fold<int>(
      0,
      (sum, line) =>
          sum + _mapInt(line, ['allocatableQuantity', 'AllocatableQuantity']),
    );
  }

  double get _coverage {
    if (_totalRequired <= 0) return 0;
    return ((_totalRequired - _totalGap) / _totalRequired).clamp(0.0, 1.0);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F6FB),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF2F6FB),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        foregroundColor: const Color(0xFF142743),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: running ? null : () => Navigator.pop(context),
        ),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Agent 03',
              style: TextStyle(
                fontSize: 12,
                color: Color(0xFF6E829C),
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              'Resource Optimization',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 20,
                letterSpacing: -.3,
              ),
            ),
          ],
        ),
        actions: [SizedBox(width: 8)],
      ),
      body: loading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF086BFF)),
            )
          : RefreshIndicator(
              color: const Color(0xFF086BFF),
              onRefresh: _loadWorkflowData,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(18, 4, 18, 34),
                children: [
                  _workflowHeader(),
                  const SizedBox(height: 16),
                  if (error != null) ...[
                    _errorCard(),
                    const SizedBox(height: 14),
                  ],
                  if (step == 1) _buildStep1(),
                  if (step == 2) _buildStep2(),
                  if (step == 3) _buildStep3(),
                  if (step == 4) _buildStep4(),
                ],
              ),
            ),
    );
  }

  Widget _workflowHeader() {
    const labels = ['Overview', 'Analysis', 'Allocation', 'Confirm'];

    return Container(
      padding: const EdgeInsets.fromLTRB(14, 15, 14, 13),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF16324F).withValues(alpha: .06),
            blurRadius: 22,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: List.generate(4, (index) {
              final number = index + 1;
              final active = step == number;
              final done = step > number;

              return Expanded(
                child: Row(
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: active || done
                            ? const Color(0xFF086BFF)
                            : const Color(0xFFE7EEF7),
                        boxShadow: active
                            ? [
                                BoxShadow(
                                  color: const Color(
                                    0xFF086BFF,
                                  ).withValues(alpha: .22),
                                  blurRadius: 12,
                                ),
                              ]
                            : null,
                      ),
                      alignment: Alignment.center,
                      child: done
                          ? const Icon(
                              Icons.check_rounded,
                              color: Colors.white,
                              size: 19,
                            )
                          : Text(
                              '$number',
                              style: TextStyle(
                                color: active
                                    ? Colors.white
                                    : const Color(0xFF74859C),
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                    ),
                    if (index != 3)
                      Expanded(
                        child: Container(
                          height: 3,
                          margin: const EdgeInsets.symmetric(horizontal: 5),
                          decoration: BoxDecoration(
                            color: step > number
                                ? const Color(0xFF086BFF)
                                : const Color(0xFFE3EAF3),
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                      ),
                  ],
                ),
              );
            }),
          ),
          const SizedBox(height: 8),
          Row(
            children: List.generate(
              labels.length,
              (index) => Expanded(
                child: Text(
                  labels[index],
                  textAlign: index == 0
                      ? TextAlign.left
                      : index == 3
                      ? TextAlign.right
                      : TextAlign.center,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: step == index + 1
                        ? FontWeight.w800
                        : FontWeight.w600,
                    color: step == index + 1
                        ? const Color(0xFF086BFF)
                        : const Color(0xFF8A9AAF),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep1() {
    final location = _location();
    final disaster = _disasterType();
    final risk = _riskLevel();

    final riskScore = _number(
      widget.assessment['riskScore'] ??
          widget.assessment['RiskScore'] ??
          demand?['riskScore'] ??
          demand?['RiskScore'],
    );

    final vulnerability = _number(
      widget.assessment['vulnerabilityScore'] ??
          widget.assessment['VulnerabilityScore'] ??
          demand?['vulnerabilityScore'] ??
          demand?['VulnerabilityScore'],
    );

    final impact = _number(
      widget.assessment['impactScore'] ??
          widget.assessment['ImpactScore'] ??
          demand?['impactScore'] ??
          demand?['ImpactScore'],
    );

    final population = _number(
      widget.assessment['affectedPopulation'] ??
          widget.assessment['AffectedPopulation'] ??
          demand?['affectedPopulation'] ??
          demand?['AffectedPopulation'],
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _stepHeading(
          'STEP 1',
          'Assessment Overview',
          'Understand the incident before allocating resources.',
        ),
        const SizedBox(height: 4),
        _heroImage(
          disasterPhotoAsset(disaster),
          '$location $disaster',
          badge: risk,
        ),
        const SizedBox(height: 14),
        _miniStatusRow(location: location, disaster: disaster, priority: risk),
        const SizedBox(height: 16),
        _sectionLabel('INTELLIGENCE SNAPSHOT'),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _scoreCard(
                'Risk',
                riskScore,
                Icons.warning_amber_rounded,
                const Color(0xFFEF6C3B),
              ),
            ),
            const SizedBox(width: 9),
            Expanded(
              child: _scoreCard(
                'Vulnerability',
                vulnerability,
                Icons.shield_outlined,
                const Color(0xFF7B61FF),
              ),
            ),
          ],
        ),
        const SizedBox(height: 9),
        Row(
          children: [
            Expanded(
              child: _scoreCard(
                'Impact',
                impact,
                Icons.bolt_rounded,
                const Color(0xFF087EA4),
              ),
            ),
            const SizedBox(width: 9),
            Expanded(child: _populationCard(population)),
          ],
        ),
        const SizedBox(height: 18),
        _sectionLabel('AGENT LINEAGE'),
        const SizedBox(height: 8),
        _lineageCard(
          step: '01',
          title: 'Risk Prediction',
          subtitle: 'Agent 01 Risk Intelligence',
          icon: Icons.analytics_rounded,
          color: const Color(0xFF0B6BFF),
          status: 'SOURCE',
        ),
        const SizedBox(height: 9),
        _connector(),
        const SizedBox(height: 9),
        _lineageCard(
          step: '02',
          title: 'Vulnerability & Impact',
          subtitle: 'Agent 02 Selected assessment',
          icon: Icons.shield_rounded,
          color: const Color(0xFF7257E8),
          status: 'ACTIVE',
        ),
        const SizedBox(height: 9),
        _connector(),
        const SizedBox(height: 9),
        _lineageCard(
          step: '03',
          title: 'Resource Optimization',
          subtitle: 'Agent 03 Current workflow',
          icon: Icons.inventory_2_rounded,
          color: const Color(0xFF087EA4),
          status: 'NEXT',
        ),
        const SizedBox(height: 20),
        _primaryButton(
          'Continue to Resource Analysis',
          Icons.arrow_forward_rounded,
          _next,
        ),
      ],
    );
  }

  Widget _buildStep2() {
    final lines = _demandLines();
    final affected = _text(
      demand?['affectedPopulation'] ?? demand?['AffectedPopulation'],
      '0',
    );
    final severity = _number(
      demand?['severityIndex'] ?? demand?['SeverityIndex'],
    );
    final priority = _text(
      demand?['priority'] ?? demand?['Priority'],
      _riskLevel(),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _stepHeading(
          'STEP 2',
          'Resource Analysis',
          'Compare predicted demand against real inventory.',
        ),
        const SizedBox(height: 4),
        _analysisBanner(
          affected: affected,
          severity: severity,
          priority: priority,
        ),
        const SizedBox(height: 16),
        _sectionLabel('DEMAND COVERAGE'),
        const SizedBox(height: 8),
        _coverageOverview(),
        const SizedBox(height: 18),
        Row(
          children: [
            const Expanded(
              child: Text(
                'Resource Demand',
                style: TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF142743),
                ),
              ),
            ),
            _countBadge(lines.length),
          ],
        ),
        const SizedBox(height: 8),
        if (lines.isEmpty)
          _emptyCard(
            Icons.inventory_2_outlined,
            'No resource demand records returned by the backend.',
          ),
        ...lines.asMap().entries.map(
          (entry) => _demandCard(entry.value, index: entry.key),
        ),
        const SizedBox(height: 10),
        _dataAuthorityNote(
          title: 'Backend Demand Model',
          text:
              'Demand values shown here come from the Agent 03 backend '
              'assessment. Inventory is read-only at this stage.',
        ),
        const SizedBox(height: 18),
        _navigationButtons(back: _back, next: _next),
      ],
    );
  }

  Widget _buildStep3() {
    final lines = _demandLines();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _stepHeading(
          'STEP 3',
          'Allocation Plan',
          'Review the planned coverage before execution.',
        ),
        const SizedBox(height: 4),
        _allocationSummary(),
        const SizedBox(height: 18),
        _sectionLabel('RESOURCE ALLOCATION PLAN'),
        const SizedBox(height: 8),
        if (lines.isEmpty)
          _emptyCard(
            Icons.assignment_outlined,
            'No demand lines are available for planning.',
          ),
        ...lines.map(_allocationPlanCard),
        const SizedBox(height: 8),
        _dataAuthorityNote(
          title: 'Server Authority',
          text:
              'This screen is a planning view only. The backend rechecks '
              'real inventory and performs the actual allocation.',
        ),
        const SizedBox(height: 18),
        _navigationButtons(back: _back, next: _next),
      ],
    );
  }

  Widget _buildStep4() {
    if (completed) {
      return _buildCompletedState();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _stepHeading(
          'STEP 4',
          'Confirmation',
          'Verify the live plan before running Agent 03.',
        ),
        const SizedBox(height: 4),
        _heroImage(
          disasterPhotoAsset(_disasterType()),
          '${_location()} ${_disasterType()}',
          badge: _riskLevel(),
        ),
        const SizedBox(height: 16),
        _confirmationDashboard(),
        const SizedBox(height: 16),
        _sectionLabel('EXECUTION CHECKLIST'),
        const SizedBox(height: 8),
        _checkRow('Agent 02 assessment selected', assessmentId.isNotEmpty),
        _checkRow('Demand analysis loaded', _demandLines().isNotEmpty),
        _checkRow('Backend inventory reviewed', true),
        _checkRow('Actual allocation will be server-side', true),
        const SizedBox(height: 16),
        _warningPanel(),
        const SizedBox(height: 18),
        _navigationButtons(back: _back, next: null),
        const SizedBox(height: 10),
        _runButton(),
      ],
    );
  }

  Widget _buildCompletedState() {
    final allocated = existingAllocations.fold<int>(0, (sum, item) {
      if (item is! Map) return sum;
      final map = Map<String, dynamic>.from(item);
      return sum +
          _mapInt(map, [
            'allocatedQuantity',
            'AllocatedQuantity',
            'recommendedQuantity',
            'RecommendedQuantity',
          ]);
    });

    final gaps = existingAllocations.fold<int>(0, (sum, item) {
      if (item is! Map) return sum;
      final map = Map<String, dynamic>.from(item);
      return sum + _mapInt(map, ['gapQuantity', 'GapQuantity']);
    });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _successHero(),
        const SizedBox(height: 16),
        _sectionLabel('AGENT 03 RESULT'),
        const SizedBox(height: 8),
        _resultKpiGrid(
          allocated: allocated,
          gap: gaps,
          records: existingAllocations.length,
        ),
        const SizedBox(height: 18),
        _sectionLabel('ACTUAL BACKEND ALLOCATIONS'),
        const SizedBox(height: 8),
        if (existingAllocations.isEmpty)
          _emptyCard(
            Icons.info_outline_rounded,
            'Agent 03 completed, but no allocation records were returned.',
          ),
        ...existingAllocations.map(_actualAllocationCard),
        const SizedBox(height: 18),
        _primaryButton(
          'Done Return to Resource Optimization',
          Icons.check_circle_outline_rounded,
          () => Navigator.pop(context, true),
        ),
      ],
    );
  }

  Widget _stepHeading(String label, String title, String subtitle) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          decoration: BoxDecoration(
            color: const Color(0xFFE7F0FF),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            label,
            style: const TextStyle(
              color: Color(0xFF086BFF),
              fontSize: 11,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: Color(0xFF142743),
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -.4,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                subtitle,
                style: const TextStyle(
                  color: Color(0xFF74869D),
                  fontSize: 12,
                  height: 1.35,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _sectionLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: Color(0xFF7B8CA2),
        fontSize: 10,
        fontWeight: FontWeight.w900,
        letterSpacing: 1.15,
      ),
    );
  }

  Widget _heroImage(String asset, String title, {required String badge}) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(25),
      child: Stack(
        children: [
          SizedBox(
            height: 224,
            width: double.infinity,
            child: Image.asset(
              asset,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) {
                return Container(
                  color: const Color(0xFF0B2E49),
                  alignment: Alignment.center,
                  child: const Icon(
                    Icons.image_not_supported_outlined,
                    color: Colors.white,
                    size: 48,
                  ),
                );
              },
            ),
          ),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: .02),
                    Colors.black.withValues(alpha: .76),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            left: 17,
            top: 16,
            child: _heroBadge('AGENT 03', Icons.auto_awesome_rounded),
          ),
          Positioned(right: 17, top: 16, child: _heroRiskBadge(badge)),
          Positioned(
            left: 18,
            right: 18,
            bottom: 17,
            child: Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w900,
                letterSpacing: -.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _heroBadge(String text, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: .32),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: .25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 13),
          const SizedBox(width: 5),
          Text(
            text,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 9,
              fontWeight: FontWeight.w900,
              letterSpacing: .8,
            ),
          ),
        ],
      ),
    );
  }

  Widget _heroRiskBadge(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: .94),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xFFD14B28),
          fontSize: 10,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }

  Widget _miniStatusRow({
    required String location,
    required String disaster,
    required String priority,
  }) {
    return Row(
      children: [
        Expanded(child: _statusChip(Icons.location_on_outlined, location)),
        const SizedBox(width: 7),
        Expanded(child: _statusChip(Icons.public_rounded, disaster)),
        const SizedBox(width: 7),
        _priorityPill(priority),
      ],
    );
  }

  Widget _statusChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: const Color(0xFFE0E8F1)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 15, color: const Color(0xFF086BFF)),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              text,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFF344A66),
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _priorityPill(String value) {
    final high = value.toLowerCase().contains('high');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 10),
      decoration: BoxDecoration(
        color: high ? const Color(0xFFFFEFE8) : const Color(0xFFEAF4FF),
        borderRadius: BorderRadius.circular(13),
      ),
      child: Text(
        value,
        style: TextStyle(
          color: high ? const Color(0xFFD85A2F) : const Color(0xFF086BFF),
          fontSize: 10,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }

  Widget _scoreCard(String title, double score, IconData icon, Color accent) {
    final value = score.clamp(0, 100).toDouble();

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(19),
        border: Border.all(color: const Color(0xFFE3EAF2)),
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
                  color: accent.withValues(alpha: .10),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(icon, size: 18, color: accent),
              ),
              const Spacer(),
              Text(
                '${value.toStringAsFixed(1)}',
                style: const TextStyle(
                  color: Color(0xFF142743),
                  fontSize: 19,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: const TextStyle(
              color: Color(0xFF71839A),
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 7),
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: LinearProgressIndicator(
              value: value / 100,
              minHeight: 5,
              backgroundColor: const Color(0xFFEDF2F7),
              valueColor: AlwaysStoppedAnimation<Color>(accent),
            ),
          ),
        ],
      ),
    );
  }

  Widget _populationCard(double population) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF082F49),
        borderRadius: BorderRadius.circular(19),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.groups_rounded, color: Color(0xFF9ED8FF), size: 19),
              Spacer(),
              Icon(
                Icons.arrow_upward_rounded,
                color: Color(0xFF72C8FF),
                size: 17,
              ),
            ],
          ),
          const SizedBox(height: 11),
          Text(
            _formatNumber(population.round()),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 19,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 3),
          const Text(
            'Affected population',
            style: TextStyle(
              color: Color(0xFFAFC4D7),
              fontSize: 10,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _lineageCard({
    required String step,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required String status,
  }) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E9F2)),
      ),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: color.withValues(alpha: .10),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AGENT $step',
                  style: TextStyle(
                    color: color,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF182B46),
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Color(0xFF78899E),
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
          _smallTag(status, color),
        ],
      ),
    );
  }

  Widget _connector() {
    return Padding(
      padding: const EdgeInsets.only(left: 22),
      child: Container(height: 10, width: 1.5, color: const Color(0xFFB8C8D9)),
    );
  }

  Widget _smallTag(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 8,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }

  Widget _analysisBanner({
    required String affected,
    required double severity,
    required String priority,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF072F49), Color(0xFF0A4665)],
        ),
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF082F49).withValues(alpha: .18),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(child: _darkKpi('AFFECTED', affected, Icons.groups_rounded)),
          _verticalDivider(),
          Expanded(
            child: _darkKpi(
              'SEVERITY',
              severity.toStringAsFixed(1),
              Icons.speed_rounded,
            ),
          ),
          _verticalDivider(),
          Expanded(
            child: _darkKpi('PRIORITY', priority, Icons.priority_high_rounded),
          ),
        ],
      ),
    );
  }

  Widget _darkKpi(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: const Color(0xFF8DD7FF), size: 19),
        const SizedBox(height: 7),
        Text(
          value,
          textAlign: TextAlign.center,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFFA7BDCF),
            fontSize: 8,
            fontWeight: FontWeight.w800,
            letterSpacing: .7,
          ),
        ),
      ],
    );
  }

  Widget _verticalDivider() {
    return Container(
      width: 1,
      height: 42,
      color: Colors.white.withValues(alpha: .14),
    );
  }

  Widget _coverageOverview() {
    final percent = (_coverage * 100).clamp(0, 100);
    final complete = percent >= 99.9;
    final partial = percent > 0 && percent < 99.9;

    final color = complete
        ? const Color(0xFF159570)
        : partial
        ? const Color(0xFFDB8A12)
        : const Color(0xFFD64C35);

    final status = complete
        ? 'FULL COVERAGE'
        : partial
        ? 'PARTIAL COVERAGE'
        : 'INSUFFICIENT STOCK';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE1E9F2)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: .10),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  complete
                      ? Icons.check_circle_outline_rounded
                      : Icons.warning_amber_rounded,
                  color: color,
                ),
              ),
              const SizedBox(width: 11),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Inventory Coverage',
                      style: TextStyle(
                        color: Color(0xFF172A45),
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Predicted requirement vs real stock',
                      style: TextStyle(color: Color(0xFF8291A4), fontSize: 10),
                    ),
                  ],
                ),
              ),
              Text(
                '${percent.toStringAsFixed(0)}%',
                style: TextStyle(
                  color: color,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 13),
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: LinearProgressIndicator(
              value: _coverage,
              minHeight: 8,
              backgroundColor: const Color(0xFFEDF2F6),
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _tinyStat('Required', _formatNumber(_totalRequired)),
              _tinyStat('Available', _formatNumber(_totalAvailable)),
              _tinyStat('Gap', _formatNumber(_totalGap)),
              _tinyStat('Status', status),
            ],
          ),
        ],
      ),
    );
  }

  Widget _tinyStat(String label, String value) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFF8796A9),
              fontSize: 8,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF253B57),
              fontSize: 10,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }

  Widget _demandCard(Map<String, dynamic> map, {required int index}) {
    final name = _value(map, [
      'resourceName',
      'ResourceName',
      'resourceType',
      'ResourceType',
    ], 'Resource');

    final type = _value(map, ['resourceType', 'ResourceType'], '');

    final required = _mapInt(map, ['requiredQuantity', 'RequiredQuantity']);

    final available = _mapInt(map, ['availableQuantity', 'AvailableQuantity']);

    final allocatable = _mapInt(map, [
      'allocatableQuantity',
      'AllocatableQuantity',
    ]);

    final gap = _mapInt(map, ['gapQuantity', 'GapQuantity']);

    final coverage = required <= 0
        ? 1.0
        : (available / required).clamp(0.0, 1.0);

    final full = gap <= 0;
    final partial = !full && available > 0;

    final statusColor = full
        ? const Color(0xFF159570)
        : partial
        ? const Color(0xFFD88916)
        : const Color(0xFFD64C35);

    final status = full
        ? 'COVERED'
        : partial
        ? 'PARTIAL'
        : 'SHORTAGE';

    return Container(
      margin: const EdgeInsets.only(bottom: 11),
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E9F1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: .025),
            blurRadius: 12,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.asset(
                  resourcePhotoAsset(name, type),
                  width: 70,
                  height: 70,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) {
                    return Container(
                      width: 70,
                      height: 70,
                      color: const Color(0xFFEAF2FF),
                      child: const Icon(
                        Icons.inventory_2_outlined,
                        color: Color(0xFF086BFF),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            name,
                            style: const TextStyle(
                              color: Color(0xFF172B4D),
                              fontWeight: FontWeight.w900,
                              fontSize: 14,
                            ),
                          ),
                        ),
                        _smallStatus(status, statusColor),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      type.isEmpty ? 'Resource requirement' : type,
                      style: const TextStyle(
                        color: Color(0xFF8191A5),
                        fontSize: 10,
                      ),
                    ),
                    const SizedBox(height: 9),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: LinearProgressIndicator(
                        value: coverage,
                        minHeight: 5,
                        backgroundColor: const Color(0xFFEDF2F6),
                        valueColor: AlwaysStoppedAnimation<Color>(statusColor),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFF6F9FC),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                _resourceMetric('Required', _formatNumber(required)),
                _resourceMetric('Available', _formatNumber(available)),
                _resourceMetric('Allocatable', _formatNumber(allocatable)),
                _resourceMetric('Gap', _formatNumber(gap), danger: gap > 0),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _resourceMetric(String label, String value, {bool danger = false}) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFF8A99AB),
              fontSize: 8,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: danger ? const Color(0xFFD64C35) : const Color(0xFF253B57),
              fontSize: 11,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }

  Widget _smallStatus(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .09),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 7.5,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }

  Widget _allocationSummary() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF082F49), Color(0xFF0A5374)],
        ),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Planned Resource Coverage',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: .10),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: const Text(
                  'BACKEND AUTHORITY',
                  style: TextStyle(
                    color: Color(0xFFA8DFFF),
                    fontSize: 7,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _darkSummary('REQUIRED', _formatNumber(_totalRequired)),
              _darkSummary('AVAILABLE', _formatNumber(_totalAvailable)),
              _darkSummary('ALLOCATABLE', _formatNumber(_totalAllocatable)),
              _darkSummary('GAP', _formatNumber(_totalGap)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _darkSummary(String label, String value) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFFA8BDCE),
              fontSize: 7,
              fontWeight: FontWeight.w800,
              letterSpacing: .5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _allocationPlanCard(Map<String, dynamic> map) {
    final name = _value(map, [
      'resourceName',
      'ResourceName',
      'resourceType',
      'ResourceType',
    ], 'Resource');

    final type = _value(map, ['resourceType', 'ResourceType'], '');

    final required = _mapInt(map, ['requiredQuantity', 'RequiredQuantity']);

    final available = _mapInt(map, ['availableQuantity', 'AvailableQuantity']);

    final allocatable = _mapInt(map, [
      'allocatableQuantity',
      'AllocatableQuantity',
    ]);

    final gap = _mapInt(map, ['gapQuantity', 'GapQuantity']);

    final recommended = allocatable > 0
        ? allocatable
        : available < required
        ? available
        : required;

    final location = _value(map, ['location', 'Location'], _location());

    return Container(
      margin: const EdgeInsets.only(bottom: 11),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE0E8F1)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.asset(
                  resourcePhotoAsset(name, type),
                  width: 52,
                  height: 52,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) {
                    return Container(
                      width: 52,
                      height: 52,
                      color: const Color(0xFFEAF2FF),
                      child: const Icon(
                        Icons.inventory_2_outlined,
                        color: Color(0xFF086BFF),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        color: Color(0xFF172B4D),
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_outlined,
                          size: 12,
                          color: Color(0xFF8A9AAD),
                        ),
                        const SizedBox(width: 3),
                        Expanded(
                          child: Text(
                            location,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Color(0xFF8191A5),
                              fontSize: 9,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              _smallStatus(
                gap <= 0 ? 'READY' : 'GAP',
                gap <= 0 ? const Color(0xFF159570) : const Color(0xFFD64C35),
              ),
            ],
          ),
          const SizedBox(height: 13),
          _planGrid(
            required: required,
            available: available,
            recommended: recommended,
            gap: gap,
          ),
        ],
      ),
    );
  }

  Widget _planGrid({
    required int required,
    required int available,
    required int recommended,
    required int gap,
  }) {
    return Row(
      children: [
        _planValue('Required', required),
        _planValue('Available', available),
        _planValue('Recommended', recommended, accent: const Color(0xFF087EA4)),
        _planValue(
          'Gap',
          gap,
          accent: gap > 0 ? const Color(0xFFD64C35) : const Color(0xFF159570),
        ),
      ],
    );
  }

  Widget _planValue(String label, int value, {Color? accent}) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.only(right: 5),
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 9),
        decoration: BoxDecoration(
          color: const Color(0xFFF6F9FC),
          borderRadius: BorderRadius.circular(11),
        ),
        child: Column(
          children: [
            Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFF8494A7),
                fontSize: 7,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              _formatNumber(value),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: accent ?? const Color(0xFF253B57),
                fontSize: 11,
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _confirmationDashboard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE0E8F1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: .035),
            blurRadius: 18,
            offset: const Offset(0, 7),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F3FF),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: const Icon(
                  Icons.rocket_launch_rounded,
                  color: Color(0xFF086BFF),
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Ready to Run Agent 03',
                      style: TextStyle(
                        color: Color(0xFF172B4D),
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'Final review of live backend planning data.',
                      style: TextStyle(color: Color(0xFF7C8EA3), fontSize: 10),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 15),
          _confirmationRow(
            Icons.location_on_outlined,
            'Assessment',
            _location(),
          ),
          _confirmationRow(Icons.public_rounded, 'Disaster', _disasterType()),
          _confirmationRow(
            Icons.priority_high_rounded,
            'Priority',
            _riskLevel(),
          ),
          _confirmationRow(
            Icons.inventory_2_outlined,
            'Resource lines',
            '${_demandLines().length}',
          ),
          const Divider(height: 20),
          Row(
            children: [
              _confirmMetric('REQUIRED', _formatNumber(_totalRequired)),
              _confirmMetric('ALLOCATABLE', _formatNumber(_totalAllocatable)),
              _confirmMetric(
                'GAP',
                _formatNumber(_totalGap),
                danger: _totalGap > 0,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _confirmationRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        children: [
          Icon(icon, size: 17, color: const Color(0xFF6C83A0)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: Color(0xFF7C8EA3),
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFF243A57),
                fontSize: 11,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _confirmMetric(String label, String value, {bool danger = false}) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              color: danger ? const Color(0xFFD64C35) : const Color(0xFF086BFF),
              fontSize: 16,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFF8291A4),
              fontSize: 7,
              fontWeight: FontWeight.w800,
              letterSpacing: .5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _checkRow(String text, bool ok) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE3EAF2)),
      ),
      child: Row(
        children: [
          Icon(
            ok
                ? Icons.check_circle_rounded
                : Icons.radio_button_unchecked_rounded,
            color: ok ? const Color(0xFF159570) : const Color(0xFF9AA8B8),
            size: 19,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: Color(0xFF344A66),
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _warningPanel() {
    final hasGap = _totalGap > 0;

    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: hasGap ? const Color(0xFFFFF7E9) : const Color(0xFFEAF8F3),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: hasGap ? const Color(0xFFFFDE9B) : const Color(0xFFB9E6D6),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            hasGap ? Icons.warning_amber_rounded : Icons.verified_rounded,
            color: hasGap ? const Color(0xFFB87910) : const Color(0xFF159570),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              hasGap
                  ? 'There are ${_formatNumber(_totalGap)} units of '
                        'predicted demand not currently covered by inventory. '
                        'Agent 03 will allocate only real available stock.'
                  : 'Current inventory covers the predicted demand. '
                        'Agent 03 will still recheck stock on the server before allocation.',
              style: TextStyle(
                color: hasGap
                    ? const Color(0xFF75520C)
                    : const Color(0xFF12664F),
                fontSize: 11,
                height: 1.4,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _runButton() {
    return SizedBox(
      width: double.infinity,
      height: 58,
      child: ElevatedButton.icon(
        onPressed: running ? null : _runAgent03,
        icon: running
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2.4,
                  color: Colors.white,
                ),
              )
            : const Icon(Icons.auto_awesome_rounded),
        label: Text(running ? 'Running Agent 03...' : 'Confirm & Run Agent 03'),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF062B45),
          foregroundColor: Colors.white,
          disabledBackgroundColor: const Color(0xFF7890A3),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
        ),
      ),
    );
  }

  Widget _successHero() {
    return Container(
      padding: const EdgeInsets.all(19),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF075C48), Color(0xFF159570)],
        ),
        borderRadius: BorderRadius.circular(25),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF159570).withValues(alpha: .20),
            blurRadius: 22,
            offset: const Offset(0, 9),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: .14),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_rounded,
              color: Colors.white,
              size: 32,
            ),
          ),
          const SizedBox(width: 13),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Agent 03 Completed',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 19,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Optimization was executed against the backend.',
                  style: TextStyle(
                    color: Color(0xFFC4EEE2),
                    fontSize: 10,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _resultKpiGrid({
    required int allocated,
    required int gap,
    required int records,
  }) {
    return Row(
      children: [
        Expanded(
          child: _resultCard(
            'Allocated',
            _formatNumber(allocated),
            Icons.inventory_rounded,
            const Color(0xFF159570),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _resultCard(
            'Gap',
            _formatNumber(gap),
            Icons.warning_amber_rounded,
            const Color(0xFFD64C35),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _resultCard(
            'Records',
            '$records',
            Icons.receipt_long_rounded,
            const Color(0xFF086BFF),
          ),
        ),
      ],
    );
  }

  Widget _resultCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 13),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(17),
        border: Border.all(color: const Color(0xFFE1E9F2)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 19),
          const SizedBox(height: 7),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: color,
              fontSize: 14,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFF8393A6),
              fontSize: 8,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _actualAllocationCard(dynamic item) {
    if (item is! Map) return const SizedBox.shrink();

    final map = Map<String, dynamic>.from(item);

    final name = _value(map, [
      'resourceName',
      'ResourceName',
      'resourceType',
      'ResourceType',
    ], 'Resource');

    final recommended = _mapInt(map, [
      'recommendedQuantity',
      'RecommendedQuantity',
    ]);

    final available = _mapInt(map, ['availableQuantity', 'AvailableQuantity']);

    final allocated = _mapInt(map, ['allocatedQuantity', 'AllocatedQuantity']);

    final remaining = _mapInt(map, ['remainingQuantity', 'RemainingQuantity']);

    final gap = _mapInt(map, ['gapQuantity', 'GapQuantity']);

    final status = _value(map, [
      'status',
      'Status',
    ], gap > 0 ? 'Partial' : 'Allocated');

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(19),
        border: Border.all(color: const Color(0xFFE1E9F2)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF4FF),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.inventory_2_rounded,
                  color: Color(0xFF086BFF),
                  size: 19,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  name,
                  style: const TextStyle(
                    color: Color(0xFF172B4D),
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                  ),
                ),
              ),
              _smallStatus(
                status.toUpperCase(),
                gap > 0 ? const Color(0xFFD64C35) : const Color(0xFF159570),
              ),
            ],
          ),
          const SizedBox(height: 11),
          Row(
            children: [
              _resourceMetric('Recommended', _formatNumber(recommended)),
              _resourceMetric('Available', _formatNumber(available)),
              _resourceMetric('Allocated', _formatNumber(allocated)),
              _resourceMetric('Remaining', _formatNumber(remaining)),
            ],
          ),
          if (gap > 0) ...[
            const SizedBox(height: 9),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF1ED),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                'Outstanding gap: ${_formatNumber(gap)} units',
                style: const TextStyle(
                  color: Color(0xFFD64C35),
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _dataAuthorityNote({required String title, required String text}) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: const Color(0xFFEAF4FB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFCFE5F4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.cloud_done_outlined,
            color: Color(0xFF087EA4),
            size: 19,
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF075B78),
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  text,
                  style: const TextStyle(
                    color: Color(0xFF55788C),
                    fontSize: 9,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _emptyCard(IconData icon, String message) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE1E9F2)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 30, color: const Color(0xFF8A9AAD)),
          const SizedBox(height: 9),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF71839A),
              fontSize: 11,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _countBadge(int count) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFE8F1FF),
        borderRadius: BorderRadius.circular(9),
      ),
      child: Text(
        '$count resources',
        style: const TextStyle(
          color: Color(0xFF086BFF),
          fontSize: 9,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }

  Widget _errorCard() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF0F0),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFFCACA)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error_outline_rounded, color: Color(0xFFB42318)),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              error!,
              style: const TextStyle(
                color: Color(0xFFB42318),
                fontWeight: FontWeight.w700,
                fontSize: 11,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _navigationButtons({
    required VoidCallback back,
    required VoidCallback? next,
  }) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: step == 1 || running ? null : back,
            icon: const Icon(Icons.arrow_back_rounded, size: 18),
            label: const Text('Back'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF17324D),
              backgroundColor: Colors.white,
              minimumSize: const Size.fromHeight(52),
              side: const BorderSide(color: Color(0xFFD3DDE8)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
              ),
              textStyle: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 12,
              ),
            ),
          ),
        ),
        if (next != null) ...[
          const SizedBox(width: 9),
          Expanded(
            flex: 2,
            child: ElevatedButton.icon(
              onPressed: running ? null : next,
              icon: const Icon(Icons.arrow_forward_rounded, size: 18),
              label: const Text('Continue'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF062B45),
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(52),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(15),
                ),
                textStyle: const TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _primaryButton(String text, IconData icon, VoidCallback onPressed) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon),
        label: Text(text),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF062B45),
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(17),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
        ),
      ),
    );
  }

  String _formatNumber(int value) {
    final raw = value.toString();
    final chars = raw.split('');
    final buffer = StringBuffer();

    for (var i = 0; i < chars.length; i++) {
      if (i > 0 && (chars.length - i) % 3 == 0) {
        buffer.write(',');
      }
      buffer.write(chars[i]);
    }

    return buffer.toString();
  }
}
