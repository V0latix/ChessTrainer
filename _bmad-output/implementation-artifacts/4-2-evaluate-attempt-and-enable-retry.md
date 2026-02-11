# Story 4.2: Evaluate Attempt and Enable Retry

Status: review

## Story

As a user,
I want to retry failed attempts,
so that I can learn through repetition.

## Acceptance Criteria

1. Given I play a non-best move in a puzzle, when attempt is evaluated, then failure feedback is shown and I can retry the same puzzle position.

## Tasks / Subtasks

- [x] Add puzzle attempt evaluation endpoint (AC: 1)
  - [x] Add authenticated `POST /puzzles/:puzzle_id/attempt` endpoint.
  - [x] Validate `puzzle_id` and `attempted_move_uci` (UCI format).
  - [x] Compare attempted move against stored best move for user-owned puzzle.
- [x] Return explicit attempt feedback contract (AC: 1)
  - [x] Include `is_correct`, `status`, `feedback_title`, `feedback_message`, `retry_available`.
  - [x] Keep payload in snake_case.
- [x] Integrate attempt flow in puzzle page (AC: 1)
  - [x] Evaluate move immediately when user plays a move on the board.
  - [x] Show success/error feedback block in UI.
  - [x] Add retry button for incorrect attempts.
  - [x] Reset board to same initial position on retry.
- [x] Validate and document (AC: 1)
  - [x] Add/extend API unit tests (controller + service).
  - [x] Extend API snake_case contract test for attempt response.
  - [x] Add web test for failure->retry flow.
  - [x] Update README and run `npm run ci`.

## Dev Notes

- Attempt evaluation uses critical mistake record ownership (`puzzle_id` + `user_id`) to avoid cross-user access.
- Retry keeps same puzzle and remounts board instance to restore initial FEN deterministically.
- Story 4.2 does not yet persist per-attempt history (can be added in future stories for analytics).

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 4, Story 4.2)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/architecture.md` (puzzle feedback loop)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -w @chesstrainer/api -- puzzles.controller.spec.ts puzzles.service.spec.ts api-snake-case.contract.spec.ts`
- `npm run test -w @chesstrainer/web -- PuzzlePage.test.tsx`
- `npm run lint -w @chesstrainer/api`
- `npm run ci`

### Completion Notes List

- Added `POST /puzzles/:puzzle_id/attempt` to evaluate user move against best move.
- Added explicit attempt feedback payload for both correct and incorrect moves.
- Integrated automatic attempt evaluation in puzzle UI after move play.
- Added retry action to reset board and re-attempt the same position.
- Added tests for controller/service, contract casing, and UI retry flow.

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/4-2-evaluate-attempt-and-enable-retry.md`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/puzzles/puzzles.controller.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/puzzles/puzzles.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/puzzles/puzzles.controller.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/puzzles/puzzles.service.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/contracts/api-snake-case.contract.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/lib/puzzles.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/components/Board/Board.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/puzzles/PuzzlePage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/puzzles/PuzzlePage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.css`
- `/Users/romain/dev/ChessTrainer/README.md`
