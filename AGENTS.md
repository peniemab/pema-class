# Contexte pour les agents (Cursor / IA)

## Produit

- **Pema Class** : gestion scolaire (inscription, caisse, annuaire élèves, impayés, dashboard, paramètres).
- **Frontend** : PWA **Next.js 15** dans `web-app/` (App Router, TypeScript, React).
- **Backend** : Supabase (`supabase/migrations/`). Pas de Flutter / Dart dans ce dépôt.

## Spécification métier

Voir **`docs/domain-spec.md`** (logique ex-Flutter : outbox, MAT-P, sync, caisse).

## Roadmap PWA

| Phase | Objectif |
|-------|----------|
| 0 | Auth + dashboard + PWA (Serwist) — fait |
| 1 | Annuaire élèves lecture seule (en ligne) |
| 2 | Dexie + pull sync |
| 3 | Caisse en ligne + reçu |
| 4 | Inscription + outbox + hors ligne |
| 5 | Impayés, paramètres, invitations |

## Langue

- UI et réponses en **français**.

## Git

- Pas de `commit` / `push` sans demande explicite de l’utilisateur.

## Secrets

- Ne pas committer `.env`, `web-app/.env.local`, clés Supabase.

## Commandes

```bash
cd web-app && npm run dev    # http://localhost:3000
# ou depuis la racine :
npm run dev
```

Variables : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans `web-app/.env.local`.

## Style

- `npm run lint` / `npm run build` dans `web-app/`.
- Changements ciblés ; lire `docs/domain-spec.md` avant les features hors ligne.
