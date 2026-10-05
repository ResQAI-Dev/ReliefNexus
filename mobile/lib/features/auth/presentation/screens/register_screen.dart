import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

import '../widgets/auth_widgets.dart';
import '../widgets/register_widgets.dart';
import 'login_screen.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();

  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _dob = TextEditingController();
  final _address = TextEditingController();
  final _emergencyName = TextEditingController();
  final _emergencyPhone = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();

  late final AnimationController _controller;
  late final Animation<double> _fade;
  late final Animation<Offset> _slide;

  bool _showPassword = false;
  bool _showConfirm = false;
  bool _terms = false;

  String _gender = 'Select gender';
  String _district = 'Select district';
  String _role = 'AffectedUser';

  final _genders = const ['Male', 'Female', 'Other', 'Prefer not to say'];

  final _districts = const [
    'Colombo',
    'Gampaha',
    'Kalutara',
    'Kandy',
    'Matale',
    'Nuwara Eliya',
    'Galle',
    'Matara',
    'Hambantota',
    'Jaffna',
    'Kilinochchi',
    'Mannar',
    'Mullaitivu',
    'Vavuniya',
    'Batticaloa',
    'Ampara',
    'Trincomalee',
    'Kurunegala',
    'Puttalam',
    'Anuradhapura',
    'Polonnaruwa',
    'Badulla',
    'Monaragala',
    'Ratnapura',
    'Kegalle',
  ];

  final _roles = const [
    RoleOption(
      value: 'AffectedUser',
      title: 'Affected User',
      description: 'Report incidents and request assistance',
      icon: Icons.person_outline_rounded,
    ),
    RoleOption(
      value: 'FieldVolunteer',
      title: 'Field Volunteer',
      description: 'Support relief and response operations',
      icon: Icons.volunteer_activism_outlined,
    ),
    RoleOption(
      value: 'ReliefCoordinator',
      title: 'Relief Coordinator',
      description: 'Coordinate people and resources',
      icon: Icons.groups_2_outlined,
    ),
  ];

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );

    _fade = CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic);

    _slide = Tween<Offset>(
      begin: const Offset(0, .045),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));

    _controller.forward();

    _password.addListener(_passwordChanged);
  }

  void _goBackToLogin() {
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 400),
        reverseTransitionDuration: const Duration(milliseconds: 300),
        pageBuilder: (_, animation, __) => const LoginPage(),
        transitionsBuilder: (_, animation, __, child) {
          final curved = CurvedAnimation(
            parent: animation,
            curve: Curves.easeOutCubic,
          );

          return FadeTransition(
            opacity: curved,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(-0.03, 0),
                end: Offset.zero,
              ).animate(curved),
              child: child,
            ),
          );
        },
      ),
    );
  }

  void _passwordChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _dob.dispose();
    _address.dispose();
    _emergencyName.dispose();
    _emergencyPhone.dispose();
    _password.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  double get _strength {
    final value = _password.text;

    if (value.isEmpty) return 0;

    double result = 0;

    if (value.length >= 8) result += .3;
    if (value.length >= 12) result += .15;
    if (RegExp(r'[A-Z]').hasMatch(value)) {
      result += .15;
    }
    if (RegExp(r'[a-z]').hasMatch(value)) {
      result += .15;
    }
    if (RegExp(r'[0-9]').hasMatch(value)) {
      result += .15;
    }
    if (RegExp(r'[^A-Za-z0-9]').hasMatch(value)) {
      result += .1;
    }

    return result.clamp(0, 1);
  }

  String get _strengthText {
    if (_strength < .4) return 'Weak';
    if (_strength < .7) return 'Good';
    return 'Strong';
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();

    final date = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 18, now.month, now.day),
      firstDate: DateTime(1940),
      lastDate: now,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppTheme.primary,
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: AppTheme.navy,
            ),
          ),
          child: child!,
        );
      },
    );

    if (date == null) return;

    setState(() {
      _dob.text =
          '${date.day.toString().padLeft(2, '0')}/'
          '${date.month.toString().padLeft(2, '0')}/'
          '${date.year}';
    });
  }

  void _picker({
    required String title,
    required List<String> values,
    required String selected,
    required ValueChanged<String> onSelected,
  }) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          constraints: const BoxConstraints(maxHeight: 570),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
          ),
          child: SafeArea(
            child: Column(
              children: [
                const SizedBox(height: 10),
                Container(
                  width: 42,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCE4EE),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(22, 20, 18, 10),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: const TextStyle(
                            color: AppTheme.navy,
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    itemCount: values.length,
                    itemBuilder: (context, index) {
                      final value = values[index];
                      final active = value == selected;

                      return ListTile(
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 24,
                        ),
                        title: Text(
                          value,
                          style: TextStyle(
                            color: active ? AppTheme.primary : AppTheme.navy,
                            fontWeight: active
                                ? FontWeight.w900
                                : FontWeight.w600,
                          ),
                        ),
                        trailing: active
                            ? const Icon(
                                Icons.check_circle_rounded,
                                color: AppTheme.primary,
                              )
                            : null,
                        onTap: () {
                          onSelected(value);
                          Navigator.pop(context);
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();

    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_gender == 'Select gender') {
      _message('Please select your gender.');
      return;
    }

    if (_district == 'Select district') {
      _message('Please select your district.');
      return;
    }

    if (!_terms) {
      _message('Please accept the Terms of Service and Privacy Policy.');
      return;
    }

    final provider = context.read<AuthProvider>();

    await provider.register(
      fullName: _name.text.trim(),
      email: _email.text.trim(),
      password: _password.text,
      role: _role,
    );

    if (!mounted) return;

    if (provider.error != null) {
      _message(provider.error!);
      return;
    }

    _success();
  }

  void _message(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          margin: const EdgeInsets.all(16),
          backgroundColor: AppTheme.navy,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15),
          ),
          content: Text(
            message,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      );
  }

  void _success() {
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(28),
          ),
          child: Padding(
            padding: const EdgeInsets.all(26),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppTheme.primary, AppTheme.cyan],
                    ),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_rounded,
                    color: Colors.white,
                    size: 38,
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  'Registration Submitted',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppTheme.navy,
                    fontSize: 21,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 9),
                const Text(
                  'Your account has been submitted for approval. '
                  'You can sign in once your account is approved.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppTheme.muted,
                    fontSize: 12.5,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 22),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.of(context).pushReplacement(
                        MaterialPageRoute(builder: (_) => const LoginPage()),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Text(
                      'Continue to Sign In',
                      style: TextStyle(fontWeight: FontWeight.w800),
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

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF5F8FD),
      body: Stack(
        children: [
          Positioned(
            top: -125,
            right: -120,
            child: Container(
              width: 310,
              height: 310,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.cyan.withValues(alpha: .10),
              ),
            ),
          ),
          Positioned(
            bottom: -160,
            left: -130,
            child: Container(
              width: 340,
              height: 340,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.primary.withValues(alpha: .055),
              ),
            ),
          ),

          SafeArea(
            child: FadeTransition(
              opacity: _fade,
              child: SlideTransition(
                position: _slide,
                child: Form(
                  key: _formKey,
                  child: CustomScrollView(
                    keyboardDismissBehavior:
                        ScrollViewKeyboardDismissBehavior.onDrag,
                    slivers: [
                      // HEADER
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                        sliver: SliverToBoxAdapter(
                          child: Row(
                            children: [
                              AuthBackButton(onTap: _goBackToLogin),
                              const SizedBox(width: 12),
                              const AuthBrand(),
                            ],
                          ),
                        ),
                      ),

                      // HERO
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                        sliver: SliverToBoxAdapter(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: AppTheme.primary.withValues(
                                    alpha: .08,
                                  ),
                                  borderRadius: BorderRadius.circular(30),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.auto_awesome_rounded,
                                      color: AppTheme.primary,
                                      size: 12,
                                    ),
                                    SizedBox(width: 5),
                                    Text(
                                      'JOIN RELIEFNEXUS',
                                      style: TextStyle(
                                        color: AppTheme.primary,
                                        fontSize: 8,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: .7,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 11),
                              const Text(
                                'Create your account',
                                style: TextStyle(
                                  color: AppTheme.navy,
                                  fontSize: 29,
                                  height: 1.05,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -1,
                                ),
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                'Create your profile to connect with '
                                'the right support and response teams.',
                                style: TextStyle(
                                  color: AppTheme.muted,
                                  fontSize: 12,
                                  height: 1.45,
                                ),
                              ),
                              const SizedBox(height: 17),
                              const RegisterProgress(),
                            ],
                          ),
                        ),
                      ),

                      // PERSONAL
                      _section(
                        child: SectionCard(
                          icon: Icons.person_outline_rounded,
                          title: 'Personal information',
                          subtitle: 'Your basic profile details',
                          children: [
                            AuthField(
                              controller: _name,
                              label: 'Full Name',
                              hint: 'Enter your full name',
                              icon: Icons.person_outline_rounded,
                              validator: (value) {
                                if (value == null || value.trim().isEmpty) {
                                  return 'Full name is required';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 12),
                            AuthField(
                              controller: _email,
                              label: 'Email Address',
                              hint: 'you@example.com',
                              icon: Icons.mail_outline_rounded,
                              keyboardType: TextInputType.emailAddress,
                              validator: (value) {
                                if (value == null || value.trim().isEmpty) {
                                  return 'Email is required';
                                }

                                if (!RegExp(
                                  r'^[^@\s]+@[^@\s]+\.[^@\s]+$',
                                ).hasMatch(value.trim())) {
                                  return 'Enter a valid email';
                                }

                                return null;
                              },
                            ),
                            const SizedBox(height: 12),
                            AuthField(
                              controller: _phone,
                              label: 'Phone Number',
                              hint: '+94 7X XXX XXXX',
                              icon: Icons.phone_outlined,
                              keyboardType: TextInputType.phone,
                              inputFormatters: [
                                FilteringTextInputFormatter.allow(
                                  RegExp(r'[0-9+\s-]'),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: PickerField(
                                    label: 'Date of Birth',
                                    value: _dob.text.isEmpty
                                        ? 'Select date'
                                        : _dob.text,
                                    icon: Icons.calendar_today_outlined,
                                    onTap: _pickDate,
                                  ),
                                ),
                                const SizedBox(width: 9),
                                Expanded(
                                  child: PickerField(
                                    label: 'Gender',
                                    value: _gender,
                                    icon: Icons.wc_outlined,
                                    onTap: () {
                                      _picker(
                                        title: 'Select gender',
                                        values: _genders,
                                        selected: _gender,
                                        onSelected: (value) {
                                          setState(() {
                                            _gender = value;
                                          });
                                        },
                                      );
                                    },
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            PickerField(
                              label: 'District',
                              value: _district,
                              icon: Icons.location_on_outlined,
                              onTap: () {
                                _picker(
                                  title: 'Select district',
                                  values: _districts,
                                  selected: _district,
                                  onSelected: (value) {
                                    setState(() {
                                      _district = value;
                                    });
                                  },
                                );
                              },
                            ),
                            const SizedBox(height: 12),
                            AuthField(
                              controller: _address,
                              label: 'Address',
                              hint: 'Enter your residential address',
                              icon: Icons.home_outlined,
                              maxLines: 2,
                            ),
                          ],
                        ),
                      ),

                      // EMERGENCY
                      _section(
                        child: SectionCard(
                          icon: Icons.emergency_outlined,
                          title: 'Emergency contact',
                          subtitle: 'Someone we can reach when needed',
                          accent: const Color(0xFFE36A6A),
                          children: [
                            AuthField(
                              controller: _emergencyName,
                              label: 'Contact Name',
                              hint: 'Emergency contact name',
                              icon: Icons.contact_emergency_outlined,
                            ),
                            const SizedBox(height: 12),
                            AuthField(
                              controller: _emergencyPhone,
                              label: 'Contact Phone',
                              hint: '+94 7X XXX XXXX',
                              icon: Icons.phone_outlined,
                              keyboardType: TextInputType.phone,
                              inputFormatters: [
                                FilteringTextInputFormatter.allow(
                                  RegExp(r'[0-9+\s-]'),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // SECURITY
                      _section(
                        child: SectionCard(
                          icon: Icons.lock_outline_rounded,
                          title: 'Account security',
                          subtitle: 'Keep your account protected',
                          children: [
                            PasswordField(
                              controller: _password,
                              label: 'Password',
                              hint: 'Create a strong password',
                              visible: _showPassword,
                              onToggle: () {
                                setState(() {
                                  _showPassword = !_showPassword;
                                });
                              },
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Password is required';
                                }
                                if (value.length < 8) {
                                  return 'Use at least 8 characters';
                                }
                                return null;
                              },
                            ),
                            if (_password.text.isNotEmpty) ...[
                              const SizedBox(height: 9),
                              PasswordStrength(
                                value: _strength,
                                label: _strengthText,
                              ),
                            ],
                            const SizedBox(height: 12),
                            PasswordField(
                              controller: _confirmPassword,
                              label: 'Confirm Password',
                              hint: 'Re-enter your password',
                              visible: _showConfirm,
                              onToggle: () {
                                setState(() {
                                  _showConfirm = !_showConfirm;
                                });
                              },
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please confirm your password';
                                }
                                if (value != _password.text) {
                                  return 'Passwords do not match';
                                }
                                return null;
                              },
                            ),
                          ],
                        ),
                      ),

                      // ROLE
                      _section(
                        child: SectionCard(
                          icon: Icons.badge_outlined,
                          title: 'Account role',
                          subtitle: 'Choose how you will use ReliefNexus',
                          children: [
                            ..._roles.map(
                              (role) => Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: RoleCard(
                                  option: role,
                                  selected: _role == role.value,
                                  onTap: () {
                                    setState(() {
                                      _role = role.value;
                                    });
                                  },
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // TERMS
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
                        sliver: SliverToBoxAdapter(
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                _terms = !_terms;
                              });
                            },
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                AnimatedContainer(
                                  duration: const Duration(milliseconds: 180),
                                  width: 23,
                                  height: 23,
                                  decoration: BoxDecoration(
                                    color: _terms
                                        ? AppTheme.primary
                                        : Colors.white,
                                    borderRadius: BorderRadius.circular(7),
                                    border: Border.all(
                                      color: _terms
                                          ? AppTheme.primary
                                          : const Color(0xFFD8E1ED),
                                    ),
                                  ),
                                  child: _terms
                                      ? const Icon(
                                          Icons.check_rounded,
                                          color: Colors.white,
                                          size: 15,
                                        )
                                      : null,
                                ),
                                const SizedBox(width: 9),
                                const Expanded(
                                  child: Text.rich(
                                    TextSpan(
                                      text: 'I agree to the ',
                                      style: TextStyle(
                                        color: AppTheme.muted,
                                        fontSize: 10.5,
                                        height: 1.45,
                                      ),
                                      children: [
                                        TextSpan(
                                          text: 'Terms of Service',
                                          style: TextStyle(
                                            color: AppTheme.primary,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                        TextSpan(text: ' and '),
                                        TextSpan(
                                          text: 'Privacy Policy',
                                          style: TextStyle(
                                            color: AppTheme.primary,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),

                      // BUTTON
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                        sliver: SliverToBoxAdapter(
                          child: GestureDetector(
                            onTap: provider.loading ? null : _submit,
                            child: Container(
                              height: 59,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [
                                    Color(0xFF1769FF),
                                    Color(0xFF238BFF),
                                    Color(0xFF19C7E8),
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(18),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppTheme.primary.withValues(
                                      alpha: .25,
                                    ),
                                    blurRadius: 27,
                                    offset: const Offset(0, 12),
                                  ),
                                ],
                              ),
                              child: Center(
                                child: provider.loading
                                    ? const SizedBox(
                                        width: 23,
                                        height: 23,
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 2.4,
                                        ),
                                      )
                                    : const Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            'Create Account',
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 15,
                                              fontWeight: FontWeight.w900,
                                            ),
                                          ),
                                          SizedBox(width: 10),
                                          Icon(
                                            Icons.arrow_forward_rounded,
                                            color: Colors.white,
                                            size: 21,
                                          ),
                                        ],
                                      ),
                              ),
                            ),
                          ),
                        ),
                      ),

                      // LOGIN LINK
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(20, 18, 20, 34),
                        sliver: SliverToBoxAdapter(
                          child: Center(
                            child: GestureDetector(
                              onTap: () {
                                Navigator.of(context).pushReplacement(
                                  MaterialPageRoute(
                                    builder: (_) => const LoginPage(),
                                  ),
                                );
                              },
                              child: const Text.rich(
                                TextSpan(
                                  text: 'Already have an account? ',
                                  style: TextStyle(
                                    color: AppTheme.muted,
                                    fontSize: 11.5,
                                  ),
                                  children: [
                                    TextSpan(
                                      text: 'Sign In',
                                      style: TextStyle(
                                        color: AppTheme.primary,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  SliverPadding _section({required Widget child}) {
    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      sliver: SliverToBoxAdapter(child: child),
    );
  }
}
