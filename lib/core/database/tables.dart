import 'package:drift/drift.dart';

/// Métadonnées de sync (scope actif + horodatage du dernier pull élèves).
class SyncStates extends Table {
  TextColumn get key => text()();
  TextColumn get schoolId => text()();
  TextColumn get academicYearId => text()();
  TextColumn get academicYearName => text().nullable()();
  DateTimeColumn get lastSyncedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {key};
}

class LocalClasses extends Table {
  TextColumn get id => text()();
  TextColumn get schoolId => text()();
  TextColumn get academicYearId => text()();
  TextColumn get name => text()();
  TextColumn get level => text()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Annuaire élèves (année active), classe dénormalisée pour filtre / affichage.
class LocalStudents extends Table {
  TextColumn get id => text()();
  TextColumn get schoolId => text()();
  TextColumn get academicYearId => text()();
  TextColumn get matricule => text().nullable()();
  TextColumn get firstName => text()();
  TextColumn get lastName => text()();
  TextColumn get genderLabel => text().nullable()();
  TextColumn get birthDate => text().nullable()();
  TextColumn get lieuNaissance => text().nullable()();
  TextColumn get ecoleProvenance => text().nullable()();
  TextColumn get classId => text().nullable()();
  TextColumn get className => text().nullable()();
  DateTimeColumn get remoteUpdatedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}
