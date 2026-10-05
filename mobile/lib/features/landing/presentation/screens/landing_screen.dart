import 'package:flutter/material.dart';

import '../../../../app/theme/app_theme.dart';
import '../../../auth/presentation/screens/login_screen.dart';

class LandingPage extends StatefulWidget {
  const LandingPage({super.key});

  @override
  State<LandingPage> createState() => _LandingPageState();
}

class _LandingPageState extends State<LandingPage>
    with TickerProviderStateMixin {
  late final AnimationController _entrance;
  late final AnimationController _float;
  late final AnimationController _pulse;
  late final AnimationController _photo;

  int _activePhoto = 0;

  final List<String> _photos = [
    'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=90',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=90',
    'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=90',
  ];

  @override
  void initState() {
    super.initState();

    _entrance = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..forward();

    _float = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3200),
    )..repeat(reverse: true);

    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat(reverse: true);

    _photo = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    );

    Future.delayed(const Duration(seconds: 4), _changePhoto);
  }

  void _changePhoto() {
    if (!mounted) return;

    setState(() {
      _activePhoto = (_activePhoto + 1) % _photos.length;
    });

    _photo.forward(from: 0);

    Future.delayed(const Duration(seconds: 4), _changePhoto);
  }

  @override
  void dispose() {
    _entrance.dispose();
    _float.dispose();
    _pulse.dispose();
    _photo.dispose();
    super.dispose();
  }

  void _openLogin() {
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 700),
        pageBuilder: (_, animation, _) => const LoginPage(),
        transitionsBuilder: (_, animation, _, child) {
          return FadeTransition(
            opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
            child: SlideTransition(
              position:
                  Tween<Offset>(
                    begin: const Offset(0, .035),
                    end: Offset.zero,
                  ).animate(
                    CurvedAnimation(
                      parent: animation,
                      curve: Curves.easeOutCubic,
                    ),
                  ),
              child: child,
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Scaffold(
      backgroundColor: const Color(0xFF071A3D),
      body: AnimatedBuilder(
        animation: Listenable.merge([_entrance, _float, _pulse, _photo]),
        builder: (context, _) {
          final floatValue = (_float.value - .5) * 12;

          final pulse = .96 + (_pulse.value * .04);

          return Stack(
            children: [
              // =========================================================
              // DEEP PREMIUM BACKGROUND
              // =========================================================
              Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFF061631),
                      Color(0xFF082650),
                      Color(0xFF063B5B),
                      Color(0xFF04152E),
                    ],
                    stops: [0, .42, .72, 1],
                  ),
                ),
              ),

              // BLUE GLOW
              Positioned(
                top: -130,
                right: -110,
                child: _GlowOrb(size: 330, color: AppTheme.cyan, opacity: .18),
              ),

              // BLUE GLOW
              Positioned(
                bottom: -150,
                left: -130,
                child: _GlowOrb(
                  size: 360,
                  color: AppTheme.primary,
                  opacity: .18,
                ),
              ),

              // CENTER LIGHT
              Positioned(
                top: size.height * .25,
                left: size.width * .18,
                child: Container(
                  width: size.width * .65,
                  height: size.width * .65,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppTheme.primary.withValues(alpha: .055),
                  ),
                ),
              ),

              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(22, 14, 22, 0),
                  child: Column(
                    children: [
                      // ===================================================
                      // HEADER
                      // ===================================================
                      _AnimatedEntry(
                        controller: _entrance,
                        begin: .0,
                        end: .35,
                        child: Row(
                          children: [
                            const _BrandLogo(),

                            const SizedBox(width: 11),

                            const Text(
                              'Relief',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 19,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -.6,
                              ),
                            ),

                            const Text(
                              'Nexus',
                              style: TextStyle(
                                color: AppTheme.cyan,
                                fontSize: 19,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -.6,
                              ),
                            ),

                            const Spacer(),

                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: .09),
                                borderRadius: BorderRadius.circular(30),
                                border: Border.all(
                                  color: Colors.white.withValues(alpha: .13),
                                ),
                              ),
                              child: const Row(
                                children: [
                                  _LiveDot(),
                                  SizedBox(width: 6),
                                  Text(
                                    'LIVE',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 9,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: .5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      const Spacer(),

                      // ===================================================
                      // PHOTO EXPERIENCE
                      // ===================================================
                      SizedBox(
                        height: size.height * .43,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            // BACK PHOTO LEFT
                            Transform.translate(
                              offset: Offset(-62, floatValue * .45),
                              child: Transform.rotate(
                                angle: -.07,
                                child: _PhotoCard(
                                  image: _photos[1],
                                  width: size.width * .42,
                                  height: size.height * .27,
                                  opacity: .58,
                                ),
                              ),
                            ),

                            // BACK PHOTO RIGHT
                            Transform.translate(
                              offset: Offset(62, -floatValue * .45),
                              child: Transform.rotate(
                                angle: .07,
                                child: _PhotoCard(
                                  image: _photos[2],
                                  width: size.width * .42,
                                  height: size.height * .27,
                                  opacity: .58,
                                ),
                              ),
                            ),

                            // MAIN PHOTO
                            Transform.translate(
                              offset: Offset(0, floatValue),
                              child: Transform.scale(
                                scale: pulse,
                                child: _MainPhoto(
                                  image: _photos[_activePhoto],
                                  width: size.width * .73,
                                  height: size.height * .36,
                                ),
                              ),
                            ),

                            // AI BADGE
                            Positioned(
                              bottom: 2,
                              child: _AnimatedEntry(
                                controller: _entrance,
                                begin: .32,
                                end: .72,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 15,
                                    vertical: 11,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xE6081A38),
                                    borderRadius: BorderRadius.circular(18),
                                    border: Border.all(
                                      color: Colors.white.withValues(
                                        alpha: .17,
                                      ),
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(
                                          alpha: .35,
                                        ),
                                        blurRadius: 28,
                                        offset: const Offset(0, 14),
                                      ),
                                    ],
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      _SmallIcon(),
                                      SizedBox(width: 9),
                                      Text(
                                        'AI Disaster Intelligence',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 14),

                      // ===================================================
                      // HERO TITLE
                      // ===================================================
                      _AnimatedEntry(
                        controller: _entrance,
                        begin: .35,
                        end: .70,
                        child: const Column(
                          children: [
                            Text(
                              'Safer Communities.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 31,
                                height: 1.02,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -1.1,
                              ),
                            ),
                            Text(
                              'Smarter Response.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: AppTheme.cyan,
                                fontSize: 31,
                                height: 1.02,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -1.1,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 13),

                      _AnimatedEntry(
                        controller: _entrance,
                        begin: .48,
                        end: .78,
                        child: const Text(
                          'Predict risks, coordinate relief, and respond faster  all through one intelligent disaster response platform.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Color(0xBFD7E7F5),
                            fontSize: 13,
                            height: 1.55,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),

                      const SizedBox(height: 17),

                      // ===================================================
                      // FEATURE CHIPS
                      // ===================================================
                      _AnimatedEntry(
                        controller: _entrance,
                        begin: .55,
                        end: .83,
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            _FeatureChip(
                              icon: Icons.insights_rounded,
                              text: 'Predict',
                            ),
                            SizedBox(width: 6),
                            _FeatureChip(
                              icon: Icons.shield_outlined,
                              text: 'Prepare',
                            ),
                            SizedBox(width: 6),
                            _FeatureChip(
                              icon: Icons.groups_rounded,
                              text: 'Respond',
                            ),
                          ],
                        ),
                      ),

                      const Spacer(),

                      // ===================================================
                      // GET STARTED
                      // ===================================================
                      _AnimatedEntry(
                        controller: _entrance,
                        begin: .65,
                        end: 1,
                        child: GestureDetector(
                          onTap: _openLogin,
                          child: Container(
                            width: double.infinity,
                            height: 59,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                                colors: [
                                  Color(0xFF1769FF),
                                  Color(0xFF2387FF),
                                  Color(0xFF19C7E8),
                                ],
                              ),
                              borderRadius: BorderRadius.circular(19),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: .14),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: AppTheme.primary.withValues(
                                    alpha: .35,
                                  ),
                                  blurRadius: 30,
                                  offset: const Offset(0, 14),
                                ),
                              ],
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Get Started',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                SizedBox(width: 11),
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

                      SizedBox(height: 12 + bottom),

                      const Text(
                        'PREDICT      PREPARE      RESPOND      RECOVER',
                        style: TextStyle(
                          color: Color(0x7798B1C8),
                          fontSize: 8,
                          fontWeight: FontWeight.w800,
                          letterSpacing: .9,
                        ),
                      ),

                      const SizedBox(height: 9),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

// ===========================================================================
// ANIMATION ENTRY
// ===========================================================================

class _AnimatedEntry extends StatelessWidget {
  final AnimationController controller;
  final double begin;
  final double end;
  final Widget child;

  const _AnimatedEntry({
    required this.controller,
    required this.begin,
    required this.end,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final animation = CurvedAnimation(
      parent: controller,
      curve: Interval(begin, end, curve: Curves.easeOutCubic),
    );

    return AnimatedBuilder(
      animation: animation,
      child: child,
      builder: (context, child) {
        final value = animation.value;

        return Opacity(
          opacity: value,
          child: Transform.translate(
            offset: Offset(0, 22 * (1 - value)),
            child: child,
          ),
        );
      },
    );
  }
}

// ===========================================================================
// MAIN PHOTO
// ===========================================================================

class _MainPhoto extends StatelessWidget {
  final String image;
  final double width;
  final double height;

  const _MainPhoto({
    required this.image,
    required this.width,
    required this.height,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(31),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withValues(alpha: .18),
            blurRadius: 45,
            offset: const Offset(0, 25),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(31),
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.network(
              image,
              fit: BoxFit.cover,
              filterQuality: FilterQuality.high,
              loadingBuilder: (context, child, progress) {
                if (progress == null) return child;

                return const _PhotoLoading();
              },
              errorBuilder: (context, error, stackTrace) {
                return const _PhotoFallback();
              },
            ),

            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color(0x05071A3D),
                    Color(0x33071A3D),
                    Color(0xB8071A3D),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ===========================================================================
// SMALL PHOTO
// ===========================================================================

class _PhotoCard extends StatelessWidget {
  final String image;
  final double width;
  final double height;
  final double opacity;

  const _PhotoCard({
    required this.image,
    required this.width,
    required this.height,
    required this.opacity,
  });

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: opacity,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(25),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: .25),
              blurRadius: 28,
              offset: const Offset(0, 18),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(25),
          child: Image.network(
            image,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return const _PhotoFallback();
            },
          ),
        ),
      ),
    );
  }
}

// ===========================================================================
// LOADING
// ===========================================================================

class _PhotoLoading extends StatefulWidget {
  const _PhotoLoading();

  @override
  State<_PhotoLoading> createState() => _PhotoLoadingState();
}

class _PhotoLoadingState extends State<_PhotoLoading>
    with SingleTickerProviderStateMixin {
  late final AnimationController controller;

  @override
  void initState() {
    super.initState();

    controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1300),
    )..repeat();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        return Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF102B52), Color(0xFF1769FF), Color(0xFF19C7E8)],
            ),
          ),
          child: Center(
            child: Transform.rotate(
              angle: controller.value * 6.283,
              child: const Icon(
                Icons.public_rounded,
                color: Colors.white,
                size: 48,
              ),
            ),
          ),
        );
      },
    );
  }
}

