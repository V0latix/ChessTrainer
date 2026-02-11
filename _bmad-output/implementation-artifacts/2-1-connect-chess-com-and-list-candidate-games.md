# Story 2.1: Connect Chess.com and List Candidate Games

Status: review

## Story

As a user,
I want to fetch my recent Chess.com games,
so that I can choose what to import.

## Acceptance Criteria

1. Given I provide a valid Chess.com username/context, when I trigger fetch, then recent games are listed with selectable entries and unavailable periods are handled gracefully.

## Tasks / Subtasks

- [x] Add Chess.com integration service in API (AC: 1)
  - [x] Fetch archive list and recent archives for a username.
  - [x] Parse candidate game metadata for selection UI.
- [x] Add authenticated endpoint to list candidate games (AC: 1)
  - [x] Validate username input.
  - [x] Return snake_case payload with candidate games and unavailable periods.
- [x] Add onboarding UI to request and display candidate games (AC: 1)
  - [x] Add username form and fetch action.
  - [x] Render selectable list of recent games.
  - [x] Render graceful unavailable-period warnings.
- [x] Add tests for integration/controller/UI behavior (AC: 1)
  - [x] API tests for valid listing and unavailable period handling.
  - [x] UI test for fetch and list display.
- [x] Validate and document (AC: 1)
  - [x] Update README for Chess.com listing flow.
  - [x] Run `npm run ci`.

## Dev Notes

- Story scope is listing/selectable candidates only; persistent import is Story 2.2.
- Endpoint remains authenticated to keep per-user experience isolated.
- Payload casing is snake_case.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.1)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/architecture.md` (integrations/chess-com, API patterns)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run format -w @chesstrainer/api`
- `npm run ci`

### Completion Notes List

- Added Chess.com integration service that fetches recent archive months and maps candidate games into selection-ready metadata.
- Added protected API endpoint `GET /imports/chess-com/candidate-games` with username validation and snake_case response.
- Implemented graceful unavailable period handling when archive months fail to load.
- Added onboarding Chess.com section to fetch and display selectable candidate games.
- Added API tests for integration behavior and controller payload.
- Added web test covering fetch/list rendering and unavailable period warnings.
- Full local quality gate passes (`npm run ci`).

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/2-1-connect-chess-com-and-list-candidate-games.md`
- `/Users/romain/dev/ChessTrainer/apps/api/src/integrations/chess-com/chess-com.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/integrations/chess-com/chess-com.service.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/imports/imports.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/imports/imports.controller.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/imports/imports.controller.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/imports/imports.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/app.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/lib/chess-com.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.css`
- `/Users/romain/dev/ChessTrainer/.env.example`
- `/Users/romain/dev/ChessTrainer/README.md`
