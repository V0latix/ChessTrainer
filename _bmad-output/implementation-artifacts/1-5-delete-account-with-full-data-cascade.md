# Story 1.5: Delete Account with Full Data Cascade

Status: review

## Story

As a user,
I want to delete my account and associated data,
so that I retain control over my personal data.

## Acceptance Criteria

1. Given I request account deletion and confirm the action, when deletion executes, then account and associated domain data are removed and I am logged out immediately.

## Tasks / Subtasks

- [x] Implement account deletion service in API (AC: 1)
  - [x] Delete local user data in transaction (foundation for cascade).
  - [x] Delete Supabase auth user via admin API/service role key.
- [x] Add protected API endpoint for account deletion (AC: 1)
  - [x] Require authenticated bearer token.
  - [x] Require explicit confirmation input in request body.
- [x] Add web account deletion flow in onboarding (AC: 1)
  - [x] Add confirmation UI and deletion action.
  - [x] Trigger immediate logout and redirect to login after success.
- [x] Add tests for deletion path and confirmation enforcement (AC: 1)
  - [x] API unit tests for service/controller behavior.
  - [x] Web test for confirmation gate and logout action.
- [x] Validate quality gates and update docs (AC: 1)
  - [x] Document required API env for delete operation.
  - [x] Run `npm run ci`.

## Dev Notes

- This story must remain privacy-safe: explicit confirmation required before deletion.
- Local data cascade is currently scoped to available persisted entities (`users` table baseline), but service should be structured for future domain cascades.
- API contracts remain snake_case.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 1, Story 1.5)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/architecture.md` (Identity and privacy lifecycle)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run format -w @chesstrainer/api`
- `npm run ci`

### Completion Notes List

- Added account deletion service that removes Supabase auth identity via admin API and then deletes local user row in transaction.
- Added protected endpoint `POST /auth/delete-account` requiring `confirm_deletion=true`.
- Added onboarding danger zone UI with explicit confirmation checkbox before delete action.
- On successful deletion, web logs out immediately and redirects to login.
- Added API tests for deletion service and controller confirmation checks.
- Added web tests for deletion confirmation gate and delete+logout flow.
- Full quality gate passes locally (`npm run ci`).

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/1-5-delete-account-with-full-data-cascade.md`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/auth/account-deletion.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/auth/account-deletion.service.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/auth/auth.controller.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/auth/auth.controller.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/auth/auth.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/eslint.config.mjs`
- `/Users/romain/dev/ChessTrainer/apps/web/src/lib/account-delete.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.css`
- `/Users/romain/dev/ChessTrainer/.env.example`
- `/Users/romain/dev/ChessTrainer/README.md`
