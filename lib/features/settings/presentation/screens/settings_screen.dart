import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';

import '../../../../core/invite_links.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/responsive.dart';
import '../../../../core/widgets/custom_button.dart';
import '../../../../core/widgets/custom_text_field.dart';
import '../../../invites/data/invitations_repository.dart';
import '../../data/settings_repository.dart';

final classroomsProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  return ref.watch(settingsRepositoryProvider).getClassrooms();
});

final activeAcademicYearNameProvider = FutureProvider<String>((ref) {
  return ref.watch(settingsRepositoryProvider).getActiveAcademicYearName();
});

final feesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final year = await ref.watch(activeAcademicYearNameProvider.future);
  return ref.watch(settingsRepositoryProvider).getFees(year);
});

final logoUrlProvider = FutureProvider<String?>((ref) async {
  return ref.watch(settingsRepositoryProvider).getLogoUrl();
});

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _isLoadingLogo = false;

  void _pickAndUploadLogo() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      withData: true,
    );

    if (result != null && result.files.single.bytes != null) {
      setState(() => _isLoadingLogo = true);
      try {
        await ref
            .read(settingsRepositoryProvider)
            .uploadLogo(result.files.single.bytes!, result.files.single.name);
        ref.invalidate(logoUrlProvider);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Logo mis à jour avec succès')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Erreur: $e'), backgroundColor: Colors.red),
          );
        }
      } finally {
        setState(() => _isLoadingLogo = false);
      }
    }
  }

  void _addClassroomDialog() {
    final ctrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Nouvelle Salle de Classe'),
        content: CustomTextField(
          controller: ctrl,
          label: 'Nom de la classe (ex: 1ère A)',
          hint: 'Ex: 1ère A',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (ctrl.text.trim().isEmpty) return;
              await ref
                  .read(settingsRepositoryProvider)
                  .addClassroom(ctrl.text.trim());
              ref.invalidate(classroomsProvider);
              if (mounted) Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Ajouter', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _addFeeDialog() {
    final nameCtrl = TextEditingController();
    final amountCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Nouveau Frais Scolaire'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CustomTextField(
              controller: nameCtrl,
              label: 'Nom du frais (ex: Inscription)',
              hint: 'Ex: Inscription',
            ),
            const SizedBox(height: 16),
            CustomTextField(
              controller: amountCtrl,
              label: 'Montant',
              hint: 'Ex: 5000',
              keyboardType: TextInputType.number,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (nameCtrl.text.trim().isEmpty ||
                  amountCtrl.text.trim().isEmpty)
                return;
              final amount = double.tryParse(amountCtrl.text.trim());
              if (amount == null) return;

              final year = await ref.read(
                activeAcademicYearNameProvider.future,
              );
              await ref
                  .read(settingsRepositoryProvider)
                  .addFee(
                    name: nameCtrl.text.trim(),
                    amount: amount,
                    academicYear: year,
                  );
              ref.invalidate(feesProvider);
              if (mounted) Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Ajouter', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showStaffInviteDialog() {
    String role = 'teacher';
    showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) {
          return AlertDialog(
            title: const Text('Inviter un membre du personnel'),
            content: DropdownButtonFormField<String>(
              initialValue: role,
              decoration: const InputDecoration(labelText: 'Rôle'),
              items: const [
                DropdownMenuItem(value: 'teacher', child: Text('Enseignant')),
                DropdownMenuItem(value: 'admin', child: Text('Administratif')),
                DropdownMenuItem(value: 'other', child: Text('Autre')),
              ],
              onChanged: (v) {
                if (v != null) setSt(() => role = v);
              },
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Annuler'),
              ),
              FilledButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  _createStaffInviteLink(role);
                },
                child: const Text('Générer le lien'),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _createStaffInviteLink(String role) async {
    try {
      final token = await ref
          .read(invitationsRepositoryProvider)
          .createStaffInvitation(role);
      final url = buildInviteStaffUrl(token);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Lien à envoyer au collaborateur'),
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
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Erreur : $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Paramètres de l'Établissement",
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 32),

          // --- LOGO SECTION ---
          _buildSectionTitle(
            Icons.image,
            "Logo de l'École",
            "Utilisé pour l'impression des reçus et listes",
          ),
          const SizedBox(height: 16),
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: Colors.grey.shade200),
            ),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Row(
                children: [
                  Consumer(
                    builder: (context, ref, child) {
                      final logoAsync = ref.watch(logoUrlProvider);
                      return logoAsync.when(
                        data: (url) => url != null
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.network(
                                  url,
                                  width: 100,
                                  height: 100,
                                  fit: BoxFit.cover,
                                ),
                              )
                            : Container(
                                width: 100,
                                height: 100,
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade100,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(
                                  Icons.school,
                                  size: 40,
                                  color: Colors.grey,
                                ),
                              ),
                        loading: () => const SizedBox(
                          width: 100,
                          height: 100,
                          child: Center(child: CircularProgressIndicator()),
                        ),
                        error: (_, _) =>
                            const Icon(Icons.error, color: Colors.red),
                      );
                    },
                  ),
                  const SizedBox(width: 32),
                  if (_isLoadingLogo)
                    const CircularProgressIndicator()
                  else
                    ElevatedButton.icon(
                      icon: const Icon(Icons.upload_file, color: Colors.white),
                      label: const Text(
                        "Changer le Logo",
                        style: TextStyle(color: Colors.white),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.secondary,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 16,
                        ),
                      ),
                      onPressed: _pickAndUploadLogo,
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 48),

          Consumer(
            builder: (context, ref, _) {
              final admin = ref.watch(isSchoolAdminProvider);
              return admin.when(
                data: (ok) {
                  if (!ok) return const SizedBox.shrink();
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildSectionTitle(
                        Icons.link,
                        'Invitations personnel',
                        'Générez un lien pour qu’un collaborateur rejoigne votre établissement',
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: _showStaffInviteDialog,
                        icon: const Icon(Icons.person_add_alt_1),
                        label: const Text('Nouveau lien d’invitation'),
                      ),
                      const SizedBox(height: 48),
                    ],
                  );
                },
                loading: () => const SizedBox.shrink(),
                error: (_, _) => const SizedBox.shrink(),
              );
            },
          ),

          // --- CLASSROOMS SECTION ---
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildSectionTitle(
                Icons.meeting_room,
                "Salles de Classe",
                "Configurez les classes disponibles pour les inscriptions",
              ),
              ElevatedButton.icon(
                icon: const Icon(Icons.add, color: Colors.white),
                label: const Text(
                  "Ajouter",
                  style: TextStyle(color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                ),
                onPressed: _addClassroomDialog,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Consumer(
            builder: (context, ref, child) {
              final classesAsync = ref.watch(classroomsProvider);
              return classesAsync.when(
                data: (classes) {
                  if (classes.isEmpty)
                    return const Text(
                      "Aucune classe configurée.",
                      style: TextStyle(color: AppColors.textSecondary),
                    );
                  return Wrap(
                    spacing: 16,
                    runSpacing: 16,
                    children: classes
                        .map(
                          (c) => Chip(
                            label: Text(
                              c['name'],
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            onDeleted: () async {
                              await ref
                                  .read(settingsRepositoryProvider)
                                  .deleteClassroom(c['id']);
                              ref.invalidate(classroomsProvider);
                            },
                            deleteIconColor: Colors.red,
                            backgroundColor: Colors.white,
                            side: BorderSide(color: Colors.grey.shade300),
                          ),
                        )
                        .toList(),
                  );
                },
                loading: () => const CircularProgressIndicator(),
                error: (err, _) => Text('Erreur: $err'),
              );
            },
          ),
          const SizedBox(height: 48),

          // --- FEES SECTION ---
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildSectionTitle(
                Icons.money,
                "Frais Scolaires",
                "Définissez les frais à payer pour l'année en cours",
              ),
              ElevatedButton.icon(
                icon: const Icon(Icons.add, color: Colors.white),
                label: const Text(
                  "Nouveau Frais",
                  style: TextStyle(color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                ),
                onPressed: _addFeeDialog,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Text(
                "Année Scolaire : ",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(width: 16),
              Consumer(
                builder: (context, ref, _) {
                  final y = ref.watch(activeAcademicYearNameProvider);
                  return y.when(
                    data: (name) =>
                        Text(name, style: const TextStyle(fontSize: 16)),
                    loading: () => const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    error: (e, _) => Text(
                      'Erreur: $e',
                      style: const TextStyle(color: Colors.red),
                    ),
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          Consumer(
            builder: (context, ref, child) {
              final feesAsync = ref.watch(feesProvider);
              return feesAsync.when(
                data: (fees) {
                  if (fees.isEmpty)
                    return const Text(
                      "Aucun frais configuré pour cette année.",
                      style: TextStyle(color: AppColors.textSecondary),
                    );
                  return ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: fees.length,
                    itemBuilder: (context, index) {
                      final f = fees[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(color: Colors.grey.shade200),
                        ),
                        child: ListTile(
                          leading: const CircleAvatar(
                            backgroundColor: AppColors.secondary,
                            child: Icon(Icons.paid, color: Colors.white),
                          ),
                          title: Text(
                            f['name'],
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Text(
                            "Montant: ${f['amount']} FC",
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                            ),
                          ),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete, color: Colors.red),
                            onPressed: () async {
                              await ref
                                  .read(settingsRepositoryProvider)
                                  .deleteFee(f['id']);
                              ref.invalidate(feesProvider);
                            },
                          ),
                        ),
                      );
                    },
                  );
                },
                loading: () => const CircularProgressIndicator(),
                error: (err, _) => Text('Erreur: $err'),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(IconData icon, String title, String subtitle) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppColors.primary),
        ),
        const SizedBox(width: 16),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
