import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../../data/models/risk_prediction_model.dart';
import '../providers/risk_predictions_provider.dart';

class RiskPredictionDetails extends StatefulWidget {
  final RiskPredictionModel prediction;

  const RiskPredictionDetails({
    super.key,
    required this.prediction,
  });

  @override
  State<RiskPredictionDetails> createState() =>
      _RiskPredictionDetailsState();
}

class _RiskPredictionDetailsState
    extends State<RiskPredictionDetails> {
  bool _loadingExplanation = false;
  dynamic _explanation;
  String? _explanationError;

  RiskPredictionModel get prediction => widget.prediction;

  Color get riskColor {
    switch (prediction.riskLevel.toLowerCase()) {
      case 'critical':
        return const Color(0xFFB91C1C);
      case 'high':
        return const Color(0xFFDC2626);
      case 'medium':
      case 'moderate':
        return const Color(0xFFD97706);
      case 'low':
        return const Color(0xFF16A34A);
      default:
        return const Color(0xFF64748B);
    }
  }

  String get riskDescription {
    switch (prediction.riskLevel.toLowerCase()) {
      case 'critical':
        return 'Immediate attention and coordinated response may be required.';
      case 'high':
        return 'Elevated risk conditions detected. Response readiness should be maintained.';
      case 'medium':
      case 'moderate':
        return 'Moderate risk conditions detected. Continue monitoring environmental changes.';
      case 'low':
        return 'Current indicators suggest relatively lower risk conditions.';
      default:
        return 'Risk classification is available from the prediction service.';
    }
  }

  Future<void> _loadExplanation() async {
    setState(() {
      _loadingExplanation = true;
      _explanationError = null;
    });

    try {
      final result = await context
          .read<RiskPredictionsProvider>()
          .explain(prediction.id);

      if (!mounted) return;

      setState(() {
        _explanation = result;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _explanationError = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _loadingExplanation = false;
        });
      }
    }
  }

  Widget _sectionTitle(
    String title,
    String subtitle,
    IconData icon,
  ) {
    return Padding(
      padding: const EdgeInsets.only(
        left: 2,
        bottom: 10,
      ),
      child: Row(
        crossAxisAlignment:
            CrossAxisAlignment.start,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: const Color(0xFFEAF6FF),
              borderRadius:
                  BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              size: 19,
              color: const Color(0xFF0EA5E9),
            ),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF06152F),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF71809B),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoCard({
    required String label,
    required String value,
    IconData? icon,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Row(
        crossAxisAlignment:
            CrossAxisAlignment.start,
        children: [
          if (icon != null) ...[
            Icon(
              icon,
              size: 18,
              color: const Color(0xFF0EA5E9),
            ),
            const SizedBox(width: 10),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF71809B),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value.isEmpty ? 'Not available' : value,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _metadataRow(
    String label,
    String value,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        vertical: 8,
      ),
      child: Row(
        crossAxisAlignment:
            CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: Color(0xFF71809B),
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Flexible(
            child: Text(
              value.isEmpty ? '' : value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _explanationValue(
    dynamic value,
    String label,
  ) {
    if (value is Map) {
      return Column(
        crossAxisAlignment:
            CrossAxisAlignment.start,
        children: value.entries.map((entry) {
          return Container(
            margin: const EdgeInsets.only(
              bottom: 9,
            ),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius:
                  BorderRadius.circular(13),
              border: Border.all(
                color: const Color(0xFFE2E8F0),
              ),
            ),
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [
                Text(
                  entry.key.toString(),
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  entry.value?.toString() ?? '',
                  style: const TextStyle(
                    fontSize: 13,
                    height: 1.35,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      );
    }

    if (value is List) {
      return Column(
        children: value
            .map(
              (item) => Padding(
                padding: const EdgeInsets.only(
                  bottom: 9,
                ),
                child: Row(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.check_circle_outline,
                      size: 18,
                      color: Color(0xFF0EA5E9),
                    ),
                    const SizedBox(width: 9),
                    Expanded(
                      child: Text(
                        item.toString(),
                        style: const TextStyle(
                          fontSize: 13,
                          height: 1.35,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            )
            .toList(),
      );
    }

    return Text(
      value?.toString() ?? 'No explanation available.',
      style: const TextStyle(
        fontSize: 13,
        height: 1.45,
        color: Color(0xFF334155),
      ),
    );
  }

  Widget _explanationCard() {
    if (_loadingExplanation) {
      return Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: const Color(0xFFD8E5F0),
          ),
        ),
        child: const Row(
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
              ),
            ),
            SizedBox(width: 12),
            Text(
              'Loading AI explanation...',
              style: TextStyle(
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      );
    }

    if (_explanationError != null) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF7F7),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: const Color(0xFFFECACA),
          ),
        ),
        child: Column(
          crossAxisAlignment:
              CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(
                  Icons.error_outline,
                  color: Color(0xFFDC2626),
                ),
                SizedBox(width: 8),
                Text(
                  'AI explanation unavailable',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF991B1B),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              _explanationError!,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFF7F1D1D),
              ),
            ),
          ],
        ),
      );
    }

    if (_explanation == null) {
      return Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: const Color(0xFFD8E5F0),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: const Color(0xFFEAF6FF),
                borderRadius:
                    BorderRadius.circular(13),
              ),
              child: const Icon(
                Icons.psychology_outlined,
                color: Color(0xFF0EA5E9),
              ),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,
                children: [
                  Text(
                    'AI Risk Explanation',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF06152F),
                    ),
                  ),
                  SizedBox(height: 3),
                  Text(
                    'Load the evidence-based explanation for this prediction.',
                    style: TextStyle(
                      fontSize: 11,
                      color: Color(0xFF71809B),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              onPressed: _loadExplanation,
              style: ButtonStyle(
                backgroundColor:
                    const WidgetStatePropertyAll(
                  Color(0xFF0EA5E9),
                ),
                foregroundColor:
                    const WidgetStatePropertyAll(
                  Colors.white,
                ),
                padding:
                    const WidgetStatePropertyAll(
                  EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                ),
              ),
              child: const Text(
                'View',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(17),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FBFF),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFFBDE3F8),
        ),
      ),
      child: Column(
        crossAxisAlignment:
            CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(
                Icons.auto_awesome,
                color: Color(0xFF0EA5E9),
              ),
              SizedBox(width: 8),
              Text(
                'AI Risk Explanation',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF06152F),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _explanationValue(
            _explanation,
            'Explanation',
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasLocation =
        prediction.latitude != null &&
        prediction.longitude != null;

    return Material(
      color: const Color(0xFFF1F6FB),
      borderRadius: const BorderRadius.vertical(
        top: Radius.circular(28),
      ),
      child: Column(
        children: [
          Container(
            width: 42,
            height: 5,
            margin: const EdgeInsets.only(
              top: 10,
              bottom: 5,
            ),
            decoration: BoxDecoration(
              color: const Color(0xFFCBD5E1),
              borderRadius:
                  BorderRadius.circular(10),
            ),
          ),

          Expanded(
            child: CustomScrollView(
              physics:
                  const BouncingScrollPhysics(),
              slivers: [
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(
                    14,
                    8,
                    14,
                    35,
                  ),
                  sliver: SliverList(
                    delegate:
                        SliverChildListDelegate([
                      // 
                      // PREMIUM RISK HERO
                      // 
                      Container(
                        padding:
                            const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient:
                              const LinearGradient(
                            colors: [
                              Color(0xFF06152F),
                              Color(0xFF08335E),
                              Color(0xFF0EA5E9),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius:
                              BorderRadius.circular(25),
                        ),
                        child: Column(
                          crossAxisAlignment:
                              CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding:
                                      const EdgeInsets
                                          .symmetric(
                                    horizontal: 9,
                                    vertical: 5,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(
                                      0xFF7DD3FC,
                                    ).withValues(
                                      alpha: .14,
                                    ),
                                    borderRadius:
                                        BorderRadius
                                            .circular(
                                      30,
                                    ),
                                  ),
                                  child: const Text(
                                    'AGENT 01',
                                    style: TextStyle(
                                      color: Color(
                                        0xFF7DD3FC,
                                      ),
                                      fontSize: 10,
                                      fontWeight:
                                          FontWeight.w900,
                                      letterSpacing: 1,
                                    ),
                                  ),
                                ),
                                const Spacer(),
                                Container(
                                  padding:
                                      const EdgeInsets
                                          .symmetric(
                                    horizontal: 11,
                                    vertical: 7,
                                  ),
                                  decoration: BoxDecoration(
                                    color: riskColor
                                        .withValues(
                                      alpha: .18,
                                    ),
                                    borderRadius:
                                        BorderRadius
                                            .circular(
                                      30,
                                    ),
                                  ),
                                  child: Text(
                                    prediction.riskLevel
                                        .toUpperCase(),
                                    style: TextStyle(
                                      color: riskColor,
                                      fontSize: 10,
                                      fontWeight:
                                          FontWeight.w900,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 18),
                            Text(
                              prediction.disasterType
                                      .isEmpty
                                  ? 'Risk Prediction'
                                  : prediction
                                      .disasterType,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 25,
                                fontWeight:
                                    FontWeight.w900,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              prediction.location
                                      .isEmpty
                                  ? 'Location unavailable'
                                  : prediction.location,
                              style: const TextStyle(
                                color: Color(0xFFD7EEFF),
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 20),
                            Row(
                              crossAxisAlignment:
                                  CrossAxisAlignment.end,
                              children: [
                                Text(
                                  prediction.riskScore
                                      .toStringAsFixed(1),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 48,
                                    height: .95,
                                    fontWeight:
                                        FontWeight.w900,
                                  ),
                                ),
                                const SizedBox(width: 9),
                                const Padding(
                                  padding:
                                      EdgeInsets.only(
                                    bottom: 5,
                                  ),
                                  child: Text(
                                    'RISK SCORE',
                                    style: TextStyle(
                                      color: Color(
                                        0xFFB9D8EF,
                                      ),
                                      fontSize: 9,
                                      fontWeight:
                                          FontWeight.w900,
                                      letterSpacing: 1,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 15),
                            Container(
                              width: double.infinity,
                              padding:
                                  const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white
                                    .withValues(
                                  alpha: .08,
                                ),
                                borderRadius:
                                    BorderRadius.circular(
                                  14,
                                ),
                              ),
                              child: Text(
                                riskDescription,
                                style: const TextStyle(
                                  color: Color(
                                    0xFFDCEEFF,
                                  ),
                                  fontSize: 11,
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),

                      // 
                      // KEY METRICS
                      // 
                      _sectionTitle(
                        'Risk Intelligence',
                        'Core indicators returned by Agent 01.',
                        Icons.insights_rounded,
                      ),

                      Row(
                        children: [
                          Expanded(
                            child: _infoCard(
                              label: 'Confidence',
                              value:
                                  '${prediction.confidence.toStringAsFixed(1)}%',
                              icon:
                                  Icons.verified_outlined,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _infoCard(
                              label: 'Risk Level',
                              value: prediction
                                  .riskLevel
                                  .toUpperCase(),
                              icon:
                                  Icons.warning_amber_rounded,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 10),

                      Row(
                        children: [
                          Expanded(
                            child: _infoCard(
                              label: 'Prediction ID',
                              value: prediction.id,
                              icon:
                                  Icons.fingerprint_rounded,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      // 
                      // AI EXPLANATION
                      // 
                      _sectionTitle(
                        'Decision Support',
                        'Understand why the prediction was generated.',
                        Icons.psychology_outlined,
                      ),

                      _explanationCard(),

                      const SizedBox(height: 20),

                      // 
                      // MODEL INFORMATION
                      // 
                      _sectionTitle(
                        'Model & Data Provenance',
                        'Prediction generation metadata.',
                        Icons.account_tree_outlined,
                      ),

                      Container(
                        padding:
                            const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius:
                              BorderRadius.circular(20),
                          border: Border.all(
                            color: const Color(
                              0xFFD8E5F0,
                            ),
                          ),
                        ),
                        child: Column(
                          children: [
                            _metadataRow(
                              'Model version',
                              prediction.modelVersion,
                            ),
                            const Divider(
                              height: 1,
                              color: Color(0xFFE8EEF5),
                            ),
                            _metadataRow(
                              'Prediction source',
                              prediction
                                  .predictionSource,
                            ),
                            const Divider(
                              height: 1,
                              color: Color(0xFFE8EEF5),
                            ),
                            _metadataRow(
                              'Created',
                              prediction.createdAt
                                      ?.toLocal()
                                      .toString() ??
                                  '',
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),

                      // 
                      // RECOMMENDATIONS
                      // 
                      _sectionTitle(
                        'Recommended Actions',
                        'Operational guidance returned by the prediction.',
                        Icons.task_alt_rounded,
                      ),

                      Container(
                        padding:
                            const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius:
                              BorderRadius.circular(20),
                          border: Border.all(
                            color: const Color(
                              0xFFD8E5F0,
                            ),
                          ),
                        ),
                        child: prediction
                                .recommendations
                                .isEmpty
                            ? const Padding(
                                padding:
                                    EdgeInsets.all(8),
                                child: Text(
                                  'No recommendations available for this prediction.',
                                  style: TextStyle(
                                    color: Color(
                                      0xFF64748B,
                                    ),
                                  ),
                                ),
                              )
                            : Column(
                                children: List.generate(
                                  prediction
                                      .recommendations
                                      .length,
                                  (index) {
                                    final item =
                                        prediction
                                            .recommendations[
                                                index];

                                    return Padding(
                                      padding:
                                          EdgeInsets.only(
                                        bottom: index ==
                                                prediction
                                                        .recommendations
                                                        .length -
                                                    1
                                            ? 0
                                            : 13,
                                      ),
                                      child: Row(
                                        crossAxisAlignment:
                                            CrossAxisAlignment
                                                .start,
                                        children: [
                                          Container(
                                            width: 29,
                                            height: 29,
                                            decoration:
                                                BoxDecoration(
                                              color:
                                                  const Color(
                                                0xFFEAF6FF,
                                              ),
                                              borderRadius:
                                                  BorderRadius
                                                      .circular(
                                                10,
                                              ),
                                            ),
                                            child:
                                                const Icon(
                                              Icons
                                                  .check_rounded,
                                              size: 17,
                                              color:
                                                  Color(
                                                0xFF0EA5E9,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(
                                            width: 11,
                                          ),
                                          Expanded(
                                            child: Text(
                                              item,
                                              style:
                                                  const TextStyle(
                                                fontSize: 13,
                                                height: 1.35,
                                                fontWeight:
                                                    FontWeight
                                                        .w600,
                                                color:
                                                    Color(
                                                  0xFF334155,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                              ),
                      ),

                      // 
                      // LOCATION
                      // 
                      if (hasLocation) ...[
                        const SizedBox(height: 20),

                        _sectionTitle(
                          'Location Intelligence',
                          'Geographic position associated with this prediction.',
                          Icons.location_on_outlined,
                        ),

                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius:
                                BorderRadius.circular(
                              20,
                            ),
                            border: Border.all(
                              color: const Color(
                                0xFFD8E5F0,
                              ),
                            ),
                          ),
                          padding:
                              const EdgeInsets.all(10),
                          child: Column(
                            children: [
                              ClipRRect(
                                borderRadius:
                                    BorderRadius.circular(
                                  15,
                                ),
                                child: SizedBox(
                                  height: 240,
                                  child: FlutterMap(
                                    options: MapOptions(
                                      initialCenter:
                                          LatLng(
                                        prediction
                                            .latitude!,
                                        prediction
                                            .longitude!,
                                      ),
                                      initialZoom: 11,
                                    ),
                                    children: [
                                      TileLayer(
                                        urlTemplate:
                                            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                        userAgentPackageName:
                                            'com.reliefnexus.mobile',
                                      ),
                                      MarkerLayer(
                                        markers: [
                                          Marker(
                                            point: LatLng(
                                              prediction
                                                  .latitude!,
                                              prediction
                                                  .longitude!,
                                            ),
                                            width: 48,
                                            height: 48,
                                            child:
                                                const Icon(
                                              Icons
                                                  .location_pin,
                                              color:
                                                  Color(
                                                0xFFDC2626,
                                              ),
                                              size: 46,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  Expanded(
                                    child: _infoCard(
                                      label: 'Latitude',
                                      value: prediction
                                          .latitude!
                                          .toStringAsFixed(
                                        6,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(
                                    width: 10,
                                  ),
                                  Expanded(
                                    child: _infoCard(
                                      label: 'Longitude',
                                      value: prediction
                                          .longitude!
                                          .toStringAsFixed(
                                        6,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ]),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

