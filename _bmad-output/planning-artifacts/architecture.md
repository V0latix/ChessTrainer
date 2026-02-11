---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - /Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/product-brief-BMAD-2026-02-05.md
  - /Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/prd.md
  - /Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/ux-design-specification.md
  - /Users/romain/dev/ChessTrainer/_bmad-output/brainstorming/brainstorming-session-2026-02-05-170601.md
workflowType: 'architecture'
project_name: 'ChessTrainer'
user_name: 'Romain'
date: '2026-02-11'
lastStep: 8
status: 'complete'
completedAt: '2026-02-11'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
ChessTrainer requires a full training loop from account onboarding to mistake-driven replay:
- Account lifecycle: signup/login/logout, age gate (16+), full account/data deletion.
- Chess.com import: connect account, import selected recent games, re-import without duplicates.
- Analysis engine: run Stockfish on imported games, detect critical mistakes with eval drop >= 2.0, summarize recurring mistakes.
- Training flow: open mistake positions, replay best move, retry failures, progress through puzzle sequences.
- Explanation layer: explain why the played move was wrong and why the best move is correct.
- Progress layer: show session outcomes and recurring mistake trends.
- Secondary coach usage: review student games and mistakes.
- System feedback: visible analysis progress + ETA + completion state.
- Data transparency: user-visible stored-data summary and deletion requests.

**Non-Functional Requirements:**
Architecture must satisfy:
- Performance: initial load < 2s, puzzle page < 1s, interaction latency < 200ms.
- Analysis SLA: game analysis <= 1 min, puzzle generation <= 5s.
- Availability: 99% uptime target.
- Security: HTTPS in transit, encryption at rest, sensitive-data access logging.
- Accessibility: WCAG 2.1 AA.
- Integration resilience: Chess.com rate-limit handling with retry + exponential backoff.
- Compliance: GDPR-aligned consent, retention, and deletion handling.

**Scale & Complexity:**
This is a medium-complexity full-stack web application with asynchronous compute workflows.

- Primary domain: Full-stack web app (SPA + backend analysis pipeline)
- Complexity level: Medium
- Estimated architectural components: 10-12

### Technical Constraints & Dependencies

- Mandatory integration with Chess.com import APIs and rate-limit constraints.
- Stockfish-based analysis is a hard dependency for core value delivery.
- Asynchronous analysis pipeline with progress visibility is required (polling-based updates, no realtime websocket requirement in MVP).
- Data retention policy: retain imported games until user deletion request/account deletion.
- EU/France-first GDPR constraints shape storage and deletion design.
- Browser/platform scope baseline is locked to Chrome + Safari desktop for MVP.

### Cross-Cutting Concerns Identified

- Authentication, authorization, and age-gate enforcement.
- Privacy lifecycle management (consent, retention, right to delete, account deletion cascade).
- Idempotent import + deduplication across repeated Chess.com syncs.
- Job orchestration reliability for analysis/extraction pipeline (retries, failures, partial completion).
- Observability for analysis latency, queue depth, error rates, and uptime objectives.
- Explanation quality consistency and traceability (trust-critical UX moment).
- Accessibility-first interaction patterns, including keyboard support for board/puzzle flows.
- Cost control for compute-heavy analysis workloads in solo-dev MVP context.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application with:
- SPA frontend (desktop-first)
- Backend API for import/orchestration
- Async analysis workers for Stockfish jobs

### Starter Options Considered

1. Vite (React + TypeScript)
- Excellent fit for strict SPA requirement.
- Lightweight and fast for a solo-dev MVP.
- Official CLI/templates actively maintained.

2. TanStack Start
- Modern full-stack features (SSR/server functions).
- Adds server-centric patterns not required for current SPA-first MVP.

3. Create T3 App
- Strong production stack, but Next.js-oriented.
- Less aligned with explicit SPA constraint for this project.

4. Backend starter candidates
- NestJS CLI: strong modular structure (controllers/services/modules), good for growth.
- Hono (`create-hono`): very lightweight API option.

