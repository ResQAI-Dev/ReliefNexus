import 'package:flutter/material.dart';

/// Shared presentation helpers for Agent 03 workflow steps.
///
/// Keep API/state logic inside Agent03WorkflowPage.
/// This file is intentionally UI-only.
class Agent03WorkflowSteps {
  static Widget sectionTitle(String title, {String? subtitle}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 19,
            fontWeight: FontWeight.w900,
            color: Color(0xFF142743),
          ),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF71839A),
              height: 1.4,
            ),
          ),
        ],
      ],
    );
  }

  static Widget stepBadge(
    String number,
    String title, {
    bool active = false,
    bool completed = false,
  }) {
    return Row(
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: active || completed
                ? const Color(0xFF086BFF)
                : const Color(0xFFE5ECF5),
          ),
          alignment: Alignment.center,
          child: completed
              ? const Icon(Icons.check_rounded, color: Colors.white, size: 19)
              : Text(
                  number,
                  style: TextStyle(
                    color: active ? Colors.white : const Color(0xFF71839A),
                    fontWeight: FontWeight.w900,
                  ),
                ),
        ),
        const SizedBox(width: 9),
        Expanded(
          child: Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: active ? FontWeight.w900 : FontWeight.w600,
              color: active ? const Color(0xFF086BFF) : const Color(0xFF71839A),
            ),
          ),
        ),
      ],
    );
  }

  static Widget emptyCard(IconData icon, String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2EAF3)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 32, color: const Color(0xFF8A9AAF)),
          const SizedBox(height: 10),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF71839A),
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}
