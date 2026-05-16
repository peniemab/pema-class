import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/network/connectivity_providers.dart';
import '../../../../core/outbox/outbox_providers.dart';
import '../../../../core/utils/responsive.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/data/auth_repository.dart';
import '../../../invites/data/invitations_repository.dart';

import '../../../payments/presentation/screens/payments_screen.dart';
import '../../../admissions/presentation/screens/admission_screen.dart';
import '../../../students/presentation/screens/students_list_screen.dart';
import '../../../reports/presentation/screens/unpaid_screen.dart';
import '../../../settings/presentation/screens/settings_screen.dart';
import 'home_tab.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int _selectedIndex = 2; // Default to Dashboard (Center)

  void _onLogout() async {
    await ref.read(authRepositoryProvider).signOut();
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final isDesktop = Responsive.isDesktop(context);

    final appBarTitles = [
      "Nouvelle Inscription",
      "Paiements",
      "Tableau de Bord",
      "Liste des Élèves",
      "Impayés",
      "Paramètres de l'Établissement",
    ];

    return Scaffold(
      backgroundColor: AppColors.background,

      appBar: isDesktop
          ? null
          : AppBar(
              backgroundColor: Colors.white,
              elevation: 1,
              title: Text(
                appBarTitles[_selectedIndex],
                style: const TextStyle(color: AppColors.textPrimary),
              ),
              iconTheme: const IconThemeData(color: AppColors.primary),
              actions: [
                IconButton(
                  icon: const Icon(Icons.settings),
                  onPressed: () => setState(() => _selectedIndex = 5),
                  tooltip: "Paramètres",
                  color: AppColors.textSecondary,
                ),
                IconButton(
                  icon: const Icon(Icons.logout),
                  onPressed: _onLogout,
                  tooltip: "Déconnexion",
                  color: Colors.red,
                ),
              ],
            ),

      body: Column(
        children: [
          Consumer(
            builder: (context, ref, _) {
              final net = ref.watch(connectivityResultsProvider);
              return net.maybeWhen(
                data: (results) {
                  if (connectionLayerOnline(results)) {
                    return const SizedBox.shrink();
                  }
                  return Material(
                    color: Colors.amber.shade100,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.wifi_off, color: Colors.amber.shade900),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Hors ligne : lecture locale (Drift). Les inscriptions et '
                              'paiements sont mis en file et synchronisés au retour en ligne.',
                              style: TextStyle(
                                color: Colors.amber.shade900,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
                orElse: () => const SizedBox.shrink(),
              );
            },
          ),
          Consumer(
            builder: (context, ref, _) {
              final pending = ref.watch(pendingOutboxCountProvider);
              return pending.maybeWhen(
                data: (count) {
                  if (count <= 0) return const SizedBox.shrink();
                  return Material(
                    color: Colors.blue.shade50,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.cloud_upload, color: Colors.blue.shade800),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              '$count écriture(s) en attente de synchronisation.',
                              style: TextStyle(
                                color: Colors.blue.shade900,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
                orElse: () => const SizedBox.shrink(),
              );
            },
          ),
          Expanded(
            child: Row(
              children: [
                if (isDesktop) _buildSidebar(),
                Expanded(child: _buildCurrentView()),
              ],
            ),
          ),
        ],
      ),

      bottomNavigationBar: !isDesktop
          ? BottomNavigationBar(
              type: BottomNavigationBarType.fixed,
              currentIndex: _selectedIndex > 4
                  ? 2
                  : _selectedIndex, // Fallback to Dashboard if in Settings
              onTap: (i) => setState(() => _selectedIndex = i),
              selectedItemColor: AppColors.primary,
              unselectedItemColor: Colors.grey.shade400,
              items: const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.person_add),
                  label: 'Inscription',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.payments),
                  label: 'Paiements',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.dashboard),
                  label: 'Dashboard',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.people),
                  label: 'Élèves',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.money_off),
                  label: 'Impayés',
                ),
              ],
            )
          : null,
    );
  }

  Widget _buildCurrentView() {
    switch (_selectedIndex) {
      case 0:
        return const AdmissionScreen();
      case 1:
        return const PaymentsScreen();
      case 2:
        return HomeTab(onNavigate: (i) => setState(() => _selectedIndex = i));
      case 3:
        return const StudentsListScreen();
      case 4:
        return const UnpaidScreen();
      case 5:
        return const SettingsScreen();
      default:
        return HomeTab(onNavigate: (i) => setState(() => _selectedIndex = i));
    }
  }

  Widget _buildSidebar() {
    return Container(
      width: 260,
      color: Colors.white,
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(24.0),
            child: Row(
              children: [
                Icon(Icons.school, color: AppColors.primary, size: 36),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    "SaaS Éducation",
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          // la BottomNavigationBar
          _SidebarItem(
            icon: Icons.person_add,
            title: 'Nouvelle Inscription',
            isSelected: _selectedIndex == 0,
            onTap: () => setState(() => _selectedIndex = 0),
          ),
          _SidebarItem(
            icon: Icons.payments,
            title: 'Gestion Paiements',
            isSelected: _selectedIndex == 1,
            onTap: () => setState(() => _selectedIndex = 1),
          ),
          _SidebarItem(
            icon: Icons.dashboard,
            title: 'Tableau de bord',
            isSelected: _selectedIndex == 2,
            onTap: () => setState(() => _selectedIndex = 2),
          ),
          _SidebarItem(
            icon: Icons.people,
            title: 'Annuaire Élèves',
            isSelected: _selectedIndex == 3,
            onTap: () => setState(() => _selectedIndex = 3),
          ),
          _SidebarItem(
            icon: Icons.money_off,
            title: 'Impayés & Rapports',
            isSelected: _selectedIndex == 4,
            onTap: () => setState(() => _selectedIndex = 4),
          ),
          Consumer(
            builder: (context, ref, _) {
              final plat = ref.watch(isPlatformAdminProvider);
              return plat.when(
                data: (isP) {
                  if (!isP) return const SizedBox.shrink();
                  return _SidebarItem(
                    icon: Icons.admin_panel_settings,
                    title: 'Plateforme',
                    isSelected: false,
                    onTap: () => context.push('/platform-admin'),
                  );
                },
                loading: () => const SizedBox.shrink(),
                error: (_, _) => const SizedBox.shrink(),
              );
            },
          ),

          const Spacer(),
          const Divider(height: 1),
          _SidebarItem(
            icon: Icons.settings,
            title: 'Paramètres',
            isSelected: _selectedIndex == 5,
            onTap: () => setState(() => _selectedIndex = 5),
          ),
          _SidebarItem(
            icon: Icons.logout,
            title: 'Déconnexion',
            isSelected: false,
            onTap: _onLogout,
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildDashboardOverview() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Bienvenue sur votre portail Admin 👋",
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            "Voici un résumé express de l'activité de votre établissement à ce jour.",
            style: TextStyle(color: AppColors.textSecondary, fontSize: 16),
          ),
          const SizedBox(height: 32),

          Wrap(
            spacing: 24,
            runSpacing: 24,
            children: [
              _StatCard(
                title: "Total Élèves",
                value: "1,245",
                icon: Icons.people_alt,
                color: Colors.blue,
              ),
              _StatCard(
                title: "Nouvelles Inscriptions",
                value: "84",
                icon: Icons.person_add,
                color: Colors.orange,
              ),
              _StatCard(
                title: "Recettes (Ce mois)",
                value: "12,450 \$",
                icon: Icons.account_balance_wallet,
                color: Colors.green,
              ),
              _StatCard(
                title: "Retards de paiement",
                value: "12",
                icon: Icons.money_off,
                color: Colors.red,
              ),
            ],
          ),

          const SizedBox(height: 48),
          const Text(
            "Actions Rapides",
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              ActionChip(
                avatar: const Icon(Icons.add, color: Colors.white),
                label: const Text(
                  "Nouvel Élève",
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                onPressed: () => setState(() => _selectedIndex = 0),
              ),
              ActionChip(
                avatar: const Icon(Icons.payment, color: Colors.white),
                label: const Text(
                  "Encaisser Paiement",
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                backgroundColor: AppColors.secondary,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                onPressed: () => setState(() => _selectedIndex = 1),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SidebarItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final bool isSelected;
  final VoidCallback onTap;

  const _SidebarItem({
    required this.icon,
    required this.title,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: isSelected
          ? AppColors.primary.withOpacity(0.08)
          : Colors.transparent,
      child: ListTile(
        leading: Icon(
          icon,
          color: isSelected ? AppColors.primary : AppColors.textSecondary,
        ),
        title: Text(
          title,
          style: TextStyle(
            color: isSelected ? AppColors.primary : AppColors.textSecondary,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          ),
        ),
        onTap: onTap,
        shape: isSelected
            ? const Border(
                right: BorderSide(color: AppColors.primary, width: 4),
              )
            : null,
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: Responsive.isMobile(context) ? double.infinity : 260,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 32),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
