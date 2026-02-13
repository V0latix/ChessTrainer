#!/usr/bin/env bash
set -euo pipefail

# Optional: keep DB schema in sync automatically on each deploy.
# This is convenient for MVP/staging, but can be risky in production.
if [[ "${PRISMA_DB_PUSH_ON_START:-}" == "true" ]]; then
  echo "[render-start] Running Prisma db push..."
  npm run prisma:db:push -w @chesstrainer/api
fi

echo "[render-start] Starting API + worker..."

node apps/api/dist/main.js &
api_pid="$!"

node apps/worker/dist/main.js &
worker_pid="$!"

on_term() {
  echo "[render-start] Caught termination signal; shutting down..."
  kill -TERM "$api_pid" "$worker_pid" 2>/dev/null || true
  wait "$api_pid" "$worker_pid" 2>/dev/null || true
}

trap on_term INT TERM

# Exit if either process exits (Render expects a single long-running web process).
wait -n "$api_pid" "$worker_pid"
exit_code="$?"
echo "[render-start] One process exited; stopping (exit_code=$exit_code)."
kill -TERM "$api_pid" "$worker_pid" 2>/dev/null || true
wait "$api_pid" "$worker_pid" 2>/dev/null || true
exit "$exit_code"

