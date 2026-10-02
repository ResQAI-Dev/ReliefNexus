import 'package:flutter/material.dart';
import '../models/api_models.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

/// Screen that lists paginated risk predictions from GET api/risk-predictions,
/// allows location-based filtering, and lets a user submit a new risk
/// prediction via POST api/risk-predictions.
///
/// Demonstrates:
///  - Paginated API calls using [RiskPredictionQuery]
///  - Text-based search/filter forwarded to query params
///  - Loading overlay while AI agent processes the prediction request
class FieldTasksScreen extends StatefulWidget {
  const FieldTasksScreen({super.key});

  @override
  State<FieldTasksScreen> createState() => _FieldTasksScreenState();
}

class _FieldTasksScreenState extends State<FieldTasksScreen> {
  final _apiService = ApiService();
  final _locationController = TextEditingController();

  // ── State ─────────────────────────────────────────────────────────────────
  bool _isLoading = false;
  bool _isSubmitting = false;
  String? _errorMessage;
  PaginatedRiskPredictions? _paginated;
  int _currentPage = 1;
  String _filterRiskLevel = 'All';

  static const _riskLevels = ['All', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  @override
  void initState() {
    super.initState();
    _fetchPredictions();
  }

  @override
  void dispose() {
    _locationController.dispose();
    super.dispose();
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────

  Future<void> _fetchPredictions({int page = 1}) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _currentPage = page;
    });

    final query = RiskPredictionQuery(
      location: _locationController.text.trim().isEmpty
          ? null
          : _locationController.text.trim(),
      riskLevel: _filterRiskLevel == 'All' ? null : _filterRiskLevel,
      page: page,
      pageSize: 8,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    );

    final result = await _apiService.getRiskPredictions(query: query);

    if (!mounted) return;

