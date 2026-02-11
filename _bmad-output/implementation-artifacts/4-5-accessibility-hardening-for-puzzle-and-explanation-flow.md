# Story 4.5: Accessibility Hardening for Puzzle and Explanation Flow

Status: review

## Story

As a keyboard or assistive-technology user,
I want the puzzle flow fully accessible,
so that I can train without interaction barriers.

## Acceptance Criteria

1. Given I navigate puzzle and explanation screens with keyboard only, when I tab through interactive elements, then focus order is logical and visible, and all core actions are reachable without pointer input.
2. Given text and controls are rendered in dark theme, when accessibility checks run, then contrast meets WCAG 2.1 AA thresholds, and actionable targets respect 44x44 minimum size guidance.

## Tasks / Subtasks

- [x] Improve keyboard + screen reader support for board interactions (AC: 1)
  - [x] Add explicit keyboard guidance text for board interaction.
  - [x] Add semantic piece labels in square `aria-label` values.
  - [x] Expose selected square state with `aria-pressed`.
- [x] Improve focus visibility and transitions in puzzle flow (AC: 1)
  - [x] Add global `:focus-visible` styles for consistent visible focus.
  - [x] Move focus to evaluated feedback status after move evaluation.
  - [x] Add live region roles for loading/error/attempt updates.
- [x] Enforce target-size and contrast-oriented UI adjustments (AC: 2)
  - [x] Enforce minimum 44x44 size guidance on board squares and main buttons.
  - [x] Darken board dark-square color for stronger text contrast.
- [x] Validate and document (AC: 1, 2)
  - [x] Add board keyboard/accessibility tests.
  - [x] Extend puzzle flow tests for keyboard-only move/continue interactions.
  - [x] Run full `npm run ci` and update README.

## Dev Notes

- Board interaction remains click-first but is now fully keyboard-operable via native button semantics (`Enter`/`Space`).
- Feedback focus management is intentionally scoped to move-evaluation moments to reduce cognitive friction.
- Story uses deterministic accessibility improvements and test coverage (no runtime feature flags).

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 4, Story 4.5)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/ux-design-specification.md` (WCAG AA + keyboard/focus/44x44 guidance)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -w @chesstrainer/web -- Board.test.tsx PuzzlePage.test.tsx OnboardingPage.test.tsx`
- `npm run lint -w @chesstrainer/web`
- `npm run typecheck -w @chesstrainer/web`
- `npm run ci`

### Completion Notes List

- Improved board accessibility metadata with piece-name labels and pressed state.
- Added keyboard instruction text and live status semantics in puzzle flow.
- Added consistent visible focus treatment for interactive controls.
- Enforced 44x44 minimum sizing guidance for board squares and primary buttons.
- Added keyboard-centric tests for board move execution and puzzle flow progression.
- Full CI passes.

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/4-5-accessibility-hardening-for-puzzle-and-explanation-flow.md`
- `/Users/romain/dev/ChessTrainer/apps/web/src/components/Board/Board.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/components/Board/Board.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/components/ExplanationPanel/ExplanationPanel.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/puzzles/PuzzlePage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/puzzles/PuzzlePage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.css`
- `/Users/romain/dev/ChessTrainer/README.md`
