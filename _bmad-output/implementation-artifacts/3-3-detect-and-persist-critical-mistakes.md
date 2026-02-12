# Story 3.3: Detect and Persist Critical Mistakes

Status: done

## Story

As a user,
I want critical mistakes identified from my games,
so that training uses high-impact positions.

## Acceptance Criteria

1. Given move evaluations are available, when mistake extraction runs, then mistakes with eval drop >= 2.0 are persisted and aggregated mistake summaries are generated for recent games.

## Tasks / Subtasks

- [x] Extend persistence for mistakes and summaries (AC: 1)
  - [x] Add `critical_mistakes` table.
  - [x] Add `user_mistake_summaries` table.
- [x] Implement eval-drop mistake extraction in worker (AC: 1)
  - [x] Compute eval drop from per-ply evaluations and next-ply played outcome.
  - [x] Persist mistakes with `eval_drop_cp >= 200`.
  - [x] Add phase/severity/category fields for downstream ranking.
- [x] Generate recent aggregate summaries (AC: 1)
  - [x] Rebuild per-user summary rows from recent completed analysis jobs.
  - [x] Persist count + average eval drop by category.
- [x] Validate and document (AC: 1)
  - [x] Update worker tests.
  - [x] Update README.
  - [x] Run `npm run ci`.

## Dev Notes

- Eval drop logic:
  - `best_score` from current ply Stockfish score.
  - `played_score` inferred as negative of next ply score (opponent-to-move perspective inversion).
  - `drop_cp = best_score - played_score`; critical if `drop_cp >= 200`.
- Summaries are rebuilt from recent completed jobs (last 25) to keep output deterministic.

### References

- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.3)
- `/Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/prd.md` (FR9, FR10)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run prisma:generate -w @chesstrainer/api`
- `npm run test -w @chesstrainer/worker`
- `npm run ci`

### Completion Notes List

- Added mistake persistence models (`critical_mistakes`, `user_mistake_summaries`) in Prisma schema.
- Extended worker analysis pipeline to detect critical mistakes from per-ply evaluation drop.
- Added category metadata (`phase`, `severity`, `category`) for each persisted critical mistake.
- Added summary refresh for recent completed jobs with grouped count and average drop.
- Updated worker tests to validate persistence + summary generation behavior.
- Full CI passes.

### File List

- `/Users/romain/dev/ChessTrainer/_bmad-output/implementation-artifacts/3-3-detect-and-persist-critical-mistakes.md`
- `/Users/romain/dev/ChessTrainer/apps/api/prisma/schema.prisma`
- `/Users/romain/dev/ChessTrainer/apps/worker/src/services/analysis-worker.service.ts`
- `/Users/romain/dev/ChessTrainer/apps/worker/src/services/analysis-worker.service.test.ts`
- `/Users/romain/dev/ChessTrainer/README.md`
