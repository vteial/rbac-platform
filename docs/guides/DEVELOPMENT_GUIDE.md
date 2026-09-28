# Development Guide — rbac-platform

[README](../../README.md) › [Docs](../README.md) › Guides › **Development Guide**

Repo-specific setup, keyed to the standard developer machine (iMac M3 / Apple
Silicon). If your environment differs, the tool choices below are the intent;
adapt paths accordingly.

## Contents
1. [Prerequisites](#1-prerequisites)
2. [Clone & identity](#2-clone--identity-multi-account-git) · [2a. Local DX commands (`just`)](#2a-local-dx-commands-just)
3. [Containers (Podman)](#3-containers-podman)
4. [Console (SvelteKit)](#4-console-sveltekit)
5. [Seed & verify](#5-seed--verify)
6. [Everyday commands](#6-everyday-commands-map-to-the-machine-aliases)
7. [Deployment](#7-deployment)
8. [Process — Mini-AIDLC](#8-process--mini-aidlc)

- **Package manager:** pnpm (via corepack)
- **Container engine:** Podman (`docker` routed to Podman)
- **Local backends:** OpenFGA + PocketBase + PostgreSQL (Docker Compose)
- **Deploy direction:** Fly.io (OpenFGA, PocketBase) · Vercel (console) — see [§ Deployment](#deployment)

---

## 1. Prerequisites

| Tool | Version (standard) | Notes |
|---|---|---|
| Node.js | ≥ 22 (LTS) | Managed via pnpm env / nvm |
| pnpm | 10.x | `corepack enable` (do not `npm i -g pnpm`) |
| Podman | 6.x | `docker` context routed to Podman |
| podman-compose or Docker Compose v2 | — | **Prefer Docker Compose v2 CLI** (see [§ Containers](#3-containers-podman)) |

Enable pnpm once:

```bash
corepack enable
corepack prepare pnpm@10.27.0 --activate   # pin to the repo's packageManager
pnpm --version                             # -> 10.27.0
```

---

## 2. Clone & identity (multi-account git)

This repo is under the **personal** GitHub account (`vteial`). On the standard
machine it belongs under `~/dev-home/personal/`, where git `includeIf`
auto-applies the personal identity + SSH key (`id_ed25519_vteial_personal`) and
rewrites the URL to `git@github.com-personal:`.

```bash
cd ~/dev-home/personal
git clone git@github.com:vteial/rbac-platform.git
cd rbac-platform

# verify the right identity was applied by directory boundary
git config user.name    # -> Eialarasu
git config user.email   # -> vteial@gmail.com
```

> Do **not** clone this personal repo under `~/dev-home/agni/` — that boundary
> applies the work identity (`arasu@agnitechnologies.com`), which is wrong here.

---

## 2a. Local DX commands (`just`)

The fastest path — self-diagnosing, one command each (`brew install just` if missing):

```bash
just               # list all commands
just setup-local   # FIRST RUN: install safe tools + deps, guide Podman, then audit
just env-doctor    # audit the machine (tools, ports, .env) BEFORE anything runs
just start-local   # bring backends up + wait for healthy
just validate-local # probe running services
just setup-console-user # create the console login (PB superuser + console user)
just seed-local        # clean state: one tenant, drive the app by hand
just seed-local-demo   # demo state: Client A + Client B showcase
just stop-local        # stop (or 'just stop-local wipe' to drop volumes)
```

The raw equivalents are in the sections below. Spec: [`specs/poc-spec-local-dx.md`](../specs/poc-spec-local-dx.md).

## 3. Containers (Podman)

The stack (Postgres + OpenFGA + PocketBase + console) runs via Compose. On the
standard machine `docker` is routed to Podman (`docker context use podman`), so
the `docker compose` commands below execute on Podman transparently.

```bash
cp .env.example .env            # review values before first run

# bring up the backing services (recommended: Docker Compose v2 CLI, routed to Podman)
docker compose up -d postgres openfga pocketbase

docker compose ps               # wait until healthy
```

### Why Docker Compose v2 over `podman-compose` here

`podman-compose` (v1.x) does **not** reliably honor
`depends_on: condition: service_healthy` / `service_completed_successfully`
(containers/podman-compose #1183, #1422, #1330) — dependents can start before
their dependencies are ready. This repo mitigates that with
`restart: unless-stopped` on OpenFGA (it self-heals if it races ahead of
Postgres/migrate), so the stack still converges under `podman-compose`. But for
strict, first-try ordering, use the **Docker Compose v2 CLI** (routed to Podman).

Engine switching (from the machine standard):

```bash
docker context use podman                       # default
docker context use desktop-linux && open -a Docker   # on-demand fallback
```

### Ports

| Service | Port | URL |
|---|---|---|
| OpenFGA HTTP API | 8080 | http://localhost:8080 |
| OpenFGA gRPC | 8081 | — |
| OpenFGA Playground | 3000 | http://localhost:3000/playground |
| PocketBase | 8090 | http://localhost:8090/_/ (create first superuser) |
| Console (dev) | 5173 | http://localhost:5173 |

---

## 4. Console (SvelteKit)

```bash
cd console
pnpm install            # uses pnpm-lock.yaml (frozen in CI/Docker)

pnpm dev                # dev server on http://localhost:5173
pnpm build              # production build (adapter-node -> build/)
pnpm start              # run the built server (node build/index.js)
pnpm check              # svelte-check (type checking)
```

Environment variables the console reads (see `.env.example`):
`OPENFGA_API_URL`, `OPENFGA_API_TOKEN`, `POCKETBASE_URL`, `CONSOLE_SESSION_SECRET`.

---

## 5. Seed & verify

```bash
cd console

# seed demo tenants (Client A: parent/child · Client B: dev/qa/platform_engineer)
pnpm seed               # needs OpenFGA reachable at OPENFGA_API_URL

# offline RBAC decision-logic check (no server needed) — 11/11 cases
pnpm verify:model
```

First-run console login: create the PocketBase superuser at
http://localhost:8090/_/, then add a user in the `users` collection — that's the
console login. Full demo script: [DEMO.md](./DEMO.md).

---

## 6. Everyday commands (map to the machine aliases)

| Task | Command | Machine alias |
|---|---|---|
| Containers up | `docker compose up -d` | `doc compose up -d` |
| Git TUI | `lazygit` | `lg` |
| PocketBase (standalone) | `pocketbase serve` | `pb` |
| Jump to repo | `cd ~/dev-home/personal/rbac-platform` | `cdp` then `cd rbac-platform` |

---

## 7. Deployment

Direction (not yet wired — tracked in [`POC-LOG.md`](../../POC-LOG.md) § Ideas):

- **OpenFGA** + **PocketBase** → **Fly.io** (`fly launch` / `fly deploy`); Postgres via Fly Postgres or the OpenFGA datastore of choice.
- **Console (SvelteKit)** → **Vercel** (`vercel deploy`). Uses adapter-node today; may switch to adapter-vercel at deploy time.
- Before any non-local exposure: enable OpenFGA `OPENFGA_AUTHN_METHOD=preshared` + a key, and front with TLS.

---

## 8. Process — Mini-AIDLC

This repo follows Mini-AIDLC: `brainstorm → implement → verify → done`, with a
human gate on "done." See [`reference/aidlc/KICKSTART.md`](../reference/aidlc/KICKSTART.md)
for the model and [`POC-LOG.md`](../../POC-LOG.md) for live state. Decisions of record
live in [`DECISION_JOURNAL.md`](../design/DECISION_JOURNAL.md). Agent entry point: [`AGENTS.md`](../../AGENTS.md).
