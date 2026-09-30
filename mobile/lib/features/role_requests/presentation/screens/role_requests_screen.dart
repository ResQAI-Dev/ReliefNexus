import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/models/role_request_model.dart';
import '../providers/role_requests_provider.dart';

const _navy = Color(0xFF071A3D);
const _blue = Color(0xFF1769FF);
const _purple = Color(0xFF875CF6);
const _muted = Color(0xFF71809B);
const _bg = Color(0xFFF4F7FC);
const _line = Color(0xFFE4EAF3);

class RoleRequestsPage extends StatelessWidget {
  const RoleRequestsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => RoleRequestsProvider()..load(),
      child: const _RoleRequestsView(),
    );
  }
}

class _RoleRequestsView extends StatelessWidget {
  const _RoleRequestsView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: RefreshIndicator(
          color: _blue,
          onRefresh: () => context.read<RoleRequestsProvider>().load(),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(child: _Header()),
              SliverToBoxAdapter(child: _Hero()),
              SliverToBoxAdapter(child: _Summary()),
              const SliverToBoxAdapter(child: SizedBox(height: 18)),
              Consumer<RoleRequestsProvider>(
                builder: (context, provider, _) {
                  if (provider.loading && provider.items.isEmpty) {
                    return const SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(child: CircularProgressIndicator()),
                    );
                  }

                  if (provider.error != null && provider.items.isEmpty) {
                    return SliverFillRemaining(
                      hasScrollBody: false,
                      child: _ErrorState(
                        message: provider.error!,
                        onRetry: provider.load,
                      ),
                    );
                  }

                  if (provider.items.isEmpty) {
                    return const SliverFillRemaining(
                      hasScrollBody: false,
                      child: _EmptyState(),
                    );
                  }

                  return SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                    sliver: SliverList.builder(
                      itemCount: provider.items.length,
                      itemBuilder: (context, index) {
                        return _RequestCard(
                          item: provider.items[index],
                          processing:
                              provider.processingId == provider.items[index].id,
                        );
                      },
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(18, 14, 18, 8),
    child: Row(
      children: [
        _IconButton(
          icon: Icons.arrow_back_rounded,
          onTap: () => Navigator.maybePop(context),
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'ROLE REQUESTS',
                style: TextStyle(
                  color: _purple,
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5,
                ),
              ),
              SizedBox(height: 3),
              Text(
                'Review & approve',
                style: TextStyle(
                  color: _navy,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ),
        _IconButton(
          icon: Icons.refresh_rounded,
          onTap: () => context.read<RoleRequestsProvider>().load(),
        ),
      ],
    ),
  );
}

class _Hero extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
    child: ClipRRect(
      borderRadius: BorderRadius.circular(25),
      child: SizedBox(
        height: 174,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.network(
              'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1100&q=85',
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [_navy, _purple],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
              ),
            ),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Color(0xF5071A3D),
                    Color(0x551769FF),
                    Color(0x11000000),
                  ],
                  begin: Alignment.bottomLeft,
                  end: Alignment.topRight,
                ),
              ),
            ),
            const Positioned(
              left: 18,
              right: 18,
              bottom: 17,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'ADMINISTRATOR WORKSPACE',
                    style: TextStyle(
                      color: Color(0xFF8EDFFF),
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.2,
                    ),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Pending access decisions',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Review real requests from the ReliefNexus backend.',
                    style: TextStyle(
                      color: Color(0xFFDCE8FA),
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _Summary extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16),
    child: Consumer<RoleRequestsProvider>(
      builder: (_, p, __) => Row(
        children: [
          Expanded(
            child: _Metric(
              icon: Icons.pending_actions_rounded,
              value: '${p.total}',
              label: 'Pending',
              color: _purple,
            ),
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: _Metric(
              icon: Icons.verified_user_rounded,
              value: 'LIVE',
              label: 'Workflow',
              color: _blue,
            ),
          ),
        ],
      ),
    ),
  );
}

