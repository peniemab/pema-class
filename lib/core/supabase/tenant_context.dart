import 'package:supabase_flutter/supabase_flutter.dart';

extension TenantContext on SupabaseClient {
  Future<String> requireSchoolId() async {
    final uid = auth.currentUser?.id;
    if (uid == null) throw Exception('Non authentifié');
    final row = await from('staff').select('school_id').eq('user_id', uid).maybeSingle();
    final id = row?['school_id'] as String?;
    if (id == null) throw Exception('Aucune école liée à ce compte (staff).');
    return id;
  }

  Future<String?> schoolNameForCurrentUser() async {
    final uid = auth.currentUser?.id;
    if (uid == null) return null;
    final row = await from('staff').select('school_id, schools(name)').eq('user_id', uid).maybeSingle();
    final nested = row?['schools'];
    if (nested is Map && nested['name'] != null) {
      return nested['name'] as String;
    }
    return null;
  }
}