    if (result.isSuccess) {
      setState(() {
        _isLoading = false;
        _paginated = result.data;
      });
    } else {
      setState(() {
        _isLoading = false;
        _errorMessage = result.errorMessage;
      });
    }
  }

  // ── Submit new prediction ─────────────────────────────────────────────────

  void _openSubmitPredictionSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: _SubmitPredictionForm(
          isSubmitting: _isSubmitting,
          onSubmit: (location, rainfall24h, riverLevel) async {
            Navigator.of(context).pop();
            await _submitPrediction(
                location: location,
                rainfall24h: rainfall24h,
                riverLevel: riverLevel);
          },
        ),
      ),
    );
  }

  Future<void> _submitPrediction({
    required String location,
    required double rainfall24h,
    required double riverLevel,
  }) async {
    setState(() => _isSubmitting = true);

    // Build a minimal RiskPrediction request body.
    // The AI agent on the backend will enrich this with live data.
    final request = RiskPrediction(
      location: location,
      rainfall1h: 0,
      rainfall3h: 0,
      rainfall24h: rainfall24h,
      riverLevel: riverLevel,
      riverFlow: 0,
      temperature: 0,
      humidity: 0,
      windSpeed: 0,
      soilMoisture: 0,
      elevation: 0,
      populationDensity: 0,
      historicalFloodCount: 0,
      historicalSeverity: 0,
      drainageCapacity: 0,
      forecastRainfall: 0,
      disasterType: '',
      riskScore: 0,
      riskLevel: '',
      confidence: 0,
      disasterRisks: const [],
      riskFactors: const [],
      recommendations: const [],
      predictionSource: '',
      modelVersion: '',
      requiresHumanApproval: false,
      isApproved: false,
      approvalStatus: 'NotRequired',
      createdAt: DateTime.now(),
    );

    final result = await _apiService.createRiskPrediction(request);

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (result.isSuccess) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Assessment created for ${result.data!.location} '
            '– Risk: ${result.data!.riskLevel}',
          ),
          backgroundColor: const Color(0xFF16A34A),
          behavior: SnackBarBehavior.floating,
        ),
      );
      _fetchPredictions(); // Refresh list
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Submission failed: ${result.errorMessage}'),
          backgroundColor: const Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Field Risk Predictions'),
        actions: [
          if (_isSubmitting)
            const Padding(
              padding: EdgeInsets.only(right: 16),
              child: Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            ),
          if (!_isSubmitting)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: TextButton.icon(
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Submit'),
                onPressed: _openSubmitPredictionSheet,
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // ── Search / Filter Bar ─────────────────────────────────────────
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(bottom: BorderSide(color: AppTheme.borderLight)),
            ),
            child: Column(
              children: [
                // Location search field
                TextField(
                  controller: _locationController,
                  decoration: InputDecoration(
                    hintText: 'Search by location…',
                    prefixIcon: const Icon(Icons.search,
                        color: AppTheme.primaryBlue, size: 20),
                    suffixIcon: _locationController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _locationController.clear();
                              _fetchPredictions();
                            },
                          )
                        : null,
                  ),
                  onSubmitted: (_) => _fetchPredictions(),
                ),
                const SizedBox(height: 10),

                // Risk level filter chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _riskLevels.map((level) {
                      final isSelected = _filterRiskLevel == level;
                      final chipColor = _chipColor(level);
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(
                            level,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected
                                  ? FontWeight.bold
                                  : FontWeight.w500,
                              color: isSelected
                                  ? Colors.white
                                  : AppTheme.textSecondary,
                            ),
                          ),
                          selected: isSelected,
                          selectedColor: chipColor,
                          backgroundColor: Colors.white,
                          side: BorderSide(
                            color:
                                isSelected ? chipColor : AppTheme.borderLight,
                          ),
                          onSelected: (selected) {
                            if (selected) {
                              setState(() => _filterRiskLevel = level);
                              _fetchPredictions();
                            }
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          // ── Main Content ────────────────────────────────────────────────
          Expanded(child: _buildContent()),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading predictions…',
                style: TextStyle(color: AppTheme.textMuted)),
          ],
        ),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_off_outlined,
                  size: 52, color: AppTheme.textMuted),
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    color: AppTheme.textMuted, fontSize: 13),
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Retry'),
                onPressed: _fetchPredictions,
              ),
            ],
          ),
        ),
      );
    }

    final data = _paginated;
    if (data == null || data.items.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.analytics_outlined,
                size: 48, color: AppTheme.textMuted),
            const SizedBox(height: 12),
            const Text(
              'No predictions found.',
              style: TextStyle(color: AppTheme.textMuted),
            ),
            const SizedBox(height: 8),
            TextButton.icon(
              icon: const Icon(Icons.add),
              label: const Text('Submit First Assessment'),
              onPressed: _openSubmitPredictionSheet,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _fetchPredictions(page: _currentPage),
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: data.items.length + 1, // +1 for pagination footer
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          if (index == data.items.length) {
            return _buildPaginationFooter(data);
          }
          return _buildPredictionTile(data.items[index]);
        },
      ),
    );
  }

  Widget _buildPredictionTile(RiskPrediction p) {
    final levelColor = _levelColor(p.riskLevel);

    return Card(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border(left: BorderSide(color: levelColor, width: 4)),
        ),
        child: Row(
          children: [
            // Risk icon
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: levelColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.shield_outlined, color: levelColor, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    p.location.isNotEmpty ? p.location : 'Unknown location',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${p.disasterType}  •  Score: ${p.riskScore.toStringAsFixed(1)}%'
                    '  •  ${p.approvalStatus}',
                    style: const TextStyle(
                        fontSize: 12, color: AppTheme.textMuted),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: levelColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                p.riskLevel,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: levelColor,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaginationFooter(PaginatedRiskPredictions data) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'Page $_currentPage of ${data.totalPages}  '
            '(${data.totalItems} total)',
            style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
          ),
          const SizedBox(width: 16),
          if (_currentPage > 1)
            TextButton(
              onPressed: () => _fetchPredictions(page: _currentPage - 1),
              child: const Text('← Prev'),
            ),
          if (_currentPage < data.totalPages)
            TextButton(
              onPressed: () => _fetchPredictions(page: _currentPage + 1),
              child: const Text('Next →'),
            ),
        ],
      ),
    );
  }

  Color _levelColor(String level) {
    switch (level.toUpperCase()) {
      case 'CRITICAL':
        return const Color(0xFFDC2626);
      case 'HIGH':
        return const Color(0xFFEA580C);
      case 'MEDIUM':
        return const Color(0xFFD97706);
      case 'LOW':
        return const Color(0xFF16A34A);
      default:
        return AppTheme.primaryBlue;
    }
  }

  Color _chipColor(String level) {
    switch (level) {
      case 'CRITICAL':
        return const Color(0xFFDC2626);
      case 'HIGH':
        return const Color(0xFFEA580C);
      case 'MEDIUM':
        return const Color(0xFFD97706);
      case 'LOW':
        return const Color(0xFF16A34A);
      default:
        return AppTheme.primaryBlue;
    }
  }
}

