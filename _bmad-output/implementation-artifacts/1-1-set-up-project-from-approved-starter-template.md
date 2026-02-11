# Story 1.1: Set Up Project from Approved Starter Template

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the monorepo initialized from the approved starters,
so that implementation starts on a consistent architecture baseline.

## Acceptance Criteria

1. Given the project is not initialized, when I run the approved starter commands for web and API, then the monorepo structure (`apps/web`, `apps/api`, `apps/worker`, `packages/shared-contracts`) exists and baseline scripts run locally in CI-compatible mode.
2. Given the web app shell is built for desktop targets, when I run the baseline performance check, then initial page load target is `< 2 seconds` and the check is executable in CI.

## Tasks / Subtasks

- [ ] Create monorepo baseline and workspace wiring (AC: 1)
  - [ ] Confirm root workspace config (`pnpm-workspace.yaml` or npm workspaces) and root scripts for `dev`, `build`, `test`, `lint`.
  - [ ] Add root TypeScript baseline config and shared lint/prettier config placeholders.
- [ ] Bootstrap frontend SPA (`apps/web`) from approved Vite React TypeScript starter (AC: 1)
  - [ ] Ensure app boots locally and build succeeds.
  - [ ] Keep desktop-first shell minimal and responsive baseline compatible.
- [ ] Bootstrap backend API (`apps/api`) from approved NestJS starter (AC: 1)
  - [ ] Use local CLI invocation (`npx @nestjs/cli@latest`) and strict TypeScript.
  - [ ] Verify API starts and health endpoint (or equivalent minimal bootstrap) works locally.
- [ ] Scaffold worker and shared-contracts package skeletons (AC: 1)
  - [ ] Create `apps/worker` entrypoint and minimal runtime script.
  - [ ] Create `packages/shared-contracts` with initial package manifest and placeholder exports.
- [ ] Add baseline CI workflow checks (AC: 1, 2)
  - [ ] Run install + typecheck + lint + build for web/api/worker in CI.
  - [ ] Add artifact/log output to debug bootstrap failures quickly.
- [ ] Implement initial page-load performance smoke check (AC: 2)
  - [ ] Add a repeatable check command for web shell load target `< 2s` in desktop baseline environment.
  - [ ] Wire check into CI as non-optional gate for this story completion.
- [ ] Documentation and developer onboarding (AC: 1)
  - [ ] Update `README.md` with local setup, commands, and expected project layout.

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

- Pending implementation.

### Completion Notes List

- Story prepared with architecture-aligned bootstrap scope.
- Ready for `dev-story` execution.

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/1-1-set-up-project-from-approved-starter-template.md`
