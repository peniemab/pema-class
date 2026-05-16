import '../database/app_database.dart';
import 'outbox_mutation_type.dart';
import 'outbox_repository.dart';
import 'remote_mutations.dart';

class MutationExecutor {
  MutationExecutor(this._remote, this._outboxRepo);

  final RemoteMutations _remote;
  final OutboxRepository _outboxRepo;

  Future<Map<String, dynamic>> execute(OutboxMutation row) async {
    final payload = _outboxRepo.decodePayload(row);
    switch (row.operationType) {
      case OutboxMutationType.registerStudent:
        return _remote.registerStudent(payload);
      case OutboxMutationType.payFee:
        return _remote.payFee(payload);
      default:
        throw UnsupportedError(
          'Type de mutation non pris en charge : ${row.operationType}',
        );
    }
  }
}
