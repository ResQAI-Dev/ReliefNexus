import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../../data/models/risk_prediction_model.dart';
import '../providers/risk_predictions_provider.dart';

class RiskPredictionDetailsPage extends StatefulWidget {
  final RiskPredictionModel prediction;
  final RiskPredictionsProvider provider;

  const RiskPredictionDetailsPage({
    super.key,
    required this.prediction,
    required this.provider,
  });

  @override
  State<RiskPredictionDetailsPage> createState() =>
      _RiskPredictionDetailsPageState();
}

class _RiskPredictionDetailsPageState extends State<RiskPredictionDetailsPage> {
  static const sky = Color(0xFF03A9F4);
  static const blue = Color(0xFF0288D1);
  static const navy = Color(0xFF003B5C);
  static const bg = Color(0xFFF5FAFD);
  static const line = Color(0xFFD7ECF6);
  static const muted = Color(0xFF607D8B);
  static const green = Color(0xFF16A673);

  late RiskPredictionModel _prediction;
  bool _loading = false;
  bool _exporting = false;
  @override
  void initState() {
    super.initState();

    // Keep the complete Agent 01 response returned by
    // POST /risk-predictions.
    //
    // The POST response already contains the real
    // disasterRisks calculated by Agent 01.
    //
    // Do NOT call GET /risk-predictions/{id} here because
    // that response can overwrite the complete disasterRisks
    // list with an empty list.
    _prediction = widget.prediction;
  }

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
    if (d.contains('avalanche')) {
      return 'assets/images/disasters/avalanche.jpg';
    }

