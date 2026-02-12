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
- Critical mistake extraction + summaries (Story 3.3):
  - Worker extracts `critical_mistakes` when evaluation drop is `>= 200cp` (`>= 2.0` pawns), with severity and phase categories.
  - Mistakes are persisted per analyzed game and deduplicated per `(analysis_job_id, ply_index)`.
  - User aggregates are regenerated from recent completed jobs into `user_mistake_summaries`.
- Analysis status polling with progress + ETA (Story 3.4):
  - API endpoint: `GET /analysis/jobs/:job_id`.
  - Returns explicit per-job execution state (`queued`/`running`/`completed`/`failed`) with `progress_percent` and `eta_seconds`.
  - Onboarding polls tracked jobs every 2s, shows a visible progress bar + ETA, and displays explicit completion state when all tracked jobs are terminal.
- API contract + observability enforcement (Story 3.5):
  - Added contract tests to enforce `snake_case` public payload keys (`apps/api/src/contracts/api-snake-case.contract.spec.ts`).
  - API emits structured JSON logs for completed requests with `trace_id`, status, duration, and user context when available.
  - API captures controller/runtime exceptions through Sentry when `SENTRY_DSN` is configured.
  - Worker emits structured JSON logs for bootstrap/batch/job events and captures failures through Sentry (`SENTRY_DSN` or `WORKER_SENTRY_DSN`).
  - Web initializes optional Sentry capture with environment/release metadata (`VITE_SENTRY_*`) and captures global runtime errors.
- Mistake position as playable puzzle (Story 4.1):
  - API endpoint: `GET /puzzles/next` (authenticated).
  - Returns the latest critical mistake as a puzzle payload (`fen`, `side_to_move`, `objective`, contextual metadata).
  - New protected web route: `/puzzle`.
  - Puzzle page fetches and renders the position on an interactive board, plus objective/context panel.
  - If no analyzed mistake exists yet, the page displays an explicit empty state.
- Attempt evaluation + retry loop (Story 4.2):
  - API endpoint: `POST /puzzles/:puzzle_id/attempt` with `attempted_move_uci`.
  - Server evaluates move vs stored `best_move_uci` and returns explicit feedback payload (`is_correct`, `status`, `feedback_*`, `retry_available`).
  - Puzzle page evaluates the played move immediately and shows success/failure feedback.
  - On failure, user can retry the same position with a one-click board reset.
- Puzzle session sequencing (Story 4.3):
  - API endpoint: `GET /puzzles/session?limit=<n>` to fetch a sequence of mistake-based puzzles.
  - Puzzle page now runs a session flow (up to 10 puzzles), with explicit progress at the top.
  - Users can continue after solving a puzzle or skip the current puzzle.
  - Session progress updates as users advance (`completed / total`, solved count, skipped count).
- Move explanations (Story 4.4):
  - Attempt evaluation now returns two explanation fields:
    - `wrong_move_explanation`
    - `best_move_explanation`
  - Web renders the dedicated `ExplanationPanel` after each evaluated attempt.
  - Panel explains both sides of the correction:
    - why the played move is weaker
    - why the best move is stronger
  - Includes a short “À retenir” takeaway for fast daily review.
- Accessibility hardening for puzzle flow (Story 4.5):
  - Puzzle flow now exposes clearer keyboard support (board helper text + keyboard-operable squares).
  - Focus states are persistent and highly visible across interactive controls (`:focus-visible` styling).
  - Puzzle attempt feedback announces status changes and receives programmatic focus after evaluation.
  - Board square labels now include piece names (screen-reader friendly), not only unicode symbols.
  - Core interactive controls respect minimum `44x44` target sizing guidance.
- Session progress summary (Story 5.1):
  - API endpoints:
    - `GET /progress/summary` (key metrics + recent mistakes)
    - `POST /progress/sessions` (persist one completed puzzle session)
  - Puzzle page now persists a session summary automatically once a session is completed.
  - New protected web route: `/progress`.
  - Progress page shows compact metrics:
    - sessions completed
    - puzzles completed / solved / skipped
    - success indicator (%)
    - recurring mistake categories
  - Data model update: new `puzzle_sessions` table (`PuzzleSession` Prisma model).
- Recurring mistake trends (Story 5.2):
  - API endpoint: `GET /progress/trends?days=<n>&limit=<n>`.
  - Trends rank recurring mistake categories by recent count.
  - Each category includes a clear direction signal (`up`, `down`, `stable`, `new`) by comparing recent vs previous window.
  - New protected web route: `/progress/trends`.
  - Trends view shows ranked categories with direction badges and recent-vs-previous delta.
- Stored data inventory (Story 5.3):
  - API endpoint: `GET /data/inventory`.
  - Returns stored-data counts for account transparency:
    - games
    - analyses
    - move evaluations
    - critical mistakes
    - puzzle sessions
  - Returns latest update context with timestamps (last imported game, last analysis update, last detected critical mistake).
  - New protected web route: `/data/inventory`.
  - Inventory page displays counts and recent data context for transparent storage visibility.
- Dataset deletion controls (Story 5.4):
  - API endpoint: `POST /data/delete-datasets`.
  - Supports selected dataset deletion:
    - `games`
    - `analyses`
    - `puzzle_sessions`
  - Returns deletion summary with `deleted_counts` + `remaining_counts`.
  - Data inventory page now includes explicit selection + confirmation before deletion.
  - After deletion, inventory refreshes immediately and progress views reflect updated backend state on next load.
- Coach student context access (Story 6.1):
  - Prisma model `CoachStudentAccess` defines explicit authorized coach→student links.
  - API endpoints:
    - `GET /coach/students`
    - `POST /coach/context/select`
  - Coach-only access is enforced server-side (`role=coach` required).
  - Unauthorized student context selection is blocked (`403`).
  - New protected web route: `/coach/context` to list authorized students and activate one context.
  - Selected context metadata is persisted client-side for next coach stories.
- Coach import + mistake review (Story 6.2):
  - API endpoints:
    - `POST /coach/review/import`
    - `GET /coach/review/mistakes?student_user_id=<id>&limit=<n>`
  - Endpoints are coach-only and restricted to authorized `coach_student_accesses` scope.
  - New protected web route: `/coach/review`.
  - Coach review flow supports:
    - importing a selected student’s recent games from Chess.com
    - listing key mistakes with explanations
    - opening each mistake with board context + rationale panel
  - Coach context page now links directly to the review workspace once a student context is selected.

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
