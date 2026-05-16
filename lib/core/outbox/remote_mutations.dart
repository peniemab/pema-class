import 'package:supabase_flutter/supabase_flutter.dart';

import '../supabase/tenant_context.dart';
import '../../features/settings/data/settings_repository.dart';
import 'outbox_mutation_type.dart';

/// Exécution distante des mutations (hors outbox worker).
class RemoteMutations {
  RemoteMutations(this._supabase, this._settings);

  final SupabaseClient _supabase;
  final SettingsRepository _settings;

  static String? _optionalString(dynamic value) {
    if (value == null) return null;
    final s = value.toString();
    return s.isEmpty ? null : s;
  }

  String _mapGender(String sexeLabel) {
    final s = sexeLabel.toLowerCase();
    if (s.startsWith('mas')) return 'male';
    if (s.startsWith('fé') || s.startsWith('fem')) return 'female';
    return 'other';
  }

  Future<Map<String, dynamic>> registerStudent(
    Map<String, dynamic> payload,
  ) async {
    final schoolId = await _supabase.requireSchoolId();
    final academicYearId = await _settings.getActiveAcademicYearId();
    final classeAssignee = payload['classe_assignee'] as String;
    final matricule = payload['matricule'] as String;

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

    final studentRow = await _supabase
        .from('students')
        .insert({
          'school_id': schoolId,
          'first_name': payload['prenom'],
          'last_name': payload['nom'],
          'gender': _mapGender(payload['sexe'] as String),
          'birth_date': _optionalString(payload['date_naissance']),
          'lieu_naissance': _optionalString(payload['lieu_naissance']),
          'ecole_provenance': _optionalString(payload['ecole_provenance']),
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
      if ((payload['tuteur_adresse'] as String?)?.isNotEmpty ?? false)
        'Adresse tuteur: ${payload['tuteur_adresse']}',
      if ((payload['urgence_contact'] as String?)?.isNotEmpty ?? false)
        'Urgence: ${payload['urgence_contact']}',
      if ((payload['urgence_maladie'] as String?)?.isNotEmpty ?? false)
        'Médical: ${payload['urgence_maladie']}',
    ];

    await _supabase.from('student_emergency_contacts').insert({
      'student_id': studentId,
      'full_name': payload['tuteur_nom'],
      'relationship': payload['lien_parente'],
      'phone': payload['tuteur_phone'],
      if (noteParts.isNotEmpty) 'note': noteParts.join(' | '),
    });

    return {
      'matricule': matricule,
      'classe_assignee': classeAssignee,
      'student_id': studentId,
      'queued': false,
    };
  }

  Future<Map<String, dynamic>> payFee(Map<String, dynamic> payload) async {
    final userId = _supabase.auth.currentUser?.id;
    final receiptNumber = payload['receipt_number'] as String;

    final row = await _supabase
        .from('payments_history')
        .insert({
          'student_id': payload['student_id'],
          'fee_id': payload['fee_id'],
          'amount_paid': payload['amount_paid'],
          'receipt_number': receiptNumber,
          'created_by': userId,
        })
        .select()
        .single();

    return {...row, 'queued': false};
  }

  static String operationLabel(String type) {
    switch (type) {
      case OutboxMutationType.registerStudent:
        return 'Inscription élève';
      case OutboxMutationType.payFee:
        return 'Paiement';
      default:
        return type;
    }
  }
}
