import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/sync/sync_providers.dart';

/// Salles pour l’inscription : Drift local (hors ligne après au moins un pull en ligne).
final admissionClassroomsProvider = Provider<AsyncValue<List<Map<String, dynamic>>>>(
  (ref) {
    return ref.watch(localClassesStreamProvider).when(
          data: (rows) => AsyncData(
            rows.map((c) => {'id': c.id, 'name': c.name}).toList(),
          ),
          loading: () => const AsyncLoading(),
          error: (e, st) => AsyncError(e, st),
        );
  },
);
