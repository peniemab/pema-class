import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../network/connectivity_providers.dart';
import '../../features/auth/data/auth_repository.dart';

/// Session locale + expiration (L-21).
class AuthSessionService {
  AuthSessionService(
    this._supabase, {
    void Function(String reason)? onSessionExpired,
  }) : _onSessionExpired = onSessionExpired;

  final SupabaseClient _supabase;
  final void Function(String reason)? _onSessionExpired;

  bool get hasLocalSession => _supabase.auth.currentSession != null;

  Future<bool> canAttemptOnlineAuth() async {
    final results = await Connectivity().checkConnectivity();
    return connectionLayerOnline(results);
  }

  void markSessionExpired({required String reason}) {
    debugPrint('AuthSessionService: session expirée — $reason');
    _onSessionExpired?.call(reason);
  }

  Future<void> handleExpiredSession({bool signOut = true}) async {
    markSessionExpired(reason: 'Session expirée');
    if (signOut) {
      try {
        await _supabase.auth.signOut();
      } catch (_) {}
    }
  }
}

class SessionExpiredState {
  const SessionExpiredState({this.expired = false, this.reason});

  final bool expired;
  final String? reason;
}

class SessionExpiredNotifier extends Notifier<SessionExpiredState> {
  @override
  SessionExpiredState build() => const SessionExpiredState();

  void markExpired(String reason) {
    state = SessionExpiredState(expired: true, reason: reason);
  }

  void clear() {
    state = const SessionExpiredState();
  }
}

final sessionExpiredProvider =
    NotifierProvider<SessionExpiredNotifier, SessionExpiredState>(
  SessionExpiredNotifier.new,
);

final authSessionServiceProvider = Provider<AuthSessionService>((ref) {
  return AuthSessionService(
    ref.watch(supabaseClientProvider),
    onSessionExpired: (reason) {
      ref.read(sessionExpiredProvider.notifier).markExpired(reason);
    },
  );
});