### Selected Starter: Vite (React + TypeScript) + NestJS API Baseline

**Rationale for Selection:**
The project needs a strict SPA UX plus a robust backend pipeline (Chess.com import, async analysis, explanation generation).
A dual-starter baseline gives the best speed/structure balance:
- Vite for SPA speed and simplicity
- NestJS for backend structure and scalability

**Initialization Command:**

```bash
# Frontend SPA
npm create vite@latest chesstrainer-web -- --template react-ts

# Backend API
npx @nestjs/cli@latest new chesstrainer-api --strict
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript-first frontend and backend
- Node.js runtime baseline

**Styling Solution:**
- Minimal CSS baseline from Vite template
- Design system/theming layered afterward (per UX spec)

**Build Tooling:**
- Vite build/dev server for frontend
- Nest CLI build/start workflow for backend

**Testing Framework:**
- Nest starter includes test scaffolding by default
- Frontend tests added explicitly in implementation stories (Vitest + RTL)

**Code Organization:**
- Clear frontend/backend separation from day one
- Backend modular organization (controllers/services/modules)

**Development Experience:**
- Fast local loop (HMR + watch)
- Strict TypeScript option on backend
- Maintainable baseline for MVP evolution

**Note:** Project initialization with these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Frontend: Vite + React + TypeScript SPA
- Backend: NestJS API + worker pattern
- Database: PostgreSQL 18.x
- Queue/async jobs: Redis 8.x + BullMQ
- Auth: Supabase Auth (JWT)
- API style: REST + polling for analysis jobs

**Important Decisions (Shape Architecture):**
- ORM/migrations: Prisma + Prisma Migrate
- Front state/data: TanStack Query + Zustand
- Validation: Zod at API boundaries + DTO validation in Nest
- Observability: structured logs + Sentry
- Hosting baseline: Railway (API/worker/Postgres/Redis), frontend static deployment

**Deferred Decisions (Post-MVP):**
- Realtime (WebSocket/SSE)
- GraphQL
- Multi-region deployment
- Event bus beyond Redis queue
- Advanced RBAC policies per coach/student org model

### Data Architecture

- **Primary DB:** PostgreSQL 18.x
- **ORM:** Prisma
- **Migrations:** Prisma Migrate (versioned, CI-validated)
- **Async orchestration:** BullMQ queues backed by Redis 8.x
- **Data validation:** Zod schemas at API contracts + strict DTO validation
- **Caching strategy (MVP):**
  - Short-lived cache for analysis status/progress
  - No aggressive domain caching before real usage metrics
- **Stockfish runtime model (MVP):**
  - Native Stockfish binary bundled in the worker container image
  - Job time limit: 60 seconds per analyzed game
  - Job retries: max 2 with exponential backoff on transient failures
  - Resource policy: worker-concurrency capped and CPU/memory quotas set at deploy level

### Authentication & Security

- **Auth provider:** Supabase Auth
- **Auth flow MVP:** email/password (magic link possible later without architecture rewrite)
- **Token model:** Supabase access JWT (short-lived) + refresh managed by Supabase client
- **Backend verification:** Nest API verifies Supabase JWT via project JWKS
- **Authorization model:** app-level roles (`user`, `coach`) stored in app DB, mapped by `sub` (Supabase user id)
- **Identity sync contract (Supabase -> app user):**
  - On first authenticated API request, API performs idempotent upsert of local `users` row keyed by `sub`
  - All domain records reference local `users.id`; no domain table references raw provider IDs directly
  - Missing local user row is auto-created before access to feature modules
- **Secrets policy:** Supabase service keys server-only; never exposed client-side
- **Security controls:** HTTPS everywhere, rate limiting, CORS allowlist, audit logs for sensitive actions

### API & Communication Patterns

- **Protocol:** REST JSON
- **Documentation:** OpenAPI/Swagger from Nest decorators
- **Error contract:** standardized error payload (`code`, `message`, `details`, `traceId`)
- **Async analysis pattern:**
  - `POST /imports` -> enqueue
  - `POST /analysis/jobs` -> enqueue
  - `GET /analysis/jobs/:id` -> polling status/progress/ETA
- **Resilience:** retry + exponential backoff for Chess.com API limits

### Frontend Architecture

- **Routing:** React Router
- **Server state:** TanStack Query
- **Local UI state:** Zustand
- **Forms:** React Hook Form + Zod resolver
- **Core custom modules:** Board, Puzzle, Explanation Panel, Progress Summary
- **Performance baseline:** route-level code splitting + lazy loading for heavy training views

### Infrastructure & Deployment

- **Runtime baseline:** Node 20+ (compatible with current Vite/Nest requirements)
- **Hosting (MVP):**
  - API + worker + Postgres + Redis on Railway
  - Frontend SPA deployment on static hosting/CDN
- **CI/CD:** GitHub Actions (lint, test, build, deploy)
- **Env strategy:** `dev`, `staging`, `prod` with strict secret separation
- **Monitoring:** Sentry (frontend/backend) + structured logs + uptime checks

### Decision Impact Analysis

**Implementation Sequence:**
1. Bootstrap frontend/backend projects
2. Provision Postgres/Redis infrastructure
3. Integrate Supabase Auth and JWT verification in API
4. Build Chess.com import pipeline + job queue
5. Implement analysis worker (Stockfish integration)
6. Expose polling endpoints + progress model
7. Build puzzle/explanation UX loop
8. Add observability and harden NFRs

**Cross-Component Dependencies:**
- Supabase Auth impacts API guards, profile model, and onboarding UX.
- Redis/BullMQ impacts import, analysis, and progress-tracking endpoints.
- Polling contract impacts frontend session flow and perceived responsiveness.
- Prisma schema choices impact explanation storage, replay generation, and trend analytics.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
12 areas where AI agents could diverge and create integration conflicts.

### Naming Patterns

**Database Naming Conventions:**
- Tables: plural `snake_case` (`users`, `games`, `analysis_jobs`).
- Columns: `snake_case` (`user_id`, `created_at`).
- Foreign keys: `<entity>_id` (`game_id`).
- Indexes: `idx_<table>_<column>` (`idx_games_user_id`).

**API Naming Conventions:**
- REST resources: plural kebab-case (`/users`, `/analysis-jobs`).
- Route params: `:id` style in router definitions.
- Query params: `snake_case` (`from_date`, `page_size`).
- Headers: standard HTTP casing; custom headers prefixed `x-`.

**Code Naming Conventions:**
- Components/classes/types: `PascalCase` (`PuzzleBoard`, `AnalysisJobDto`).
- Variables/functions: `camelCase` (`fetchAnalysisJob`, `userId`).
- Constants/env keys: `SCREAMING_SNAKE_CASE`.
- Files:
  - React components: `PascalCase.tsx`
  - Utilities/hooks/services: `kebab-case.ts`

### Structure Patterns

**Project Organization:**
- Feature-first organization on frontend (`features/puzzles`, `features/import`).
- Backend by Nest module (`modules/auth`, `modules/analysis`, `modules/imports`).
- Shared contracts in a dedicated package/folder (`shared/contracts`).

**File Structure Patterns:**
- Tests co-located with source (`*.spec.ts`, `*.test.tsx`).
- Integration/e2e tests in dedicated folders (`apps/api/test/e2e`).
- Static assets grouped by feature when feature-specific, otherwise `assets/`.
- Config centralized under `config/` with env-specific overlays.

### Format Patterns

**API Response Formats:**
- Success shape:
  - `{ "data": ..., "meta": { "traceId": "..." } }`
- Error shape:
  - `{ "error": { "code": "...", "message": "...", "details": ... }, "meta": { "traceId": "..." } }`
- Dates in API: ISO 8601 UTC strings.

**Data Exchange Formats:**
- External boundary (API/DB contracts): `snake_case`.
- Internal frontend models: `camelCase`.
- Mapping layer mandatory at API client boundary.
- Booleans always `true/false`; no `0/1` boolean encoding.
- OpenAPI + contract tests must enforce `snake_case` API payloads.

### Communication Patterns

**Event System Patterns:**
- Queue/event names: `domain.action` (`analysis.requested`, `import.completed`).
- Payload baseline fields:
  - `event_id`, `occurred_at`, `version`, `trace_id`, `data`
- Event versioning: integer `version` starting at `1`.

**State Management Patterns:**
- Server state only in TanStack Query.
- UI/session local state only in Zustand.
- No duplicated ownership of same state in both stores.
- Query keys standardized as arrays (`['analysisJobs', jobId]`).

### Process Patterns

**Error Handling Patterns:**
- Domain errors mapped to stable API codes (`IMPORT_RATE_LIMITED`, `ANALYSIS_FAILED`).
- User-facing errors are concise, actionable, non-technical.
- Technical details go to logs/Sentry, not to UI.
- Every backend error response includes `traceId`.

**Loading State Patterns:**
- Async operations expose explicit state machine:
  - `idle | loading | success | error`
- Long jobs show progress + ETA from polling endpoint.
- Initial load: skeletons.
- Empty results: explicit empty state with one next action.

### Enforcement Guidelines

**All AI Agents MUST:**
- Follow naming and response format rules exactly.
- Keep state ownership boundaries (Query vs Zustand).
- Use standardized error and loading patterns across features.

**Pattern Enforcement:**
- PR checklist includes "Pattern Compliance" section.
- Lint/type checks + contract tests enforce naming and DTO/response schemas.
- CI must fail on API contract mismatch (including non-`snake_case` fields in public payloads).
- Any intentional deviation must be documented in architecture decision notes.

### Pattern Examples

**Good Examples:**
- Endpoint: `GET /analysis-jobs/:id`
- Success response: `{ "data": { "job_id": "..." }, "meta": { "traceId": "..." } }`
- Frontend mapper: `job_id -> jobId` at API client boundary.

**Anti-Patterns:**
- Mixing `camelCase` and `snake_case` in same API payload.
- Returning raw exception messages to users.
- Storing same server state in both Query cache and Zustand.
- Feature files spread inconsistently across unrelated folders.

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
chesstrainer/
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .editorconfig
├── .gitignore
├── .env.example
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── apps/
│   ├── web/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   ├── public/
│   │   │   └── assets/
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── app/
│   │       │   ├── router.tsx
│   │       │   ├── providers.tsx
│   │       │   └── query-client.ts
│   │       ├── config/
│   │       │   └── env.ts
│   │       ├── features/
│   │       │   ├── auth/
│   │       │   ├── imports/
│   │       │   ├── analysis-jobs/
│   │       │   ├── puzzles/
│   │       │   ├── explanations/
│   │       │   └── progress/
│   │       ├── components/
│   │       │   ├── Board/
│   │       │   ├── Puzzle/
│   │       │   ├── ExplanationPanel/
│   │       │   └── ProgressSummary/
│   │       ├── stores/
│   │       ├── hooks/
│   │       ├── lib/
│   │       ├── styles/
│   │       └── test/
│   ├── api/
│   │   ├── package.json
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── config/
│   │   │   ├── common/
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── filters/
│   │   │   │   ├── decorators/
│   │   │   │   └── errors/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── imports/
│   │   │   │   ├── games/
│   │   │   │   ├── analysis-jobs/
│   │   │   │   ├── puzzles/
│   │   │   │   ├── explanations/
│   │   │   │   └── progress/
│   │   │   ├── integrations/
│   │   │   │   ├── chess-com/
│   │   │   │   └── stockfish/
│   │   │   └── queue/
│   │   └── test/
│   │       ├── unit/
│   │       ├── integration/
│   │       └── e2e/
│   └── worker/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── main.ts
│           ├── jobs/
│           │   ├── import-games.job.ts
│           │   ├── analyze-game.job.ts
│           │   └── generate-puzzle.job.ts
│           ├── services/
│           └── test/
├── packages/
│   ├── shared-contracts/
│   │   ├── package.json
│   │   └── src/
│   │       ├── api/
│   │       ├── events/
│   │       ├── schemas/
│   │       └── types/
│   └── eslint-config/
│       └── index.js
├── infra/
│   ├── docker/
│   │   └── docker-compose.dev.yml
│   └── railway/
│       └── README.md
└── docs/
    ├── architecture/
    ├── api/
    └── runbooks/
```

