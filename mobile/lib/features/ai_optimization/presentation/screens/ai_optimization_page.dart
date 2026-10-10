import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:reliefnexus_mobile/core/network/api_client.dart';
import '../../data/services/ai_optimization_service.dart';

class AiOptimizationPage extends StatefulWidget {
  const AiOptimizationPage({super.key});
  @override
  State<AiOptimizationPage> createState() => _AiOptimizationPageState();
}

class _AiOptimizationPageState extends State<AiOptimizationPage> {
  static const navy = Color(0xFF071A33);
  static const blue = Color(0xFF2563EB);
  static const cyan = Color(0xFF38DDF8);
  static const bg = Color(0xFFF3F7FC);
  static const muted = Color(0xFF64748B);
  late final AiOptimizationService service;
  final locationController = TextEditingController();
  final promptController = TextEditingController(
    text: 'Analyze disaster risk, identify vulnerable communities, recommend resources, and prepare coordinated response recommendations.',
  );
  ResolvedLocation? location;
  Map<String, dynamic>? result;
  bool resolving = false;
  bool running = false;
  String status = 'Ready';
  String? error;

  static const agents = <({String id, String name, String description, IconData icon, Color color})>[
    (id: 'AGENT 01', name: 'Risk Prediction', description: 'Disaster risk and hazard assessment', icon: Icons.query_stats_rounded, color: Color(0xFF2563EB)),
    (id: 'AGENT 02', name: 'Vulnerability & Impact', description: 'Community vulnerability and impact analysis', icon: Icons.shield_rounded, color: Color(0xFF059669)),
    (id: 'AGENT 03', name: 'Resource Optimization', description: 'Resource demand and allocation recommendations', icon: Icons.inventory_2_rounded, color: Color(0xFF0284C7)),
    (id: 'AGENT 04', name: 'Early Warning & Coordination', description: 'Warning and response coordination', icon: Icons.campaign_rounded, color: Color(0xFFD97706)),
    (id: 'AGENT 05', name: 'Volunteer Assignment', description: 'Volunteer response planning', icon: Icons.groups_rounded, color: Color(0xFF7C3AED)),
  ];

  @override
  void initState() { super.initState(); service = AiOptimizationService(ApiClient()); }
  @override
  void dispose() { locationController.dispose(); promptController.dispose(); super.dispose(); }

  String friendlyError(Object e) {
    if (e is DioException) {
      final statusCode = e.response?.statusCode;
      final data = e.response?.data;
      String? serverMessage;
      if (data is Map) {
        serverMessage = (data['message'] ?? data['title'] ?? data['detail'])?.toString();
      } else if (data is String && data.trim().isNotEmpty) {
        serverMessage = data.trim();
      }
      if (statusCode == 404) {
        final requestPath = e.requestOptions.uri.toString();
        return 'The AI workflow endpoint or a required backend resource returned 404 (Not Found).\n'
            '${serverMessage ?? 'The server did not provide a specific error message.'}\n'
            'Requested URL: $requestPath\n'
            'Check that the deployed API contains POST /api/ai/orchestrator/run and that the backend version is up to date.';
      }
      if (statusCode == 403) return 'Access denied (403). Your account may not have the AI Agent Monitoring permission.';
      if (statusCode == 401) return 'Your session is not authorized (401). Sign in again and retry.';
      if (statusCode == 400) return 'The backend rejected the workflow input (400). ${serverMessage ?? 'Check the prompt and verified location details.'}';
      if (statusCode != null && statusCode >= 500) return 'The backend encountered an error ($statusCode). ${serverMessage ?? 'Please retry later.'}';
      if (e.type == DioExceptionType.connectionTimeout || e.type == DioExceptionType.receiveTimeout || e.type == DioExceptionType.connectionError) {
        return 'Could not connect to the ReliefNexus API. Check the internet connection and API server status.';
      }
      return serverMessage ?? 'Request failed${statusCode == null ? '' : ' ($statusCode)'}. ${e.message ?? ''}'.trim();
    }
    return e.toString().replaceFirst('Bad state: ', '');
  }

