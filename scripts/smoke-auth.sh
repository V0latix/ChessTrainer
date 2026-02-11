#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi

API_BASE_URL="${API_BASE_URL:-${VITE_API_BASE_URL:-http://127.0.0.1:3000}}"
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_ANON_KEY" || -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
  echo "Missing env vars. Need: SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

EMAIL="${1:-smoke.$(date +%s)@example.com}"
PASSWORD="${2:-ChessTrainer!123}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "1) API health check..."
HEALTH_CODE="$(curl -s -o "$TMP_DIR/health.json" -w "%{http_code}" "${API_BASE_URL}/health" || true)"
if [[ "$HEALTH_CODE" != "200" ]]; then
  echo "Health check failed (HTTP ${HEALTH_CODE}). Start API first."
  exit 1
fi
echo "   OK (${API_BASE_URL}/health)"

echo "2) Create Supabase test user (admin, email_confirm=true)..."
CREATE_CODE="$(curl -s -o "$TMP_DIR/create.json" -w "%{http_code}" \
  -X POST "${SUPABASE_URL%/}/auth/v1/admin/users" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\",\"email_confirm\":true}" || true)"
if [[ "$CREATE_CODE" != "200" ]]; then
  echo "User creation failed (HTTP ${CREATE_CODE})"
  cat "$TMP_DIR/create.json"
  exit 1
fi

USER_ID="$(python3 - "$TMP_DIR/create.json" <<'PY'
import json,sys
obj=json.load(open(sys.argv[1]))
print(obj.get("id",""))
PY
)"
if [[ -z "$USER_ID" ]]; then
  echo "Could not extract test user ID."
  cat "$TMP_DIR/create.json"
  exit 1
fi
echo "   OK (user_id=${USER_ID:0:8}...)"

cleanup() {
  curl -s -o /dev/null -w "" \
    -X DELETE "${SUPABASE_URL%/}/auth/v1/admin/users/${USER_ID}" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" || true
}
trap 'cleanup; rm -rf "$TMP_DIR"' EXIT

echo "3) Login via anon key..."
LOGIN_CODE="$(curl -s -o "$TMP_DIR/login.json" -w "%{http_code}" \
  -X POST "${SUPABASE_URL%/}/auth/v1/token?grant_type=password" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}" || true)"
if [[ "$LOGIN_CODE" != "200" ]]; then
  echo "Login failed (HTTP ${LOGIN_CODE})"
  cat "$TMP_DIR/login.json"
  exit 1
fi

ACCESS_TOKEN="$(python3 - "$TMP_DIR/login.json" <<'PY'
import json,sys
obj=json.load(open(sys.argv[1]))
print(obj.get("access_token",""))
PY
)"
if [[ -z "$ACCESS_TOKEN" ]]; then
  echo "No access token in login response."
  cat "$TMP_DIR/login.json"
  exit 1
fi
echo "   OK (token received)"

echo "4) Call API /auth/me with bearer token..."
ME_CODE="$(curl -s -o "$TMP_DIR/me.json" -w "%{http_code}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  "${API_BASE_URL}/auth/me" || true)"
if [[ "$ME_CODE" != "200" ]]; then
  echo "/auth/me failed (HTTP ${ME_CODE})"
  cat "$TMP_DIR/me.json"
  exit 1
fi
echo "   OK"
python3 - "$TMP_DIR/me.json" <<'PY'
import json,sys
obj=json.load(open(sys.argv[1]))
data=obj.get("data",{})
print("   local_user_id:", str(data.get("local_user_id",""))[:8] + "...")
print("   role:", data.get("role"))
print("   email:", data.get("email"))
PY

echo
echo "Smoke auth check: SUCCESS"