class _Metric extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;
  const _Metric({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(15),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: _line),
      boxShadow: const [
        BoxShadow(
          color: Color(0x0B071A3D),
          blurRadius: 15,
          offset: Offset(0, 6),
        ),
      ],
    ),
    child: Row(
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: color.withValues(alpha: .1),
            borderRadius: BorderRadius.circular(13),
          ),
          child: Icon(icon, color: color, size: 21),
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: const TextStyle(
                color: _navy,
                fontSize: 17,
                fontWeight: FontWeight.w900,
              ),
            ),
            Text(
              label,
              style: const TextStyle(
                color: _muted,
                fontSize: 9,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

class _RequestCard extends StatelessWidget {
  final RoleRequestModel item;
  final bool processing;
  const _RequestCard({required this.item, required this.processing});

  @override
  Widget build(BuildContext context) {
    final initials = item.fullName.trim().isEmpty
        ? '?'
        : item.fullName
              .trim()
              .split(RegExp(r'\s+'))
              .map((e) => e[0])
              .take(2)
              .join()
              .toUpperCase();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(23),
        border: Border.all(color: _line),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0C071A3D),
            blurRadius: 18,
            offset: Offset(0, 7),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 51,
                height: 51,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [_purple, _blue]),
                  borderRadius: BorderRadius.circular(17),
                ),
                alignment: Alignment.center,
                child: Text(
                  initials,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.fullName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: _navy,
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      item.email,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: _muted,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              _StatusPill(text: 'PENDING', color: _purple),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF7F9FD),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _line),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.workspace_premium_rounded,
                  color: _purple,
                  size: 19,
                ),
                const SizedBox(width: 9),
                const Text(
                  'Requested role',
                  style: TextStyle(
                    color: _muted,
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const Spacer(),
                Flexible(
                  child: Text(
                    item.role,
                    textAlign: TextAlign.right,
                    style: const TextStyle(
                      color: _navy,
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.calendar_today_rounded, color: _muted, size: 14),
              const SizedBox(width: 7),
              Text(
                _date(item.createdAt),
                style: const TextStyle(
                  color: _muted,
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: processing
                    ? null
                    : () => _showDetails(context, item),
                child: const Text(
                  'VIEW DETAILS',
                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900),
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: processing
                      ? null
                      : () => _confirm(context, approve: false),
                  icon: const Icon(Icons.close_rounded, size: 17),
                  label: const Text(
                    'Reject',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFE24A62),
                    side: const BorderSide(color: Color(0xFFF1C9D1)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(13),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 9),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: processing
                      ? null
                      : () => _confirm(context, approve: true),
                  icon: processing
                      ? const SizedBox(
                          width: 15,
                          height: 15,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.check_rounded, size: 17),
                  label: Text(
                    processing ? 'Processing' : 'Approve',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _blue,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(13),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _confirm(BuildContext context, {required bool approve}) async {
    final action = approve ? 'approve' : 'reject';
    final result = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _DecisionSheet(item: item, approve: approve),
    );
    if (result != true || !context.mounted) return;

    final provider = context.read<RoleRequestsProvider>();
    final ok = approve
        ? await provider.approve(item)
        : await provider.reject(item);
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          ok
              ? 'Role request ${action}d successfully.'
              : (provider.error ?? 'Action failed.'),
        ),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showDetails(BuildContext context, RoleRequestModel item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _RoleDetails(item: item),
    );
  }

  String _date(DateTime? d) => d == null
      ? 'Date unavailable'
      : '${d.day.toString().padLeft(2, '0')} ${_months[d.month - 1]} ${d.year}';

  static const _months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
}

class _DecisionSheet extends StatelessWidget {
  final RoleRequestModel item;
  final bool approve;
  const _DecisionSheet({required this.item, required this.approve});

  @override
  Widget build(BuildContext context) {
    final color = approve ? _blue : const Color(0xFFE24A62);
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 26),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 42,
              height: 4,
              decoration: BoxDecoration(
                color: _line,
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            const SizedBox(height: 18),
            Icon(
              approve ? Icons.verified_rounded : Icons.cancel_rounded,
              color: color,
              size: 42,
            ),
            const SizedBox(height: 10),
            Text(
              approve ? 'Approve role request?' : 'Reject role request?',
              style: const TextStyle(
                color: _navy,
                fontSize: 19,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              item.fullName,
              style: const TextStyle(
                color: _muted,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context, false),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context, true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: color,
                      foregroundColor: Colors.white,
                    ),
                    child: Text(approve ? 'Approve' : 'Reject'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _RoleDetails extends StatelessWidget {
  final RoleRequestModel item;
  const _RoleDetails({required this.item});

  @override
  Widget build(BuildContext context) => Container(
    constraints: const BoxConstraints(maxHeight: 620),
    padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
    decoration: const BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
    ),
    child: SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 42,
              height: 4,
              decoration: BoxDecoration(
                color: _line,
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          const SizedBox(height: 18),
          const Text(
            'REQUEST PROFILE',
            style: TextStyle(
              color: _purple,
              fontSize: 9,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.3,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            item.fullName,
            style: const TextStyle(
              color: _navy,
              fontSize: 23,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            item.email,
            style: const TextStyle(
              color: _muted,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 18),
          _InfoTile(
            icon: Icons.admin_panel_settings_rounded,
            title: 'Requested role',
            value: item.role,
          ),
          _InfoTile(
            icon: Icons.phone_rounded,
            title: 'Phone',
            value: _safe(item.phoneNumber),
          ),
          _InfoTile(
            icon: Icons.location_city_rounded,
            title: 'District',
            value: _safe(item.district),
          ),
          _InfoTile(
            icon: Icons.home_work_rounded,
            title: 'Address',
            value: _safe(item.address),
          ),
          _InfoTile(
            icon: Icons.calendar_month_rounded,
            title: 'Registered',
            value:
                item.createdAt?.toLocal().toString().split(' ').first ??
                'Unavailable',
          ),
          if (item.permissions.isNotEmpty) ...[
            const SizedBox(height: 8),
            const Text(
              'CURRENT PERMISSIONS',
              style: TextStyle(
                color: _muted,
                fontSize: 9,
                fontWeight: FontWeight.w900,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 7,
              runSpacing: 7,
              children: item.permissions
                  .map((p) => _PermissionChip(p))
                  .toList(),
            ),
          ],
        ],
      ),
    ),
  );

  String _safe(String? value) =>
      value == null || value.trim().isEmpty ? 'Not provided' : value;
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;
  const _InfoTile({
    required this.icon,
    required this.title,
    required this.value,
  });

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 9),
    padding: const EdgeInsets.all(13),
    decoration: BoxDecoration(
      color: const Color(0xFFF7F9FD),
      borderRadius: BorderRadius.circular(15),
      border: Border.all(color: _line),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: _blue, size: 18),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: _muted,
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                value,
                style: const TextStyle(
                  color: _navy,
                  fontSize: 12,
                  height: 1.25,
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

class _PermissionChip extends StatelessWidget {
  final String text;
  const _PermissionChip(this.text);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
    decoration: BoxDecoration(
      color: const Color(0xFFEAF2FF),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(
      text,
      style: const TextStyle(
        color: _blue,
        fontSize: 9,
        fontWeight: FontWeight.w800,
      ),
    ),
  );
}

class _StatusPill extends StatelessWidget {
  final String text;
  final Color color;
  const _StatusPill({required this.text, required this.color});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
    decoration: BoxDecoration(
      color: color.withValues(alpha: .1),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(
      text,
      style: TextStyle(
        color: color,
        fontSize: 8,
        fontWeight: FontWeight.w900,
        letterSpacing: .7,
      ),
    ),
  );
}

class _IconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _IconButton({required this.icon, required this.onTap});
  @override
  Widget build(BuildContext context) => Material(
    color: Colors.white,
    borderRadius: BorderRadius.circular(14),
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: _line),
        ),
        child: Icon(icon, color: _navy, size: 20),
      ),
    ),
  );
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorState({required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.cloud_off_rounded, color: _muted, size: 42),
          const SizedBox(height: 10),
          const Text(
            'Could not load role requests',
            style: TextStyle(
              color: _navy,
              fontSize: 15,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: _muted, fontSize: 10),
          ),
          const SizedBox(height: 14),
          ElevatedButton(onPressed: onRetry, child: const Text('Try again')),
        ],
      ),
    ),
  );
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();
  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: const [
          Icon(Icons.inbox_rounded, color: _blue, size: 48),
          SizedBox(height: 12),
          Text(
            'No pending role requests',
            style: TextStyle(
              color: _navy,
              fontSize: 16,
              fontWeight: FontWeight.w900,
            ),
          ),
          SizedBox(height: 5),
          Text(
            'All role requests have been processed.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: _muted,
              fontSize: 10,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    ),
  );
}
