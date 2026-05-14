import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/supabase/tenant_context.dart';
import '../../settings/data/settings_repository.dart';

final admissionRepositoryProvider = Provider<AdmissionRepository>((ref) {
  return AdmissionRepository(Supabase.instance.client, ref.watch(settingsRepositoryProvider));
});

class AdmissionRepository {
  final SupabaseClient _supabase;
  final SettingsRepository _settings;

  AdmissionRepository(this._supabase, this._settings);

  String _mapGender(String sexeLabel) {
    final s = sexeLabel.toLowerCase();
    if (s.startsWith('mas')) return 'male';
    if (s.startsWith('fé') || s.startsWith('fem')) return 'female';
    return 'other';
  }

  Future<Map<String, dynamic>> registerStudent({
    required String nom,
    required String prenom,
    required String sexe,
    required String lieuNaissance,
    required String dateNaissance,
    required String classeAssignee,
    required String ecoleProvenance,
    required String tuteurNom,
    required String lienParente,
    required String tuteurPhone,
    required String tuteurAdresse,
    required String urgenceContact,
    required String urgenceMaladie,
  }) async {
    final schoolId = await _supabase.requireSchoolId();
    final academicYearId = await _settings.getActiveAcademicYearId();

    final classRow = await _supabase
        .from('classes')
        .select('id')
        .eq('school_id', schoolId)
        .eq('academic_year_id', academicYearId)
        .eq('name', classeAssignee)
        .maybeSingle();
    if (classRow == null) {
      throw Exception('Classe inconnue pour cette année : $classeAssignee');
    }
    final classId = classRow['id'] as String;

    final countRes = await _supabase.from('students').select('id').eq('school_id', schoolId);
    final year = DateTime.now().year;
    final nextNumber = (countRes.length + 1).toString().padLeft(4, '0');
    final matricule = 'MAT-$year-$nextNumber';

    final studentRow = await _supabase
        .from('students')
        .insert({
          'school_id': schoolId,
          'first_name': prenom,
          'last_name': nom,
          'gender': _mapGender(sexe),
          'birth_date': dateNaissance.isEmpty ? null : dateNaissance,
          'lieu_naissance': lieuNaissance.isEmpty ? null : lieuNaissance,
          'ecole_provenance': ecoleProvenance.isEmpty ? null : ecoleProvenance,
          'matricule': matricule,
        })
        .select()
        .single();

    final studentId = studentRow['id'] as String;

    await _supabase.from('student_classes').insert({
      'student_id': studentId,
      'class_id': classId,
      'academic_year_id': academicYearId,
    });

    final noteParts = <String>[
      if (tuteurAdresse.isNotEmpty) 'Adresse tuteur: $tuteurAdresse',
      if (urgenceContact.isNotEmpty) 'Urgence: $urgenceContact',
      if (urgenceMaladie.isNotEmpty) 'Médical: $urgenceMaladie',
    ];

    await _supabase.from('student_emergency_contacts').insert({
      'student_id': studentId,
      'full_name': tuteurNom,
      'relationship': lienParente,
      'phone': tuteurPhone,
      if (noteParts.isNotEmpty) 'note': noteParts.join(' | '),
    });

    return {'matricule': matricule, 'classe_assignee': classeAssignee};
  }
}
