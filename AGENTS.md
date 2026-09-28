# AGENTS.md — How an AI agent works in this repo

> Instructions for any AI coding agent (Kiro IDE, etc.) working in **rbac-platform**.
> Read this first, then read the live state, then work the loop below.

## What this project is
**rbac-platform** — a self-hosted, multi-tenant **RBAC-as-a-Service** POC. One platform
onboards many client organizations, each with **its own role vocabulary** (e.g. Client A:
`parent`/`child`; Client B: `dev`/`qa`/`platform_engineer`), consumable **as an API**.
It is an **authorization** service (OpenFGA), not a login service.

**Stack:** OpenFGA (authz, one store per tenant) · PocketBase (console auth) ·
SvelteKit console · PostgreSQL · Docker Compose.
**Toolchain:** pnpm (via corepack) · Podman (`docker` routed to it; prefer Docker
Compose v2 CLI). Details: [`docs/guides/DEVELOPMENT_GUIDE.md`](docs/guides/DEVELOPMENT_GUIDE.md).

## How we work — Mini-AIDLC
Phase shape: **brainstorm → implement → verify → done.** Read the model at
[`docs/reference/aidlc/KICKSTART.md`](docs/reference/aidlc/KICKSTART.md).

**Non-negotiables (never drop):**
1. Follow the phase shape.
2. **Human gate** — nothing is "done" until the owner explicitly approves. Stop and ask.
3. **Record real decisions** in [`docs/design/DECISION_JOURNAL.md`](docs/design/DECISION_JOURNAL.md)
   (ADR format), indexed in [`POC-LOG.md`](POC-LOG.md) § Decisions. One source of truth —
   don't duplicate.

**Speed rules:** no RFCs; contract = a short spec under [`docs/specs/`](docs/specs/)
(from [`docs/reference/aidlc/POC-SPEC.template.md`](docs/reference/aidlc/POC-SPEC.template.md))
only when a unit of work warrants it, else inline; verify by **running it**; commit freely
on milestones and push to `main`.

**Authority:** the owner is the **sole merge/release authority** — the agent does **not**
merge PRs or create tags. Do **not** run `/graduate` (see
[`docs/reference/aidlc/MIGRATION.md`](docs/reference/aidlc/MIGRATION.md)) until the owner
explicitly approves the POC for real development.

## Where things live
| Purpose | File |
| :--- | :--- |
| This guide (agent entry point) | `AGENTS.md` |
| Project overview + how-we-work | [`README.md`](README.md) |
| **Live state** (edit every loop) | [`POC-LOG.md`](POC-LOG.md) — § Now / Ideas / Shipped / Spec / Decisions |
| **Docs hub** (start here) | [`docs/README.md`](docs/README.md) |
| The story (audience-facing) | [`docs/product/NARRATIVE.md`](docs/product/NARRATIVE.md) |
| Decisions of record (ADR) | [`docs/design/DECISION_JOURNAL.md`](docs/design/DECISION_JOURNAL.md) |
| Local setup / run / deploy | [`docs/guides/DEVELOPMENT_GUIDE.md`](docs/guides/DEVELOPMENT_GUIDE.md) |
| Demo walkthrough | [`docs/guides/DEMO.md`](docs/guides/DEMO.md) · [`docs/design/CLIENT_INTEGRATION.md`](docs/design/CLIENT_INTEGRATION.md) |
| Mini-AIDLC method (reference) | [`docs/reference/aidlc/`](docs/reference/aidlc/) |

## The loop (per unit of work)
1. **Sync:** read `POC-LOG.md` (esp. § Now) and give the owner a one-paragraph read-back.
2. **Brainstorm** the unit of work with the owner; agree scope.
3. *(optional)* write a spec under `docs/specs/` for anything non-trivial.
4. **Implement.**
5. **Verify by running it** (build/tests/live check) — show the owner the result.
6. **Human gate:** owner approves.
7. **Log** it in `POC-LOG.md` § Shipped (+ record any decision in the journal); commit + push.
8. Repeat.

## Current priority
See `POC-LOG.md` § Now. The open item is **live end-to-end verification on Podman**:
```
cp .env.example .env
docker compose up -d postgres openfga pocketbase   # routed to Podman
docker compose ps                                   # wait until healthy
cd console && pnpm install && pnpm seed
pnpm dev            # http://localhost:5173  (PocketBase superuser at :8090/_/)
```
Confirm the console creates stores, roles publish, assignments work, and the
"test a check" panel resolves (e.g. Client B: `esha` can `deploy` ✅, `chandra` cannot ⛔).

> **Caveat:** the OpenFGA healthcheck uses gRPC on `:8081`. If a stray process holds it,
> free or remap the port. Ports table: `docs/DEVELOPMENT_GUIDE.md`.
