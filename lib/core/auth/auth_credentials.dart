import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

/// E-mail normalisé (minuscules) pour éviter les échecs de connexion après invitation.
String normalizeAuthEmail(String email) => email.trim().toLowerCase();

/// Mot de passe tel que saisi (pas de trim — espaces éventuellement significatifs).
String normalizeAuthPassword(String password) => password;

/// URL de retour après confirmation e-mail (dashboard Supabase → Redirect URLs).
String? authEmailRedirectUrl() {
  final fromEnv = dotenv.env['INVITE_BASE_URL']?.trim();
  if (fromEnv != null && fromEnv.isNotEmpty) {
    return '${fromEnv.replaceAll(RegExp(r'/$'), '')}/login';
  }
  if (kIsWeb) {
    try {
      final origin = Uri.base.origin;
      if (origin.isNotEmpty) return '$origin/login';
    } catch (_) {}
  }
  return null;
}