### Architectural Boundaries

**API Boundaries:**
- `apps/web` never talks directly to DB.
- All data access goes through `apps/api` REST endpoints.
- Auth boundary: Supabase token validation in API guards only.
- Worker never exposes public HTTP API.

**Component Boundaries:**
- UI feature modules in `apps/web/src/features/*`.
- Shared UI primitives stay isolated from feature business logic.
- Custom MVP components (`Board`, `Puzzle`, `ExplanationPanel`, `ProgressSummary`) remain decoupled from API clients.

**Service Boundaries:**
- API module = one business domain (`imports`, `analysis-jobs`, `puzzles`, etc.).
- External integrations isolated in `integrations/chess-com` and `integrations/stockfish`.
- Queue orchestration isolated in `queue/` + `apps/worker`.

**Data Boundaries:**
- Prisma access only in API/worker service layer.
- Shared DTO/contracts centralized in `packages/shared-contracts`.
- API payloads `snake_case`; web internal models `camelCase` via mapping layer.

### Requirements to Structure Mapping

**Feature/FR Mapping:**
- FR1-FR4 (account/age gate): `apps/api/src/modules/auth`, `apps/web/src/features/auth`
- FR5-FR7 (import): `modules/imports`, `features/imports`, `worker/jobs/import-games.job.ts`
- FR8-FR10 (analysis): `modules/analysis-jobs`, `integrations/stockfish`, `worker/jobs/analyze-game.job.ts`
- FR11-FR13 (replay/puzzle): `modules/puzzles`, `features/puzzles`, `components/Board`, `components/Puzzle`
- FR14-FR15 (explanations): `modules/explanations`, `features/explanations`, `components/ExplanationPanel`
- FR16-FR17 (progress): `modules/progress`, `features/progress`, `components/ProgressSummary`
- FR20-FR21 (progress+ETA): `modules/analysis-jobs`, `features/analysis-jobs`

