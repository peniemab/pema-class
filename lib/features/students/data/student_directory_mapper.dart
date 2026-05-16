import '../../../core/database/app_database.dart';

extension LocalStudentUi on LocalStudent {
  Map<String, dynamic> toUiMap() => {
        'id': id,
        'matricule': matricule,
        'nom': lastName,
        'prenom': firstName,
        'sexe': genderLabel,
        'date_naissance': birthDate,
        'lieu_naissance': lieuNaissance,
        'ecole_provenance': ecoleProvenance,
        'classe_assignee': className ?? '',
      };
}
