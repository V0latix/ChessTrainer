# Story 4.4: Explain Wrong Move and Best Move

Status: review

## Story

As a user,
I want clear explanations for wrong and best moves,
so that I understand the chess idea behind each correction.

## Acceptance Criteria

1. Given an attempt has been evaluated, when explanation panel renders, then it states why my move was wrong and explains why the best move is stronger in that position.

## Tasks / Subtasks

- [x] Extend attempt evaluation payload with explanation fields (AC: 1)
  - [x] Add `wrong_move_explanation` in puzzle attempt service response.
  - [x] Add `best_move_explanation` in puzzle attempt service response.
  - [x] Keep public payload in snake_case.
- [x] Implement explanation templates in API service (AC: 1)
  - [x] Build wrong-move explanation from phase, severity, and eval drop context.
  - [x] Build best-move explanation using phase-aware rationale templates.
- [x] Render Explanation Panel in web puzzle flow (AC: 1)
  - [x] Wire explanation fields into web attempt response type.
  - [x] Render `ExplanationPanel` after attempt evaluation.
  - [x] Show wrong-move reason + best-move rationale + short takeaway.
- [x] Validate and document (AC: 1)
  - [x] Update API tests for controller/service and snake_case contract.
  - [x] Update web tests to verify explanation panel rendering.
  - [x] Run `npm run ci` and update README.

## Dev Notes

- Explanation logic uses deterministic templates (no LLM dependency in MVP) to guarantee speed and reliability.
- Best-move rationale is phase-aware (`opening`, `middlegame`, `endgame`) with fallback template.
- Explanation panel is shown only after an attempt is evaluated to keep puzzle interaction focused.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 4, Story 4.4)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/ux-design-specification.md` (Explanation Panel requirements)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -w @chesstrainer/api -- puzzles.controller.spec.ts puzzles.service.spec.ts api-snake-case.contract.spec.ts`
- `npm run test -w @chesstrainer/web -- PuzzlePage.test.tsx`
- `npm run lint -w @chesstrainer/api`
- `npm run typecheck -w @chesstrainer/api`
- `npm run lint -w @chesstrainer/web`
- `npm run typecheck -w @chesstrainer/web`
- `npm run ci`

### Completion Notes List

- Added deterministic wrong/best move explanation fields to puzzle attempt API responses.
- Implemented phase-aware explanation templates in puzzle service.
- Replaced ExplanationPanel placeholder with structured UI for wrong move, best move, and key takeaway.
- Integrated explanation panel into the puzzle flow immediately after move evaluation.
- Updated API and web tests; full CI passes.

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/4-4-explain-wrong-move-and-best-move.md`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/puzzles/puzzles.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/puzzles/puzzles.service.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/puzzles/puzzles.controller.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/contracts/api-snake-case.contract.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/lib/puzzles.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/components/ExplanationPanel/ExplanationPanel.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/puzzles/PuzzlePage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/puzzles/PuzzlePage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.css`
- `/Users/romain/dev/ChessTrainer/README.md`
