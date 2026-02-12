# Story 3.4: Expose Polling Status with Progress and ETA

Status: done

## Story

As a user,
I want visible analysis progress and ETA,
so that I know when training will be ready.

## Acceptance Criteria

1. Given analysis is running, when I poll job status endpoint, then I receive status, progress percentage, and ETA and completion state is explicit when done.
2. Given I interact with the UI while polling is active, when status updates arrive, then controls remain responsive and interaction response target remains < 200ms.

## Tasks / Subtasks

- [x] Expose authenticated analysis status endpoint (AC: 1)
  - [x] Add `GET /analysis/jobs/:job_id` in controller.
  - [x] Validate `job_id` input and enforce user scoping.
  - [x] Return snake_case payload with status/progress/ETA/error fields.
- [x] Add service read-model for job status (AC: 1)
  - [x] Add `getJobStatus({ user_id, job_id })` in analysis jobs service.
  - [x] Throw `NotFoundException` when job is missing/out-of-scope.
- [x] Add web polling UX with visible progress and ETA (AC: 1, 2)
  - [x] Add API client `getAnalysisJobStatus`.
  - [x] Track enqueued job IDs and poll every 2 seconds.
  - [x] Render progress bar, ETA, completion/failed counts, and terminal completion state.
- [x] Validate and document (AC: 1, 2)
  - [x] Update API unit tests.
  - [x] Update web onboarding tests.
  - [x] Update README.
  - [x] Run `npm run ci`.

## Dev Notes

- Polling uses a non-blocking `setTimeout` loop (2s cadence) and stops automatically once all tracked jobs are terminal (`completed` or `failed`).
- Initial enqueued jobs are seeded in client state as `queued` with `progress_percent=0`, then refreshed from API responses.
- ETA display uses max ETA across tracked jobs to represent remaining session wait.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.4)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/prd.md` (FR20, FR21)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -w @chesstrainer/api -- analysis-jobs.controller.spec.ts analysis-jobs.service.spec.ts`
- `npm run test -w @chesstrainer/web -- OnboardingPage.test.tsx`
- `npm run ci`

### Completion Notes List

- Added authenticated status endpoint for individual analysis jobs with strict user ownership checks.
- Added service-level status projection returning snake_case fields needed by polling clients.
- Added onboarding polling workflow (2s) with visible progress bar, ETA, completion counters, and explicit terminal state.
- Extended API and web tests to cover status endpoint and polling behavior.
- Full CI passes.

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/3-4-expose-polling-status-with-progress-and-eta.md`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/analysis-jobs/analysis-jobs.controller.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/analysis-jobs/analysis-jobs.controller.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/analysis-jobs/analysis-jobs.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/analysis-jobs/analysis-jobs.service.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/lib/analysis-jobs.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.css`
- `/Users/romain/dev/ChessTrainer/README.md`
