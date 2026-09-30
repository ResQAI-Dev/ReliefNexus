import 'package:flutter/material.dart';
import '../../../risk_predictions/data/models/risk_prediction_model.dart';
import '../../../risk_predictions/presentation/screens/risk_prediction_details_screen.dart';
import '../../../risk_predictions/presentation/providers/risk_predictions_provider.dart';

import '../../../../core/network/api_client.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../../data/models/disaster_report_model.dart';
import '../providers/disaster_reports_provider.dart';
import 'disaster_report_process_screen.dart';
import '../widgets/disaster_report_widgets.dart';

const _navy = Color(0xFF06152F);
const _blue = Color(0xFF38BDF8);
const _red = Color(0xFFFF5570);
const _orange = Color(0xFFFF9B45);
const _green = Color(0xFF16B77A);
const _muted = Color(0xFF71809B);
const _bg = Color(0xFFF1F6FB);
const _line = Color(0xFFD8E5F0);

class DisasterReportsPage extends StatelessWidget {
  const DisasterReportsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => DisasterReportsProvider()..load(),
      child: const _DisasterReportsView(),
    );
  }
}

class _DisasterReportsView extends StatelessWidget {
  const _DisasterReportsView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: RefreshIndicator(
          color: _blue,
          onRefresh: () => context.read<DisasterReportsProvider>().load(),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(child: _Header()),
              SliverToBoxAdapter(child: _Hero()),
              SliverToBoxAdapter(child: _Kpis()),
              SliverToBoxAdapter(child: _Filters()),
              const SliverToBoxAdapter(child: _DisasterReportsMap()),
              Consumer<DisasterReportsProvider>(
                builder: (context, p, _) {
                  if (p.loading && p.items.isEmpty) {
                    return const SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(child: CircularProgressIndicator()),
                    );
                  }

                  if (p.error != null && p.items.isEmpty) {
                    return SliverFillRemaining(
                      hasScrollBody: false,
                      child: _ErrorState(message: p.error!, onRetry: p.load),
                    );
                  }

                  if (p.filtered.isEmpty) {
                    return const SliverFillRemaining(
                      hasScrollBody: false,
                      child: _EmptyState(),
                    );
                  }

                  return SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                    sliver: SliverList.builder(
                      itemCount: p.filtered.length,
                      itemBuilder: (_, i) {
                        final item = p.filtered[i];

                        return PremiumDisasterReportCard(
                          item: item,
                          onViewDetails: () {
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (_) => ChangeNotifierProvider.value(
                                value: context.read<DisasterReportsProvider>(),
                                child: FractionallySizedBox(
                                  heightFactor: .94,
                                  child: _ReportDetails(item: item),
                                ),
                              ),
                            );
                          },
                        );
                      },
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Agent01PredictionsSection extends StatefulWidget {
  const _Agent01PredictionsSection();

  @override
  State<_Agent01PredictionsSection> createState() =>
      _Agent01PredictionsSectionState();
}

class _Agent01PredictionsSectionState
    extends State<_Agent01PredictionsSection> {
  final ApiClient _client = ApiClient();
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Map<String, dynamic>>> _load() async {
    final response = await _client.dio.get('/risk-predictions/history');
    final data = response.data;

    final dynamic raw = data is List
        ? data
        : (data is Map
            ? (data['items'] ??
                data['data'] ??
                data['results'] ??
                <dynamic>[])
            : <dynamic>[]);

    final List<dynamic> items = raw is List ? raw : <dynamic>[];

    final flattened = <Map<String, dynamic>>[];

    for (final item in items) {
      if (item is! Map) continue;

      final parent = Map<String, dynamic>.from(item);
      final dynamic nested = parent['disasterRisks'];

      if (nested is List && nested.isNotEmpty) {
        for (final risk in nested) {
          if (risk is! Map) continue;

          final row = <String, dynamic>{
            ...parent,
            ...Map<String, dynamic>.from(risk),
            'id': parent['id'],
            'riskPredictionId': parent['id'],
            'location': risk['location'] ?? parent['location'],
            'latitude': risk['latitude'] ?? parent['latitude'],
            'longitude': risk['longitude'] ?? parent['longitude'],
            'createdAt': risk['createdAt'] ?? parent['createdAt'],
          };

          flattened.add(row);
        }
      } else {
        flattened.add(parent);
      }
    }

    final seen = <String>{};

    return flattened.where((row) {
      final type =
          row['disasterType']?.toString().trim().toLowerCase() ?? '';
      final location =
          row['location']?.toString().trim().toLowerCase() ?? '';
      final key = "$type|$location|${row['riskPredictionId'] ?? row['id']}";

      if (type.isEmpty || seen.contains(key)) {
        return false;
      }

      seen.add(key);
      return true;
    }).toList();
  }
  String _text(dynamic value, String fallback) {
    final v = value?.toString().trim() ?? '';
    return v.isEmpty ? fallback : v;
  }

  String _confidence(dynamic value) {
    if (value == null) return 'N/A';
    final n = double.tryParse(value.toString());
    if (n == null) return value.toString();
    final p = n <= 1 ? n * 100 : n;
    return '%';
  }

  String _score(dynamic value) {
    if (value == null) return 'N/A';
    final n = double.tryParse(value.toString());
    if (n == null) return value.toString();
    return n % 1 == 0 ? n.toInt().toString() : n.toStringAsFixed(1);
  }

  String _photo(String disaster) {
    final v = disaster.toLowerCase();
    if (v.contains('drought')) return 'assets/images/disasters/drought.jpg';
    if (v.contains('flood')) return 'assets/images/disasters/flood.jpg';
    if (v.contains('landslide')) return 'assets/images/disasters/landslide.jpg';
    if (v.contains('earthquake'))
      return 'assets/images/disasters/earthquake.jpg';
    if (v.contains('cyclone') || v.contains('storm'))
      return 'assets/images/disasters/cyclone.jpg';
    if (v.contains('wildfire') || v.contains('fire'))
      return 'assets/images/disasters/wildfire.jpg';
    if (v.contains('tsunami')) return 'assets/images/disasters/tsunami.jpg';
    if (v.contains('avalanche')) return 'assets/images/disasters/avalanche.jpg';
    if (v.contains('lightning')) return 'assets/images/disasters/lightning.jpg';
    if (v.contains('volcan'))
      return 'assets/images/disasters/volcanic-eruption.jpg';
    return 'assets/images/disasters/disaster_default.jpg';
  }

  Color _riskColor(String level) {
    switch (level.toLowerCase()) {
      case 'critical':
        return const Color(0xFFD92D4F);
      case 'high':
        return const Color(0xFFE56B2F);
      case 'medium':
        return const Color(0xFFE39B17);
      case 'low':
        return const Color(0xFF16A673);
      default:
        return const Color(0xFF0288D1);
    }
  }

  List<String> _list(dynamic value) {
    if (value is List)
      return value
          .map((e) => e.toString())
          .where((e) => e.trim().isNotEmpty)
          .toList();
    if (value is String && value.trim().isNotEmpty)
      return value
          .split(RegExp(r'[,;]'))
          .map((e) => e.trim())
          .where((e) => e.isNotEmpty)
          .toList();
    return <String>[];
  }

  void _showDetails(Map<String, dynamic> p) {
    final disaster = _text(p['disasterType'], 'Unknown hazard');
    final location = _text(p['location'], 'Unknown location');
    final level = _text(p['riskLevel'], 'Unknown');
    final score = _score(p['riskScore']);
    final confidence = _confidence(p['confidence']);
    final factors = _list(p['riskFactors']);
    final recommendations = _list(p['recommendations']);
    final risks = _list(p['disasterRisks']);
    final photo = _photo(disaster);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: .82,
        minChildSize: .55,
        maxChildSize: .96,
        builder: (_, controller) => Container(
          decoration: const BoxDecoration(
            color: Color(0xFFF5FAFD),
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: ListView(
            controller: controller,
            padding: const EdgeInsets.fromLTRB(18, 12, 18, 30),
            children: [
              Center(
                child: Container(
                  width: 42,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Color(0xFFB8D2DF),
                    borderRadius: BorderRadius.all(Radius.circular(20)),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              ClipRRect(
                borderRadius: BorderRadius.circular(22),
                child: SizedBox(
                  height: 190,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.asset(photo, fit: BoxFit.cover),
                      DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, Color(0xD9001726)],
                          ),
                        ),
                      ),
                      Positioned(
                        left: 16,
                        right: 16,
                        bottom: 15,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              disaster.toUpperCase(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.4,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              location,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 21,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: _AiMetric(label: 'RISK SCORE', value: score),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _AiMetric(label: 'CONFIDENCE', value: confidence),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _AiMetric(
                      label: 'LEVEL',
                      value: level.toUpperCase(),
                      color: _riskColor(level),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              _AiWorkflowSteps(prediction: p),
              const SizedBox(height: 2),
              _AiDetailCard(
                title: 'AI ASSESSMENT',
                icon: Icons.psychology_rounded,
                children: [
                  _AiRow(
                    'Prediction source',
                    _text(p['predictionSource'], 'AI Risk Prediction'),
                  ),
                  _AiRow('Model version', _text(p['modelVersion'], 'N/A')),
                  _AiRow(
                    'Approval status',
                    _text(
                      p['approvalStatus'],
                      p['isApproved'] == true ? 'Approved' : 'Pending',
                    ),
                  ),
                  _AiRow('Coordinates', ' , '),
                  _AiRow('Created', _text(p['createdAt'], 'N/A')),
                ],
              ),
              if (risks.isNotEmpty)
                _AiDetailCard(
                  title: 'IDENTIFIED DISASTER RISKS',
                  icon: Icons.warning_amber_rounded,
                  children: risks.map((e) => _AiBullet(e)).toList(),
                ),
              if (factors.isNotEmpty)
                _AiDetailCard(
                  title: 'RISK FACTORS',
                  icon: Icons.analytics_rounded,
                  children: factors.map((e) => _AiBullet(e)).toList(),
                ),
              if (recommendations.isNotEmpty)
                _AiDetailCard(
                  title: 'AI RECOMMENDATIONS',
                  icon: Icons.recommend_rounded,
                  children: recommendations.map((e) => _AiBullet(e)).toList(),
                ),
              if (risks.isEmpty && factors.isEmpty && recommendations.isEmpty)
                const _AiDetailCard(
                  title: 'ASSESSMENT DATA',
                  icon: Icons.info_outline_rounded,
                  children: [
                    Text(
                      'No additional AI details were returned by the backend for this prediction.',
                      style: TextStyle(
                        color: Color(0xFF607D8B),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
      child: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting)
            return const Padding(
              padding: EdgeInsets.all(20),
              child: Center(child: CircularProgressIndicator()),
            );
          if (snapshot.hasError) return const SizedBox.shrink();
          final predictions = snapshot.data ?? <Map<String, dynamic>>[];
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'AGENT 01 - AI INTELLIGENCE',
                style: TextStyle(
                  color: Color(0xFF0288D1),
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Risk Predictions',
                      style: TextStyle(
                        color: Color(0xFF001A2B),
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE5F5FF),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      ' LIVE',
                      style: const TextStyle(
                        color: Color(0xFF0288D1),
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if (predictions.isEmpty)
                const _AiDetailCard(
                  title: 'NO ACTIVE PREDICTIONS',
                  icon: Icons.cloud_off_rounded,
                  children: [
                    Text(
                      'No Agent 01 risk predictions were returned by the backend.',
                      style: TextStyle(
                        color: Color(0xFF607D8B),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ...predictions.map((p) {
                final disaster = _text(p['disasterType'], 'Unknown hazard');
                final location = _text(p['location'], 'Unknown location');
                final level = _text(p['riskLevel'], 'Unknown');
                final score = _score(p['riskScore']);
                final confidence = _confidence(p['confidence']);
                final color = _riskColor(level);
                return GestureDetector(
                  onTap: () {
                    try {
                      final prediction = RiskPredictionModel.fromJson(p);
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => RiskPredictionDetailsPage(
                            prediction: prediction,
                            provider: RiskPredictionsProvider(),
                          ),
                        ),
                      );
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Unable to open prediction details: '),
                        ),
                      );
                    }
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: const Color(0xFFD8E9F1)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x12001A2B),
                          blurRadius: 14,
                          offset: Offset(0, 5),
                        ),
                      ],
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      children: [
                        SizedBox(
                          height: 135,
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              Image.asset(_photo(disaster), fit: BoxFit.cover),
                              DecoratedBox(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                    colors: [
                                      Colors.transparent,
                                      Color(0xE6001726),
                                    ],
                                  ),
                                ),
                              ),
                              Positioned(
                                left: 14,
                                right: 14,
                                bottom: 12,
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            disaster.toUpperCase(),
                                            style: const TextStyle(
                                              color: Color(0xFFB9E8FF),
                                              fontSize: 8,
                                              fontWeight: FontWeight.w900,
                                              letterSpacing: 1.3,
                                            ),
                                          ),
                                          const SizedBox(height: 3),
                                          Text(
                                            location,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 17,
                                              fontWeight: FontWeight.w900,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 9,
                                        vertical: 6,
                                      ),
                                      decoration: BoxDecoration(
                                        color: color,
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        level.toUpperCase(),
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 8,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(14, 12, 14, 13),
                          child: Column(
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: _AiMetric(
                                      label: 'RISK SCORE',
                                      value: score,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: _AiMetric(
                                      label: 'CONFIDENCE',
                                      value: confidence,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: _AiMetric(
                                      label: 'AI STATUS',
                                      value: _text(
                                        p['approvalStatus'],
                                        p['isApproved'] == true
                                            ? 'APPROVED'
                                            : 'PENDING',
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  const Icon(
                                    Icons.touch_app_rounded,
                                    size: 13,
                                    color: Color(0xFF0288D1),
                                  ),
                                  const SizedBox(width: 5),
                                  const Expanded(
                                    child: Text(
                                      'Tap to view complete AI assessment',
                                      style: TextStyle(
                                        color: Color(0xFF607D8B),
                                        fontSize: 9,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                  const Icon(
                                    Icons.arrow_forward_ios_rounded,
                                    size: 11,
                                    color: Color(0xFF0288D1),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ],
          );
        },
      ),
    );
  }
}

class _AiMetric extends StatelessWidget {
  final String label;
  final String value;
  final Color? color;
  const _AiMetric({required this.label, required this.value, this.color});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 8),
    decoration: BoxDecoration(
      color: const Color(0xFFF1F8FC),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: Color(0xFF78909C),
            fontSize: 7,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          value,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: color ?? const Color(0xFF001A2B),
            fontSize: 10,
            fontWeight: FontWeight.w900,
          ),
        ),
      ],
    ),
  );
}

class _AiWorkflowSteps extends StatelessWidget {
  final Map<String, dynamic> prediction;
  const _AiWorkflowSteps({required this.prediction});

  String _text(dynamic value, String fallback) {
    final v = value?.toString().trim() ?? '';
    return v.isEmpty ? fallback : v;
  }

  @override
  Widget build(BuildContext context) {
    final disaster = _text(prediction['disasterType'], 'Unknown hazard');
    final location = _text(prediction['location'], 'Unknown location');
    final level = _text(prediction['riskLevel'], 'Unknown');
    final score = _text(prediction['riskScore'], 'N/A');
    final steps = <Map<String, String>>[
      {
        'no': '01',
        'title': 'Report Submitted',
        'owner': 'Incident Intake',
        'status': 'Source record',
      },
      {
        'no': '02',
        'title': 'Risk Prediction',
        'owner': 'Agent 01',
        'status': 'Completed',
      },
      {
        'no': '03',
        'title': 'Vulnerability & Impact',
        'owner': 'Agent 02',
        'status': 'Next stage',
      },
      {
        'no': '04',
        'title': 'Resource Optimization',
        'owner': 'Agent 03',
        'status': 'Waiting',
      },
      {
        'no': '05',
        'title': 'Early Warning',
        'owner': 'Agent 04',
        'status': 'Waiting',
      },
      {
        'no': '06',
        'title': 'Volunteer Assignment',
        'owner': 'Volunteer Agent',
        'status': 'Waiting',
      },
      {
        'no': '07',
        'title': 'Field Response',
        'owner': 'Assigned Volunteer',
        'status': 'Waiting',
      },
      {
        'no': '08',
        'title': 'Resolution',
        'owner': 'Relief Coordinator',
        'status': 'Waiting',
      },
    ];
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: const Color(0xFF001A2B),
        borderRadius: BorderRadius.circular(22),
        boxShadow: const [
          BoxShadow(
            color: Color(0x18001A2B),
            blurRadius: 18,
            offset: Offset(0, 7),
          ),
        ],
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
                  color: const Color(0xFF03A9F4),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: const Icon(
                  Icons.account_tree_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'OPERATIONAL WORKFLOW',
                      style: TextStyle(
                        color: Color(0xFF7DD8FF),
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.4,
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'ReliefNexus Response Lifecycle',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                decoration: BoxDecoration(
                  color: Color(0xFF0B5D82),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'STAGE 2 / 8',
                  style: TextStyle(
                    color: Color(0xFFBCEEFF),
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Color(0xFF063A55),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.location_on_rounded,
                  color: Color(0xFF03A9F4),
                  size: 15,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    '        Risk ',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                Text(
                  level.toUpperCase(),
                  style: const TextStyle(
                    color: Color(0xFFFFB86B),
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          ...List.generate(steps.length, (index) {
            final item = steps[index];
            final completed = index < 2;
            final active = index == 1;
            final last = index == steps.length - 1;
            final accent = completed
                ? const Color(0xFF20C997)
                : active
                ? const Color(0xFF03A9F4)
                : const Color(0xFF52758A);
            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 30,
                  child: Column(
                    children: [
                      Container(
                        width: 25,
                        height: 25,
                        decoration: BoxDecoration(
                          color: accent.withOpacity(.18),
                          shape: BoxShape.circle,
                          border: Border.all(color: accent, width: 1.2),
                        ),
                        child: Center(
                          child: completed
                              ? const Icon(
                                  Icons.check_rounded,
                                  color: Color(0xFF20C997),
                                  size: 14,
                                )
                              : Text(
                                  item['no']!,
                                  style: TextStyle(
                                    color: accent,
                                    fontSize: 8,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                        ),
                      ),
                      if (!last)
                        Container(
                          width: 1,
                          height: 42,
                          color: const Color(0xFF31566A),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 9),
                Expanded(
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.fromLTRB(11, 9, 10, 9),
                    decoration: BoxDecoration(
                      color: active
                          ? const Color(0xFF073F5C)
                          : const Color(0xFF062F45),
                      borderRadius: BorderRadius.circular(13),
                      border: Border.all(
                        color: active
                            ? const Color(0xFF087FB6)
                            : const Color(0xFF16475D),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '  ',
                                style: TextStyle(
                                  color: active
                                      ? Colors.white
                                      : const Color(0xFFD7E8EF),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                item['owner']!,
                                style: const TextStyle(
                                  color: Color(0xFF7FA9BB),
                                  fontSize: 8,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 7,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: accent.withOpacity(.13),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            item['status']!,
                            style: TextStyle(
                              color: accent,
                              fontSize: 7,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            );
          }),
          const SizedBox(height: 4),
          const Text(
            'Each stage uses the previous agent output as its operational input.',
            style: TextStyle(
              color: Color(0xFF7FA9BB),
              fontSize: 8,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _AiDetailCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<Widget> children;
  const _AiDetailCard({
    required this.title,
    required this.icon,
    required this.children,
  });

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(top: 12),
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      border: Border.all(color: const Color(0xFFD8E9F1)),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: const Color(0xFF0288D1), size: 18),
            const SizedBox(width: 7),
            Text(
              title,
              style: const TextStyle(
                color: Color(0xFF001A2B),
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: .5,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        ...children,
      ],
    ),
  );
}

class _AiRow extends StatelessWidget {
  final String label;
  final String value;
  const _AiRow(this.label, this.value);

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 112,
          child: Text(
            label,
            style: const TextStyle(
              color: Color(0xFF78909C),
              fontSize: 10,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              color: Color(0xFF263238),
              fontSize: 10,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ],
    ),
  );
}

class _AiBullet extends StatelessWidget {
  final String text;
  const _AiBullet(this.text);

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 7),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(top: 4),
          child: Icon(Icons.circle, size: 6, color: Color(0xFF03A9F4)),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              color: Color(0xFF455A64),
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

class _Header extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 7),
      child: Row(
        children: [
          _IconButton(
            icon: Icons.arrow_back_rounded,
            onTap: () => Navigator.maybePop(context),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'INCIDENT INTELLIGENCE',
                  style: TextStyle(
                    color: _blue,
                    fontSize: 8.5,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.6,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  'Disaster reports',
                  style: TextStyle(
                    color: _navy,
                    fontSize: 23,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -.5,
                  ),
                ),
              ],
            ),
          ),
          _IconButton(
            icon: Icons.refresh_rounded,
            onTap: () => context.read<DisasterReportsProvider>().load(),
          ),
        ],
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
    child: ClipRRect(
      borderRadius: BorderRadius.circular(25),
      child: SizedBox(
        height: 174,
        child: DecoratedBox(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF06152F), Color(0xFF0B315C), Color(0xFF0EA5E9)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                right: -35,
                top: -45,
                child: Container(
                  width: 170,
                  height: 170,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Color(0x220EA5E9),
                  ),
                ),
              ),
              Positioned(
                right: 25,
                bottom: -65,
                child: Container(
                  width: 145,
                  height: 145,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Color(0x1838BDF8),
                  ),
                ),
              ),
              Positioned(
                left: 18,
                right: 18,
                bottom: 17,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Color(0xFF7DD3FC),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 7),
                        const Text(
                          'LIVE INCIDENT NETWORK',
                          style: TextStyle(
                            color: Color(0xFFBAE6FD),
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 7),
                    const Text(
                      'Disaster reports',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Review verified reports, locations and operational status.',
                      style: TextStyle(
                        color: Color(0xFFDCE8FA),
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class _Kpis extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Consumer<DisasterReportsProvider>(
        builder: (_, p, __) {
          return Row(
            children: [
              Expanded(
                child: _Kpi(
                  icon: Icons.description_outlined,
                  value: '${p.items.length}',
                  label: 'TOTAL INCIDENTS',
                  color: _blue,
                ),
              ),
              const SizedBox(width: 9),
              Expanded(
                child: _Kpi(
                  icon: Icons.priority_high_rounded,
                  value: '${p.countSeverity('Critical')}',
                  label: 'CRITICAL',
                  color: _blue,
                ),
              ),
              const SizedBox(width: 9),
              Expanded(
                child: _Kpi(
                  icon: Icons.warning_amber_rounded,
                  value: '${p.countSeverity('High')}',
                  label: 'HIGH',
                  color: _orange,
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _Kpi extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;

  const _Kpi({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 105,
      padding: const EdgeInsets.fromLTRB(11, 13, 11, 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(21),
        border: Border.all(color: const Color(0xFFE1E8F2)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF071A3D).withValues(alpha: .045),
            blurRadius: 8,
            offset: const Offset(0, 7),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 35,
            height: 35,
            decoration: BoxDecoration(
              color: color.withValues(alpha: .09),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(height: 7),
          Text(
            value,
            style: const TextStyle(
              color: _navy,
              fontSize: 19,
              height: 1,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: _muted,
              fontSize: 6.5,
              fontWeight: FontWeight.w900,
              letterSpacing: .55,
            ),
          ),
        ],
      ),
    );
  }
}

class _Filters extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 14),
      child: Consumer<DisasterReportsProvider>(
        builder: (_, p, __) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Text(
                    'Incident explorer',
                    style: TextStyle(
                      color: _navy,
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  Spacer(),
                  Text(
                    'FILTER & SEARCH',
                    style: TextStyle(
                      color: _muted,
                      fontSize: 7,
                      fontWeight: FontWeight.w900,
                      letterSpacing: .8,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 9),

              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: _line),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF071A3D).withValues(alpha: .025),
                      blurRadius: 14,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: TextField(
                  onChanged: p.setQuery,
                  decoration: InputDecoration(
                    hintText: 'Search type, location or reporter...',
                    hintStyle: const TextStyle(
                      color: Color(0xFF9AA7B8),
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                    prefixIcon: const Icon(
                      Icons.search_rounded,
                      color: _blue,
                      size: 20,
                    ),
                    suffixIcon: p.query.isNotEmpty
                        ? IconButton(
                            onPressed: () => p.setQuery(''),
                            icon: const Icon(
                              Icons.close_rounded,
                              size: 17,
                              color: _muted,
                            ),
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 15),
                  ),
                ),
              ),

              const SizedBox(height: 10),

              Row(
                children: [
                  Expanded(
                    child: _Dropdown(
                      value: p.severity,
                      values: const [
                        'All',
                        'Critical',
                        'High',
                        'Medium',
                        'Low',
                      ],
                      label: 'Severity',
                      onChanged: p.setSeverity,
                    ),
                  ),
                  const SizedBox(width: 9),
                  Expanded(
                    child: _Dropdown(
                      value: p.status,
                      values: const [
                        'All',
                        'Reported',
                        'Reviewed',
                        'Verified',
                        'Assigned',
                        'In Progress',
                        'Completed',
                      ],
                      label: 'Status',
                      onChanged: p.setStatus,
                    ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}

class _Dropdown extends StatelessWidget {
  final String value;
  final List<String> values;
  final String label;
  final ValueChanged<String> onChanged;

  const _Dropdown({
    required this.value,
    required this.values,
    required this.label,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      padding: const EdgeInsets.symmetric(horizontal: 13),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(17),
        border: Border.all(color: _line),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF071A3D).withValues(alpha: .025),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 27,
            height: 27,
            decoration: BoxDecoration(
              color: _blue.withValues(alpha: .07),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(
              label == 'Severity'
                  ? Icons.tune_rounded
                  : Icons.filter_alt_outlined,
              color: _blue,
              size: 14,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                isExpanded: true,
                value: values.contains(value) ? value : values.first,
                icon: const Icon(
                  Icons.keyboard_arrow_down_rounded,
                  color: _muted,
                  size: 19,
                ),
                items: values
                    .map(
                      (v) => DropdownMenuItem<String>(
                        value: v,
                        child: Text(
                          v,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: _navy,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    )
                    .toList(),
                onChanged: (v) {
                  if (v != null) {
                    onChanged(v);
                  }
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ReportCard extends StatelessWidget {
  final DisasterReportModel item;

  const _ReportCard({required this.item});

  String _prettyStatus(String value) {
    if (value.isEmpty) return 'Unknown';

    return value
        .replaceAll('_', ' ')
        .replaceAllMapped(
          RegExp(r'([a-z])([A-Z])'),
          (m) => '${m.group(1)} ${m.group(2)}',
        );
  }

  String _dateLabel(DateTime? value) {
    if (value == null) return 'Date unavailable';

    final d = value.toLocal();

    String two(int n) => n.toString().padLeft(2, '0');

    return '${two(d.day)}/${two(d.month)}/${d.year} '
        '${two(d.hour)}:${two(d.minute)}';
  }

  @override
  Widget build(BuildContext context) {
    final severityColor = _severityColor(item.severity);

    final hasCoordinates = item.latitude != null && item.longitude != null;

    final status = item.status.trim().isEmpty ? 'Unknown' : item.status.trim();

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE3EAF3)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF082A4A).withValues(alpha: .045),
            blurRadius: 10,
            offset: const Offset(0, 9),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(24),
        child: InkWell(
          borderRadius: BorderRadius.circular(24),
          onTap: () => _showDetails(context),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 13),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ---------------------------------------------------------
                // TOP ROW
                // ---------------------------------------------------------
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: severityColor.withValues(alpha: .10),
                        borderRadius: BorderRadius.circular(17),
                      ),
                      child: Icon(
                        _typeIcon(item.disasterType),
                        color: severityColor,
                        size: 25,
                      ),
                    ),

                    const SizedBox(width: 12),

                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.disasterType,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: _navy,
                              fontSize: 15,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -.15,
                            ),
                          ),

                          const SizedBox(height: 5),

                          Row(
                            children: [
                              const Icon(
                                Icons.location_on_rounded,
                                color: Color(0xFF8291A6),
                                size: 13,
                              ),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  item.location.isEmpty
                                      ? 'Location not provided'
                                      : item.location,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Color(0xFF7B8A9E),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(width: 8),

                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 7,
                      ),
                      decoration: BoxDecoration(
                        color: severityColor.withValues(alpha: .09),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        item.severity.toUpperCase(),
                        style: TextStyle(
                          color: severityColor,
                          fontSize: 7.5,
                          fontWeight: FontWeight.w900,
                          letterSpacing: .6,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 15),

                // ---------------------------------------------------------
                // DESCRIPTION
                // ---------------------------------------------------------
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(12, 11, 12, 11),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF7F9FD),
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.subject_rounded, color: _blue, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          item.description.isEmpty
                              ? 'No incident description provided.'
                              : item.description,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: _navy,
                            fontSize: 10.5,
                            height: 1.45,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 13),

                // ---------------------------------------------------------
                // INCIDENT META
                // ---------------------------------------------------------
                Row(
                  children: [
                    Expanded(
                      child: _IncidentMeta(
                        icon: Icons.person_outline_rounded,
                        label: 'Reporter',
                        value: item.reporterName.isEmpty
                            ? 'Unknown'
                            : item.reporterName,
                      ),
                    ),

                    const SizedBox(width: 10),

                    _StatusMiniPill(text: status),
                  ],
                ),

                const SizedBox(height: 12),

                // ---------------------------------------------------------
                // ASSIGNMENT + DATE
                // ---------------------------------------------------------
                Row(
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          const Icon(
                            Icons.groups_outlined,
                            color: Color(0xFF8B99AC),
                            size: 15,
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              item.assignedVolunteerName ??
                                  'Awaiting volunteer',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Color(0xFF7C8CA0),
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(width: 8),

                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.schedule_rounded,
                          color: Color(0xFF9AA7B8),
                          size: 13,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _dateLabel(item.createdAt),
                          style: const TextStyle(
                            color: Color(0xFF8A98AA),
                            fontSize: 8,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 13),

                // ---------------------------------------------------------
                // FOOTER
                // ---------------------------------------------------------
                Container(height: 1, color: const Color(0xFFE7ECF3)),

                const SizedBox(height: 11),

                Row(
                  children: [
                    Container(
                      width: 27,
                      height: 27,
                      decoration: BoxDecoration(
                        color: hasCoordinates
                            ? const Color(0xFFEAF2FF)
                            : const Color(0xFFF3F5F8),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        hasCoordinates
                            ? Icons.my_location_rounded
                            : Icons.location_off_outlined,
                        color: hasCoordinates ? _blue : const Color(0xFF9AA7B8),
                        size: 14,
                      ),
                    ),

                    const SizedBox(width: 7),

                    Expanded(
                      child: Text(
                        hasCoordinates
                            ? 'Location coordinates available'
                            : 'Location text only',
                        style: const TextStyle(
                          color: Color(0xFF8795A8),
                          fontSize: 8.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),

                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 7,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEAF2FF),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'VIEW DETAILS',
                            style: TextStyle(
                              color: _blue,
                              fontSize: 7.5,
                              fontWeight: FontWeight.w900,
                              letterSpacing: .35,
                            ),
                          ),
                          SizedBox(width: 4),
                          Icon(
                            Icons.arrow_forward_rounded,
                            color: _blue,
                            size: 12,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showDetails(BuildContext context) {
    final provider = context.read<DisasterReportsProvider>();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ChangeNotifierProvider.value(
        value: provider,
        child: FractionallySizedBox(
          heightFactor: .94,
          child: _ReportDetails(item: item),
        ),
      ),
    );
  }
}

class _IncidentMeta extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _IncidentMeta({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF8796A9), size: 15),
        const SizedBox(width: 6),
        Flexible(
          child: RichText(
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            text: TextSpan(
              children: [
                TextSpan(
                  text: '$label  ',
                  style: const TextStyle(
                    color: Color(0xFF9AA7B8),
                    fontSize: 8,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                TextSpan(
                  text: value,
                  style: const TextStyle(
                    color: _navy,
                    fontSize: 8.5,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _StatusMiniPill extends StatelessWidget {
  final String text;

  const _StatusMiniPill({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 125),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F5F8),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Color(0xFF7B8A9E),
          fontSize: 7.5,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class _ReportDetails extends StatelessWidget {
  final DisasterReportModel item;
  const _ReportDetails({required this.item});

  @override
  Widget build(BuildContext context) {
    final color = _severityColor(item.severity);
    final status = item.status.trim().isEmpty ? 'Unknown' : item.status.trim();
    final hasCoordinates = item.latitude != null && item.longitude != null;
    return Container(
      constraints: const BoxConstraints.expand(),
      padding: const EdgeInsets.fromLTRB(18, 12, 18, 30),
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
                  color: _line,
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
            const SizedBox(height: 11),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'INCIDENT PROFILE',
                        style: TextStyle(
                          color: _blue,
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.3,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        item.disasterType,
                        style: const TextStyle(
                          color: _navy,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),
                _Pill(text: item.severity.toUpperCase(), color: color),
              ],
            ),
            const SizedBox(height: 15),

            // ==================================================
            // LIVE INCIDENT STATUS
            // ==================================================
            Container(
              padding: const EdgeInsets.all(15),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFE8F1FF), Color(0xFFF7FAFF)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Color(0xFFCFE0FF)),
                boxShadow: [
                  BoxShadow(
                    color: Color(0xFF1769FF).withValues(alpha: .07),
                    blurRadius: 8,
                    offset: Offset(0, 7),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 45,
                    height: 45,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1769FF), Color(0xFF0756E8)],
                      ),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Color(0xFF1769FF).withValues(alpha: .24),
                          blurRadius: 12,
                          offset: Offset(0, 5),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.bolt_rounded,
                      color: Colors.white,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'LIVE INCIDENT STATUS',
                          style: TextStyle(
                            color: Color(0xFF1769FF),
                            fontSize: 7,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.1,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Operational record is active',
                          style: TextStyle(
                            color: Color(0xFF071A3D),
                            fontSize: 11.5,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          'This incident is currently being processed.',
                          style: TextStyle(
                            color: Color(0xFF70809A),
                            fontSize: 8.5,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 7,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Color(0xFFD6E4FF)),
                    ),
                    child: Text(
                      status.toUpperCase(),
                      style: const TextStyle(
                        color: Color(0xFF1769FF),
                        fontSize: 6.5,
                        fontWeight: FontWeight.w900,
                        letterSpacing: .5,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ==================================================
            // REPORTER INFORMATION
            // ==================================================
            const _PremiumSectionLabel(
              icon: Icons.person_outline_rounded,
              title: 'REPORTER INFORMATION',
            ),

            const SizedBox(height: 9),

            Row(
              children: [
                Expanded(
                  child: _DetailTile(
                    icon: Icons.person_rounded,
                    title: 'Reported by',
                    value: item.reporterName,
                  ),
                ),
                const SizedBox(width: 9),
                Expanded(
                  child: _DetailTile(
                    icon: Icons.email_rounded,
                    title: 'Reporter email',
                    value: item.reporterEmail,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 18),

            // ==================================================
            // LOCATION INTELLIGENCE
            // ==================================================
            const _PremiumSectionLabel(
              icon: Icons.location_on_outlined,
              title: 'LOCATION INTELLIGENCE',
            ),

            const SizedBox(height: 9),

            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _DetailTile(
                    icon: Icons.location_on_rounded,
                    title: 'Incident location',
                    value: item.location,
                  ),
                ),
                const SizedBox(width: 9),
                Expanded(
                  child: _DetailTile(
                    icon: Icons.info_outline_rounded,
                    title: 'Status',
                    value: status,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 18),

            // ==================================================
            // OPERATIONAL ASSIGNMENT
            // ==================================================
            const _PremiumSectionLabel(
              icon: Icons.groups_outlined,
              title: 'OPERATIONAL ASSIGNMENT',
            ),

            const SizedBox(height: 9),

            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF2F6FF),
                borderRadius: BorderRadius.circular(19),
                border: Border.all(color: const Color(0xFFDCE7FA)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 43,
                    height: 43,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2ECFF),
                      borderRadius: BorderRadius.circular(13),
                    ),
                    child: const Icon(
                      Icons.assignment_ind_rounded,
                      color: Color(0xFF1769FF),
                      size: 21,
                    ),
                  ),
                  const SizedBox(width: 11),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'ASSIGNED VOLUNTEER',
                          style: TextStyle(
                            color: Color(0xFF8A9AB1),
                            fontSize: 6.5,
                            fontWeight: FontWeight.w900,
                            letterSpacing: .7,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.assignedVolunteerName ?? 'Not assigned',
                          style: const TextStyle(
                            color: Color(0xFF071A3D),
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 7,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFD7E4F9)),
                    ),
                    child: Icon(
                      item.assignedVolunteerName == null
                          ? Icons.person_add_alt_1_rounded
                          : Icons.verified_rounded,
                      color: const Color(0xFF1769FF),
                      size: 16,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // ==================================================
            // INCIDENT DESCRIPTION
            // ==================================================
            const _PremiumSectionLabel(
              icon: Icons.subject_rounded,
              title: 'INCIDENT DESCRIPTION',
            ),

            const SizedBox(height: 9),

            Container(
              padding: const EdgeInsets.all(15),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(19),
                border: Border.all(color: const Color(0xFFDDE7F5)),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF071A3D).withValues(alpha: .035),
                    blurRadius: 15,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F0FF),
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: const Icon(
                      Icons.notes_rounded,
                      color: Color(0xFF1769FF),
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'OPERATIONAL DESCRIPTION',
                          style: TextStyle(
                            color: Color(0xFF8A9AB1),
                            fontSize: 6.5,
                            fontWeight: FontWeight.w900,
                            letterSpacing: .7,
                          ),
                        ),
                        const SizedBox(height: 5),
                        Text(
                          item.description.isEmpty
                              ? 'No description provided.'
                              : item.description,
                          style: const TextStyle(
                            color: Color(0xFF071A3D),
                            fontSize: 10,
                            height: 1.45,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // ==================================================
            // AGENT 01 INTELLIGENCE
            // ==================================================
            if (item.description.toLowerCase().contains('agent 01')) ...[
              const SizedBox(height: 12),

              Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFE6F0FF), Color(0xFFF4F8FF)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFBCD5FF)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 43,
                      height: 43,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF1769FF), Color(0xFF5B9BFF)],
                        ),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(
                        Icons.auto_awesome_rounded,
                        color: Colors.white,
                        size: 21,
                      ),
                    ),
                    const SizedBox(width: 11),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'AGENT 01 INTELLIGENCE',
                            style: TextStyle(
                              color: Color(0xFF1769FF),
                              fontSize: 7,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1,
                            ),
                          ),
                          SizedBox(height: 5),
                          Text(
                            'Incident originated from the risk prediction workflow.',
                            style: TextStyle(
                              color: Color(0xFF071A3D),
                              fontSize: 9.5,
                              height: 1.4,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // ==================================================
            // MAP
            // ==================================================
            if (hasCoordinates) ...[
              const SizedBox(height: 20),

              Row(
                children: [
                  const Expanded(
                    child: _PremiumSectionLabel(
                      icon: Icons.map_outlined,
                      title: 'INCIDENT LOCATION MAP',
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F1FF),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.open_in_new_rounded,
                          color: Color(0xFF1769FF),
                          size: 12,
                        ),
                        SizedBox(width: 4),
                        Text(
                          'OPEN IN MAP',
                          style: TextStyle(
                            color: Color(0xFF1769FF),
                            fontSize: 6.5,
                            fontWeight: FontWeight.w900,
                            letterSpacing: .4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 9),

              Container(
                height: 265,
                clipBehavior: Clip.antiAlias,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(23),
                  border: Border.all(
                    color: const Color(0xFFBFD6FF),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF1769FF).withValues(alpha: .10),
                      blurRadius: 10,
                      offset: const Offset(0, 9),
                    ),
                  ],
                ),
                child: Stack(
                  children: [
                    FlutterMap(
                      options: MapOptions(
                        initialCenter: LatLng(item.latitude!, item.longitude!),
                        initialZoom: 15.5,
                        interactionOptions: InteractionOptions(
                          flags: InteractiveFlag.all,
                        ),
                      ),
                      children: [
                        TileLayer(
                          urlTemplate:
                              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                          userAgentPackageName: 'com.reliefnexus.mobile',
                        ),
                        MarkerLayer(
                          markers: [
                            Marker(
                              point: LatLng(item.latitude!, item.longitude!),
                              width: 62,
                              height: 62,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(
                                        0xFF071A3D,
                                      ).withValues(alpha: .25),
                                      blurRadius: 16,
                                      offset: const Offset(0, 6),
                                    ),
                                  ],
                                ),
                                padding: const EdgeInsets.all(5),
                                child: Container(
                                  decoration: const BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [
                                        Color(0xFF1769FF),
                                        Color(0xFF0756E8),
                                      ],
                                    ),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.warning_rounded,
                                    color: Colors.white,
                                    size: 26,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),

                    Positioned(
                      top: 13,
                      left: 13,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 11,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: .96),
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: .10),
                              blurRadius: 12,
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.location_on_rounded,
                              color: Color(0xFF1769FF),
                              size: 16,
                            ),
                            const SizedBox(width: 5),
                            Text(
                              item.location.isEmpty
                                  ? 'Incident Location'
                                  : item.location,
                              style: const TextStyle(
                                color: Color(0xFF071A3D),
                                fontSize: 7.5,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    Positioned(
                      right: 12,
                      top: 13,
                      child: Column(
                        children: [
                          _MapControl(
                            icon: Icons.my_location_rounded,
                            onTap: () {},
                          ),
                          const SizedBox(height: 7),
                          _MapControl(icon: Icons.add_rounded, onTap: () {}),
                          const SizedBox(height: 1),
                          _MapControl(icon: Icons.remove_rounded, onTap: () {}),
                        ],
                      ),
                    ),

                    Positioned(
                      left: 11,
                      right: 11,
                      bottom: 11,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 13,
                          vertical: 11,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xF8FFFFFF),
                          borderRadius: BorderRadius.circular(17),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: .10),
                              blurRadius: 14,
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 37,
                              height: 37,
                              decoration: BoxDecoration(
                                color: const Color(0xFFE5EFFF),
                                borderRadius: BorderRadius.circular(11),
                              ),
                              child: const Icon(
                                Icons.my_location_rounded,
                                color: Color(0xFF1769FF),
                                size: 18,
                              ),
                            ),
                            const SizedBox(width: 9),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'GPS COORDINATES',
                                    style: TextStyle(
                                      color: Color(0xFF8998AE),
                                      fontSize: 6.5,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: .8,
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    '${item.latitude!.toStringAsFixed(6)}, ${item.longitude!.toStringAsFixed(6)}',
                                    style: const TextStyle(
                                      color: Color(0xFF071A3D),
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFE8F1FF),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text(
                                'GPS',
                                style: TextStyle(
                                  color: Color(0xFF1769FF),
                                  fontSize: 6.5,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 18),
            const SizedBox(height: 12),
            const SizedBox(height: 16),
            ChangeNotifierProvider.value(
              value: context.read<DisasterReportsProvider>(),
              child: _PremiumCommandPanel(item: item),
            ),
            const SizedBox(height: 16),
            Consumer<DisasterReportsProvider>(
              builder: (context, p, _) {
                final processing = p.processingId == item.id;
                return Row(
                  children: [
                    if (_canWorkflow(item.status)) ...[
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: processing
                              ? null
                              : () => _run(context, p.review, 'Review'),
                          icon: const Icon(Icons.rate_review_rounded, size: 16),
                          label: const Text(
                            'Review',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 9),
                    ],
                    if (_canVerify(item.status))
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: processing
                              ? null
                              : () => _run(context, p.verify, 'Verify'),
                          icon: processing
                              ? const SizedBox(
                                  width: 15,
                                  height: 15,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Icon(Icons.verified_rounded, size: 16),
                          label: const Text(
                            'Verify',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _blue,
                            foregroundColor: Colors.white,
                            elevation: 0,
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  bool _canWorkflow(String s) => s.toLowerCase() == 'reported';
  bool _canVerify(String s) => s.toLowerCase() == 'reviewed';

  Future<void> _run(
    BuildContext context,
    Future<bool> Function(DisasterReportModel) action,
    String label,
  ) async {
    final ok = await action(item);
    if (!context.mounted) return;
    if (ok) Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          ok
              ? '$label completed successfully.'
              : 'Unable to $label this report.',
        ),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

class _MapControl extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _MapControl({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: SizedBox(
          width: 38,
          height: 38,
          child: Icon(icon, color: const Color(0xFF1769FF), size: 18),
        ),
      ),
    );
  }
}

class _PremiumSectionLabel extends StatelessWidget {
  final IconData icon;
  final String title;

  const _PremiumSectionLabel({required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: _blue.withValues(alpha: .08),
            borderRadius: BorderRadius.circular(9),
          ),
          child: Icon(icon, color: _blue, size: 14),
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            color: _navy,
            fontSize: 8,
            fontWeight: FontWeight.w900,
            letterSpacing: .9,
          ),
        ),
      ],
    );
  }
}

class _DetailTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;
  const _DetailTile({
    required this.icon,
    required this.title,
    required this.value,
  });
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 7),
    padding: const EdgeInsets.all(11),
    decoration: BoxDecoration(
      color: const Color(0xFFF7F9FD),
      borderRadius: BorderRadius.circular(15),
      border: Border.all(color: _line),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: _blue, size: 18),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: _muted,
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                value.isEmpty ? 'Not provided' : value,
                style: const TextStyle(
                  color: _navy,
                  fontSize: 11.5,
                  height: 1.3,
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

class _Pill extends StatelessWidget {
  final String text;
  final Color color;
  const _Pill({required this.text, required this.color});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
    decoration: BoxDecoration(
      color: color.withValues(alpha: .1),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(
      text,
      style: TextStyle(
        color: color,
        fontSize: 7.5,
        fontWeight: FontWeight.w900,
        letterSpacing: .5,
      ),
    ),
  );
}

class _IconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _IconButton({required this.icon, required this.onTap});
  @override
  Widget build(BuildContext context) => Material(
    color: Colors.white,
    borderRadius: BorderRadius.circular(14),
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: _line),
        ),
        child: Icon(icon, color: _navy, size: 20),
      ),
    ),
  );
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_rounded, color: _muted, size: 42),
            const SizedBox(height: 10),
            const Text(
              'Could not load disaster reports',
              style: TextStyle(
                color: _navy,
                fontSize: 15,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: _muted, fontSize: 10),
            ),
            const SizedBox(height: 14),
            ElevatedButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Icon(Icons.map_outlined, color: _blue, size: 48),
            SizedBox(height: 12),
            Text(
              'No disaster reports found',
              style: TextStyle(
                color: _navy,
                fontSize: 16,
                fontWeight: FontWeight.w900,
              ),
            ),
            SizedBox(height: 5),
            Text(
              'Try changing your filters or refresh the live data.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: _muted,
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

Color _severityColor(String s) {
  switch (s.toLowerCase()) {
    case 'critical':
      return _red;
    case 'high':
      return _orange;
    case 'medium':
      return const Color(0xFFFFC24B);
    case 'low':
      return _green;
    default:
      return _blue;
  }
}

Color _statusColor(String s) {
  switch (s.toLowerCase()) {
    case 'verified':
    case 'completed':
      return _green;
    case 'reviewed':
    case 'in progress':
    case 'assigned':
      return _blue;
    default:
      return _muted;
  }
}

IconData _typeIcon(String s) {
  final v = s.toLowerCase();
  if (v.contains('flood')) return Icons.water_rounded;
  if (v.contains('landslide')) return Icons.terrain_rounded;
  if (v.contains('fire')) return Icons.local_fire_department_rounded;
  if (v.contains('storm') || v.contains('cyclone')) return Icons.storm_rounded;
  if (v.contains('earthquake')) return Icons.public_rounded;
  return Icons.warning_rounded;
}

class _PremiumCommandPanel extends StatelessWidget {
  final DisasterReportModel item;

  const _PremiumCommandPanel({required this.item});

  @override
  Widget build(BuildContext context) {
    final provider = context.read<DisasterReportsProvider>();

    final status = item.status.toLowerCase().replaceAll(' ', '');

    final busy = provider.processingId == item.id;

    final buttons = <Widget>[];

    if (status == 'reported' || status == 'submitted') {
      buttons.add(
        _PremiumAction(
          icon: Icons.rate_review_rounded,
          title: 'Review incident',
          subtitle: 'Move the report into coordinator review.',
          color: _blue,
          enabled: !busy,
          onTap: () async {
            final ok = await provider.review(item);
            if (context.mounted) {
              _notifyAction(
                context,
                ok
                    ? 'Incident reviewed successfully.'
                    : provider.error ?? 'Review failed.',
              );
            }
          },
        ),
      );
    }

    if (status == 'reviewed') {
      buttons.add(
        _PremiumAction(
          icon: Icons.verified_rounded,
          title: 'Verify incident',
          subtitle: 'Confirm the operational incident record.',
          color: _green,
          enabled: !busy,
          onTap: () async {
            final ok = await provider.verify(item);
            if (context.mounted) {
              _notifyAction(
                context,
                ok
                    ? 'Incident verified successfully.'
                    : provider.error ?? 'Verification failed.',
              );
            }
          },
        ),
      );
    }

    if (status == 'verified' || status == 'volunteerqueue') {
      buttons.add(
        _PremiumAction(
          icon: Icons.groups_rounded,
          title: 'STEP 7 - Assign field volunteer',
          subtitle:
              'Assign an approved active Field Volunteer to this verified incident.',
          color: _blue,
          enabled: !busy,
          onTap: () => _openVolunteerAssignment(context, provider, item),
        ),
      );
    }

    if (status == 'assigned' ||
        status == 'volunteerqueue' ||
        status == 'inprogress' ||
        status == 'fieldupdatesubmitted') {
      buttons.add(
        _PremiumAction(
          icon: Icons.play_circle_outline_rounded,
          title: 'STEP 8 - Start field response',
          subtitle: 'Start the assigned Field Volunteer operational response.',
          color: _orange,
          enabled: !busy,
          onTap: () async {
            final ok = await provider.fieldStart(item);

            if (context.mounted) {
              _notifyAction(
                context,
                ok
                    ? 'Field response started.'
                    : provider.error ?? 'Field response could not be started.',
              );
            }
          },
        ),
      );

      buttons.add(
        _PremiumAction(
          icon: Icons.edit_note_rounded,
          title: 'STEP 8 - Submit field update',
          subtitle:
              'Send field notes, situation and GPS coordinates to the backend.',
          color: _blue,
          enabled: !busy,
          onTap: () => _openFieldUpdate(context, provider, item),
        ),
      );

      buttons.add(
        _PremiumAction(
          icon: Icons.task_alt_rounded,
          title: 'STEP 8 - Complete field response',
          subtitle:
              'Complete the assigned field response after the field update.',
          color: _green,
          enabled: !busy,
          onTap: () async {
            final ok = await provider.fieldComplete(item);

            if (context.mounted) {
              _notifyAction(
                context,
                ok
                    ? 'Field response completed.'
                    : provider.error ?? 'Field completion failed.',
              );
            }
          },
        ),
      );
    }

    if (status != 'resolved' && status != 'rejected') {
      buttons.add(
        _PremiumAction(
          icon: Icons.check_circle_outline_rounded,
          title: 'STEP 9 - Resolve incident',
          subtitle: 'Complete the operational incident lifecycle.',
          color: _green,
          enabled: !busy,
          onTap: () async {
            final ok = await provider.resolve(item);

            if (context.mounted) {
              _notifyAction(
                context,
                ok
                    ? 'Incident resolved successfully.'
                    : provider.error ?? 'Resolution failed.',
              );
            }
          },
        ),
      );

      buttons.add(
        _PremiumAction(
          icon: Icons.block_rounded,
          title: 'Reject incident',
          subtitle: 'Reject this report through the backend workflow.',
          color: _blue,
          enabled: !busy,
          onTap: () async {
            final ok = await provider.reject(item);

            if (context.mounted) {
              _notifyAction(
                context,
                ok
                    ? 'Incident rejected successfully.'
                    : provider.error ?? 'Rejection failed.',
              );
            }
          },
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: _line),
        boxShadow: [
          BoxShadow(
            color: _navy.withOpacity(.035),
            blurRadius: 8,
            offset: const Offset(0, 7),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'COMMAND CENTER',
            style: TextStyle(
              color: _blue,
              fontSize: 7.5,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.3,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Operational actions',
            style: TextStyle(
              color: _navy,
              fontSize: 17,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Actions below call the real ReliefNexus backend workflow.',
            style: TextStyle(
              color: _muted,
              fontSize: 9,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          ...buttons.map(
            (button) => Padding(
              padding: const EdgeInsets.only(bottom: 9),
              child: button,
            ),
          ),
          _PremiumAction(
            icon: Icons.picture_as_pdf_rounded,
            title: 'Export incident report',
            subtitle: 'Generate an A4 operational PDF.',
            color: _navy,
            enabled: !busy,
            onTap: () async {
              try {
                await _exportPremiumPdf(context, item);
              } catch (e) {
                if (context.mounted) {
                  _notifyAction(context, 'PDF export failed: $e');
                }
              }
            },
          ),
        ],
      ),
    );
  }
}

class _PremiumAction extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final bool enabled;
  final Future<void> Function() onTap;

  const _PremiumAction({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: enabled ? onTap : null,
      borderRadius: BorderRadius.circular(17),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withOpacity(.055),
          borderRadius: BorderRadius.circular(17),
          border: Border.all(color: color.withOpacity(.16)),
        ),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: color.withOpacity(.11),
                borderRadius: BorderRadius.circular(13),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 11),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: _navy,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: _muted,
                      fontSize: 8,
                      height: 1.3,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios_rounded, size: 12, color: color),
          ],
        ),
      ),
    );
  }
}

Future<void> _openVolunteerAssignment(
  BuildContext context,
  DisasterReportsProvider provider,
  DisasterReportModel item,
) async {
  String? selected = item.assignedVolunteerUserId;

  final result = await showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => SafeArea(
      child: Container(
        padding: const EdgeInsets.fromLTRB(18, 12, 18, 25),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: StatefulBuilder(
          builder: (context, setState) {
            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: _line,
                      borderRadius: BorderRadius.circular(5),
                    ),
                  ),
                ),
                const SizedBox(height: 11),
                const Text(
                  'VOLUNTEER ASSIGNMENT',
                  style: TextStyle(
                    color: _blue,
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.4,
                  ),
                ),
                const SizedBox(height: 5),
                const Text(
                  'Assign operational response',
                  style: TextStyle(
                    color: _navy,
                    fontSize: 19,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 5),
                const Text(
                  'Only approved active Field Volunteers returned by the API are shown.',
                  style: TextStyle(
                    color: _muted,
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 14),
                if (provider.volunteers.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 8, bottom: 15),
                    child: Text(
                      'No approved active Field Volunteers were returned by the API.',
                      style: TextStyle(
                        color: _blue,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  )
                else
                  ...provider.volunteers.map(
                    (volunteer) => RadioListTile<String>(
                      value: volunteer.id,
                      groupValue: selected,
                      activeColor: _blue,
                      contentPadding: EdgeInsets.zero,
                      onChanged: (value) {
                        setState(() => selected = value);
                      },
                      title: Text(
                        volunteer.name,
                        style: const TextStyle(
                          color: _navy,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      subtitle: Text(
                        volunteer.email,
                        style: const TextStyle(color: _muted, fontSize: 8),
                      ),
                    ),
                  ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: selected == null
                        ? null
                        : () => Navigator.pop(context, selected),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _navy,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Text(
                      'ASSIGN VOLUNTEER',
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w900,
                        letterSpacing: .7,
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    ),
  );

  if (result == null) return;

  final ok = await provider.assign(item, result);

  if (context.mounted) {
    _notifyAction(
      context,
      ok
          ? 'Volunteer assigned successfully.'
          : provider.error ?? 'Volunteer assignment failed.',
    );
  }
}

Future<void> _openFieldUpdate(
  BuildContext context,
  DisasterReportsProvider provider,
  DisasterReportModel item,
) async {
  final notes = TextEditingController();
  final situation = TextEditingController(text: '');
  final latitude = TextEditingController(text: item.latitude?.toString() ?? '');
  final longitude = TextEditingController(
    text: item.longitude?.toString() ?? '',
  );

  try {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => SafeArea(
        child: Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.sizeOf(context).height * .88,
          ),
          padding: const EdgeInsets.fromLTRB(18, 12, 18, 24),
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
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: _line,
                      borderRadius: BorderRadius.circular(5),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'FIELD UPDATE',
                  style: TextStyle(
                    color: _blue,
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.4,
                  ),
                ),
                const SizedBox(height: 5),
                const Text(
                  'Submit field situation',
                  style: TextStyle(
                    color: _navy,
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 15),
                _FieldInput(
                  controller: notes,
                  label: 'Field notes *',
                  hint: 'What is happening at the incident?',
                  maxLines: 5,
                ),
                _FieldInput(
                  controller: situation,
                  label: 'Situation',
                  hint: 'Optional situation summary',
                  maxLines: 3,
                ),
                Row(
                  children: [
                    Expanded(
                      child: _FieldInput(
                        controller: latitude,
                        label: 'Latitude',
                        hint: 'Optional',
                        keyboard: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 9),
                    Expanded(
                      child: _FieldInput(
                        controller: longitude,
                        label: 'Longitude',
                        hint: 'Optional',
                        keyboard: TextInputType.number,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      if (notes.text.trim().isEmpty) {
                        return;
                      }

                      Navigator.pop(context);

                      final ok = await provider.fieldUpdate(
                        item,
                        notes: notes.text.trim(),
                        situation: situation.text.trim().isEmpty
                            ? null
                            : situation.text.trim(),
                        latitude: double.tryParse(latitude.text.trim()),
                        longitude: double.tryParse(longitude.text.trim()),
                      );

                      if (context.mounted) {
                        _notifyAction(
                          context,
                          ok
                              ? 'Field update submitted successfully.'
                              : provider.error ?? 'Field update failed.',
                        );
                      }
                    },
                    icon: const Icon(Icons.send_rounded, size: 17),
                    label: const Text(
                      'SUBMIT FIELD UPDATE',
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w900,
                        letterSpacing: .7,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _navy,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(17),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  } finally {
    notes.dispose();
    situation.dispose();
    latitude.dispose();
    longitude.dispose();
  }
}

class _FieldInput extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final int maxLines;
  final TextInputType? keyboard;

  const _FieldInput({
    required this.controller,
    required this.label,
    required this.hint,
    this.maxLines = 1,
    this.keyboard,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 11),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: _navy,
              fontSize: 9,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: controller,
            maxLines: maxLines,
            keyboardType: keyboard,
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(color: _muted, fontSize: 9),
              filled: true,
              fillColor: _bg,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
                borderSide: const BorderSide(color: _line),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
                borderSide: const BorderSide(color: _line),
              ),
              contentPadding: const EdgeInsets.all(13),
            ),
          ),
        ],
      ),
    );
  }
}

void _notifyAction(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
}

Future<void> _exportPremiumPdf(
  BuildContext context,
  DisasterReportModel item,
) async {
  final document = pw.Document();

  document.addPage(
    pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(34),
      header: (_) => pw.Container(
        padding: const pw.EdgeInsets.only(bottom: 12),
        decoration: const pw.BoxDecoration(
          border: pw.Border(
            bottom: pw.BorderSide(color: PdfColors.blue700, width: 2),
          ),
        ),
        child: pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(
                  'RELIEFNEXUS',
                  style: pw.TextStyle(
                    fontSize: 18,
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColors.blue800,
                  ),
                ),
                pw.Text(
                  'INCIDENT INTELLIGENCE REPORT',
                  style: const pw.TextStyle(
                    fontSize: 8,
                    color: PdfColors.grey700,
                  ),
                ),
              ],
            ),
            pw.Text(
              'OPERATIONAL RECORD',
              style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey600),
            ),
          ],
        ),
      ),
      footer: (ctx) => pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(
            'ReliefNexus  Disaster Response Network',
            style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey600),
          ),
          pw.Text(
            'Page ${ctx.pageNumber}',
            style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey600),
          ),
        ],
      ),
      build: (_) => [
        pw.SizedBox(height: 18),
        pw.Text(
          item.disasterType,
          style: pw.TextStyle(
            fontSize: 24,
            fontWeight: pw.FontWeight.bold,
            color: PdfColors.blue900,
          ),
        ),
        pw.SizedBox(height: 4),
        pw.Text(
          item.location,
          style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
        ),
        pw.SizedBox(height: 16),

        _pdfBlock('INCIDENT PROFILE', [
          _pdfLine('Report ID', item.id),
          _pdfLine('Disaster type', item.disasterType),
          _pdfLine('Severity', item.severity),
          _pdfLine('Status', item.status),
        ]),

        _pdfBlock('REPORTER', [
          _pdfLine('Reporter', item.reporterName),
          _pdfLine(
            'Email',
            item.reporterEmail.isEmpty ? 'Not available' : item.reporterEmail,
          ),
        ]),

        _pdfBlock('LOCATION INTELLIGENCE', [
          _pdfLine('Location', item.location),
          _pdfLine(
            'Latitude',
            item.latitude?.toStringAsFixed(6) ?? 'Not available',
          ),
          _pdfLine(
            'Longitude',
            item.longitude?.toStringAsFixed(6) ?? 'Not available',
          ),
        ]),

        _pdfBlock('OPERATIONAL ASSIGNMENT', [
          _pdfLine('Volunteer', item.assignedVolunteerName ?? 'Not assigned'),
          _pdfLine(
            'Assigned at',
            item.assignedAt?.toLocal().toString() ?? 'Not assigned',
          ),
        ]),

        _pdfBlock('INCIDENT DESCRIPTION', [
          pw.Text(
            item.description.isEmpty
                ? 'No description supplied.'
                : item.description,
            style: const pw.TextStyle(fontSize: 9, lineSpacing: 3),
          ),
        ]),

        _pdfBlock('WORKFLOW', [
          _pdfLine(
            'Created',
            item.createdAt?.toLocal().toString() ?? 'Not available',
          ),
          _pdfLine(
            'Updated',
            item.updatedAt?.toLocal().toString() ?? 'Not available',
          ),
          _pdfLine('Current stage', item.status),
        ]),

        _pdfBlock('AI WORKFLOW', [
          _pdfLine('Agent 01', 'Risk Prediction'),
          _pdfLine('Agent 02', 'Vulnerability & Impact'),
          _pdfLine('Agent 03', 'Resource Optimization'),
          _pdfLine('Agent 04', 'Early Warning & Coordination'),
        ]),
      ],
    ),
  );

  final bytes = await document.save();

  final safeType = item.disasterType.replaceAll(RegExp(r'[^A-Za-z0-9]+'), '_');

  await Printing.sharePdf(
    bytes: bytes,
    filename: 'ReliefNexus_${safeType}_${item.id}.pdf',
  );
}

pw.Widget _pdfBlock(String title, List<pw.Widget> children) {
  return pw.Container(
    margin: const pw.EdgeInsets.only(top: 14),
    padding: const pw.EdgeInsets.all(12),
    decoration: pw.BoxDecoration(
      border: pw.Border.all(color: PdfColors.grey300),
      borderRadius: pw.BorderRadius.circular(8),
    ),
    child: pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(
          title,
          style: pw.TextStyle(
            fontSize: 8,
            fontWeight: pw.FontWeight.bold,
            color: PdfColors.blue700,
          ),
        ),
        pw.SizedBox(height: 8),
        ...children,
      ],
    ),
  );
}

pw.Widget _pdfLine(String label, String value) {
  return pw.Padding(
    padding: const pw.EdgeInsets.only(bottom: 5),
    child: pw.Row(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.SizedBox(
          width: 110,
          child: pw.Text(
            label,
            style: pw.TextStyle(
              fontSize: 8,
              fontWeight: pw.FontWeight.bold,
              color: PdfColors.grey700,
            ),
          ),
        ),
        pw.Expanded(
          child: pw.Text(value, style: const pw.TextStyle(fontSize: 8)),
        ),
      ],
    ),
  );
}

class _DisasterReportsMap extends StatelessWidget {
  const _DisasterReportsMap();

  Color _severityColor(String severity) {
    final value = severity.toLowerCase();

    if (value.contains('critical')) {
      return const Color(0xFFD90429);
    }

    if (value.contains('high')) {
      return const Color(0xFFFF5570);
    }

    if (value.contains('medium')) {
      return const Color(0xFFFF9B45);
    }

    return const Color(0xFF16B77A);
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DisasterReportsProvider>();

    final reports = provider.filtered
        .where(
          (item) =>
              item.latitude != null &&
              item.longitude != null &&
              item.latitude!.abs() <= 90 &&
              item.longitude!.abs() <= 180,
        )
        .toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 18),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: _line),
          boxShadow: const [
            BoxShadow(
              color: Color(0x12071A3D),
              blurRadius: 18,
              offset: Offset(0, 7),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 15, 16, 12),
              child: Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEAF2FF),
                      borderRadius: BorderRadius.circular(13),
                    ),
                    child: const Icon(Icons.map_rounded, color: _blue),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'DISASTER REPORT MAP',
                          style: TextStyle(
                            color: _blue,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          'All reported incidents',
                          style: TextStyle(
                            color: _navy,
                            fontSize: 17,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 7,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEAFBF4),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '${reports.length} locations',
                      style: const TextStyle(
                        color: _green,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(
              height: 390,
              child: FlutterMap(
                options: const MapOptions(
                  initialCenter: LatLng(7.8731, 80.7718),
                  initialZoom: 7.2,
                  minZoom: 5.5,
                  maxZoom: 17,
                ),
                children: [
                  TileLayer(
                    urlTemplate:
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.reliefnexus.mobile',
                  ),
                  MarkerLayer(
                    markers: reports.map((item) {
                      final color = _severityColor(item.severity);

                      return Marker(
                        point: LatLng(item.latitude!, item.longitude!),
                        width: 48,
                        height: 48,
                        child: GestureDetector(
                          onTap: () {
                            showModalBottomSheet(
                              context: context,
                              backgroundColor: Colors.white,
                              isScrollControlled: true,
                              shape: const RoundedRectangleBorder(
                                borderRadius: BorderRadius.vertical(
                                  top: Radius.circular(28),
                                ),
                              ),
                              builder: (_) =>
                                  _MapReportSheet(item: item, color: color),
                            );
                          },
                          child: Container(
                            decoration: BoxDecoration(
                              color: color,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 3),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x33000000),
                                  blurRadius: 8,
                                  offset: Offset(0, 3),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.warning_rounded,
                              color: Colors.white,
                              size: 22,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 15),
              child: Row(
                children: [
                  _MapLegendDot(
                    color: const Color(0xFFD90429),
                    label: 'Critical',
                  ),
                  const SizedBox(width: 14),
                  _MapLegendDot(color: const Color(0xFFFF5570), label: 'High'),
                  const SizedBox(width: 14),
                  _MapLegendDot(
                    color: const Color(0xFFFF9B45),
                    label: 'Medium',
                  ),
                  const SizedBox(width: 14),
                  _MapLegendDot(color: const Color(0xFF16B77A), label: 'Low'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MapLegendDot extends StatelessWidget {
  final Color color;
  final String label;

  const _MapLegendDot({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 9,
          height: 9,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 5),
        Text(
          label,
          style: const TextStyle(
            color: _muted,
            fontSize: 10,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _MapReportSheet extends StatelessWidget {
  final DisasterReportModel item;
  final Color color;

  const _MapReportSheet({required this.item, required this.color});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 42,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFD9E1EC),
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: Text(
                    item.disasterType,
                    style: const TextStyle(
                      color: _navy,
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 11,
                    vertical: 7,
                  ),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    item.severity.toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.location_on_rounded, color: _blue, size: 18),
                const SizedBox(width: 7),
                Expanded(
                  child: Text(
                    item.location,
                    style: const TextStyle(
                      color: _muted,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.info_outline_rounded, color: _muted, size: 18),
                const SizedBox(width: 7),
                Text(
                  item.status,
                  style: const TextStyle(
                    color: _navy,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => DisasterReportProcessPage(report: item),
                    ),
                  );
                },
                icon: const Icon(Icons.route_rounded),
                label: const Text(
                  'OPEN DISASTER RESPONSE PROCESS',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _navy,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}




