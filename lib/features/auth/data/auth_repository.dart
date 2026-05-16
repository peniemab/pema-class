import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/auth/auth_credentials.dart';

final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(supabaseClientProvider));
});

class AuthRepository {
  final SupabaseClient _supabase;

  AuthRepository(this._supabase);

  Future<void> signIn({required String email, required String password}) async {
    await _supabase.auth.signInWithPassword(
      email: normalizeAuthEmail(email),
      password: normalizeAuthPassword(password),
    );
  }

  Future<AuthResponse> signUpWithEmail({
    required String email,
    required String password,
  }) async {
    final redirect = authEmailRedirectUrl();
    return _supabase.auth.signUp(
      email: normalizeAuthEmail(email),
      password: normalizeAuthPassword(password),
      emailRedirectTo: redirect,
    );
  }

  /// Renvoie l’e-mail de confirmation (après inscription sans session).
  Future<void> resendSignupConfirmation(String email) async {
    final redirect = authEmailRedirectUrl();
    await _supabase.auth.resend(
      type: OtpType.signup,
      email: normalizeAuthEmail(email),
      emailRedirectTo: redirect,
    );
  }

  /// Inscription Auth seule (sans création d'école — utiliser les liens d'invitation).
  Future<void> signUp({
    required String schoolName,
    required String schoolAddress,
    required String adminName,
    required String email,
    required String password,
  }) async {
    await signUpWithEmail(email: email, password: password);
  }

  Future<void> signOut() async {
    await _supabase.auth.signOut();
  }

  Future<String> checkUserStatus() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return 'unauthenticated';

    try {
      final staffRow = await _supabase
          .from('staff')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

      if (staffRow != null) {
        return 'active';
      }

      final plat = await _supabase
          .from('platform_admins')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle();

      if (plat != null) {
        return 'platform_admin';
      }

      return 'needs_onboarding';
    } catch (e) {
      return 'error';
    }
  }
}
