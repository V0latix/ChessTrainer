# Staging Run - 2026-02-12

## Résumé

- Scope: préparation staging (pré-release checks exécutables localement).
- Résultat global: **partiellement validé**.
- Blocage principal: `prisma db push` renvoie `Schema engine error` avec l'URL pooler Supabase.

## Vérifications exécutées

1. **Présence des variables d'environnement critiques**
   - Commande: vérification `.env` (API + web keys requises)
   - Résultat: `ENV_OK`

2. **Synchronisation Prisma**
   - Commande: `npm run prisma:db:push -w @chesstrainer/api`
   - Résultat: échec
   - Message: `Error: Schema engine error`
   - Note: l'API fonctionne avec la même base (voir smoke auth), donc le souci semble lié à l'opération Prisma schema push (pas à l'auth API standard).

3. **Quality gate complet**
   - Commande: `npm run ci`
   - Résultat: OK
   - Détails: lint + typecheck + tests + build + security + perf green

4. **Smoke auth end-to-end (API + Supabase + JWT + /auth/me)**
   - Commande: API démarrée puis `./scripts/smoke-auth.sh`
   - Résultat: `SUCCESS`
   - Couverture:
     - `/health` OK
     - création user test Supabase admin OK
     - login via anon key OK
     - `/auth/me` OK

## Actions restantes pour staging (plateforme)

- Déployer `apps/api`, `apps/worker`, `apps/web` sur ton provider staging.
- Renseigner variables staging côté provider (API + web).
- Exécuter smoke post-déploiement:
  - Login web staging
  - `/health`
  - `/auth/me`
  - import Chess.com
  - enqueue/poll analysis
  - flow coach (`/coach/context` + `/coach/review`)

## Correctif recommandé pour le blocage Prisma

Tester un `DATABASE_URL` **direct connection** Supabase (si disponible) pour les opérations Prisma schema/migration, et garder le pooler pour runtime si tu veux.
