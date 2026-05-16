import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../database/app_database.dart';
import '../database/database_provider.dart';
import '../network/connectivity_providers.dart';
import '../supabase/tenant_context.dart';
import '../../features/auth/data/auth_repository.dart';
import '../../features/settings/data/settings_repository.dart';
import 'directory_scope.dart';
import 'students_pull_sync.dart';
import 'sync_engine.dart';

final studentsPullSyncProvider = Provider<StudentsPullSync>((ref) {
  return StudentsPullSync(
    ref.watch(supabaseClientProvider),
    ref.watch(settingsRepositoryProvider),
    ref.watch(appDatabaseProvider),
  );
});

final syncEngineProvider = Provider<SyncEngine>((ref) {
  return SyncEngine(
    studentsPull: ref.watch(studentsPullSyncProvider),
    supabase: ref.watch(supabaseClientProvider),
  );
});

/// Scope annuaire : Supabase si possible, sinon dernier pull Drift.
final directoryScopeProvider = FutureProvider<DirectoryScope?>((ref) async {
  final supabase = ref.watch(supabaseClientProvider);
  if (supabase.auth.currentUser == null) return null;

  try {
    final schoolId = await supabase.requireSchoolId();
    final settings = ref.watch(settingsRepositoryProvider);
    final yearId = await settings.getActiveAcademicYearId();
    final yearName = await settings.getActiveAcademicYearName();
    return DirectoryScope(
      schoolId: schoolId,
      academicYearId: yearId,
      academicYearName: yearName,
    );
  } catch (_) {
    final db = ref.watch(appDatabaseProvider);
    final state = await db.getSyncState(syncStateStudentsPullKey);
    if (state == null) return null;
    return DirectoryScope(
      schoolId: state.schoolId,
      academicYearId: state.academicYearId,
      academicYearName: state.academicYearName ?? '—',
    );
  }
});

final studentsDirectoryStreamProvider =
    StreamProvider<List<LocalStudent>>((ref) async* {
  final scope = await ref.watch(directoryScopeProvider.future);
  if (scope == null) {
    yield [];
    return;
  }
  final db = ref.watch(appDatabaseProvider);
  yield* db.watchStudents(
    schoolId: scope.schoolId,
    academicYearId: scope.academicYearId,
  );
});

final localClassesStreamProvider =
    StreamProvider<List<LocalClassesData>>((ref) async* {
  final scope = await ref.watch(directoryScopeProvider.future);
  if (scope == null) {
    yield [];
    return;
  }
  final db = ref.watch(appDatabaseProvider);
  yield* db.watchClasses(
    schoolId: scope.schoolId,
    academicYearId: scope.academicYearId,
  );
});

final directoryLastSyncedAtProvider = FutureProvider<DateTime?>((ref) async {
  final db = ref.watch(appDatabaseProvider);
  final state = await db.getSyncState(syncStateStudentsPullKey);
  return state?.lastSyncedAt;
});

/// Déclenche un pull manuel (bouton actualiser).
final pullStudentsDirectoryProvider =
    FutureProvider.autoDispose.family<DirectoryPullResult?, bool>(
  (ref, _) async {
    return ref.read(syncEngineProvider).pullStudentsDirectory(force: true);
  },
);

/// Écoute reprise app + retour réseau (L-04).
class SyncLifecycleListener extends ConsumerStatefulWidget {
  const SyncLifecycleListener({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<SyncLifecycleListener> createState() =>
      _SyncLifecycleListenerState();
}

class _SyncLifecycleListenerState extends ConsumerState<SyncLifecycleListener>
    with WidgetsBindingObserver {
  bool _wasOffline = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.read(syncEngineProvider).onAppResumed();
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(connectivityResultsProvider, (previous, next) {
      next.whenData((results) {
        final online = connectionLayerOnline(results);
        if (online && _wasOffline) {
          ref.read(syncEngineProvider).onConnectivityRestored();
        }
        _wasOffline = !online;
      });
    });

    return widget.child;
  }
}
