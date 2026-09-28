# Local developer-experience commands for this POC.
#
#   just              # list all commands
#   just setup-local  # FIRST RUN: install safe tools + deps, guide Podman
#   just env-doctor   # audit the machine (before anything runs)
#   just start-local  # bring services up
#   just validate-local
#   just seed-local        # clean state (drive the app by hand)
#   just seed-local-demo   # demo state (pre-baked showcase)
#   just stop-local        # (or 'just stop-local wipe' to also drop volumes)
#
# REUSABLE ACROSS POCs: edit the variable block below, copy this file + scripts/.
# Spec: docs/specs/poc-spec-local-dx.md

# ── repo-specific config (edit these per POC) ────────────────────────────────
compose        := "docker compose"          # Compose v2 CLI, routed to Podman
backing        := "postgres openfga pocketbase"
console_dir    := "console"
ports          := "8080 8081 8090 5432 5173 3000"
pnpm_version   := "10.27.0"
node_min       := "22"
# host-facing URLs (host-run scripts must NOT use compose-internal hostnames)
openfga_host   := "http://localhost:8080"
pocketbase_host := "http://localhost:8090"
console_host   := "http://localhost:5173"
# ─────────────────────────────────────────────────────────────────────────────

# List all commands (default).
default:
    @just --list

# First-run onboarding: install safe tools + deps, guide Podman, then env-doctor.
setup-local:
    @PNPM_VERSION="{{pnpm_version}}" CONSOLE_DIR="{{console_dir}}" \
        bash scripts/setup-local.sh

# Audit the local machine: tools present + configured, ports free, .env present.
env-doctor:
    @PORTS="{{ports}}" PNPM_VERSION="{{pnpm_version}}" NODE_MIN="{{node_min}}" \
        bash scripts/env-doctor.sh

# Probe the running services: are they up and answering?
validate-local:
    @OPENFGA_HOST_URL="{{openfga_host}}" POCKETBASE_HOST_URL="{{pocketbase_host}}" \
        CONSOLE_HOST_URL="{{console_host}}" COMPOSE="{{compose}}" \
        bash scripts/validate-local.sh

# Bring the backing services up (background) and wait until healthy.
start-local:
    @test -f .env || (cp .env.example .env && echo "· created .env from .env.example")
    {{compose}} up -d {{backing}}
    @echo "· waiting for services to become healthy…"
    @bash -c 'for i in $(seq 1 30); do \
        if OPENFGA_HOST_URL="{{openfga_host}}" POCKETBASE_HOST_URL="{{pocketbase_host}}" COMPOSE="{{compose}}" bash scripts/validate-local.sh >/dev/null 2>&1; then \
            echo "· all services healthy"; exit 0; fi; \
        sleep 2; done; echo "⚠️  services not all healthy after 60s — run: just validate-local"; exit 1'
    @just validate-local

# Stop the services (data preserved). To also wipe volumes: `just stop-local wipe`.
stop-local wipe="keep":
    {{compose}} down {{ if wipe == "wipe" { "--volumes" } else { "" } }}

# Seed a CLEAN state: minimal master data to drive the app by hand.
seed-local:
    @cd {{console_dir}} && OPENFGA_API_URL="{{openfga_host}}" OPENFGA_API_TOKEN="" pnpm seed:local

# Seed a DEMO state: the pre-baked Client A / Client B showcase.
seed-local-demo:
    @cd {{console_dir}} && OPENFGA_API_URL="{{openfga_host}}" OPENFGA_API_TOKEN="" pnpm seed:local:demo
