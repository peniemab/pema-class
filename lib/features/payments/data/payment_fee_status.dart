import '../../../core/database/app_database.dart';

/// Calcule le statut des frais d’un élève à partir du cache local.
List<Map<String, dynamic>> buildFeeStatusFromLocal({
  required List<LocalFee> fees,
  required List<LocalPayment> payments,
}) {
  final statusList = <Map<String, dynamic>>[];

  for (final fee in fees) {
    final feePayments =
        payments.where((p) => p.feeId == fee.id).toList(growable: false);

    var totalPaid = 0.0;
    for (final p in feePayments) {
      totalPaid += p.amountPaid;
    }

    final expectedAmount = fee.amount;
    final remaining = expectedAmount - totalPaid;

    statusList.add({
      'fee_id': fee.id,
      'fee_name': fee.name,
      'expected_amount': expectedAmount,
      'total_paid': totalPaid,
      'remaining': remaining,
      'is_fully_paid': totalPaid >= expectedAmount,
      'payments': feePayments
          .map(
            (p) => {
              'id': p.id,
              'fee_id': p.feeId,
              'student_id': p.studentId,
              'amount_paid': p.amountPaid,
              'receipt_number': p.receiptNumber,
              'pending_sync': p.pendingSync,
            },
          )
          .toList(),
      'from_local_cache': true,
    });
  }

  return statusList;
}

/// Fusionne cache local + serveur sans compter deux fois le même reçu.
List<Map<String, dynamic>> mergeFeeStatusLists(
  List<Map<String, dynamic>> primary,
  List<Map<String, dynamic>> secondary,
) {
  final byFeeId = <String, Map<String, dynamic>>{};

  void ingest(List<Map<String, dynamic>> source) {
    for (final fee in source) {
      final feeId = fee['fee_id'] as String;
      final expected = (fee['expected_amount'] as num).toDouble();
      final existing = byFeeId[feeId];

      final receipts = <String>{};
      final payments = <Map<String, dynamic>>[];
      var totalPaid = 0.0;

      void addPayments(List<dynamic> list) {
        for (final raw in list) {
          if (raw is! Map) continue;
          final p = Map<String, dynamic>.from(raw);
          final receipt = p['receipt_number']?.toString() ?? p['id']?.toString();
          if (receipt == null || !receipts.add(receipt)) continue;
          payments.add(p);
          totalPaid += (p['amount_paid'] as num).toDouble();
        }
      }

      if (existing != null) {
        addPayments(existing['payments'] as List<dynamic>? ?? []);
      }
      addPayments(fee['payments'] as List<dynamic>? ?? []);

      byFeeId[feeId] = {
        'fee_id': feeId,
        'fee_name': fee['fee_name'] ?? existing?['fee_name'],
        'expected_amount': expected,
        'total_paid': totalPaid,
        'remaining': expected - totalPaid,
        'is_fully_paid': totalPaid >= expected,
        'payments': payments,
      };
    }
  }

  ingest(primary);
  ingest(secondary);
  return byFeeId.values.toList();
}
