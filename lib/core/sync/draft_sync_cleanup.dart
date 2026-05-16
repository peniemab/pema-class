import 'package:drift/drift.dart';

import '../database/app_database.dart';
import '../outbox/outbox_mutation_type.dart';
import '../outbox/outbox_status.dart';

/// Nettoie les brouillons locaux une fois l’inscription envoyée au serveur.
class DraftSyncCleanup {
  DraftSyncCleanup(this._db);

  final AppDatabase _db;

  /// Brouillons d’inscription encore en attente (à conserver pendant un pull).
  Future<List<LocalStudentsCompanion>> pendingRegistrationDrafts(
    String schoolId,
  ) async {
    final pendingRegs = await (_db.select(_db.outboxMutations)
          ..where(
            (t) =>
                t.operationType.equals(OutboxMutationType.registerStudent) &
                (t.status.equals(OutboxStatus.pending) |
                    t.status.equals(OutboxStatus.processing) |
                    t.status.equals(OutboxStatus.failed)),
          ))
        .get();

    if (pendingRegs.isEmpty) return [];

    final ids = pendingRegs.map((r) => r.id).toList();
    final students = await (_db.select(_db.localStudents)
          ..where(
            (t) => t.schoolId.equals(schoolId) & t.id.isIn(ids),
          ))
        .get();

    return students
        .map(
          (s) => LocalStudentsCompanion(
            id: Value(s.id),
            schoolId: Value(s.schoolId),
            academicYearId: Value(s.academicYearId),
            matricule: Value(s.matricule),
            firstName: Value(s.firstName),
            lastName: Value(s.lastName),
            genderLabel: Value(s.genderLabel),
            birthDate: Value(s.birthDate),
            lieuNaissance: Value(s.lieuNaissance),
            ecoleProvenance: Value(s.ecoleProvenance),
            classId: Value(s.classId),
            className: Value(s.className),
            remoteUpdatedAt: Value(s.remoteUpdatedAt),
          ),
        )
        .toList();
  }

  /// Retire du cache local ce qui a été synchronisé avec Supabase.
  Future<void> purgeSentDrafts({
    required String schoolId,
    required Set<String> serverMatriculesUpper,
    required Set<String> serverStudentIds,
  }) async {
    final completedRegs = await (_db.select(_db.outboxMutations)
          ..where(
            (t) =>
                t.operationType.equals(OutboxMutationType.registerStudent) &
                t.status.equals(OutboxStatus.completed),
          ))
        .get();

    for (final row in completedRegs) {
      await _db.deleteLocalStudentById(row.id);
      await (_db.delete(_db.localPayments)
            ..where(
              (t) =>
                  t.schoolId.equals(schoolId) & t.studentId.equals(row.id),
            ))
          .go();
      await _db.deleteOutboxById(row.id);
    }

    final provisional = await (_db.select(_db.localStudents)
          ..where(
            (t) =>
                t.schoolId.equals(schoolId) &
                t.matricule.like('MAT-P-%'),
          ))
        .get();

    for (final draft in provisional) {
      final mat = draft.matricule?.trim().toUpperCase();
      if (mat == null || mat.isEmpty) continue;

      final onServerByMatricule = serverMatriculesUpper.contains(mat);
      final isServerRow = serverStudentIds.contains(draft.id);
      if (onServerByMatricule && !isServerRow) {
        await _db.deleteLocalStudentById(draft.id);
        await (_db.delete(_db.localPayments)
              ..where(
                (t) =>
                    t.schoolId.equals(schoolId) &
                    t.studentId.equals(draft.id),
              ))
            .go();
      }
    }

    final completedPays = await (_db.select(_db.outboxMutations)
          ..where(
            (t) =>
                t.operationType.equals(OutboxMutationType.payFee) &
                t.status.equals(OutboxStatus.completed),
          ))
        .get();
    for (final row in completedPays) {
      await _db.deleteOutboxById(row.id);
    }
  }
}
