# Story 5.2: Show Recurring Mistake Trends

Status: review

## Story

As a user,
I want recurring mistake motifs highlighted,
so that I can target weak areas.

## Acceptance Criteria

1. Given enough analyzed data exists, when I open trends view, then recurring mistake categories are ranked and trend direction is clear.

## Tasks / Subtasks

- [x] Extend progress API with trends endpoint (AC: 1)
  - [x] Add authenticated `GET /progress/trends` endpoint.
  - [x] Support `days` and `limit` query params with sane bounds.
- [x] Implement trend computation logic (AC: 1)
  - [x] Compare recent vs previous windows using `critical_mistakes` grouped by category.
  - [x] Rank categories by recent count (with deterministic tie-breakers).
  - [x] Compute explicit trend direction (`up`, `down`, `stable`, `new`).
- [x] Build trends web view (AC: 1)
  - [x] Add `getProgressTrends` client in web API layer.
  - [x] Add protected route `/progress/trends`.
  - [x] Render ranked list with clear direction badges and deltas.
- [x] Validate and document (AC: 1)
  - [x] Add API service/controller tests for trends.
  - [x] Extend snake_case contract tests with trends payload.
  - [x] Add web tests for trends view.
  - [x] Run `npm run ci` and update README.

## Dev Notes

- Trend direction is computed strictly from count comparison between equal windows.
- `new` means category appears in recent window while absent in previous window.
- Endpoint defaults: `days=14`, `limit=8`; bounds are clamped in controller (`days: 1..60`, `limit: 1..20`).

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 5, Story 5.2)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/prd.md` (FR17)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -w @chesstrainer/api -- progress.controller.spec.ts progress.service.spec.ts api-snake-case.contract.spec.ts`
- `npm run test -w @chesstrainer/web -- ProgressPage.test.tsx ProgressTrendsPage.test.tsx PuzzlePage.test.tsx OnboardingPage.test.tsx`
- `npm run lint -w @chesstrainer/api`
- `npm run typecheck -w @chesstrainer/api`
- `npm run lint -w @chesstrainer/web`
- `npm run typecheck -w @chesstrainer/web`
- `npm run ci`

### Completion Notes List

- Added API trends endpoint with ranked recurring categories.
- Implemented clear trend directions (`up`, `down`, `stable`, `new`) based on window comparison.
- Added dedicated web trends page and route with direction badges.
- Added tests across API, contract, and web.
- Full CI passes.

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/5-2-show-recurring-mistake-trends.md`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/progress/progress.controller.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/progress/progress.controller.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/progress/progress.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/progress/progress.service.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/contracts/api-snake-case.contract.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/lib/progress.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/progress/ProgressTrendsPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/progress/ProgressTrendsPage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/progress/ProgressPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/app/router.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.css`
- `/Users/romain/dev/ChessTrainer/README.md`
