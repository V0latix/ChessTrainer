# Story 5.4: Delete Stored Games and Analyses

Status: review

## Story

As a user,
I want to delete stored game/analysis data,
so that I can control retention beyond account-level deletion.

## Acceptance Criteria

1. Given I choose dataset deletion and confirm, when deletion executes, then selected datasets are removed.
2. Inventory/progress views refresh accordingly.

## Tasks / Subtasks

- [x] Extend data inventory API with dataset deletion (AC: 1)
  - [x] Add authenticated `POST /data/delete-datasets` endpoint.
  - [x] Validate `dataset_keys` payload and supported dataset values.
- [x] Implement deletion orchestration + response summary (AC: 1)
  - [x] Support deleting selected datasets: `games`, `analyses`, `puzzle_sessions`.
  - [x] Return `deleted_counts` and `remaining_counts` in snake_case.
  - [x] Clear derived `user_mistake_summaries` when analyses/games are deleted to keep progress coherent.
- [x] Build UI deletion flow in inventory page (AC: 1, 2)
  - [x] Add dataset selection checkboxes.
  - [x] Add explicit confirmation checkbox before delete action.
  - [x] Show deletion summary and refresh inventory immediately after deletion.
- [x] Ensure progress/inventory refresh behavior (AC: 2)
  - [x] Inventory is re-fetched after deletion in-page.
  - [x] Progress views remain fetch-on-open and reflect updated backend state.
- [x] Validate and document (AC: 1, 2)
  - [x] Add API controller/service tests for deletion flow.
  - [x] Extend snake_case contract tests.
  - [x] Add web tests for dataset deletion flow.
  - [x] Run full `npm run ci` and update README.

## Dev Notes

- Deletion execution uses one database transaction to keep counts and deletion summary coherent.
- `games` deletion naturally cascades to related analyses and critical mistakes via existing FK cascade relations.
- `analyses` deletion removes analysis jobs and their dependent records while keeping imported games.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 5, Story 5.4)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/prd.md` (FR23)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -w @chesstrainer/api -- data-inventory.controller.spec.ts data-inventory.service.spec.ts api-snake-case.contract.spec.ts`
- `npm run test -w @chesstrainer/web -- DataInventoryPage.test.tsx ProgressPage.test.tsx ProgressTrendsPage.test.tsx OnboardingPage.test.tsx`
- `npm run lint -w @chesstrainer/api`
- `npm run typecheck -w @chesstrainer/api`
- `npm run lint -w @chesstrainer/web`
- `npm run typecheck -w @chesstrainer/web`
- `npm run ci`

### Completion Notes List

- Added transactional deletion endpoint for selected datasets.
- Added deletion result payload with detailed deleted + remaining counts.
- Added confirmation-based deletion UX inside Data Inventory page.
- Inventory refreshes immediately after deletion and displays deletion summary.
- Progress consistency preserved by clearing derived mistake summaries when core analysis datasets are deleted.
- Full CI passes.

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/5-4-delete-stored-games-and-analyses.md`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/data-inventory/data-inventory.controller.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/data-inventory/data-inventory.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/data-inventory/data-inventory.controller.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/data-inventory/data-inventory.service.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/contracts/api-snake-case.contract.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/lib/data-inventory.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/data-inventory/DataInventoryPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/data-inventory/DataInventoryPage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.css`
- `/Users/romain/dev/ChessTrainer/README.md`
