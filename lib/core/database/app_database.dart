import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'package:flutter/foundation.dart';

import 'tables.dart';

part 'app_database.g.dart';

const syncStateStudentsPullKey = 'students_pull';

@DriftDatabase(tables: [
  SyncStates,
  LocalClasses,
  LocalStudents,
  LocalFees,
  LocalPayments,
  OutboxMutations,
])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  AppDatabase.forTesting(super.e);

  @override
  int get schemaVersion => 3;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) async {
          await m.createAll();
        },
        onUpgrade: (m, from, to) async {
          if (from < 2) {
            await m.createTable(outboxMutations);
          }
          if (from < 3) {
            await m.createTable(localFees);
            await m.createTable(localPayments);
          }
        },
      );

  static QueryExecutor _openConnection() {
    return driftDatabase(
      name: 'school_saas_local',
      web: kIsWeb
          ? DriftWebOptions(
              sqlite3Wasm: Uri.parse('sqlite3.wasm'),
              driftWorker: Uri.parse('drift_worker.js'),
            )
          : null,
    );
  }

  Stream<List<LocalStudent>> watchStudents({
    required String schoolId,
    required String academicYearId,
  }) {
    return (select(localStudents)
          ..where(
            (t) =>
                t.schoolId.equals(schoolId) &
                t.academicYearId.equals(academicYearId),
          )
          ..orderBy([
            (t) => OrderingTerm(expression: t.lastName),
            (t) => OrderingTerm(expression: t.firstName),
          ]))
        .watch();
  }

  Stream<List<LocalClassesData>> watchClasses({
    required String schoolId,
    required String academicYearId,
  }) {
    return (select(localClasses)
          ..where(
            (t) =>
                t.schoolId.equals(schoolId) &
                t.academicYearId.equals(academicYearId),
          )
          ..orderBy([(t) => OrderingTerm(expression: t.name)]))
        .watch();
  }

  Future<SyncState?> getSyncState(String key) {
    return (select(syncStates)..where((t) => t.key.equals(key)))
        .getSingleOrNull();
  }

  Future<void> replaceStudentsDirectory({
    required String schoolId,
    required String academicYearId,
    required String academicYearName,
    required List<LocalClassesCompanion> classes,
    required List<LocalStudentsCompanion> students,
    List<LocalFeesCompanion> fees = const [],
    List<LocalPaymentsCompanion> payments = const [],
  }) async {
    await transaction(() async {
      await (delete(localClasses)
            ..where(
              (t) =>
                  t.schoolId.equals(schoolId) &
                  t.academicYearId.equals(academicYearId),
            ))
          .go();
      await (delete(localStudents)
            ..where(
              (t) =>
                  t.schoolId.equals(schoolId) &
                  t.academicYearId.equals(academicYearId),
            ))
          .go();
      await (delete(localFees)
            ..where(
              (t) =>
                  t.schoolId.equals(schoolId) &
                  t.academicYear.equals(academicYearName),
            ))
          .go();
      await (delete(localPayments)
            ..where((t) => t.schoolId.equals(schoolId)))
          .go();

      if (classes.isNotEmpty) {
        await batch((b) => b.insertAll(localClasses, classes));
      }
      if (students.isNotEmpty) {
        await batch((b) => b.insertAll(localStudents, students));
      }
      if (fees.isNotEmpty) {
        await batch((b) => b.insertAll(localFees, fees));
      }
      if (payments.isNotEmpty) {
        await batch((b) => b.insertAll(localPayments, payments));
      }

      await into(syncStates).insertOnConflictUpdate(
        SyncStatesCompanion(
          key: const Value(syncStateStudentsPullKey),
          schoolId: Value(schoolId),
          academicYearId: Value(academicYearId),
          academicYearName: Value(academicYearName),
          lastSyncedAt: Value(DateTime.now()),
        ),
      );
    });
  }

  Future<List<LocalFee>> getLocalFees({
    required String schoolId,
    required String academicYear,
  }) {
    return (select(localFees)
          ..where(
            (t) =>
                t.schoolId.equals(schoolId) &
                t.academicYear.equals(academicYear),
          )
          ..orderBy([(t) => OrderingTerm(expression: t.name)]))
        .get();
  }

  Future<List<LocalPayment>> getLocalPaymentsForStudent({
    required String schoolId,
    required String studentId,
  }) {
    return (select(localPayments)
          ..where(
            (t) =>
                t.schoolId.equals(schoolId) &
                t.studentId.equals(studentId),
          ))
        .get();
  }

  Future<void> insertLocalPayment(LocalPaymentsCompanion row) {
    return into(localPayments).insert(row, mode: InsertMode.insertOrReplace);
  }

  Future<void> enqueueOutbox(OutboxMutationsCompanion row) {
    return into(outboxMutations).insert(row, mode: InsertMode.insertOrReplace);
  }

  Stream<List<OutboxMutation>> watchOutboxMutations() {
    return (select(outboxMutations)
          ..orderBy([(t) => OrderingTerm(expression: t.createdAt)]))
        .watch();
  }

  /// File d’attente active (pas les mutations déjà synchronisées).
  Stream<int> watchPendingOutboxCount() {
    return watchOutboxMutations().map(
      (rows) => rows
          .where(
            (r) =>
                r.status == 'pending' ||
                r.status == 'processing' ||
                r.status == 'failed',
          )
          .length,
    );
  }

  Future<void> resetStuckProcessingOutbox() async {
    await (update(outboxMutations)
          ..where((t) => t.status.equals('processing')))
        .write(
      const OutboxMutationsCompanion(
        status: Value('pending'),
      ),
    );
  }

  Future<void> upsertLocalStudent(LocalStudentsCompanion row) {
    return into(localStudents).insert(row, mode: InsertMode.insertOrReplace);
  }

  Future<List<OutboxMutation>> getOutboxReadyForProcessing(DateTime now) {
    return (select(outboxMutations)
          ..where(
            (t) =>
                t.status.equals('pending') |
                (t.status.equals('failed') & t.attemptCount.isSmallerThanValue(8)),
          )
          ..where((t) => t.nextRetryAt.isSmallerOrEqualValue(now))
          ..orderBy([(t) => OrderingTerm(expression: t.createdAt)]))
        .get();
  }

  Future<void> updateOutboxMutation(
    String id,
    OutboxMutationsCompanion companion,
  ) {
    return (update(outboxMutations)..where((t) => t.id.equals(id)))
        .write(companion);
  }

  Future<OutboxMutation?> getOutboxById(String id) {
    return (select(outboxMutations)..where((t) => t.id.equals(id)))
        .getSingleOrNull();
  }

  Future<void> deleteOutboxById(String id) {
    return (delete(outboxMutations)..where((t) => t.id.equals(id))).go();
  }

  Future<LocalStudent?> findLocalStudentByMatricule({
    required String schoolId,
    required String matricule,
  }) async {
    final normalized = matricule.trim().toUpperCase();
    if (normalized.isEmpty) return null;

    final exact = await (select(localStudents)
          ..where(
            (t) =>
                t.schoolId.equals(schoolId) &
                t.matricule.equals(normalized),
          ))
        .getSingleOrNull();
    if (exact != null) return exact;

    final candidates = await (select(localStudents)
          ..where(
            (t) => t.schoolId.equals(schoolId) & t.matricule.isNotNull(),
          ))
        .get();
    for (final row in candidates) {
      if (row.matricule!.trim().toUpperCase() == normalized) {
        return row;
      }
    }
    return null;
  }

  Future<void> deleteLocalStudentById(String id) {
    return (delete(localStudents)..where((t) => t.id.equals(id))).go();
  }
}
