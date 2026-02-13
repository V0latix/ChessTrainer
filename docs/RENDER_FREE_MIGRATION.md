# Migration Render (Tout Gratuit)

Objectif: supprimer Railway (payant) et faire tourner **API + worker** sur **Render (plan free)**, tout en gardant:

- Web SPA sur Vercel (free) ou Render Static Site (free)
- DB sur Supabase Postgres (free)

## Contrainte Importante (Render Free)

Render "Web Service" en plan free peut "sleep" apres ~15 minutes sans trafic entrant. Du coup:

- Les analyses (worker) sont **best-effort** quand l'app est inactive.
- Pendant qu'un utilisateur est actif (SPA qui appelle l'API / polling), le service reste reveille et le worker peut travailler.

Pour un worker 24/7 fiable: il faut passer sur un plan payant ou ajouter une infra de keep-alive externe (hors scope "tout gratuit").

## Strategie Retenue

Un seul service Render `chesstrainer-api` (Docker) qui lance 2 process:

- `apps/api` (NestJS) : expose HTTP + `/health`
- `apps/worker` : boucle de traitement des jobs `analysis_jobs` en DB

Le worker reste donc actif tant que le web service Render est actif.

## Etapes (Avec Tests)

1. Baseline local
   - `npm run ci`
2. Ajouter l'Infra Render (IaC)
   - `render.yaml`
   - `Dockerfile` (installe stockfish)
   - `scripts/render-start.sh` (API + worker)
   - Test: `npm run ci`
3. Deployer sur Render via Blueprint
   - Pre-requis: repo Git accessible par Render
   - Renseigner env vars `sync: false` dans le dashboard
   - Test: ouvrir l'URL API et verifier `GET /health` = 200
4. Repointer le Web (Vercel)
   - `VITE_API_BASE_URL` = URL Render de l'API
   - Test: login + `GET /auth/me` depuis la SPA, puis envoi d'un job d'analyse
5. Validation worker
   - Creer un job (via `POST /analysis/jobs`)
   - Poll `GET /analysis/jobs/:job_id` jusqu'a `completed`

## Variables D'Environnement (Render)

Minimum requis:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WEB_APP_ORIGIN` (URL du web deploye)

Optionnel:

- `SENTRY_DSN`, `WORKER_SENTRY_DSN`
- Tuning: `WORKER_*`, `ANALYSIS_*`

