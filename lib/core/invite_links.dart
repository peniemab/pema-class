import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Liens d'invitation (Web : INVITE_BASE_URL ou Uri.base ; mobile : définir INVITE_BASE_URL dans .env).
String buildInviteSchoolUrl(String token) {
  final base = dotenv.env['INVITE_BASE_URL']?.trim();
  if (base != null && base.isNotEmpty) {
    return '${base.replaceAll(RegExp(r'/$'), '')}/invite-school?token=$token';
  }
  try {
    final origin = Uri.base.origin;
    if (origin.isNotEmpty) {
      return '${origin.replaceAll(RegExp(r'/$'), '')}/invite-school?token=$token';
    }
  } catch (_) {}
  return '/invite-school?token=$token';
}

String buildInviteStaffUrl(String token) {
  final base = dotenv.env['INVITE_BASE_URL']?.trim();
  if (base != null && base.isNotEmpty) {
    return '${base.replaceAll(RegExp(r'/$'), '')}/invite-staff?token=$token';
  }
  try {
    final origin = Uri.base.origin;
    if (origin.isNotEmpty) {
      return '${origin.replaceAll(RegExp(r'/$'), '')}/invite-staff?token=$token';
    }
  } catch (_) {}
  return '/invite-staff?token=$token';
}

Future<void> copyInviteToClipboard(BuildContext context, String url) async {
  await Clipboard.setData(ClipboardData(text: url));
  if (context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lien copié dans le presse-papiers')));
  }
}
