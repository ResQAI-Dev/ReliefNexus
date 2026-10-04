import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../../app/theme/app_theme.dart';
import '../../../auth/presentation/screens/login_screen.dart';

// 
//  REAL PHOTOS (Unsplash). For production, download these into
//  assets/ and switch to Image.asset so it works offline.
// 
const _imgRescue =
    'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=85';
const _imgVolunteers =
    'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=85';
const _imgCommunity =
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=85';
const _imgDonation =
    'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=85';
const _imgAnalytics =
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=85';
const _imgCoordinate =
    'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=800&q=85';
const _imgReport =
    'https://images.unsplash.com/photo-1521292270410-a8c4d716d518?auto=format&fit=crop&w=800&q=85';
const _imgAssistant =
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=85';

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage>
    with TickerProviderStateMixin {
  late final AnimationController _entrance;
  late final AnimationController _glow;
  late final AnimationController _heroFloat;
  late final AnimationController _ambient;
  late final AnimationController _shine;

  late final Animation<double> _aTop;
  late final Animation<double> _aHero;
  late final Animation<double> _aTitle;
  late final Animation<double> _aSub;
  late final Animation<double> _aActions;

  @override
  void initState() {
    super.initState();
    _entrance = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..forward();
    _glow = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1700),
    )..repeat(reverse: true);
    _heroFloat = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 4200),
    )..repeat(reverse: true);
    _ambient = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 18),
    )..repeat();
    _shine = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2600),
    )..repeat();

    Animation<double> iv(double s, double e) => CurvedAnimation(
      parent: _entrance,
      curve: Interval(s, e, curve: Curves.easeOutCubic),
    );
    _aTop = iv(0.0, 0.35);
    _aHero = iv(0.12, 0.6);
    _aTitle = iv(0.32, 0.68);
    _aSub = iv(0.42, 0.78);
    _aActions = iv(0.52, 0.9);
  }

  @override
  void dispose() {
    _entrance.dispose();
    _glow.dispose();
    _heroFloat.dispose();
    _ambient.dispose();
    _shine.dispose();
    super.dispose();
  }

  void _openLogin() {
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 650),
        pageBuilder: (_, animation, __) => const LoginPage(),
        transitionsBuilder: (_, animation, __, child) {
          final curve = CurvedAnimation(
            parent: animation,
            curve: Curves.easeOutCubic,
          );
          return FadeTransition(
            opacity: curve,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(.06, 0),
                end: Offset.zero,
              ).animate(curve),
              child: ScaleTransition(
                scale: Tween<double>(begin: .97, end: 1).animate(curve),
                child: child,
              ),
            ),
          );
        },
      ),
    );
  }

  void _watchDemo() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => _DemoSheet(
        glow: _glow,
        onStart: () {
          Navigator.pop(context);
          _openLogin();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F9FF),
      body: Stack(
        children: [
          // Background gradient
          const Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color(0xFFEFF6FF),
                    Color(0xFFF8FBFF),
                    Color(0xFFF1F7FF),
                  ],
                ),
              ),
            ),
          ),
          // Drifting glow circles
          AnimatedBuilder(
            animation: _ambient,
            builder: (context, _) {
              final t = _ambient.value * 2 * math.pi;
              return Stack(
                children: [
                  Positioned(
                    top: -120 + 18 * math.sin(t),
                    right: -110 + 14 * math.cos(t),
                    child: _GlowCircle(
                      size: 310,
                      color: AppTheme.cyan.withValues(alpha: .14),
                    ),
                  ),
                  Positioned(
                    bottom: -150 + 20 * math.cos(t),
                    left: -120 + 16 * math.sin(t),
                    child: _GlowCircle(
                      size: 320,
                      color: AppTheme.primary.withValues(alpha: .09),
                    ),
                  ),
                ],
              );
            },
          ),
          // Floating particles
          Positioned.fill(
            child: IgnorePointer(
              child: AnimatedBuilder(
                animation: _ambient,
                builder: (context, _) =>
                    CustomPaint(painter: _ParticlePainter(_ambient.value)),
              ),
            ),
          ),
          SafeArea(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(18, 12, 18, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _Enter(
                    animation: _aTop,
                    dy: -18,
                    child: _TopBar(onSkip: _openLogin, glow: _glow),
                  ),
                  const SizedBox(height: 14),
                  _Enter(
                    animation: _aHero,
                    dy: 40,
                    child: AnimatedBuilder(
                      animation: _heroFloat,
                      builder: (context, child) => Transform.translate(
                        offset: Offset(0, -3 * _heroFloat.value),
                        child: child,
                      ),
                      child: _HeroCarousel(
                        height: size.height < 760 ? 370 : 420,
                        glow: _glow,
                        onTapArrow: _openLogin,
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  _Enter(
                    animation: _aTitle,
                    dy: 26,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'A Safer Tomorrow',
                          style: TextStyle(
                            color: AppTheme.navy,
                            fontSize: 32,
                            height: 1.02,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -1.2,
                          ),
                        ),
                        ShaderMask(
                          shaderCallback: (rect) => const LinearGradient(
                            colors: [AppTheme.primary, AppTheme.cyan],
                          ).createShader(rect),
                          child: const Text(
                            'Starts Today.',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 32,
                              height: 1.08,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -1.2,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  _Enter(
                    animation: _aSub,
                    dy: 20,
                    child: const Text(
                      'Predict risks, coordinate relief, and respond faster through one intelligent disaster response platform.',
                      style: TextStyle(
                        color: Color(0xFF6B7D95),
                        fontSize: 13,
                        height: 1.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  _Enter(
                    animation: _aActions,
                    dy: 24,
                    child: _ActionRow(
                      shine: _shine,
                      onGetStarted: _openLogin,
                      onDemo: _watchDemo,
                    ),
                  ),
                  const SizedBox(height: 18),
                  _Reveal(builder: (context, t) => _StatsCard(progress: t)),
                  const SizedBox(height: 24),
                  const _Reveal(
                    child: _SectionHeading(title: 'Our Key Features'),
                  ),
                  const SizedBox(height: 12),
                  const _FeatureGrid(),
                  const SizedBox(height: 16),
                  const _Reveal(child: _CommunityBanner()),
                  const SizedBox(height: 18),
                  const _Reveal(child: Center(child: _WordCycler())),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// 
//  ANIMATION HELPERS
// 

/// Fade + slide for the entrance timeline.
class _Enter extends StatelessWidget {
  final Animation<double> animation;
  final Widget child;
  final double dy;

  const _Enter({required this.animation, required this.child, this.dy = 24});

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: animation,
      child: AnimatedBuilder(
        animation: animation,
        child: child,
        builder: (context, child) => Transform.translate(
          offset: Offset(0, dy * (1 - animation.value)),
          child: child,
        ),
      ),
    );
  }
}

/// Plays its animation the first time it scrolls into view.
class _Reveal extends StatefulWidget {
  final Widget? child;
  final Widget Function(BuildContext, double)? builder;
  final Duration delay;
  final double dy;

  const _Reveal({
    this.child,
    this.builder,
    this.delay = Duration.zero,
    this.dy = 34,
  }) : assert(child != null || builder != null);

  @override
  State<_Reveal> createState() => _RevealState();
}

class _RevealState extends State<_Reveal> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  );
  late final Animation<double> _curve = CurvedAnimation(
    parent: _c,
    curve: Curves.easeOutCubic,
  );
  ScrollPosition? _pos;
  bool _shown = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _pos?.removeListener(_check);
    _pos = Scrollable.maybeOf(context)?.position;
    _pos?.addListener(_check);
    WidgetsBinding.instance.addPostFrameCallback((_) => _check());
  }

  void _check() {
    if (!mounted || _shown) return;
    final box = context.findRenderObject();
    if (box is! RenderBox || !box.attached) return;
    final dy = box.localToGlobal(Offset.zero).dy;
    if (dy < MediaQuery.sizeOf(context).height * .92) {
      _shown = true;
      Future.delayed(widget.delay, () {
        if (mounted) _c.forward();
      });
    }
  }

  @override
  void dispose() {
    _pos?.removeListener(_check);
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _curve,
      builder: (context, _) {
        final t = _curve.value;
        final content = widget.builder != null
            ? widget.builder!(context, t)
            : widget.child!;
        return Opacity(
          opacity: t.clamp(0.0, 1.0),
          child: Transform.translate(
            offset: Offset(0, widget.dy * (1 - t)),
            child: content,
          ),
        );
      },
    );
  }
}

/// Tap-scale feedback.
class _Pressable extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double scale;

  const _Pressable({required this.child, this.onTap, this.scale = .96});

  @override
  State<_Pressable> createState() => _PressableState();
}

class _PressableState extends State<_Pressable> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (_) => setState(() => _down = true),
      onTapUp: (_) => setState(() => _down = false),
      onTapCancel: () => setState(() => _down = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _down ? widget.scale : 1,
        duration: const Duration(milliseconds: 140),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}

/// Network photo with gradient placeholder, fade-in and error fallback.
class _Photo extends StatelessWidget {
  final String url;
  final Alignment alignment;

  const _Photo(this.url, {this.alignment = Alignment.center});

  @override
  Widget build(BuildContext context) {
    const fallback = DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppTheme.navy, AppTheme.primary],
        ),
      ),
    );
    return Stack(
      fit: StackFit.expand,
      children: [
        fallback,
        Image.network(
          url,
          fit: BoxFit.cover,
          alignment: alignment,
          gaplessPlayback: true,
          frameBuilder: (context, child, frame, sync) => AnimatedOpacity(
            opacity: frame == null ? 0 : 1,
            duration: const Duration(milliseconds: 700),
            curve: Curves.easeOut,
            child: child,
          ),
          errorBuilder: (_, __, ___) => fallback,
        ),
      ],
    );
  }
}