// =============================================================================
// SUBMIT PREDICTION FORM (bottom sheet)
// =============================================================================

class _SubmitPredictionForm extends StatefulWidget {
  final bool isSubmitting;
  final void Function(String location, double rainfall24h, double riverLevel)
      onSubmit;

  const _SubmitPredictionForm({
    required this.isSubmitting,
    required this.onSubmit,
  });

  @override
  State<_SubmitPredictionForm> createState() =>
      _SubmitPredictionFormState();
}

class _SubmitPredictionFormState extends State<_SubmitPredictionForm> {
  final _formKey = GlobalKey<FormState>();
  final _locationController = TextEditingController(text: 'Sector 4, Karachi');
  final _rainfallController = TextEditingController(text: '62');
  final _riverController = TextEditingController(text: '3.4');

  @override
  void dispose() {
    _locationController.dispose();
    _rainfallController.dispose();
    _riverController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            const Row(
              children: [
                Icon(Icons.analytics_outlined,
                    color: AppTheme.primaryBlue, size: 22),
                SizedBox(width: 8),
                Text(
                  'Submit Risk Assessment',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            const Text(
              'The AI agent will fetch live weather & disaster data and compute the risk score.',
              style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 20),

            // Location
            const Text('Location',
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary)),
            const SizedBox(height: 6),
            TextFormField(
              controller: _locationController,
              decoration: const InputDecoration(
                hintText: 'e.g. Sector 4, Karachi',
                prefixIcon: Icon(Icons.location_on_outlined,
                    color: AppTheme.primaryBlue, size: 20),
              ),
              validator: (val) => (val == null || val.trim().isEmpty)
                  ? 'Location is required'
                  : null,
            ),
            const SizedBox(height: 14),

            // Rainfall / River row
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Rainfall 24h (mm)',
                          style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary)),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _rainfallController,
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        decoration: const InputDecoration(
                            prefixIcon: Icon(Icons.water_drop_outlined,
                                color: AppTheme.primaryBlue, size: 20)),
                        validator: (val) {
                          if (val == null || val.isEmpty) return 'Required';
                          if (double.tryParse(val) == null) {
                            return 'Must be a number';
                          }
                          return null;
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('River Level (m)',
                          style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary)),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _riverController,
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        decoration: const InputDecoration(
                            prefixIcon: Icon(Icons.waves_outlined,
                                color: AppTheme.primaryBlue, size: 20)),
                        validator: (val) {
                          if (val == null || val.isEmpty) return 'Required';
                          if (double.tryParse(val) == null) {
                            return 'Must be a number';
                          }
                          return null;
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Note about AI processing time
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.schedule_outlined,
                      color: Color(0xFFD97706), size: 16),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'The AI agent may take up to 90 seconds to fetch live data and compute results.',
                      style: TextStyle(
                          fontSize: 12, color: Color(0xFF92400E)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.send_rounded, size: 18),
                label: const Text('Run AI Risk Assessment'),
                onPressed: widget.isSubmitting
                    ? null
                    : () {
                        if (_formKey.currentState!.validate()) {
                          widget.onSubmit(
                            _locationController.text.trim(),
                            double.parse(_rainfallController.text),
                            double.parse(_riverController.text),
                          );
                        }
                      },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
