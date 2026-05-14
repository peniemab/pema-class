import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/utils/responsive.dart';
import '../../../../core/widgets/custom_button.dart';
import '../../../../core/widgets/custom_text_field.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/auth_repository.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  int _currentStep = 0;
  bool _isLoading = false;

  final _schoolNameCtrl = TextEditingController();
  final _schoolAddressCtrl = TextEditingController();
  final _adminNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  @override
  void dispose() {
    _schoolNameCtrl.dispose();
    _schoolAddressCtrl.dispose();
    _adminNameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submitSignup() async {
    if (_adminNameCtrl.text.isEmpty || _emailCtrl.text.isEmpty || _passwordCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Veuillez remplir tous les champs")));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authRepo = ref.read(authRepositoryProvider);
      await authRepo.signUp(
        schoolName: _schoolNameCtrl.text.trim(),
        schoolAddress: _schoolAddressCtrl.text.trim(),
        adminName: _adminNameCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        password: _passwordCtrl.text.trim(),
      );

      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (_) => AlertDialog(
            title: const Text("🎉 Inscription réussie !", style: TextStyle(color: AppColors.primary)),
            content: const Text(
                "Votre école a bien été enregistrée. Cependant, pour des raisons de sécurité, votre compte est actuellement en cours d'examen par nos administrateurs.\n\nNous vous contacterons très prochainement !"
            ),
            actions: [
              TextButton(
                onPressed: () {
                   Navigator.pop(context);
                   authRepo.signOut(); // Déconnexion préventive
                   context.go("/login");
                },
                child: const Text("Fermer & Retour", style: TextStyle(color: AppColors.textPrimary)),
              )
            ],
          )
        );
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Erreur : $e")));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: Responsive.isMobile(context) 
        ? AppBar(
            backgroundColor: Colors.transparent, 
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
              onPressed: () => context.go("/login"),
            ),
          ) : null,
      body: Responsive(
        mobile: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 24.0),
            child: _buildFormContent(),
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
                      Icon(Icons.domain_add, size: 120, color: Colors.white),
                      SizedBox(height: 24),
                      Text("Rejoignez-nous", style: TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: Colors.white)),
                      SizedBox(height: 16),
                      Text("Digitalisez votre école en 2 minutes.", style: TextStyle(fontSize: 20, color: Colors.white70)),
                    ],
                  ),
                ),
              ),
            ),
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 64.0, vertical: 40),
                    child: _buildFormContent(),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormContent() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (!Responsive.isMobile(context))
            Align(
              alignment: Alignment.topLeft,
              child: TextButton.icon(
                onPressed: () => context.go("/login"),
                icon: const Icon(Icons.arrow_back, color: AppColors.textSecondary),
                label: const Text("Retour", style: TextStyle(color: AppColors.textSecondary)),
              ),
            ),
          const SizedBox(height: 24),
          Text(
            _currentStep == 0 ? "Créer votre Établissement" : "Profil Administrateur",
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          Text(
            _currentStep == 0 ? "Étape 1/2 : Informations sur l'école" : "Étape 2/2 : Vos identifiants de connexion",
            style: const TextStyle(fontSize: 15, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 48),

          if (_currentStep == 0) ...[
            CustomTextField(controller: _schoolNameCtrl, label: "Nom de l'établissement", hint: "Ex: Lycée d'Excellence", prefixIcon: Icons.account_balance),
            const SizedBox(height: 20),
            CustomTextField(controller: _schoolAddressCtrl, label: "Ville / Adresse", hint: "Ex: Kinshasa, Gombe", prefixIcon: Icons.location_on_outlined),
          ] else ...[
            CustomTextField(controller: _adminNameCtrl, label: "Votre nom complet", hint: "Jean Dupont", prefixIcon: Icons.person_outline),
            const SizedBox(height: 20),
            CustomTextField(controller: _emailCtrl, label: "Adresse email", hint: "admin@ecole.com", prefixIcon: Icons.email_outlined),
            const SizedBox(height: 20),
            CustomTextField(controller: _passwordCtrl, label: "Mot de passe", hint: "••••••••", isPassword: true, prefixIcon: Icons.lock_outline),
          ],
          
          const SizedBox(height: 40),
          CustomButton(
            text: _currentStep == 0 ? "Continuer" : "Créer mon compte SaaS",
            isLoading: _isLoading,
            onPressed: () {
              if (_currentStep == 0) {
                if (_schoolNameCtrl.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Le nom de l'établissement est requis !")));
                  return;
                }
                setState(() => _currentStep = 1);
              } else {
                _submitSignup();
              }
            },
          ),
          if (_currentStep == 1) ...[
            const SizedBox(height: 16),
            TextButton(
              onPressed: _isLoading ? null : () => setState(() => _currentStep = 0),
              child: const Text("Retour à l'étape précédente", style: TextStyle(color: AppColors.textSecondary)),
            ),
          ]
        ],
      ),
    );
  }
}
