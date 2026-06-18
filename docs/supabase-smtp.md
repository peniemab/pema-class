# E-mails Supabase Auth (SMTP Resend)

Le flux **Mot de passe oublié** est déjà dans l’app (`/auth/forgot-password` → `/auth/callback` → `/auth/reset-password`).  
L’**envoi** des e-mails est géré par **Supabase Auth**, pas par Next.js. La config SMTP se fait dans le **dashboard Supabase**.

## Pourquoi quitter le SMTP par défaut Supabase ?

| Mode | Limite | Problème |
|------|--------|----------|
| SMTP Supabase intégré | ~2–4 e-mails / heure (Free) | Reset bloqué après 2 liens |
| **SMTP custom (Resend)** | 100 e-mails / jour (Free) | Adapté au démarrage prod |

Choix produit : **Resend** (simple, bonne délivrabilité).

---

## 1. Resend

1. Compte sur [resend.com](https://resend.com).
2. **API Keys** → Create API Key (ex. `pema-class-supabase`).
3. **Domaines** (prod) :
   - Ajouter ton domaine (ex. `pemaclass.com`).
   - Copier les enregistrements DNS (SPF, DKIM) chez ton registrar.
   - Attendre vérification ✅.
4. **Tests sans domaine** : expéditeur `onboarding@resend.dev` (uniquement vers **ton** e-mail Resend).

---

## 2. Supabase → SMTP Settings

Dashboard → **Project Settings** → **Authentication** → **SMTP Settings** :

| Champ | Valeur |
|-------|--------|
| Enable custom SMTP | ✅ |
| Host | `smtp.resend.com` |
| Port | `465` (SSL) ou `587` (STARTTLS) |
| Username | `resend` |
| Password | Ta clé API Resend (`re_…`) |
| Sender email | `noreply@ton-domaine.com` ou `onboarding@resend.dev` (test) |
| Sender name | `Pema Class` |

Enregistrer.

---

## 3. Supabase → URL Configuration

**Authentication** → **URL Configuration** :

| Champ | Dev | Prod |
|-------|-----|------|
| **Site URL** | `http://localhost:3000` | `https://ton-app.vercel.app` |
| **Redirect URLs** | `http://localhost:3000/**` | `https://ton-app.vercel.app/**` |

Ces URLs doivent correspondre à `.env.local` :

```env
APP_BASE_URL=https://ton-app.vercel.app
NEXT_PUBLIC_APP_BASE_URL=https://ton-app.vercel.app
```

Le reset MDP utilise :  
`{APP_BASE_URL}/auth/callback?next=/auth/reset-password`

---

## 4. Modèles d’e-mail (français)

**Authentication** → **Email Templates** → **Reset password** :

**Subject :**
```
Réinitialisez votre mot de passe Pema Class
```

**Body (HTML minimal) :**
```html
<h2>Mot de passe oublié</h2>
<p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :</p>
<p><a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a></p>
<p>Ce lien expire sous peu. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
<p>— Pema Class</p>
```

Optionnel : même principe pour **Confirm signup** (invitations staff).

---

## 5. Test

1. `.env.local` avec `NEXT_PUBLIC_APP_BASE_URL` = URL utilisée dans le navigateur.
2. Supabase Redirect URLs incluent cette URL.
3. `/` → **Mot de passe oublié ?** → e-mail du compte staff.
4. Clic lien → `/auth/reset-password` → nouveau mot de passe → connexion OK.

### Erreurs fréquentes

| Symptôme | Cause | Fix |
|----------|-------|-----|
| Pas d’e-mail | Quota SMTP default | Activer Resend (étape 2) |
| Lien « invalide ou expiré » | Redirect URL absente | Ajouter `https://…/**` dans Supabase |
| Lien pointe localhost en prod | `NEXT_PUBLIC_APP_BASE_URL` manquant | Définir en prod sur Vercel |
| E-mail en spam | Pas de DKIM | Vérifier domaine Resend |

---

## 6. Prod (Vercel)

Variables d’environnement :

```
APP_BASE_URL=https://ton-app.vercel.app
NEXT_PUBLIC_APP_BASE_URL=https://ton-app.vercel.app
```

Supabase **Site URL** = même URL prod.  
Ne pas mélanger Site URL prod et test depuis localhost (le lien du mail suivra Site URL / redirectTo).

---

## Ce qui reste côté code (déjà en place)

- `src/components/auth/forgot-password-form.tsx` — envoi reset
- `src/app/auth/callback/route.ts` — échange code session
- `src/components/auth/reset-password-form.tsx` — nouveau MDP
- `src/lib/auth/auth-redirect-url.ts` — URL callback alignée sur `NEXT_PUBLIC_APP_BASE_URL`

Aucune clé SMTP dans le repo (sécurité).