**Cross-Cutting Concerns:**
- Security/authz: `apps/api/src/common/guards`
- Error format consistency: `apps/api/src/common/errors` + filters/interceptors
- Observability: `apps/api/src/common/interceptors`, `apps/worker/src/services`
- Accessibility/UI consistency: `apps/web/src/components` + `apps/web/src/styles`

### Integration Points

**Internal Communication:**
- Web -> API via REST + TanStack Query.
- API -> Redis/BullMQ for async jobs.
- Worker -> DB + queue events + status updates.

**External Integrations:**
- Supabase Auth (identity/JWT)
- Chess.com API (game import)
- Stockfish engine (analysis)

**Data Flow:**
1. Import request -> queue job
2. Worker imports games -> persist
3. Analysis job queued -> worker runs Stockfish
4. API exposes job status/progress
5. Web polls and renders puzzle/explanation loop

### File Organization Patterns

**Configuration Files:**
- Root-level shared config (`tsconfig.base`, workspace, CI).
- App-specific env validation in each app `config/env.ts`.

**Source Organization:**
- Feature-first on web.
- Domain-module-first on API.
- Job-first on worker.

**Test Organization:**
- Unit tests co-located where useful.
- Integration/e2e centralized per app (`apps/api/test/*`, `apps/web/src/test/*`).

