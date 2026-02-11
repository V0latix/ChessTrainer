---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - /Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/prd.md
  - /Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/architecture.md
  - /Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/ux-design-specification.md
  - /Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/architecture-validation-report-2026-02-11-v2.md
lastStep: 4
status: 'complete'
completedAt: '2026-02-11'
---

# ChessTrainer - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for ChessTrainer, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can create an account with email/password.  
FR2: Users can log in and log out securely.  
FR3: Users can delete their account and all associated data.  
FR4: Users must confirm age >= 16 during account creation.  
FR5: Users can connect to Chess.com and import recent games.  
FR6: Users can select which games to import from their history.  
FR7: Users can re-import new games without duplicating existing ones.  
FR8: The system can analyze imported games using Stockfish.  
FR9: The system can identify critical mistakes based on evaluation drop >= 2.0.  
FR10: The system can summarize a user's top mistakes from recent games.  
FR11: Users can open a mistake position and replay the best move.  
FR12: Users can retry the same mistake position if they fail.  
FR13: Users can progress through a sequence of mistake-based puzzles.  
FR14: The system can explain why the user's move was wrong.  
FR15: The system can explain why the best move is correct.  
FR16: Users can view their recent progress summary (mistakes, puzzles completed).  
FR17: Users can see trends in recurring mistake types.  
FR18: Coaches can import and review games for a student account.  
FR19: Coaches can view the student's key mistakes and explanations.  
FR20: Users can see analysis progress with a visible progress bar and ETA.  
FR21: Users receive a completion state when analysis is finished.  
FR22: Users can access a summary of stored data (games, analyses).  
FR23: Users can request deletion of stored games and analysis data.

### NonFunctional Requirements

NFR1: Performance: Initial page load time < 2 seconds.  
NFR2: Performance: Puzzle page load time < 1 second.  
NFR3: Performance: UI interaction response time < 200ms.  
NFR4: Security: Data encrypted in transit (HTTPS) and at rest.  
NFR5: Security: Access to sensitive data is logged for auditing.  
NFR6: Scalability: System supports at least 100 active users without performance degradation.  
NFR7: Scalability: No long-term scalability target defined yet.  
NFR8: Accessibility: WCAG 2.1 AA compliance target.  
NFR9: Integration: Chess.com integration uses retry + exponential backoff on rate limits.

### Additional Requirements

- Starter baseline: monorepo with `apps/web` (Vite SPA), `apps/api` (NestJS), `apps/worker`, and shared contracts package.
- Project initialization should use local CLI invocation (`npx @nestjs/cli@latest ...`) to keep setup reproducible in CI/dev.
- Data stack: PostgreSQL + Prisma migrations; Redis + BullMQ for async orchestration.
- Authentication: Supabase Auth with JWT verification in API (JWKS).
- Identity sync contract: on first authenticated request, API performs idempotent upsert of local `users` row keyed by Supabase `sub`.
- Stockfish runtime policy: native binary in worker image, 60s timeout per game, max 2 retries with exponential backoff, worker resource/concurrency caps.
- API contract: REST JSON with standardized success/error envelopes and `traceId` metadata.
- Public API payload casing must be `snake_case`; enforce with OpenAPI + contract tests + CI fail on mismatch.
- Browser target locked for MVP: Chrome + Safari desktop (last 2 versions).
- Platform scope: desktop-first single-column flow; no dedicated mobile MVP (best-effort responsiveness only).
- Accessibility baseline: WCAG 2.1 AA, keyboard support, visible focus states, and 44x44 target sizes.
- Core MVP custom UI components required: Board, Puzzle, Explanation Panel, Progress Summary.
- Long-running analysis UX must expose progress + ETA with polling-based job status endpoints.
- Observability requirement: structured logs + Sentry for API/worker/frontend.

### FR Coverage Map

FR1: Epic 1 - Account registration with email/password  
FR2: Epic 1 - Login/logout secure session lifecycle  
FR3: Epic 1 - Account + associated data deletion  
FR4: Epic 1 - Age-gate (16+) enforcement  
FR5: Epic 2 - Connect and import games from Chess.com  
FR6: Epic 2 - Select games to import  
FR7: Epic 2 - Re-import without duplicates  
FR8: Epic 3 - Analyze imported games with Stockfish  
FR9: Epic 3 - Detect critical mistakes (eval drop >= 2.0)  
FR10: Epic 3 - Summarize top mistakes from recent games  
FR11: Epic 4 - Open mistake positions as puzzles  
FR12: Epic 4 - Retry failed puzzle positions  
FR13: Epic 4 - Progress through puzzle sequence  
FR14: Epic 4 - Explain why the played move was wrong  
FR15: Epic 4 - Explain why the best move is correct  
FR16: Epic 5 - View recent progress summary  
FR17: Epic 5 - View recurring mistake trends  
FR18: Epic 6 - Coach imports/reviews student games  
FR19: Epic 6 - Coach views student key mistakes/explanations  
FR20: Epic 3 - Show analysis progress + ETA  
FR21: Epic 3 - Show analysis completion state  
FR22: Epic 5 - Access stored-data summary  
FR23: Epic 5 - Request deletion of stored games/analyses

