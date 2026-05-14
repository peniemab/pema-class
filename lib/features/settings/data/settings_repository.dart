import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/supabase/tenant_context.dart';

final settingsRepositoryProvider = Provider<SettingsRepository>((ref) {
  return SettingsRepository(Supabase.instance.client);
});

class SettingsRepository {
  final SupabaseClient _supabase;
  SettingsRepository(this._supabase);

  Future<String> _schoolId() => _supabase.requireSchoolId();

  Future<String> getActiveAcademicYearName() async {
    final schoolId = await _schoolId();
    final active = await _supabase
        .from('academic_years')
        .select('name')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .maybeSingle();
    if (active != null && active['name'] != null) {
      return active['name'] as String;
    }
    final latest = await _supabase
        .from('academic_years')
        .select('name')
        .eq('school_id', schoolId)
        .order('start_date', ascending: false)
        .limit(1)
        .maybeSingle();
    return latest?['name'] as String? ?? '${DateTime.now().year}-${DateTime.now().year + 1}';
  }

  Future<String> getActiveAcademicYearId() async {
    final schoolId = await _schoolId();
    final active = await _supabase
        .from('academic_years')
        .select('id')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .maybeSingle();
    if (active != null) return active['id'] as String;
    final latest = await _supabase
        .from('academic_years')
        .select('id')
        .eq('school_id', schoolId)
        .order('start_date', ascending: false)
        .limit(1)
        .maybeSingle();
    if (latest == null) {
      throw Exception('Aucune année scolaire. Complétez l’onboarding ou créez une année.');
    }
    return latest['id'] as String;
  }

  Future<List<Map<String, dynamic>>> getClassrooms() async {
    final schoolId = await _schoolId();
    final yearId = await getActiveAcademicYearId();
    return _supabase
        .from('classes')
        .select()
        .eq('school_id', schoolId)
        .eq('academic_year_id', yearId)
        .order('name');
  }

  Future<void> addClassroom(String name) async {
    final schoolId = await _schoolId();
    final yearId = await getActiveAcademicYearId();
    final trimmed = name.trim();
    await _supabase.from('classes').insert({
      'school_id': schoolId,
      'academic_year_id': yearId,
      'name': trimmed,
      'level': trimmed,
    });
  }

  Future<void> deleteClassroom(String id) async {
    await _supabase.from('classes').delete().eq('id', id);
  }

  Future<List<Map<String, dynamic>>> getFees(String academicYear) async {
    final schoolId = await _schoolId();
    return _supabase
        .from('fees')
        .select()
        .eq('school_id', schoolId)
        .eq('academic_year', academicYear)
        .order('name');
  }

  Future<void> addFee({
    required String name,
    required double amount,
    required String academicYear,
  }) async {
    final schoolId = await _schoolId();
    await _supabase.from('fees').insert({
      'school_id': schoolId,
      'name': name,
      'amount': amount,
      'academic_year': academicYear,
    });
  }

  Future<void> deleteFee(String id) async {
    await _supabase.from('fees').delete().eq('id', id);
  }

  Future<String> uploadLogo(Uint8List fileBytes, String fileName) async {
    final schoolId = await _schoolId();
    final ext = fileName.split('.').last.toLowerCase();
    final filePath = '$schoolId/logo.${DateTime.now().millisecondsSinceEpoch}.$ext';

    var mimeType = 'image/png';
    if (ext == 'jpg' || ext == 'jpeg') {
      mimeType = 'image/jpeg';
    } else if (ext == 'webp') {
      mimeType = 'image/webp';
    } else if (ext == 'gif') {
      mimeType = 'image/gif';
    }

    await _supabase.storage.from('logos').uploadBinary(
      filePath,
      fileBytes,
      fileOptions: FileOptions(contentType: mimeType, upsert: true),
    );

    final publicUrl = _supabase.storage.from('logos').getPublicUrl(filePath);
    await _supabase.from('schools').update({'logo_url': publicUrl}).eq('id', schoolId);

    return publicUrl;
  }

  Future<String?> getLogoUrl() async {
    final schoolId = await _schoolId();
    final row = await _supabase.from('schools').select('logo_url').eq('id', schoolId).single();
    return row['logo_url'] as String?;
  }
}
