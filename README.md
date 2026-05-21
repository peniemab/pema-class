# Pema Class

Gestion scolaire (RDC) — **PWA Next.js** + **Supabase**.

## Démarrage

```bash
cp web-app/.env.example web-app/.env.local
# Renseigner NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY

npm run dev
```

Ouvrir http://localhost:3000

## Structure

- `web-app/` — application Next.js
- `supabase/migrations/` — schéma Postgres
- `docs/domain-spec.md` — règles métier (inscription, caisse, hors ligne)
