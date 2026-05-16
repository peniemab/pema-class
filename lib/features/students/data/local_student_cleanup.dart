import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/database/app_database.dart';
import '../../../core/database/database_provider.dart';
import '../../../core/outbox/outbox_mutation_type.dart';
import '../../../core/outbox/outbox_status.dart';

final localStudentCleanupProvider = Provider<LocalStudentCleanup>((ref) {
  return LocalStudentCleanup(ref.watch(appDatabaseProvider));
});

/// Suppression manuelle d’un brouillon bloqué (sync auto sinon).
class LocalStudentCleanup {
  LocalStudentCleanup(this._db);

  final AppDatabase _db;

  Future<void> removeDraftEnrollment(String studentId) async {
    await _db.deleteLocalStudentById(studentId);
    await (_db.delete(_db.localPayments)
          ..where((t) => t.studentId.equals(studentId)))
        .go();
    await _db.deleteOutboxById(studentId);
  }

  /// Afficher la poubelle seulement si l’inscription locale est en échec / bloquée.
  Future<bool> shouldOfferManualDelete(String studentId) async {
    final row = await _db.getOutboxById(studentId);
    if (row == null) return true;
    if (row.operationType != OutboxMutationType.registerStudent) {
      return false;
    }
    return row.status == OutboxStatus.failed ||
        row.status == OutboxStatus.blockedAuth;
  }
}
