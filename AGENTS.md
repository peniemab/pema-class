# Contexte pour les agents (Cursor / IA)



## Produit



- **Pema Class** : gestion scolaire SaaS multi-établissements (RDC).

- **Frontend** : Next.js 15+ à la racine, code sous `src/` (App Router).

- **Auth** : Supabase (`signInWithPassword`), pas d’inscription publique. Onboarding directeur via `/register?invite=TOKEN` (72 h).

- **UI** : shadcn/ui — `npx shadcn@latest add <nom>`.
- **PWA** : Serwist (`src/app/sw.ts`, `SerwistProvider`, `src/app/manifest.ts`). SW actif en dev ; `SERWIST_DISABLE=true` pour couper. Icônes : `npm run gen:icons`.

- **Backend** : `supabase/migrations/` + référence `supabase/sql/`.



## Rôles & routes



| Rôle | Accueil |

|------|---------|

| superadmin (`platform_admins`) | `/platform` |

| `school_admin`, `admin` | `/school` |

| personnel | `/app` |



`post-login` redirige selon le profil. `/logout` déconnecte.



## Secrets (`.env.local`)



- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

- `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement)

- `APP_BASE_URL`



## Commandes



```bash

npm run dev

npm run build

```



## Spécification métier



`docs/domain-spec.md`

