import 'package:supabase_flutter/supabase_flutter.dart';

/// Messages utilisateur pour les erreurs Auth (invitation + login).
String authErrorMessage(Object error) {
  if (error is AuthException) {
    final code = (error.code ?? '').toLowerCase();
    final msg = error.message.toLowerCase();

    if (code == 'email_not_confirmed' ||
        msg.contains('email not confirmed') ||
        msg.contains('email_not_confirmed')) {
      return 'Compte non confirmé. Ouvrez le lien dans l’e-mail envoyé par Supabase '
          '(vérifiez les spams), puis reconnectez-vous avec le même e-mail et mot de passe '
          'que sur l’écran d’invitation.';
    }

    if (code == 'invalid_credentials' ||
        msg.contains('invalid login credentials') ||
        msg.contains('invalid_credentials')) {
      return 'E-mail ou mot de passe incorrect. Utilisez exactement l’e-mail et le mot de passe '
          'saisis lors de l’invitation. Si vous venez de créer le compte, confirmez d’abord l’e-mail reçu.';
    }

    if (code == 'user_already_registered' ||
        msg.contains('user already registered') ||
        msg.contains('already been registered')) {
      return 'Cet e-mail est déjà inscrit. Sur l’invitation, choisissez « Compte existant » '
          'ou connectez-vous depuis l’écran de connexion.';
    }

    if (code == 'signup_disabled' || msg.contains('signup disabled')) {
      return 'Les inscriptions sont désactivées sur ce projet. Contactez l’administrateur.';
    }

    if (msg.contains('rate limit') || code == 'over_request_rate_limit') {
      return 'Trop de tentatives. Patientez une minute puis réessayez.';
    }

    return error.message;
  }

  final text = error.toString();
  if (text.contains('Failed host lookup') || text.contains('SocketException')) {
    return 'Pas de connexion au serveur. Vérifiez votre réseau.';
  }

  return 'Erreur : $error';
}

bool isEmailNotConfirmedError(Object error) {
  if (error is! AuthException) return false;
  final code = (error.code ?? '').toLowerCase();
  final msg = error.message.toLowerCase();
  return code == 'email_not_confirmed' ||
      msg.contains('email not confirmed') ||
      msg.contains('email_not_confirmed');
}
