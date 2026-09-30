import 'package:flutter/material.dart';

import 'user_dashboard.dart';
import 'admin_dashboard.dart';

class RoleDashboard extends StatelessWidget {
  final String fullName;
  final String userRole;

  const RoleDashboard({
    super.key,
    required this.fullName,
    required this.userRole,
  });

  @override
  Widget build(BuildContext context) {
    final role = userRole.trim().toLowerCase();

    if (role == 'systemadministrator' ||
        role == 'system administrator' ||
        role == 'admin') {
      return AdminDashboard(fullName: fullName);
    }

    return UserDashboard(fullName: fullName, userRole: userRole);
  }
}
