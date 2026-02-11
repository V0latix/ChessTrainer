# Story 5.1: Show Session Progress Summary

Status: review

## Story

As a user,
I want a compact summary of my recent training,
so that I can see if I am improving.

## Acceptance Criteria

1. Given I completed training sessions, when I open progress summary, then I see key metrics (puzzles completed, success indicators, recent mistakes).
2. Summary first render target is < 2 seconds on desktop baseline.

## Tasks / Subtasks

- [x] Add progress backend module and endpoints (AC: 1)
  - [x] Add authenticated `GET /progress/summary` endpoint.
  - [x] Add authenticated `POST /progress/sessions` endpoint for completed session persistence.
  - [x] Validate session payload shape and constraints in controller.
- [x] Add data support for persisted puzzle sessions (AC: 1)
  - [x] Introduce Prisma `PuzzleSession` model and `User.puzzleSessions` relation.
  - [x] Regenerate Prisma client.
- [x] Implement progress summary computation (AC: 1)
  - [x] Compute compact metrics from stored puzzle sessions (sessions, completed, solved, skipped, success rate).
  - [x] Include recent mistake categories from `user_mistake_summaries`.
- [x] Build progress summary UI flow (AC: 1)
  - [x] Add protected route `/progress` and new `ProgressPage`.
  - [x] Render compact KPI cards + recurring mistakes list.
  - [x] Persist session completion from puzzle flow at end-of-session.
- [x] Validate performance and contracts (AC: 2)
  - [x] Add API controller/service tests and snake_case contract coverage.
  - [x] Add web tests for ProgressPage and session persistence trigger.
  - [x] Run full `npm run ci` and update docs.

## Dev Notes

- Session completion persistence happens once per completed puzzle sequence in the current page lifecycle.
- Summary read path uses lightweight aggregate queries and top-N lookup (`take: 5`) to keep render latency low.
- End-to-end performance gate remains enforced by existing web perf check (`< 2s` budget) in CI.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 5, Story 5.1)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/prd.md` (FR16)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/ux-design-specification.md` (compact summary + desktop perf target)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run prisma:generate -w @chesstrainer/api`
- `npm run test -w @chesstrainer/api -- progress.controller.spec.ts progress.service.spec.ts api-snake-case.contract.spec.ts`
- `npm run test -w @chesstrainer/web -- ProgressPage.test.tsx PuzzlePage.test.tsx OnboardingPage.test.tsx`
- `npm run lint -w @chesstrainer/api`
- `npm run typecheck -w @chesstrainer/api`
- `npm run lint -w @chesstrainer/web`
- `npm run typecheck -w @chesstrainer/web`
- `npm run ci`

### Completion Notes List

- Added new progress API module with summary and session recording endpoints.
- Added persisted puzzle session data model (`PuzzleSession`) for progress computation.
- Added a dedicated `/progress` page with compact KPI-focused layout.
- Added automatic session summary persistence at puzzle session completion.
- Added tests across API and web, including snake_case contract coverage.
- Full CI passes.

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/5-1-show-session-progress-summary.md`
- `/Users/romain/dev/ChessTrainer/apps/api/prisma/schema.prisma`
- `/Users/romain/dev/ChessTrainer/apps/api/src/app.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/progress/progress.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/progress/progress.controller.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/progress/progress.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/progress/progress.controller.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/progress/progress.service.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/contracts/api-snake-case.contract.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/app/router.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/progress/ProgressPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/progress/ProgressPage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/puzzles/PuzzlePage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/puzzles/PuzzlePage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/lib/progress.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.css`
- `/Users/romain/dev/ChessTrainer/README.md`
