import 'package:flutter/material.dart';

import '../../../../core/network/api_client.dart';
import '../../data/datasources/disaster_report_remote_datasource.dart';
import '../../data/repositories/disaster_report_repository.dart';

class ReportDisasterScreen extends StatefulWidget {
  const ReportDisasterScreen({super.key});

  @override
  State<ReportDisasterScreen> createState() => _ReportDisasterScreenState();
}

class _ReportDisasterScreenState extends State<ReportDisasterScreen> {
  final _formKey = GlobalKey<FormState>();

  final _locationController = TextEditingController();
  final _descriptionController = TextEditingController();

  late final DisasterReportRepository _repository;

  String _selectedDisasterType = 'Flood';
  String _selectedSeverity = 'Medium';
  bool _isSubmitting = false;

  final List<_DisasterTypeOption> _disasterTypes = const [
    _DisasterTypeOption(
      title: 'Flood',
      icon: Icons.water_rounded,
    ),
    _DisasterTypeOption(
      title: 'Landslide',
      icon: Icons.terrain_rounded,
    ),
    _DisasterTypeOption(
      title: 'Cyclone',
      icon: Icons.air_rounded,
    ),
    _DisasterTypeOption(
      title: 'Drought',
      icon: Icons.wb_sunny_rounded,
    ),
    _DisasterTypeOption(
      title: 'Fire',
      icon: Icons.local_fire_department_rounded,
    ),
    _DisasterTypeOption(
      title: 'Earthquake',
      icon: Icons.vibration_rounded,
    ),
    _DisasterTypeOption(
      title: 'Other',
      icon: Icons.more_horiz_rounded,
    ),
  ];

  final List<_SeverityOption> _severityOptions = const [
    _SeverityOption(
      title: 'Low',
      subtitle: 'Minor',
      color: Color(0xFF20B486),
    ),
    _SeverityOption(
      title: 'Medium',
      subtitle: 'Moderate',
      color: Color(0xFFF2A900),
    ),
    _SeverityOption(
      title: 'High',
      subtitle: 'Serious',
      color: Color(0xFFF97316),
    ),
    _SeverityOption(
      title: 'Critical',
      subtitle: 'Immediate',
      color: Color(0xFFE5484D),
    ),
  ];

  static const _mint = Color(0xFF19B89A);
  static const _darkMint = Color(0xFF087F70);
  static const _lightMint = Color(0xFFE9FAF6);
  static const _background = Color(0xFFF7FBFA);
  static const _textDark = Color(0xFF102A2A);
  static const _textGrey = Color(0xFF6B7C7C);

  @override
  void initState() {
    super.initState();

    _repository = DisasterReportRepository(
      DisasterReportRemoteDataSource(ApiClient()),
    );
  }

