# Contexte pour les agents (Cursor / IA)



## Produit



- **School SaaS** : portail de gestion scolaire (inscription, caisse / paiements, liste élèves + filtre par classe, impayés, dashboard, paramètres).

- **Backend** : Supabase (Auth, Postgres, Storage). Migrations SQL dans `supabase/migrations/`.

- **App en transition** : abandon progressif de **Flutter** → **PWA** (web). Le code Flutter dans `lib/` reste la référence métier jusqu’à reprise écran par écran.



## Migration Flutter → PWA (pas à pas)



**Stack cible** : **Next.js 15** (App Router) + TypeScript + React, `@supabase/supabase-js` + `@supabase/ssr`, Dexie (IndexedDB, phases suivantes), PWA via **Serwist**. Code dans **`web-app/`**.



| Phase | Objectif | Flutter |

|-------|----------|---------|

| 0 | Préparer `web-app/`, auth login, manifest PWA | Inchangé (prod) |

| 1 | Liste élèves **lecture seule** en ligne | Inchangé |

| 2 | Sync pull élèves + classes → IndexedDB | Inchangé |

| 3 | Caisse en ligne (recherche matricule, encaissement, reçu) | Inchangé |

| 4 | Inscription + outbox + hors ligne (comme M2/M3 actuels) | Inchangé |

| 5 | Impayés, paramètres, invitations | Flutter déprécié écran par écran |

| 6 | Retirer `lib/` quand parité atteinte | Supprimé |



**Règle** : une phase = une PR ; ne pas casser Supabase ; variables d’env `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans `web-app/.env.local`.



## Objectifs produit importants



- **Résilience réseau** (RDC) : **local-first** (cache IndexedDB, outbox, sync au retour en ligne). Le comportement déjà implémenté en Flutter (Drift, outbox, frais en cache) sert de **spécification** pour la PWA.

- **Cible principale** : **PWA** installable (Chrome / Edge / mobile navigateur). Plus de priorité Android/iOS natifs via Flutter.



## Langue



- Réponses et messages UI en **français** sauf demande contraire.



## Git — règle stricte



- **Ne pas** exécuter `git commit`, `git push`, `git pull --rebase`, `git push --force` ni réécrire l’historique **sans demande explicite** de l’utilisateur.

- Proposer les commandes ou les changements de fichiers ; **l’utilisateur** valide et pousse lui-même.



## Secrets et fichiers locaux



- Ne jamais committer `.env`, `test/.env.test`, clés Supabase, ni secrets CI.

- `README` / doc : ne pas en ajouter si l’utilisateur ne le demande pas.



## Style de travail



- **PWA** (`web-app/`) : `npm run dev` / `npm run build` / `npm run lint` (Next.js).

- **Flutter** (legacy) : ne modifier que si correction bloquante ; sinon prioriser la PWA.

- Lire le code existant avant de modifier ; rester **ciblé** sur la tâche.



## Copie de ce fichier



Recopier **`AGENTS.md`** à la racine du dépôt principal pour toute nouvelle fenêtre Cursor.


