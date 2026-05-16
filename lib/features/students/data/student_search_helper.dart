import '../../../core/database/app_database.dart';

/// Normalise une ligne élève (Supabase ou local) pour l’UI / la caisse.
Map<String, dynamic> studentRowForUi({
  required String id,
  String? matricule,
  required String firstName,
  required String lastName,
  String? genderLabel,
  String? className,
  String? birthDate,
  String? lieuNaissance,
}) {
  return {
    'id': id,
    'matricule': matricule,
    'first_name': firstName,
    'last_name': lastName,
    'prenom': firstName,
    'nom': lastName,
    'sexe': genderLabel,
    'classe_assignee': className ?? '',
    'date_naissance': birthDate,
    'lieu_naissance': lieuNaissance,
  };
}

String? classNameFromSupabaseRow(
  Map<String, dynamic> row,
  String activeYearId,
) {
  final sc = row['student_classes'];
  if (sc is! List) return null;
  for (final link in sc) {
    if (link is! Map) continue;
    if (link['academic_year_id'] == activeYearId) {
      final classes = link['classes'];
      if (classes is Map && classes['name'] != null) {
        return classes['name'] as String;
      }
    }
  }
  return null;
}

Map<String, dynamic> supabaseStudentToUi(
  Map<String, dynamic> row,
  String activeYearId,
) {
  var gender = row['gender']?.toString();
  if (gender == 'male') gender = 'Masculin';
  if (gender == 'female') gender = 'Féminin';
  if (gender != null && gender != 'Masculin' && gender != 'Féminin') {
    gender = 'Autre';
  }

  return studentRowForUi(
    id: row['id'] as String,
    matricule: row['matricule'] as String?,
    firstName: row['first_name'] as String,
    lastName: row['last_name'] as String,
    genderLabel: gender,
    className: classNameFromSupabaseRow(row, activeYearId),
    birthDate: row['birth_date']?.toString(),
    lieuNaissance: row['lieu_naissance'] as String?,
  );
}

Map<String, dynamic> localStudentToUi(LocalStudent row) {
  return studentRowForUi(
    id: row.id,
    matricule: row.matricule,
    firstName: row.firstName,
    lastName: row.lastName,
    genderLabel: row.genderLabel,
    className: row.className,
    birthDate: row.birthDate,
    lieuNaissance: row.lieuNaissance,
  );
}

/// Inscription locale non encore validée sur le serveur (matricule provisoire).
bool isLocalDraftStudent(Map<String, dynamic> student) {
  final m = student['matricule']?.toString() ?? '';
  return m.startsWith('MAT-P-');
}
