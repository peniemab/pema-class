import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/utils/responsive.dart';
import '../../../../core/widgets/custom_button.dart';
import '../../../../core/widgets/custom_text_field.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../invites/data/pending_school_invite_storage.dart';
import '../../../invites/data/pending_staff_invite_storage.dart';
import '../../../../core/auth/auth_session_service.dart';
import '../../../../core/outbox/outbox_providers.dart';
import '../../../../core/sync/sync_providers.dart';
import '../../../../core/auth/auth_error_messages.dart';
import '../../data/auth_repository.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _maybeShowAuthLinkMessage());
  }

  void _maybeShowAuthLinkMessage() {
    if (!mounted) return;
    final router = GoRouter.of(context);
    final err = router.state.uri.queryParameters['auth_error'];
    if (err != 'link_expired') return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Le lien de confirmation a expiré ou a déjà été utilisé. Dans Supabase : '
          'Authentication → Users → renvoyer l’e-mail de confirmation, ou confirmez le compte manuellement. '
          'Ensuite connectez-vous avec l’e-mail et le mot de passe choisis sur l’invitation.',
        ),
        duration: Duration(seconds: 14),
      ),
    );
    router.replace('/login');
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _offerResendConfirmationEmail() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty || !mounted) return;

    final send = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirmer votre e-mail'),
        content: Text(
          'Renvoyer l’e-mail de confirmation à $email ?\n\n'
          'Après avoir cliqué le lien, reconnectez-vous ici (l’invitation sera finalisée automatiquement si besoin).',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Renvoyer')),
        ],
      ),
    );

    if (send != true || !mounted) return;

    try {
      await ref.read(authRepositoryProvider).resendSignupConfirmation(email);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('E-mail de confirmation renvoyé. Vérifiez votre boîte de réception.'),
            duration: Duration(seconds: 8),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(authErrorMessage(e))),
        );
      }
    }
  }

  Future<void> _login() async {
    if (_emailCtrl.text.isEmpty || _passwordCtrl.text.isEmpty) return;

    setState(() => _isLoading = true);

    try {
      final authSession = ref.read(authSessionServiceProvider);
      if (!await authSession.canAttemptOnlineAuth()) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Connexion impossible hors ligne. Vérifiez le réseau pour vous authentifier.',
              ),
            ),
          );
        }
        return;
      }

      final authRepo = ref.read(authRepositoryProvider);

      await authRepo.signIn(
        email: _emailCtrl.text,
        password: _passwordCtrl.text,
      );
      if (!mounted) return;

      try {
        final client = ref.read(supabaseClientProvider);
        await PendingSchoolInviteStorage.tryCompleteAfterSignIn(client);
        await PendingStaffInviteStorage.tryCompleteAfterSignIn(client);
      } catch (e) {
        await PendingSchoolInviteStorage.clear();
        await PendingStaffInviteStorage.clear();
        if (!mounted) {
          await authRepo.signOut();
          return;
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Impossible de finaliser l’invitation : $e. '
              'Demandez un nouveau lien à votre administration ou à la plateforme.',
            ),
          ),
        );
        await authRepo.signOut();
        return;
      }

      if (!mounted) return;
      final status = await authRepo.checkUserStatus();
      if (!mounted) return;

      if (status == 'needs_onboarding') {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Aucune école liée à ce compte. Utilisez le lien d’invitation reçu de la plateforme pour créer l’établissement, '
              'ou le lien d’invitation de votre directeur pour rejoindre une équipe.',
            ),
            duration: Duration(seconds: 8),
          ),
        );
        await authRepo.signOut();
      } else if (status == 'platform_admin') {
        context.go('/platform-admin');
      } else if (status == 'active') {
        ref.read(sessionExpiredProvider.notifier).clear();
        await ref.read(syncEngineProvider).onAfterLogin();
        await ref.read(outboxWorkerProvider).flush();
        if (!mounted) return;
        context.go('/dashboard');
      } else if (status == 'pending') {
        showDialog<void>(
          context: context,
          barrierDismissible: false,
          builder: (dialogContext) => AlertDialog(
            title: const Text('🔒 Accès restreint'),
            content: const Text("Votre établissement est en attente d'activation administrative."),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(dialogContext);
                  authRepo.signOut();
                },
                child: const Text('Compris'),
              ),
            ],
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Accès refusé.')));
        await authRepo.signOut();
      }
    } on AuthException catch (e) {
      if (!mounted) return;
      final message = authErrorMessage(e);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), duration: const Duration(seconds: 10)),
      );
      if (isEmailNotConfirmedError(e)) {
        _offerResendConfirmationEmail();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(authErrorMessage(e)),
            duration: const Duration(seconds: 8),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Responsive(
        mobile: Center(
          child: SingleChildScrollView(
            child: _buildLoginForm(),
          ),
        ),
        desktop: Row(
          children: [
            Expanded(
              child: Container(
                color: AppColors.primary,
                child: const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.school_rounded, size: 120, color: Colors.white),
                      SizedBox(height: 24),
                      Text('School SaaS', style: TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: Colors.white)),
                      SizedBox(height: 16),
                      Text('La gestion scolaire simplifiée.', style: TextStyle(fontSize: 20, color: Colors.white70)),
                    ],
                  ),
                ),
              ),
            ),
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 40.0, horizontal: 64.0),
                    child: _buildLoginForm(),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoginForm() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (Responsive.isMobile(context)) ...[
            const Icon(Icons.school_rounded, size: 80, color: AppColors.primary),
            const SizedBox(height: 16),
            const Text('School SaaS', textAlign: TextAlign.center, style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.primary)),
            const SizedBox(height: 32),
          ],
          const Text('Bienvenue !', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 8),
          const Text(
            'Si vous avez déjà utilisé un lien d’invitation, connectez-vous avec le même e-mail et le même mot de passe.',
            style: TextStyle(fontSize: 15, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 48),
          
          CustomTextField(
            controller: _emailCtrl,
            label: 'Adresse email',
            hint: 'admin@ecole.com',
            prefixIcon: Icons.email_outlined,
          ),
          const SizedBox(height: 20),
          
          CustomTextField(
            controller: _passwordCtrl,
            label: 'Mot de passe',
            hint: '••••••••',
            isPassword: true,
            prefixIcon: Icons.lock_outline,
          ),
          const SizedBox(height: 8),
          
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () {},
              child: const Text('Mot de passe oublié ?', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 24),
          
          CustomButton(
            text: 'Se connecter',
            isLoading: _isLoading,
            onPressed: _login,
          ),
          const SizedBox(height: 32),
          
          // Le bouton d'inscription a été masqué. 
          // Les comptes sont dorénavant fournis manuellement par l'administrateur du SaaS.
        ],
      ),
    );
  }
}
