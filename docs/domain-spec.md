# Spécification métier (ex-Flutter → PWA Next.js)

Référence pour réimplémenter les écrans dans `web-app/`. Backend inchangé : `supabase/migrations/`.

## Modules

| Module | Tables / API | Notes |
|--------|----------------|-------|
| Auth | Supabase Auth + `staff` | E-mail confirmé obligatoire ; messages FR |
| Annuaire | `students`, `student_classes`, `classes` | Filtre par classe, recherche nom/matricule |
| Inscription | `students`, `student_classes`, `student_emergency_contacts` | Classe obligatoire ; matricule provisoire `MAT-P-…` hors ligne |
| Caisse | `fees`, `payments_history` | Par année scolaire (libellé texte) ; reçu `REC-{uuid}` |
| Impayés | rapport agrégé frais / paiements | |
| Paramètres | `classes`, `fees`, Storage logo | Admin |
| Invitations | RPC / tables invitations | École + staff |

## Hors ligne (local-first)

1. **Pull** (en ligne) : classes + élèves + frais + paiements → cache local (Drift → **Dexie**).
2. **Outbox** : `register_student`, `pay_fee` ; retry backoff ; idempotence `23505` = succès.
3. **Inscription** : payload avec `class_id` + `classe_assignee` (nom) ; élève optimiste `id` = id mutation outbox.
4. **Paiement** : si `MAT-P-…`, file d’attente ; résolution `student_id` par matricule à la sync.
5. **Purge brouillons** : après sync, retirer `MAT-P-…` du cache si élève présent sur serveur.
6. **École hors ligne** : `school_id` depuis dernier sync state, pas d’appel `staff` sans réseau.

## Règles caisse

- Ne pas encaisser si `remaining <= 0`.
- Fusionner paiements local + serveur par `receipt_number` (éviter double comptage).
- Reçu PDF après chaque encaissement réussi.

## Variables d’environnement

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
