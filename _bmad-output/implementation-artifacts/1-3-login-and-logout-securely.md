# Story 1.3: Login and Logout Securely

Status: done

## Story

As a registered user,
I want to log in and out securely,
so that only I can access my training data.

## Acceptance Criteria

1. Given valid credentials, when I log in, then I receive a valid authenticated session and protected routes become accessible.
2. Given I am authenticated, when I log out, then the session is invalidated and protected routes require re-authentication.

## Tasks / Subtasks

- [x] Build login UI and Supabase sign-in flow (AC: 1)
  - [x] Add dedicated login page with email/password fields.
  - [x] Implement sign-in call and clear error feedback.
- [x] Extend route structure for auth lifecycle (AC: 1, 2)
  - [x] Add routing between register, login, and protected onboarding.
  - [x] Redirect authenticated users away from auth pages.
- [x] Implement logout from protected area (AC: 2)
  - [x] Add logout action in onboarding shell.
  - [x] Invalidate session with Supabase sign-out and redirect to login.
- [x] Add tests for login success/failure and logout behavior (AC: 1, 2)
  - [x] Verify successful login reaches protected route.
  - [x] Verify logout removes access to protected route.
- [x] Validate full project checks and document updates (AC: 1, 2)
  - [x] Update README auth flow notes.
  - [x] Run `npm run ci`.

## Dev Notes

- Scope: login/logout only; account deletion and identity sync are separate stories.
- Keep desktop-first UX with clear messages and low friction.
- Use Supabase auth APIs from SPA client; do not introduce backend login in this story.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 1, Story 1.3)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/architecture.md` (Authentication & Security, Frontend Architecture)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/prd.md` (FR2)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run ci`

### Completion Notes List

- Login page added with Supabase `signInWithPassword` and explicit error feedback.
- Onboarding now includes logout action that invalidates session with `signOut`.
- Auth routing now includes `/login`, `/register`, protected `/onboarding`, and unauthenticated fallback to login.
- Auth pages now redirect authenticated users to onboarding.
- Tests added for login success/failure, logout action, and protected-route re-auth behavior.
- Full quality gate passed locally (`npm run ci`).

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/1-3-login-and-logout-securely.md`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/LoginPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/ProtectedRoute.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/LoginPage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/ProtectedRoute.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/RegisterPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/RegisterPage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/app/router.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.css`
- `/Users/romain/dev/ChessTrainer/README.md`