  @override
  void dispose() {
    _locationController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submitReport() async {
    FocusScope.of(context).unfocus();

    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      await _repository.create({
        'disasterType': _selectedDisasterType,
        'description': _descriptionController.text.trim(),
        'location': _locationController.text.trim(),
        'severity': _selectedSeverity,
      });

      if (!mounted) return;

      await _showSuccessDialog();
    } catch (e) {
      if (!mounted) return;

      _showErrorSnackBar(
        'Unable to submit the disaster report. Please try again.',
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  Future<void> _showSuccessDialog() async {
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return Dialog(
          backgroundColor: Colors.white,
          insetPadding: const EdgeInsets.symmetric(horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(28),
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 30, 24, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 76,
                  height: 76,
                  decoration: BoxDecoration(
                    color: _lightMint,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: _mint.withValues(alpha: 0.20),
                      width: 8,
                    ),
                  ),
                  child: const Icon(
                    Icons.check_rounded,
                    size: 42,
                    color: _darkMint,
                  ),
                ),
                const SizedBox(height: 22),
                const Text(
                  'Report Submitted',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: _textDark,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Your disaster report has been submitted successfully and is now under review.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    height: 1.55,
                    color: _textGrey,
                  ),
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _background,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: const Color(0xFFE3EEEB),
                    ),
                  ),
                  child: Column(
                    children: [
                      _SummaryRow(
                        icon: Icons.warning_amber_rounded,
                        label: 'Disaster Type',
                        value: _selectedDisasterType,
                      ),
                      const SizedBox(height: 12),
                      _SummaryRow(
                        icon: Icons.speed_rounded,
                        label: 'Severity',
                        value: _selectedSeverity,
                      ),
                      const SizedBox(height: 12),
                      _SummaryRow(
                        icon: Icons.location_on_outlined,
                        label: 'Location',
                        value: _locationController.text.trim(),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: FilledButton(
                    onPressed: () {
                      Navigator.of(dialogContext).pop();
                      Navigator.of(context).pop(true);
                    },
                    style: FilledButton.styleFrom(
                      backgroundColor: _darkMint,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Text(
                      'Back to Home',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(
                Icons.error_outline_rounded,
                color: Colors.white,
              ),
              const SizedBox(width: 12),
              Expanded(child: Text(message)),
            ],
          ),
          backgroundColor: const Color(0xFFB42318),
          behavior: SnackBarBehavior.floating,
          margin: const EdgeInsets.all(16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(
        backgroundColor: _background,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          onPressed: _isSubmitting
              ? null
              : () => Navigator.of(context).pop(),
          icon: const Icon(
            Icons.arrow_back_rounded,
            color: _textDark,
          ),
        ),
        title: const Text(
          'Report Disaster',
          style: TextStyle(
            color: _textDark,
            fontSize: 19,
            fontWeight: FontWeight.w800,
          ),
        ),
        centerTitle: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: _lightMint,
                borderRadius: BorderRadius.circular(13),
              ),
              child: const Icon(
                Icons.notifications_none_rounded,
                color: _darkMint,
                size: 22,
              ),
            ),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(18, 8, 18, 32),
          children: [
            const _StepIndicator(),
            const SizedBox(height: 18),

            const _HeroCard(),

            const SizedBox(height: 24),

            const _SectionHeader(
              icon: Icons.warning_amber_rounded,
              title: 'Disaster Type',
              subtitle: 'Select the type of disaster you want to report',
            ),

            const SizedBox(height: 14),

            _buildDisasterTypeGrid(),

            const SizedBox(height: 28),

            const _SectionHeader(
              icon: Icons.bar_chart_rounded,
              title: 'Severity Level',
              subtitle: 'How severe is the situation?',
            ),

            const SizedBox(height: 14),

            _buildSeverityRow(),

            const SizedBox(height: 28),

            const _SectionHeader(
              icon: Icons.location_on_outlined,
              title: 'Location',
              subtitle: 'Enter the affected location',
            ),

            const SizedBox(height: 14),

            _LocationField(
              controller: _locationController,
              enabled: !_isSubmitting,
            ),

            const SizedBox(height: 28),

            const _SectionHeader(
              icon: Icons.description_outlined,
              title: 'Description',
              subtitle: 'Describe what is happening and the impact',
            ),

            const SizedBox(height: 14),

            _DescriptionField(
              controller: _descriptionController,
              enabled: !_isSubmitting,
            ),

            const SizedBox(height: 20),

            const _InfoBanner(),

            const SizedBox(height: 24),

            _PrimarySubmitButton(
              isSubmitting: _isSubmitting,
              onPressed: _submitReport,
            ),

            const SizedBox(height: 12),

            const Text(
              'Please provide accurate information so response teams can act effectively.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                height: 1.45,
                color: _textGrey,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDisasterTypeGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _disasterTypes.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.48,
      ),
      itemBuilder: (context, index) {
        final item = _disasterTypes[index];

        return DisasterTypeCard(
          option: item,
          selected: _selectedDisasterType == item.title,
          enabled: !_isSubmitting,
          onTap: () {
            setState(() {
              _selectedDisasterType = item.title;
            });
          },
        );
      },
    );
  }

  Widget _buildSeverityRow() {
    return Row(
      children: _severityOptions.map((option) {
        final selected = _selectedSeverity == option.title;

        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(
              right: option == _severityOptions.last ? 0 : 8,
            ),
            child: SeverityCard(
              option: option,
              selected: selected,
              enabled: !_isSubmitting,
              onTap: () {
                setState(() {
                  _selectedSeverity = option.title;
                });
              },
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _StepIndicator extends StatelessWidget {
  const _StepIndicator();

  static const _mint = Color(0xFF19B89A);
  static const _textGrey = Color(0xFF7B8C8C);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _StepItem(
          number: '1',
          label: 'Report',
          active: true,
        ),
        Expanded(
          child: Container(
            height: 2,
            color: _mint.withValues(alpha: 0.25),
          ),
        ),
        const _StepItem(
          number: '2',
          label: 'Details',
          active: false,
        ),
        Expanded(
          child: Container(
            height: 2,
            color: Colors.black.withValues(alpha: 0.07),
          ),
        ),
        const _StepItem(
          number: '3',
          label: 'Submit',
          active: false,
        ),
      ],
    );
  }
}

class _StepItem extends StatelessWidget {
  final String number;
  final String label;
  final bool active;

  const _StepItem({
    required this.number,
    required this.label,
    required this.active,
  });

  static const _mint = Color(0xFF19B89A);
  static const _textGrey = Color(0xFF7B8C8C);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: active ? _mint : Colors.white,
            shape: BoxShape.circle,
            border: Border.all(
              color: active
                  ? _mint
                  : Colors.black.withValues(alpha: 0.10),
            ),
          ),
          child: Center(
            child: Text(
              number,
              style: TextStyle(
                color: active ? Colors.white : _textGrey,
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ),
        const SizedBox(height: 5),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: active ? FontWeight.w700 : FontWeight.w500,
            color: active ? _mint : _textGrey,
          ),
        ),
      ],
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard();

  static const _mint = Color(0xFF19B89A);
  static const _darkMint = Color(0xFF087F70);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFFE8FBF7),
            Color(0xFFDDF6F1),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(
          color: _mint.withValues(alpha: 0.12),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Help Your Community',
                  style: TextStyle(
                    color: _darkMint,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 7),
                const Text(
                  'Report a Disaster',
                  style: TextStyle(
                    color: Color(0xFF102A2A),
                    fontSize: 24,
                    height: 1.1,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 9),
                Text(
                  'Provide accurate information to help response teams act faster.',
                  style: TextStyle(
                    color: const Color(0xFF476363),
                    fontSize: 12.5,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.75),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.campaign_rounded,
              size: 38,
              color: _mint,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _SectionHeader({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  static const _mint = Color(0xFF19B89A);
  static const _textDark = Color(0xFF102A2A);
  static const _textGrey = Color(0xFF718383);

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: const Color(0xFFE7F9F5),
            borderRadius: BorderRadius.circular(13),
          ),
          child: Icon(
            icon,
            color: _mint,
            size: 22,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: _textDark,
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                subtitle,
                style: const TextStyle(
                  color: _textGrey,
                  fontSize: 12,
                  height: 1.35,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class DisasterTypeCard extends StatelessWidget {
  final _DisasterTypeOption option;
  final bool selected;
  final bool enabled;
  final VoidCallback onTap;

  const DisasterTypeCard({
    super.key,
    required this.option,
    required this.selected,
    required this.enabled,
    required this.onTap,
  });

  static const _mint = Color(0xFF19B89A);
  static const _darkMint = Color(0xFF087F70);
  static const _textDark = Color(0xFF173333);

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(18),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: selected
                ? const Color(0xFFE9FAF6)
                : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: selected
                  ? _mint
                  : const Color(0xFFE3EBE9),
              width: selected ? 1.5 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(
                  alpha: selected ? 0.055 : 0.025,
                ),
                blurRadius: 12,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Stack(
            children: [
              Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: selected
                            ? Colors.white
                            : const Color(0xFFF2F7F6),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        option.icon,
                        color: selected ? _darkMint : _mint,
                        size: 22,
                      ),
                    ),
                    const SizedBox(height: 9),
                    Text(
                      option.title,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: _textDark,
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              if (selected)
                const Positioned(
                  top: 0,
                  right: 0,
                  child: CircleAvatar(
                    radius: 11,
                    backgroundColor: _mint,
                    child: Icon(
                      Icons.check_rounded,
                      size: 14,
                      color: Colors.white,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class SeverityCard extends StatelessWidget {
  final _SeverityOption option;
  final bool selected;
  final bool enabled;
  final VoidCallback onTap;

  const SeverityCard({
    super.key,
    required this.option,
    required this.selected,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(15),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          height: 76,
          padding: const EdgeInsets.symmetric(horizontal: 5),
          decoration: BoxDecoration(
            color: selected
                ? option.color.withValues(alpha: 0.08)
                : Colors.white,
            borderRadius: BorderRadius.circular(15),
            border: Border.all(
              color: selected
                  ? option.color
                  : const Color(0xFFE3EBE9),
              width: selected ? 1.4 : 1,
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: option.color,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(height: 7),
              Text(
                option.title,
                style: TextStyle(
                  color: option.color.withValues(alpha: 0.95),
                  fontSize: 11.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                option.subtitle,
                style: const TextStyle(
                  color: Color(0xFF7B8989),
                  fontSize: 8.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LocationField extends StatelessWidget {
  final TextEditingController controller;
  final bool enabled;

  const _LocationField({
    required this.controller,
    required this.enabled,
  });

  static const _mint = Color(0xFF19B89A);

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      enabled: enabled,
      textInputAction: TextInputAction.next,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: Color(0xFF243B3B),
      ),
      decoration: InputDecoration(
        hintText: 'Enter city, village or affected area',
        hintStyle: const TextStyle(
          color: Color(0xFF9AA9A9),
          fontSize: 13,
          fontWeight: FontWeight.w500,
        ),
        prefixIcon: Container(
          margin: const EdgeInsets.all(10),
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: const Color(0xFFE9FAF6),
            borderRadius: BorderRadius.circular(11),
          ),
          child: const Icon(
            Icons.location_on_rounded,
            color: _mint,
            size: 21,
          ),
        ),
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 17,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(17),
          borderSide: const BorderSide(
            color: Color(0xFFE1EBE8),
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(17),
          borderSide: const BorderSide(
            color: Color(0xFFE1EBE8),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(17),
          borderSide: const BorderSide(
            color: _mint,
            width: 1.5,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(17),
          borderSide: const BorderSide(
            color: Color(0xFFE5484D),
          ),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(17),
          borderSide: const BorderSide(
            color: Color(0xFFE5484D),
            width: 1.5,
          ),
        ),
      ),
      validator: (value) {
        if (value == null || value.trim().isEmpty) {
          return 'Location is required';
        }
        return null;
      },
    );
  }
}

class _DescriptionField extends StatelessWidget {
  final TextEditingController controller;
  final bool enabled;

  const _DescriptionField({
    required this.controller,
    required this.enabled,
  });

  static const _mint = Color(0xFF19B89A);

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      enabled: enabled,
      minLines: 5,
      maxLines: 8,
      maxLength: 500,
      textInputAction: TextInputAction.newline,
      style: const TextStyle(
        fontSize: 14,
        height: 1.45,
        color: Color(0xFF243B3B),
      ),
      decoration: InputDecoration(
        hintText:
            'Describe what is happening, the impact, and any important information...',
        hintStyle: const TextStyle(
          color: Color(0xFF9AA9A9),
          fontSize: 13,
          height: 1.4,
        ),
        prefixIcon: const Padding(
          padding: EdgeInsets.only(
            left: 14,
            right: 4,
            bottom: 92,
          ),
          child: Icon(
            Icons.edit_note_rounded,
            color: _mint,
            size: 22,
          ),
        ),
        filled: true,
        fillColor: Colors.white,
        alignLabelWithHint: true,
        contentPadding: const EdgeInsets.fromLTRB(
          8,
          17,
          14,
          8,
        ),
        counterStyle: const TextStyle(
          color: Color(0xFF8B9999),
          fontSize: 10,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(17),
          borderSide: const BorderSide(
            color: Color(0xFFE1EBE8),
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(17),
          borderSide: const BorderSide(
            color: Color(0xFFE1EBE8),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(17),
          borderSide: const BorderSide(
            color: _mint,
            width: 1.5,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(17),
          borderSide: const BorderSide(
            color: Color(0xFFE5484D),
          ),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(17),
          borderSide: const BorderSide(
            color: Color(0xFFE5484D),
            width: 1.5,
          ),
        ),
      ),
      validator: (value) {
        if (value == null || value.trim().isEmpty) {
          return 'Description is required';
        }

        if (value.trim().length < 10) {
          return 'Please provide a little more detail';
        }

        return null;
      },
    );
  }
}

class _InfoBanner extends StatelessWidget {
  const _InfoBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: const Color(0xFFEFFAF7),
        borderRadius: BorderRadius.circular(17),
        border: Border.all(
          color: const Color(0xFFBFECE2),
        ),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.info_outline_rounded,
            color: Color(0xFF087F70),
            size: 21,
          ),
          SizedBox(width: 11),
          Expanded(
            child: Text(
              'Your report will be reviewed by the ReliefNexus response team before further action is coordinated.',
              style: TextStyle(
                color: Color(0xFF35605A),
                fontSize: 11.5,
                height: 1.45,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PrimarySubmitButton extends StatelessWidget {
  final bool isSubmitting;
  final VoidCallback onPressed;

  const _PrimarySubmitButton({
    required this.isSubmitting,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: FilledButton(
        onPressed: isSubmitting ? null : onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: const Color(0xFF0C9B83),
          foregroundColor: Colors.white,
          disabledBackgroundColor: const Color(0xFFB6DAD3),
          disabledForegroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 180),
          child: isSubmitting
              ? const Row(
                  key: ValueKey('loading'),
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 21,
                      height: 21,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: Colors.white,
                      ),
                    ),
                    SizedBox(width: 12),
                    Text(
                      'Submitting Report...',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                )
              : const Row(
                  key: ValueKey('submit'),
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.send_rounded,
                      size: 21,
                    ),
                    SizedBox(width: 10),
                    Text(
                      'Submit Disaster Report',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    SizedBox(width: 8),
                    Icon(
                      Icons.arrow_forward_rounded,
                      size: 19,
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _SummaryRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: const Color(0xFFE8F8F4),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            icon,
            color: const Color(0xFF087F70),
            size: 18,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              color: Color(0xFF718383),
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF173333),
              fontSize: 12,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ],
    );
  }
}

class _DisasterTypeOption {
  final String title;
  final IconData icon;

  const _DisasterTypeOption({
    required this.title,
    required this.icon,
  });
}

class _SeverityOption {
  final String title;
  final String subtitle;
  final Color color;

  const _SeverityOption({
    required this.title,
    required this.subtitle,
    required this.color,
  });
}
