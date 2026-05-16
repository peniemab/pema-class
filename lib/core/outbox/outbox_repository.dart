import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:uuid/uuid.dart';

import '../database/app_database.dart';
import 'outbox_status.dart';

class OutboxRepository {
  OutboxRepository(this._db);

  final AppDatabase _db;
  static const _uuid = Uuid();

  String newMutationId() => _uuid.v4();

  Future<String> enqueue({
    required String operationType,
    required Map<String, dynamic> payload,
    String? idempotencyKey,
  }) async {
    final id = idempotencyKey ?? newMutationId();
    final now = DateTime.now();
    await _db.enqueueOutbox(
      OutboxMutationsCompanion.insert(
        id: id,
        operationType: operationType,
        payloadJson: jsonEncode(payload),
        status: OutboxStatus.pending,
        attemptCount: const Value(0),
        nextRetryAt: now,
        createdAt: now,
      ),
    );
    return id;
  }

  Stream<int> watchPendingCount() => _db.watchPendingOutboxCount();

  Future<List<OutboxMutation>> readyMutations() {
    return _db.getOutboxReadyForProcessing(DateTime.now());
  }

  Map<String, dynamic> decodePayload(OutboxMutation row) {
    return Map<String, dynamic>.from(
      jsonDecode(row.payloadJson) as Map,
    );
  }
}

/// Génère un matricule stable pour une inscription mise en file (retry safe).
String provisionalMatriculeForAdmission(String mutationId) {
  final short = mutationId.replaceAll('-', '').substring(0, 8).toUpperCase();
  return 'MAT-P-$short';
}

String receiptNumberForPayment(String mutationId) => 'REC-$mutationId';
