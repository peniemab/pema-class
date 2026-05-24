# Migrations Supabase

## Ta situation (BDD live déjà remplie)

Tu as **déjà** les tables en production. Ne lance **pas** le baseline sur cette base.

```bash
# Uniquement le patch (colonnes + fonctions manquantes)
supabase db push
# ou exécute manuellement :
# migrations/20260525000001_live_db_patch.sql
```

Si Supabase CLI réclame le baseline : marque-le comme appliqué sans l’exécuter :

```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('20260525000000')
ON CONFLICT DO NOTHING;
```

Puis applique `20260525000001_live_db_patch.sql`.

## Nouveau projet Supabase (vide)

```bash
supabase db push
```

Applique `20260525000000_baseline.sql` puis `20260525000001_live_db_patch.sql`.

## Documentation

Voir [`../SCHEMA.md`](../SCHEMA.md) — analyse multi-tenant, ce qui est bien / manque / à retirer.
