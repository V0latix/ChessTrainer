# Story 4.3: Sequence Puzzles in Session Flow

Status: done

## Story

As a user,
I want to move through puzzle sequences,
so that I can complete focused training sessions.

## Acceptance Criteria

1. Given I solve or skip current puzzle, when I continue, then next puzzle in sequence is loaded and session progress updates at the top.

## Tasks / Subtasks

- [x] Add session puzzle retrieval API (AC: 1)
  - [x] Add authenticated `GET /puzzles/session` endpoint with `limit` support.
  - [x] Return ordered puzzle sequence from most recent critical mistakes.
  - [x] Keep payload in snake_case with session metadata.
- [x] Add session progression state in web (AC: 1)
  - [x] Load a puzzle sequence from `/puzzles/session` at page start.
  - [x] Track current puzzle index and session completion state.
  - [x] Advance to next puzzle on continue.
- [x] Add skip flow in session (AC: 1)
  - [x] Add “Passer ce puzzle” action.
  - [x] Move to next puzzle and track skipped items.
- [x] Update progress UI at top (AC: 1)
  - [x] Wire `ProgressSummary` with session counts (current/completed/solved/skipped).
  - [x] Update counts as user advances.
- [x] Validate and document (AC: 1)
  - [x] Add API tests for session endpoint and service.
  - [x] Extend web tests for solve+continue progression.
  - [x] Update README and run `npm run ci`.

## Dev Notes

- Session composition strategy for MVP: latest `critical_mistakes` ordered by `created_at DESC`.
- Session progression state is client-side in this story; persistence of session state/history is out of scope.
- Existing 4.2 move evaluation endpoint is reused to gate “continue” on solved attempts.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 4, Story 4.3)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/architecture.md` (puzzle session flow)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -w @chesstrainer/api -- puzzles.controller.spec.ts puzzles.service.spec.ts api-snake-case.contract.spec.ts`
- `npm run test -w @chesstrainer/web -- PuzzlePage.test.tsx`
- `npm run lint -w @chesstrainer/api`
- `npm run ci`

### Completion Notes List

- Added `GET /puzzles/session` to retrieve a sequence of puzzles for the authenticated user.
- Puzzle page now loads and navigates a session sequence with continue/skip actions.
- Added top-level session progress summary with current/completed/solved/skipped metrics.
- Added/updated tests for API session behavior and UI progression between puzzles.
- Full CI passes with story changes.

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/4-3-sequence-puzzles-in-session-flow.md`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/puzzles/puzzles.controller.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/puzzles/puzzles.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/puzzles/puzzles.controller.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/puzzles/puzzles.service.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/contracts/api-snake-case.contract.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/lib/puzzles.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/puzzles/PuzzlePage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/puzzles/PuzzlePage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/components/ProgressSummary/ProgressSummary.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.css`
- `/Users/romain/dev/ChessTrainer/README.md`