## Epic List

### Epic 1: Account, Identity & Privacy Controls
Users can create an account, authenticate securely, pass age-gate checks, and delete account data safely.
**FRs covered:** FR1, FR2, FR3, FR4

### Epic 2: Chess.com Import & Game Intake
Users can connect Chess.com, import selected recent games, and re-import incrementally without duplicates.
**FRs covered:** FR5, FR6, FR7

### Epic 3: Analysis Pipeline & Mistake Detection
Imported games are analyzed asynchronously with visible progress/ETA and critical mistake extraction.
**FRs covered:** FR8, FR9, FR10, FR20, FR21

### Epic 4: Mistake Replay Puzzles & Explanations
Users replay mistakes as puzzles and receive clear move-by-move explanations.
**FRs covered:** FR11, FR12, FR13, FR14, FR15

### Epic 5: Progress Insights & Data Transparency
Users can track progress/trends and view/manage stored data lifecycle.
**FRs covered:** FR16, FR17, FR22, FR23

### Epic 6: Coach Review Workspace
Coaches can review student games, mistakes, and explanations efficiently.
**FRs covered:** FR18, FR19

## Epic 1: Account, Identity & Privacy Controls

Deliver secure account lifecycle and data control with Supabase identity + local user synchronization.

### Story 1.1: Set Up Project from Approved Starter Template
As a developer,
I want the monorepo initialized from the approved starters,
So that implementation starts on a consistent architecture baseline.

**FRs:** Architecture prerequisite for FR1-FR23

**Acceptance Criteria:**

**Given** the project is not initialized  
**When** I run the approved starter commands for web and API  
**Then** the monorepo structure (`apps/web`, `apps/api`, `apps/worker`, shared contracts) exists  
**And** baseline scripts run locally in CI-compatible mode.

**Given** the web app shell is built for desktop targets  
**When** I run the baseline performance check  
**Then** initial page load target is < 2 seconds  
**And** the check is executable in CI.

### Story 1.2: Register Account with Age Gate
As a chess player,
I want to create an account and confirm I am at least 16,
So that I can access the product compliantly.

**FRs:** FR1, FR4

**Acceptance Criteria:**

**Given** I submit valid email/password and age confirmation  
**When** registration succeeds  
**Then** my account is created  
**And** I can access authenticated onboarding.

**Given** I do not confirm age >= 16  
**When** I submit registration  
**Then** the account is not created  
**And** I receive a clear blocking message.

### Story 1.3: Login and Logout Securely
As a registered user,
I want to log in and out securely,
So that only I can access my training data.

**FRs:** FR2

**Acceptance Criteria:**

**Given** valid credentials  
**When** I log in  
**Then** I receive a valid authenticated session  
**And** protected routes become accessible.

**Given** I am authenticated  
**When** I log out  
**Then** the session is invalidated  
**And** protected routes require re-authentication.

### Story 1.4: Sync Supabase Identity to Local User Record
As the platform,
I want to upsert a local user profile from Supabase identity,
So that all domain data references stable internal user IDs.

**FRs:** FR1, FR2

**Acceptance Criteria:**

**Given** the first authenticated API request for a Supabase `sub`  
**When** the API validates JWT via JWKS  
**Then** a local `users` row is created or updated idempotently  
**And** domain modules use local `users.id` references.

### Story 1.5: Delete Account with Full Data Cascade
As a user,
I want to delete my account and associated data,
So that I retain control over my personal data.

**FRs:** FR3

**Acceptance Criteria:**

**Given** I request account deletion and confirm the action  
**When** deletion executes  
**Then** account and associated domain data are removed  
**And** I am logged out immediately.

### Story 1.6: Enforce Security Baseline and Audit Logging
As a platform owner,
I want security controls and audit logging enabled by default,
So that compliance and incident traceability are guaranteed.

**FRs:** NFR4, NFR5

**Acceptance Criteria:**

