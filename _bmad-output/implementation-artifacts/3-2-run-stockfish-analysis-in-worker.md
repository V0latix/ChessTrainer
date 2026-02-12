# Story 3.2: Run Stockfish Analysis in Worker

Status: done

## Story

As the platform,
I want worker-based Stockfish processing,
so that game analysis is reliable and scalable.

## Acceptance Criteria

1. Given a queued analysis job, when worker executes Stockfish, then move evaluations are generated within timeout policy and transient failures retry according to configured policy.

## Tasks / Subtasks

- [x] Extend persistence for analysis execution outputs (AC: 1)
  - [x] Add `analysis_move_evaluations` table for per-ply evaluations.
  - [x] Extend `analysis_jobs` with `attempt_count`.
- [x] Implement worker analysis pipeline (AC: 1)
  - [x] Poll and lock queued jobs (`queued` -> `running`).
  - [x] Parse PGN moves and persist one evaluation row per ply.
  - [x] Update job progress/ETA while processing and final status on completion/failure.
- [x] Integrate Stockfish execution with timeout policy (AC: 1)
  - [x] Add Stockfish process service with `ANALYSIS_TIMEOUT_MS`.
  - [x] Capture best move and score from UCI output.
- [x] Add retry/backoff policy for transient worker failures (AC: 1)
  - [x] Retry transient Stockfish failures up to configured limit.
  - [x] Apply exponential backoff delays between retries.
- [x] Validate and document (AC: 1)
  - [x] Add worker tests covering transient retry and non-transient failure.
  - [x] Update README + `.env.example` for worker/analysis settings.
  - [x] Run `npm run ci`.

## Dev Notes

- Worker keeps queue behavior DB-driven in this story: it processes `analysis_jobs` marked `queued`.
- Stockfish integration is shell-based (`STOCKFISH_BIN_PATH`), with timeout guard and explicit error codes.
- Transient retry defaults align with architecture guidance: 2 retries max.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.2)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/architecture.md` (worker + timeout + retry policy)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm install -w @chesstrainer/worker`
- `npm run prisma:generate -w @chesstrainer/api`
- `npm run test -w @chesstrainer/worker`
- `npm run lint -w @chesstrainer/worker`
- `npm run typecheck -w @chesstrainer/worker`
- `npm run ci`

### Completion Notes List

- Added worker-side Stockfish execution service with UCI parsing and timeout policy.
- Added worker orchestration service to process queued jobs and persist per-ply move evaluations.
- Added transient retry + exponential backoff policy for Stockfish-related failures.
- Added worker tests validating retry-on-transient and fail-on-non-transient behavior.
- Updated docs and env template with analysis/worker runtime knobs.

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/3-2-run-stockfish-analysis-in-worker.md`
- `/Users/romain/dev/ChessTrainer/apps/api/prisma/schema.prisma`
- `/Users/romain/dev/ChessTrainer/apps/worker/package.json`
- `/Users/romain/dev/ChessTrainer/apps/worker/src/main.ts`
- `/Users/romain/dev/ChessTrainer/apps/worker/src/config.ts`
- `/Users/romain/dev/ChessTrainer/apps/worker/src/services/stockfish.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/worker/src/services/analysis-worker.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/worker/src/services/analysis-worker.service.test.ts`
- `/Users/romain/dev/ChessTrainer/.env.example`
- `/Users/romain/dev/ChessTrainer/README.md`