**Asset Organization:**
- Global assets in `public/assets`.
- Feature assets near feature module when specific.

### Development Workflow Integration

**Development Server Structure:**
- Run web/api/worker concurrently via workspace scripts.
- Redis + Postgres via `infra/docker/docker-compose.dev.yml`.

**Build Process Structure:**
- Per-app build pipelines.
- Shared contracts built first, then consumers.

**Deployment Structure:**
- Separate services for web/api/worker.
- Shared DB/Redis resources with env-scoped secrets.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All core decisions are compatible:
- Vite SPA + Nest API + worker model aligns with async analysis requirements.
- PostgreSQL + Prisma + Redis/BullMQ are coherent for data + queue orchestration.
- Supabase Auth integrates cleanly with Nest guard-based verification.

**Pattern Consistency:**
Implementation patterns support decisions:
- Naming, response contracts, and state ownership rules match the selected stack.
- Error/loading patterns are consistent with UX expectations (clarity, progress, ETA).
- Data format boundaries (`snake_case` external, `camelCase` internal web) are clearly defined.

**Structure Alignment:**
Project structure supports architecture:
- Module boundaries in API map to FR categories.
- Frontend feature boundaries align with puzzle/explanation/progress flow.
- Worker boundaries isolate compute-heavy import/analysis/generation tasks.

