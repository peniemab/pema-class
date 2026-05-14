import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/responsive.dart';
import '../../../../core/widgets/custom_button.dart';
import '../../../../core/widgets/custom_text_field.dart';

import '../../../settings/presentation/screens/settings_screen.dart';
import '../../data/report_repository.dart';

final financialReportProvider = FutureProvider<Map<String, dynamic>>((
  ref,
) async {
  final year = await ref.watch(activeAcademicYearNameProvider.future);
  return ref.watch(reportRepositoryProvider).getFinancialReport(year);
});

class UnpaidScreen extends ConsumerStatefulWidget {
  const UnpaidScreen({super.key});

  @override
  ConsumerState<UnpaidScreen> createState() => _UnpaidScreenState();
}

class _UnpaidScreenState extends ConsumerState<UnpaidScreen> {
  final _searchCtrl = TextEditingController();
  String _searchQuery = "";
  String _selectedClassOption = "Toutes les Salles";

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _printList(
    List<Map<String, dynamic>> students,
    Map<String, dynamic> globalStats,
  ) async {
    final pdf = pw.Document();
    final academicYear = await ref.read(activeAcademicYearNameProvider.future);

    // Simplification : Juste le PDF sans fetch le vrai logo pour aller plus vite,
    // mais pour faire propre, on peut récupérer le logo avec ref.read(logoUrlProvider.future)
    String title = "Rapport Financier - $_selectedClassOption";

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        build: (context) => [
          pw.Header(
            level: 0,
            child: pw.Text(
              "Liste des Impayés",
              style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold),
            ),
          ),
          pw.SizedBox(height: 10),
          pw.Text("Année Scolaire : $academicYear"),
          pw.Text("Classe : $_selectedClassOption"),
          pw.SizedBox(height: 20),

          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Text("Total Élèves : ${students.length}"),
              if (_selectedClassOption == "Toutes les Salles")
                pw.Text("Global Attendu : ${globalStats['total_expected']} FC"),
            ],
          ),
          pw.SizedBox(height: 20),

          pw.TableHelper.fromTextArray(
            headers: [
              "N°",
              "Matricule",
              "Noms",
              "Classe",
              "À Payer",
              "Perçu",
              "Reste",
            ],
            data: List.generate(students.length, (index) {
              final s = students[index];
              return [
                (index + 1).toString(),
                s['matricule'],
                "${s['prenom']} ${s['nom']}",
                s['classe_assignee'],
                s['total_expected'].toString(),
                s['total_paid'].toString(),
                s['remaining'].toString(),
              ];
            }),
            headerStyle: pw.TextStyle(
              fontWeight: pw.FontWeight.bold,
              color: PdfColors.white,
            ),
            headerDecoration: const pw.BoxDecoration(
              color: PdfColors.blueGrey800,
            ),
            cellAlignment: pw.Alignment.centerLeft,
            oddRowDecoration: const pw.BoxDecoration(color: PdfColors.grey100),
          ),
        ],
      ),
    );

    await Printing.layoutPdf(
      onLayout: (_) => pdf.save(),
      name: 'Impayes_${DateTime.now().toIso8601String()}.pdf',
    );
  }

  @override
  Widget build(BuildContext context) {
    final reportAsync = ref.watch(financialReportProvider);
    final classesAsync = ref.watch(classroomsProvider);

    return SingleChildScrollView(
      padding: EdgeInsets.all(Responsive.isMobile(context) ? 16.0 : 32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Suivi des Impayés & Rapports",
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            "Vue globale sur les recouvrements, filtrage par salle et impression.",
            style: TextStyle(color: AppColors.textSecondary, fontSize: 16),
          ),
          const SizedBox(height: 32),

          reportAsync.when(
            data: (report) {
              final globalStats = report['global'];
              List<Map<String, dynamic>> students =
                  List<Map<String, dynamic>>.from(report['students']);

              // Filtering by Classroom
              if (_selectedClassOption != "Toutes les Salles") {
                students = students
                    .where((s) => s['classe_assignee'] == _selectedClassOption)
                    .toList();
              }

              // Filtering by Search Query (Google style Suggestive across names/matricules)
              if (_searchQuery.isNotEmpty) {
                final sq = _searchQuery.toLowerCase();
                students = students.where((s) {
                  return s['nom'].toLowerCase().contains(sq) ||
                      s['prenom'].toLowerCase().contains(sq) ||
                      s['matricule'].toLowerCase().contains(sq);
                }).toList();
              }

              // Compute stats for current filtered view
              double viewExpected = 0;
              double viewReceived = 0;
              for (var s in students) {
                viewExpected += s['total_expected'];
                viewReceived += s['total_paid'];
              }

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // --- QUICK STATS SUMMARY ---
                  Wrap(
                    spacing: 24,
                    runSpacing: 24,
                    children: [
                      _StatCard(
                        title: "Élèves (Vue actuelle)",
                        value: "${students.length}",
                        icon: Icons.groups,
                        color: Colors.blue,
                      ),
                      _StatCard(
                        title: "Montant Attendu",
                        value: "$viewExpected",
                        icon: Icons.track_changes,
                        color: Colors.purple,
                      ),
                      _StatCard(
                        title: "Montant Perçu",
                        value: "$viewReceived",
                        icon: Icons.account_balance_wallet,
                        color: Colors.green,
                      ),
                      _StatCard(
                        title: "Reste à Recouvrer",
                        value: "${viewExpected - viewReceived}",
                        icon: Icons.money_off,
                        color: Colors.red,
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // --- FILTERS & SEARCH ---
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
                                hint:
                                    "Tapez pour filtrer les élèves affichés ci-dessous...",
                                prefixIcon: Icons.search,
                                onChanged: (val) =>
                                    setState(() => _searchQuery = val),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              flex: 1,
                              child: classesAsync.maybeWhen(
                                data: (classes) {
                                  final options = [
                                    "Toutes les Salles",
                                    ...classes.map((c) => c['name'].toString()),
                                  ];
                                  if (!options.contains(_selectedClassOption))
                                    _selectedClassOption = "Toutes les Salles";
                                  return DropdownButtonFormField<String>(
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
                                          (o) => DropdownMenuItem(
                                            value: o,
                                            child: Text(o),
                                          ),
                                        )
                                        .toList(),
                                    onChanged: (val) => setState(
                                      () => _selectedClassOption = val!,
                                    ),
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
                                "Imprimer Liste",
                                style: TextStyle(color: Colors.white),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 24,
                                  vertical: 20,
                                ),
                              ),
                              onPressed: () =>
                                  _printList(students, globalStats),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  // --- DATA TABLE ---
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
                              "Classe",
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                          DataColumn(
                            label: Text(
                              "Attendu",
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                          DataColumn(
                            label: Text(
                              "Perçu",
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                          DataColumn(
                            label: Text(
                              "Reste",
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                          DataColumn(
                            label: Text(
                              "Statut",
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                        rows: students.map((s) {
                          final isSolde = s['is_solde'];
                          return DataRow(
                            cells: [
                              DataCell(
                                Text(
                                  s['matricule'],
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              DataCell(Text("${s['prenom']} ${s['nom']}")),
                              DataCell(Text(s['classe_assignee'] ?? '')),
                              DataCell(Text("${s['total_expected']}")),
                              DataCell(
                                Text(
                                  "${s['total_paid']}",
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              DataCell(
                                Text(
                                  "${s['remaining']}",
                                  style: TextStyle(
                                    color: isSolde ? Colors.green : Colors.red,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              DataCell(
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isSolde
                                        ? Colors.green
                                        : Colors.orange,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    isSolde ? "SOLDE" : "EN DETTE",
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
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
              child: Text(
                "Erreur: $err",
                style: const TextStyle(color: Colors.red),
              ),
            ),
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

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: Responsive.isMobile(context) ? double.infinity : 220,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 16),
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
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
