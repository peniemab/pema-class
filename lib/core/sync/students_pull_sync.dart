import 'package:drift/drift.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../database/app_database.dart';
import '../supabase/tenant_context.dart';
import '../../features/settings/data/settings_repository.dart';

/// Pull Supabase → Drift pour classes + élèves (année active).
class StudentsPullSync {
  StudentsPullSync(
    this._supabase,
    this._settings,
    this._db,
  );

  final SupabaseClient _supabase;
  final SettingsRepository _settings;
  final AppDatabase _db;

  static String _genderLabel(dynamic gender) {
    if (gender == 'male') return 'Masculin';
    if (gender == 'female') return 'Féminin';
    return 'Autre';
  }

  Future<DirectoryPullResult> pull() async {
    final schoolId = await _supabase.requireSchoolId();
    final yearId = await _settings.getActiveAcademicYearId();
    final yearName = await _settings.getActiveAcademicYearName();

    final classesRaw = await _supabase
        .from('classes')
        .select('id, name, level')
        .eq('school_id', schoolId)
        .eq('academic_year_id', yearId)
        .order('name');

    final studentsRaw = await _supabase
        .from('students')
        .select(
          'id, matricule, first_name, last_name, gender, birth_date, '
          'lieu_naissance, ecole_provenance, updated_at, '
          'student_classes(class_id, academic_year_id, classes(name))',
        )
        .eq('school_id', schoolId);

    final classRows = (classesRaw as List).cast<Map<String, dynamic>>();
    final classCompanions = classRows
        .map(
          (c) => LocalClassesCompanion(
            id: Value(c['id'] as String),
            schoolId: Value(schoolId),
            academicYearId: Value(yearId),
            name: Value(c['name'] as String),
            level: Value((c['level'] as String?) ?? c['name'] as String),
          ),
        )
        .toList();

    final studentCompanions = <LocalStudentsCompanion>[];
    for (final row in (studentsRaw as List).cast<Map<String, dynamic>>()) {
      var classId = '';
      var className = '';
      final sc = row['student_classes'];
      if (sc is List) {
        for (final link in sc) {
          if (link is! Map) continue;
          if (link['academic_year_id'] == yearId) {
            classId = link['class_id'] as String? ?? '';
            final classes = link['classes'];
            if (classes is Map && classes['name'] != null) {
              className = classes['name'] as String;
            }
            break;
          }
        }
      }

      final updatedRaw = row['updated_at'];
      DateTime? remoteUpdated;
      if (updatedRaw is String) {
        remoteUpdated = DateTime.tryParse(updatedRaw);
      }

      studentCompanions.add(
        LocalStudentsCompanion(
          id: Value(row['id'] as String),
          schoolId: Value(schoolId),
          academicYearId: Value(yearId),
          matricule: Value(row['matricule'] as String?),
          firstName: Value(row['first_name'] as String),
          lastName: Value(row['last_name'] as String),
          genderLabel: Value(_genderLabel(row['gender'])),
          birthDate: Value(row['birth_date']?.toString()),
          lieuNaissance: Value(row['lieu_naissance'] as String?),
          ecoleProvenance: Value(row['ecole_provenance'] as String?),
          classId: Value(classId.isEmpty ? null : classId),
          className: Value(className.isEmpty ? null : className),
          remoteUpdatedAt: Value(remoteUpdated),
        ),
      );
    }

    await _db.replaceStudentsDirectory(
      schoolId: schoolId,
      academicYearId: yearId,
      academicYearName: yearName,
      classes: classCompanions,
      students: studentCompanions,
    );

    return DirectoryPullResult(
      schoolId: schoolId,
      academicYearId: yearId,
      academicYearName: yearName,
      studentCount: studentCompanions.length,
      classCount: classCompanions.length,
    );
  }
}

class DirectoryPullResult {
  const DirectoryPullResult({
    required this.schoolId,
    required this.academicYearId,
    required this.academicYearName,
    required this.studentCount,
    required this.classCount,
  });

  final String schoolId;
  final String academicYearId;
  final String academicYearName;
  final int studentCount;
  final int classCount;
}
