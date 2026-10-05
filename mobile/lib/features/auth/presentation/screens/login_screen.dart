import 'package:flutter/material.dart';
import '../../../dashboard/presentation/screens/role_dashboard.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import 'register_screen.dart';
import '../../../onboarding/presentation/screens/onboarding_screen.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  late final AnimationController _animationController;
  late final Animation<double> _fade;
  late final Animation<Offset> _slide;

  bool _obscurePassword = true;
  bool _rememberMe = true;

  @override
  void initState() {
    super.initState();

    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );

    _fade = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
    );

    _slide = Tween<Offset>(begin: const Offset(0, .06), end: Offset.zero)
        .animate(
          CurvedAnimation(
            parent: _animationController,
            curve: Curves.easeOutCubic,
          ),
        );

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _goBackToOnboarding() {
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 400),
        reverseTransitionDuration: const Duration(milliseconds: 300),
        pageBuilder: (_, animation, __) => const OnboardingPage(),
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

  Future<void> _login() async {
    FocusScope.of(context).unfocus();

    if (!_formKey.currentState!.validate()) {
      return;
    }

    final provider = context.read<AuthProvider>();

    await provider.login(
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );

    if (!mounted) return;

    if (provider.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          margin: const EdgeInsets.all(16),
          backgroundColor: AppTheme.navy,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15),
          ),
          content: Row(
            children: [
              const Icon(Icons.error_outline_rounded, color: Color(0xFFFF8A8A)),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  provider.error!,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
      return;
    }

    if (provider.user != null) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => RoleDashboard(
            fullName: provider.user!.fullName,
            userRole: provider.user!.role,
          ),
        ),
      );
    }
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
            right: -110,
            child: Container(
              width: 310,
              height: 310,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.cyan.withValues(alpha: .11),
              ),
            ),
          ),
          Positioned(
            bottom: -150,
            left: -120,
            child: Container(
              width: 320,
              height: 320,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.primary.withValues(alpha: .06),
              ),
            ),
          ),

          SafeArea(
            child: FadeTransition(
              opacity: _fade,
              child: SlideTransition(
                position: _slide,
                child: SingleChildScrollView(
                  keyboardDismissBehavior:
                      ScrollViewKeyboardDismissBehavior.onDrag,
                  padding: const EdgeInsets.fromLTRB(22, 14, 22, 30),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // BACK
                        _AuthBack(onTap: _goBackToOnboarding),

                        const SizedBox(height: 22),

                        // BRAND
                        const _LoginBrand(),

                        const SizedBox(height: 31),

                        // SMALL LABEL
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: .08),
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.lock_open_rounded,
                                color: AppTheme.primary,
                                size: 12,
                              ),
                              SizedBox(width: 5),
                              Text(
                                'SECURE ACCESS',
                                style: TextStyle(
                                  color: AppTheme.primary,
                                  fontSize: 8.5,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: .7,
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 12),

                        const Text(
                          'Welcome Back',
                          style: TextStyle(
                            color: AppTheme.navy,
                            fontSize: 31,
                            height: 1,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -1.1,
                          ),
                        ),

                        const SizedBox(height: 9),

                        const Text(
                          'Sign in to continue to ReliefNexus',
                          style: TextStyle(
                            color: AppTheme.muted,
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),

                        const SizedBox(height: 25),

                        // EMAIL
                        _LoginField(
                          controller: _emailController,
                          label: 'Email Address',
                          hint: 'you@example.com',
                          icon: Icons.mail_outline_rounded,
                          keyboardType: TextInputType.emailAddress,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Email address is required';
                            }

                            if (!RegExp(
                              r'^[^@\s]+@[^@\s]+\.[^@\s]+$',
                            ).hasMatch(value.trim())) {
                              return 'Enter a valid email address';
                            }

                            return null;
                          },
                        ),

                        const SizedBox(height: 14),

                        // PASSWORD
                        _LoginPassword(
                          controller: _passwordController,
                          obscure: _obscurePassword,
                          onToggle: () {
                            setState(() {
                              _obscurePassword = !_obscurePassword;
                            });
                          },
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Password is required';
                            }
                            return null;
                          },
                        ),

                        const SizedBox(height: 15),

                        // REMEMBER / FORGOT
                        Row(
                          children: [
                            GestureDetector(
                              onTap: () {
                                setState(() {
                                  _rememberMe = !_rememberMe;
                                });
                              },
                              child: Row(
                                children: [
                                  AnimatedContainer(
                                    duration: const Duration(milliseconds: 180),
                                    width: 20,
                                    height: 20,
                                    decoration: BoxDecoration(
                                      color: _rememberMe
                                          ? AppTheme.primary
                                          : Colors.white,
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(
                                        color: _rememberMe
                                            ? AppTheme.primary
                                            : const Color(0xFFD5DFEB),
                                      ),
                                    ),
                                    child: _rememberMe
                                        ? const Icon(
                                            Icons.check_rounded,
                                            color: Colors.white,
                                            size: 14,
                                          )
                                        : null,
                                  ),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'Remember me',
                                    style: TextStyle(
                                      color: AppTheme.navy,
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Spacer(),
                            GestureDetector(
                              onTap: () {},
                              child: const Text(
                                'Forgot Password?',
                                style: TextStyle(
                                  color: AppTheme.primary,
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 24),

                        // LOGIN BUTTON
                        GestureDetector(
                          onTap: provider.loading ? null : _login,
                          child: Container(
                            height: 59,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
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
                                  blurRadius: 28,
                                  offset: const Offset(0, 13),
                                ),
                              ],
                            ),
                            child: Center(
                              child: provider.loading
                                  ? const SizedBox(
                                      width: 23,
                                      height: 23,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.4,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          'Sign In',
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

                        const SizedBox(height: 27),

                        // DIVIDER
                        Row(
                          children: [
                            Expanded(
                              child: Container(
                                height: 1,
                                color: const Color(0xFFE1E8F1),
                              ),
                            ),
                            const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 12),
                              child: Text(
                                'or continue with',
                                style: TextStyle(
                                  color: Color(0xFF9AA8BA),
                                  fontSize: 9,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            Expanded(
                              child: Container(
                                height: 1,
                                color: const Color(0xFFE1E8F1),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 18),

                        // SOCIAL BUTTONS
                        Row(
                          children: [
                            Expanded(
                              child: _SocialButton(
                                icon: 'G',
                                title: 'Google',
                                onTap: () {},
                              ),
                            ),
                            const SizedBox(width: 11),
                            Expanded(
                              child: _SocialButton(
                                icon: 'M',
                                title: 'Microsoft',
                                onTap: () {},
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 28),

                        Center(
                          child: GestureDetector(
                            onTap: () {
                              Navigator.of(context).pushReplacement(
                                MaterialPageRoute(
                                  builder: (_) => const RegisterPage(),
                                ),
                              );
                            },
                            child: const Text.rich(
                              TextSpan(
                                text: "Don't have an account? ",
                                style: TextStyle(
                                  color: AppTheme.muted,
                                  fontSize: 11.5,
                                ),
                                children: [
                                  TextSpan(
                                    text: 'Register',
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

                        const SizedBox(height: 25),

                        const Center(
                          child: Text(
                            'Predict    Prepare    Respond    Recover',
                            style: TextStyle(
                              color: Color(0xFF9AA8BA),
                              fontSize: 8,
                              fontWeight: FontWeight.w700,
                              letterSpacing: .7,
                            ),
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
    );
  }
}

// ================================================================
// LOGIN BRAND
// ================================================================

class _LoginBrand extends StatelessWidget {
  const _LoginBrand();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF1769FF), Color(0xFF19C7E8)],
            ),
            borderRadius: BorderRadius.circular(15),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primary.withValues(alpha: .23),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: const Icon(
            Icons.volunteer_activism_rounded,
            color: Colors.white,
            size: 26,
          ),
        ),
        const SizedBox(width: 12),
        const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'ReliefNexus',
              style: TextStyle(
                color: AppTheme.navy,
                fontSize: 18,
                fontWeight: FontWeight.w900,
                letterSpacing: -.5,
              ),
            ),
            SizedBox(height: 2),
            Text(
              'Intelligent Disaster Relief',
              style: TextStyle(
                color: AppTheme.muted,
                fontSize: 8.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _AuthBack extends StatelessWidget {
  final VoidCallback onTap;

  const _AuthBack({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 43,
        height: 43,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(13),
          border: Border.all(color: const Color(0xFFDCE5F0)),
        ),
        child: const Icon(
          Icons.arrow_back_rounded,
          color: AppTheme.navy,
          size: 20,
        ),
      ),
    );
  }
}

class _LoginField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData icon;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;

  const _LoginField({
    required this.controller,
    required this.label,
    required this.hint,
    required this.icon,
    this.keyboardType,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: AppTheme.navy,
            fontSize: 10,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 7),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          validator: validator,
          style: const TextStyle(
            color: AppTheme.navy,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
          decoration: _inputDecoration(hint, icon),
        ),
      ],
    );
  }
}

class _LoginPassword extends StatelessWidget {
  final TextEditingController controller;
  final bool obscure;
  final VoidCallback onToggle;
  final String? Function(String?)? validator;

  const _LoginPassword({
    required this.controller,
    required this.obscure,
    required this.onToggle,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Password',
          style: TextStyle(
            color: AppTheme.navy,
            fontSize: 10,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 7),
        TextFormField(
          controller: controller,
          obscureText: obscure,
          validator: validator,
          style: const TextStyle(
            color: AppTheme.navy,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
          decoration:
              _inputDecoration(
                'Enter your password',
                Icons.lock_outline_rounded,
              ).copyWith(
                suffixIcon: IconButton(
                  onPressed: onToggle,
                  icon: Icon(
                    obscure
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    color: const Color(0xFF78889E),
                    size: 19,
                  ),
                ),
              ),
        ),
      ],
    );
  }
}

InputDecoration _inputDecoration(String hint, IconData icon) {
  return InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(color: Color(0xFF9AA8BA), fontSize: 12),
    prefixIcon: Icon(icon, color: const Color(0xFF78889E), size: 19),
    filled: true,
    fillColor: const Color(0xFFFAFCFF),
    contentPadding: const EdgeInsets.symmetric(horizontal: 15, vertical: 16),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(15),
      borderSide: const BorderSide(color: Color(0xFFE0E7F0)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(15),
      borderSide: const BorderSide(color: Color(0xFFE0E7F0)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(15),
      borderSide: const BorderSide(color: AppTheme.primary, width: 1.4),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(15),
      borderSide: const BorderSide(color: Color(0xFFE57373)),
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(15),
      borderSide: const BorderSide(color: Color(0xFFE57373)),
    ),
    errorStyle: const TextStyle(fontSize: 9),
  );
}

class _SocialButton extends StatelessWidget {
  final String icon;
  final String title;
  final VoidCallback onTap;

  const _SocialButton({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 49,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: const Color(0xFFE0E7F0)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              icon,
              style: TextStyle(
                color: icon == 'G' ? const Color(0xFF4285F4) : AppTheme.primary,
                fontSize: 15,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                color: AppTheme.navy,
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }
}


