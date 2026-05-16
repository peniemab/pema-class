import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../auth/auth_session_service.dart';
import '../database/database_provider.dart';
import '../../features/auth/data/auth_repository.dart';
import '../../features/settings/data/settings_repository.dart';
import '../network/connectivity_providers.dart';
import '../sync/sync_providers.dart';
import 'mutation_executor.dart';
import 'outbox_repository.dart';
import 'outbox_worker.dart';
import 'remote_mutations.dart';

final outboxRepositoryProvider = Provider<OutboxRepository>((ref) {
  return OutboxRepository(ref.watch(appDatabaseProvider));
});

final remoteMutationsProvider = Provider<RemoteMutations>((ref) {
  return RemoteMutations(
    ref.watch(supabaseClientProvider),
    ref.watch(settingsRepositoryProvider),
  );
});

final mutationExecutorProvider = Provider<MutationExecutor>((ref) {
  return MutationExecutor(
    ref.watch(remoteMutationsProvider),
    ref.watch(outboxRepositoryProvider),
  );
});

final outboxWorkerProvider = Provider<OutboxWorker>((ref) {
  return OutboxWorker(
    db: ref.watch(appDatabaseProvider),
    outboxRepo: ref.watch(outboxRepositoryProvider),
    executor: ref.watch(mutationExecutorProvider),
    authSession: ref.watch(authSessionServiceProvider),
    syncEngine: ref.watch(syncEngineProvider),
  );
});

final pendingOutboxCountProvider = StreamProvider<int>((ref) {
  return ref.watch(outboxRepositoryProvider).watchPendingCount();
});

/// Redirection login si session expirée pendant un push outbox.
class AuthSessionExpiredListener extends ConsumerWidget {
  const AuthSessionExpiredListener({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen(sessionExpiredProvider, (previous, next) {
      if (next.expired && previous?.expired != true) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!context.mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                next.reason ??
                    'Session expirée. Reconnectez-vous pour synchroniser les écritures en attente.',
              ),
              duration: const Duration(seconds: 8),
            ),
          );
          GoRouter.of(context).go('/login');
        });
      }
    });
    return child;
  }
}

/// Déclenche le worker push (reprise + retour réseau).
class OutboxLifecycleListener extends ConsumerStatefulWidget {
  const OutboxLifecycleListener({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<OutboxLifecycleListener> createState() =>
      _OutboxLifecycleListenerState();
}

class _OutboxLifecycleListenerState extends ConsumerState<OutboxLifecycleListener>
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

  void _flush() {
    ref.read(outboxWorkerProvider).flush();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _flush();
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(connectivityResultsProvider, (previous, next) {
      next.whenData((results) {
        final online = connectionLayerOnline(results);
        if (online && _wasOffline) {
          _flush();
        }
        _wasOffline = !online;
      });
    });
    return widget.child;
  }
}
