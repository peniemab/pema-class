import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/custom_button.dart';
import '../../../../core/widgets/custom_text_field.dart';
import '../../../../core/auth/auth_error_messages.dart';
import '../../../auth/data/auth_repository.dart';
import '../../data/invitations_repository.dart';
import '../../data/pending_school_invite_storage.dart';

class AcceptSchoolInviteScreen extends ConsumerStatefulWidget {
  const AcceptSchoolInviteScreen({super.key, required this.token});

  final String? token;

  @override
  ConsumerState<AcceptSchoolInviteScreen> createState() => _AcceptSchoolInviteScreenState();
}

class _AcceptSchoolInviteScreenState extends ConsumerState<AcceptSchoolInviteScreen> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _schoolNameCtrl = TextEditingController();
  final _schoolAddressCtrl = TextEditingController();
  final _adminNameCtrl = TextEditingController();
  bool _loading = false;
  String? _peekError;
  bool _inviteOk = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _validateToken());
  }

  Future<void> _validateToken() async {
    final t = widget.token?.trim();
    if (t == null || t.isEmpty) {
      setState(() => _peekError = 'Lien invalide : token manquant.');
      return;
    }
    try {
      final repo = ref.read(invitationsRepositoryProvider);
      final peek = await repo.peekInvitation(t);
      final ok = peek['ok'] == true;
      final type = peek['invite_type']?.toString();
      if (!ok || type != 'school_setup') {
        setState(() => _peekError = 'Invitation inconnue, expirée ou déjà utilisée.');
        return;
      }
      setState(() => _inviteOk = true);
    } catch (e) {
      setState(() => _peekError = 'Erreur : $e');
    }
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _schoolNameCtrl.dispose();
    _schoolAddressCtrl.dispose();
    _adminNameCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final t = widget.token!.trim();
    if (_emailCtrl.text.isEmpty || _passwordCtrl.text.isEmpty || _schoolNameCtrl.text.isEmpty || _adminNameCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Remplissez les champs obligatoires.')));
      return;
    }

    setState(() => _loading = true);
    try {
      final auth = ref.read(authRepositoryProvider);
      if (ref.read(supabaseClientProvider).auth.currentUser != null) {
        await auth.signOut();
        if (!mounted) return;
      }
      final res = await auth.signUpWithEmail(
        email: _emailCtrl.text,
        password: _passwordCtrl.text,
      );
      if (res.session == null) {
        await PendingSchoolInviteStorage.save(
          token: t,
          schoolName: _schoolNameCtrl.text.trim(),
          schoolAddress: _schoolAddressCtrl.text.trim(),
          adminName: _adminNameCtrl.text.trim(),
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Un e-mail de confirmation vous a été envoyé. Ouvrez le lien dans le mail, puis reconnectez-vous ici avec le même e-mail et mot de passe : '
                'votre établissement sera créé automatiquement à la première connexion.',
              ),
              duration: Duration(seconds: 12),
            ),
          );
          context.go('/login');
        }
        return;
      }

      await ref.read(invitationsRepositoryProvider).acceptSchoolInvitation(
        token: t,
        schoolName: _schoolNameCtrl.text.trim(),
        schoolAddress: _schoolAddressCtrl.text.trim(),
        adminName: _adminNameCtrl.text.trim(),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Établissement créé. Bienvenue !')));
        context.go('/dashboard');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(authErrorMessage(e)), duration: const Duration(seconds: 10)),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Créer mon établissement'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 1,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: _buildBody(),
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_peekError != null) {
      return Column(
        children: [
          const Icon(Icons.error_outline, size: 56, color: Colors.red),
          const SizedBox(height: 16),
          Text(_peekError!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 16)),
          const SizedBox(height: 24),
          OutlinedButton(onPressed: () => context.go('/login'), child: const Text('Retour connexion')),
        ],
      );
    }
    if (!_inviteOk) {
      return const Center(child: CircularProgressIndicator());
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Vous avez reçu une invitation plateforme. Créez votre compte administrateur et les informations de l’établissement.',
          style: TextStyle(color: AppColors.textSecondary, height: 1.4),
        ),
        const SizedBox(height: 32),
        CustomTextField(controller: _emailCtrl, label: 'E-mail', hint: 'directeur@ecole.cd', prefixIcon: Icons.email_outlined),
        const SizedBox(height: 16),
        CustomTextField(controller: _passwordCtrl, label: 'Mot de passe', hint: '••••••••', isPassword: true, prefixIcon: Icons.lock_outline),
        const SizedBox(height: 24),
        CustomTextField(controller: _schoolNameCtrl, label: "Nom de l'établissement", hint: 'Ex : Institut …', prefixIcon: Icons.account_balance),
        const SizedBox(height: 16),
        CustomTextField(controller: _schoolAddressCtrl, label: 'Adresse / ville', hint: 'Ex : Kinshasa', prefixIcon: Icons.location_on_outlined),
        const SizedBox(height: 16),
        CustomTextField(controller: _adminNameCtrl, label: 'Votre nom complet', hint: 'Ex : Marie Kabila', prefixIcon: Icons.person_outline),
        const SizedBox(height: 32),
        CustomButton(text: 'Valider et créer mon école', isLoading: _loading, onPressed: _submit),
        const SizedBox(height: 16),
        TextButton(onPressed: () => context.go('/login'), child: const Text('Déjà un compte ? Se connecter')),
      ],
    );
  }
}
