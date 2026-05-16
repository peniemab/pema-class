import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/responsive.dart';
import '../../../../core/widgets/custom_button.dart';
import '../../../../core/widgets/custom_text_field.dart';

import '../../../settings/presentation/screens/settings_screen.dart';
import '../../../../core/outbox/outbox_providers.dart';
import '../../data/payment_repository.dart';
import '../widgets/receipt_generator.dart';

class PaymentsScreen extends ConsumerStatefulWidget {
  const PaymentsScreen({super.key});

  @override
  ConsumerState<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends ConsumerState<PaymentsScreen> {
  final _searchCtrl = TextEditingController();
  bool _isSearching = false;
  Map<String, dynamic>? _student;
  List<Map<String, dynamic>>? _feeStatus;
  String? _errorMessage;

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _searchStudent() async {
    final matricule = _searchCtrl.text.trim().toUpperCase();
    if (matricule.isEmpty) return;

    setState(() {
      _isSearching = true;
      _errorMessage = null;
      _student = null;
      _feeStatus = null;
    });

    try {
      final repo = ref.read(paymentRepositoryProvider);
      final student = await repo.searchStudentByMatricule(matricule);
      
      if (student == null) {
        setState(() => _errorMessage = "Aucun élève trouvé avec ce matricule.");
      } else {
        final year = await ref.read(activeAcademicYearNameProvider.future);
        final status = await repo.getStudentFeeStatus(student['id'], year);
        setState(() {
          _student = student;
          _feeStatus = status;
        });
      }
    } catch (e) {
      setState(() => _errorMessage = "Erreur de recherche : $e");
    } finally {
      setState(() => _isSearching = false);
    }
  }

  void _showPaymentDialog(Map<String, dynamic> fee) {
    if (fee['is_fully_paid']) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Ce frais est déjà soldé !')));
      return;
    }

    final amountCtrl = TextEditingController(text: fee['remaining'].toString());
    bool isProcessing = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          return AlertDialog(
            title: Text("Paiement : ${fee['fee_name']}"),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Reste à payer : ${fee['remaining']} FC", style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                CustomTextField(
                  controller: amountCtrl,
                  label: "Montant à encaisser",
                  hint: "Ex: 5000",
                  keyboardType: TextInputType.number,
                )
              ],
            ),
            actions: [
              TextButton(
                onPressed: isProcessing ? null : () => Navigator.pop(ctx), 
                child: const Text('Annuler')
              ),
              ElevatedButton(
                onPressed: isProcessing ? null : () async {
                  final amountStr = amountCtrl.text.trim();
                  final amount = double.tryParse(amountStr);
                  if (amount == null || amount <= 0 || amount > fee['remaining']) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Montant invalide")));
                    return;
                  }

                  setDialogState(() => isProcessing = true);
                  try {
                    final repo = ref.read(paymentRepositoryProvider);
                    final result = await repo.payFee(
                      studentId: _student!['id'],
                      feeId: fee['fee_id'],
                      amountPaid: amount,
                    );

                    if (mounted) Navigator.pop(ctx);
                    
                    // Générer le reçu
                    final logoUrl = await ref.read(logoUrlProvider.future);
                    
                    // Refresh data behind the scenes
                    final year = await ref.read(activeAcademicYearNameProvider.future);
                    final status = await repo.getStudentFeeStatus(_student!['id'], year);
                    setState(() {
                      _feeStatus = status;
                    });

                    // We need the updated fee status for the receipt (or just use current + amount)
                    final newFeeState = status.firstWhere((f) => f['fee_id'] == fee['fee_id']);
                    
                    await ReceiptGenerator.generateReceipt(
                      student: _student!,
                      feeStatus: newFeeState,
                      amountPaid: amount,
                      receiptNumber: result['receipt_number'],
                      logoUrl: logoUrl,
                    );
                    
                    if (mounted) {
                      final queued = result['queued'] == true;
                      if (queued) {
                        ref.read(outboxWorkerProvider).flush();
                      }
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            queued
                                ? 'Paiement en file d’attente — synchronisation automatique.'
                                : 'Paiement enregistré et reçu généré !',
                          ),
                          backgroundColor: Colors.green,
                        ),
                      );
                    }
                  } catch (e) {
                    setDialogState(() => isProcessing = false);
                    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Erreur: $e"), backgroundColor: Colors.red));
                  }
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                child: isProcessing ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Encaisser', style: TextStyle(color: Colors.white)),
              )
            ],
          );
        }
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(Responsive.isMobile(context) ? 16.0 : 32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Caisse & Paiements", style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 8),
          const Text("Recherchez un élève pour encaisser ses frais.", style: TextStyle(color: AppColors.textSecondary, fontSize: 16)),
          const SizedBox(height: 32),

          // Search Bar
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
            child: Row(
              children: [
                Expanded(
                  child: CustomTextField(
                    controller: _searchCtrl,
                    label: "Recherche par Matricule",
                    hint: "Ex: MAT-2026-0001",
                    prefixIcon: Icons.search,
                    onSubmitted: (_) => _searchStudent(),
                  ),
                ),
                const SizedBox(width: 16),
                _isSearching
                  ? const CircularProgressIndicator()
                  : CustomButton(
                      text: "Rechercher",
                      onPressed: _searchStudent,
                      isFullWidth: false,
                    )
              ],
            ),
          ),

          if (_errorMessage != null) ...[
            const SizedBox(height: 16),
            Text(_errorMessage!, style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
          ],

          if (_student != null && _feeStatus != null) ...[
            const SizedBox(height: 32),
            _buildStudentInfo(),
            const SizedBox(height: 32),
            _buildFeesList(),
          ]
        ],
      ),
    );
  }

  Widget _buildStudentInfo() {
    final last = (_student!['last_name'] ?? _student!['nom'] ?? '?').toString();
    final first = (_student!['first_name'] ?? _student!['prenom'] ?? '').toString();
    final mat = _student!['matricule']?.toString() ?? '';
    final classe = _student!['classe_assignee']?.toString();

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.05),
        border: Border.all(color: AppColors.primary.withOpacity(0.2)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: AppColors.primary,
            child: Text(last.isNotEmpty ? last.substring(0, 1).toUpperCase() : '?', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("$first $last", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                const SizedBox(height: 4),
                Text("Matricule: $mat  |  Classe: ${classe ?? '—'}", style: const TextStyle(color: AppColors.textSecondary)),
              ],
            ),
          ),
          ElevatedButton.icon(
            icon: const Icon(Icons.history, color: AppColors.primary),
            label: const Text("Détails Financiers", style: TextStyle(color: AppColors.primary)),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.white, elevation: 0, side: const BorderSide(color: AppColors.primary)),
            onPressed: () {},
          )
        ],
      ),
    );
  }

  Widget _buildFeesList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
         const Text("Situation Financière", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
         const SizedBox(height: 16),
         
         if (_feeStatus!.isEmpty)
            const Text("Aucun frais configuré pour cette année scolaire.", style: TextStyle(color: AppColors.textSecondary))
         else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _feeStatus!.length,
              itemBuilder: (context, index) {
                final fee = _feeStatus![index];
                final isSold = fee['is_fully_paid'];
                
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: isSold ? Colors.green.shade200 : Colors.orange.shade200)),
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(16),
                    leading: CircleAvatar(
                      backgroundColor: isSold ? Colors.green.withOpacity(0.2) : Colors.orange.withOpacity(0.2),
                      child: Icon(isSold ? Icons.check_circle : Icons.warning, color: isSold ? Colors.green : Colors.orange),
                    ),
                    title: Text(fee['fee_name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 8),
                        Text("Attendu : ${fee['expected_amount']} FC"),
                        Text("Payé : ${fee['total_paid']} FC", style: const TextStyle(fontWeight: FontWeight.bold)),
                        if (!isSold)
                          Text("Reste : ${fee['remaining']} FC", style: const TextStyle(color: Colors.red)),
                      ],
                    ),
                    trailing: isSold
                      ? Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(color: Colors.green, borderRadius: BorderRadius.circular(20)),
                          child: const Text("SOLDE", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        )
                      : ElevatedButton(
                          onPressed: () => _showPaymentDialog(fee),
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.secondary),
                          child: const Text("Encaisser", style: TextStyle(color: Colors.white)),
                        ),
                  ),
                );
              },
            ),
      ]
    );
  }
}
