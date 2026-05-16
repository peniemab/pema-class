import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/database/app_database.dart';
import '../../../core/database/database_provider.dart';
import '../../../core/network/connectivity_providers.dart';
import '../../../core/outbox/outbox_mutation_type.dart';
import '../../../core/outbox/outbox_providers.dart';
import '../../../core/outbox/outbox_repository.dart';
import '../../../core/outbox/remote_mutations.dart';
import '../../../core/supabase/local_tenant_scope.dart';
import '../../settings/data/settings_repository.dart';
import '../../students/data/student_search_helper.dart';
import 'payment_fee_status.dart';

final paymentRepositoryProvider = Provider<PaymentRepository>((ref) {
  return PaymentRepository(
    Supabase.instance.client,
    ref.watch(remoteMutationsProvider),
    ref.watch(outboxRepositoryProvider),
    ref.watch(appDatabaseProvider),
    ref.watch(settingsRepositoryProvider),
  );
});

class PaymentRepository {
  PaymentRepository(
    this._supabase,
    this._remote,
    this._outbox,
    this._db,
    this._settings,
  );

  final SupabaseClient _supabase;
  final RemoteMutations _remote;
  final OutboxRepository _outbox;
  final AppDatabase _db;
  final SettingsRepository _settings;

  Future<String> _getSchoolId() => resolveSchoolId(db: _db, supabase: _supabase);

  Future<String> activeAcademicYearName() async {
    final state = await _db.getSyncState(syncStateStudentsPullKey);
    final cached = state?.academicYearName;
    if (cached != null && cached.isNotEmpty) return cached;

    final connectivity = await Connectivity().checkConnectivity();
    if (connectionLayerOnline(connectivity)) {
      return _settings.getActiveAcademicYearName();
    }

    throw StateError(
      'Hors ligne : synchronisez d’abord l’annuaire (accueil ou liste élèves).',
    );
  }

  Future<Map<String, dynamic>?> searchStudentByMatricule(String matricule) async {
    final schoolId = await _getSchoolId();
    final normalized = matricule.trim();
    final forRemote = normalized.toUpperCase();

    final local = await _db.findLocalStudentByMatricule(
      schoolId: schoolId,
      matricule: normalized,
    );
    final isDraft =
        local?.matricule != null && local!.matricule!.startsWith('MAT-P-');
    if (isDraft) {
      return localStudentToUi(local);
    }

    final connectivity = await Connectivity().checkConnectivity();
    if (connectionLayerOnline(connectivity)) {
      final yearId = await _settings.getActiveAcademicYearId();
      final row = await _supabase
          .from('students')
          .select(
            'id, matricule, first_name, last_name, gender, birth_date, lieu_naissance, '
            'student_classes(class_id, academic_year_id, classes(name))',
          )
          .eq('school_id', schoolId)
          .eq('matricule', forRemote)
          .maybeSingle();

      if (row != null) {
        return supabaseStudentToUi(Map<String, dynamic>.from(row), yearId);
      }
    }

    if (local != null) {
      return localStudentToUi(local);
    }
    return null;
  }

  Future<String?> _resolveServerStudentId({
    required String schoolId,
    required String studentId,
    String? studentMatricule,
  }) async {
    final exists = await _supabase
        .from('students')
        .select('id')
        .eq('school_id', schoolId)
        .eq('id', studentId)
        .maybeSingle();
    if (exists != null) return studentId;

    final mat = studentMatricule?.trim() ?? '';
    if (mat.isEmpty) return null;

    final row = await _supabase
        .from('students')
        .select('id')
        .eq('school_id', schoolId)
        .eq('matricule', mat.toUpperCase())
        .maybeSingle();
    return row?['id'] as String?;
  }

  Future<List<Map<String, dynamic>>> getStudentFeeStatus(
    String studentId, {
    String? studentMatricule,
  }) async {
    final schoolId = await _getSchoolId();
    final academicYear = await activeAcademicYearName();
    final mat = studentMatricule?.trim() ?? '';

    final local = await _fetchLocalFeeStatus(
      schoolId: schoolId,
      studentId: studentId,
      academicYear: academicYear,
    );

    if (mat.startsWith('MAT-P-')) {
      return local;
    }

    final connectivity = await Connectivity().checkConnectivity();
    if (!connectionLayerOnline(connectivity)) {
      return local;
    }

    final serverStudentId = await _resolveServerStudentId(
      schoolId: schoolId,
      studentId: studentId,
      studentMatricule: mat,
    );
    if (serverStudentId == null) {
      return local;
    }

    try {
      final remote = await _fetchRemoteFeeStatus(
        schoolId: schoolId,
        studentId: serverStudentId,
        academicYear: academicYear,
      );
      return mergeFeeStatusLists(remote, local);
    } catch (_) {
      return local;
    }
  }

