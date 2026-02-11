# Story 1.1: Set Up Project from Approved Starter Template

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the monorepo initialized from the approved starters,
so that implementation starts on a consistent architecture baseline.

## Acceptance Criteria

1. Given the project is not initialized, when I run the approved starter commands for web and API, then the monorepo structure (`apps/web`, `apps/api`, `apps/worker`, `packages/shared-contracts`) exists and baseline scripts run locally in CI-compatible mode.
2. Given the web app shell is built for desktop targets, when I run the baseline performance check, then initial page load target is `< 2 seconds` and the check is executable in CI.

## Tasks / Subtasks

- [x] Create monorepo baseline and workspace wiring (AC: 1)
  - [x] Confirm root workspace config (`pnpm-workspace.yaml` or npm workspaces) and root scripts for `dev`, `build`, `test`, `lint`.
  - [x] Add root TypeScript baseline config and shared lint/prettier config placeholders.
- [x] Bootstrap frontend SPA (`apps/web`) from approved Vite React TypeScript starter (AC: 1)
  - [x] Ensure app boots locally and build succeeds.
  - [x] Keep desktop-first shell minimal and responsive baseline compatible.
- [x] Bootstrap backend API (`apps/api`) from approved NestJS starter (AC: 1)
  - [x] Use local CLI invocation (`npx @nestjs/cli@latest`) and strict TypeScript.
  - [x] Verify API starts and health endpoint (or equivalent minimal bootstrap) works locally.
- [x] Scaffold worker and shared-contracts package skeletons (AC: 1)
  - [x] Create `apps/worker` entrypoint and minimal runtime script.
  - [x] Create `packages/shared-contracts` with initial package manifest and placeholder exports.
- [x] Add baseline CI workflow checks (AC: 1, 2)
  - [x] Run install + typecheck + lint + build for web/api/worker in CI.
  - [x] Add artifact/log output to debug bootstrap failures quickly.
- [x] Implement initial page-load performance smoke check (AC: 2)
  - [x] Add a repeatable check command for web shell load target `< 2s` in desktop baseline environment.
  - [x] Wire check into CI as non-optional gate for this story completion.
- [x] Documentation and developer onboarding (AC: 1)
  - [x] Update `README.md` with local setup, commands, and expected project layout.

## Dev Notes

- This is a foundation story; scope must stay minimal and strictly focused on bootstrap + verification.
- Do not implement product features (auth/import/analysis/puzzles) in this story.
- Keep folder boundaries aligned with architecture decisions:
  - `apps/web`: SPA UI
  - `apps/api`: NestJS API
  - `apps/worker`: async jobs runtime
  - `packages/shared-contracts`: shared API/event/schema contracts
- Runtime baseline: Node 20+.
- Preserve future architecture constraints while scaffolding:
  - API payload boundary will be `snake_case` for public contracts.
  - Async pipeline will use Redis/BullMQ and Stockfish worker in later stories.
  - Supabase Auth integration comes in subsequent stories.

### Project Structure Notes

- Required target structure and boundaries are defined in architecture under **Project Structure & Boundaries**.
- If tooling imposes default files outside target structure, keep them only if they do not conflict; otherwise align immediately.
- Avoid introducing framework-specific patterns that contradict the selected stack (no SSR framework bootstraps, no alternative backend frameworks).

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 1, Story 1.1)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/architecture.md` (Starter Template Evaluation, Core Architectural Decisions, Project Structure & Boundaries)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/prd.md` (Performance NFRs, Web App requirements)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/ux-design-specification.md` (Platform Strategy, Responsive Strategy)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm install`
- `npm run ci` (lint, typecheck, test, build, perf budget)

### Completion Notes List

- Monorepo baseline created with npm workspaces and Node 20+ tooling.
- Frontend starter generated with Vite React TypeScript (`apps/web`) and desktop-first shell scaffolded.
- Backend starter generated with NestJS strict TypeScript (`apps/api`) and `/health` endpoint exposed.
- Worker and shared contracts skeletons added (`apps/worker`, `packages/shared-contracts`).
- CI workflow added with logs artifact upload and full baseline checks.
- Performance smoke gate added as repeatable bundle-budget estimate check targeting `< 2s`.
- Root README and baseline config files added for onboarding.

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/1-1-set-up-project-from-approved-starter-template.md`
- `/Users/romain/dev/ChessTrainer/package.json`
- `/Users/romain/dev/ChessTrainer/package-lock.json`
- `/Users/romain/dev/ChessTrainer/tsconfig.base.json`
- `/Users/romain/dev/ChessTrainer/.editorconfig`
- `/Users/romain/dev/ChessTrainer/.eslintrc.cjs`
- `/Users/romain/dev/ChessTrainer/.prettierrc.json`
- `/Users/romain/dev/ChessTrainer/.env.example`
- `/Users/romain/dev/ChessTrainer/.gitignore`
- `/Users/romain/dev/ChessTrainer/README.md`
- `/Users/romain/dev/ChessTrainer/scripts/perf-web-shell-check.mjs`
- `/Users/romain/dev/ChessTrainer/.github/workflows/ci.yml`
- `/Users/romain/dev/ChessTrainer/apps/web/package.json`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/App.css`
- `/Users/romain/dev/ChessTrainer/apps/web/src/index.css`
- `/Users/romain/dev/ChessTrainer/apps/web/src/components/Board/Board.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/components/Puzzle/Puzzle.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/components/ExplanationPanel/ExplanationPanel.tsx`
- `/Users/romain/dev/ChessTrainer/apps/web/src/components/ProgressSummary/ProgressSummary.tsx`
- `/Users/romain/dev/ChessTrainer/apps/api/package.json`
- `/Users/romain/dev/ChessTrainer/apps/api/tsconfig.json`
- `/Users/romain/dev/ChessTrainer/apps/api/src/main.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/app.controller.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/app.controller.spec.ts`
- `/Users/romain/dev/ChessTrainer/apps/api/src/app.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/worker/package.json`
- `/Users/romain/dev/ChessTrainer/apps/worker/tsconfig.json`
- `/Users/romain/dev/ChessTrainer/apps/worker/src/main.ts`
- `/Users/romain/dev/ChessTrainer/packages/shared-contracts/package.json`
- `/Users/romain/dev/ChessTrainer/packages/shared-contracts/tsconfig.json`
- `/Users/romain/dev/ChessTrainer/packages/shared-contracts/src/index.ts`
- `/Users/romain/dev/ChessTrainer/packages/shared-contracts/src/api/health.ts`
- `/Users/romain/dev/ChessTrainer/packages/shared-contracts/src/events/analysis-requested.ts`
- `/Users/romain/dev/ChessTrainer/packages/shared-contracts/src/schemas/index.ts`
- `/Users/romain/dev/ChessTrainer/packages/shared-contracts/src/types/index.ts`
