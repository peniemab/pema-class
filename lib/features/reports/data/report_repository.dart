import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/supabase/tenant_context.dart';
import '../../settings/data/settings_repository.dart';

final reportRepositoryProvider = Provider<ReportRepository>((ref) {
  return ReportRepository(
    Supabase.instance.client,
    ref.watch(settingsRepositoryProvider),
  );
});

class ReportRepository {
  final SupabaseClient _supabase;
  final SettingsRepository _settings;

  ReportRepository(this._supabase, this._settings);

  Future<String> _getSchoolId() => _supabase.requireSchoolId();

  String _genderLabel(dynamic gender) {
    if (gender == 'male') return 'Masculin';
    if (gender == 'female') return 'Féminin';
    return 'Autre';
  }

  Map<String, dynamic> _flattenStudent(
    Map<String, dynamic> row,
    String activeYearId,
  ) {
    var className = '';
    final sc = row['student_classes'];
    if (sc is List) {
      for (final link in sc) {
        if (link is! Map) continue;
        if (link['academic_year_id'] == activeYearId) {
          final classes = link['classes'];
          if (classes is Map && classes['name'] != null) {
            className = classes['name'] as String;
          }
          break;
        }
      }
    }

    return {
      ...row,
      'nom': row['last_name'],
      'prenom': row['first_name'],
      'sexe': _genderLabel(row['gender']),
      'date_naissance': row['birth_date'],
      'lieu_naissance': row['lieu_naissance'],
      'classe_assignee': className,
    };
  }

  Future<String> _academicYearIdForName(String academicYearName) async {
    final schoolId = await _getSchoolId();
    final row = await _supabase
        .from('academic_years')
        .select('id')
        .eq('school_id', schoolId)
        .eq('name', academicYearName)
        .maybeSingle();
    return row?['id'] as String? ?? await _settings.getActiveAcademicYearId();
  }

  Future<Map<String, dynamic>> getFinancialReport(String academicYear) async {
    final schoolId = await _getSchoolId();
    final yearIdForClasses = await _academicYearIdForName(academicYear);

    final fees = await _supabase
        .from('fees')
        .select()
        .eq('school_id', schoolId)
        .eq('academic_year', academicYear);

    final studentsRaw = await _supabase
        .from('students')
        .select(
          'id, matricule, first_name, last_name, gender, birth_date, lieu_naissance, ecole_provenance, '
          'student_classes(class_id, academic_year_id, classes(name))',
        )
        .eq('school_id', schoolId);

    final students = (studentsRaw as List)
        .cast<Map<String, dynamic>>()
        .map((s) => _flattenStudent(s, yearIdForClasses))
        .toList()
      ..sort((a, b) => '${a['nom']}'.compareTo('${b['nom']}'));

    final payments = await _supabase.from('payments_history').select();

    final feeIds = fees.map((f) => f['id']).toSet();
    final currentYearPayments =
        payments.where((p) => feeIds.contains(p['fee_id'])).toList();

    double totalExpectedGlobally = 0;
    for (final fee in fees) {
      final amount = double.parse(fee['amount'].toString());
      totalExpectedGlobally += amount * students.length;
    }

    double totalReceivedGlobally = 0;
    for (final p in currentYearPayments) {
      totalReceivedGlobally += double.parse(p['amount_paid'].toString());
    }

    final studentReports = <Map<String, dynamic>>[];

    for (final student in students) {
      final sId = student['id'];
      final studentPayments =
          currentYearPayments.where((p) => p['student_id'] == sId).toList();

      double studentExpected = 0;
      for (final f in fees) {
        studentExpected += double.parse(f['amount'].toString());
      }

      double studentPaid = 0;
      for (final p in studentPayments) {
        studentPaid += double.parse(p['amount_paid'].toString());
      }

      studentReports.add({
        ...student,
        'total_expected': studentExpected,
        'total_paid': studentPaid,
        'remaining': studentExpected - studentPaid,
        'is_solde': studentPaid >= studentExpected,
      });
    }

    return {
      'global': {
        'total_students': students.length,
        'total_expected': totalExpectedGlobally,
        'total_received': totalReceivedGlobally,
        'total_remaining': totalExpectedGlobally - totalReceivedGlobally,
      },
      'students': studentReports,
    };
  }
}
