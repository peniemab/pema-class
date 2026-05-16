import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/connectivity_providers.dart';
import '../../../core/outbox/outbox_mutation_type.dart';
import '../../../core/outbox/outbox_providers.dart';
import '../../../core/outbox/outbox_repository.dart';
import '../../../core/outbox/remote_mutations.dart';

final admissionRepositoryProvider = Provider<AdmissionRepository>((ref) {
  return AdmissionRepository(
    ref.watch(remoteMutationsProvider),
    ref.watch(outboxRepositoryProvider),
  );
});

class AdmissionRepository {
  AdmissionRepository(this._remote, this._outbox);

  final RemoteMutations _remote;
  final OutboxRepository _outbox;

  Future<Map<String, dynamic>> registerStudent({
    required String nom,
    required String prenom,
    required String sexe,
    required String lieuNaissance,
    required String dateNaissance,
    required String classeAssignee,
    required String ecoleProvenance,
    required String tuteurNom,
    required String lienParente,
    required String tuteurPhone,
    required String tuteurAdresse,
    required String urgenceContact,
    required String urgenceMaladie,
  }) async {
    final mutationId = _outbox.newMutationId();
    final matricule = provisionalMatriculeForAdmission(mutationId);

    final payload = <String, dynamic>{
      'nom': nom,
      'prenom': prenom,
      'sexe': sexe,
      'lieu_naissance': lieuNaissance,
      'date_naissance': dateNaissance,
      'classe_assignee': classeAssignee,
      'ecole_provenance': ecoleProvenance,
      'tuteur_nom': tuteurNom,
      'lien_parente': lienParente,
      'tuteur_phone': tuteurPhone,
      'tuteur_adresse': tuteurAdresse,
      'urgence_contact': urgenceContact,
      'urgence_maladie': urgenceMaladie,
      'matricule': matricule,
    };

    final connectivity = await Connectivity().checkConnectivity();
    if (connectionLayerOnline(connectivity)) {
      try {
        return await _remote.registerStudent(payload);
      } catch (_) {
        // Réseau instable : bascule file d’attente.
      }
    }

    await _outbox.enqueue(
      idempotencyKey: mutationId,
      operationType: OutboxMutationType.registerStudent,
      payload: payload,
    );

    return {
      'matricule': matricule,
      'classe_assignee': classeAssignee,
      'queued': true,
    };
  }
}