**Given** API and web services are deployed  
**When** security checks run  
**Then** all external traffic is HTTPS-only  
**And** secrets are never exposed to client bundles.

**Given** a sensitive action occurs (login, deletion, data export/deletion)  
**When** the action is processed  
**Then** an audit log entry is created with actor, action, timestamp, and trace identifier  
**And** audit entries are queryable for support/compliance.

## Epic 2: Chess.com Import & Game Intake

Deliver reliable game ingestion from Chess.com with user-controlled selection and deduplication.

### Story 2.1: Connect Chess.com and List Candidate Games
As a user,
I want to fetch my recent Chess.com games,
So that I can choose what to import.

**FRs:** FR5, FR6

**Acceptance Criteria:**

**Given** I provide a valid Chess.com username/context  
**When** I trigger fetch  
**Then** recent games are listed with selectable entries  
**And** unavailable periods are handled gracefully.

### Story 2.2: Import Selected Games
As a user,
I want to import selected games only,
So that my training corpus is relevant.

**FRs:** FR6

**Acceptance Criteria:**

**Given** one or more games are selected  
**When** I confirm import  
**Then** only selected games are persisted  
**And** import summary shows success/failure counts.

### Story 2.3: Re-import Incrementally Without Duplicates
As a returning user,
I want to re-import new games without duplicate records,
So that my dataset stays clean.

**FRs:** FR7

**Acceptance Criteria:**

**Given** games were already imported previously  
**When** I run re-import  
**Then** only new games are inserted  
**And** existing games are skipped by deterministic dedup logic.

### Story 2.4: Apply Retry and Backoff on Chess.com Limits
As the platform,
I want resilient import requests,
So that temporary Chess.com limits do not break user flow.

**FRs:** FR5, NFR9

**Acceptance Criteria:**

**Given** Chess.com returns a rate-limit/transient failure  
**When** import retries execute  
**Then** exponential backoff is applied up to configured limits  
**And** final status is surfaced clearly to the user.

## Epic 3: Analysis Pipeline & Mistake Detection

Deliver asynchronous Stockfish analysis with transparent progress and actionable error extraction.

### Story 3.1: Enqueue Analysis Jobs from Imported Games
As a user,
I want analysis to run asynchronously,
So that I can continue using the app while processing runs.

**FRs:** FR8, FR20

**Acceptance Criteria:**

**Given** imported games exist  
**When** I start analysis  
**Then** jobs are enqueued with initial status  
**And** each job has a unique tracking identifier.

### Story 3.2: Run Stockfish Analysis in Worker
As the platform,
I want worker-based Stockfish processing,
So that game analysis is reliable and scalable.

**FRs:** FR8, FR9

**Acceptance Criteria:**

**Given** a queued analysis job  
**When** worker executes Stockfish  
**Then** move evaluations are generated within timeout policy  
**And** transient failures retry according to configured policy.

### Story 3.3: Detect and Persist Critical Mistakes
As a user,
I want critical mistakes identified from my games,
So that training uses high-impact positions.

**FRs:** FR9, FR10

**Acceptance Criteria:**

**Given** move evaluations are available  
**When** mistake extraction runs  
**Then** mistakes with eval drop >= 2.0 are persisted  
**And** aggregated mistake summaries are generated for recent games.

### Story 3.4: Expose Polling Status with Progress and ETA
As a user,
I want visible analysis progress and ETA,
So that I know when training will be ready.

**FRs:** FR20, FR21

**Acceptance Criteria:**

**Given** analysis is running  
**When** I poll job status endpoint  
**Then** I receive status, progress percentage, and ETA  
**And** completion state is explicit when done.

**Given** I interact with the UI while polling is active  
**When** status updates arrive  
**Then** controls remain responsive  
**And** interaction response target remains < 200ms.

### Story 3.5: Enforce API Contract and Platform Observability
As a platform owner,
I want API contracts and telemetry enforced in CI,
So that regressions are detected before release.

**FRs:** NFR5, Additional Requirements (API contract + observability)

**Acceptance Criteria:**

**Given** public API responses are generated  
**When** contract tests run in CI  
**Then** response payload fields are validated as `snake_case`  
**And** CI fails on contract mismatch.

**Given** web, API, and worker services run in non-local environments  
**When** errors or key events occur  
**Then** structured logs are emitted with `traceId`  
**And** Sentry captures exceptions with environment and release metadata.

## Epic 4: Mistake Replay Puzzles & Explanations

Deliver the core training loop: replay own mistakes, get immediate feedback, and understand best moves.

