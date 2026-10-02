import 'package:flutter/material.dart';
import '../models/api_models.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

/// Displays live risk predictions fetched from GET api/risk-predictions/high-risk
/// and GET api/risk-predictions/pending-approval.
///
/// Demonstrates:
///  - ApiService calls in initState with proper async lifecycle
///  - Three UI states: Loading, Error (with retry), Success
///  - Pull-to-refresh
class RiskAssessmentsScreen extends StatefulWidget {
  const RiskAssessmentsScreen({super.key});

  @override
  State<RiskAssessmentsScreen> createState() => _RiskAssessmentsScreenState();
}

class _RiskAssessmentsScreenState extends State<RiskAssessmentsScreen>
    with SingleTickerProviderStateMixin {
  final _apiService = ApiService();
  late TabController _tabController;

  // ── State ─────────────────────────────────────────────────────────────────
  bool _isLoading = false;
  String? _errorMessage;
  List<RiskPrediction> _highRisk = [];
  List<RiskPrediction> _pendingApproval = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  // ── Data Fetching ──────────────────────────────────────────────────────────

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    // Fire both requests concurrently with Future.wait for efficiency.
    final results = await Future.wait([
      _apiService.getHighRiskPredictions(),
      _apiService.getPendingApprovalPredictions(),
    ]);

    if (!mounted) return;

    final highRiskResult = results[0];
    final pendingResult = results[1];

    if (highRiskResult.isFailure && pendingResult.isFailure) {
      setState(() {
        _isLoading = false;
        _errorMessage = highRiskResult.errorMessage;
      });
      return;
    }

    setState(() {
      _isLoading = false;
      if (highRiskResult.isSuccess) _highRisk = highRiskResult.data!;
      if (pendingResult.isSuccess) _pendingApproval = pendingResult.data!;
    });
  }

  // ── Approve / Reject handlers ──────────────────────────────────────────────

  Future<void> _handleApprove(RiskPrediction prediction) async {
    final result = await _apiService.approvePrediction(prediction.id!);
    if (!mounted) return;

    if (result.isSuccess) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              'Prediction for ${prediction.location} approved successfully.'),
          backgroundColor: const Color(0xFF16A34A),
          behavior: SnackBarBehavior.floating,
        ),
      );
      _loadData(); // Refresh list
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Approve failed: ${result.errorMessage}'),
          backgroundColor: const Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _handleReject(RiskPrediction prediction) async {
    final result = await _apiService.rejectPrediction(prediction.id!);
    if (!mounted) return;

    if (result.isSuccess) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Prediction rejected.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      _loadData();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Reject failed: ${result.errorMessage}'),
          backgroundColor: const Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Risk Assessments'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
            onPressed: _isLoading ? null : _loadData,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryBlue,
          unselectedLabelColor: AppTheme.textMuted,
          indicatorColor: AppTheme.primaryBlue,
          tabs: [
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.warning_amber_rounded, size: 18),
                  const SizedBox(width: 6),
                  const Text('High Risk'),
                  if (_highRisk.isNotEmpty) ...[
                    const SizedBox(width: 6),
                    _buildCountBadge(_highRisk.length, const Color(0xFFDC2626)),
                  ],
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.pending_actions_outlined, size: 18),
                  const SizedBox(width: 6),
                  const Text('Pending'),
                  if (_pendingApproval.isNotEmpty) ...[
                    const SizedBox(width: 6),
                    _buildCountBadge(
                        _pendingApproval.length, const Color(0xFFD97706)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    // ── Loading ──
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text(
              'Fetching risk assessments from server…',
              style: TextStyle(color: AppTheme.textMuted),
            ),
          ],
        ),
      );
    }

    // ── Error ──
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
                'Failed to load assessments',
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Retry'),
                onPressed: _loadData,
              ),
            ],
          ),
        ),
      );
    }

    // ── Success ──
    return RefreshIndicator(
      onRefresh: _loadData,
      child: TabBarView(
        controller: _tabController,
        children: [
          _buildPredictionList(_highRisk, showApprovalActions: false),
          _buildPredictionList(_pendingApproval, showApprovalActions: true),
        ],
      ),
    );
  }

  Widget _buildPredictionList(
    List<RiskPrediction> predictions, {
    required bool showApprovalActions,
  }) {
    if (predictions.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.check_circle_outline,
                size: 48,
                color: showApprovalActions
                    ? const Color(0xFF16A34A)
                    : AppTheme.textMuted),
            const SizedBox(height: 12),
            Text(
              showApprovalActions
                  ? 'No predictions awaiting approval.'
                  : 'No high-risk predictions at this time.',
              style: const TextStyle(color: AppTheme.textMuted),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: predictions.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final p = predictions[index];
        return _PredictionCard(
          prediction: p,
          showApprovalActions: showApprovalActions,
          onApprove: () => _handleApprove(p),
          onReject: () => _handleReject(p),
        );
      },
    );
  }

  Widget _buildCountBadge(int count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        '$count',
        style: const TextStyle(
            color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }
}

