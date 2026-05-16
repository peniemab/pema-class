import 'package:supabase_flutter/supabase_flutter.dart';

import 'outbox_mutation_type.dart';

/// Règles minimales v1 (L-20) : auth, doublons, abandon.
abstract final class IdempotencyPolicy {
  static const maxAttempts = 8;

  static bool isAuthError(Object error) {
    if (error is AuthException) return true;
    if (error is PostgrestException) {
      final code = error.code ?? '';
      if (code == '401' || code == '403') return true;
      final msg = error.message.toLowerCase();
      if (msg.contains('jwt') && (msg.contains('expired') || msg.contains('invalid'))) {
        return true;
      }
    }
    final text = error.toString().toLowerCase();
    return text.contains('jwt expired') ||
        text.contains('invalid jwt') ||
        text.contains('not authenticated');
  }

  /// Conflit serveur traité comme succès (retry idempotent).
  static bool shouldTreatAsCompleted({
    required String operationType,
    required Object error,
  }) {
    if (error is! PostgrestException) return false;
    final code = error.code ?? '';
    // unique_violation
    if (code != '23505') return false;

    if (operationType == OutboxMutationType.registerStudent ||
        operationType == OutboxMutationType.payFee) {
      return true;
    }
    return false;
  }

  static Duration backoffForAttempt(int attemptCount) {
    final seconds = 5 * (1 << attemptCount.clamp(0, 6));
    return Duration(seconds: seconds.clamp(5, 300));
  }
}
