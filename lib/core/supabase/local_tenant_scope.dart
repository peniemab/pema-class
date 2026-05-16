import 'package:supabase_flutter/supabase_flutter.dart';

import '../database/app_database.dart';
import 'tenant_context.dart';

/// Résout l’école : cache Drift (hors ligne) puis Supabase.
Future<String> resolveSchoolId({
  required AppDatabase db,
  required SupabaseClient supabase,
}) async {
  final state = await db.getSyncState(syncStateStudentsPullKey);
  final cached = state?.schoolId;
  if (cached != null && cached.isNotEmpty) {
    return cached;
  }

  try {
    return await supabase.requireSchoolId();
  } catch (e) {
    throw StateError(
      'Impossible d’identifier l’école hors ligne. Connectez-vous en ligne '
      'et synchronisez l’annuaire (accueil ou liste élèves), puis réessayez.',
    );
  }
}