### Story 4.1: Open Mistake Position as Playable Puzzle
As a user,
I want to open mistake positions directly on the board,
So that I can train from my real games.

**FRs:** FR11

**Acceptance Criteria:**

**Given** analyzed mistakes exist  
**When** I open a puzzle  
**Then** the board is initialized at the exact position  
**And** puzzle objective/context is displayed.

**Given** I open the puzzle route on target desktop browsers  
**When** route data is ready  
**Then** puzzle page load target is < 1 second  
**And** board is interactive immediately after render.

### Story 4.2: Evaluate Attempt and Enable Retry
As a user,
I want to retry failed attempts,
So that I can learn through repetition.

**FRs:** FR12

**Acceptance Criteria:**

**Given** I play a non-best move in a puzzle  
**When** attempt is evaluated  
**Then** failure feedback is shown  
**And** I can retry the same puzzle position.

### Story 4.3: Sequence Puzzles in Session Flow
As a user,
I want to move through puzzle sequences,
So that I can complete focused training sessions.

**FRs:** FR13

**Acceptance Criteria:**

**Given** I solve or skip current puzzle  
**When** I continue  
**Then** next puzzle in sequence is loaded  
**And** session progress updates at the top.

### Story 4.4: Explain Wrong Move and Best Move
As a user,
I want clear explanations for wrong and best moves,
So that I understand the chess idea behind each correction.

**FRs:** FR14, FR15

**Acceptance Criteria:**

**Given** an attempt has been evaluated  
**When** explanation panel renders  
**Then** it states why my move was wrong  
**And** it explains why the best move is stronger in that position.

### Story 4.5: Accessibility Hardening for Puzzle and Explanation Flow
As a keyboard or assistive-technology user,
I want the puzzle flow fully accessible,
So that I can train without interaction barriers.

**FRs:** NFR8

**Acceptance Criteria:**

**Given** I navigate puzzle and explanation screens with keyboard only  
**When** I tab through interactive elements  
**Then** focus order is logical and visible  
**And** all core actions are reachable without pointer input.

**Given** text and controls are rendered in dark theme  
**When** accessibility checks run  
**Then** contrast meets WCAG 2.1 AA thresholds  
**And** actionable targets respect 44x44 minimum size guidance.

## Epic 5: Progress Insights & Data Transparency

Deliver visibility into learning progress and transparency/control over stored data.

### Story 5.1: Show Session Progress Summary
As a user,
I want a compact summary of my recent training,
So that I can see if I am improving.

**FRs:** FR16

**Acceptance Criteria:**

**Given** I completed training sessions  
**When** I open progress summary  
**Then** I see key metrics (puzzles completed, success indicators, recent mistakes)  
**And** summary first render target is < 2 seconds on desktop baseline.

### Story 5.2: Show Recurring Mistake Trends
As a user,
I want recurring mistake motifs highlighted,
So that I can target weak areas.

**FRs:** FR17

**Acceptance Criteria:**

**Given** enough analyzed data exists  
**When** I open trends view  
**Then** recurring mistake categories are ranked  
**And** trend direction is clear.

### Story 5.3: Expose Stored Data Inventory
As a user,
I want to see what data is stored for my account,
So that data handling is transparent.

**FRs:** FR22

**Acceptance Criteria:**

**Given** I open data inventory  
**When** the page loads  
**Then** stored games and analyses counts are displayed  
**And** timestamps/context for most recent updates are shown.

### Story 5.4: Delete Stored Games and Analyses
As a user,
I want to delete stored game/analysis data,
So that I can control retention beyond account-level deletion.

**FRs:** FR23

**Acceptance Criteria:**

**Given** I choose dataset deletion and confirm  
**When** deletion executes  
**Then** selected datasets are removed  
**And** inventory/progress views refresh accordingly.

## Epic 6: Coach Review Workspace

Deliver a coach-focused flow to review student mistakes and explanations efficiently.

### Story 6.1: Coach Access to Student Review Context
As a coach,
I want to open an authorized student context,
So that I can review the correct student's games.

**FRs:** FR18

**Acceptance Criteria:**

**Given** I am authenticated with coach role  
**When** I select a student context  
**Then** authorized student data becomes available  
**And** unauthorized access is blocked.

### Story 6.2: Coach Import and Mistake Review
As a coach,
I want to import and review a student's mistakes,
So that I can provide targeted guidance quickly.

**FRs:** FR18, FR19

**Acceptance Criteria:**

**Given** a student context is active  
**When** I import/review student games  
**Then** key mistakes are listed with explanations  
**And** I can open each mistake with board context and rationale.
