import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../providers/risk_predictions_provider.dart';
import '../screens/risk_prediction_details_screen.dart';

class RiskPredictionWorkspace extends StatefulWidget {
  final RiskPredictionsProvider provider;

  const RiskPredictionWorkspace({super.key, required this.provider});

  @override
  State<RiskPredictionWorkspace> createState() =>
      _RiskPredictionWorkspaceState();
}

class _RiskPredictionWorkspaceState extends State<RiskPredictionWorkspace> {
  final formKey = GlobalKey<FormState>();
  final MapController _mapController = MapController();

  Timer? _locationDebounce;
  bool _geocoding = false;

  final location = TextEditingController();
  final latitude = TextEditingController(text: '7.8731');
  final longitude = TextEditingController(text: '80.7718');

  final rainfall1h = TextEditingController();
  final rainfall3h = TextEditingController();
  final rainfall24h = TextEditingController();
  final riverLevel = TextEditingController();
  final riverFlow = TextEditingController();
  final temperature = TextEditingController();
  final humidity = TextEditingController();
  final windSpeed = TextEditingController();
  final soilMoisture = TextEditingController();
  final elevation = TextEditingController();
  final populationDensity = TextEditingController();
  final historicalFloodCount = TextEditingController();
  final historicalSeverity = TextEditingController();
  final drainageCapacity = TextEditingController();
  final forecastRainfall = TextEditingController();

