import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Profil `staff` de l'utilisateur connecté (établissement courant).
class CurrentStaffProfile {
  const CurrentStaffProfile({
    required this.firstName,
    required this.lastName,
    required this.roleCode,
  });

  final String firstName;
  final String lastName;
  final String roleCode;

  /// Prénom affiché dans la salutation ; sinon chaîne vide.
  String get greetingName {
    final f = firstName.trim();
    if (f.isNotEmpty) return f;
    final l = lastName.trim();
    if (l.isNotEmpty && l != '-') return l;
    return '';
  }

  /// Fragment après « ton portail … » (tutoiement, minuscules).
  String get portailRolePhrase {
    switch (roleCode) {
      case 'admin':
        return 'administratif';
      case 'teacher':
        return 'enseignant';
      case 'director':
        return 'directeur';
      case 'other':
        return 'membre du personnel';
      default:
        return 'établissement';
    }
  }
}

final currentStaffProfileProvider = FutureProvider<CurrentStaffProfile?>((ref) async {
  final uid = Supabase.instance.client.auth.currentUser?.id;
  if (uid == null) return null;

  final row = await Supabase.instance.client
      .from('staff')
      .select('first_name, last_name, role')
      .eq('user_id', uid)
      .maybeSingle();

  if (row == null) return null;

  return CurrentStaffProfile(
    firstName: (row['first_name'] as String?) ?? '',
    lastName: (row['last_name'] as String?) ?? '',
    roleCode: (row['role'] as String?) ?? '',
  );
});
