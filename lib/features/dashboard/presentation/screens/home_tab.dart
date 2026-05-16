import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/responsive.dart';
import '../../data/current_staff_profile_provider.dart';
import '../../../reports/data/financial_report_provider.dart';

class HomeTab extends ConsumerWidget {
  final Function(int)? onNavigate;

  const HomeTab({super.key, this.onNavigate});

  /// Message d’accueil pour les comptes avec fiche `staff` (pas le super-admin plateforme).
  static String _welcomeTitle(CurrentStaffProfile? profile) {
    if (profile == null) {
      return 'Bienvenue sur le portail de ton établissement 👋';
    }
    final name = profile.greetingName;
    final role = profile.portailRolePhrase;
    if (name.isEmpty) {
      return 'Bienvenue sur ton portail $role 👋';
    }
    return 'Salut $name, bienvenue sur ton portail $role 👋';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reportAsync = ref.watch(financialReportProvider);
    final profileAsync = ref.watch(currentStaffProfileProvider);
    final isMobile = Responsive.isMobile(context);

    return SingleChildScrollView(
      padding: EdgeInsets.all(isMobile ? 16.0 : 32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          profileAsync.when(
            data: (profile) {
              final welcome = _welcomeTitle(profile);
              return Text(
                welcome,
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                  height: 1.25,
                ),
              );
            },
            loading: () => const Text(
              'Bienvenue 👋',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            error: (_, _) => const Text(
              'Bienvenue sur le portail de ton établissement 👋',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Vue en temps réel des performances de ton établissement.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 16),
          ),
          const SizedBox(height: 32),

          reportAsync.when(
            data: (report) {
              final globalStats = report['global'];
              final totalStudents = globalStats['total_students'] ?? 0;
              final totalExpected = globalStats['total_expected'] ?? 0;
              final totalReceived = globalStats['total_received'] ?? 0;
              final totalRemaining = globalStats['total_remaining'] ?? 0;

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 24,
                    runSpacing: 24,
                    children: [
                      _StatCard(title: "Total Élèves", value: "$totalStudents", icon: Icons.people_alt, color: Colors.blue),
                      _StatCard(title: "Prévisions (Année)", value: "$totalExpected FC", icon: Icons.trending_up, color: Colors.purple),
                      _StatCard(title: "Recettes Réalisées", value: "$totalReceived FC", icon: Icons.account_balance_wallet, color: Colors.green),
                      _StatCard(title: "Dettes / Impayés", value: "$totalRemaining FC", icon: Icons.money_off, color: Colors.red),
                    ],
                  ),

                  const SizedBox(height: 48),
                  
                  // Section d'actions rapides
                  const Text("Actions Rapides", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 16,
                    runSpacing: 16,
                    children: [
                      ActionChip(
                        avatar: const Icon(Icons.person_add, color: Colors.white),
                        label: const Text("Nouvelle Inscription", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        onPressed: () => onNavigate?.call(0), 
                      ),
                      ActionChip(
                        avatar: const Icon(Icons.payment, color: Colors.white),
                        label: const Text("Encaisser un Paiement", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        backgroundColor: AppColors.secondary,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        onPressed: () => onNavigate?.call(1), 
                      ),
                      ActionChip(
                        avatar: const Icon(Icons.warning, color: Colors.white),
                        label: const Text("Liste de Recouvrement", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        backgroundColor: Colors.orange,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        onPressed: () => onNavigate?.call(4), 
                      ),
                    ],
                  ),
                ]
              );
            },
            loading: () => const Center(child: Padding(padding: EdgeInsets.all(50), child: CircularProgressIndicator())),
            error: (err, stack) => Center(child: Text("Erreur de chargement des statistiques : $err", style: const TextStyle(color: Colors.red))),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({required this.title, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: Responsive.isMobile(context) ? double.infinity : 240,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 16, offset: const Offset(0, 4))],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: color.withOpacity(0.15), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          )
        ],
      ),
    );
  }
}
