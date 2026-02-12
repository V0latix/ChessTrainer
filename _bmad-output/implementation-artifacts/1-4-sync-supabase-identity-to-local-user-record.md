# Story 1.4: Sync Supabase Identity to Local User Record

Status: done

## Story

As the platform,
I want to upsert a local user profile from Supabase identity,
so that all domain data references stable internal user IDs.

## Acceptance Criteria

1. Given the first authenticated API request for a Supabase `sub`, when the API validates JWT via JWKS, then a local `users` row is created or updated idempotently and domain modules use local `users.id` references.

## Tasks / Subtasks

- [x] Add persistence baseline for local users in API (AC: 1)
  - [x] Add Prisma schema for `users` table with unique Supabase subject mapping.
  - [x] Wire Prisma service/module in Nest API.
- [x] Implement Supabase JWT verification via JWKS (AC: 1)
  - [x] Validate bearer token against Supabase issuer/JWKS.
  - [x] Extract `sub` and identity claims for app usage.
- [x] Implement identity sync on authenticated API access (AC: 1)
  - [x] Add guard/service that upserts local user row idempotently by `sub`.
  - [x] Expose authenticated endpoint returning local user identity.
- [x] Trigger first authenticated API request from SPA session lifecycle (AC: 1)
  - [x] Call sync endpoint with access token after login/signup session.
- [x] Add tests and validate quality gates (AC: 1)
  - [x] Add unit tests for guard and upsert service behavior.
  - [x] Run `npm run ci`.

## Dev Notes

- Scope: identity sync only (no account deletion and no role management UI).
- Public API shape should remain snake_case.
- This story introduces foundational user identity mapping used by all future domain modules.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 1, Story 1.4)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/architecture.md` (Authentication & Security, Identity sync contract)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm install -w @chesstrainer/api @nestjs/config @prisma/client jose`
- `npm install -w @chesstrainer/api -D prisma`
- `npm run prisma:generate -w @chesstrainer/api`
- `npm run ci`

### Completion Notes List

- Added Prisma user model (`users`) keyed by unique `supabase_sub`.
- Added JWT verification service against Supabase issuer + JWKS endpoint.
- Added auth guard that verifies bearer token and performs idempotent local user upsert on each authenticated request.
- Added authenticated API endpoint `GET /auth/me` returning snake_case local identity payload.
- Wired web auth provider to call `GET /auth/me` on first active session token to trigger sync contract.
- Added API unit tests for guard behavior, identity upsert, and response shape.
- Full repo quality gate passes locally (`npm run ci`).

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/1-4-sync-supabase-identity-to-local-user-record.md`
- `/Users/romain/dev/ChessTrainer/apps/api/prisma/schema.prisma`
- `/Users/romain/dev/ChessTrainer/apps/api/src/prisma/prisma.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/prisma/prisma.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/common/types/authenticated-user.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/common/decorators/current-user.decorator.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/auth/auth.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/auth/auth.controller.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/auth/auth.controller.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/auth/supabase-jwt.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/auth/supabase-auth.guard.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/auth/supabase-auth.guard.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/auth/user-identity.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/modules/auth/user-identity.service.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/app.module.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/main.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/eslint.config.mjs`
- `/Users/romain/dev/ChessTrainer/apps/api/package.json`
- `/Users/romain/dev/ChessTrainer/apps/web/src/config/env.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/lib/auth-sync.ts`
- `/Users/romain/dev/ChessTrainer/apps/web/src/features/auth/AuthProvider.tsx`
- `/Users/romain/dev/ChessTrainer/.env.example`
- `/Users/romain/dev/ChessTrainer/README.md`
