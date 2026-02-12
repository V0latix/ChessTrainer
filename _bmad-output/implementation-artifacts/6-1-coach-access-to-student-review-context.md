# Story 6.1: Coach Access to Student Review Context

Status: done

## Story

As a coach,
I want to open an authorized student context,
so that I can review the correct student's games.

## Acceptance Criteria

1. Given I am authenticated with coach role, when I select a student context, then authorized student data becomes available.
2. Unauthorized access is blocked.

## Tasks / Subtasks

- [x] Add coach authorization data model (AC: 1, 2)
  - [x] Add `CoachStudentAccess` relation model in Prisma schema.
  - [x] Wire bi-directional relations on `User`.
- [x] Add coach context backend module (AC: 1, 2)
  - [x] Add authenticated `GET /coach/students` endpoint.
  - [x] Add authenticated `POST /coach/context/select` endpoint.
  - [x] Enforce coach role guard logic in service and block unauthorized selections.
- [x] Build coach context web flow (AC: 1, 2)
  - [x] Add coach context API client in web.
  - [x] Add protected route `/coach/context`.
  - [x] Implement context selection screen with authorized student list and selected context card.
  - [x] Persist selected context metadata in localStorage for follow-up stories.
- [x] Validate and document (AC: 1, 2)
  - [x] Add API controller/service tests.
  - [x] Extend snake_case contract tests.
  - [x] Add web tests for coach context page.
  - [x] Run `npm run ci` and update docs.

## Dev Notes

- Role enforcement uses existing authenticated user role (`user` vs `coach`) from auth guard context.
- Authorized scope is explicit via `CoachStudentAccess` relation; no implicit coach-wide access.
- Selected context persistence in localStorage is intentionally lightweight and scoped for Story 6.2 handoff.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 6, Story 6.1)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/prd.md` (FR18)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run prisma:generate -w @chesstrainer/api`
- `npm run test -w @chesstrainer/api -- coach-context.controller.spec.ts coach-context.service.spec.ts api-snake-case.contract.spec.ts`
- `npm run test -w @chesstrainer/web -- CoachContextPage.test.tsx OnboardingPage.test.tsx`
- `npm run lint -w @chesstrainer/api`
- `npm run typecheck -w @chesstrainer/api`
- `npm run lint -w @chesstrainer/web`
- `npm run typecheck -w @chesstrainer/web`
- `npm run ci`

### Completion Notes List

- Added explicit coach→student authorization model.
- Added coach endpoints to list authorized students and select one review context.
- Added role-based access control enforcement for coach-only operations.
- Added coach context page and route with selection UX and persisted chosen context metadata.
- Added API/web/contract tests and validated full CI.

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/6-1-coach-access-to-student-review-context.md`
- `/Users/romain/dev/ChessTrainer/apps/api/prisma/schema.prisma`
- `/Users/romain/dev/ChessTrainer/apps/api/src/app.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/coach-context/coach-context.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/coach-context/coach-context.controller.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/coach-context/coach-context.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/coach-context/coach-context.controller.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/coach-context/coach-context.service.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/contracts/api-snake-case.contract.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/lib/coach-context.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/coach/CoachContextPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/coach/CoachContextPage.test.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/app/router.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/OnboardingPage.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.css`
