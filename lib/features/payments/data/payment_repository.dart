import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/supabase/tenant_context.dart';

final paymentRepositoryProvider = Provider<PaymentRepository>((ref) {
  return PaymentRepository(Supabase.instance.client);
});

class PaymentRepository {
  final SupabaseClient _supabase;
  PaymentRepository(this._supabase);

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

  Future<List<Map<String, dynamic>>> getStudentFeeStatus(String studentId, String academicYear) async {
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
    final userId = _supabase.auth.currentUser?.id;
    final receiptNumber = 'REC-${DateTime.now().millisecondsSinceEpoch}';

    return _supabase.from('payments_history').insert({
      'student_id': studentId,
      'fee_id': feeId,
      'amount_paid': amountPaid,
      'receipt_number': receiptNumber,
      'created_by': userId,
    }).select().single();
  }

  Future<List<dynamic>> getRecentPayments() async {
    return [];
  }
}
