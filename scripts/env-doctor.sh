#!/usr/bin/env bash
#
# env-doctor — audit the LOCAL MACHINE for POC readiness.
#
# Answers "is my machine set up right?" BEFORE anything runs:
#   tools present + configured, container engine routed, ports free, .env present.
# It REPORTS and suggests fixes — it does not install anything.
#
# Exit: 0 if no ❌ failures, 1 otherwise (⚠️ warnings do not fail).
#
# Reusable across POCs: the values below are passed in as env vars by the
# justfile (PORTS, PNPM_VERSION, NODE_MIN). Sensible defaults if run directly.
set -uo pipefail

PORTS="${PORTS:-8080 8081 8090 5432 5173 3000}"
PNPM_VERSION="${PNPM_VERSION:-10.27.0}"
NODE_MIN="${NODE_MIN:-22}"
ENV_FILE="${ENV_FILE:-.env}"

pass=0; warn=0; fail=0
ok()   { echo "  ✅ $1"; pass=$((pass+1)); }
wrn()  { echo "  ⚠️  $1"; warn=$((warn+1)); }
err()  { echo "  ❌ $1"; fail=$((fail+1)); }

echo "env-doctor — auditing local environment"
echo

echo "Tooling:"
# Node
if command -v node >/dev/null 2>&1; then
  node_major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
  if [ "${node_major:-0}" -ge "$NODE_MIN" ]; then ok "node $(node -v) (>= $NODE_MIN)"; else err "node $(node -v) is < $NODE_MIN — upgrade Node"; fi
else
  err "node not found — install Node >= $NODE_MIN"
fi
# pnpm
if command -v pnpm >/dev/null 2>&1; then
  pv="$(pnpm --version 2>/dev/null)"
  if [ "$pv" = "$PNPM_VERSION" ]; then ok "pnpm $pv (pinned)"; else wrn "pnpm $pv present (repo pins $PNPM_VERSION — 'corepack prepare pnpm@$PNPM_VERSION --activate')"; fi
else
  err "pnpm not found — 'corepack enable' then 'corepack prepare pnpm@$PNPM_VERSION --activate'"
fi
# just
command -v just >/dev/null 2>&1 && ok "just $(just --version | awk '{print $2}')" || wrn "just not found — 'brew install just'"

echo
echo "Container engine:"
if command -v docker >/dev/null 2>&1; then
  ctx="$(docker context show 2>/dev/null || echo unknown)"
  if [ "$ctx" = "podman" ]; then ok "docker routed to Podman (context: $ctx)"; else wrn "docker context is '$ctx' (repo standard is Podman — 'docker context use podman')"; fi
  if docker version >/dev/null 2>&1; then
    srv="$(docker version --format '{{.Server.Version}}' 2>/dev/null || true)"
    ok "engine reachable${srv:+ (server $srv)}"
  else
    err "docker engine not reachable — is the Podman machine running? ('podman machine start')"
  fi
else
  err "docker CLI not found — install Podman + route docker to it"
fi
command -v docker compose >/dev/null 2>&1 || docker compose version >/dev/null 2>&1 && ok "docker compose v2 available" || wrn "docker compose v2 plugin not found (podman-compose may miss health gates)"

echo
echo "Ports (must be free before start-local):"
for p in $PORTS; do
  if lsof -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then
    holder="$(lsof -iTCP:"$p" -sTCP:LISTEN -Fn 2>/dev/null | awk -F: '/^n/{print $NF; exit}')"
    wrn "port $p in use${holder:+ (by :$holder)} — free it or it'll clash with the stack"
  else
    ok "port $p free"
  fi
done

echo
echo "Project:"
[ -f "$ENV_FILE" ] && ok "$ENV_FILE present" || wrn "$ENV_FILE missing — 'just start-local' will create it from .env.example"

echo
echo "Summary: ${pass} ok · ${warn} warning(s) · ${fail} failure(s)"
[ "$fail" -eq 0 ] && { echo "✔ environment looks ready"; exit 0; } || { echo "✖ fix the ❌ items above"; exit 1; }