class _ParticlePainter extends CustomPainter {
  final double t;
  static final List<_P> _ps = () {
    final r = math.Random(11);
    return List.generate(
      22,
      (_) => _P(
        r.nextDouble(),
        r.nextDouble(),
        1.2 + r.nextDouble() * 2.4,
        r.nextDouble() * 6.28,
        .4 + r.nextDouble() * .9,
      ),
    );
  }();

  _ParticlePainter(this.t);

  @override
  void paint(Canvas canvas, Size size) {
    for (final p in _ps) {
      final a = t * 2 * math.pi * p.speed + p.phase;
      final dx = p.x * size.width + 16 * math.sin(a);
      final dy = (p.y * size.height - t * 60 * p.speed) % size.height;
      final alpha = .05 + .08 * (0.5 + 0.5 * math.sin(a * 1.6));
      canvas.drawCircle(
        Offset(dx, dy),
        p.r,
        Paint()..color = AppTheme.primary.withValues(alpha: alpha),
      );
    }
  }

  @override
  bool shouldRepaint(covariant _ParticlePainter old) => old.t != t;
}

class _P {
  final double x, y, r, phase, speed;
  const _P(this.x, this.y, this.r, this.phase, this.speed);
}

// 
//  TOP BAR
// 

class _TopBar extends StatelessWidget {
  final VoidCallback onSkip;
  final Animation<double> glow;

