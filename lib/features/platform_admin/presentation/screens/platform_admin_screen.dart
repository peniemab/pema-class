import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/invite_links.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/data/auth_repository.dart';
import '../../../invites/data/invitations_repository.dart';

final _schoolInvitesListProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) {
  return ref.watch(invitationsRepositoryProvider).listRecentSchoolInvites();
});

class PlatformAdminScreen extends ConsumerStatefulWidget {
  const PlatformAdminScreen({super.key});

  @override
  ConsumerState<PlatformAdminScreen> createState() =>
      _PlatformAdminScreenState();
}

class _PlatformAdminScreenState extends ConsumerState<PlatformAdminScreen> {
  bool _busy = false;

  Future<void> _createSchoolInvite() async {
    setState(() => _busy = true);
    try {
      final token = await ref
          .read(invitationsRepositoryProvider)
          .createSchoolInvitation();
      final url = buildInviteSchoolUrl(token);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Lien d’ouverture d’établissement'),
          content: SelectableText(url, style: const TextStyle(fontSize: 13)),
          actions: [
            TextButton(
              onPressed: () async {
                await Clipboard.setData(ClipboardData(text: url));
                if (ctx.mounted) Navigator.pop(ctx);
                if (mounted) {
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(const SnackBar(content: Text('Lien copié')));
                }
              },
              child: const Text('Copier'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Fermer'),
            ),
          ],
        ),
      );
      ref.invalidate(_schoolInvitesListProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Erreur : $e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAdmin = ref.watch(isPlatformAdminProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Administration plateforme'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.logout),
          tooltip: 'Déconnexion',
          onPressed: () async {
            await ref.read(authRepositoryProvider).signOut();
            if (context.mounted) context.go('/login');
          },
        ),
      ),
      body: isAdmin.when(
        data: (ok) {
          if (!ok) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Accès réservé. Enregistrez votre user_id dans public.platform_admins (SQL Supabase), puis reconnectez-vous.',
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }
          final listAsync = ref.watch(_schoolInvitesListProvider);
          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Lien unique : le directeur crée compte + établissement + année scolaire. Durée 14 jours, une seule utilisation.',
                  style: TextStyle(color: AppColors.textSecondary, height: 1.4),
                ),
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: _busy ? null : _createSchoolInvite,
                  icon: _busy
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.add_link),
                  label: const Text('Nouveau lien d’ouverture d’école'),
                ),
                const SizedBox(height: 40),
                const Text(
                  'Dernières invitations',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                listAsync.when(
                  data: (rows) {
                    if (rows.isEmpty) {
                      return const Text(
                        'Aucune invitation.',
                        style: TextStyle(color: AppColors.textSecondary),
                      );
                    }
                    return ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: rows.length,
                      separatorBuilder: (_, _) => const Divider(),
                      itemBuilder: (_, i) {
                        final r = rows[i];
                        final used = r['used_at'] != null;
                        return ListTile(
                          title: Text(
                            used ? 'Utilisée' : 'En attente',
                            style: TextStyle(
                              color: used ? Colors.grey : AppColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          subtitle: Text(
                            'Créée : ${r['created_at'] ?? ''}\nExpire : ${r['expires_at'] ?? ''}',
                            style: const TextStyle(fontSize: 12),
                          ),
                        );
                      },
                    );
                  },
                  loading: () => const CircularProgressIndicator(),
                  error: (e, _) => Text('Erreur : $e'),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
      ),
    );
  }
}
