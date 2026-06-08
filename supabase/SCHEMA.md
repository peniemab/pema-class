# Schéma BDD — Pema Class (multi-écoles SaaS)

Ce document décrit le schéma **live** (celui que tu as collé) et ce qu’il faut garder, compléter ou retirer pour un SaaS multi-tenant.

> **Ne pas reset la BDD live.** Les fichiers `migrations/` servent de référence + patchs idempotents.

---

## Architecture multi-tenant (ce qui est bien fait)

| Principe | Tables | Verdict |
|----------|--------|---------|
| **Tenant = école** | `schools` | ✅ Bon |
| **Données scoping `school_id`** | `students`, `staff`, `classes`, `fees`, `academic_years` | ✅ Bon — isolation par école |
| **Superadmin hors tenant** | `platform_admins` (lié à `auth.users`, pas à `staff`) | ✅ Bon — modèle SaaS correct |
| **Onboarding école** | `school_onboarding_tokens` | ✅ Bon — lien superadmin → directeur |
| **Statut tenant** | `schools.status` (`active` / `suspended` / `archived`) | ✅ Bon — suspendre une école |
| **Statut utilisateur** | `staff.status` + `staff.is_active` | ⚠️ Redondant mais utilisable |
| **Auth** | `staff.user_id` → `auth.users` | ✅ Bon |
| **Année scolaire** | `academic_years` + `periods` | ✅ Bon modèle |
| **Affectation élève** | `student_classes` | ✅ Bon |
| **Finance** | `fees` + `payments_history` | ✅ OK pour v1 |
| **Invitations équipe** | `invitations` (`staff_join`) | ✅ Bon (complète l’onboarding directeur) |

Le cœur métier est **multi-écoles** : presque toutes les tables portent directement ou indirectement un `school_id`.

---

## Ce qui manque (par rapport à l’app Next.js actuelle)

### Colonnes absentes de ton dump live

```sql
-- school_onboarding_tokens (module /platform)
raw_token      text   -- recopier le lien depuis l’admin
internal_note  text   -- note interne superadmin
email          text   -- e-mail directeur cible (régénération)
```

→ Patch : `migrations/20260525000001_live_db_patch.sql`

### Sécurité (non visible dans le dump Supabase UI)

Le dump « schema only » **ne montre pas** :

- **RLS** (Row Level Security) sur les tables tenant
- **Fonctions** : `get_user_school_id()`, `is_admin()`, `is_platform_admin()`, `peek_school_onboarding_token()`, RPC invitations
- **Triggers** : `updated_at`, `classes.current_count`
- **Index** de perf + unicité métier
- **Storage** bucket `logos`

Vérifie dans Supabase → Database → Policies que le RLS est actif. Sans RLS, un staff pourrait lire une autre école.

### Contraintes d’unicité recommandées

| Contrainte | Pourquoi |
|------------|----------|
| `(school_id, matricule)` sur `students` | Matricule unique par école |
| `(school_id, name)` sur `academic_years` | Une année nommée une fois par école |
| `(student_id, academic_year_id)` sur `student_classes` | Un élève, une classe par année |
| `(school_id, lower(email))` sur `staff` | Pas de doublon e-mail dans une école |
| `(school_id, user_id)` sur `staff` | Un user = un profil par école |

---

## Ce qu’il faut retirer ou ne plus utiliser

### 1. `superadmin` dans `staff.role`

Ton CHECK inclut `'superadmin'` dans `staff`. **À retirer conceptuellement** :

- Le superadmin vit dans **`platform_admins`**, pas dans `staff`.
- Garder `superadmin` dans le CHECK seulement si des lignes legacy existent ; sinon migrer vers `platform_admins` et retirer du CHECK.

### 2. Double système d’onboarding école

Tu as **deux** mécanismes pour créer une école :

| Mécanisme | Table / RPC | Statut |
|-----------|-------------|--------|
| **Actuel (Next.js)** | `school_onboarding_tokens` + `/register?invite=` | ✅ **Canal officiel** |
| **Legacy** | `invitations.invite_type = 'school_setup'` + `accept_school_invitation()` | ❌ **À déprécier** |
| **Legacy Flutter** | `complete_onboarding()` | ❌ **Révoqué / inutilisé** |

**Recommandation** : ne plus créer de `school_setup` dans `invitations`. Garder `invitations` uniquement pour **`staff_join`**.

### 3. Rôles legacy vs rôles SaaS

| Legacy (Flutter) | SaaS (cible) | Action |
|------------------|--------------|--------|
| `director` | `school_admin` | Mapper côté app (`normalizeStaffRole`) |
| `teacher` | `enseignant` | Idem |
| `other` | `enseignant` ou rôle précis | Idem |

Ne supprime pas les valeurs du CHECK tant que des lignes existent ; normalise à l’écriture (register, invitations).

### 4. `fees.academic_year` en TEXT

Pas de FK vers `academic_years.id`. C’est **volontaire** dans la spec caisse (libellé `"2025-2026"`). Acceptable en v1 ; à migrer vers FK plus tard si besoin de cohérence.

### 5. `staff.is_active` + `staff.status`

Deux flags pour la même idée. L’app vérifie les deux. **Garde les deux** pour compatibilité ; à terme un seul champ `status`.

---

## Carte des tables par couche

```
PLATEFORME (pas de school_id)
├── platform_admins
└── school_onboarding_tokens  → school_id nullable jusqu’à usage

TENANT (school_id obligatoire ou dérivé)
├── schools
├── staff
├── academic_years → periods
├── classes
├── students → student_emergency_contacts
├── student_classes
├── teacher_classes
├── student_attendances / staff_attendances
├── fees → payments_history
└── invitations (staff_join → school_id)
```

---

## Fichiers migrations (nouveau layout)

| Fichier | Usage |
|---------|--------|
| `20260525000000_baseline.sql` | **Nouveau projet Supabase** — schéma complet |
| `20260525000001_live_db_patch.sql` | **Ta BDD live** — uniquement ce qui manque (idempotent) |

---

## Prochaine étape produit

1. Appliquer `20260525000001_live_db_patch.sql` sur Supabase live.
2. Vérifier RLS + `platform_admins` pour ton user.
3. Tester flux : `/platform` → lien onboarding → `/register` → login → `/school`.
4. **Phase 1 app** : annuaire élèves (`students` + `student_classes` + RLS déjà prévus).
