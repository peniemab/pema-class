import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../database/database_provider.dart';
import 'outbox_status.dart';

class OutboxUiState {
  const OutboxUiState({
    this.pending = 0,
    this.failed = 0,
    this.lastError,
  });

  final int pending;
  final int failed;
  final String? lastError;

  int get totalActionable => pending + failed;
}

final outboxUiStateProvider = StreamProvider<OutboxUiState>((ref) {
  final db = ref.watch(appDatabaseProvider);
  return db.watchOutboxMutations().map((rows) {
    final pending = rows
        .where(
          (r) =>
              r.status == OutboxStatus.pending ||
              r.status == OutboxStatus.processing,
        )
        .length;
    final failed =
        rows.where((r) => r.status == OutboxStatus.failed).length;
    String? lastFailed;
    for (final r in rows) {
      if (r.status == OutboxStatus.failed &&
          r.lastError != null &&
          r.lastError!.isNotEmpty) {
        lastFailed = r.lastError;
      }
    }
    return OutboxUiState(
      pending: pending,
      failed: failed,
      lastError: lastFailed,
    );
  });
});
