# Story 3.5: Enforce API Contract and Platform Observability

Status: review

## Story

As a platform owner,
I want API contracts and telemetry enforced in CI,
so that regressions are detected before release.

## Acceptance Criteria

1. Given public API responses are generated, when contract tests run in CI, then response payload fields are validated as `snake_case` and CI fails on contract mismatch.
2. Given web, API, and worker services run in non-local environments, when errors or key events occur, then structured logs are emitted with `traceId` and Sentry captures exceptions with environment and release metadata.

## Tasks / Subtasks

- [x] Add API contract tests for snake_case payloads (AC: 1)
  - [x] Add a dedicated contract spec covering root/auth/imports/analysis response payloads.
  - [x] Validate payload keys recursively with snake_case matcher.
  - [x] Ensure tests are part of default API Jest run so CI fails on mismatch.
- [x] Add API observability baseline (AC: 2)
  - [x] Add structured request-completion logs (`trace_id`, method, path, status, duration, user_id).
  - [x] Add global exception capture interceptor for structured error logs.
  - [x] Initialize optional Sentry for API runtime exceptions.
- [x] Add worker observability baseline (AC: 2)
  - [x] Add structured JSON logger utility.
  - [x] Log key worker/job lifecycle events.
  - [x] Initialize optional worker Sentry and capture fatal/job exceptions.
- [x] Add web observability baseline (AC: 2)
  - [x] Initialize optional Sentry in frontend startup with environment/release metadata.
  - [x] Capture global runtime/unhandled rejection errors.
- [x] Update docs/config + validate end-to-end (AC: 1, 2)
  - [x] Add Sentry env vars to `.env.example`.
  - [x] Update README observability/contract section.
  - [x] Run `npm run ci`.

## Dev Notes

- API contract gating is implemented as executable tests in `apps/api/src/contracts/api-snake-case.contract.spec.ts`; this keeps the check in the same CI lane as unit tests.
- Structured logging format is JSON and uses snake_case keys to align with the API contract style.
- Sentry integration is optional and enabled only when DSN variables are present; disabled in test mode.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.5)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/prd.md` (NFR5 + observability/contract addenda)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run prisma:generate -w @chesstrainer/api`
- `npm run test -w @chesstrainer/api -- api-snake-case.contract.spec.ts`
- `npm run test -w @chesstrainer/worker`
- `npm run ci`

### Completion Notes List

- Added a dedicated API snake_case contract test suite and integrated it in standard API test execution.
- Added API structured request/error logging with per-request `trace_id` and Sentry exception capture interceptor.
- Added worker structured lifecycle logs and Sentry exception capture for fatal and job-level failures.
- Added frontend Sentry bootstrap and global error capture hooks.
- Updated environment template and README; full CI passes.

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/3-5-enforce-api-contract-and-platform-observability.md`
- `/Users/romain/dev/ChessTrainer/.env.example`
- `/Users/romain/dev/ChessTrainer/README.md`
- `/Users/romain/dev/ChessTrainer/apps/api/package.json`
- `/Users/romain/dev/ChessTrainer/apps/api/src/contracts/api-snake-case.contract.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/main.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/observability/exception-capture.interceptor.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/observability/sentry.ts`
- `/Users/romain/dev/ChessTrainer/apps/worker/package.json`
- `/Users/romain/dev/ChessTrainer/apps/worker/src/main.ts`
- `/Users/romain/dev/ChessTrainer/apps/worker/src/observability/logger.ts`
- `/Users/romain/dev/ChessTrainer/apps/worker/src/observability/sentry.ts`
- `/Users/romain/dev/ChessTrainer/apps/worker/src/services/analysis-worker.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/package.json`
- `/Users/romain/dev/ChessTrainer/apps/web/src/config/env.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/main.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/observability/sentry.ts`
- `/Users/romain/dev/ChessTrainer/package-lock.json`