// =============================================================================
// PREDICTION CARD WIDGET
// =============================================================================

class _PredictionCard extends StatelessWidget {
  final RiskPrediction prediction;
  final bool showApprovalActions;
  final VoidCallback onApprove;
  final VoidCallback onReject;

  const _PredictionCard({
    required this.prediction,
    required this.showApprovalActions,
    required this.onApprove,
    required this.onReject,
  });

  Color get _levelColor {
    switch (prediction.riskLevel.toUpperCase()) {
      case 'CRITICAL':
        return const Color(0xFFDC2626);
      case 'HIGH':
        return const Color(0xFFEA580C);
      case 'MEDIUM':
        return const Color(0xFFD97706);
      default:
        return const Color(0xFF16A34A);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border(left: BorderSide(color: _levelColor, width: 4)),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header Row ──
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Risk level badge
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(
                    color: _levelColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                    border:
                        Border.all(color: _levelColor.withValues(alpha: 0.3)),
                  ),
                  child: Text(
                    prediction.riskLevel.toUpperCase(),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: _levelColor,
                    ),
                  ),
                ),
                Text(
                  'Score: ${prediction.riskScore.toStringAsFixed(1)}%',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // ── Location & Disaster Type ──
            Text(
              prediction.location.isNotEmpty
                  ? prediction.location
                  : 'Unknown location',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.storm_outlined,
                    size: 14, color: AppTheme.textMuted),
                const SizedBox(width: 4),
                Text(
                  prediction.disasterType.isNotEmpty
                      ? prediction.disasterType
                      : 'Unknown type',
                  style: const TextStyle(
                      fontSize: 13, color: AppTheme.textSecondary),
                ),
                const SizedBox(width: 16),
                const Icon(Icons.shield_outlined,
                    size: 14, color: AppTheme.textMuted),
                const SizedBox(width: 4),
                Text(
                  'Confidence: ${(prediction.confidence * 100).toStringAsFixed(0)}%',
                  style: const TextStyle(
                      fontSize: 13, color: AppTheme.textSecondary),
                ),
              ],
            ),

            // ── Rainfall / River level quick stats ──
            if (prediction.rainfall24h > 0 || prediction.riverLevel > 0) ...[
              const SizedBox(height: 12),
              const Divider(color: AppTheme.borderLight, height: 1),
              const SizedBox(height: 10),
              Row(
                children: [
                  _statChip(
                    Icons.water_drop_outlined,
                    'Rain 24h: ${prediction.rainfall24h.toStringAsFixed(1)}mm',
                  ),
                  const SizedBox(width: 8),
                  _statChip(
                    Icons.waves_outlined,
                    'River: ${prediction.riverLevel.toStringAsFixed(2)}m',
                  ),
                ],
              ),
            ],

            // ── Approval source ──
            if (prediction.predictionSource.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                'Source: ${prediction.predictionSource}  •  ${prediction.modelVersion}',
                style: const TextStyle(
                    fontSize: 11, color: AppTheme.textMuted),
              ),
            ],

            // ── Top Recommendations ──
            if (prediction.recommendations.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceSubtle,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.borderLight),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Recommendations:',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary),
                    ),
                    const SizedBox(height: 4),
                    ...prediction.recommendations
                        .take(3)
                        .map((r) => Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('• ',
                                      style: TextStyle(
                                          color: AppTheme.primaryBlue,
                                          fontWeight: FontWeight.bold)),
                                  Expanded(
                                    child: Text(
                                      r,
                                      style: const TextStyle(
                                          fontSize: 12,
                                          color: AppTheme.textSecondary),
                                    ),
                                  ),
                                ],
                              ),
                            )),
                  ],
                ),
              ),
            ],

            // ── Approval Actions (Pending tab only) ──
            if (showApprovalActions && prediction.id != null) ...[
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton.icon(
                    icon: const Icon(Icons.close, size: 16),
                    label: const Text('Reject'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFDC2626),
                      side: const BorderSide(color: Color(0xFFDC2626)),
                    ),
                    onPressed: onReject,
                  ),
                  const SizedBox(width: 10),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.check, size: 16),
                    label: const Text('Approve'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF16A34A),
                    ),
                    onPressed: onApprove,
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _statChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.surfaceSubtle,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: AppTheme.primaryBlue),
          const SizedBox(width: 4),
          Text(
            label,
            style:
                const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }
}
