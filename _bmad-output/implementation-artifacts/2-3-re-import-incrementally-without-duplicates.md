# Story 2.3: Re-import Incrementally Without Duplicates

Status: review

## Story

As a returning user,
I want to re-import new games without duplicate records,
so that my dataset stays clean.

## Acceptance Criteria

1. Given games were already imported previously, when I run re-import, then only new games are inserted and existing games are skipped by deterministic dedup logic.

## Tasks / Subtasks

- [x] Add API re-import endpoint (AC: 1)
  - [x] Add authenticated re-import route for Chess.com username.
  - [x] Return summary with inserted/skipped counts.
- [x] Implement deterministic dedup logic in imports service (AC: 1)
  - [x] Reuse unique key `(user_id, game_url)` for duplicate detection.
  - [x] Ensure existing games are skipped, not overwritten.
- [x] Add onboarding action for re-import (AC: 1)
  - [x] Add UI action to re-import recent archives.
  - [x] Show summary feedback to user.
- [x] Add tests for re-import behavior (AC: 1)
  - [x] API tests for inserted/skipped counts.
  - [x] UI test for re-import action and result.
- [x] Validate and document (AC: 1)
  - [x] Update README re-import notes.
  - [x] Run `npm run ci`.

## Dev Notes

- This story focuses on incremental sync behavior for existing users.
- Deduplication must remain deterministic and user-scoped.
- API payload casing remains snake_case.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.3)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/architecture.md` (imports + data boundaries)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -w @chesstrainer/api -- imports.service.spec.ts imports.controller.spec.ts`
- `npm run test -w @chesstrainer/web -- OnboardingPage.test.tsx`
- `npm run format -w @chesstrainer/api`
- `npm run ci`

### Completion Notes List

- Added authenticated API endpoint `POST /imports/chess-com/reimport` with snake_case payload/response.
- Implemented incremental re-import service flow that scans recent archives and persists only new games.
- Kept deterministic dedup behavior by reusing unique lookup `(user_id, game_url)` and skipping existing rows.
- Added onboarding re-import action and summary UI (`scanned`, `imported`, `already existing`, `failed`).
- Added API service/controller tests and web onboarding test for the re-import path.
- Full quality gate passes locally (`npm run ci`).

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/2-3-re-import-incrementally-without-duplicates.md`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/imports/imports.controller.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/imports/imports.controller.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/imports/imports.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/imports/imports.service.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/lib/chess-com.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.css`
- `/Users/romain/dev/ChessTrainer/README.md`