  const _TopBar({required this.onSkip, required this.glow});

  @override
  Widget build(BuildContext context) {
    const tiny = TextStyle(
      color: Color(0xFF8A99AE),
      fontSize: 9,
      fontWeight: FontWeight.w700,
    );
    return Row(
      children: [
        AnimatedBuilder(
          animation: glow,
          builder: (context, child) => Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppTheme.primary, AppTheme.cyan],
              ),
              borderRadius: BorderRadius.circular(15),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primary.withValues(
                    alpha: .18 + .16 * glow.value,
                  ),
                  blurRadius: 14 + 10 * glow.value,
                  offset: const Offset(0, 7),
                ),
              ],
            ),
            child: child,
          ),
          child: const Icon(
            Icons.volunteer_activism_rounded,
            color: Colors.white,
            size: 25,
          ),
        ),
        const SizedBox(width: 11),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'ReliefNexus',
                style: TextStyle(
                  color: AppTheme.navy,
                  fontSize: 19,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -.5,
                ),
              ),
              const SizedBox(height: 1),
              const Text(
                'Intelligent Disaster Relief',
                style: TextStyle(
                  color: Color(0xFF8090A7),
                  fontSize: 9.5,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  _PulseDot(animation: glow, color: const Color(0xFF19C7A8)),
                  const SizedBox(width: 5),
                  const Flexible(
                    child: Text(
                      'AI-Powered    Real-time    Safer Communities',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: tiny,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        _Pressable(
          onTap: onSkip,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 11),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: .92),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFFDCE6F2)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x0B071A3D),
                  blurRadius: 14,
                  offset: Offset(0, 5),
                ),
              ],
            ),
            child: const Text(
              'Skip',
              style: TextStyle(
                color: AppTheme.primary,
                fontSize: 12,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _PulseDot extends StatelessWidget {
  final Animation<double> animation;
  final Color color;
  final double size;

  const _PulseDot({
    required this.animation,
    required this.color,
    this.size = 6,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size * 2.6,
      height: size * 2.6,
      child: AnimatedBuilder(
        animation: animation,
        builder: (context, _) => Stack(
          alignment: Alignment.center,
          children: [
            Container(
              width: size + size * 1.6 * animation.value,
              height: size + size * 1.6 * animation.value,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: color.withValues(alpha: .35 * (1 - animation.value)),
              ),
            ),
            Container(
              width: size,
              height: size,
              decoration: BoxDecoration(shape: BoxShape.circle, color: color),
            ),
          ],
        ),
      ),
    );
  }
}

// 
//  HERO CAROUSEL  (real photos, Ken-Burns zoom, cross-fade)
// 

class _Slide {
  final String image;
  final String tag;
  final String title;
  final String subtitle;
  final IconData icon;
  const _Slide(this.image, this.tag, this.title, this.subtitle, this.icon);
}

const _slides = [
  _Slide(
    _imgRescue,
    'GLOBAL RESPONSE',
    'Real-time Risk Intelligence',
    'AI-powered insights & early warnings',
    Icons.auto_awesome_rounded,
  ),
  _Slide(
    _imgVolunteers,
    'VOLUNTEERS',
    'Coordinate Every Helping Hand',
    'Match people, skills and supplies instantly',
    Icons.groups_rounded,
  ),
  _Slide(
    _imgCommunity,
    'COMMUNITY',
    'Reach Those Who Need Help',
    'Report incidents and track relief live',
    Icons.favorite_rounded,
  ),
  _Slide(
    _imgDonation,
    'RELIEF AID',
    'Faster Aid, Smarter Routes',
    'Deliver essentials where they matter most',
    Icons.local_shipping_rounded,
  ),
];

class _HeroCarousel extends StatefulWidget {
  final double height;
  final Animation<double> glow;
  final VoidCallback onTapArrow;

  const _HeroCarousel({
    required this.height,
    required this.glow,
    required this.onTapArrow,
  });

  @override
  State<_HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<_HeroCarousel> {
  int _i = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) => _go(1));
  }

  void _go(int d) {
    if (!mounted) return;
    setState(() => _i = (_i + d + _slides.length) % _slides.length);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = _slides[_i];
    return GestureDetector(
      onHorizontalDragEnd: (d) {
        final v = d.primaryVelocity ?? 0;
        if (v < -250) {
          _go(1);
          _startTimer();
        } else if (v > 250) {
          _go(-1);
          _startTimer();
        }
      },
      child: Container(
        height: widget.height,
        width: double.infinity,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(32),
          boxShadow: [
            BoxShadow(
              color: AppTheme.navy.withValues(alpha: .20),
              blurRadius: 34,
              offset: const Offset(0, 18),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(32),
          child: Stack(
            fit: StackFit.expand,
            children: [
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 1000),
                switchInCurve: Curves.easeOut,
                layoutBuilder: (current, previous) => Stack(
                  fit: StackFit.expand,
                  children: [...previous, if (current != null) current],
                ),
                child: _KenBurns(key: ValueKey(s.image), url: s.image),
              ),
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Color(0x33071A3D),
                      Color(0x0D071A3D),
                      Color(0x33071A3D),
                      Color(0xF0071A3D),
                    ],
                    stops: [0, .3, .55, 1],
                  ),
                ),
              ),
              // Top pills
              Positioned(
                top: 16,
                left: 14,
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 500),
                  child: _GlassPill(
                    key: ValueKey(s.tag),
                    icon: Icons.public_rounded,
                    text: s.tag,
                  ),
                ),
              ),
              Positioned(
                top: 16,
                right: 14,
                child: _LivePill(glow: widget.glow),
              ),
              // Progress indicators
              Positioned(
                left: 18,
                bottom: 100,
                child: Row(
                  children: List.generate(_slides.length, (i) {
                    final active = i == _i;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 400),
                      curve: Curves.easeOutCubic,
                      margin: const EdgeInsets.only(right: 5),
                      width: active ? 26 : 7,
                      height: 5,
                      decoration: BoxDecoration(
                        color: active
                            ? AppTheme.cyan
                            : Colors.white.withValues(alpha: .5),
                        borderRadius: BorderRadius.circular(6),
                      ),
                    );
                  }),
                ),
              ),
              // Info card
              Positioned(
                left: 14,
                right: 14,
                bottom: 14,
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.navy.withValues(alpha: .84),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: .16),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 400),
                          transitionBuilder: (c, a) =>
                              ScaleTransition(scale: a, child: c),
                          child: Icon(
                            s.icon,
                            key: ValueKey(s.icon),
                            color: AppTheme.primary,
                            size: 23,
                          ),
                        ),
                      ),
                      const SizedBox(width: 11),
                      Expanded(
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 500),
                          transitionBuilder: (c, a) => FadeTransition(
                            opacity: a,
                            child: SlideTransition(
                              position: Tween<Offset>(
                                begin: const Offset(0, .25),
                                end: Offset.zero,
                              ).animate(a),
                              child: c,
                            ),
                          ),
                          layoutBuilder: (cur, prev) => Stack(
                            alignment: Alignment.centerLeft,
                            children: [...prev, if (cur != null) cur],
                          ),
                          child: Column(
                            key: ValueKey(s.title),
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                s.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                s.subtitle,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Color(0xFFB9C8DB),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      _Pressable(
                        onTap: widget.onTapArrow,
                        child: SizedBox(
                          width: 44,
                          height: 44,
                          child: AnimatedBuilder(
                            animation: widget.glow,
                            builder: (context, child) => Stack(
                              alignment: Alignment.center,
                              children: [
                                Container(
                                  width: 30 + 14 * widget.glow.value,
                                  height: 30 + 14 * widget.glow.value,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: AppTheme.cyan.withValues(
                                      alpha: .22 * (1 - widget.glow.value),
                                    ),
                                  ),
                                ),
                                child!,
                              ],
                            ),
                            child: Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: AppTheme.cyan.withValues(alpha: .2),
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: AppTheme.cyan.withValues(alpha: .6),
                                ),
                              ),
                              child: const Icon(
                                Icons.arrow_forward_rounded,
                                color: AppTheme.cyan,
                                size: 17,
                              ),
                            ),
                          ),
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
    );
  }
}

