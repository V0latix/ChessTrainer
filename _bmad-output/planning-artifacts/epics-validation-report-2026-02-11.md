# Epics & Stories Validation Report - ChessTrainer

**Date:** 2026-02-11  
**Validated document:** `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md`

## Summary

- FR coverage: **23/23 covered**
- Epic structure: **value-oriented and coherent**
- Story sequencing: **no forward dependencies detected**
- Overall status: **Good baseline, with cross-cutting gaps to close before sprint planning**

## Findings (by severity)

### [P1] Security and compliance NFRs are not mapped to implementable stories

- NFR4 (encryption in transit/at rest) and NFR5 (sensitive-data audit logging) are listed in inventory but not explicitly bound to any story acceptance criteria.
- Without dedicated stories/ACs, these are likely deferred accidentally during implementation.

**Evidence:**
- NFR inventory exists in `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md:49` to `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md:57`
- No story AC explicitly mentions encryption or audit log requirements.

### [P2] Accessibility NFR lacks explicit story-level acceptance criteria

- NFR8 (WCAG 2.1 AA) appears in requirements inventory, but no story explicitly enforces keyboard/focus/contrast/target-size outcomes.

**Evidence:**
- Requirement is present: `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md:56`
- No dedicated accessibility ACs in Epic 4/5 UI stories.

### [P2] API contract and observability requirements are not represented as delivery stories

- Architecture requires snake_case API contract enforcement and observability (Sentry + structured logs), but these are only listed as “Additional Requirements”.
- No story ensures contract tests / CI gate / telemetry rollout.

**Evidence:**
- Additional requirements entries in `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md:67` to `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md:74`
- No explicit story for API contract enforcement or observability setup.

## Strengths

- Epic decomposition is user-value first (not technical layers).
- Strong FR traceability from coverage map and per-story FR tags.
- Good async flow decomposition for import -> analysis -> puzzle loop.
- Architecture prerequisite story (starter setup) is present as requested.

## Recommended fixes

1. Add one cross-cutting security/compliance story in Epic 1 (or a dedicated hardening epic) covering:
   - HTTPS enforcement
   - at-rest encryption policy
   - audit logging for sensitive actions
2. Add one accessibility hardening story in Epic 4/5 with explicit WCAG AA ACs.
3. Add one platform quality story (Epic 3 or 5) for:
   - snake_case API contract tests + CI fail gate
   - Sentry + structured logs on web/api/worker
4. Add explicit performance ACs to key stories (initial load, puzzle load, interaction latency).

## Verdict

**Validated with conditions**: ready to proceed if the 3 cross-cutting gaps above are addressed in stories before sprint planning.
