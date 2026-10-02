import 'package:flutter/material.dart';
import '../models/field_task.dart';
import '../services/task_service.dart';
import '../theme/app_theme.dart';

class AssignedTasksModal extends StatefulWidget {
  const AssignedTasksModal({super.key});

  static Future<void> show(BuildContext context) {
    return showDialog(
      context: context,
      builder: (context) => Dialog(
        insetPadding: const EdgeInsets.all(16),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 700, maxHeight: 650),
          child: const AssignedTasksModal(),
        ),
      ),
    );
  }

  @override
  State<AssignedTasksModal> createState() => _AssignedTasksModalState();
}

class _AssignedTasksModalState extends State<AssignedTasksModal> {
  final TaskService _taskService = TaskService();

  @override
  void initState() {
    super.initState();
    _taskService.addListener(_onTasksUpdated);
  }

  @override
  void dispose() {
    _taskService.removeListener(_onTasksUpdated);
    super.dispose();
  }

  void _onTasksUpdated() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final tasks = _taskService.tasks;

    return Column(
      children: [
        // Top Header
        Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.assignment_outlined, color: AppTheme.primaryBlue, size: 20),
                  ),
                  const SizedBox(width: 10),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Assigned Volunteer Tasks',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                      ),
                      Text(
                        'Field operations & triage workflow list',
                        style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close, color: AppTheme.textMuted),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
        ),
        const Divider(color: AppTheme.borderLight, height: 1),

        // Task List Body
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.all(20),
            itemCount: tasks.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final task = tasks[index];
              return _buildTaskCard(task);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildTaskCard(FieldTask task) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Task Category & ID
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceSubtle,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: AppTheme.borderLight),
                    ),
                    child: Text(
                      task.id,
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textMuted),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    task.category,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.primaryBlue),
                  ),
                ],
              ),
              // Priority & Status Chips
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: task.priority.color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Priority: ${task.priority.label}',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: task.priority.color),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: task.status.color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      task.status.label,
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: task.status.color),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            task.title,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 4),
          Text(
            task.description,
            style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.3),
          ),
          const SizedBox(height: 10),

          // Location Tag & Assigned To
          Row(
            children: [
              const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.textMuted),
              const SizedBox(width: 4),
              Text(
                task.location,
                style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.w500),
              ),
              const SizedBox(width: 16),
              const Icon(Icons.person_outline, size: 14, color: AppTheme.textMuted),
              const SizedBox(width: 4),
              Text(
                task.assignedTo,
                style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.w500),
              ),
            ],
          ),

          if (task.evidenceNotes != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.image_outlined, size: 16, color: Color(0xFF16A34A)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Evidence Submitted: "${task.evidenceNotes}" (${task.evidenceImageName})',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF15803D), fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 12),
          // Action Buttons
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              if (task.status == TaskStatus.pending)
                OutlinedButton(
                  onPressed: () {
                    _taskService.updateTaskStatus(task.id, TaskStatus.inProgress);
                  },
                  child: const Text('Start Task'),
                ),
              if (task.status == TaskStatus.inProgress)
                ElevatedButton.icon(
                  icon: const Icon(Icons.check, size: 16),
                  label: const Text('Mark Complete'),
                  onPressed: () {
                    _taskService.updateTaskStatus(task.id, TaskStatus.completed);
                  },
                ),
            ],
          ),
        ],
      ),
    );
  }
}
