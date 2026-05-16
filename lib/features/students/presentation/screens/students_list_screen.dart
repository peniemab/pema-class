import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/responsive.dart';
import '../../../../core/widgets/custom_text_field.dart';

import '../../../../core/sync/sync_providers.dart';
import '../../../settings/presentation/screens/settings_screen.dart'
    show activeAcademicYearNameProvider;
import '../../data/local_student_cleanup.dart';
import '../../data/student_directory_mapper.dart';
import '../../data/student_search_helper.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class StudentsListScreen extends ConsumerStatefulWidget {
  const StudentsListScreen({super.key});

  @override
  ConsumerState<StudentsListScreen> createState() => _StudentsListScreenState();
}

class _StudentsListScreenState extends ConsumerState<StudentsListScreen> {
  final _searchCtrl = TextEditingController();
  String _searchQuery = "";
  String _selectedClassOption = "Toutes les Salles";
  bool _isPulling = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(syncEngineProvider).pullStudentsDirectory();
    });
  }

  Future<void> _confirmDeleteDraft(Map<String, dynamic> student) async {
    final id = student['id']?.toString();
    if (id == null || id.isEmpty) return;

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer ce brouillon ?'),
        content: Text(
          'Élève ${student['prenom']} ${student['nom']} (${student['matricule']}) '
          'sera retiré de cet appareil. À utiliser seulement si la synchronisation '
          'est bloquée (les brouillons envoyés avec succès disparaissent seuls).',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );

    if (ok != true || !mounted) return;

    try {
      await ref.read(localStudentCleanupProvider).removeDraftEnrollment(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Brouillon supprimé de cet appareil.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Impossible de supprimer : $e')),
        );
      }
    }
  }

  Future<void> _refreshDirectory() async {
    if (_isPulling) return;
    setState(() => _isPulling = true);
    try {
      final result =
          await ref.read(syncEngineProvider).pullStudentsDirectory(force: true);
      if (!mounted) return;
      if (result != null) {
        ref.invalidate(directoryLastSyncedAtProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Annuaire synchronisé (${result.studentCount} élèves).',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Synchronisation impossible : $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isPulling = false);
    }
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _printAttendanceList(List<Map<String, dynamic>> students) async {
    String academicYear;
    try {
      academicYear = await ref.read(activeAcademicYearNameProvider.future);
    } catch (_) {
      final scope = await ref.read(directoryScopeProvider.future);
      academicYear = scope?.academicYearName ?? '—';
    }
    // Sort students alphabetically by name
    final sortedStudents = List<Map<String, dynamic>>.from(students)
      ..sort(
        (a, b) => (a['nom'].toString() + a['prenom'].toString()).compareTo(
          b['nom'].toString() + b['prenom'].toString(),
        ),
      );

    final pdf = pw.Document();
    String title = "Liste de Présence - $_selectedClassOption";

    final now = DateTime.now();
    final printStamp =
        "Imprimé le ${now.day.toString().padLeft(2, '0')}/${now.month.toString().padLeft(2, '0')}/${now.year} à ${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}";

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        build: (context) => [
          pw.Header(
            level: 0,
            child: pw.Text(
              title,
              style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold),
            ),
          ),
          pw.SizedBox(height: 10),
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text("Année Scolaire : $academicYear"),
                  pw.Text("Effectif : ${sortedStudents.length} élèves"),
                ],
              ),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Text(
                    "Semaine du : ______/______ au ______/______",
                    style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                  ),
                  pw.SizedBox(height: 5),
                  pw.Text(
                    "Enseignant(e) : __________________________",
                    style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                  ),
                ],
              ),
            ],
          ),
          pw.SizedBox(height: 20),

          pw.Table(
            border: pw.TableBorder.all(color: PdfColors.grey400, width: 0.5),
            columnWidths: {
              0: const pw.FixedColumnWidth(25), // N°
              1: const pw.FlexColumnWidth(3), // Noms
              2: const pw.FixedColumnWidth(30), // Sexe
              3: const pw.FixedColumnWidth(45), // L
              4: const pw.FixedColumnWidth(45), // M
              5: const pw.FixedColumnWidth(45), // M
              6: const pw.FixedColumnWidth(45), // J
              7: const pw.FixedColumnWidth(45), // V
            },
            children: [
              // HEADER ROW
              pw.TableRow(
                decoration: const pw.BoxDecoration(
                  color: PdfColors.blueGrey800,
                ),
                children: [
                  pw.Padding(
                    padding: const pw.EdgeInsets.all(4),
                    child: pw.Text(
                      "N°",
                      style: pw.TextStyle(
                        color: PdfColors.white,
                        fontWeight: pw.FontWeight.bold,
                        fontSize: 9,
                      ),
                      textAlign: pw.TextAlign.center,
                    ),
                  ),
                  pw.Padding(
                    padding: const pw.EdgeInsets.all(4),
                    child: pw.Text(
                      "Noms de l'Élève",
                      style: pw.TextStyle(
                        color: PdfColors.white,
                        fontWeight: pw.FontWeight.bold,
                        fontSize: 9,
                      ),
                      textAlign: pw.TextAlign.center,
                    ),
                  ),
                  pw.Padding(
                    padding: const pw.EdgeInsets.all(4),
                    child: pw.Text(
                      "Sexe",
                      style: pw.TextStyle(
                        color: PdfColors.white,
                        fontWeight: pw.FontWeight.bold,
                        fontSize: 9,
                      ),
                      textAlign: pw.TextAlign.center,
                    ),
                  ),
                  ...["Lun", "Mar", "Mer", "Jeu", "Ven"].map(
                    (day) => pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.stretch,
                      children: [
                        pw.Container(
                          padding: const pw.EdgeInsets.symmetric(vertical: 2),
                          decoration: const pw.BoxDecoration(
                            border: pw.Border(
                              bottom: pw.BorderSide(
                                color: PdfColors.white,
                                width: 0.5,
                              ),
                            ),
                          ),
                          child: pw.Text(
                            day,
                            style: pw.TextStyle(
                              color: PdfColors.white,
                              fontWeight: pw.FontWeight.bold,
                              fontSize: 8,
                            ),
                            textAlign: pw.TextAlign.center,
                          ),
                        ),
                        pw.Expanded(
                          child: pw.Row(
                            crossAxisAlignment: pw.CrossAxisAlignment.stretch,
                            children: [
                              pw.Expanded(
                                child: pw.Container(
                                  decoration: const pw.BoxDecoration(
                                    border: pw.Border(
                                      right: pw.BorderSide(
                                        color: PdfColors.white,
                                        width: 0.5,
                                      ),
                                    ),
                                  ),
                                  child: pw.Center(
                                    child: pw.Text(
                                      "M",
                                      style: pw.TextStyle(
                                        color: PdfColors.white,
                                        fontWeight: pw.FontWeight.bold,
                                        fontSize: 7,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              pw.Expanded(
                                child: pw.Container(
                                  child: pw.Center(
                                    child: pw.Text(
                                      "S",
                                      style: pw.TextStyle(
                                        color: PdfColors.white,
                                        fontWeight: pw.FontWeight.bold,
                                        fontSize: 7,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              // DATA ROWS
              ...List.generate(sortedStudents.length, (index) {
                final s = sortedStudents[index];

                // Fonction pour générer une cellule divisée (évite le bug de layout zero-height)
                pw.Widget buildSplitCell() {
                  return pw.Container(
                    height: 25,
                    child: pw.Row(
                      crossAxisAlignment: pw.CrossAxisAlignment.stretch,
                      children: [
                        pw.Expanded(
                          child: pw.Container(
                            decoration: const pw.BoxDecoration(
                              border: pw.Border(
                                right: pw.BorderSide(
                                  color: PdfColors.grey400,
                                  width: 0.5,
                                ),
                              ),
                            ),
                            child: pw.SizedBox(height: 25),
                          ),
                        ),
                        pw.Expanded(
                          child: pw.Container(child: pw.SizedBox(height: 25)),
                        ),
                      ],
                    ),
                  );
                }

                return pw.TableRow(
                  decoration: index % 2 == 1
                      ? const pw.BoxDecoration(color: PdfColors.grey100)
                      : null,
                  children: [
                    // N°
                    pw.Padding(
                      padding: const pw.EdgeInsets.all(4),
                      child: pw.Text(
                        (index + 1).toString(),
                        style: const pw.TextStyle(fontSize: 9),
                      ),
                    ),
                    // Noms
                    pw.Padding(
                      padding: const pw.EdgeInsets.all(4),
                      child: pw.Text(
                        "${s['nom']} ${s['prenom']}",
                        style: const pw.TextStyle(fontSize: 9),
                      ),
                    ),
                    // Sexe
                    pw.Padding(
                      padding: const pw.EdgeInsets.all(4),
                      child: pw.Text(
                        s['sexe']?.toString().substring(0, 1) ?? '',
                        style: const pw.TextStyle(fontSize: 9),
                        textAlign: pw.TextAlign.center,
                      ),
                    ),
                    // 5 Jours divisés en deux
                    buildSplitCell(),
                    buildSplitCell(),
                    buildSplitCell(),
                    buildSplitCell(),
                    buildSplitCell(),
                  ],
                );
              }),
            ],
          ),

          pw.SizedBox(height: 15),
          pw.Text(
            "Visa & Signatures Quotidiennes de l'Enseignant(e) :",
            style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10),
          ),
          pw.SizedBox(height: 10),
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Text(
                "Lundi: _________",
                style: const pw.TextStyle(fontSize: 10),
              ),
              pw.Text(
                "Mardi: _________",
                style: const pw.TextStyle(fontSize: 10),
              ),
              pw.Text(
                "Mercredi: _________",
                style: const pw.TextStyle(fontSize: 10),
              ),
              pw.Text(
                "Jeudi: _________",
                style: const pw.TextStyle(fontSize: 10),
              ),
              pw.Text(
                "Vendredi: _________",
                style: const pw.TextStyle(fontSize: 10),
              ),
            ],
          ),
        ],
        footer: (context) => pw.Container(
          alignment: pw.Alignment.centerRight,
          margin: const pw.EdgeInsets.only(top: 10),
          child: pw.Text(
            printStamp,
            style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey500),
          ),
        ),
      ),
    );

    await Printing.layoutPdf(
      onLayout: (_) => pdf.save(),
      name: 'Presences_$_selectedClassOption.pdf',
    );
  }

  Future<void> _showStudentDetails(
    BuildContext context,
    Map<String, dynamic> student,
  ) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final supabase = Supabase.instance.client;
      final guardianList = await supabase
          .from('student_emergency_contacts')
          .select()
          .eq('student_id', student['id'])
          .order('created_at');
      final guardian = guardianList.isNotEmpty ? guardianList.first : null;

      if (mounted) {
        Navigator.pop(context); // fermer le loading
        _buildProfileDialog(context, student, guardian);
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("Erreur: $e")));
      }
    }
  }

  void _buildProfileDialog(
    BuildContext context,
    Map<String, dynamic> student,
    Map<String, dynamic>? guardian,
  ) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          "Profil Élève : ${student['matricule'] ?? '—'}",
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
        content: SingleChildScrollView(
          child: SizedBox(
            width: 500,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  "1. Identité de l'Élève",
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const Divider(),
                _InfoRow("Noms", "${student['prenom']} ${student['nom']}"),
                _InfoRow("Sexe", student['sexe'] ?? 'N/A'),
                _InfoRow("Date Naissance", student['date_naissance'] ?? 'N/A'),
                _InfoRow("Lieu Naissance", student['lieu_naissance'] ?? 'N/A'),
                _InfoRow(
                  "Classe Assignée",
                  student['classe_assignee'] ?? 'N/A',
                ),
                _InfoRow(
                  "École de Provenance",
                  student['ecole_provenance'] ?? 'N/A',
                ),
                const SizedBox(height: 24),

                const Text(
                  "2. Responsable / Tuteur Légal",
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const Divider(),
                if (guardian != null) ...[
                  _InfoRow(
                    "Noms du Tuteur",
                    guardian['full_name']?.toString() ?? 'N/A',
                  ),
                  _InfoRow(
                    "Lien de Parenté",
                    guardian['relationship']?.toString() ?? 'N/A',
                  ),
                  _InfoRow("Téléphone", guardian['phone']?.toString() ?? 'N/A'),
                  if (guardian['note'] != null &&
                      guardian['note'].toString().isNotEmpty)
                    _InfoRow("Informations", guardian['note'].toString()),
                ] else ...[
                  const Text(
                    "Aucune information de tuteur trouvée pour cet élève.",
                    style: TextStyle(
                      fontStyle: FontStyle.italic,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Fermer"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final studentsAsync = ref.watch(studentsDirectoryStreamProvider);
    final classesAsync = ref.watch(localClassesStreamProvider);
    final lastSyncAsync = ref.watch(directoryLastSyncedAtProvider);

    return SingleChildScrollView(
      padding: EdgeInsets.all(Responsive.isMobile(context) ? 16.0 : 32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Annuaire des Élèves",
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      "Données locales (Drift) — synchronisées au retour en ligne.",
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                tooltip: 'Synchroniser l’annuaire',
                onPressed: _isPulling ? null : _refreshDirectory,
                icon: _isPulling
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.sync),
              ),
            ],
          ),
          lastSyncAsync.maybeWhen(
            data: (at) {
              if (at == null) return const SizedBox.shrink();
              final label =
                  '${at.day.toString().padLeft(2, '0')}/'
                  '${at.month.toString().padLeft(2, '0')}/'
                  '${at.year} '
                  '${at.hour.toString().padLeft(2, '0')}:'
                  '${at.minute.toString().padLeft(2, '0')}';
              return Padding(
                padding: const EdgeInsets.only(top: 4, bottom: 8),
                child: Text(
                  'Dernière synchro : $label',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                  ),
                ),
              );
            },
            orElse: () => const SizedBox.shrink(),
          ),
          const SizedBox(height: 24),

          studentsAsync.when(
            data: (localStudents) {
              List<Map<String, dynamic>> students =
                  localStudents.map((s) => s.toUiMap()).toList();

              // Filtering by Classroom
              if (_selectedClassOption != "Toutes les Salles") {
                students = students
                    .where((s) => s['classe_assignee'] == _selectedClassOption)
                    .toList();
              }

              // Filtering by Search
              if (_searchQuery.isNotEmpty) {
                final sq = _searchQuery.toLowerCase();
                students = students.where((s) {
                  return s['nom'].toLowerCase().contains(sq) ||
                      s['prenom'].toLowerCase().contains(sq) ||
                      (s['matricule']?.toString().toLowerCase().contains(sq) ??
                          false);
                }).toList();
              }

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              flex: 2,
                              child: CustomTextField(
                                controller: _searchCtrl,
                                label: "Recherche Suggestive (Nom, Matricule)",
                                hint: "Tapez pour filtrer les élèves...",
                                prefixIcon: Icons.search,
                                onChanged: (val) =>
                                    setState(() => _searchQuery = val),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              flex: 1,
                              child: classesAsync.maybeWhen(
                                data: (classRows) {
                                  final options = <String>[
                                    "Toutes les Salles",
                                    ...classRows.map((c) => c.name),
                                  ];
                                  if (!options.contains(_selectedClassOption)) {
                                    _selectedClassOption = "Toutes les Salles";
                                  }
                                  return DropdownButtonFormField<String>(
                                    isExpanded: true,
                                    initialValue: _selectedClassOption,
                                    decoration: InputDecoration(
                                      labelText: "Salle de Classe",
                                      prefixIcon: const Icon(
                                        Icons.meeting_room,
                                        color: AppColors.textSecondary,
                                      ),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                    items: options
                                        .map(
                                          (o) => DropdownMenuItem<String>(
                                            value: o,
                                            child: Text(o),
                                          ),
                                        )
                                        .toList(),
                                    onChanged: (val) {
                                      if (val == null) return;
                                      setState(() => _selectedClassOption = val);
                                    },
                                  );
                                },
                                orElse: () =>
                                    const Text("Chargement classes..."),
                              ),
                            ),
                            const SizedBox(width: 16),
                            ElevatedButton.icon(
                              icon: const Icon(
                                Icons.print,
                                color: Colors.white,
                              ),
                              label: const Text(
                                "Imprimer Présences",
                                style: TextStyle(color: Colors.white),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 24,
                                  vertical: 20,
                                ),
                              ),
                              onPressed: () => _printAttendanceList(students),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: DataTable(
                        headingRowColor: WidgetStateProperty.all(
                          AppColors.primary.withOpacity(0.05),
                        ),
                        columns: const [
                          DataColumn(
                            label: Text(
                              "Matricule",
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                          DataColumn(
                            label: Text(
                              "Noms",
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                          DataColumn(
                            label: Text(
                              "Sexe",
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                          DataColumn(
                            label: Text(
                              "Classe",
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                          DataColumn(
                            label: Text(
                              "Date & Lieu Naiss.",
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                          DataColumn(
                            label: Text(
                              "Actions",
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                        rows: students.map((s) {
                          return DataRow(
                            cells: [
                              DataCell(
                                Text(
                                  s['matricule']?.toString() ?? '—',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                              DataCell(
                                Text(
                                  "${s['prenom']} ${s['nom']}",
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              DataCell(Text(s['sexe'] ?? '')),
                              DataCell(Text(s['classe_assignee'] ?? '')),
                              DataCell(
                                Text(
                                  "${s['date_naissance'] ?? ''} à ${s['lieu_naissance'] ?? ''}",
                                ),
                              ),
                              DataCell(
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    IconButton(
                                      icon: const Icon(
                                        Icons.visibility,
                                        color: Colors.blue,
                                      ),
                                      tooltip: 'Voir le profil',
                                      onPressed: () =>
                                          _showStudentDetails(context, s),
                                    ),
                                    if (isLocalDraftStudent(s))
                                      FutureBuilder<bool>(
                                        future: ref
                                            .read(
                                              localStudentCleanupProvider,
                                            )
                                            .shouldOfferManualDelete(
                                              s['id'] as String,
                                            ),
                                        builder: (context, snap) {
                                          if (snap.data != true) {
                                            return const SizedBox.shrink();
                                          }
                                          return IconButton(
                                            icon: const Icon(
                                              Icons.delete_outline,
                                              color: Colors.red,
                                            ),
                                            tooltip:
                                                'Supprimer (sync bloquée uniquement)',
                                            onPressed: () =>
                                                _confirmDeleteDraft(s),
                                          );
                                        },
                                      ),
                                  ],
                                ),
                              ),
                            ],
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ],
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, _) => Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    "Erreur: $err",
                    style: const TextStyle(color: Colors.red),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: _refreshDirectory,
                    icon: const Icon(Icons.sync),
                    label: const Text('Réessayer la synchronisation'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}
