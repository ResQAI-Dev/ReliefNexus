import 'package:flutter/material.dart';
import 'package:reliefnexus_mobile/core/network/api_client.dart';

class AuditLogsWebStylePage extends StatefulWidget {
  const AuditLogsWebStylePage({super.key});

  @override
  State<AuditLogsWebStylePage> createState() => _AuditLogsWebStylePageState();
}

class _AuditLogsWebStylePageState extends State<AuditLogsWebStylePage> {
  final ApiClient _client = ApiClient();
  final TextEditingController _searchController = TextEditingController();

  bool _loading = true;
  String? _error;

  List<dynamic> _items = [];
  String _filter = 'All';

  final List<String> _filters = const [
    'All',
    'Login',
    'Create',
    'Update',
    'Delete',
    'System',
  ];

  @override
  void initState() {
    super.initState();
    _load();

    _searchController.addListener(() {
      if (mounted) {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<dynamic> _extractList(dynamic value) {
    if (value is List) {
      return value;
    }

    if (value is Map) {
      for (final key in ['data', 'items', 'results', 'records']) {
        if (value[key] is List) {
          return value[key] as List;
        }
      }
    }

    return const [];
  }

  Map<String, dynamic> _map(dynamic value) {
    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }

    return {};
  }

  String _first(Map<String, dynamic> data, List<String> keys) {
    for (final key in keys) {
      final value = data[key];

      if (value != null && value.toString().trim().isNotEmpty) {
        return value.toString();
      }
    }

    return '';
  }

  String _action(Map<String, dynamic> data) {
    final value = _first(data, [
      'action',
      'actionType',
      'eventType',
      'operation',
      'activity',
      'type',
    ]);

    if (value.isEmpty) {
      return 'System';
    }

    final text = value.toLowerCase();

    if (text.contains('login') ||
        text.contains('logout') ||
        text.contains('sign')) {
      return 'Login';
    }

    if (text.contains('create') || text.contains('add')) {
      return 'Create';
    }

    if (text.contains('update') ||
        text.contains('edit') ||
        text.contains('change')) {
      return 'Update';
    }

    if (text.contains('delete') || text.contains('remove')) {
      return 'Delete';
    }

    return 'System';
  }

  String _title(Map<String, dynamic> data) {
    final value = _first(data, [
      'description',
      'message',
      'activity',
      'action',
      'event',
      'eventName',
      'title',
    ]);

    return value.isEmpty ? 'System Activity' : value;
  }

  String _user(Map<String, dynamic> data) {
    final value = _first(data, [
      'userName',
      'username',
      'userEmail',
      'email',
      'performedBy',
      'actor',
      'createdBy',
    ]);

    return value.isEmpty ? 'System' : value;
  }

  String _time(Map<String, dynamic> data) {
    final value = _first(data, [
      'createdAt',
      'timestamp',
      'dateTime',
      'occurredAt',
      'time',
    ]);

    return value.isEmpty ? 'Recent activity' : value;
  }

  Color _color(String action) {
    switch (action) {
      case 'Login':
        return const Color(0xFF2563EB);
      case 'Create':
        return const Color(0xFF10B981);
      case 'Update':
        return const Color(0xFFF59E0B);
      case 'Delete':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF64748B);
    }
  }

  IconData _icon(String action) {
    switch (action) {
      case 'Login':
        return Icons.login_rounded;
      case 'Create':
        return Icons.add_circle_outline_rounded;
      case 'Update':
        return Icons.edit_rounded;
      case 'Delete':
        return Icons.delete_outline_rounded;
      default:
        return Icons.settings_rounded;
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final response = await _client.dio.get('/audit-logs');

      if (!mounted) {
        return;
      }

      setState(() {
        _items = _extractList(response.data);
        _loading = false;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }

      setState(() {
        _loading = false;
        _error = 'Unable to load audit logs from the backend.';
      });
    }
  }

  List<Map<String, dynamic>> get _filtered {
    final query = _searchController.text.trim().toLowerCase();

    return _items.map(_map).where((data) {
      final action = _action(data);

      final searchable = data.values
          .map((value) => value.toString())
          .join(' ')
          .toLowerCase();

      final searchMatch = query.isEmpty || searchable.contains(query);

      final filterMatch = _filter == 'All' || action == _filter;

      return searchMatch && filterMatch;
    }).toList();
  }

  Widget _filterChip(String value) {
    final selected = _filter == value;

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(value),
        selected: selected,
        onSelected: (_) {
          setState(() {
            _filter = value;
          });
        },
        selectedColor: const Color(0xFF0EA5E9),
        backgroundColor: Colors.white,
        side: BorderSide(
          color: selected ? const Color(0xFF0EA5E9) : const Color(0xFFDCE5EE),
        ),
        labelStyle: TextStyle(
          color: selected ? Colors.white : const Color(0xFF475569),
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _logCard(Map<String, dynamic> data) {
    final action = _action(data);
    final color = _color(action);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 15, vertical: 5),
          childrenPadding: const EdgeInsets.fromLTRB(15, 0, 15, 15),
          leading: Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color.withOpacity(.10),
              borderRadius: BorderRadius.circular(13),
            ),
            child: Icon(_icon(action), color: color, size: 21),
          ),
          title: Text(
            _title(data),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF06152F),
              fontSize: 13,
              fontWeight: FontWeight.w800,
            ),
          ),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 5),
            child: Text(
              '${_user(data)}  â€¢  ${_time(data)}',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 10),
            ),
          ),
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
            decoration: BoxDecoration(
              color: color.withOpacity(.10),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              action,
              style: TextStyle(
                color: color,
                fontSize: 9,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF7FAFD),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Activity Details',
                    style: TextStyle(
                      color: Color(0xFF06152F),
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...data.entries.take(12).map((entry) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(
                            width: 105,
                            child: Text(
                              entry.key,
                              style: const TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          Expanded(
                            child: Text(
                              entry.value?.toString() ?? 'N/A',
                              style: const TextStyle(
                                color: Color(0xFF1E293B),
                                fontSize: 10,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final logs = _filtered;

    return Scaffold(
      backgroundColor: const Color(0xFFF1F6FB),
      appBar: AppBar(
        backgroundColor: const Color(0xFF06152F),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Audit Logs',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded)),
        ],
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF0284C7)),
            )
          : _error != null
          ? _errorView()
          : RefreshIndicator(
              onRefresh: _load,
              color: const Color(0xFF0284C7),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _hero(),
                  const SizedBox(height: 14),
                  _search(),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 42,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: _filters.map(_filterChip).toList(),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Recent Activity',
                          style: TextStyle(
                            color: Color(0xFF06152F),
                            fontSize: 17,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      Text(
                        '${logs.length} records',
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (logs.isEmpty) _emptyView() else ...logs.map(_logCard),
                ],
              ),
            ),
    );
  }

  Widget _hero() {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF06152F), Color(0xFF0B315C)],
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: [
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'SYSTEM ACTIVITY',
                  style: TextStyle(
                    color: Color(0xFF7DD3FC),
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.4,
                  ),
                ),
                SizedBox(height: 7),
                Text(
                  'Audit Logs',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'Review system activity and administrator actions',
                  style: TextStyle(color: Color(0xB8FFFFFF), fontSize: 11),
                ),
              ],
            ),
          ),
          Container(
            width: 55,
            height: 55,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(.10),
              borderRadius: BorderRadius.circular(17),
            ),
            child: const Icon(
              Icons.history_rounded,
              color: Colors.white,
              size: 28,
            ),
          ),
        ],
      ),
    );
  }

  Widget _search() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: TextField(
        controller: _searchController,
        decoration: const InputDecoration(
          hintText: 'Search logs...',
          prefixIcon: Icon(Icons.search_rounded, color: Color(0xFF64748B)),
          suffixIcon: Icon(Icons.tune_rounded, color: Color(0xFF94A3B8)),
          border: InputBorder.none,
          contentPadding: EdgeInsets.symmetric(vertical: 15),
        ),
      ),
    );
  }

  Widget _emptyView() {
    return Container(
      padding: const EdgeInsets.all(30),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: const Column(
        children: [
          Icon(Icons.search_off_rounded, size: 40, color: Color(0xFF94A3B8)),
          SizedBox(height: 10),
          Text(
            'No audit logs found',
            style: TextStyle(
              color: Color(0xFF334155),
              fontWeight: FontWeight.w800,
            ),
          ),
          SizedBox(height: 4),
          Text(
            'Try another search or filter.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _errorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.history_toggle_off_rounded,
              size: 48,
              color: Color(0xFFEF4444),
            ),
            const SizedBox(height: 12),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFF475569),
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 14),
            ElevatedButton.icon(
              onPressed: _load,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
