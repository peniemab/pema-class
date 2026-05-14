import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/responsive.dart';

/// Ancien flux « créer mon école » sans invitation : désactivé.
class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: Responsive.isMobile(context)
          ? AppBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              title: const Text('Accès établissement', style: TextStyle(color: AppColors.textPrimary)),
              centerTitle: true,
            )
          : null,
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.link, size: 64, color: AppColors.primary),
                const SizedBox(height: 24),
                const Text(
                  'Ouverture sur invitation uniquement',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Les nouveaux établissements se créent uniquement via le lien envoyé par l’administrateur de la plateforme. '
                  'Si vous avez reçu un lien, ouvrez-le directement (ou collez-le dans le navigateur).',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 15, color: AppColors.textSecondary, height: 1.4),
                ),
                const SizedBox(height: 32),
                FilledButton(
                  onPressed: () => context.go('/login'),
                  child: const Text('Retour à la connexion'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
