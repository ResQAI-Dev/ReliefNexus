import 'package:flutter/foundation.dart';
import '../models/field_task.dart';

class TaskService extends ChangeNotifier {
  static final TaskService _instance = TaskService._internal();
  factory TaskService() => _instance;
  TaskService._internal();

  final List<FieldTask> _tasks = [
    FieldTask(
      id: 'TSK-501',
      title: 'Distribute Clean Water Rations',
      category: 'Supply Distribution',
      location: 'Community Center 3',
      priority: TaskPriority.critical,
      status: TaskStatus.inProgress,
      assignedTo: 'Volunteer Unit Alpha',
      description: 'Hand out bottled water and water purification tablets to 150 affected families.',
      createdAt: DateTime.now().subtract(const Duration(hours: 1)),
    ),
    FieldTask(
      id: 'TSK-502',
      title: 'Structural Safety Assessment',
      category: 'Risk Inspection',
      location: 'Bridge Access Rd #4',
      priority: TaskPriority.high,
      status: TaskStatus.pending,
      assignedTo: 'Field Engineer Team B',
      description: 'Inspect structural integrity of bridge foundation after mudslide.',
      createdAt: DateTime.now().subtract(const Duration(hours: 3)),
    ),
    FieldTask(
      id: 'TSK-503',
      title: 'First Aid Tent Setup',
      category: 'Medical Assistance',
      location: 'Shelter B Grounds',
      priority: TaskPriority.high,
      status: TaskStatus.completed,
      assignedTo: 'Red Cross Response Unit',
      description: 'Erect triage tent and stock medical supplies for triage.',
      createdAt: DateTime.now().subtract(const Duration(hours: 6)),
      evidenceNotes: 'Triage tent set up with 10 beds operational.',
      evidenceImageName: 'triage_tent_setup.png',
    ),
    FieldTask(
      id: 'TSK-504',
      title: 'Clear Debris at Emergency Gate 2',
      category: 'Infrastructure',
      location: 'North Entry Point',
      priority: TaskPriority.medium,
      status: TaskStatus.pending,
      assignedTo: 'Volunteer Heavy Clearance',
      description: 'Clear fallen trees blocking emergency vehicle access.',
      createdAt: DateTime.now().subtract(const Duration(hours: 8)),
    ),
  ];

  List<FieldTask> get tasks => List.unmodifiable(_tasks);

  int get pendingCount => _tasks.where((t) => t.status == TaskStatus.pending).length;
  int get inProgressCount => _tasks.where((t) => t.status == TaskStatus.inProgress).length;
  int get completedCount => _tasks.where((t) => t.status == TaskStatus.completed || t.status == TaskStatus.submitted).length;

  void updateTaskStatus(String taskId, TaskStatus newStatus) {
    final index = _tasks.indexWhere((t) => t.id == taskId);
    if (index != -1) {
      _tasks[index].status = newStatus;
      notifyListeners();
    }
  }

  void submitTaskEvidence({
    required String taskId,
    required String notes,
    required String imageName,
    required TaskStatus newStatus,
  }) {
    final index = _tasks.indexWhere((t) => t.id == taskId);
    if (index != -1) {
      _tasks[index].evidenceNotes = notes;
      _tasks[index].evidenceImageName = imageName;
      _tasks[index].status = newStatus;
      notifyListeners();
    }
  }
}