  double n(TextEditingController c) => double.tryParse(c.text.trim()) ?? 0;

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadLiveEnvironment();
    });
  }

  @override
  @override
  void dispose() {
    _locationDebounce?.cancel();
    location.dispose();
    latitude.dispose();
    longitude.dispose();
    rainfall1h.dispose();
    rainfall3h.dispose();
    rainfall24h.dispose();
    riverLevel.dispose();
    riverFlow.dispose();
    temperature.dispose();
    humidity.dispose();
    windSpeed.dispose();
    soilMoisture.dispose();
    elevation.dispose();
    populationDensity.dispose();
    historicalFloodCount.dispose();
    historicalSeverity.dispose();
    drainageCapacity.dispose();
    forecastRainfall.dispose();

    super.dispose();
  }

  Future<void> runPrediction() async {
    if (!formKey.currentState!.validate()) {
      return;
    }

    try {
      print('MOBILE: Generate Risk Prediction clicked');

      await _loadLiveEnvironment();

      await widget.provider.predict({
        'location': location.text.trim(),
        'latitude': n(latitude),
        'longitude': n(longitude),
        'rainfall1h': n(rainfall1h),
        'rainfall3h': n(rainfall3h),
        'rainfall24h': n(rainfall24h),
        'riverLevel': n(riverLevel),
        'riverFlow': n(riverFlow),
        'temperature': n(temperature),
        'humidity': n(humidity),
        'windSpeed': n(windSpeed),
        'soilMoisture': n(soilMoisture),
        'elevation': n(elevation),
        'populationDensity': n(populationDensity),
        'historicalFloodCount': n(historicalFloodCount).round(),
        'historicalSeverity': n(historicalSeverity),
        'drainageCapacity': n(drainageCapacity),
        'forecastRainfall': n(forecastRainfall),
      });

      final prediction = widget.provider.selected;

      if (!mounted) return;

      if (prediction == null || prediction.id.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Agent 01 did not return a valid prediction.'),
          ),
        );
        return;
      }

      print('MOBILE: Opening RiskPredictionDetailsPage');
      print('MOBILE: Prediction ID = ${prediction.id}');

      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => RiskPredictionDetailsPage(
            prediction: prediction,
            provider: widget.provider,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Risk prediction failed: $e'),
          duration: const Duration(seconds: 6),
        ),
      );
    }
  }

  Widget field(String label, TextEditingController controller) {
    return TextFormField(
      controller: controller,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: const Color(0xFFF8FAFC),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(17),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }

  Widget section(String title, IconData icon, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFD8E5F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: const Color(0xFF0EA5E9)),
              const SizedBox(width: 9),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF06152F),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.provider;
    final selected = p.selected;

    return Column(
      children: [
        Container(
          height: 235,
          margin: const EdgeInsets.fromLTRB(16, 14, 16, 18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0EA5E9).withOpacity(.22),
                blurRadius: 24,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: Stack(
              fit: StackFit.expand,
              children: [
                // REAL DISASTER PHOTO
                Image.asset(
                  'assets/images/disasters/disaster_default.jpg',
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Color(0xFF0B315C),
                            Color(0xFF0EA5E9),
                            Color(0xFF7C3AED),
                          ],
                        ),
                      ),
                    );
                  },
                ),

                // PREMIUM COLOR OVERLAY
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        const Color(0xFF020617).withOpacity(.78),
                        const Color(0xFF082F49).withOpacity(.64),
                        const Color(0xFF0284C7).withOpacity(.62),
                        const Color(0xFF7C3AED).withOpacity(.40),
                      ],
                      stops: const [0.0, 0.40, 0.72, 1.0],
                    ),
                  ),
                ),

                // BLUE GLOW
                Positioned(
                  right: -55,
                  top: -65,
                  child: Container(
                    width: 190,
                    height: 190,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(0xFF38BDF8).withOpacity(.24),
                    ),
                  ),
                ),

                // PURPLE GLOW
                Positioned(
                  right: -30,
                  bottom: -85,
                  child: Container(
                    width: 175,
                    height: 175,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(0xFFA78BFA).withOpacity(.20),
                    ),
                  ),
                ),

                // AI BADGE
                Positioned(
                  top: 18,
                  left: 18,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(.15),
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: Colors.white.withOpacity(.28)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.auto_awesome_rounded,
                          color: Color(0xFF7DD3FC),
                          size: 15,
                        ),
                        SizedBox(width: 7),
                        Text(
                          'AI INTELLIGENCE',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // LIVE BADGE
                Positioned(
                  top: 18,
                  right: 18,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 7,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF22C55E).withOpacity(.18),
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: const Color(0xFF86EFAC).withOpacity(.40),
                      ),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.circle, color: Color(0xFF4ADE80), size: 7),
                        SizedBox(width: 6),
                        Text(
                          'LIVE',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // MAIN CONTENT
                Positioned(
                  left: 20,
                  right: 20,
                  bottom: 18,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'AGENT 01 - LIVE RESULT',
                        style: TextStyle(
                          color: Color(0xFF7DD3FC),
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 5),
                      const Text(
                        'Disaster Risk Prediction',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 23,
                          fontWeight: FontWeight.w900,
                          height: 1.05,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Real-time environmental intelligence',
                        style: TextStyle(
                          color: Colors.white.withOpacity(.88),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 12),

                      Row(
                        children: [
                          _PremiumHeroChip(
                            icon: Icons.location_on_rounded,
                            label: 'LOCATION',
                          ),
                          const SizedBox(width: 7),
                          _PremiumHeroChip(
                            icon: Icons.cloud_rounded,
                            label: 'WEATHER',
                          ),
                          const SizedBox(width: 7),
                          _PremiumHeroChip(
                            icon: Icons.analytics_rounded,
                            label: 'AI MODEL',
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),

        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Form(
            key: formKey,
            child: Column(
              children: [
                section('Location Intelligence', Icons.location_on_outlined, [
                  TextFormField(
                    controller: location,
                    onChanged: _onLocationChanged,
                    decoration: InputDecoration(
                      labelText: 'Location',
                      prefixIcon: const Icon(Icons.location_on_outlined),
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(17),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(child: field('Latitude', latitude)),
                      const SizedBox(width: 10),
                      Expanded(child: field('Longitude', longitude)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 210,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(22),
                      child: FlutterMap(
                        mapController: _mapController,
                        options: MapOptions(
                          initialCenter: LatLng(n(latitude), n(longitude)),
                          initialZoom: 7,
                          onTap: (_, point) {
                            setState(() {
                              latitude.text = point.latitude.toStringAsFixed(6);
                              longitude.text = point.longitude.toStringAsFixed(
                                6,
                              );
                            });

                            _loadLiveEnvironment();
                          },
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
                                point: LatLng(n(latitude), n(longitude)),
                                width: 44,
                                height: 44,
                                child: const Icon(
                                  Icons.location_pin,
                                  color: Color(0xFFDC2626),
                                  size: 42,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ]),

                section('Environmental Conditions', Icons.cloud_outlined, [
                  Row(
                    children: [
                      Expanded(child: field('Rainfall 1h', rainfall1h)),
                      const SizedBox(width: 10),
                      Expanded(child: field('Rainfall 3h', rainfall3h)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  field('Rainfall 24h', rainfall24h),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(child: field('River Level', riverLevel)),
                      const SizedBox(width: 10),
                      Expanded(child: field('River Flow', riverFlow)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(child: field('Temperature', temperature)),
                      const SizedBox(width: 10),
                      Expanded(child: field('Humidity', humidity)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(child: field('Wind Speed', windSpeed)),
                      const SizedBox(width: 10),
                      Expanded(child: field('Soil Moisture', soilMoisture)),
                    ],
                  ),
                ]),

                section(
                  'Historical & Geographic Data',
                  Icons.analytics_outlined,
                  [
                    Row(
                      children: [
                        Expanded(child: field('Elevation', elevation)),
                        const SizedBox(width: 10),
                        Expanded(
                          child: field('Population Density', populationDensity),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: field(
                            'Historical Flood Count',
                            historicalFloodCount,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: field(
                            'Historical Severity',
                            historicalSeverity,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    field('Drainage Capacity', drainageCapacity),
                    const SizedBox(height: 10),
                    field('Forecast Rainfall', forecastRainfall),
                  ],
                ),

                SizedBox(
                  width: double.infinity,
                  height: 55,
                  child: ElevatedButton.icon(
                    onPressed: p.loading ? null : runPrediction,
                    icon: p.loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.auto_awesome),
                    label: Text(
                      p.loading
                          ? 'Generating Prediction...'
                          : 'Generate Risk Prediction',
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0EA5E9),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                  ),
                ),

                if (selected != null) ...[
                  const SizedBox(height: 22),

                  // PREMIUM LIVE RESULT
                  GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => RiskPredictionDetailsPage(
                            prediction: selected,
                            provider: widget.provider,
                          ),
                        ),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [
                            Color(0xFF06152F),
                            Color(0xFF0B315C),
                            Color(0xFF0EA5E9),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(
                              0xFF0EA5E9,
                            ).withValues(alpha: .18),
                            blurRadius: 22,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(
                                    0xFF7DD3FC,
                                  ).withValues(alpha: .14),
                                  borderRadius: BorderRadius.circular(30),
                                ),
                                child: const Text(
                                  'AGENT 01 - LIVE RESULT',
                                  style: TextStyle(
                                    color: Color(0xFF7DD3FC),
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1.1,
                                  ),
                                ),
                              ),
                              const Spacer(),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: .10),
                                  borderRadius: BorderRadius.circular(30),
                                ),
                                child: const Row(
                                  children: [
                                    Icon(
                                      Icons.verified_rounded,
                                      size: 13,
                                      color: Color(0xFF86EFAC),
                                    ),
                                    SizedBox(width: 5),
                                    Text(
                                      'Generated',
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

                          const SizedBox(height: 18),

                          const Text(
                            'Risk Assessment',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 21,
                              fontWeight: FontWeight.w900,
                            ),
                          ),

                          const SizedBox(height: 4),

                          Text(
                            selected.location.isEmpty
                                ? 'Current assessment'
                                : selected.location,
                            style: const TextStyle(
                              color: Color(0xFFBFDBFE),
                              fontSize: 12,
                            ),
                          ),

                          const SizedBox(height: 20),

                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Container(
                                width: 94,
                                height: 94,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: .20),
                                    width: 7,
                                  ),
                                  color: Colors.white.withValues(alpha: .07),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      selected.riskScore.toStringAsFixed(1),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 27,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                    const Text(
                                      'SCORE',
                                      style: TextStyle(
                                        color: Color(0xFFBFDBFE),
                                        fontSize: 8,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 1,
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              const SizedBox(width: 17),

                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      selected.riskLevel.toUpperCase(),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 24,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      selected.disasterType.isEmpty
                                          ? 'Disaster risk detected'
                                          : selected.disasterType,
                                      style: const TextStyle(
                                        color: Color(0xFFD7EEFF),
                                        fontSize: 12,
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        const Icon(
                                          Icons.verified_outlined,
                                          size: 15,
                                          color: Color(0xFF7DD3FC),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          '% confidence',
                                          style: const TextStyle(
                                            color: Colors.white,
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

                          const SizedBox(height: 18),

                          Container(
                            padding: const EdgeInsets.all(13),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: .08),
                              borderRadius: BorderRadius.circular(15),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.psychology_outlined,
                                  color: Color(0xFF7DD3FC),
                                  size: 19,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    'AI prediction generated from the submitted risk assessment data.',
                                    style: const TextStyle(
                                      color: Color(0xFFDCEEFF),
                                      fontSize: 10,
                                      height: 1.35,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 15),

                          Row(
                            children: [
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.all(11),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: .07),
                                    borderRadius: BorderRadius.circular(13),
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'MODEL',
                                        style: TextStyle(
                                          color: Color(0xFF93C5FD),
                                          fontSize: 8,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        selected.modelVersion.isEmpty
                                            ? 'Model unavailable'
                                            : selected.modelVersion,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.all(11),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: .07),
                                    borderRadius: BorderRadius.circular(13),
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'SOURCE',
                                        style: TextStyle(
                                          color: Color(0xFF93C5FD),
                                          fontSize: 8,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        selected.predictionSource.isEmpty
                                            ? 'Not specified'
                                            : selected.predictionSource,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _onLocationChanged(String value) {
    _locationDebounce?.cancel();

    final query = value.trim();

    if (query.length < 3) {
      return;
    }

    _locationDebounce = Timer(
      const Duration(seconds: 1),
      () => _geocodeLocation(query),
    );
  }

  Future<void> _geocodeLocation(String query) async {
    if (_geocoding) return;

    setState(() {
      _geocoding = true;
    });

    try {
      final response = await Dio().get(
        'https://nominatim.openstreetmap.org/search',
        queryParameters: {
          'q': query,
          'format': 'jsonv2',
          'limit': 1,
          'countrycodes': 'lk',
        },
        options: Options(headers: {'User-Agent': 'ReliefNexus-Mobile/1.0'}),
      );

      final data = response.data;

      if (data is List && data.isNotEmpty) {
        final item = data.first;

        final lat = double.tryParse('${item['lat']}');
        final lon = double.tryParse('${item['lon']}');
        final displayName = '${item['display_name'] ?? query}'.toString();

        if (lat != null && lon != null && mounted) {
          setState(() {
            location.text = displayName;
            latitude.text = lat.toStringAsFixed(6);
            longitude.text = lon.toStringAsFixed(6);
          });

          _mapController.move(LatLng(lat, lon), 13);

          await _loadLiveEnvironment();
        }
      }
    } catch (e) {
      debugPrint('Location geocoding failed: $e');
    } finally {
      if (mounted) {
        setState(() {
          _geocoding = false;
        });
      }
    }
  }

  Future<void> _loadLiveEnvironment() async {
    final lat = double.tryParse(latitude.text.trim());
    final lon = double.tryParse(longitude.text.trim());

    if (lat == null || lon == null) {
      return;
    }

    try {
      final environment = await widget.provider.getEnvironment(
        latitude: lat,
        longitude: lon,
        location: location.text.trim(),
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _setEnvironmentValue(rainfall1h, environment['rainfall1h']);
        _setEnvironmentValue(rainfall3h, environment['rainfall3h']);
        _setEnvironmentValue(rainfall24h, environment['rainfall24h']);
        _setEnvironmentValue(riverLevel, environment['riverLevel']);
        _setEnvironmentValue(riverFlow, environment['riverFlow']);
        _setEnvironmentValue(temperature, environment['temperature']);
        _setEnvironmentValue(humidity, environment['humidity']);
        _setEnvironmentValue(windSpeed, environment['windSpeed']);
        _setEnvironmentValue(soilMoisture, environment['soilMoisture']);
        _setEnvironmentValue(elevation, environment['elevation']);
        _setEnvironmentValue(
          populationDensity,
          environment['populationDensity'],
        );
        _setEnvironmentValue(
          historicalFloodCount,
          environment['historicalFloodCount'],
        );
        _setEnvironmentValue(
          historicalSeverity,
          environment['historicalSeverity'],
        );
        _setEnvironmentValue(drainageCapacity, environment['drainageCapacity']);
        _setEnvironmentValue(forecastRainfall, environment['forecastRainfall']);
      });
    } catch (e) {
      debugPrint('Live environment loading failed: $e');
    }
  }

  void _setEnvironmentValue(TextEditingController controller, dynamic value) {
    if (value == null) {
      return;
    }

    if (value is num) {
      controller.text = value.toString();
      return;
    }

    final text = value.toString().trim();

    if (text.isNotEmpty) {
      controller.text = text;
    }
  }
}

class _PremiumHeroChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _PremiumHeroChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(.24),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(.18)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: const Color(0xFFBAE6FD), size: 11),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 7,
              fontWeight: FontWeight.w800,
              letterSpacing: .4,
            ),
          ),
        ],
      ),
    );
  }
}
