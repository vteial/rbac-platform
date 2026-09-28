#!/usr/bin/env bash
#
# validate-local — probe the RUNNING SERVICES.
#
# Answers "are the services up and answering?" AFTER start-local. This is the
# counterpart to env-doctor (which audits the machine before anything runs).
#
# Probes host-facing endpoints (localhost), so it works whether the console runs
# in a container or on the host.
#
# Exit: 0 if all required probes pass, 1 otherwise.
set -uo pipefail

OPENFGA_URL="${OPENFGA_HOST_URL:-http://localhost:8080}"
POCKETBASE_URL="${POCKETBASE_HOST_URL:-http://localhost:8090}"
CONSOLE_URL="${CONSOLE_HOST_URL:-http://localhost:5173}"
COMPOSE="${COMPOSE:-docker compose}"

fail=0
ok()  { echo "  ✅ $1"; }
bad() { echo "  ❌ $1"; fail=$((fail+1)); }

echo "validate-local — probing running services"
echo

# OpenFGA — expect {"status":"SERVING"}
if body="$(curl -fsS "$OPENFGA_URL/healthz" 2>/dev/null)" && echo "$body" | grep -q SERVING; then
  ok "OpenFGA $OPENFGA_URL/healthz → SERVING"
else
  bad "OpenFGA $OPENFGA_URL/healthz not SERVING (got: ${body:-no response})"
fi

# OpenFGA stores reachable (proves the API + datastore work)
if stores="$(curl -fsS "$OPENFGA_URL/stores" 2>/dev/null)"; then
  count="$(echo "$stores" | grep -o '"id"' | wc -l | tr -d ' ')"
  ok "OpenFGA stores reachable ($count store(s))"
else
  bad "OpenFGA /stores not reachable"
fi

# PocketBase — expect healthy
if curl -fsS "$POCKETBASE_URL/api/health" 2>/dev/null | grep -q healthy; then
  ok "PocketBase $POCKETBASE_URL/api/health → healthy"
else
  bad "PocketBase $POCKETBASE_URL/api/health not healthy"
fi

# Postgres — via compose exec pg_isready (internal; not host-exposed)
if $COMPOSE exec -T postgres pg_isready >/dev/null 2>&1; then
  ok "PostgreSQL pg_isready → accepting connections"
else
  bad "PostgreSQL not ready (or compose not up)"
fi

# Console — optional (only if the dev/prod server is running)
if curl -fsS "$CONSOLE_URL/health" 2>/dev/null | grep -q ok; then
  ok "Console $CONSOLE_URL/health → ok"
else
  echo "  ·  console not running (optional) — start with 'cd console && pnpm dev'"
fi

echo
[ "$fail" -eq 0 ] && { echo "✔ all required services are up"; exit 0; } || { echo "✖ $fail service(s) not healthy"; exit 1; }
