/// Statuts d’une mutation outbox (M3).
abstract final class OutboxStatus {
  static const pending = 'pending';
  static const processing = 'processing';
  static const completed = 'completed';
  static const failed = 'failed';
  static const blockedAuth = 'blocked_auth';
}
