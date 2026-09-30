import 'package:flutter/material.dart';

import 'presentation/premium_admin_navigation.dart';

class AdminControlCenterEntry extends StatelessWidget {
  const AdminControlCenterEntry({super.key});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: 'Admin Control Center',
      icon: const Icon(Icons.dashboard_customize_rounded),
      onPressed: () {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const PremiumAdminNavigation()),
        );
      },
    );
  }
}

