import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';

import '../auth/auth_session_service.dart';
import '../database/app_database.dart';
import '../sync/sync_engine.dart';
import 'idempotency_policy.dart';
import 'mutation_executor.dart';
import 'outbox_repository.dart';
import 'outbox_flush_result.dart';
import 'outbox_status.dart';

/// Worker push : retry + backoff + statuts (L-05).
class OutboxWorker {
  OutboxWorker({
    required AppDatabase db,
    required OutboxRepository outboxRepo,
    required MutationExecutor executor,
    required AuthSessionService authSession,
    required SyncEngine syncEngine,
  })  : _db = db,
        _outboxRepo = outboxRepo,
        _executor = executor,
        _authSession = authSession,
        _syncEngine = syncEngine;

  final AppDatabase _db;
  final OutboxRepository _outboxRepo;
  final MutationExecutor _executor;
  final AuthSessionService _authSession;
  final SyncEngine _syncEngine;

  bool _running = false;

  Future<OutboxFlushResult> flush() async {
    if (_running) {
      return const OutboxFlushResult(
        processed: 0,
        stillPending: 0,
        failed: 0,
      );
    }
    if (!_authSession.hasLocalSession) {
      return const OutboxFlushResult(
        processed: 0,
        stillPending: 0,
        failed: 0,
      );
    }

    _running = true;
    var processed = 0;
    String? lastError;
    try {
      await _db.resetStuckProcessingOutbox();
      final rows = await _outboxRepo.readyMutations();
      for (final row in rows) {
        if (!_authSession.hasLocalSession) break;

        await _db.updateOutboxMutation(
          row.id,
          OutboxMutationsCompanion(
            status: const Value(OutboxStatus.processing),
          ),
        );

        try {
          await _executor.execute(row);
          await _db.updateOutboxMutation(
            row.id,
            OutboxMutationsCompanion(
              status: const Value(OutboxStatus.completed),
              completedAt: Value(DateTime.now()),
              lastError: const Value(null),
            ),
          );
          processed++;
        } catch (e, st) {
          debugPrint('OutboxWorker mutation ${row.id}: $e\n$st');
          lastError = e.toString();

          if (IdempotencyPolicy.isAuthError(e)) {
            _authSession.markSessionExpired(reason: e.toString());
            await _db.updateOutboxMutation(
              row.id,
              OutboxMutationsCompanion(
                status: const Value(OutboxStatus.blockedAuth),
                lastError: Value(e.toString()),
              ),
            );
            break;
          }

          if (IdempotencyPolicy.shouldTreatAsCompleted(
            operationType: row.operationType,
            error: e,
          )) {
            await _db.updateOutboxMutation(
              row.id,
              OutboxMutationsCompanion(
                status: const Value(OutboxStatus.completed),
                completedAt: Value(DateTime.now()),
                lastError: const Value(null),
              ),
            );
            processed++;
            continue;
          }

          final nextAttempt = row.attemptCount + 1;
          if (nextAttempt >= IdempotencyPolicy.maxAttempts) {
            await _db.updateOutboxMutation(
              row.id,
              OutboxMutationsCompanion(
                status: const Value(OutboxStatus.failed),
                attemptCount: Value(nextAttempt),
                lastError: Value(e.toString()),
              ),
            );
          } else {
            final delay = IdempotencyPolicy.backoffForAttempt(nextAttempt);
            await _db.updateOutboxMutation(
              row.id,
              OutboxMutationsCompanion(
                status: const Value(OutboxStatus.pending),
                attemptCount: Value(nextAttempt),
                nextRetryAt: Value(DateTime.now().add(delay)),
                lastError: Value(e.toString()),
              ),
            );
          }
        }
      }

      if (processed > 0) {
        await _syncEngine.pullStudentsDirectory(force: true);
      }

      final remaining = await (_db.select(_db.outboxMutations)).get();
      final stillPending = remaining
          .where(
            (r) =>
                r.status == OutboxStatus.pending ||
                r.status == OutboxStatus.processing,
          )
          .length;
      final failed =
          remaining.where((r) => r.status == OutboxStatus.failed).length;

      return OutboxFlushResult(
        processed: processed,
        stillPending: stillPending,
        failed: failed,
        lastError: lastError,
      );
    } finally {
      _running = false;
    }
  }
}
