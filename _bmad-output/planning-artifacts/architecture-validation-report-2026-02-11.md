# Architecture Validation Report - ChessTrainer

**Date:** 2026-02-11
**Source Document:** `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/architecture.md`
**Validation Scope:** coherence, requirement coverage, implementation readiness, risk review

## Executive Verdict

**Status:** Conditionally ready for implementation.

The architecture is strong for an MVP and is well structured for AI-agent consistency. A few critical clarifications are still needed to avoid integration drift during implementation.

## Findings (Ordered by Severity)

### [P1] Missing identity synchronization contract (Supabase Auth -> app user model)

**Issue:** The document chooses Supabase Auth and also a separate app DB model, but does not define the exact synchronization strategy for `users` records.

**Risk:** Inconsistent or missing `users` rows can break foreign keys and authorization logic across modules (`imports`, `analysis-jobs`, `progress`).

**Required fix:** Add one explicit contract:
- Upsert app user on first authenticated API call (by `sub`), or
- Supabase webhook/event-driven sync, or
- Dedicated onboarding endpoint that guarantees user row creation before feature access.

### [P1] Stockfish execution model is not specified

**Issue:** The architecture depends on Stockfish but does not define runtime mode (native binary, sidecar service, containerized worker, wasm fallback).

**Risk:** Performance target (`<= 1 min/game`) and deploy portability can fail late in implementation.

**Required fix:** Add a concrete decision for MVP:
- Worker image contains native Stockfish binary, job-level CPU/memory limits, timeout policy, and retry behavior.

### [P2] Browser support source still conflicts across project docs

**Issue:** Architecture uses `Chrome + Safari desktop`, while PRD still contains `Chrome only`.

**Risk:** QA scope mismatch and acceptance-criteria ambiguity.

**Required fix:** Update PRD browser matrix to match architecture/UX source of truth.

### [P2] Starter command is non-reproducible for team/CI environments

**Issue:** Architecture includes global Nest CLI install (`npm i -g @nestjs/cli`).

**Risk:** Environment drift across machines and CI.

**Required fix:** Use local invocation (`npx @nestjs/cli new ...`) or workspace script.

### [P2] API casing rule needs explicit OpenAPI/DTO enforcement

**Issue:** Architecture mandates snake_case API payloads, but Nest DTO/OpenAPI defaults are often camelCase.

**Risk:** Contract drift between documented format and generated schema/implementation.

**Required fix:** Add one enforcement strategy:
- DTO + serialization layer with explicit snake_case transform,
- OpenAPI contract tests validating case format,
- shared-contract schemas as source of truth.

## Coverage Check

## Functional Requirements

- Auth/account lifecycle: covered
- Chess.com import/reimport/dedup: covered
- Analysis + mistake detection: covered
- Error-to-puzzle replay + explanations: covered
- Progress + ETA/status: covered
- Data deletion/privacy flow: covered

## Non-Functional Requirements

- Performance: partially covered (needs Stockfish runtime decision)
- Security: covered at high level (auth guards, JWT verification, secrets policy)
- Availability/scalability: covered for MVP
- Accessibility: covered via UX-aligned constraints
- Compliance/GDPR: covered at policy level

## Strengths

- Clear modular boundaries (`web/api/worker/shared-contracts`).
- Good anti-conflict implementation patterns (naming, responses, state ownership).
- Strong async workflow design for import/analyze/review loop.
- Good mapping between requirements and physical structure.

## Final Recommendation

Proceed to implementation **after applying the 5 fixes above**, prioritizing the two P1 items first.

## Suggested Immediate Actions

1. Add an ADR: `Identity Sync Contract (Supabase -> app user)`.
2. Add an ADR: `Stockfish Runtime & Resource Policy`.
3. Patch PRD browser matrix to `Chrome + Safari desktop`.
4. Replace global Nest CLI command with `npx` in architecture doc.
5. Add API contract enforcement note for snake_case payloads.
