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
cp .env.example .env
npm run dev
```

## Auth Setup (Story 1.2)

- Configure Supabase keys in `.env`:
  - `SUPABASE_URL`
  - `SUPABASE_JWT_AUDIENCE`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Configure API persistence + CORS:
  - `DATABASE_URL`
  - `WEB_APP_ORIGIN`
- Open web app on `/register` to create account with age-gate checkbox (16+).
- Login is available on `/login`.
- Successful login/signup with active session redirects to `/onboarding`.
- Logout button in onboarding invalidates the session and redirects to `/login`.
- On first authenticated session, web calls `GET /auth/me` to upsert local `users` identity by Supabase `sub`.

## Useful Commands

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run perf:web`
- `npm run ci`

## Local Services

This story initializes app skeletons only. Redis/Postgres and feature modules arrive in next stories.