    return 'assets/images/disasters/disaster_default.jpg';
  }

  DisasterRiskModel? _highestApprovalRisk() {
    final risks = _prediction.disasterRisks
        .where((risk) => risk.dataAvailable && risk.riskScore != null)
        .toList();

    if (risks.isEmpty) {
      return null;
    }

    risks.sort((a, b) => b.riskScore!.compareTo(a.riskScore!));

    return risks.first;
  }

  Color _riskColor(String level) {
    switch (level.toLowerCase()) {
      case 'critical':
        return const Color(0xFFD92D4F);
      case 'high':
        return const Color(0xFFE67E22);
      case 'medium':
      case 'moderate':
        return const Color(0xFFF59E0B);
      case 'low':
        return green;
      default:
        return blue;
    }
  }

  String _score(double value) {
    return value % 1 == 0 ? value.toInt().toString() : value.toStringAsFixed(1);
  }

  String _confidence(double value) {
    final percent = value <= 1 ? value * 100 : value;
    return '${_score(percent)}%';
  }

  String _number(double? value, {String suffix = ''}) {
    if (value == null) return 'N/A';
    return '${_score(value)}$suffix';
  }

  String _date(DateTime? value) {
    if (value == null) return 'N/A';
    final local = value.toLocal();
    String two(int v) => v.toString().padLeft(2, '0');
    return '${local.year}-${two(local.month)}-${two(local.day)} '
        '${two(local.hour)}:${two(local.minute)}';
  }

  String _approvalText() {
    if ((_prediction.approvalStatus ?? '').trim().isNotEmpty) {
      return _prediction.approvalStatus!;
    }
    if (_prediction.isApproved) return 'Approved';
    if (_prediction.requiresHumanApproval) return 'Pending Human Approval';
    return 'Generated';
  }

  Future<void> _exportPdf() async {
    if (_exporting) return;

    setState(() => _exporting = true);

    try {
      final imageData = await rootBundle.load(_photo(_prediction.disasterType));
      final image = pw.MemoryImage(imageData.buffer.asUint8List());
      final document = pw.Document();

      document.addPage(
        pw.MultiPage(
          build: (context) => [
            pw.Text(
              'ReliefNexus - Agent 01 Risk Prediction',
              style: pw.TextStyle(fontSize: 20, fontWeight: pw.FontWeight.bold),
            ),
            pw.SizedBox(height: 12),
            pw.ClipRRect(
              horizontalRadius: 12,
              verticalRadius: 12,
              child: pw.Image(
                image,
                height: 180,
                width: 500,
                fit: pw.BoxFit.cover,
              ),
            ),
            pw.SizedBox(height: 14),
            pw.Text(
              _prediction.disasterType.isEmpty
                  ? 'Disaster Risk Prediction'
                  : _prediction.disasterType,
              style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold),
            ),
            pw.Text(
              _prediction.location.isEmpty ? 'N/A' : _prediction.location,
            ),
            pw.SizedBox(height: 12),
            pw.Table(
              border: pw.TableBorder.all(),
              children: [
                _pdfRow('Risk Score', '${_score(_prediction.riskScore)}%'),
                _pdfRow('Risk Level', _prediction.riskLevel),
                _pdfRow('Confidence', _confidence(_prediction.confidence)),
                _pdfRow('AI Source', _prediction.predictionSource),
                _pdfRow('Model', _prediction.modelVersion),
                _pdfRow('Governance', _approvalText()),
                _pdfRow('Created', _date(_prediction.createdAt)),
                _pdfRow(
                  'Coordinates',
                  '${_prediction.latitude?.toStringAsFixed(6) ?? 'N/A'}, '
                      '${_prediction.longitude?.toStringAsFixed(6) ?? 'N/A'}',
                ),
              ],
            ),
            pw.SizedBox(height: 16),
            pw.Text(
              'Disaster Risk Portfolio',
              style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold),
            ),
            pw.SizedBox(height: 6),
            if (_prediction.disasterRisks.isEmpty)
              pw.Text('No disaster portfolio data returned.')
            else
              ..._prediction.disasterRisks.map(
                (risk) => pw.Padding(
                  padding: const pw.EdgeInsets.only(bottom: 5),
                  child: pw.Text(
                    '${risk.disasterType}: '
                    '${risk.riskScore == null ? 'N/A' : '${_score(risk.riskScore!)}%'} '
                    '(${risk.riskLevel}) - '
                    '${risk.dataAvailable ? risk.dataSource : 'Data unavailable'}',
                  ),
                ),
              ),
            pw.SizedBox(height: 12),
            pw.Text(
              'Risk Factors',
              style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold),
            ),
            pw.SizedBox(height: 6),
            if (_prediction.riskFactors.isEmpty)
              pw.Text('No risk factors returned.')
            else
              ..._prediction.riskFactors.map(
                (factor) => pw.Padding(
                  padding: const pw.EdgeInsets.only(bottom: 5),
                  child: pw.Text(
                    '${factor.factor}: '
                    'value=${factor.value == null ? 'N/A' : _score(factor.value!)}; '
                    'impact=${factor.impact.isEmpty ? 'N/A' : factor.impact}; '
                    'contribution=${factor.contribution == null ? 'N/A' : '${_score(factor.contribution!)}%'}',
                  ),
                ),
              ),
            pw.SizedBox(height: 12),
            pw.Text(
              'Environmental & Geographic Data',
              style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold),
            ),
            pw.SizedBox(height: 6),
            pw.Table(
              border: pw.TableBorder.all(),
              children: _pdfEnvironmentRows(),
            ),
            pw.SizedBox(height: 12),
            pw.Text(
              'Recommendations',
              style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold),
            ),
            pw.SizedBox(height: 6),
            if (_prediction.recommendations.isEmpty)
              pw.Text('No recommendations returned.')
            else
              ..._prediction.recommendations.map(
                (item) => pw.Padding(
                  padding: const pw.EdgeInsets.only(bottom: 5),
                  child: pw.Text('- $item'),
                ),
              ),
          ],
        ),
      );

      await Printing.sharePdf(
        bytes: await document.save(),
        filename:
            'ReliefNexus_Agent01_${_prediction.disasterType.replaceAll(' ', '_')}.pdf',
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Export failed: $e')));
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  List<pw.TableRow> _pdfEnvironmentRows() {
    return [
      _pdfRow('Rainfall 1h', _number(_prediction.rainfall1h)),
      _pdfRow('Rainfall 3h', _number(_prediction.rainfall3h)),
      _pdfRow('Rainfall 24h', _number(_prediction.rainfall24h)),
      _pdfRow('Forecast Rainfall', _number(_prediction.forecastRainfall)),
      _pdfRow('River Level', _number(_prediction.riverLevel)),
      _pdfRow('River Flow', _number(_prediction.riverFlow)),
      _pdfRow('Temperature', _number(_prediction.temperature)),
      _pdfRow('Humidity', _number(_prediction.humidity)),
      _pdfRow('Wind Speed', _number(_prediction.windSpeed)),
      _pdfRow('Soil Moisture', _number(_prediction.soilMoisture)),
      _pdfRow('Elevation', _number(_prediction.elevation)),
      _pdfRow('Population Density', _number(_prediction.populationDensity)),
      _pdfRow(
        'Historical Flood Count',
        _number(_prediction.historicalFloodCount),
      ),
      _pdfRow('Historical Severity', _number(_prediction.historicalSeverity)),
      _pdfRow('Drainage Capacity', _number(_prediction.drainageCapacity)),
    ];
  }

  pw.TableRow _pdfRow(String label, String value) {
    return pw.TableRow(
      children: [
        pw.Padding(
          padding: const pw.EdgeInsets.all(7),
          child: pw.Text(
            label,
            style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
          ),
        ),
        pw.Padding(
          padding: const pw.EdgeInsets.all(7),
          child: pw.Text(value.isEmpty ? 'N/A' : value),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final riskColor = _riskColor(_prediction.riskLevel);

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: navy,
        elevation: 0,
        title: const Text(
          'Risk Prediction',
          style: TextStyle(
            color: navy,
            fontSize: 16,
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: sky))
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 30),
              children: [
                _photoHeader(riskColor),
                const SizedBox(height: 12),
                _metrics(riskColor),
                const SizedBox(height: 12),
                _summaryCard(
                  title: 'RISK SUMMARY',
                  icon: Icons.analytics_rounded,
                  children: [
                    _row('Disaster', _prediction.disasterType),
                    _row('Location', _prediction.location),
                    _row(
                      'Risk level',
                      _prediction.riskLevel.toUpperCase(),
                      valueColor: riskColor,
                    ),
                    _row('Confidence', _confidence(_prediction.confidence)),
                    _row('AI status', _approvalText()),
                    _row(
                      'Human approval',
                      _prediction.requiresHumanApproval
                          ? 'Required'
                          : 'Not required',
                    ),
                  ],
                ),
                _locationCard(),
                _riskPortfolio(),
                _environmentCard(),
                _riskFactorsCard(),
                _recommendationsCard(),
                _aiSourceCard(),
                const SizedBox(height: 4),
                SizedBox(
                  height: 50,
                  child: OutlinedButton.icon(
                    onPressed: _exporting ? null : _exportPdf,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: blue,
                      side: const BorderSide(color: sky, width: 1.4),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15),
                      ),
                    ),
                    icon: _exporting
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: blue,
                            ),
                          )
                        : const Icon(Icons.picture_as_pdf_rounded),
                    label: Text(
                      _exporting
                          ? 'PREPARING REPORT...'
                          : 'EXPORT FULL RISK REPORT',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _photoHeader(Color riskColor) {
    return Container(
      height: 235,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: Color(0x18003B5C),
            blurRadius: 15,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset(
            _photo(_prediction.disasterType),
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Container(color: navy),
          ),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0x15003B5C), Color(0xE6003B5C)],
              ),
            ),
          ),
          Positioned(
            top: 15,
            left: 15,
            child: _heroBadge(Icons.auto_awesome_rounded, 'AGENT 01'),
          ),
          Positioned(
            top: 15,
            right: 15,
            child: _heroBadge(Icons.circle, 'LIVE'),
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 16,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 5),
                      Text(
                        _prediction.disasterType.isEmpty
                            ? 'Disaster Risk'
                            : _prediction.disasterType,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        _prediction.location.isEmpty
                            ? 'Location unavailable'
                            : _prediction.location,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
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
                    color: riskColor,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _prediction.riskLevel.toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
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

  Widget _heroBadge(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(.28),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.white.withOpacity(.22)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: const Color(0xFF7DD8FF), size: 11),
          const SizedBox(width: 5),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 8,
              fontWeight: FontWeight.w900,
              letterSpacing: .7,
            ),
          ),
        ],
      ),
    );
  }

  Widget _metrics(Color riskColor) {
    return Row(
      children: [
        Expanded(
          child: _metric(
            'RISK SCORE',
            '${_score(_prediction.riskScore)}%',
            color: riskColor,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _metric('CONFIDENCE', _confidence(_prediction.confidence)),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _metric(
            'STATUS',
            _prediction.isApproved ? 'APPROVED' : 'PENDING',
            color: blue,
          ),
        ),
      ],
    );
  }

  Widget _metric(String label, String value, {Color color = navy}) {
    return Container(
      padding: const EdgeInsets.all(11),
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

  Widget _locationCard() {
    final hasCoordinates =
        _prediction.latitude != null && _prediction.longitude != null;

    return _summaryCard(
      title: 'LOCATION & GEOSPATIAL CONTEXT',
      icon: Icons.location_on_rounded,
      children: [
        _row('Location', _prediction.location),
        _row('Latitude', _prediction.latitude?.toStringAsFixed(6) ?? 'N/A'),
        _row('Longitude', _prediction.longitude?.toStringAsFixed(6) ?? 'N/A'),
        if (hasCoordinates) ...[
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: SizedBox(
              height: 220,
              child: FlutterMap(
                options: MapOptions(
                  initialCenter: LatLng(
                    _prediction.latitude!,
                    _prediction.longitude!,
                  ),
                  initialZoom: 12,
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
                        point: LatLng(
                          _prediction.latitude!,
                          _prediction.longitude!,
                        ),
                        width: 48,
                        height: 48,
                        child: const Icon(
                          Icons.location_pin,
                          color: Color(0xFFDC2626),
                          size: 44,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  String _disasterPhoto(String disaster) {
    final d = disaster.toLowerCase().trim();

    if (d.contains('flood')) {
      return 'assets/images/disasters/flood.jpg';
    }

    if (d.contains('landslide')) {
      return 'assets/images/disasters/landslide.jpg';
    }

    if (d.contains('storm') || d.contains('cyclone')) {
      return 'assets/images/disasters/cyclone.jpg';
    }

    if (d.contains('drought')) {
      return 'assets/images/disasters/drought.jpg';
    }

    if (d.contains('wildfire') || d.contains('forest fire')) {
      return 'assets/images/disasters/wildfire.jpg';
    }

    if (d.contains('earthquake')) {
      return 'assets/images/disasters/earthquake.jpg';
    }

    if (d.contains('tsunami')) {
      return 'assets/images/disasters/tsunami.jpg';
    }

    if (d.contains('lightning')) {
      return 'assets/images/disasters/lightning.jpg';
    }

    if (d.contains('heatwave')) {
      return 'assets/images/disasters/heatwave.jpg';
    }

    if (d.contains('volcanic')) {
      return 'assets/images/disasters/volcanic-eruption.jpg';
    }

    if (d.contains('avalanche')) {
      return 'assets/images/disasters/avalanche.jpg';
    }

    if (d.contains('cold wave') || d.contains('extreme cold')) {
      return 'assets/images/disasters/cold-wave.jpg';
    }

    return 'assets/images/disasters/disaster_default.jpg';
  }

  Widget _riskPortfolio() {
    final risks = _prediction.disasterRisks;

    return _summaryCard(
      title: 'DISASTER RISK RESULTS (${risks.length})',
      icon: Icons.grid_view_rounded,
      children: risks.isEmpty
          ? [
              const Text(
                'No disaster risk results were returned by Agent 01.',
                style: TextStyle(color: muted, fontSize: 11),
              ),
            ]
          : [
              Text(
                '${risks.length} disaster risk assessments returned from Agent 01',
                style: const TextStyle(
                  color: muted,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: risks.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisExtent: 215,
                  crossAxisSpacing: 9,
                  mainAxisSpacing: 9,
                ),
                itemBuilder: (context, index) {
                  return _riskPortfolioItem(risks[index]);
                },
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 42,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          final highest = _highestApprovalRisk();

                          if (highest == null) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'No valid risk prediction available for approval.',
                                ),
                              ),
                            );
                            return;
                          }

                          _approveRisk(highest);
                        },
                        icon: const Icon(Icons.check_circle_rounded, size: 18),
                        label: const Text(
                          'Approve',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          elevation: 0,
                          backgroundColor: const Color(0xFFE1F8EF),
                          foregroundColor: const Color(0xFF0B9F6E),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: SizedBox(
                      height: 42,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          final highest = _highestApprovalRisk();

                          if (highest == null) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'No valid risk prediction available for rejection.',
                                ),
                              ),
                            );
                            return;
                          }

                          _rejectRisk(highest);
                        },
                        icon: const Icon(Icons.close_rounded, size: 18),
                        label: const Text(
                          'Reject',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          elevation: 0,
                          backgroundColor: const Color(0xFFFFE8E8),
                          foregroundColor: const Color(0xFFE53935),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
    );
  }

  Widget _riskPortfolioItem(DisasterRiskModel risk) {
    final color = _riskColor(risk.riskLevel);
    final photo = _disasterPhoto(risk.disasterType);

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8FBFD),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: line),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 10, 10, 6),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    risk.disasterType.isEmpty
                        ? 'Unknown Disaster'
                        : risk.disasterType,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: navy,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                Icon(
                  risk.dataAvailable
                      ? Icons.verified_rounded
                      : Icons.info_outline_rounded,
                  size: 14,
                  color: risk.dataAvailable ? green : muted,
                ),
              ],
            ),
          ),

          SizedBox(
            height: 80,
            width: double.infinity,
            child: Image.asset(
              photo,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) {
                return Image.asset(
                  'assets/images/disasters/disaster_default.jpg',
                  fit: BoxFit.cover,
                );
              },
            ),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(10, 7, 10, 9),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  risk.riskScore == null
                      ? 'N/A'
                      : '${_score(risk.riskScore!)}%',
                  style: TextStyle(
                    color: color,
                    fontSize: 19,
                    fontWeight: FontWeight.w900,
                  ),
                ),

                const SizedBox(height: 3),

                Row(
                  children: [
                    Flexible(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: color.withOpacity(.10),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          risk.riskLevel.toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: color,
                            fontSize: 7,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 5),

                Text(
                  risk.dataAvailable
                      ? (risk.dataSource.isEmpty
                            ? 'Data available'
                            : risk.dataSource)
                      : 'Data unavailable',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: muted,
                    fontSize: 7,
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

  void _approveRisk(DisasterRiskModel risk) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${risk.disasterType} selected for approval.')),
    );
  }

  void _rejectRisk(DisasterRiskModel risk) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${risk.disasterType} selected for rejection.')),
    );
  }

  Widget _environmentCard() {
    return _summaryCard(
      title: 'ENVIRONMENTAL & GEOGRAPHIC SIGNALS',
      icon: Icons.cloud_outlined,
      children: [
        _signalGrid([
          _Signal('Rainfall 1h', _number(_prediction.rainfall1h)),
          _Signal('Rainfall 3h', _number(_prediction.rainfall3h)),
          _Signal('Rainfall 24h', _number(_prediction.rainfall24h)),
          _Signal('Forecast Rain', _number(_prediction.forecastRainfall)),
          _Signal('River Level', _number(_prediction.riverLevel)),
          _Signal('River Flow', _number(_prediction.riverFlow)),
          _Signal('Temperature', _number(_prediction.temperature)),
          _Signal('Humidity', _number(_prediction.humidity)),
          _Signal('Wind Speed', _number(_prediction.windSpeed)),
          _Signal('Soil Moisture', _number(_prediction.soilMoisture)),
          _Signal('Elevation', _number(_prediction.elevation)),
          _Signal('Population Density', _number(_prediction.populationDensity)),
          _Signal(
            'Historical Floods',
            _number(_prediction.historicalFloodCount),
          ),
          _Signal(
            'Historical Severity',
            _number(_prediction.historicalSeverity),
          ),
          _Signal('Drainage Capacity', _number(_prediction.drainageCapacity)),
        ]),
      ],
    );
  }

  Widget _signalGrid(List<_Signal> signals) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: signals.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisExtent: 67,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemBuilder: (_, index) {
        final signal = signals[index];
        return Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FBFD),
            borderRadius: BorderRadius.circular(13),
            border: Border.all(color: line),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                signal.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: muted,
                  fontSize: 8,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const Spacer(),
              Text(
                signal.value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: navy,
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

  Widget _riskFactorsCard() {
    final factors = _prediction.riskFactors;

    return _summaryCard(
      title: 'RISK FACTOR CONTRIBUTIONS',
      icon: Icons.warning_amber_rounded,
      children: factors.isEmpty
          ? [
              const Text(
                'No risk factors were returned by Agent 01.',
                style: TextStyle(color: muted, fontSize: 11),
              ),
            ]
          : factors.map(_factorItem).toList(),
    );
  }

  Widget _factorItem(RiskFactorModel factor) {
    final contribution = factor.contribution;
    final normalized = contribution == null
        ? 0.0
        : contribution.clamp(0.0, 100.0) / 100.0;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FBFD),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  factor.factor.isEmpty ? 'Risk Factor' : factor.factor,
                  style: const TextStyle(
                    color: navy,
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              Text(
                contribution == null ? 'N/A' : '${_score(contribution)}%',
                style: const TextStyle(
                  color: blue,
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 7),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              minHeight: 6,
              value: normalized,
              backgroundColor: const Color(0xFFE4F0F6),
              valueColor: const AlwaysStoppedAnimation<Color>(sky),
            ),
          ),
          const SizedBox(height: 7),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Value: ${factor.value == null ? 'N/A' : _score(factor.value!)}',
                  style: const TextStyle(
                    color: muted,
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Text(
                factor.impact.isEmpty ? 'Impact: N/A' : factor.impact,
                style: const TextStyle(
                  color: navy,
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _recommendationsCard() {
    final recommendations = _prediction.recommendations;

    return _summaryCard(
      title: 'OPERATIONAL RECOMMENDATIONS',
      icon: Icons.recommend_rounded,
      children: recommendations.isEmpty
          ? [
              const Text(
                'No recommendations were returned by Agent 01.',
                style: TextStyle(color: muted, fontSize: 11),
              ),
            ]
          : recommendations.asMap().entries.map((entry) {
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FBFD),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: line),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: sky.withOpacity(.12),
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '${entry.key + 1}',
                        style: const TextStyle(
                          color: blue,
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    const SizedBox(width: 9),
                    Expanded(
                      child: Text(
                        entry.value,
                        style: const TextStyle(
                          color: muted,
                          fontSize: 11,
                          height: 1.4,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
    );
  }

  Widget _aiSourceCard() {
    return _summaryCard(
      title: 'AI DECISION & MODEL INFORMATION',
      icon: Icons.psychology_rounded,
      children: [
        _row('Prediction source', _prediction.predictionSource),
        _row('Model version', _prediction.modelVersion),
        _row('Generated', _date(_prediction.createdAt)),
        _row('Prediction ID', _prediction.id),
        const SizedBox(height: 5),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFEAF7FE),
            borderRadius: BorderRadius.circular(14),
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.auto_awesome_rounded, color: blue, size: 18),
              SizedBox(width: 9),
              Expanded(
                child: Text(
                  'This result is displayed from the Agent 01 risk prediction response returned by the ReliefNexus backend.',
                  style: TextStyle(
                    color: navy,
                    fontSize: 10,
                    height: 1.4,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _governanceCard() {
    final approved = _prediction.isApproved;

    return _summaryCard(
      title: 'HUMAN APPROVAL & GOVERNANCE',
      icon: Icons.verified_user_outlined,
      children: [
        _row(
          'Approval required',
          _prediction.requiresHumanApproval ? 'Yes' : 'No',
        ),
        _row('Approved', approved ? 'Yes' : 'No'),
        _row('Approval status', _approvalText()),
        Container(
          margin: const EdgeInsets.only(top: 4),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: approved ? const Color(0xFFEAF8F2) : const Color(0xFFFFF8E8),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            children: [
              Icon(
                approved
                    ? Icons.check_circle_rounded
                    : Icons.pending_actions_rounded,
                color: approved ? green : const Color(0xFFF59E0B),
                size: 18,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  approved
                      ? 'This prediction is marked as approved by the current response.'
                      : _prediction.requiresHumanApproval
                      ? 'This prediction requires human approval before downstream operational use.'
                      : 'This prediction has been generated and is not marked as approved.',
                  style: const TextStyle(
                    color: muted,
                    fontSize: 10,
                    height: 1.35,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
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
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: navy,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: .5,
                  ),
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

  Widget _row(String label, String value, {Color valueColor = navy}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 112,
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
              value.isEmpty ? 'N/A' : value,
              style: TextStyle(
                color: valueColor,
                fontSize: 10,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Signal {
  final String label;
  final String value;

  const _Signal(this.label, this.value);
}
