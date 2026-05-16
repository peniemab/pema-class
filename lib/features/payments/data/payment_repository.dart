import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/network/connectivity_providers.dart';
import '../../../core/outbox/outbox_mutation_type.dart';
import '../../../core/outbox/outbox_providers.dart';
import '../../../core/outbox/outbox_repository.dart';
import '../../../core/outbox/remote_mutations.dart';
import '../../../core/supabase/tenant_context.dart';

final paymentRepositoryProvider = Provider<PaymentRepository>((ref) {
  return PaymentRepository(
    Supabase.instance.client,
    ref.watch(remoteMutationsProvider),
    ref.watch(outboxRepositoryProvider),
  );
});

class PaymentRepository {
  PaymentRepository(
    this._supabase,
    this._remote,
    this._outbox,
  );

  final SupabaseClient _supabase;
  final RemoteMutations _remote;
  final OutboxRepository _outbox;

  Future<String> _getSchoolId() => _supabase.requireSchoolId();

  Future<Map<String, dynamic>?> searchStudentByMatricule(String matricule) async {
    final schoolId = await _getSchoolId();
    return _supabase
        .from('students')
        .select()
        .eq('school_id', schoolId)
        .eq('matricule', matricule)
        .maybeSingle();
  }

  Future<List<Map<String, dynamic>>> getStudentFeeStatus(
    String studentId,
    String academicYear,
  ) async {
    final schoolId = await _getSchoolId();

    final fees = await _supabase
        .from('fees')
        .select()
        .eq('school_id', schoolId)
        .eq('academic_year', academicYear);

    final payments = await _supabase
        .from('payments_history')
        .select()
        .eq('student_id', studentId);

    final statusList = <Map<String, dynamic>>[];
    for (final fee in fees) {
      final feeId = fee['id'];
      final expectedAmount = double.parse(fee['amount'].toString());

      double totalPaid = 0;
      for (final p in payments) {
        if (p['fee_id'] == feeId) {
          totalPaid += double.parse(p['amount_paid'].toString());
        }
      }

      statusList.add({
        'fee_id': feeId,
        'fee_name': fee['name'],
        'expected_amount': expectedAmount,
        'total_paid': totalPaid,
        'remaining': expectedAmount - totalPaid,
        'is_fully_paid': totalPaid >= expectedAmount,
        'payments': payments.where((p) => p['fee_id'] == feeId).toList(),
      });
    }

    return statusList;
  }

  Future<Map<String, dynamic>> payFee({
    required String studentId,
    required String feeId,
    required double amountPaid,
  }) async {
    final mutationId = _outbox.newMutationId();
    final receiptNumber = receiptNumberForPayment(mutationId);

    final payload = <String, dynamic>{
      'student_id': studentId,
      'fee_id': feeId,
      'amount_paid': amountPaid,
      'receipt_number': receiptNumber,
    };

    final connectivity = await Connectivity().checkConnectivity();
    if (connectionLayerOnline(connectivity)) {
      try {
        return await _remote.payFee(payload);
      } catch (_) {
        // File d’attente si échec réseau transitoire.
      }
    }

    await _outbox.enqueue(
      idempotencyKey: mutationId,
      operationType: OutboxMutationType.payFee,
      payload: payload,
    );

    return {
      'receipt_number': receiptNumber,
      'amount_paid': amountPaid,
      'queued': true,
    };
  }

  Future<List<dynamic>> getRecentPayments() async {
    return [];
  }
}
