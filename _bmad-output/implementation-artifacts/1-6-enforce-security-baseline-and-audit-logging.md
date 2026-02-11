# Story 1.6: Enforce Security Baseline and Audit Logging

Status: review

## Story

As a platform owner,
I want security controls and audit logging enabled by default,
so that compliance and incident traceability are guaranteed.

## Acceptance Criteria

1. Given API and web services are deployed, when security checks run, then all external traffic is HTTPS-only and secrets are never exposed to client bundles.
2. Given a sensitive action occurs (login, deletion, data export/deletion), when the action is processed, then an audit log entry is created with actor, action, timestamp, and trace identifier and audit entries are queryable for support/compliance.

## Tasks / Subtasks

- [x] Enforce transport and header security baseline in API (AC: 1)
  - [x] Add production HTTPS-only enforcement.
  - [x] Add baseline security headers middleware.
- [x] Add client bundle secret exposure gate (AC: 1)
  - [x] Add CI-executable security check for web build output.
  - [x] Fail the gate when server-side secret signatures are detected.
- [x] Implement audit log storage and query (AC: 2)
  - [x] Add `audit_logs` persistence model.
  - [x] Add query endpoint for authenticated audit log review.
- [x] Audit sensitive actions currently available in MVP (AC: 2)
  - [x] Log login/session sync action.
  - [x] Log account deletion action.
- [x] Validate and document security controls (AC: 1, 2)
  - [x] Update README/env notes.
  - [x] Run `npm run ci`.

## Dev Notes

- Scope is MVP security baseline with practical enforceable controls in current architecture.
- Data export/deletion audit action types should be prepared for future endpoints.
- Keep API payload casing in snake_case.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 1, Story 1.6)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/architecture.md` (Security controls, audit logging)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm install -w @chesstrainer/api helmet`
- `npm run prisma:generate -w @chesstrainer/api`
- `npm run format -w @chesstrainer/api`
- `npm run ci`

### Completion Notes List

- Added API production HTTPS-only enforcement with `x-forwarded-proto` check and `426 HTTPS_REQUIRED` response.
- Added API security headers with Helmet and request trace propagation (`x-trace-id`).
- Added web bundle secret-exposure gate (`scripts/security-baseline-check.mjs`) and wired it in CI + root `ci`.
- Added persistent `audit_logs` model and service with query support.
- Added authenticated query endpoint `GET /auth/audit-logs`.
- Logged sensitive actions for login/session sync and account deletion with actor/action/timestamp/trace identifier.
- Full local quality gate is green (`npm run ci`).

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/1-6-enforce-security-baseline-and-audit-logging.md`
- `/Users/romain/dev/ChessTrainer/apps/api/prisma/schema.prisma`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/auth/audit-log.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/auth/audit-log.service.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/auth/auth.controller.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/auth/auth.controller.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/auth/auth.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/common/types/authenticated-user.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/main.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/package.json`
- `/Users/romain/dev/ChessTrainer/scripts/security-baseline-check.mjs`
- `/Users/romain/dev/ChessTrainer/package.json`
- `/Users/romain/dev/ChessTrainer/.github/workflows/ci.yml`
- `/Users/romain/dev/ChessTrainer/README.md`
