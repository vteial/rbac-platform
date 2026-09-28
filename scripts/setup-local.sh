#!/usr/bin/env bash
#
# setup-local — FIRST-RUN onboarding for a fresh machine or a fresh clone.
#
# Conservative + idempotent: it does the SAFE, reversible things automatically
# and DETECTS-AND-GUIDES for the heavy, stateful ones (Podman + its VM), which
# it will not install or start on your behalf. Safe to run repeatedly.
#
#   auto:  install `just` (brew), enable corepack + pin pnpm, `pnpm install`, bootstrap .env
#   guide: Podman missing / machine stopped → print the exact command, don't run it
#   end:   hand off to env-doctor for the final readiness report
#
# Reusable across POCs: values are passed in by the justfile (PNPM_VERSION,
# CONSOLE_DIR, ENV_FILE). Sensible defaults if run directly.
set -uo pipefail

PNPM_VERSION="${PNPM_VERSION:-10.27.0}"
CONSOLE_DIR="${CONSOLE_DIR:-console}"
ENV_FILE="${ENV_FILE:-.env}"

step() { echo; echo "▶ $1"; }
ok()   { echo "  ✅ $1"; }
info() { echo "  ·  $1"; }
guide(){ echo "  👉 $1"; }

echo "setup-local — first-run onboarding (conservative, idempotent)"

# ── .env bootstrap ───────────────────────────────────────────────────────────
step "Project env file"
if [ -f "$ENV_FILE" ]; then
  ok "$ENV_FILE already present"
else
  cp .env.example "$ENV_FILE" && ok "created $ENV_FILE from .env.example"
fi

# ── just (safe: brew formula) ────────────────────────────────────────────────
step "just (task runner)"
if command -v just >/dev/null 2>&1; then
  ok "just $(just --version | awk '{print $2}') already installed"
elif command -v brew >/dev/null 2>&1; then
  info "installing just via brew…"
  brew install just >/dev/null 2>&1 && ok "installed just $(just --version | awk '{print $2}')" \
    || guide "brew install just failed — install manually: https://just.systems"
else
  guide "install just: https://just.systems (or install Homebrew first)"
fi

# ── pnpm at the pinned version ───────────────────────────────────────────────
# Prefer corepack (the ADR-8 path). If Node was installed BY pnpm (pnpm-managed,
# e.g. ~/Library/pnpm/node) there is no corepack sibling — corepack can't help,
# and forcing it would fight pnpm's own version management. In that case we
# detect it and guide toward the correct pnpm-native fix rather than pretend.
step "pnpm (pinned $PNPM_VERSION)"
node_path="$(command -v node || true)"
pnpm_managed_node="false"
case "$node_path" in
  */Library/pnpm/*|*/.local/share/pnpm/*) pnpm_managed_node="true" ;;
esac

if command -v corepack >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || true
  if corepack prepare "pnpm@$PNPM_VERSION" --activate >/dev/null 2>&1; then
    ok "pnpm pinned to $PNPM_VERSION (corepack)"
  else
    guide "corepack could not pin pnpm@$PNPM_VERSION — check network / corepack version"
  fi
elif command -v pnpm >/dev/null 2>&1; then
  cur="$(pnpm --version 2>/dev/null)"
  if [ "$cur" = "$PNPM_VERSION" ]; then
    ok "pnpm $cur (matches pin)"
  elif [ "$pnpm_managed_node" = "true" ]; then
    ok "pnpm $cur (pnpm-managed Node — corepack N/A)"
    guide "repo pins $PNPM_VERSION; $cur works. To match exactly:  pnpm self-update $PNPM_VERSION"
    guide "(not changed automatically — it's a global toolchain change)"
  else
    guide "pnpm $cur present but repo pins $PNPM_VERSION and corepack is missing — enable corepack (ships with Node >= 16)"
  fi
else
  guide "no pnpm/corepack — install Node >= 22 (corepack ships with it), then re-run"
fi

# ── console dependencies (safe: local install) ───────────────────────────────
step "Console dependencies"
if command -v pnpm >/dev/null 2>&1; then
  info "pnpm install in $CONSOLE_DIR/ …"
  if (cd "$CONSOLE_DIR" && pnpm install --frozen-lockfile >/dev/null 2>&1); then
    ok "dependencies installed (frozen lockfile)"
  elif (cd "$CONSOLE_DIR" && pnpm install >/dev/null 2>&1); then
    ok "dependencies installed"
  else
    guide "pnpm install failed in $CONSOLE_DIR/ — run it manually to see the error"
  fi
else
  info "skipping pnpm install (pnpm not available yet — see above)"
fi

# ── Podman: detect-and-guide only (heavy, stateful — never auto-installed) ───
step "Container engine (Podman) — detect & guide"
if command -v podman >/dev/null 2>&1; then
  ok "podman installed ($(podman --version | awk '{print $3}'))"
  # Is the VM running? `docker`/`podman` info succeeds only if the machine is up.
  if docker version >/dev/null 2>&1 || podman info >/dev/null 2>&1; then
    ok "podman machine is running"
  else
    guide "podman machine not running — start it:  podman machine start"
    guide "(first time only:  podman machine init)"
  fi
  # Is `docker` routed to podman? (repo standard)
  if command -v docker >/dev/null 2>&1; then
    ctx="$(docker context show 2>/dev/null || echo unknown)"
    [ "$ctx" = "podman" ] && ok "docker routed to Podman" \
      || guide "route docker to Podman:  docker context use podman"
  fi
else
  guide "Podman not installed. Install (macOS):  brew install podman"
  guide "then:  podman machine init && podman machine start"
  guide "then route docker to it:  docker context use podman"
fi

# ── final readiness report ───────────────────────────────────────────────────
step "Readiness check (env-doctor)"
if command -v just >/dev/null 2>&1; then
  echo
  just env-doctor || true
else
  info "run 'just env-doctor' once just is on PATH"
fi

echo
echo "✔ setup-local done. Next:  just start-local  →  just seed-local-demo"
