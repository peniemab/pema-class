import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final invitationsRepositoryProvider = Provider<InvitationsRepository>((ref) {
  return InvitationsRepository(Supabase.instance.client);
});

final isPlatformAdminProvider = FutureProvider<bool>((ref) async {
  final uid = Supabase.instance.client.auth.currentUser?.id;
  if (uid == null) return false;
  final row = await Supabase.instance.client.from('platform_admins').select('user_id').eq('user_id', uid).maybeSingle();
  return row != null;
});

final isSchoolAdminProvider = FutureProvider<bool>((ref) async {
  final uid = Supabase.instance.client.auth.currentUser?.id;
  if (uid == null) return false;
  final row = await Supabase.instance.client.from('staff').select('role').eq('user_id', uid).maybeSingle();
  final r = row?['role'] as String?;
  return r == 'admin' || r == 'director';
});

class InvitationsRepository {
  final SupabaseClient _client;
  InvitationsRepository(this._client);

  Future<Map<String, dynamic>> peekInvitation(String token) async {
    final res = await _client.rpc('peek_invitation', params: {'p_token': token});
    if (res is Map<String, dynamic>) return res;
    if (res is Map) return Map<String, dynamic>.from(res);
    return {'ok': false, 'reason': 'unknown'};
  }

  Future<String> createSchoolInvitation() async {
    final res = await _client.rpc('create_school_invitation');
    return res as String;
  }

  Future<String> createStaffInvitation(String role) async {
    final res = await _client.rpc('create_staff_invitation', params: {'p_role': role});
    return res as String;
  }

  Future<void> acceptSchoolInvitation({
    required String token,
    required String schoolName,
    required String schoolAddress,
    required String adminName,
    String schoolType = 'primary',
  }) async {
    await _client.rpc(
      'accept_school_invitation',
      params: {
        'p_token': token,
        'p_school_name': schoolName,
        'p_school_address': schoolAddress,
        'p_admin_name': adminName,
        'p_school_type': schoolType,
      },
    );
  }

  /// [firstName] / [lastName] optionnels : côté SQL, dérivation depuis `auth.users` si vides (compte existant).
  Future<void> acceptStaffInvitation({
    required String token,
    String? firstName,
    String? lastName,
  }) async {
    await _client.rpc(
      'accept_staff_invitation',
      params: {
        'p_token': token,
        'p_first_name': firstName,
        'p_last_name': lastName,
      },
    );
  }

  Future<List<Map<String, dynamic>>> listRecentSchoolInvites({int limit = 20}) async {
    return _client
        .from('invitations')
        .select()
        .eq('invite_type', 'school_setup')
        .order('created_at', ascending: false)
        .limit(limit);
  }
}
