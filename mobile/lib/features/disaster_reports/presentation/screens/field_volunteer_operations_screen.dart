import 'package:flutter/material.dart';

import '../../../../core/network/api_client.dart';
import '../../data/datasources/disaster_report_remote_datasource.dart';
import '../../data/models/disaster_report_model.dart';
import '../../data/repositories/disaster_report_repository.dart';

class FieldVolunteerOperationsScreen extends StatefulWidget {
  const FieldVolunteerOperationsScreen({super.key});

  @override
  State<FieldVolunteerOperationsScreen> createState() =>
      _FieldVolunteerOperationsScreenState();
}

class _FieldVolunteerOperationsScreenState
    extends State<FieldVolunteerOperationsScreen> {
  late final DisasterReportRepository _repository;
  List<DisasterReportModel> _items = [];
  bool _loading = true;
  String? _error;
  String _filter = 'All';

  @override
  void initState() {
    super.initState();
    _repository = DisasterReportRepository(
      DisasterReportRemoteDataSource(ApiClient()),
    );
    _load();
  }

  String _status(DisasterReportModel item) =>
      item.status.toLowerCase().replaceAll(RegExp(r'[\s_-]'), '');

  bool _isCompleted(DisasterReportModel item) {
    final s = _status(item);
    return s == 'fieldcompleted' || s == 'completed' || s == 'resolved';
  }

  bool _isInProgress(DisasterReportModel item) {
    final s = _status(item);
    return s == 'inprogress' || s == 'fieldupdatesubmitted';
  }

  bool _hasUpdate(DisasterReportModel item) =>
      _status(item) == 'fieldupdatesubmitted';

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final rows = await _repository.getAssignedToMe();
      if (!mounted) return;
      setState(() => _items = rows);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _runAction(
    DisasterReportModel item,
    Future<void> Function() action,
  ) async {
    try {
      await action();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Field response updated successfully.')),
      );
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Action failed: $e')));
    }
  }

  Future<void> _fieldUpdate(DisasterReportModel item) async {
    final notesController = TextEditingController();
    final situationController = TextEditingController();
    final latitudeController = TextEditingController(
      text: item.latitude?.toString() ?? '',
    );
    final longitudeController = TextEditingController(
      text: item.longitude?.toString() ?? '',
    );

    final values = await showDialog<List<String?>>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Submit Field Update'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: notesController,
                decoration: const InputDecoration(
                  labelText: 'Field notes *',
                  hintText: 'Describe the current situation',
                ),
                minLines: 2,
                maxLines: 4,
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Notes required' : null,
              ),
              TextFormField(
                controller: situationController,
                decoration: const InputDecoration(
                  labelText: 'Situation (optional)',
                ),
              ),
              TextFormField(
                controller: latitudeController,
                decoration: const InputDecoration(
                  labelText: 'Latitude (optional)',
                ),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                  signed: true,
                ),
              ),
              TextFormField(
                controller: longitudeController,
                decoration: const InputDecoration(
                  labelText: 'Longitude (optional)',
                ),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                  signed: true,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              if (notesController.text.trim().isEmpty) {
                ScaffoldMessenger.of(dialogContext).showSnackBar(
                  const SnackBar(content: Text('Field notes are required')),
                );
                return;
              }

              FocusScope.of(dialogContext).unfocus();
              Navigator.pop(dialogContext, [
                notesController.text.trim(),
                situationController.text.trim(),
                latitudeController.text.trim(),
                longitudeController.text.trim(),
              ]);
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );

    if (values == null || !mounted) return;

    double? number(String value) =>
        value.trim().isEmpty ? null : double.tryParse(value.trim());

    await _runAction(
      item,
      () => _repository.fieldUpdate(
        item.id,
        notes: values[0]!,
        situation: values[1]!.isEmpty ? null : values[1],
        latitude: number(values[2]!),
        longitude: number(values[3]!),
      ),
    );
  }

  List<DisasterReportModel> get _visibleItems {
    switch (_filter) {
      case 'In Progress':
        return _items.where(_isInProgress).toList();
      case 'Updates':
        return _items.where(_hasUpdate).toList();
      case 'Completed':
        return _items.where(_isCompleted).toList();
      case 'Assigned':
        return _items.where((item) {
          final s = _status(item);
          return !_isInProgress(item) &&
              !_isCompleted(item) &&
              s != 'resolved' &&
              s != 'rejected';
        }).toList();
      default:
        return _items;
    }
  }

  Widget _metric(String title, int value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 23),
          const SizedBox(height: 10),
          Text(
            '$value',
            style: const TextStyle(fontSize: 25, fontWeight: FontWeight.bold),
          ),
          Text(title, style: const TextStyle(color: Colors.blueGrey)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final assigned = _items.where((item) {
      final s = _status(item);
      return !_isInProgress(item) &&
          !_isCompleted(item) &&
          s != 'resolved' &&
          s != 'rejected';
    }).length;

    final inProgress = _items.where(_isInProgress).length;
    final updates = _items.where(_hasUpdate).length;
    final completed = _items.where(_isCompleted).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FC),
      appBar: AppBar(
        title: const Text('Field Operations'),
        backgroundColor: const Color(0xFF071A3D),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            onPressed: _load,
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh tasks',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text(
              'Your Response Overview',
              style: TextStyle(fontSize: 21, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.5,
              children: [
                _metric(
                  'Assigned',
                  assigned,
                  Icons.assignment_outlined,
                  const Color(0xFF2563EB),
                ),
                _metric(
                  'In Progress',
                  inProgress,
                  Icons.sync_rounded,
                  const Color(0xFFD97706),
                ),
                _metric(
                  'Updates',
                  updates,
                  Icons.update_rounded,
                  const Color(0xFF7C3AED),
                ),
                _metric(
                  'Completed',
                  completed,
                  Icons.check_circle_outline,
                  const Color(0xFF059669),
                ),
              ],
            ),
            const SizedBox(height: 24),
            const Text(
              'Assigned Incidents',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children:
                    ['All', 'Assigned', 'In Progress', 'Updates', 'Completed']
                        .map(
                          (filter) => Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text(filter),
                              selected: _filter == filter,
                              onSelected: (_) =>
                                  setState(() => _filter = filter),
                            ),
                          ),
                        )
                        .toList(),
              ),
            ),
            const SizedBox(height: 12),
            if (_loading)
              const Padding(
                padding: EdgeInsets.all(36),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      const Icon(Icons.cloud_off, size: 36),
                      const SizedBox(height: 8),
                      const Text('Unable to load assigned incidents.'),
                      const SizedBox(height: 6),
                      Text(
                        _error!,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                      TextButton(onPressed: _load, child: const Text('Retry')),
                    ],
                  ),
                ),
              )
            else if (_visibleItems.isEmpty)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(
                    child: Text('No incidents found for this filter.'),
                  ),
                ),
              )
            else
              ..._visibleItems.map(_reportCard),
          ],
        ),
      ),
    );
  }

  Widget _reportCard(DisasterReportModel item) {
    final s = _status(item);
    final canStart = s == 'assigned' || s == 'volunteerqueue';
    final canUpdate = s == 'inprogress' || s == 'fieldupdatesubmitted';
    final canComplete = canUpdate;
    final statusLabel = item.status.replaceAllMapped(
      RegExp(r'([a-z])([A-Z])'),
      (m) => '${m[1]} ${m[2]}',
    );
    final steps = <String>[
      'Assigned',
      'In Progress',
      'Updates',
      'Completed',
      'Resolved',
    ];
    final currentStep = s == 'resolved'
        ? 4
        : s == 'fieldcompleted' || s == 'completed'
        ? 3
        : s == 'fieldupdatesubmitted'
        ? 2
        : s == 'inprogress'
        ? 1
        : 0;
    final severityColor = item.severity.toLowerCase() == 'critical'
        ? const Color(0xFFDC2626)
        : item.severity.toLowerCase() == 'high'
        ? const Color(0xFFEA580C)
        : item.severity.toLowerCase() == 'low'
        ? const Color(0xFF059669)
        : const Color(0xFFD97706);

    return Container(
      margin: const EdgeInsets.only(bottom: 18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A0F172A),
            blurRadius: 18,
            offset: Offset(0, 6),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 128,
            width: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF123B66),
                  Color(0xFF071A3D),
                  Color(0xFF2563EB),
                ],
              ),
            ),
            child: Stack(
              children: [
                Positioned(
                  right: -12,
                  bottom: -28,
                  child: Icon(
                    Icons.public_rounded,
                    size: 160,
                    color: Colors.white.withOpacity(.07),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 11,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(30),
                            ),
                            child: Text(
                              item.disasterType.toUpperCase(),
                              style: const TextStyle(
                                color: Color(0xFF071A3D),
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                letterSpacing: .7,
                              ),
                            ),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 11,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(30),
                            ),
                            child: Text(
                              item.severity,
                              style: TextStyle(
                                color: severityColor,
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          const Icon(
                            Icons.location_on_rounded,
                            color: Colors.white,
                            size: 17,
                          ),
                          const SizedBox(width: 5),
                          Expanded(
                            child: Text(
                              item.location,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        item.disasterType,
                        style: const TextStyle(
                          fontSize: 21,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF071A3D),
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(30),
                      ),
                      child: Text(
                        statusLabel,
                        style: const TextStyle(
                          color: Color(0xFF1D4ED8),
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ],
                ),
                if (item.description.trim().isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    item.description,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      height: 1.45,
                      fontSize: 13,
                    ),
                  ),
                ],
                const SizedBox(height: 18),
                const Text(
                  'RESPONSE WORKFLOW',
                  style: TextStyle(
                    color: Color(0xFF2563EB),
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: List.generate(steps.length, (index) {
                    final done = index <= currentStep;
                    return Expanded(
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 25,
                                height: 25,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: done
                                      ? const Color(0xFF2563EB)
                                      : const Color(0xFFE2E8F0),
                                ),
                                child: Icon(
                                  done
                                      ? Icons.check_rounded
                                      : Icons.circle_outlined,
                                  color: done
                                      ? Colors.white
                                      : const Color(0xFF94A3B8),
                                  size: 15,
                                ),
                              ),
                              if (index < steps.length - 1)
                                Expanded(
                                  child: Container(
                                    height: 3,
                                    color: index < currentStep
                                        ? const Color(0xFF2563EB)
                                        : const Color(0xFFE2E8F0),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              steps[index],
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: done
                                    ? FontWeight.w800
                                    : FontWeight.w500,
                                color: done
                                    ? const Color(0xFF1E40AF)
                                    : const Color(0xFF94A3B8),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: _detailTile(
                        'DISASTER TYPE',
                        item.disasterType,
                        Icons.warning_amber_rounded,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _detailTile(
                        'LOCATION',
                        item.location,
                        Icons.location_on_outlined,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: _detailTile(
                        'COORDINATES',
                        item.latitude != null && item.longitude != null
                            ? '${item.latitude}, ${item.longitude}'
                            : 'Not available',
                        Icons.my_location_rounded,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _detailTile(
                        'REPORTED BY',
                        item.reporterName,
                        Icons.person_outline_rounded,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                const Text(
                  'FIELD RESPONSE ACTIONS',
                  style: TextStyle(
                    color: Color(0xFF2563EB),
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 10),
                if (canStart)
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: () => _runAction(
                        item,
                        () => _repository.fieldStart(item.id),
                      ),
                      icon: const Icon(Icons.play_arrow_rounded),
                      label: const Text('Start Field Response'),
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        padding: const EdgeInsets.symmetric(vertical: 13),
                      ),
                    ),
                  ),
                if (canUpdate) ...[
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _fieldUpdate(item),
                          icon: const Icon(Icons.note_add_outlined),
                          label: const Text('Add Field Update'),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: () => _confirmComplete(item),
                          icon: const Icon(Icons.check_circle_outline_rounded),
                          label: const Text('Mark Complete'),
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color(0xFF2563EB),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 9),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0F7FF),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFD7E8FF)),
                    ),
                    child: const Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          Icons.support_agent_rounded,
                          color: Color(0xFF64748B),
                          size: 19,
                        ),
                        SizedBox(width: 9),
                        Expanded(
                          child: Text(
                            'Request Assistance\nContact the control center for additional support.',
                            style: TextStyle(
                              color: Color(0xFF64748B),
                              fontSize: 11,
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                if (_isCompleted(item)) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      children: [
                        Icon(
                          Icons.check_circle_rounded,
                          color: Color(0xFF059669),
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Field response completed. Resolution is handled by the control center.',
                            style: TextStyle(
                              color: Color(0xFF047857),
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _detailTile(String label, String value, IconData icon) {
    return Container(
      constraints: const BoxConstraints(minHeight: 72),
      padding: const EdgeInsets.all(11),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F9FC),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 17, color: const Color(0xFF2563EB)),
          const SizedBox(width: 7),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                    letterSpacing: .5,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  value,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 11,
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

  Future<void> _confirmComplete(DisasterReportModel item) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Complete field response?'),
        content: const Text(
          'This will mark your field operation as completed. The control center remains responsible for resolving the disaster report.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await _runAction(item, () => _repository.fieldComplete(item.id));
    }
  }
}
