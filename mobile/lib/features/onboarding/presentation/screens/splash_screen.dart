import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../core/widgets/premium_animations.dart';
import 'onboarding_screen.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  Timer? _timer;

  static const String _imageUrl =
      'https://images.unsplash.com/photo-1547683905-f686c993aae5'
      '?auto=format&fit=crop&w=1200&q=90';

  @override
  void initState() {
    super.initState();

    _timer = Timer(const Duration(milliseconds: 3600), () {
      if (!mounted) return;

      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          transitionDuration: const Duration(milliseconds: 750),
          pageBuilder: (_, animation, _) => const OnboardingPage(),
          transitionsBuilder: (_, animation, _, child) {
            return FadeTransition(
              opacity: CurvedAnimation(
                parent: animation,
                curve: Curves.easeOut,
              ),
              child: child,
            );
          },
        ),
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          Image.network(
            _imageUrl,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFF071A3D),
                      Color(0xFF1769FF),
                      Color(0xFF19C7E8),
                    ],
                  ),
                ),
              );
            },
          ),

          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0x33000000),
                  Color(0x55000000),
                  Color(0xE6071A3D),
                ],
              ),
            ),
          ),

          const Positioned(
            right: -70,
            top: -60,
            child: AnimatedGradientOrb(size: 240),
          ),

          SafeArea(
            child: Column(
              children: [
                const Spacer(),

                ScaleFadeIn(
                  delay: const Duration(milliseconds: 250),
                  duration: const Duration(milliseconds: 850),
                  beginScale: 0.60,
                  child: Container(
                    width: 92,
                    height: 92,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF1769FF), Color(0xFF19C7E8)],
                      ),
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(
                            0xFF1769FF,
                          ).withValues(alpha: 0.40),
                          blurRadius: 40,
                          offset: const Offset(0, 16),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.volunteer_activism_rounded,
                      color: Colors.white,
                      size: 48,
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                const FadeSlideIn(
                  delay: Duration(milliseconds: 650),
                  begin: Offset(0, 0.18),
                  child: Text(
                    'ReliefNexus',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 37,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -1.2,
                    ),
                  ),
                ),

                const SizedBox(height: 8),

                const FadeSlideIn(
                  delay: Duration(milliseconds: 800),
                  begin: Offset(0, 0.18),
                  child: Text(
                    'Intelligent Disaster Relief & Coordination',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      letterSpacing: 0.2,
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                const FadeSlideIn(
                  delay: Duration(milliseconds: 1000),
                  child: Text(
                    'Predict    Prepare    Respond    Recover',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.6,
                    ),
                  ),
                ),

                const SizedBox(height: 30),

                const FadeSlideIn(
                  delay: Duration(milliseconds: 1150),
                  child: _LoadingLine(),
                ),

                const Spacer(),

                const FadeSlideIn(
                  delay: Duration(milliseconds: 1250),
                  begin: Offset(0, 0.20),
                  child: Padding(
                    padding: EdgeInsets.only(bottom: 32),
                    child: Text(
                      'Together for safer communities',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LoadingLine extends StatefulWidget {
  const _LoadingLine();

  @override
  State<_LoadingLine> createState() => _LoadingLineState();
}

class _LoadingLineState extends State<_LoadingLine>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1900),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 150,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, animation) {
          return ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: LinearProgressIndicator(
              value: _controller.value,
              minHeight: 4,
              backgroundColor: Colors.white24,
              valueColor: const AlwaysStoppedAnimation<Color>(
                Color(0xFF19C7E8),
              ),
            ),
          );
        },
      ),
    );
  }
}


