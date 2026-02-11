# Story 3.1: Enqueue Analysis Jobs from Imported Games

Status: review

## Story

As a user,
I want analysis to run asynchronously,
so that I can continue using the app while processing runs.

## Acceptance Criteria

1. Given imported games exist, when I start analysis, then jobs are enqueued with initial status and each job has a unique tracking identifier.

## Tasks / Subtasks

- [x] Add analysis job persistence model (AC: 1)
  - [x] Add `analysis_jobs` Prisma model with initial status fields.
  - [x] Link jobs to `users` and `games`.
- [x] Add API enqueue endpoint (AC: 1)
  - [x] Add authenticated endpoint `POST /analysis/jobs`.
  - [x] Return `enqueued_count`, `skipped_count`, and per-job tracking IDs.
- [x] Add queue adapter skeleton for async dispatch (AC: 1)
  - [x] Add `AnalysisQueueService` to generate queue tracking identifiers.
  - [x] Keep implementation ready for later BullMQ/Redis integration.
- [x] Add tests and UI trigger (AC: 1)
  - [x] Add API service/controller tests for enqueue + validation behavior.
  - [x] Add onboarding action to trigger enqueue and show summary.
  - [x] Add onboarding test for enqueue action.
- [x] Validate and document (AC: 1)
  - [x] Update README analysis enqueue notes.
  - [x] Run `npm run ci`.

## Dev Notes

- Queue integration is intentionally a skeleton in Story 3.1 (tracking ID generation only).
- Active jobs (`queued`, `running`) are skipped when enqueue is retriggered, to avoid duplicate active analysis for the same game.
- API payload casing remains `snake_case`.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.1)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/architecture.md` (async analysis pattern)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run prisma:generate -w @chesstrainer/api`
- `npm run test -w @chesstrainer/api -- analysis-jobs.service.spec.ts analysis-jobs.controller.spec.ts chess-com.service.spec.ts`
- `npm run test -w @chesstrainer/web -- OnboardingPage.test.tsx`
- `npm run format -w @chesstrainer/api`
- `npm run ci`

### Completion Notes List

- Added `AnalysisJob` persistence model and `AnalysisJobStatus` enum in Prisma schema.
- Added authenticated enqueue endpoint `POST /analysis/jobs` with snake_case request/response shape.
- Implemented service logic to enqueue jobs for imported games, skip games with active jobs, and return unique tracking IDs.
- Added queue adapter skeleton (`AnalysisQueueService`) for async handoff contract.
- Added onboarding button to trigger enqueue and show queue summary in UI.
- Added API and UI tests for enqueue flow and payload validation.
- Full local quality gate passes (`npm run ci`).

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/3-1-enqueue-analysis-jobs-from-imported-games.md`
- `/Users/romain/dev/ChessTrainer/apps/api/prisma/schema.prisma`
- `/Users/romain/dev/ChessTrainer/apps/api/src/app.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/analysis-jobs/analysis-jobs.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/analysis-jobs/analysis-jobs.controller.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/analysis-jobs/analysis-jobs.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/analysis-jobs/analysis-jobs.controller.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/analysis-jobs/analysis-jobs.service.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/queue/queue.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/queue/analysis-queue.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/lib/analysis-jobs.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.test.tsx`
- `/Users/romain/dev/ChessTrainer/README.md`
