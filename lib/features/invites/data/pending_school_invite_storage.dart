import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Quand Supabase exige la confirmation e-mail, il n’y a pas de session tout de suite :
/// on garde le token + infos école localement, puis on appelle `accept_school_invitation`
/// après la première connexion réussie.
class PendingSchoolInviteStorage {
  static const _token = 'pending_school_invite_token';
  static const _schoolName = 'pending_school_invite_school_name';
  static const _schoolAddress = 'pending_school_invite_school_address';
  static const _adminName = 'pending_school_invite_admin_name';

  static Future<void> save({
    required String token,
    required String schoolName,
    required String schoolAddress,
    required String adminName,
  }) async {
    final p = await SharedPreferences.getInstance();
    await p.setString(_token, token);
    await p.setString(_schoolName, schoolName);
    await p.setString(_schoolAddress, schoolAddress);
    await p.setString(_adminName, adminName);
  }

  static Future<void> clear() async {
    final p = await SharedPreferences.getInstance();
    await p.remove(_token);
    await p.remove(_schoolName);
    await p.remove(_schoolAddress);
    await p.remove(_adminName);
  }

  /// Après connexion : si une invitation école était en attente, finalise la création.
  /// Retourne `true` si une invitation a été traitée avec succès.
  static Future<bool> tryCompleteAfterSignIn(SupabaseClient client) async {
    final p = await SharedPreferences.getInstance();
    final token = p.getString(_token);
    if (token == null || token.isEmpty) return false;

    final schoolName = p.getString(_schoolName);
    final schoolAddress = p.getString(_schoolAddress) ?? '';
    final adminName = p.getString(_adminName);
    if (schoolName == null || adminName == null) {
      await clear();
      return false;
    }

    try {
      await client.rpc(
        'accept_school_invitation',
        params: {
          'p_token': token,
          'p_school_name': schoolName,
          'p_school_address': schoolAddress,
          'p_admin_name': adminName,
          'p_school_type': 'primary',
        },
      );
      await clear();
      return true;
    } catch (e) {
      final msg = e.toString();
      if (msg.contains('already_has_school') || msg.contains('already_member')) {
        await clear();
        return false;
      }
      if (msg.contains('invalid_or_used_invitation') || msg.contains('invitation_expired')) {
        await clear();
      }
      rethrow;
    }
  }
}
