import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import '../../../features/auth/presentation/screens/splash_screen.dart';
import '../../../features/auth/presentation/screens/login_screen.dart';
import '../../../features/auth/presentation/screens/onboarding_screen.dart';
import '../../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../../features/invites/presentation/screens/accept_school_invite_screen.dart';
import '../../../features/invites/presentation/screens/accept_staff_invite_screen.dart';
import '../../../features/platform_admin/presentation/screens/platform_admin_screen.dart';

/// Lien e-mail Supabase expiré / invalide : souvent dans le fragment `#error=...`
/// ou interprété comme un « chemin » sans `/`, ce qui faisait planter GoRouter.
bool _supabaseEmailLinkLooksExpired(Uri uri) {
  final frag = uri.fragment;
  if (frag.contains('error_code=otp_expired') ||
      frag.contains('error=access_denied') ||
      frag.contains('Email+link+is+invalid')) {
    return true;
  }
  final path = uri.path;
  if (path.startsWith('error=') ||
      path.contains('otp_expired') ||
      path.contains('access_denied')) {
    return true;
  }
  final q = uri.queryParameters;
  if (q['error'] == 'access_denied' || q['error_code'] == 'otp_expired') {
    return true;
  }
  return false;
}

String? _authEmailLinkRedirect(BuildContext context, GoRouterState state) {
  if (state.uri.path == '/login') return null;
  try {
    if (_supabaseEmailLinkLooksExpired(Uri.base) ||
        _supabaseEmailLinkLooksExpired(state.uri)) {
      return '/login?auth_error=link_expired';
    }
    final haystack = state.uri.toString();
    if (haystack.contains('otp_expired') ||
        haystack.contains('error=access_denied')) {
      return '/login?auth_error=link_expired';
    }
  } catch (_) {}
  return null;
}

/// Point d’entrée Web : ouvre directement l’écran d’invitation si l’URL le demande
/// (évite de passer par le splash qui envoyait tout le monde sur /login).
String _initialLocation() {
  try {
    final uri = Uri.base;
    if (_supabaseEmailLinkLooksExpired(uri)) {
      return '/login?auth_error=link_expired';
    }
    final path = uri.path;
    if (path == '/invite-school' || path == '/invite-staff') {
      return uri.hasQuery ? '$path?${uri.query}' : path;
    }
  } catch (_) {}
  return '/splash';
}

final GoRouter appRouter = GoRouter(
  initialLocation: _initialLocation(),
  redirect: _authEmailLinkRedirect,
  errorBuilder: (BuildContext context, GoRouterState state) {
    final errText = state.error?.toString() ?? '';
    final loc = '${state.uri.path}?${state.uri.query}';
    if (errText.contains('otp_expired') ||
        errText.contains('access_denied') ||
        loc.contains('otp_expired') ||
        loc.contains('error=access_denied')) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) {
          GoRouter.of(context).go('/login?auth_error=link_expired');
        }
      });
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Page introuvable : ${state.uri}',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => GoRouter.of(context).go('/login'),
                child: const Text('Retour à la connexion'),
              ),
            ],
          ),
        ),
      ),
    );
  },
  routes: [
    GoRoute(
      path: '/splash',
      builder: (BuildContext context, GoRouterState state) {
        return const SplashScreen();
      },
    ),
    GoRoute(
      path: '/login',
      builder: (BuildContext context, GoRouterState state) {
        return const LoginScreen();
      },
    ),
    GoRoute(
      path: '/onboarding',
      builder: (BuildContext context, GoRouterState state) {
        return const OnboardingScreen();
      },
    ),
    GoRoute(
      path: '/invite-school',
      builder: (BuildContext context, GoRouterState state) {
        final token = state.uri.queryParameters['token'];
        return AcceptSchoolInviteScreen(token: token);
      },
    ),
    GoRoute(
      path: '/invite-staff',
      builder: (BuildContext context, GoRouterState state) {
        final token = state.uri.queryParameters['token'];
        return AcceptStaffInviteScreen(token: token);
      },
    ),
    GoRoute(
      path: '/platform-admin',
      builder: (BuildContext context, GoRouterState state) {
        return const PlatformAdminScreen();
      },
    ),
    GoRoute(
      path: '/dashboard',
      builder: (BuildContext context, GoRouterState state) {
        return const DashboardScreen();
      },
    ),
  ],
);
