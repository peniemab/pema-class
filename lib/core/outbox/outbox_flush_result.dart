/// Résultat d’un passage du worker push.
class OutboxFlushResult {
  const OutboxFlushResult({
    required this.processed,
    required this.stillPending,
    required this.failed,
    this.lastError,
  });

  final int processed;
  final int stillPending;
  final int failed;
  final String? lastError;

  bool get hasFailures => failed > 0 || (stillPending > 0 && processed == 0);
}
