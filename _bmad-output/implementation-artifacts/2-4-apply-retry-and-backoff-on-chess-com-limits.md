# Story 2.4: Apply Retry and Backoff on Chess.com Limits

Status: done

## Story

As the platform,
I want resilient import requests,
so that temporary Chess.com limits do not break user flow.

## Acceptance Criteria

1. Given Chess.com returns a rate-limit/transient failure, when import retries execute, then exponential backoff is applied up to configured limits and final status is surfaced clearly.

## Tasks / Subtasks

- [x] Add resilient retry helper in Chess.com integration (AC: 1)
  - [x] Retry transient statuses (`408`, `429`, `5xx`) and network failures.
  - [x] Apply exponential backoff with configurable retry budget and delay bounds.
- [x] Apply retry helper to archive listing and archive-month fetches (AC: 1)
  - [x] Retry global archive listing calls before failing.
  - [x] Retry per-period archive fetches and continue gracefully on final failure.
- [x] Surface final status clearly (AC: 1)
  - [x] Include attempts in archive listing failure messages.
  - [x] Include attempts in unavailable period reasons (`..._after_<n>_attempts`).
- [x] Add tests and docs (AC: 1)
  - [x] Add integration unit tests covering retry success and retry exhaustion.
  - [x] Document retry configuration env vars and behavior.
  - [x] Run `npm run ci`.

## Dev Notes

- Retry defaults are aligned with architecture guidance (`max 2` retries => `3` total attempts).
- `Retry-After` header is honored when present and combined with exponential backoff.
- Public API payload casing remains `snake_case`.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.4)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/architecture.md` (resilience requirement)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -w @chesstrainer/api -- chess-com.service.spec.ts`
- `npm run format -w @chesstrainer/api`
- `npm run ci`

### Completion Notes List

- Added retry/backoff wrapper in Chess.com integration with env-driven parameters.
- Implemented retries for transient HTTP statuses and network errors on both archive listing and period fetches.
- Added explicit final-status reporting:
  - archive listing failure messages include status and attempts,
  - unavailable period reasons include `after_<attempts>_attempts`.
- Added/updated integration tests for:
  - retry exhaustion on per-period archive fetches,
  - retry-on-rate-limit recovery,
  - retry exhaustion on archive listing.
- Updated `.env.example` and README with retry configuration and behavior notes.

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/2-4-apply-retry-and-backoff-on-chess-com-limits.md`
- `/Users/romain/dev/ChessTrainer/apps/api/src/integrations/chess-com/chess-com.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/integrations/chess-com/chess-com.service.spec.ts`
- `/Users/romain/dev/ChessTrainer/.env.example`
- `/Users/romain/dev/ChessTrainer/README.md`
