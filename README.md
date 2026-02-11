# ChessTrainer

Monorepo MVP for ChessTrainer (SPA web + API + worker + shared contracts).

## Requirements

- Node.js 20+
- npm 10+

## Project Layout

- `apps/web`: React + Vite SPA (desktop-first)
- `apps/api`: NestJS REST API
- `apps/worker`: async worker runtime skeleton
- `packages/shared-contracts`: shared contract/schema package

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## Auth Setup (Story 1.2)

- Configure Supabase keys in `.env`:
  - `SUPABASE_URL`
  - `SUPABASE_JWT_AUDIENCE`
  - `SUPABASE_SERVICE_ROLE_KEY` (required for API-side account deletion)
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Configure API persistence + CORS:
  - `DATABASE_URL`
  - `WEB_APP_ORIGIN`
- Open web app on `/register` to create account with age-gate checkbox (16+).
- Login is available on `/login`.
- Successful login/signup with active session redirects to `/onboarding`.
- Logout button in onboarding invalidates the session and redirects to `/login`.
- On first authenticated session, web calls `GET /auth/me` to upsert local `users` identity by Supabase `sub`.
- Account deletion is available in onboarding after explicit confirmation and calls `POST /auth/delete-account`.
- Security baseline (Story 1.6):
  - API enforces HTTPS-only in `production`.
  - `x-trace-id` is attached to responses and reused in audit logs.
  - `GET /auth/audit-logs` is available for authenticated audit-log review.
- Chess.com candidate listing (Story 2.1):
  - Onboarding includes username fetch to list recent candidate games as selectable entries.
  - API endpoint: `GET /imports/chess-com/candidate-games?username=<name>&archives_count=<n>`.
  - Unavailable archive periods are returned and displayed gracefully.
- Selected import (Story 2.2):
  - API endpoint: `POST /imports/chess-com/import-selected`.
  - Only selected game URLs are persisted for the authenticated user.
  - Import summary returns `imported_count`, `already_existing_count`, and `failed_count`.
- Incremental re-import without duplicates (Story 2.3):
  - API endpoint: `POST /imports/chess-com/reimport`.
  - Scans recent archives and inserts only new games for the authenticated user.
  - Dedup is deterministic using `(userId, gameUrl)`; existing rows are skipped.
  - Summary returns `scanned_count`, `imported_count`, `already_existing_count`, and `failed_count`.
- Chess.com retry/backoff resilience (Story 2.4):
  - Transient Chess.com failures (`408`, `429`, `5xx`, network errors) are retried with exponential backoff.
  - Retry budget and delays are configurable via:
    - `CHESSCOM_RETRY_MAX_RETRIES`
    - `CHESSCOM_RETRY_BASE_DELAY_MS`
    - `CHESSCOM_RETRY_MAX_DELAY_MS`
  - Final failure status is explicit in API responses (archive listing errors include HTTP status and attempts; per-period failures include reason suffix `_after_<n>_attempts`).
- Analysis job enqueue (Story 3.1):
  - API endpoint: `POST /analysis/jobs`.
  - Enqueues asynchronous analysis jobs for imported games of the authenticated user.
  - Returns `enqueued_count`, `skipped_count`, and per-job tracking metadata (`job_id`, `queue_job_id`, initial `status`).
  - Jobs with existing active status (`queued`/`running`) are skipped to avoid duplicate active processing.
- Worker Stockfish execution (Story 3.2):
  - Worker scans `analysis_jobs` with `status=queued`, locks them to `running`, then analyzes game PGN moves.
  - Each ply stores one persisted evaluation row (`analysis_move_evaluations`) with played move vs Stockfish best move and score.
  - Timeout and retry policy are configurable:
    - `ANALYSIS_TIMEOUT_MS` (default `60000`)
    - `ANALYSIS_RETRY_MAX_RETRIES` (default `2`)
    - `ANALYSIS_RETRY_BASE_DELAY_MS` (default `500`)
    - `ANALYSIS_RETRY_MAX_DELAY_MS` (default `5000`)
  - Stockfish binary path and worker polling:
    - `STOCKFISH_BIN_PATH` (default `stockfish`)
    - `WORKER_POLL_INTERVAL_MS`, `WORKER_BATCH_SIZE`, `WORKER_RUN_ONCE`

## Useful Commands

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run security:check`
- `npm run perf:web`
- `npm run ci`

## Local Services

This story initializes app skeletons only. Redis/Postgres and feature modules arrive in next stories.