class _KenBurns extends StatelessWidget {
  final String url;
  const _KenBurns({super.key, required this.url});

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 1.0, end: 1.16),
      duration: const Duration(seconds: 7),
      curve: Curves.linear,
      builder: (context, v, child) => Transform.scale(scale: v, child: child),
      child: _Photo(url),
    );
  }
}

class _GlassPill extends StatelessWidget {
  final IconData icon;
  final String text;

  const _GlassPill({super.key, required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: .30),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withValues(alpha: .22)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 12),
          const SizedBox(width: 5),
          Text(
            text,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 8.5,
              fontWeight: FontWeight.w900,
              letterSpacing: .6,
            ),
          ),
        ],
      ),
    );
  }
}

class _LivePill extends StatelessWidget {
  final Animation<double> glow;
  const _LivePill({required this.glow});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(6, 3, 11, 3),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: .30),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withValues(alpha: .22)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _PulseDot(animation: glow, color: const Color(0xFFFF4D67), size: 6),
          const SizedBox(width: 2),
          const Text(
            'LIVE',
            style: TextStyle(
              color: Colors.white,
              fontSize: 8.5,
              fontWeight: FontWeight.w900,
              letterSpacing: .8,
            ),
          ),
        ],
      ),
    );
  }
}

// 
//  ACTION BUTTONS
// 