  Future<void> _ensureCanPayFee({
    required String studentId,
    required String feeId,
    required double amountPaid,
    String? studentMatricule,
  }) async {
    final status = await getStudentFeeStatus(
      studentId,
      studentMatricule: studentMatricule,
    );
    final line = status.where((f) => f['fee_id'] == feeId).toList();
    if (line.isEmpty) {
      throw StateError('Frais introuvable pour cet élève.');
    }
    final fee = line.first;
    final remaining = (fee['remaining'] as num).toDouble();
    if (remaining <= 0) {
      throw StateError('Ce frais est déjà soldé — encaissement refusé.');
    }
    if (amountPaid > remaining + 0.001) {
      throw StateError(
        'Montant trop élevé : il reste ${remaining.toStringAsFixed(0)} FC à payer.',
      );
    }
  }

  Future<List<Map<String, dynamic>>> _fetchLocalFeeStatus({
    required String schoolId,
    required String studentId,
    required String academicYear,
  }) async {
    final fees = await _db.getLocalFees(
      schoolId: schoolId,
      academicYear: academicYear,
    );
    if (fees.isEmpty) {
      throw StateError(
        'Aucun frais en cache. Ouvrez l’app en ligne et synchronisez '
        '(accueil ou annuaire élèves), puis réessayez.',
      );
    }

    final payments = await _db.getLocalPaymentsForStudent(
      schoolId: schoolId,
      studentId: studentId,
    );

    return buildFeeStatusFromLocal(fees: fees, payments: payments);
  }

  Future<List<Map<String, dynamic>>> _fetchRemoteFeeStatus({
    required String schoolId,
    required String studentId,
    required String academicYear,
  }) async {
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

  Future<void> _cachePaymentFromServer(Map<String, dynamic> row) async {
    final schoolId = await _getSchoolId();
    DateTime? paidAt;
    final createdRaw = row['created_at'];
    if (createdRaw is String) {
      paidAt = DateTime.tryParse(createdRaw);
    }

    await _db.insertLocalPayment(
      LocalPaymentsCompanion(
        id: Value(row['id'] as String),
        schoolId: Value(schoolId),
        studentId: Value(row['student_id'] as String),
        feeId: Value(row['fee_id'] as String),
        amountPaid: Value(double.parse(row['amount_paid'].toString())),
        receiptNumber: Value(row['receipt_number'] as String),
        paidAt: Value(paidAt),
        pendingSync: const Value(false),
      ),
    );
  }

  Future<Map<String, dynamic>> payFee({
    required String studentId,
    required String feeId,
    required double amountPaid,
    String? studentMatricule,
  }) async {
    await _ensureCanPayFee(
      studentId: studentId,
      feeId: feeId,
      amountPaid: amountPaid,
      studentMatricule: studentMatricule,
    );

    final mat = studentMatricule?.trim() ?? '';
    final isProvisional = mat.startsWith('MAT-P-');

    final mutationId = _outbox.newMutationId();
    final receiptNumber = receiptNumberForPayment(mutationId);
    final schoolId = await _getSchoolId();

    final payload = <String, dynamic>{
      'student_id': studentId,
      'fee_id': feeId,
      'amount_paid': amountPaid,
      'receipt_number': receiptNumber,
      if (mat.isNotEmpty) 'student_matricule': mat,
      if (isProvisional) 'registration_mutation_id': studentId,
    };

    final connectivity = await Connectivity().checkConnectivity();
    if (!isProvisional && connectionLayerOnline(connectivity)) {
      try {
        final result = await _remote.payFee(payload);
        await _cachePaymentFromServer(result);
        return {
          'receipt_number': result['receipt_number'] ?? receiptNumber,
          'amount_paid': amountPaid,
          'queued': false,
        };
      } catch (_) {
        // File d’attente si échec réseau transitoire.
      }
    }

    await _outbox.enqueue(
      idempotencyKey: mutationId,
      operationType: OutboxMutationType.payFee,
      payload: payload,
    );

    await _db.insertLocalPayment(
      LocalPaymentsCompanion(
        id: Value(mutationId),
        schoolId: Value(schoolId),
        studentId: Value(studentId),
        feeId: Value(feeId),
        amountPaid: Value(amountPaid),
        receiptNumber: Value(receiptNumber),
        paidAt: Value(DateTime.now()),
        pendingSync: const Value(true),
      ),
    );

    return {
      'receipt_number': receiptNumber,
      'amount_paid': amountPaid,
      'queued': true,
    };
  }
}
