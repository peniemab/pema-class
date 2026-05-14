import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/theme/app_colors.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _bootstrap());
  }

  void _bootstrap() {
    if (!mounted) return;
    // Si l’utilisateur a ouvert /invite-* mais le routeur est encore sur le splash (hot reload, etc.)
    try {
      final uri = Uri.base;
      final path = uri.path;
      if (path == '/invite-school' || path == '/invite-staff') {
        final loc = uri.hasQuery ? '$path?${uri.query}' : path;
        context.go(loc);
        return;
      }
    } catch (_) {}

    Future.delayed(const Duration(milliseconds: 2000), () {
      if (mounted) context.go('/login');
    });
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.primary,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Using a premium Flutter built-in icon as our Logo for now
            Icon(
              Icons.school_rounded,
              color: Colors.white,
              size: 100,
            ),
            SizedBox(height: 24),
            Text(
              'School SaaS',
              style: TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.bold,
                letterSpacing: 2,
              ),
            ),
            SizedBox(height: 24),
            CircularProgressIndicator(
              color: Colors.white,
              strokeWidth: 3,
            ),
          ],
        ),
      ),
    );
  }
}