class _ActionRow extends StatelessWidget {
  final Animation<double> shine;
  final VoidCallback onGetStarted;
  final VoidCallback onDemo;

  const _ActionRow({
    required this.shine,
    required this.onGetStarted,
    required this.onDemo,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _Pressable(
            onTap: onGetStarted,
            child: Container(
              height: 56,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primary, Color(0xFF287BFF), AppTheme.cyan],
                ),
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withValues(alpha: .30),
                    blurRadius: 22,
                    offset: const Offset(0, 9),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // shimmer sweep
                    Positioned.fill(
                      child: AnimatedBuilder(
                        animation: shine,
                        builder: (context, _) => Align(
                          alignment: Alignment(-2 + 4 * shine.value, 0),
                          child: FractionallySizedBox(
                            widthFactor: .35,
                            heightFactor: 1,
                            child: DecoratedBox(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Colors.white.withValues(alpha: 0),
                                    Colors.white.withValues(alpha: .28),
                                    Colors.white.withValues(alpha: 0),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'Get Started',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 13.5,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(width: 8),
                        AnimatedBuilder(
                          animation: shine,
                          builder: (context, child) => Transform.translate(
                            offset: Offset(
                              3 * math.sin(shine.value * 2 * math.pi),
                              0,
                            ),
                            child: child,
                          ),
                          child: const Icon(
                            Icons.arrow_forward_rounded,
                            color: Colors.white,
                            size: 19,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 11),
        Expanded(
          child: _Pressable(
            onTap: onDemo,
            child: Container(
              height: 56,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: .9),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFD2DEED), width: 1.2),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.play_circle_fill_rounded,
                    color: AppTheme.primary,
                    size: 21,
                  ),
                  SizedBox(width: 7),
                  Text(
                    'Watch Demo',
                    style: TextStyle(
                      color: AppTheme.navy,
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// 
//  STATS (count-up numbers)
// 

class _StatsCard extends StatelessWidget {
  final double progress;
  const _StatsCard({required this.progress});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: .92),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE1EAF4)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14071A3D),
            blurRadius: 22,
            offset: Offset(0, 9),
          ),
        ],
      ),
      child: Row(
        children: [
          _Stat(
            icon: Icons.warning_amber_rounded,
            target: 12,
            label: 'Active Alerts',
            color: const Color(0xFFF04B67),
            t: progress,
            format: (v) => v.round().toString(),
          ),
          const _StatDivider(),
          _Stat(
            icon: Icons.groups_rounded,
            target: 3400,
            label: 'People Affected',
            color: AppTheme.primary,
            t: progress,
            format: (v) => v >= 1000
                ? '${(v / 1000).toStringAsFixed(1)}K'
                : v.round().toString(),
          ),
          const _StatDivider(),
          _Stat(
            icon: Icons.location_on_rounded,
            target: 8,
            label: 'Districts',
            color: const Color(0xFF12BFA5),
            t: progress,
            format: (v) => v.round().toString().padLeft(2, '0'),
          ),
          const _StatDivider(),
          _Stat(
            icon: Icons.shield_rounded,
            target: 24,
            label: 'Response Teams',
            color: const Color(0xFF7A55E8),
            t: progress,
            format: (v) => v.round().toString(),
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final IconData icon;
  final double target;
  final String label;
  final Color color;
  final double t;
  final String Function(double) format;

  const _Stat({
    required this.icon,
    required this.target,
    required this.label,
    required this.color,
    required this.t,
    required this.format,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Transform.scale(
            scale: .6 + .4 * t,
            child: Icon(icon, color: color, size: 23),
          ),
          const SizedBox(height: 5),
          Text(
            format(target * t),
            style: const TextStyle(
              color: AppTheme.navy,
              fontSize: 16,
              fontWeight: FontWeight.w900,
              fontFeatures: [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF8291A7),
              fontSize: 9,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatDivider extends StatelessWidget {
  const _StatDivider();

  @override
  Widget build(BuildContext context) =>
      Container(width: 1, height: 40, color: const Color(0xFFE4EBF4));
}

// 
//  FEATURES
// 

class _SectionHeading extends StatelessWidget {
  final String title;
  const _SectionHeading({required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 5,
          height: 24,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [AppTheme.primary, AppTheme.cyan],
            ),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              color: AppTheme.navy,
              fontSize: 22,
              fontWeight: FontWeight.w900,
              letterSpacing: -.6,
            ),
          ),
        ),
        const Text(
          'View All',
          style: TextStyle(
            color: AppTheme.primary,
            fontSize: 11,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(width: 4),
        const Icon(
          Icons.arrow_forward_rounded,
          color: AppTheme.primary,
          size: 15,
        ),
      ],
    );
  }
}

class _FeatureGrid extends StatelessWidget {
  const _FeatureGrid();

  @override
  Widget build(BuildContext context) {
    return const Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _Reveal(
                child: _FeatureCard(
                  icon: Icons.bar_chart_rounded,
                  iconColor: AppTheme.primary,
                  title: 'Predict Risks',
                  subtitle: 'AI-driven forecasts and early warnings.',
                  image: _imgAnalytics,
                ),
              ),
            ),
            SizedBox(width: 11),
            Expanded(
              child: _Reveal(
                delay: Duration(milliseconds: 140),
                child: _FeatureCard(
                  icon: Icons.groups_rounded,
                  iconColor: Color(0xFF12BFA5),
                  title: 'Coordinate Relief',
                  subtitle: 'Connect resources, volunteers and communities.',
                  image: _imgCoordinate,
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 11),
        Row(
          children: [
            Expanded(
              child: _Reveal(
                child: _FeatureCard(
                  icon: Icons.description_rounded,
                  iconColor: Color(0xFFFF8A21),
                  title: 'Report Incidents',
                  subtitle: 'Submit and track reports in real-time.',
                  image: _imgReport,
                ),
              ),
            ),
            SizedBox(width: 11),
            Expanded(
              child: _Reveal(
                delay: Duration(milliseconds: 140),
                child: _FeatureCard(
                  icon: Icons.smart_toy_rounded,
                  iconColor: Color(0xFF7A55E8),
                  title: 'Disaster Assistant',
                  subtitle: 'Get AI guidance, safety advice and updates.',
                  image: _imgAssistant,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _FeatureCard extends StatefulWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final String image;

  const _FeatureCard({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.image,
  });

  @override
  State<_FeatureCard> createState() => _FeatureCardState();
}

class _FeatureCardState extends State<_FeatureCard> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _down = true),
      onTapUp: (_) => setState(() => _down = false),
      onTapCancel: () => setState(() => _down = false),
      child: AnimatedScale(
        scale: _down ? .97 : 1,
        duration: const Duration(milliseconds: 160),
        child: Container(
          height: 208,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: widget.iconColor.withValues(alpha: .20),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: Stack(
              fit: StackFit.expand,
              children: [
                AnimatedScale(
                  scale: _down ? 1.12 : 1.02,
                  duration: const Duration(milliseconds: 500),
                  curve: Curves.easeOutCubic,
                  child: _Photo(widget.image),
                ),
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        widget.iconColor.withValues(alpha: .10),
                        const Color(0x33071A3D),
                        const Color(0xEE071A3D),
                      ],
                      stops: const [0, .35, 1],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(13),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: .20),
                          borderRadius: BorderRadius.circular(13),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: .35),
                          ),
                        ),
                        child: Icon(widget.icon, color: Colors.white, size: 22),
                      ),
                      const Spacer(),
                      Text(
                        widget.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: Text(
                              widget.subtitle,
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Color(0xFFD5E0EE),
                                fontSize: 10.5,
                                height: 1.35,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            width: 30,
                            height: 30,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: .95),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.arrow_forward_rounded,
                              color: widget.iconColor,
                              size: 16,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// 
//  COMMUNITY BANNER + WORD CYCLER
// 

class _CommunityBanner extends StatelessWidget {
  const _CommunityBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 96,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppTheme.navy.withValues(alpha: .18),
            blurRadius: 22,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(
          fit: StackFit.expand,
          children: [
            const _KenBurns(url: _imgCommunity),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppTheme.navy.withValues(alpha: .92),
                    AppTheme.navy.withValues(alpha: .55),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.primary, AppTheme.cyan],
                      ),
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: const Icon(
                      Icons.verified_user_rounded,
                      color: Colors.white,
                      size: 25,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Together for Safer Communities',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'People    Technology    Faster Response',
                          style: TextStyle(
                            color: Color(0xFFC7D5E8),
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(
                    Icons.arrow_forward_rounded,
                    color: AppTheme.cyan,
                    size: 20,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WordCycler extends StatefulWidget {
  const _WordCycler();

  @override
  State<_WordCycler> createState() => _WordCyclerState();
}

class _WordCyclerState extends State<_WordCycler> {
  static const _words = ['Predict', 'Prepare', 'Respond', 'Recover'];
  int _i = 0;
  Timer? _t;

  @override
  void initState() {
    super.initState();
    _t = Timer.periodic(const Duration(milliseconds: 1400), (_) {
      if (mounted) setState(() => _i = (_i + 1) % _words.length);
    });
  }

  @override
  void dispose() {
    _t?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(_words.length, (i) {
        final active = i == _i;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 450),
          curve: Curves.easeOutCubic,
          margin: const EdgeInsets.symmetric(horizontal: 3),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            gradient: active
                ? const LinearGradient(
                    colors: [AppTheme.primary, AppTheme.cyan],
                  )
                : null,
            color: active ? null : Colors.white.withValues(alpha: .8),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: active ? Colors.transparent : const Color(0xFFDCE6F2),
            ),
          ),
          child: Text(
            _words[i],
            style: TextStyle(
              color: active ? Colors.white : const Color(0xFF8291A7),
              fontSize: 10.5,
              fontWeight: FontWeight.w800,
              letterSpacing: .3,
            ),
          ),
        );
      }),
    );
  }
}

// 
//  DEMO SHEET
// 

class _DemoSheet extends StatelessWidget {
  final Animation<double> glow;
  final VoidCallback onStart;

  const _DemoSheet({required this.glow, required this.onStart});

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeOutCubic,
      builder: (context, t, child) => Opacity(
        opacity: t,
        child: Transform.translate(
          offset: Offset(0, 30 * (1 - t)),
          child: child,
        ),
      ),
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
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
                  color: const Color(0xFFD7E1EE),
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              const SizedBox(height: 18),
              SizedBox(
                height: 170,
                width: double.infinity,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(22),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      const _KenBurns(url: _imgRescue),
                      Container(color: AppTheme.navy.withValues(alpha: .38)),
                      Center(
                        child: AnimatedBuilder(
                          animation: glow,
                          builder: (context, child) => Stack(
                            alignment: Alignment.center,
                            children: [
                              Container(
                                width: 62 + 26 * glow.value,
                                height: 62 + 26 * glow.value,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Colors.white.withValues(
                                    alpha: .28 * (1 - glow.value),
                                  ),
                                ),
                              ),
                              child!,
                            ],
                          ),
                          child: Container(
                            width: 62,
                            height: 62,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                colors: [AppTheme.primary, AppTheme.cyan],
                              ),
                            ),
                            child: const Icon(
                              Icons.play_arrow_rounded,
                              color: Colors.white,
                              size: 36,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'ReliefNexus in action',
                style: TextStyle(
                  color: AppTheme.navy,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Discover how disaster reports, AI risk prediction, relief coordination and early warnings work together in one platform.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppTheme.muted,
                  fontSize: 13,
                  height: 1.45,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 18),
              _Pressable(
                onTap: onStart,
                child: Container(
                  width: double.infinity,
                  height: 52,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppTheme.primary, AppTheme.cyan],
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Text(
                    'Get Started',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                    ),
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

class _GlowCircle extends StatelessWidget {
  final double size;
  final Color color;

  const _GlowCircle({required this.size, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
  }
}


