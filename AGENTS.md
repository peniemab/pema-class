# Contexte pour les agents (Cursor / IA)

## Produit

- **School SaaS** : portail de gestion scolaire (inscription, caisse / paiements, liste élèves + filtre par classe, impayés, dashboard, paramètres).
- **Backend** : Supabase (Auth, Postgres, Storage). Migrations SQL dans `supabase/migrations/`.
- **App** : Flutter, Riverpod, GoRouter, Material 3.

## Objectifs produit importants

- **Résilience réseau** (ex. usage en RDC / connexion instable) : viser une app **local-first** (cache local, file d’attente des écritures, sync au retour en ligne). Milestones discutés : M1 (socle Drift + connexion + UX hors ligne) → M2 (pull sync, élèves en premier), etc.
- Cibles **Web + Android + iOS** (Flutter multi-plateforme).

## Langue

- Réponses et messages UI en **français** sauf demande contraire.

## Git — règle stricte

- **Ne pas** exécuter `git commit`, `git push`, `git pull --rebase`, `git push --force` ni réécrire l’historique **sans demande explicite** de l’utilisateur.
- Proposer les commandes ou les changements de fichiers ; **l’utilisateur** valide et pousse lui-même.

## Secrets et fichiers locaux

- Ne jamais committer `.env`, `test/.env.test`, clés Supabase, ni secrets CI.
- `README` / doc : ne pas en ajouter si l’utilisateur ne le demande pas.

## Style de travail

- Lire le code existant avant de modifier ; rester **ciblé** sur la tâche (pas de refactor gratuit).
- Après changements : `flutter analyze` / `dart analyze` sur les fichiers touchés quand c’est pertinent ; ne pas imposer de gros nettoyage global sans accord.

## Copie de ce fichier

Ce dépôt peut être une copie de travail : recopier **`AGENTS.md`** à la racine du dépôt principal (ex. **pema-class**) pour que le même contexte s’applique dans une nouvelle fenêtre Cursor.
