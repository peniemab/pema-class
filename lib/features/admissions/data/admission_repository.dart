import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/database/app_database.dart';
import '../../../core/database/database_provider.dart';
import '../../../core/network/connectivity_providers.dart';
import '../../../core/outbox/outbox_mutation_type.dart';
import '../../../core/outbox/outbox_providers.dart';
import '../../../core/outbox/outbox_repository.dart';
import '../../../core/outbox/remote_mutations.dart';
import '../../../core/sync/directory_scope.dart';
import '../../../core/sync/sync_engine.dart';
import '../../../core/sync/sync_providers.dart';

final admissionRepositoryProvider = Provider<AdmissionRepository>((ref) {
  return AdmissionRepository(
    ref.watch(remoteMutationsProvider),
    ref.watch(outboxRepositoryProvider),
    ref.watch(appDatabaseProvider),
    ref.watch(syncEngineProvider),
  );
});

class AdmissionRepository {
  AdmissionRepository(
    this._remote,
    this._outbox,
    this._db,
    this._syncEngine,
  );

  final RemoteMutations _remote;
  final OutboxRepository _outbox;
  final AppDatabase _db;
  final SyncEngine _syncEngine;

  static String _genderLabel(String sexe) {
    final s = sexe.toLowerCase();
    if (s.startsWith('mas')) return 'Masculin';
    if (s.startsWith('fé') || s.startsWith('fem')) return 'Féminin';
    return 'Autre';
  }

  Future<DirectoryScope?> _localScope() async {
    final state = await _db.getSyncState(syncStateStudentsPullKey);
    if (state == null) return null;
    return DirectoryScope(
      schoolId: state.schoolId,
      academicYearId: state.academicYearId,
      academicYearName: state.academicYearName ?? '—',
    );
  }

  Future<void> _insertOptimisticStudent({
    required String mutationId,
    required String matricule,
    required String nom,
    required String prenom,
    required String sexe,
    required String lieuNaissance,
    required String dateNaissance,
    required String classeAssignee,
    String? classId,
    required String ecoleProvenance,
  }) async {
    final scope = await _localScope();
    if (scope == null) return;

    await _db.upsertLocalStudent(
      LocalStudentsCompanion(
        id: Value(mutationId),
        schoolId: Value(scope.schoolId),
        academicYearId: Value(scope.academicYearId),
        matricule: Value(matricule),
        firstName: Value(prenom),
        lastName: Value(nom),
        genderLabel: Value(_genderLabel(sexe)),
        birthDate: Value(dateNaissance.isEmpty ? null : dateNaissance),
        lieuNaissance: Value(lieuNaissance.isEmpty ? null : lieuNaissance),
        ecoleProvenance:
            Value(ecoleProvenance.isEmpty ? null : ecoleProvenance),
        classId: Value(classId?.isEmpty ?? true ? null : classId),
        className: Value(classeAssignee.isEmpty ? null : classeAssignee),
      ),
    );
  }

  Future<Map<String, dynamic>> registerStudent({
    required String nom,
    required String prenom,
    required String sexe,
    required String lieuNaissance,
    required String dateNaissance,
    required String classeAssignee,
    String? classId,
    required String ecoleProvenance,
    required String tuteurNom,
    required String lienParente,
    required String tuteurPhone,
    required String tuteurAdresse,
    required String urgenceContact,
    required String urgenceMaladie,
  }) async {
    if (classeAssignee.trim().isEmpty) {
      throw StateError(
        'Choisissez une salle de classe. En hors ligne, ouvrez d’abord l’app '
        'en ligne une fois pour charger les classes, ou synchronisez depuis l’accueil.',
      );
    }

    final mutationId = _outbox.newMutationId();
    final matricule = provisionalMatriculeForAdmission(mutationId);

    final payload = <String, dynamic>{
      'nom': nom,
      'prenom': prenom,
      'sexe': sexe,
      'lieu_naissance': lieuNaissance,
      'date_naissance': dateNaissance,
      'classe_assignee': classeAssignee,
      if (classId != null && classId.isNotEmpty) 'class_id': classId,
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
        final result = await _remote.registerStudent(payload);
        await _syncEngine.pullStudentsDirectory(force: true);
        return result;
      } catch (_) {
        // Réseau instable : bascule file d’attente.
      }
    }

    await _outbox.enqueue(
      idempotencyKey: mutationId,
      operationType: OutboxMutationType.registerStudent,
      payload: payload,
    );

    await _insertOptimisticStudent(
      mutationId: mutationId,
      matricule: matricule,
      nom: nom,
      prenom: prenom,
      sexe: sexe,
      lieuNaissance: lieuNaissance,
      dateNaissance: dateNaissance,
      classeAssignee: classeAssignee,
      classId: classId,
      ecoleProvenance: ecoleProvenance,
    );

    return {
      'matricule': matricule,
      'classe_assignee': classeAssignee,
      'queued': true,
    };
  }
}
