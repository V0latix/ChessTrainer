# Story 4.1: Open Mistake Position as Playable Puzzle

Status: done

## Story

As a user,
I want to open mistake positions directly on the board,
so that I can train from my real games.

## Acceptance Criteria

1. Given analyzed mistakes exist, when I open a puzzle, then the board is initialized at the exact position and puzzle objective/context is displayed.
2. Given I open the puzzle route on target desktop browsers, when route data is ready, then puzzle page load target is < 1 second and board is interactive immediately after render.

## Tasks / Subtasks

- [x] Add puzzle domain endpoint in API (AC: 1)
  - [x] Create `puzzles` module/service/controller.
  - [x] Add authenticated `GET /puzzles/next` endpoint.
  - [x] Map latest `critical_mistakes` row to puzzle payload with snake_case fields.
- [x] Add puzzle route + data client in web (AC: 1, 2)
  - [x] Add `getNextPuzzle()` API client.
  - [x] Add protected `/puzzle` route and page.
  - [x] Add onboarding shortcut link to puzzle page.
- [x] Make board interactive for puzzle play (AC: 1, 2)
  - [x] Replace board placeholder with clickable chessboard component using FEN init.
  - [x] Support source/target move input and immediate local move updates.
  - [x] Show side-to-move and last played move feedback.
- [x] Render puzzle objective + context (AC: 1)
  - [x] Extend Puzzle component to render objective, source, and mistake metadata.
  - [x] Add empty state when no puzzle is available.
- [x] Validate and document (AC: 1, 2)
  - [x] Add API tests for puzzle service/controller.
  - [x] Add web tests for puzzle page loading/empty states.
  - [x] Update API snake_case contract tests for puzzle payload.
  - [x] Update README and run quality checks.

## Dev Notes

- Puzzle selection strategy for MVP: latest critical mistake by `created_at` descending.
- Side to move is derived from FEN active color field.
- Board interaction is client-side for Story 4.1 (attempt evaluation/retry logic arrives in Story 4.2).

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 4, Story 4.1)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/architecture.md` (FR11 puzzle flow mapping)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run format -w @chesstrainer/api`
- `npm run test -w @chesstrainer/api`
- `npm run test -w @chesstrainer/web`
- `npm run ci`

### Completion Notes List

- Added API puzzle endpoint (`GET /puzzles/next`) returning latest critical mistake mapped to puzzle payload.
- Added new protected puzzle page and route (`/puzzle`) with load/error/empty states.
- Implemented interactive board component initialized from puzzle FEN and accepting direct move clicks.
- Extended puzzle panel to show objective + concrete context from user’s own mistake.
- Updated contract tests to include puzzle payload snake_case validation.

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/4-1-open-mistake-position-as-playable-puzzle.md`
- `/Users/romain/dev/ChessTrainer/apps/api/src/app.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/puzzles/puzzles.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/puzzles/puzzles.controller.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/puzzles/puzzles.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/puzzles/puzzles.controller.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/puzzles/puzzles.service.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/contracts/api-snake-case.contract.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/lib/puzzles.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/components/Board/Board.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/components/Puzzle/Puzzle.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/puzzles/PuzzlePage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/puzzles/PuzzlePage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/app/router.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.css`
- `/Users/romain/dev/ChessTrainer/README.md`
