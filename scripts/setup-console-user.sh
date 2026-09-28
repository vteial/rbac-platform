#!/usr/bin/env bash
#
# setup-console-user — create the console login, idempotently.
#
# Collapses DEMO.md step 1 (two manual UI steps) into one command:
#   1. PB SUPERUSER  → logs into the PocketBase admin UI (:8090/_/)
#      created via the image's `pocketbase superuser upsert` (idempotent).
#   2. CONSOLE USER  → the actual console login (:5173), a record in the PB
#      `users` collection, created via the PB API (skipped if it already exists).
#
# Credentials come from the environment (the justfile passes them from .env,
# with demo defaults). LOCAL DEMO ONLY — change before any exposure.
#
# Requires the stack to be up (`just start-local`).
set -uo pipefail

COMPOSE="${COMPOSE:-docker compose}"
PB_SERVICE="${PB_SERVICE:-pocketbase}"
PB_URL="${POCKETBASE_HOST_URL:-http://localhost:8090}"

SU_EMAIL="${PB_SUPERUSER_EMAIL:-admin@example.com}"
SU_PASS="${PB_SUPERUSER_PASSWORD:-changeme123}"
USER_EMAIL="${CONSOLE_USER_EMAIL:-demo@example.com}"
USER_PASS="${CONSOLE_USER_PASSWORD:-demo123456}"

ok()   { echo "  ✅ $1"; }
info() { echo "  ·  $1"; }
err()  { echo "  ❌ $1"; }

echo "setup-console-user — provisioning the console login"

# ── preflight: is PocketBase reachable? ──────────────────────────────────────
if ! curl -fsS "$PB_URL/api/health" >/dev/null 2>&1; then
  err "PocketBase not reachable at $PB_URL — start the stack first: just start-local"
  exit 1
fi

# ── 1. PB superuser (idempotent upsert via the image CLI) ────────────────────
echo
echo "▶ PocketBase superuser (admin UI :8090/_/)"
if $COMPOSE exec -T "$PB_SERVICE" pocketbase superuser upsert "$SU_EMAIL" "$SU_PASS" >/dev/null 2>&1; then
  ok "superuser ready: $SU_EMAIL"
else
  err "superuser upsert failed — is the '$PB_SERVICE' service up?"
  exit 1
fi

# ── 2. Console user (record in the users collection via the PB API) ──────────
echo
echo "▶ Console user (console login :5173)"

# Authenticate as the superuser to get an admin token.
token="$(curl -fsS -X POST "$PB_URL/api/collections/_superusers/auth-with-password" \
  -H 'content-type: application/json' \
  -d "{\"identity\":\"$SU_EMAIL\",\"password\":\"$SU_PASS\"}" \
  | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')"
if [ -z "$token" ]; then err "could not authenticate as superuser"; exit 1; fi

# Does the console user already exist? (idempotent)
existing="$(curl -fsS "$PB_URL/api/collections/users/records?filter=$(printf 'email="%s"' "$USER_EMAIL")" \
  -H "Authorization: $token" | sed -n 's/.*"totalItems":\([0-9]*\).*/\1/p')"

if [ "${existing:-0}" != "0" ]; then
  ok "console user already exists: $USER_EMAIL"
else
  code="$(curl -s -o /dev/null -w '%{http_code}' -X POST "$PB_URL/api/collections/users/records" \
    -H "Authorization: $token" -H 'content-type: application/json' \
    -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASS\",\"passwordConfirm\":\"$USER_PASS\",\"verified\":true}")"
  if [ "$code" = "200" ] || [ "$code" = "201" ]; then
    ok "created console user: $USER_EMAIL"
  else
    err "failed to create console user (HTTP $code)"
    exit 1
  fi
fi

# ── verify the console-style login actually works ────────────────────────────
if curl -fsS -X POST "$PB_URL/api/collections/users/auth-with-password" \
  -H 'content-type: application/json' \
  -d "{\"identity\":\"$USER_EMAIL\",\"password\":\"$USER_PASS\"}" >/dev/null 2>&1; then
  ok "verified: console login works"
else
  err "console login verification failed"
  exit 1
fi

echo
echo "✔ Console user ready. Log in at http://localhost:5173"
echo "    PB admin  (:8090/_/):  $SU_EMAIL / $SU_PASS"
echo "    Console   (:5173):     $USER_EMAIL / $USER_PASS"
