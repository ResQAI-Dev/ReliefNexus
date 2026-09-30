import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/risk_predictions_provider.dart';
import '../widgets/risk_prediction_workspace.dart';
import '../widgets/risk_prediction_card.dart';
import 'risk_prediction_details_screen.dart';

class RiskPredictionsPage extends StatelessWidget {
  const RiskPredictionsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => RiskPredictionsProvider()..load(),
      child: const _RiskPredictionsView(),
    );
  }
}

class _RiskPredictionsView extends StatelessWidget {
  const _RiskPredictionsView();

  @override
  Widget build(BuildContext context) {
    final provider =
        context.watch<RiskPredictionsProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F6FB),
      appBar: AppBar(
        backgroundColor: const Color(0xFF06152F),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Risk Predictions',
          style: TextStyle(
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: provider.load,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 30),
          children: [
            RiskPredictionWorkspace(
              provider: provider,
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(
                16,
                20,
                16,
                12,
              ),
              child: Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Recent Predictions',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF06152F),
                      ),
                    ),
                  ),
                  Text(
                    '${provider.total}',
                    style: const TextStyle(
                      color: Color(0xFF0EA5E9),
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ),

            if (provider.loading)
              const Padding(
                padding: EdgeInsets.all(30),
                child: Center(
                  child: CircularProgressIndicator(),
                ),
              )
            else if (provider.predictions.isEmpty)
              const Padding(
                padding: EdgeInsets.all(30),
                child: Center(
                  child: Text(
                    'No predictions available.',
                  ),
                ),
              )
            else
              ...provider.predictions.map(
                (prediction) => RiskPredictionCard(
                  prediction: prediction,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => RiskPredictionDetailsPage(
                          prediction: prediction,
                          provider: provider,
                        ),
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}