### Requirements Coverage Validation ✅

**Feature Coverage:**
All MVP feature domains are structurally mapped: auth, imports, analysis jobs, puzzles, explanations, progress.

**Functional Requirements Coverage:**
All FR categories from PRD are covered by specific modules/components and integration points, including account lifecycle, Chess.com import, Stockfish analysis, replay/puzzle/explanation loop, and progress/ETA feedback.

**Non-Functional Requirements Coverage:**
- Performance: async queue + polling architecture supports target responsiveness.
- Security: auth boundary + JWT verification + secret isolation + audit/logging patterns.
- Accessibility: UI architecture preserves WCAG AA constraints from UX spec.
- Availability/scalability: service split (web/api/worker) supports MVP reliability targets.
- Compliance: retention/deletion handling is represented in data boundaries and privacy flows.

### Implementation Readiness Validation ✅

**Decision Completeness:**
Critical decisions are documented with concrete technologies and implementation sequence.

**Structure Completeness:**
Directory tree and module boundaries are specific enough for parallel AI-agent implementation.

**Pattern Completeness:**
Main conflict vectors (naming, API format, state ownership, error/loading handling) are covered with explicit rules and examples.

### Gap Analysis Results

**Critical Gaps:** None.

**Important Gaps:**
1. Browser support source-of-truth must stay locked to **Chrome + Safari desktop** for MVP.
2. “No mobile MVP” must remain explicit in implementation stories to avoid scope drift.

**Nice-to-Have Gaps:**
- Add contract-test templates for API response shape enforcement.
- Add ADR template for future architecture changes.

### Validation Issues Addressed

- Browser mismatch addressed by using UX baseline for implementation: **desktop-first, Chrome + Safari**.
- Mobile scope clarified as out-of-scope for MVP (best-effort responsiveness only).

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Clear async architecture for import/analyze/puzzle loop.
- Strong boundary definitions to prevent agent conflicts.
- Explicit mapping from requirements to modules/components.
- Practical MVP-first choices with future extension paths.

**Areas for Future Enhancement:**
- Realtime updates (SSE/WebSocket) if polling UX becomes limiting.
- Advanced RBAC for coach workflows.
- Multi-region and deeper cost/perf optimization once usage grows.

### Implementation Handoff

**AI Agent Guidelines:**
- Follow architectural decisions exactly as documented.
- Enforce consistency rules (naming, API shapes, state boundaries).
- Respect module boundaries and shared-contract flow.
- Treat this document as architecture source-of-truth.

**First Implementation Priority:**
Initialize monorepo baseline (web/api/worker/shared), then wire Supabase Auth + import/analysis job pipeline skeleton.
