import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Si l’inscription n’a pas de session (confirmation e-mail Supabase), on garde le token
/// et l’identité localement, puis on appelle `accept_staff_invitation` après la première connexion.
class PendingStaffInviteStorage {
  static const _token = 'pending_staff_invite_token';
  static const _firstName = 'pending_staff_invite_first_name';
  static const _lastName = 'pending_staff_invite_last_name';

  static Future<void> save({
    required String token,
    required String firstName,
    required String lastName,
  }) async {
    final p = await SharedPreferences.getInstance();
    await p.setString(_token, token);
    await p.setString(_firstName, firstName);
    await p.setString(_lastName, lastName);
  }

  static Future<void> clear() async {
    final p = await SharedPreferences.getInstance();
    await p.remove(_token);
    await p.remove(_firstName);
    await p.remove(_lastName);
  }

  /// Après connexion : si une invitation personnel était en attente, rattache l’utilisateur à l’école.
  static Future<bool> tryCompleteAfterSignIn(SupabaseClient client) async {
    final p = await SharedPreferences.getInstance();
    final token = p.getString(_token);
    if (token == null || token.isEmpty) return false;

    final firstName = p.getString(_firstName);
    final lastName = p.getString(_lastName);
    if (firstName == null || lastName == null) {
      await clear();
      return false;
    }

    try {
      await client.rpc(
        'accept_staff_invitation',
        params: {
          'p_token': token,
          'p_first_name': firstName,
          'p_last_name': lastName,
        },
      );
      await clear();
      return true;
    } catch (e) {
      final msg = e.toString();
      if (msg.contains('already_member')) {
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