// ===========================================================================
// FALLBACK
// ===========================================================================

class _PhotoFallback extends StatelessWidget {
  const _PhotoFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF061A38), Color(0xFF1257B9), Color(0xFF13BBD8)],
        ),
      ),
      child: const Center(
        child: Icon(
          Icons.volunteer_activism_rounded,
          color: Colors.white,
          size: 58,
        ),
      ),
    );
  }
}

// ===========================================================================
// LOGO
// ===========================================================================

class _BrandLogo extends StatelessWidget {
  const _BrandLogo();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 45,
      height: 45,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1769FF), Color(0xFF19C7E8)],
        ),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withValues(alpha: .35),
            blurRadius: 20,
            offset: const Offset(0, 9),
          ),
        ],
      ),
      child: const Icon(
        Icons.volunteer_activism_rounded,
        color: Colors.white,
        size: 25,
      ),
    );
  }
}

// ===========================================================================
// LIVE
// ===========================================================================

class _LiveDot extends StatefulWidget {
  const _LiveDot();

  @override
  State<_LiveDot> createState() => _LiveDotState();
}

class _LiveDotState extends State<_LiveDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController controller;

  @override
  void initState() {
    super.initState();

    controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        return Container(
          width: 7 + controller.value * 2,
          height: 7 + controller.value * 2,
          decoration: const BoxDecoration(
            color: Color(0xFF20D486),
            shape: BoxShape.circle,
          ),
        );
      },
    );
  }
}

// ===========================================================================
// SMALL ICON
// ===========================================================================

class _SmallIcon extends StatelessWidget {
  const _SmallIcon();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
      ),
      child: const Icon(
        Icons.auto_awesome_rounded,
        color: AppTheme.primary,
        size: 17,
      ),
    );
  }
}

// ===========================================================================
// FEATURE CHIP
// ===========================================================================

class _FeatureChip extends StatelessWidget {
  final IconData icon;
  final String text;

  const _FeatureChip({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: .075),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.white.withValues(alpha: .13)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 12, color: AppTheme.cyan),
          const SizedBox(width: 5),
          Text(
            text,
            style: const TextStyle(
              color: Color(0xDFFFFFFF),
              fontSize: 9,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

// ===========================================================================
// GLOW ORB
// ===========================================================================

class _GlowOrb extends StatelessWidget {
  final double size;
  final Color color;
  final double opacity;

  const _GlowOrb({
    required this.size,
    required this.color,
    required this.opacity,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: opacity),
      ),
    );
  }
}


