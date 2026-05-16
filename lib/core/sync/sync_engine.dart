import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../network/connectivity_providers.dart';
import 'students_pull_sync.dart';

/// Moteur de sync lecture (pull) — M2 / L-04.
class SyncEngine {
  SyncEngine({
    required StudentsPullSync studentsPull,
    required SupabaseClient supabase,
  })  : _studentsPull = studentsPull,
        _supabase = supabase;

  final StudentsPullSync _studentsPull;
  final SupabaseClient _supabase;

  bool _studentsPullInFlight = false;

  bool get _hasSession => _supabase.auth.currentUser != null;

  Future<bool> _linkLayerOnline() async {
    final results = await Connectivity().checkConnectivity();
    return connectionLayerOnline(results);
  }

  /// Pull annuaire élèves + classes si session + lien réseau.
  Future<DirectoryPullResult?> pullStudentsDirectory({
    bool force = false,
  }) async {
    if (!_hasSession) return null;
    if (_studentsPullInFlight && !force) return null;

    if (!await _linkLayerOnline()) return null;

    _studentsPullInFlight = true;
    try {
      return await _studentsPull.pull();
    } catch (e, st) {
      debugPrint('SyncEngine.pullStudentsDirectory: $e\n$st');
      rethrow;
    } finally {
      _studentsPullInFlight = false;
    }
  }

  /// Après connexion réussie.
  Future<void> onAfterLogin() => pullStudentsDirectory(force: true);

  /// Reprise app (foreground).
  Future<void> onAppResumed() => pullStudentsDirectory();

  /// Passage hors ligne → en ligne.
  Future<void> onConnectivityRestored() => pullStudentsDirectory();
}
