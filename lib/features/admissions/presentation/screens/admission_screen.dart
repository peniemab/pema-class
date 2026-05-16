import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/custom_button.dart';
import '../../../../core/widgets/custom_text_field.dart';
import '../../../../core/utils/responsive.dart';
import '../../data/admission_classrooms_provider.dart';
import '../../data/admission_repository.dart';
import '../../../../core/outbox/outbox_providers.dart';
import '../../../../core/sync/sync_providers.dart';
import '../../../settings/presentation/screens/settings_screen.dart'
    show activeAcademicYearNameProvider, logoUrlProvider;
import '../widgets/admission_receipt_generator.dart';

class AdmissionScreen extends ConsumerStatefulWidget {
  const AdmissionScreen({super.key});

  @override
  ConsumerState<AdmissionScreen> createState() => _AdmissionScreenState();
}

class _AdmissionScreenState extends ConsumerState<AdmissionScreen> {
  int _currentStep = 0;
  final int _totalSteps = 3;
  bool _isLoading = false;

  // Controllers - Step 1
  final _nomCtrl = TextEditingController();
  final _prenomCtrl = TextEditingController();
  final _lieuNaissCtrl = TextEditingController();
  final _dateNaissCtrl = TextEditingController();
  String _selectedSexe = 'Masculin';

  // Controllers - Step 2
  String? _selectedClasseId;
  final _ecoleProvCtrl = TextEditingController();

  // Controllers - Step 3
  final _tuteurNomCtrl = TextEditingController();
  String _selectedLien = 'Père';
  String _countryCode = '+243';
  final _tuteurPhoneCtrl = TextEditingController();

  // Nouvelle adresse scindée
  final _avenueCtrl = TextEditingController();
  final _quartierCtrl = TextEditingController();
  String _selectedCommune = 'Gombe';

  DateTime? _selectedDateNaiss;

  // Nouvelle Urgence scindée
  final _urgenceNomCtrl = TextEditingController();
  String _countryCodeUrgence = '+243';
  final _urgencePhoneCtrl = TextEditingController();
  final _urgenceMaladieCtrl = TextEditingController();

  static const List<String> _liens = [
    'Père',
    'Mère',
    'Tuteur Légal',
    'Oncle / Tante',
    'Grand-Parent',
    'Autre',
  ];

