# ChessTrainer

Monorepo MVP for ChessTrainer (SPA web + API + worker + shared contracts).

## Requirements

- Node.js 20+
- npm 10+

## Project Layout

- `apps/web`: React + Vite SPA (desktop-first)
- `apps/api`: NestJS REST API
- `apps/worker`: async worker runtime skeleton
- `packages/shared-contracts`: shared contract/schema package

## Quick Start

```bash
npm install
npm run dev
```

## Useful Commands

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run perf:web`
- `npm run ci`

## Local Services

This story initializes app skeletons only. Redis/Postgres and feature modules arrive in next stories.