  Future<void> setLocation() async {
    if (resolving || running) return;
    FocusScope.of(context).unfocus();
    setState(() { resolving = true; error = null; location = null; });
    try {
      final found = await service.resolveLocation(locationController.text);
      if (!mounted) return;
      setState(() { location = found; status = 'Location verified'; });
    } catch (e) {
      if (!mounted) return;
      setState(() { error = friendlyError(e); status = 'Location needed'; });
    } finally { if (mounted) setState(() => resolving = false); }
  }

  Future<void> runWorkflow() async {
    if (promptController.text.trim().isEmpty) {
      setState(() => error = 'Enter a prompt describing the task.'); return;
    }
    if (location == null) {
      setState(() => error = 'Set and verify a custom location first.'); return;
    }
    FocusScope.of(context).unfocus();
    setState(() { running = true; error = null; result = null; status = 'Executing workflow'; });
    try {
      final response = await service.runWorkflow(prompt: promptController.text, location: location!);
      if (!mounted) return;
      setState(() { result = response; status = 'Response received'; });
    } catch (e) {
      if (!mounted) return;
      setState(() { error = friendlyError(e); status = 'Failed'; });
    } finally { if (mounted) setState(() => running = false); }
  }

  String pretty(dynamic value) {
    try { return const JsonEncoder.withIndent('  ').convert(value); }
    catch (_) { return value.toString(); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: bg,
    appBar: AppBar(
      backgroundColor: navy, foregroundColor: Colors.white,
      title: const Text('AI Optimization', style: TextStyle(fontWeight: FontWeight.w800)),
      actions: [Padding(padding: const EdgeInsets.only(right: 14), child: Center(child: Text(status, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700))))],
    ),
    body: ListView(padding: const EdgeInsets.all(16), children: [
      Container(
        padding: const EdgeInsets.all(21),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          gradient: const LinearGradient(colors: [navy, Color(0xFF104A78), blue], begin: Alignment.topLeft, end: Alignment.bottomRight),
          boxShadow: const [BoxShadow(color: Color(0x1A071A33), blurRadius: 20, offset: Offset(0, 8))],
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Row(children: [
            Icon(Icons.auto_awesome_rounded, color: cyan, size: 34), SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('RELIEFNEXUS INTELLIGENCE', style: TextStyle(color: cyan, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.1)),
              SizedBox(height: 4), Text('AI Operations Center', style: TextStyle(color: Colors.white, fontSize: 21, fontWeight: FontWeight.w900)),
            ])),
          ]),
          const SizedBox(height: 18),
          const Text('One prompt. Coordinated response.', style: TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.w800)),
          const SizedBox(height: 7),
          Text('Choose a location, describe the task, and send it to the project backend orchestration workflow.', style: TextStyle(color: Colors.white.withValues(alpha: .84), height: 1.45)),
        ]),
      ),
      const SizedBox(height: 15),
      card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        heading(Icons.location_on_rounded, 'Custom location', 'Type any city, town, district, or place'),
        const SizedBox(height: 12),
        TextField(
          controller: locationController, enabled: !running && !resolving,
          onSubmitted: (_) => setLocation(),
          decoration: InputDecoration(
            hintText: 'e.g. Kaduwela, Sri Lanka', prefixIcon: const Icon(Icons.search_rounded),
            filled: true, fillColor: bg,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
            suffixIcon: IconButton(onPressed: resolving || running ? null : setLocation, icon: resolving ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.my_location_rounded)),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(width: double.infinity, child: OutlinedButton.icon(onPressed: resolving || running ? null : setLocation, icon: const Icon(Icons.pin_drop_rounded), label: Text(resolving ? 'Finding location...' : 'Set location'))),
        if (location != null) Container(
          margin: const EdgeInsets.only(top: 8), padding: const EdgeInsets.all(11),
          decoration: BoxDecoration(color: const Color(0xFFE8F8EF), borderRadius: BorderRadius.circular(12)),
          child: Row(children: [
            const Icon(Icons.check_circle_rounded, color: Color(0xFF15803D)),
            const SizedBox(width: 8),
            Expanded(child: Text('${location!.displayName}\n${location!.latitude.toStringAsFixed(5)}, ${location!.longitude.toStringAsFixed(5)}', style: const TextStyle(color: Color(0xFF166534), fontSize: 12, height: 1.5))),
          ]),
        ),
      ])),
      const SizedBox(height: 15),
      card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        heading(Icons.hub_rounded, 'Project agent team', 'Existing agents shown by the project AI Operations Center'),
        const SizedBox(height: 12),
        ...agents.map((a) => Container(
          margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(11),
          decoration: BoxDecoration(color: const Color(0xFFF8FAFD), borderRadius: BorderRadius.circular(13), border: Border.all(color: const Color(0xFFE5ECF5))),
          child: Row(children: [
            Container(width: 40, height: 40, decoration: BoxDecoration(color: a.color.withValues(alpha: .10), borderRadius: BorderRadius.circular(12)), child: Icon(a.icon, color: a.color)),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(a.id, style: const TextStyle(color: muted, fontSize: 10, fontWeight: FontWeight.w900)),
              const SizedBox(height: 3), Text(a.name, style: const TextStyle(color: navy, fontWeight: FontWeight.w800, fontSize: 13)),
              const SizedBox(height: 3), Text(a.description, style: const TextStyle(color: muted, fontSize: 11)),
            ])),
          ]),
        )),
        const Text('Execution sequence and approval gates are controlled by the backend.', style: TextStyle(color: muted, fontSize: 11, height: 1.4)),
      ])),
      const SizedBox(height: 15),
      card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        heading(Icons.chat_bubble_outline_rounded, 'Prompt composer', 'Describe the analysis or response you need'),
        const SizedBox(height: 12),
        TextField(
          controller: promptController, enabled: !running, minLines: 4, maxLines: 8,
          decoration: InputDecoration(
            hintText: 'Analyze flood risk, identify vulnerable people, recommend resources, and prepare warning and volunteer coordination plans...',
            alignLabelWithHint: true, filled: true, fillColor: bg,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.all(14),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(width: double.infinity, child: FilledButton.icon(
          onPressed: running || resolving ? null : runWorkflow,
          icon: running ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.rocket_launch_rounded),
          label: Text(running ? 'Running backend workflow...' : 'Run AI workflow'),
          style: FilledButton.styleFrom(backgroundColor: blue, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 15), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
        )),
      ])),
      if (error != null) ...[
        const SizedBox(height: 12),
        card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Icon(Icons.error_outline_rounded, color: Color(0xFFCF1322)), const SizedBox(width: 9),
            Expanded(child: SelectableText(error!, style: const TextStyle(color: Color(0xFF820014), height: 1.4))),
          ]),
          if (!running && location != null) ...[
            const SizedBox(height: 12),
            Align(alignment: Alignment.centerRight, child: OutlinedButton.icon(
              onPressed: runWorkflow,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry workflow'),
            )),
          ],
        ])),
      ],
      if (result != null) ...[
        const SizedBox(height: 15),
        card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          heading(Icons.receipt_long_rounded, 'Backend workflow response', status),
          const SizedBox(height: 10),
          Container(width: double.infinity, padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)), child: SelectableText(pretty(result), style: const TextStyle(fontFamily: 'monospace', fontSize: 11, height: 1.5, color: navy))),
          const SizedBox(height: 8),
          const Text('Review the returned status and approval fields. A response is not proof that every action completed.', style: TextStyle(color: muted, fontSize: 11, height: 1.4)),
        ])),
      ],
      const SizedBox(height: 12),
      const Text('Location lookup requires internet. Approval-required actions remain controlled by the existing backend.', style: TextStyle(color: muted, fontSize: 11, height: 1.4)),
    ]),
  );

  Widget heading(IconData icon, String title, String subtitle) => Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Container(width: 42, height: 42, decoration: BoxDecoration(color: const Color(0xFFEAF2FF), borderRadius: BorderRadius.circular(13)), child: Icon(icon, color: blue)),
    const SizedBox(width: 11),
    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: const TextStyle(color: navy, fontSize: 16, fontWeight: FontWeight.w900)),
      const SizedBox(height: 4), Text(subtitle, style: const TextStyle(color: muted, fontSize: 12, height: 1.4)),
    ])),
  ]);

  Widget card(Widget child) => Container(
    padding: const EdgeInsets.all(15),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFE4EBF4)), boxShadow: const [BoxShadow(color: Color(0x08071A33), blurRadius: 16, offset: Offset(0, 5))]),
    child: child,
  );
}
