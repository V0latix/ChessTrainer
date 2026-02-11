# Story 5.3: Expose Stored Data Inventory

Status: review

## Story

As a user,
I want to see what data is stored for my account,
so that data handling is transparent.

## Acceptance Criteria

1. Given I open data inventory, when the page loads, then stored games and analyses counts are displayed.
2. Timestamps/context for most recent updates are shown.

## Tasks / Subtasks

- [x] Add data inventory API module (AC: 1, 2)
  - [x] Add authenticated `GET /data/inventory` endpoint.
  - [x] Return stored-data counts with snake_case payload.
- [x] Implement inventory aggregation and latest context (AC: 1, 2)
  - [x] Count core stored datasets (`games`, `analysis_jobs`, `analysis_move_evaluations`, `critical_mistakes`, `puzzle_sessions`).
  - [x] Return latest update context for game import, analysis update, and mistake detection with timestamps.
- [x] Build web inventory page (AC: 1, 2)
  - [x] Add web API client for inventory endpoint.
  - [x] Add protected route `/data/inventory`.
  - [x] Render counts + latest context cards.
- [x] Validate and document (AC: 1, 2)
  - [x] Add API service/controller tests.
  - [x] Extend snake_case contract tests.
  - [x] Add web tests for inventory page.
  - [x] Run `npm run ci` and update README.

## Dev Notes

- Inventory API is intentionally read-only and lightweight for transparency-first UX.
- Count and latest-update queries run in parallel via `Promise.all` to minimize response latency.
- Inventory shows both required counts (games/analyses) and extended context to support future deletion flows.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 5, Story 5.3)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/prd.md` (FR22)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -w @chesstrainer/api -- data-inventory.controller.spec.ts data-inventory.service.spec.ts api-snake-case.contract.spec.ts progress.controller.spec.ts progress.service.spec.ts`
- `npm run test -w @chesstrainer/web -- DataInventoryPage.test.tsx ProgressPage.test.tsx ProgressTrendsPage.test.tsx OnboardingPage.test.tsx`
- `npm run lint -w @chesstrainer/api`
- `npm run typecheck -w @chesstrainer/api`
- `npm run lint -w @chesstrainer/web`
- `npm run typecheck -w @chesstrainer/web`
- `npm run ci`

### Completion Notes List

- Added new data inventory API endpoint with account-level stored-data counts.
- Added latest update context with timestamps for games, analyses, and mistakes.
- Added dedicated web inventory page and protected route.
- Linked inventory page from onboarding/progress/trends views.
- Added API/web tests and contract checks.
- Full CI passes.

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/5-3-expose-stored-data-inventory.md`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/data-inventory/data-inventory.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/data-inventory/data-inventory.controller.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/data-inventory/data-inventory.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/data-inventory/data-inventory.controller.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/data-inventory/data-inventory.service.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/contracts/api-snake-case.contract.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/app.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/lib/data-inventory.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/data-inventory/DataInventoryPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/data-inventory/DataInventoryPage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/app/router.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/progress/ProgressPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/progress/ProgressTrendsPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.css`
- `/Users/romain/dev/ChessTrainer/README.md`
