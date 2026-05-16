import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

import 'tables.dart';

part 'app_database.g.dart';

const syncStateStudentsPullKey = 'students_pull';

@DriftDatabase(tables: [SyncStates, LocalClasses, LocalStudents, OutboxMutations])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  AppDatabase.forTesting(super.e);

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) async {
          await m.createAll();
        },
        onUpgrade: (m, from, to) async {
          if (from < 2) {
            await m.createTable(outboxMutations);
          }
        },
      );

  static QueryExecutor _openConnection() {
    return driftDatabase(name: 'school_saas_local');
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

      if (classes.isNotEmpty) {
        await batch((b) => b.insertAll(localClasses, classes));
      }
      if (students.isNotEmpty) {
        await batch((b) => b.insertAll(localStudents, students));
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

  Future<void> enqueueOutbox(OutboxMutationsCompanion row) {
    return into(outboxMutations).insert(row, mode: InsertMode.insertOrReplace);
  }

  Stream<int> watchPendingOutboxCount() {
    return (select(outboxMutations)
          ..where(
            (t) => t.status.isIn([
              'pending',
              'failed',
              'processing',
            ]),
          ))
        .watch()
        .map((rows) => rows.length);
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
}
