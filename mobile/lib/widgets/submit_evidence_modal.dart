import 'package:flutter/material.dart';
import '../models/field_task.dart';
import '../services/task_service.dart';
import '../theme/app_theme.dart';

class SubmitEvidenceModal extends StatefulWidget {
  final List<FieldTask> availableTasks;

  const SubmitEvidenceModal({
    super.key,
    required this.availableTasks,
  });

  static Future<void> show(BuildContext context, List<FieldTask> tasks) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: SubmitEvidenceModal(availableTasks: tasks),
      ),
    );
  }

  @override
  State<SubmitEvidenceModal> createState() => _SubmitEvidenceModalState();
}

class _SubmitEvidenceModalState extends State<SubmitEvidenceModal> {
  final _formKey = GlobalKey<FormState>();
  final TaskService _taskService = TaskService();

  FieldTask? _selectedTask;
  final TextEditingController _notesController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  TaskStatus _selectedStatus = TaskStatus.submitted;
  String? _simulatedImageName;

  @override
  void initState() {
    super.initState();
    if (widget.availableTasks.isNotEmpty) {
      _selectedTask = widget.availableTasks.first;
      _locationController.text = _selectedTask!.location;
    } else {
      _locationController.text = 'Sector 4, Riverbed Basin';
    }
  }

  @override
  void dispose() {
    _notesController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      constraints: const BoxConstraints(maxWidth: 600),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.add_a_photo, color: AppTheme.primaryBlue, size: 24),
                      SizedBox(width: 10),
                      Text(
                        'Submit Field Evidence',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: AppTheme.textMuted),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const Text(
                'Attach photos and field updates for emergency command coordination.',
                style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
              ),
              const SizedBox(height: 20),

              // Task Dropdown Select
              if (widget.availableTasks.isNotEmpty) ...[
                const Text(
                  'Select Associated Task',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 6),
                DropdownButtonFormField<FieldTask>(
                  initialValue: _selectedTask,
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.assignment, color: AppTheme.primaryBlue, size: 20),
                  ),
                  items: widget.availableTasks.map((task) {
                    return DropdownMenuItem<FieldTask>(
                      value: task,
                      child: Text(
                        '${task.id}: ${task.title}',
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
                      ),
                    );
                  }).toList(),
                  onChanged: (task) {
                    setState(() {
                      _selectedTask = task;
                      if (task != null) {
                        _locationController.text = task.location;
                      }
                    });
                  },
                ),
                const SizedBox(height: 16),
              ],

              // Location Input
              const Text(
                'Location / Sector Tag',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _locationController,
                decoration: const InputDecoration(
                  hintText: 'e.g. Sector 4, Bridge Crossing',
                  prefixIcon: Icon(Icons.my_location, color: AppTheme.secondaryTeal, size: 20),
                ),
                validator: (val) => val == null || val.isEmpty ? 'Location required' : null,
              ),
              const SizedBox(height: 16),

              // Status Dropdown
              const Text(
                'Updated Field Status',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 6),
              DropdownButtonFormField<TaskStatus>(
                initialValue: _selectedStatus,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.flag_outlined, color: AppTheme.primaryBlue, size: 20),
                ),
                items: TaskStatus.values.map((status) {
                  return DropdownMenuItem<TaskStatus>(
                    value: status,
                    child: Text(
                      status.label,
                      style: TextStyle(fontSize: 13, color: status.color, fontWeight: FontWeight.bold),
                    ),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _selectedStatus = val);
                },
              ),
              const SizedBox(height: 16),

              // Notes Input
              const Text(
                'Evidence Notes & Assessment Summary',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _notesController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Describe current conditions, hazards resolved, or requested relief supplies...',
                ),
                validator: (val) => val == null || val.isEmpty ? 'Please enter evidence notes' : null,
              ),
              const SizedBox(height: 16),

              // Image Capture / Upload Drag Drop Simulation
              const Text(
                'Attach Image Evidence',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 6),
              GestureDetector(
                onTap: _simulatedImagePick,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: _simulatedImageName != null ? const Color(0xFFF0FDF4) : AppTheme.surfaceSubtle,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: _simulatedImageName != null ? const Color(0xFF16A34A) : AppTheme.borderLight,
                      style: BorderStyle.solid,
                      width: 1.5,
                    ),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        _simulatedImageName != null ? Icons.check_circle : Icons.cloud_upload_outlined,
                        size: 32,
                        color: _simulatedImageName != null ? const Color(0xFF16A34A) : AppTheme.primaryBlue,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _simulatedImageName != null
                            ? 'Attached: $_simulatedImageName'
                            : 'Click to Take Photo or Drag & Drop File',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: _simulatedImageName != null ? const Color(0xFF16A34A) : AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _simulatedImageName != null
                            ? 'Tap to replace image evidence'
                            : 'Supports JPG, PNG, WEBP (Mobile Camera / Web Upload)',
                        style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Submit Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.send_rounded, size: 18),
                  label: const Text('Submit Field Evidence Report'),
                  onPressed: _submitReport,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _simulatedImagePick() {
    final sampleImages = [
      'sector4_flood_cleared.jpg',
      'shelter_b_triage_tent.jpg',
      'highway12_debris_inspection.jpg',
      'water_distribution_checkpoint.jpg',
    ];
    final selected = (sampleImages..shuffle()).first;
    setState(() {
      _simulatedImageName = selected;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Simulated camera capture: "$selected" attached.'),
        backgroundColor: AppTheme.secondaryTeal,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _submitReport() {
    if (_formKey.currentState!.validate()) {
      final imageName = _simulatedImageName ?? 'field_report_evidence.png';

      if (_selectedTask != null) {
        _taskService.submitTaskEvidence(
          taskId: _selectedTask!.id,
          notes: _notesController.text,
          imageName: imageName,
          newStatus: _selectedStatus,
        );
      }

      Navigator.of(context).pop();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white),
              SizedBox(width: 10),
              Expanded(
                child: Text('Evidence report successfully transmitted to ReliefNexus!'),
              ),
            ],
          ),
          backgroundColor: Color(0xFF16A34A),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
}
