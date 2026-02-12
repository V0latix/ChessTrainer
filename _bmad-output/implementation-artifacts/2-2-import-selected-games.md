# Story 2.2: Import Selected Games

Status: done

## Story

As a user,
I want to import selected games only,
so that my training corpus is relevant.

## Acceptance Criteria

1. Given one or more games are selected, when I confirm import, then only selected games are persisted and import summary shows success/failure counts.

## Tasks / Subtasks

- [x] Add game persistence model and API data access (AC: 1)
  - [x] Extend Prisma schema for imported games.
  - [x] Add import service logic to persist selected games.
- [x] Add import-selected endpoint in API (AC: 1)
  - [x] Accept selected game URLs from authenticated user.
  - [x] Persist selected games only and return summary counts.
- [x] Add onboarding action to import selected games (AC: 1)
  - [x] Send selected game URLs to API.
  - [x] Show success/failure summary in UI.
- [x] Add tests for import behavior (AC: 1)
  - [x] API tests for selected-only persistence and summary counts.
  - [x] UI test for import action and summary rendering.
- [x] Validate and document (AC: 1)
  - [x] Update README import flow notes.
  - [x] Run `npm run ci`.

## Dev Notes

- Scope is explicit selected import only.
- Dedup/re-import logic is Story 2.3; current implementation should be compatible.
- API response remains snake_case.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.2)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/architecture.md` (imports module, Prisma persistence)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run prisma:generate -w @chesstrainer/api`
- `npm run format -w @chesstrainer/api`
- `npm run ci`

### Completion Notes List

- Added persistent `games` model with authenticated user ownership and unique `(user_id, game_url)` constraint.
- Added API endpoint `POST /imports/chess-com/import-selected` to import selected Chess.com game URLs only.
- Implemented import summary with `selected_count`, `imported_count`, `already_existing_count`, and `failed_count`.
- Added onboarding action to import selected games and render import summary feedback.
- Added API tests (integration/controller/service) and web test for selected import flow.
- Full local quality gate passes (`npm run ci`).

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/2-2-import-selected-games.md`
- `/Users/romain/dev/ChessTrainer/apps/api/prisma/schema.prisma`
- `/Users/romain/dev/ChessTrainer/apps/api/src/integrations/chess-com/chess-com.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/imports/imports.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/imports/imports.service.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/imports/imports.controller.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/imports/imports.controller.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/lib/chess-com.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.css`
- `/Users/romain/dev/ChessTrainer/README.md`