  static const List<String> _communesKinshasa = [
    'Bandalungwa',
    'Barumbu',
    'Bumbu',
    'Gombe',
    'Kalamu',
    'Kasa-Vubu',
    'Kimbanseke',
    'Kinshasa',
    'Kintambo',
    'Kisenso',
    'Lemba',
    'Limete',
    'Lingwala',
    'Makala',
    'Maluku',
    'Masina',
    'Matete',
    'Mont-Ngafula',
    'Ndjili',
    'Ngaba',
    'Ngaliema',
    'Ngiri-Ngiri',
    'Nsele',
    'Selembao',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(syncEngineProvider).pullStudentsDirectory();
    });
  }

  @override
  void dispose() {
    _nomCtrl.dispose();
    _prenomCtrl.dispose();
    _lieuNaissCtrl.dispose();
    _dateNaissCtrl.dispose();
    _ecoleProvCtrl.dispose();
    _tuteurNomCtrl.dispose();
    _tuteurPhoneCtrl.dispose();
    _avenueCtrl.dispose();
    _quartierCtrl.dispose();
    _urgenceNomCtrl.dispose();
    _urgencePhoneCtrl.dispose();
    _urgenceMaladieCtrl.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().subtract(const Duration(days: 365 * 6)),
      firstDate: DateTime(1990),
      lastDate: DateTime.now(),
      helpText: 'SÉLECTIONNEZ LA DATE DE NAISSANCE',
      cancelText: 'Annuler',
      confirmText: 'Valider',
    );
    if (picked != null) {
      final List<String> mois = [
        'Janvier',
        'Février',
        'Mars',
        'Avril',
        'Mai',
        'Juin',
        'Juillet',
        'Août',
        'Septembre',
        'Octobre',
        'Novembre',
        'Décembre',
      ];
      setState(() {
        _selectedDateNaiss = picked;
        _dateNaissCtrl.text =
            "${picked.day} ${mois[picked.month - 1]} ${picked.year}";
      });
    }
  }

  void _nextStep() {
    if (_currentStep < _totalSteps - 1) {
      setState(() => _currentStep++);
    } else {
      _submitForm();
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    }
  }

  Future<void> _submitForm() async {
    if (_nomCtrl.text.isEmpty ||
        _prenomCtrl.text.isEmpty ||
        _selectedDateNaiss == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Le nom, prénom et la date de naissance sont requis.',
            ),
          ),
        );
      }
      return;
    }

    if (_selectedClasseId == null || _selectedClasseId!.trim().isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Sélectionnez une salle de classe (étape 2). '
              'Hors ligne : les classes viennent du cache — connectez-vous une fois en ligne si la liste est vide.',
            ),
          ),
        );
      }
      return;
    }

    setState(() => _isLoading = true);

    try {
      final repo = ref.read(admissionRepositoryProvider);

      final adresseComplete =
          "${_avenueCtrl.text.trim()}, Q. ${_quartierCtrl.text.trim()}, C. $_selectedCommune";

      final urgenceComplete =
          "${_urgenceNomCtrl.text.trim()} - $_countryCodeUrgence ${_urgencePhoneCtrl.text.trim()}";

      final classes = ref.read(admissionClassroomsProvider).value ?? [];
      final selectedClass = classes.where((c) => c['id'] == _selectedClasseId);
      final className =
          selectedClass.isEmpty ? '' : selectedClass.first['name'] as String;

      final result = await repo.registerStudent(
        nom: _nomCtrl.text.trim().toUpperCase(),
        prenom: _prenomCtrl.text.trim().toUpperCase(),
        sexe: _selectedSexe,
        lieuNaissance: _lieuNaissCtrl.text.trim(),
        dateNaissance: _selectedDateNaiss!.toIso8601String().split('T').first,
        classeAssignee: className,
        classId: _selectedClasseId,
        ecoleProvenance: _ecoleProvCtrl.text.trim(),
        tuteurNom: _tuteurNomCtrl.text.trim(),
        lienParente: _selectedLien,
        tuteurPhone: '$_countryCode ${_tuteurPhoneCtrl.text.trim()}',
        tuteurAdresse: adresseComplete,
        urgenceContact: urgenceComplete,
        urgenceMaladie: _urgenceMaladieCtrl.text.trim(),
      );

      final matricule = result['matricule'];
      final classe = result['classe_assignee'];
      final queued = result['queued'] == true;

      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (_) => AlertDialog(
            title: Text(
              queued ? 'Inscription enregistrée localement' : 'Inscription Réussie !',
              textAlign: TextAlign.center,
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.check_circle, color: Colors.green, size: 64),
                const SizedBox(height: 16),
                Text(
                  'Élève : ${_prenomCtrl.text} ${_nomCtrl.text}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Matricule : $matricule',
                  style: const TextStyle(
                    fontSize: 18,
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Classe : $classe',
                  style: const TextStyle(
                    fontSize: 16,
                    color: AppColors.secondary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  queued
                      ? 'Synchronisation avec le serveur dès que la connexion est disponible.'
                      : 'Reçu PDF prêt à imprimer.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.grey),
                ),
              ],
            ),
            actions: [
              if (queued)
                TextButton.icon(
                  onPressed: () async {
                    Navigator.pop(context);
                    final result =
                        await ref.read(outboxWorkerProvider).flush();
                    if (!context.mounted) return;
                    final msg = result.processed > 0
                        ? 'Synchronisation réussie (${result.processed} inscription).'
                        : result.lastError != null
                            ? 'Échec : ${result.lastError}'
                            : 'Rien à synchroniser pour le moment.';
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(msg), duration: const Duration(seconds: 8)),
                    );
                  },
                  icon: const Icon(Icons.sync),
                  label: const Text('Synchroniser maintenant'),
                ),
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                  setState(() {
                    _currentStep = 0;
                    _nomCtrl.clear();
                    _prenomCtrl.clear();
                    _lieuNaissCtrl.clear();
                    _dateNaissCtrl.clear();
                    _ecoleProvCtrl.clear();
                    _tuteurNomCtrl.clear();
                    _tuteurPhoneCtrl.clear();
                    _avenueCtrl.clear();
                    _quartierCtrl.clear();
                    _urgenceNomCtrl.clear();
                    _urgencePhoneCtrl.clear();
                    _urgenceMaladieCtrl.clear();
                  });
                },
                child: const Text('Nouvelle Inscription'),
              ),
              ElevatedButton.icon(
                icon: const Icon(Icons.print),
                label: const Text("Générer le Reçu PDF"),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
                onPressed: () async {
                  final logoUrl = await ref.read(logoUrlProvider.future);
                  final academicYear = await ref.read(
                    activeAcademicYearNameProvider.future,
                  );
                  final studentData = {
                    'matricule': matricule,
                    'classe_assignee': classe,
                    'nom': _nomCtrl.text.trim().toUpperCase(),
                    'prenom': _prenomCtrl.text.trim().toUpperCase(),
                    'sexe': _selectedSexe,
                    'date_naissance': _dateNaissCtrl.text.trim(),
                    'lieu_naissance': _lieuNaissCtrl.text.trim(),
                  };
                  await AdmissionReceiptGenerator.generateReceipt(
                    student: studentData,
                    academicYear: academicYear,
                    logoUrl: logoUrl,
                  );
                },
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Erreur : $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(Responsive.isMobile(context) ? 16.0 : 32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Nouvelle Inscription",
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            "Veuillez remplir les informations de l'élève.",
            style: TextStyle(color: AppColors.textSecondary, fontSize: 16),
          ),
          const SizedBox(height: 32),

          Container(
            padding: EdgeInsets.all(Responsive.isMobile(context) ? 20.0 : 32.0),
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildProgressIndicator(),
                const SizedBox(height: 40),
                _buildCurrentStepContent(),
                const SizedBox(height: 48),
                const Divider(),
                const SizedBox(height: 16),
                _buildActionButtons(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Row(
      children: List.generate(_totalSteps, (index) {
        final isActive = index <= _currentStep;
        return Expanded(
          child: Container(
            margin: const EdgeInsets.only(right: 8.0),
            height: 8,
            decoration: BoxDecoration(
              color: isActive ? AppColors.primary : Colors.grey.shade200,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildCurrentStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildStep1Identite();
      case 1:
        return _buildStep2Scolarite();
      case 2:
        return _buildStep3Tuteur();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildStep1Identite() {
    final isMobile = Responsive.isMobile(context);

    final dateWidget = GestureDetector(
      onTap: () => _selectDate(context),
      child: AbsorbPointer(
        child: CustomTextField(
          controller: _dateNaissCtrl,
          label: "Date de naissance",
          hint: "Cliquez pour choisir (JJ/MM/AAAA)",
          prefixIcon: Icons.calendar_today,
        ),
      ),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "1. Identité de l'Élève",
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 24),

        if (isMobile) ...[
          CustomTextField(
            controller: _nomCtrl,
            label: "Nom de famille ",
            hint: "Ex: KABUYA",
            prefixIcon: Icons.person,
          ),
          const SizedBox(height: 16),
          CustomTextField(
            controller: _prenomCtrl,
            label: "Post-nom & Prénoms",
            hint: "Ex: Jean-Luc",
            prefixIcon: Icons.person_outline,
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _selectedSexe,
            decoration: InputDecoration(
              labelText: "Sexe / Genre",
              prefixIcon: const Icon(Icons.wc, color: AppColors.textSecondary),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            items: [
              'Masculin',
              'Féminin',
            ].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
            onChanged: (val) => setState(() => _selectedSexe = val!),
          ),
          const SizedBox(height: 16),
          dateWidget,
          const SizedBox(height: 16),
          CustomTextField(
            controller: _lieuNaissCtrl,
            label: "Lieu de naissance",
            hint: "Ex: Kinshasa",
            prefixIcon: Icons.location_city,
          ),
        ] else ...[
          Row(
            children: [
              Expanded(
                child: CustomTextField(
                  controller: _nomCtrl,
                  label: "Nom de famille ",
                  hint: "Ex: KABUYA",
                  prefixIcon: Icons.person,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: CustomTextField(
                  controller: _prenomCtrl,
                  label: "Post-nom & Prénoms ",
                  hint: "Ex: Jean-Luc",
                  prefixIcon: Icons.person_outline,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _selectedSexe,
                  decoration: InputDecoration(
                    labelText: "Sexe / Genre",
                    prefixIcon: const Icon(
                      Icons.wc,
                      color: AppColors.textSecondary,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  items: ['Masculin', 'Féminin']
                      .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                      .toList(),
                  onChanged: (val) => setState(() => _selectedSexe = val!),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(child: dateWidget),
              const SizedBox(width: 16),
              Expanded(
                child: CustomTextField(
                  controller: _lieuNaissCtrl,
                  label: "Lieu de naissance",
                  hint: "Ex: Kinshasa",
                  prefixIcon: Icons.location_city,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildStep2Scolarite() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "2. Cursus scolaire & Affectation",
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 24),
        Consumer(
          builder: (context, ref, child) {
            final classesAsync = ref.watch(admissionClassroomsProvider);
            return classesAsync.when(
              data: (classes) {
                if (classes.isEmpty) {
                  return const Text(
                    'Aucune classe en cache. Connectez-vous en ligne une fois '
                    '(ou ouvrez l’onglet Élèves) pour charger les salles, puis réessayez hors ligne.',
                    style: TextStyle(color: Colors.red),
                  );
                }
                if (_selectedClasseId == null && classes.isNotEmpty) {
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    setState(() => _selectedClasseId = classes.first['id']);
                  });
                }
                return DropdownButtonFormField<String>(
                  isExpanded: true,
                  initialValue: _selectedClasseId,
                  decoration: InputDecoration(
                    labelText: "Classe d'affectation",
                    prefixIcon: const Icon(
                      Icons.meeting_room,
                      color: AppColors.textSecondary,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  items: classes
                      .map(
                        (c) => DropdownMenuItem<String>(
                          value: c['id'] as String,
                          child: Text(c['name'] as String),
                        ),
                      )
                      .toList(),
                  onChanged: (val) => setState(() => _selectedClasseId = val),
                );
              },
              loading: () => const Padding(
                padding: EdgeInsets.all(8),
                child: LinearProgressIndicator(),
              ),
              error: (err, _) => Text(
                'Classes indisponibles : $err',
                style: const TextStyle(color: Colors.red),
              ),
            );
          },
        ),
        const SizedBox(height: 16),
        CustomTextField(
          controller: _ecoleProvCtrl,
          label: "École de provenance (Si nouvel arrivant)",
          hint: "Ex: C.S. Les Loupiots",
          prefixIcon: Icons.account_balance,
        ),
      ],
    );
  }

  Widget _buildStep3Tuteur() {
    final isMobile = Responsive.isMobile(context);

    final communeDropdown = DropdownButtonFormField<String>(
      menuMaxHeight: 400,
      initialValue: _selectedCommune,
      decoration: InputDecoration(
        labelText: "Commune (Ville de Kinshasa)",
        prefixIcon: const Icon(
          Icons.location_city,
          color: AppColors.textSecondary,
        ),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
      items: _communesKinshasa
          .map((s) => DropdownMenuItem(value: s, child: Text(s)))
          .toList(),
      onChanged: (val) => setState(() => _selectedCommune = val!),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "3. Tuteur Légal & Contact",
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 24),

        if (isMobile) ...[
          CustomTextField(
            controller: _tuteurNomCtrl,
            label: "Nom complet du responsable ",
            hint: "Ex: M. KABUYA Paul",
            prefixIcon: Icons.family_restroom,
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _selectedLien,
            decoration: InputDecoration(
              labelText: "Lien de parenté",
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            items: _liens
                .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                .toList(),
            onChanged: (val) => setState(() => _selectedLien = val!),
          ),
        ] else ...[
          Row(
            children: [
              Expanded(
                flex: 2,
                child: CustomTextField(
                  controller: _tuteurNomCtrl,
                  label: "Nom complet du responsable ",
                  hint: "Ex: M. KABUYA Paul",
                  prefixIcon: Icons.family_restroom,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                flex: 1,
                child: DropdownButtonFormField<String>(
                  initialValue: _selectedLien,
                  decoration: InputDecoration(
                    labelText: "Lien de parenté",
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  items: _liens
                      .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                      .toList(),
                  onChanged: (val) => setState(() => _selectedLien = val!),
                ),
              ),
            ],
          ),
        ],
        const SizedBox(height: 16),

        Row(
          children: [
            SizedBox(
              width: 110,
              child: DropdownButtonFormField<String>(
                initialValue: _countryCode,
                decoration: InputDecoration(
                  labelText: "Indicatif",
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                items: ['+243', '+242', '+33', '+32', '+1']
                    .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                    .toList(),
                onChanged: (val) => setState(() => _countryCode = val!),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: CustomTextField(
                controller: _tuteurPhoneCtrl,
                label: "Numéro de téléphone principal ",
                hint: "81 234 56 78",
                prefixIcon: Icons.phone,
              ),
            ),
          ],
        ),

        const SizedBox(height: 32),
        const Text(
          "Adresse de Résidence",
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.secondary,
          ),
        ),
        const SizedBox(height: 16),

        if (isMobile) ...[
          CustomTextField(
            controller: _avenueCtrl,
            label: "Avenue & Num.",
            hint: "Ex: Av. Kasa-Vubu N°45",
            prefixIcon: Icons.home,
          ),
          const SizedBox(height: 16),
          CustomTextField(
            controller: _quartierCtrl,
            label: "Quartier",
            hint: "Ex: Matonge",
            prefixIcon: Icons.map,
          ),
          const SizedBox(height: 16),
          communeDropdown,
        ] else ...[
          Row(
            children: [
              Expanded(
                flex: 2,
                child: CustomTextField(
                  controller: _avenueCtrl,
                  label: "Avenue & Numéro",
                  hint: "Ex: Av. Kasa-Vubu N°45",
                  prefixIcon: Icons.home,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                flex: 1,
                child: CustomTextField(
                  controller: _quartierCtrl,
                  label: "Quartier",
                  hint: "Ex: Matonge",
                  prefixIcon: Icons.map,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(flex: 1, child: communeDropdown),
            ],
          ),
        ],

        const SizedBox(height: 32),
        const Divider(),
        const SizedBox(height: 16),
        const Text(
          "Informations Médicales & Urgence",
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.secondary,
          ),
        ),
        const SizedBox(height: 16),

        if (isMobile) ...[
          CustomTextField(
            controller: _urgenceNomCtrl,
            label: "Nom du contact d'urgence",
            hint: "Ex: Oncle Jean (Voisin)",
            prefixIcon: Icons.person_search,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              SizedBox(
                width: 100,
                child: DropdownButtonFormField<String>(
                  initialValue: _countryCodeUrgence,
                  decoration: InputDecoration(
                    labelText: "Indicatif",
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  items: ['+243', '+242', '+33', '+32']
                      .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                      .toList(),
                  onChanged: (val) =>
                      setState(() => _countryCodeUrgence = val!),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: CustomTextField(
                  controller: _urgencePhoneCtrl,
                  label: "Tél. d'Urgence",
                  hint: "89 123 45 67",
                  prefixIcon: Icons.phone_callback,
                ),
              ),
            ],
          ),
        ] else ...[
          Row(
            children: [
              Expanded(
                flex: 6,
                child: CustomTextField(
                  controller: _urgenceNomCtrl,
                  label: "Nom du contact d'Urgence",
                  hint: "Ex: Oncle Jean (Voisin)",
                  prefixIcon: Icons.person_search,
                ),
              ),
              const SizedBox(width: 16),
              SizedBox(
                width: 100,
                child: DropdownButtonFormField<String>(
                  initialValue: _countryCodeUrgence,
                  decoration: InputDecoration(
                    labelText: "Indicatif",
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  items: ['+243', '+242', '+33', '+32']
                      .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                      .toList(),
                  onChanged: (val) =>
                      setState(() => _countryCodeUrgence = val!),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                flex: 5,
                child: CustomTextField(
                  controller: _urgencePhoneCtrl,
                  label: "Téléphone d'Urgence",
                  hint: "89 123 45 67",
                  prefixIcon: Icons.phone_callback,
                ),
              ),
            ],
          ),
        ],
        const SizedBox(height: 16),
        CustomTextField(
          controller: _urgenceMaladieCtrl,
          label: "Allergies ou problèmes de santé",
          hint: "Ex: Asthme, Allergique à l'arachide...",
          prefixIcon: Icons.medical_services_outlined,
        ),
      ],
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        if (_currentStep > 0)
          Expanded(
            flex: 1,
            child: TextButton.icon(
              onPressed: _prevStep,
              icon: const Icon(
                Icons.arrow_back,
                color: AppColors.textSecondary,
              ),
              label: const Text(
                "Précédent",
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          )
        else
          const Expanded(flex: 1, child: SizedBox.shrink()),

        const SizedBox(width: 16),

        Expanded(
          flex: 2,
          child: CustomButton(
            text: _currentStep == _totalSteps - 1
                ? "Valider & Générer MAT-"
                : "Étape Suivante",
            isLoading: _isLoading,
            onPressed: _nextStep,
          ),
        ),
      ],
    );
  }
}
