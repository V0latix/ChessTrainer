# ChessTrainer MVP Release Checklist

Status: draft

## 0) Scope

- [ ] Release branch/tag selected from `main`.
- [ ] Target environment confirmed (`staging` or `production`).
- [ ] Rollback owner identified.

## 1) Secrets & Config

- [ ] Backend `.env` is complete:
  - [ ] `DATABASE_URL` (Supabase pooler URL with password)
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_JWT_AUDIENCE`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `WEB_APP_ORIGIN` (set to `https://ChessTrainer.vercel.app`)
- [ ] Frontend `.env` is complete:
  - [ ] `VITE_API_BASE_URL`
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] Optional observability configured:
  - [ ] `SENTRY_DSN` (API/worker)
  - [ ] `VITE_SENTRY_DSN` (web)

## 2) Database Readiness

- [ ] Prisma schema aligned:
  - [ ] `set -a && source .env && set +a`
  - [ ] `npm run prisma:db:push -w @chesstrainer/api`
- [ ] Core tables exist (users, games, analysis_jobs, critical_mistakes, puzzle_sessions, coach_student_accesses).
- [ ] At least one coach↔student access row exists for coach flow testing.

## 3) Pre-Release Validation

- [ ] Full quality gate passes:
  - [ ] `npm run ci`
- [ ] Auth smoke test passes:
  - [ ] API running on `http://localhost:3000`
  - [ ] `./scripts/smoke-auth.sh`
- [ ] Manual user flow validated:
  - [ ] Register/Login
  - [ ] Import Chess.com games
  - [ ] Enqueue + poll analysis
  - [ ] Puzzle flow + explanations
  - [ ] Progress + trends + data inventory
- [ ] Manual coach flow validated:
  - [ ] Open `/coach/context`
  - [ ] Select student context
  - [ ] Open `/coach/review`
  - [ ] Import student games
  - [ ] View mistakes with board + explanations

## 4) Deploy

- [ ] Deploy API.
- [ ] Deploy worker.
- [ ] Deploy web SPA.
- [ ] Confirm API health endpoint:
  - [ ] `GET /health` returns `200`.

## 5) Post-Deploy Smoke

- [ ] Login works on deployed web.
- [ ] API authenticated endpoint works (`GET /auth/me`).
- [ ] Chess.com import endpoint works.
- [ ] Analysis jobs can be queued and completed.
- [ ] Coach review endpoints respond for authorized coach and deny unauthorized access.
- [ ] Error monitoring receives events (or explicitly confirmed disabled).

## 6) Rollback Plan (Ready Before Release)

- [ ] Last known good commit SHA recorded.
- [ ] Rollback commands prepared for API/worker/web.
- [ ] Communication template ready if incident occurs.
