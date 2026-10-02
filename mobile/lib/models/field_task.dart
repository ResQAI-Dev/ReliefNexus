import 'package:flutter/material.dart';

enum TaskPriority { low, medium, high, critical }
enum TaskStatus { pending, inProgress, completed, submitted }

extension TaskPriorityExtension on TaskPriority {
  String get label {
    switch (this) {
      case TaskPriority.low:
        return 'Low';
      case TaskPriority.medium:
        return 'Medium';
      case TaskPriority.high:
        return 'High';
      case TaskPriority.critical:
        return 'Critical';
    }
  }

  Color get color {
    switch (this) {
      case TaskPriority.low:
        return const Color(0xFF64748B);
      case TaskPriority.medium:
        return const Color(0xFF0284C7);
      case TaskPriority.high:
        return const Color(0xFFEA580C);
      case TaskPriority.critical:
        return const Color(0xFFDC2626);
    }
  }
}

extension TaskStatusExtension on TaskStatus {
  String get label {
    switch (this) {
      case TaskStatus.pending:
        return 'Pending';
      case TaskStatus.inProgress:
        return 'In Progress';
      case TaskStatus.completed:
        return 'Completed';
      case TaskStatus.submitted:
        return 'Evidence Submitted';
    }
  }

  Color get color {
    switch (this) {
      case TaskStatus.pending:
        return const Color(0xFF64748B);
      case TaskStatus.inProgress:
        return const Color(0xFF2563EB);
      case TaskStatus.completed:
      case TaskStatus.submitted:
        return const Color(0xFF16A34A);
    }
  }
}

class FieldTask {
  final String id;
  final String title;
  final String category;
  final String location;
  final TaskPriority priority;
  TaskStatus status;
  final String assignedTo;
  final String description;
  final DateTime createdAt;
  String? evidenceNotes;
  String? evidenceImageName;

  FieldTask({
    required this.id,
    required this.title,
    required this.category,
    required this.location,
    required this.priority,
    required this.status,
    required this.assignedTo,
    required this.description,
    required this.createdAt,
    this.evidenceNotes,
    this.evidenceImageName,
  });
}
