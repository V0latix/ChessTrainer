# Story 6.2: Coach Import and Mistake Review

Status: review

## Story

As a coach,
I want to import and review a student's mistakes,
so that I can provide targeted guidance quickly.

## Acceptance Criteria

1. Given a student context is active, when I import/review student games, then key mistakes are listed with explanations.
2. I can open each mistake with board context and rationale.

## Tasks / Subtasks

- [x] Add coach review backend module (AC: 1, 2)
  - [x] Add authenticated `POST /coach/review/import` endpoint.
  - [x] Add authenticated `GET /coach/review/mistakes` endpoint.
  - [x] Enforce coach role + authorized student context before import/review operations.
- [x] Reuse import pipeline for selected student context (AC: 1)
  - [x] Export `ImportsService` from imports module.
  - [x] Trigger incremental Chess.com re-import for authorized student.
  - [x] Return import summary in snake_case.
- [x] Build coach review UI flow (AC: 1, 2)
  - [x] Add web API client for coach review endpoints.
  - [x] Add protected route `/coach/review`.
  - [x] Add coach review page with:
    - student import action
    - mistakes list
    - board context view
    - explanation panel
  - [x] Add direct navigation from selected coach context to review page.
- [x] Validate and document (AC: 1, 2)
  - [x] Add API controller/service tests.
  - [x] Extend snake_case contract tests for coach review payloads.
  - [x] Add web tests for coach review loading/import/review interactions.
  - [x] Run full `npm run ci` and update README.

## Dev Notes

- Coach review endpoints are coach-only and additionally scoped to explicit `CoachStudentAccess` links.
- Mistake list is sourced from persisted `critical_mistakes`, preserving board FEN and rationale context.
- Explanation text is deterministic template-based in this story and can later be upgraded to richer coaching logic.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 6, Story 6.2)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/prd.md` (FR18, FR19)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -w @chesstrainer/api -- coach-review.controller.spec.ts coach-review.service.spec.ts api-snake-case.contract.spec.ts`
- `npm run test -w @chesstrainer/web -- CoachContextPage.test.tsx CoachReviewPage.test.tsx`
- `npm run ci`

### Completion Notes List

- Added coach review API module for student import and mistake retrieval with role + access checks.
- Added coach review web page and route to import student games and inspect mistakes with board + explanation context.
- Added coach-context-to-review navigation path for coach workflow continuity.
- Added API contract coverage and dedicated web tests for the new flow.

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/6-2-coach-import-and-mistake-review.md`
- `/Users/romain/dev/ChessTrainer/apps/api/src/app.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/contracts/api-snake-case.contract.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/imports/imports.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/coach-review/coach-review.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/coach-review/coach-review.controller.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/coach-review/coach-review.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/coach-review/coach-review.controller.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/coach-review/coach-review.service.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/app/router.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.css`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/coach/CoachContextPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/coach/CoachReviewPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/coach/CoachReviewPage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/lib/coach-review.ts`
- `/Users/romain/dev/ChessTrainer/README.md`
- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/sprint-status.yaml`
