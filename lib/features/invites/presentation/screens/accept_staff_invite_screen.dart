import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/custom_button.dart';
import '../../../../core/widgets/custom_text_field.dart';
import '../../../../core/auth/auth_error_messages.dart';
import '../../../auth/data/auth_repository.dart';
import '../../data/invitations_repository.dart';
import '../../data/pending_staff_invite_storage.dart';

class AcceptStaffInviteScreen extends ConsumerStatefulWidget {
  const AcceptStaffInviteScreen({super.key, required this.token});

  final String? token;

  @override
  ConsumerState<AcceptStaffInviteScreen> createState() => _AcceptStaffInviteScreenState();
}

class _AcceptStaffInviteScreenState extends ConsumerState<AcceptStaffInviteScreen> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _firstCtrl = TextEditingController();
  final _lastCtrl = TextEditingController();
  bool _loading = false;
  String? _peekError;
  bool _inviteOk = false;
  String? _peekSchoolName;
  String? _peekRole;
  /// `false` = inscription (lien une fois), `true` = compte Supabase déjà créé : connexion puis acceptation.
  bool _existingAccount = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _validateToken());
  }

  static String _roleLabel(String? code) {
    switch (code) {
      case 'teacher':
        return 'Enseignant';
      case 'admin':
        return 'Administratif';
      case 'director':
        return 'Directeur';
      case 'other':
        return 'Autre';
      default:
        return code ?? '';
    }
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
      if (!ok || type != 'staff_join') {
        setState(() => _peekError = 'Invitation inconnue, expirée ou déjà utilisée.');
        return;
      }
      setState(() {
        _inviteOk = true;
        _peekSchoolName = peek['school_name']?.toString();
        _peekRole = peek['role']?.toString();
      });
    } catch (e) {
      setState(() => _peekError = 'Erreur : $e');
    }
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _firstCtrl.dispose();
    _lastCtrl.dispose();
    super.dispose();
  }

  bool _fieldsOk({required bool existing}) {
    if (_emailCtrl.text.isEmpty || _passwordCtrl.text.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('E-mail et mot de passe sont obligatoires.')),
        );
      }
      return false;
    }
    if (!existing) {
      if (_firstCtrl.text.isEmpty || _lastCtrl.text.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Prénom et nom sont obligatoires pour un nouveau compte.')),
          );
        }
        return false;
      }
    }
    return true;
  }

  Future<void> _signOutOthersIfNeeded(AuthRepository auth) async {
    if (ref.read(supabaseClientProvider).auth.currentUser != null) {
      await auth.signOut();
      if (!mounted) return;
    }
  }

  Future<void> _submitNewAccount() async {
    final t = widget.token!.trim();
    if (!_fieldsOk(existing: false)) return;

    setState(() => _loading = true);
    try {
      final auth = ref.read(authRepositoryProvider);
      await _signOutOthersIfNeeded(auth);
      if (!mounted) return;

      final res = await auth.signUpWithEmail(
        email: _emailCtrl.text,
        password: _passwordCtrl.text,
      );
      if (res.session == null) {
        await PendingStaffInviteStorage.save(
          token: t,
          firstName: _firstCtrl.text.trim(),
          lastName: _lastCtrl.text.trim(),
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Un e-mail de confirmation vous a été envoyé. Après avoir cliqué sur le lien dans le mail, '
                'connectez-vous sur l’écran de connexion avec le même e-mail et mot de passe : '
                'vous serez automatiquement rattaché à l’établissement (plus besoin de rouvrir le lien d’invitation).',
              ),
              duration: Duration(seconds: 14),
            ),
          );
          context.go('/login');
        }
        return;
      }

      await ref.read(invitationsRepositoryProvider).acceptStaffInvitation(
        token: t,
        firstName: _firstCtrl.text.trim(),
        lastName: _lastCtrl.text.trim(),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Bienvenue dans l’équipe !')));
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

  Future<void> _submitExistingAccount() async {
    final t = widget.token!.trim();
    if (!_fieldsOk(existing: true)) return;

    setState(() => _loading = true);
    try {
      final auth = ref.read(authRepositoryProvider);
      await _signOutOthersIfNeeded(auth);
      if (!mounted) return;

      await auth.signIn(
        email: _emailCtrl.text,
        password: _passwordCtrl.text,
      );
      if (!mounted) return;

      try {
        await ref.read(invitationsRepositoryProvider).acceptStaffInvitation(token: t);
      } catch (e) {
        final msg = e.toString();
        if (msg.contains('already_member')) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Vous étiez déjà membre de cet établissement. Accès à l’application.')),
            );
            context.go('/dashboard');
          }
          return;
        }
        rethrow;
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Bienvenue dans l’équipe !')));
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
        title: const Text('Rejoindre mon établissement'),
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

    final school = _peekSchoolName?.trim();
    final role = _roleLabel(_peekRole);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Vous avez reçu une invitation de votre établissement. '
          '« Compte existant » : e-mail et mot de passe seulement. '
          '« Nouveau compte » : ajoutez aussi votre prénom et nom. '
          'Les prochaines fois : ouvrez l’app et connectez-vous normalement.',
          style: TextStyle(color: AppColors.textSecondary, height: 1.4),
        ),
        const SizedBox(height: 20),
        SegmentedButton<bool>(
          segments: const [
            ButtonSegment<bool>(
              value: false,
              label: Text('Nouveau compte'),
              icon: Icon(Icons.person_add_outlined, size: 18),
            ),
            ButtonSegment<bool>(
              value: true,
              label: Text('Compte existant'),
              icon: Icon(Icons.login, size: 18),
            ),
          ],
          selected: {_existingAccount},
          onSelectionChanged: (Set<bool> next) {
            setState(() => _existingAccount = next.first);
          },
        ),
        if (school != null && school.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text(
            'Établissement : $school',
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16, color: AppColors.textPrimary),
          ),
        ],
        if (role.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text('Rôle prévu : $role', style: const TextStyle(fontSize: 15, color: AppColors.textSecondary)),
        ],
        const SizedBox(height: 32),
        CustomTextField(
          controller: _emailCtrl,
          label: 'E-mail',
          hint: 'vous@exemple.cd',
          prefixIcon: Icons.email_outlined,
        ),
        const SizedBox(height: 16),
        CustomTextField(
          controller: _passwordCtrl,
          label: 'Mot de passe',
          hint: '••••••••',
          isPassword: true,
          prefixIcon: Icons.lock_outline,
        ),
        if (!_existingAccount) ...[
          const SizedBox(height: 24),
          CustomTextField(controller: _firstCtrl, label: 'Prénom', hint: 'Jean', prefixIcon: Icons.badge_outlined),
          const SizedBox(height: 16),
          CustomTextField(controller: _lastCtrl, label: 'Nom', hint: 'Kabila', prefixIcon: Icons.badge_outlined),
        ],
        const SizedBox(height: 32),
        CustomButton(
          text: _existingAccount ? 'Me connecter et rejoindre l’équipe' : 'Créer mon compte et rejoindre l’équipe',
          isLoading: _loading,
          onPressed: _existingAccount ? _submitExistingAccount : _submitNewAccount,
        ),
        const SizedBox(height: 12),
        TextButton(
          onPressed: _loading ? null : () => context.go('/login'),
          child: const Text('Annuler et aller à la connexion'),
        ),
      ],
    );
  }
}
