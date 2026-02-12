# Story 1.2: Register Account with Age Gate

Status: done

## Story

As a chess player,
I want to create an account and confirm I am at least 16,
so that I can access the product compliantly.

## Acceptance Criteria

1. Given I submit valid email/password and age confirmation, when registration succeeds, then my account is created and I can access authenticated onboarding.
2. Given I do not confirm age >= 16, when I submit registration, then the account is not created and I receive a clear blocking message.

## Tasks / Subtasks

- [x] Add web auth dependencies and configuration for Supabase integration (AC: 1, 2)
  - [x] Add required packages for routing and Supabase auth client.
  - [x] Extend env config with Supabase URL and anon key.
- [x] Build registration flow with age gate in SPA (AC: 1, 2)
  - [x] Create registration form with email/password and age confirmation checkbox.
  - [x] Block submit when age confirmation is missing and show clear message.
  - [x] Create account through Supabase auth signup.
- [x] Add authenticated onboarding route guard (AC: 1)
  - [x] Track auth session state and protect onboarding route.
  - [x] Redirect unauthenticated users away from onboarding.
- [x] Add test coverage for age gate behavior and successful signup path (AC: 1, 2)
  - [x] Verify signup is blocked when age gate is unchecked.
  - [x] Verify signup path reaches onboarding when session is returned.
- [x] Update docs and run validation commands (AC: 1, 2)
  - [x] Document required env vars and run commands in README.
  - [x] Run lint/typecheck/test/build to confirm story readiness.

## Dev Notes

- Scope of this story is registration + age gate only.
- Login/logout and identity synchronization are handled by stories 1.3 and 1.4.
- Platform and UX constraints:
  - Desktop-first SPA
  - Clear blocking feedback on age-gate failure
- Auth provider contract:
  - Supabase Auth from web client
  - JWT/session consumed by protected routing in SPA

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 1, Story 1.2)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/architecture.md` (Authentication & Security, Frontend Architecture)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/prd.md` (FR1, FR4)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm install -w @chesstrainer/web react-router-dom @supabase/supabase-js`
- `npm install -w @chesstrainer/web -D @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom`
- `npm run ci`

### Completion Notes List

- Supabase signup wiring added in SPA with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Registration form now blocks submission unless age >=16 checkbox is confirmed.
- Protected onboarding route is accessible only with active auth session.
- Unit tests added for age-gate block and successful signup path.
- Full local validation run passed (`npm run ci`).

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/1-2-register-account-with-age-gate.md`
- `/Users/romain/dev/ChessTrainer/apps/web/src/config/env.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/lib/supabase.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/auth-context.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/AuthProvider.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/ProtectedRoute.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/RegisterPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/RegisterPage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/app/providers.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/app/router.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/test/setup.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/main.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.css`
- `/Users/romain/dev/ChessTrainer/apps/web/vite.config.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/package.json`
- `/Users/romain/dev/ChessTrainer/.env.example`
- `/Users/romain/dev/ChessTrainer/README.md`
