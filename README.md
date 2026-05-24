# Pema Class

Gestion scolaire (RDC) — **PWA Next.js** + **Supabase** (multi-établissements).

## Démarrage

```bash
cp .env.example .env.local
# Renseigner URL, clé publishable, service role, APP_BASE_URL

npm install
npm run dev
```

Ouvrir http://localhost:3000

## Auth

| Route | Rôle |
|-------|------|
| `/` | Connexion (email + mot de passe) |
| `/register?invite=TOKEN` | Inscription directeur (lien superadmin, 72 h) |
| `/post-login` | Redirection selon rôle |
| `/logout` | Déconnexion |
| `/platform` | Superadmin |
| `/school` | Direction (`school_admin`, `admin`) |
| `/app` | Personnel |

## Structure

```
src/app/           pages Next.js
src/lib/           Supabase, auth, db, actions
src/components/    UI (shadcn, auth, école)
supabase/migrations/
supabase/sql/      référence schéma (01, 05, 07)
```

## Superadmin

Après migration, promouvoir un compte :

```sql
INSERT INTO public.platform_admins (user_id)
VALUES ('<uuid auth.users>');
```

Puis générer un lien d’onboarding depuis `/platform`.

## Migrations

Appliquer les migrations Supabase (dont `20260521120000_pema_saas_auth.sql`).
