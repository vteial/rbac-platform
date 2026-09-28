# Decision Journal — Multi-Tenant RBAC-as-a-Service

> A structured record of the problem, the options weighed, and the decisions made
> while designing a self-hosted, multi-tenant RBAC platform. Written to be
> readable by an engineering manager: the executive summary is up top; the
> detailed decision log (ADR-style) follows.

- **Status:** Design + starter implementation complete; live end-to-end run pending (see §6)
- **Date:** 2026-09-27
- **Owner / decision-maker:** Project owner — set the problem and constraints, evaluated the
  options presented, and made every final call recorded below.
- **Engineering support:** Surfaced and compared options, prototyped the starter, and
  documented rationale for the owner's review.
- **Related artifacts:** [`ONE_PAGER.md`](./ONE_PAGER.md) (slide summary) · [`README.md`](../README.md) · [`docs/DEMO.md`](./DEMO.md) · [`docs/CLIENT_INTEGRATION.md`](./CLIENT_INTEGRATION.md)

---

## 1. Executive Summary

**The ask.** A client needs a **platform-level RBAC service** — an independent,
self-hostable SaaS that can onboard *any* client organization and let each define
**its own role vocabulary** (e.g. Client A uses `Parent`/`Child`; Client B uses
`dev`/`qa`/`platform-engineer`). It must be consumable **as an API** by each
client's own system, offer a **console** for onboarding roles, and stay
**minimal in operations/maintenance**, **self-hosted**, at **small-to-medium scale**.

**The key insight.** The request is for **authorization** (RBAC — "can user X do
action Y?"), *not* authentication (login). Getting this distinction right up front
steered every subsequent choice away from identity platforms (Auth0, Keycloak) and
toward a dedicated authorization engine.

**What we chose.**

| Concern | Decision | One-line rationale |
|---|---|---|
| Authorization engine | **OpenFGA** (CNCF) | Vendor-neutral governance; low-regret vs single-vendor alternatives |
| Tenancy model | **One OpenFGA store per tenant** | Clean isolation + independent per-client role vocabulary |
| RBAC granularity | **Classic RBAC now, object-level-ready** | Requirement was uncertain → pick the option with no future migration |
| Admin console | **SvelteKit** | Owner's chosen stack; server layer keeps secrets off the browser |
| Console authentication | **PocketBase** | Single binary; minimal ops; demo-credible login |
| Client consumption | **HTTP *and* SDK** | Both integration modes supported at zero extra cost |
| Data store | **PostgreSQL** | OpenFGA's production datastore; one DB = minimal ops |
| Packaging | **Docker Compose** | One-command self-hosted deploy |

**Cost / risk posture.** Small operational footprint (Postgres + two small Go
binaries + one Node app). All components are Apache-2.0 and self-hostable — **no
vendor lock-in, no per-seat licensing**. The main open risk is that a full
**live end-to-end run has not yet been executed** (see §6); the decision logic has
been verified offline and the console builds cleanly.

**Bottom line.** The design meets every stated constraint, keeps future options
open (object-level permissions, a gateway layer), and is demonstrable to the client
via a minimal console that shows two tenants with completely different role sets on
one platform.

---

## 2. Problem Statement

### 2.1 Client's ask (as received)

> RBAC should behave as a **platform-level RBAC system** — an independent SaaS able
> to onboard any client's RBAC to their specific requirement. For example, Client A
> needs roles like `Parent`, `Child`, whereas Client B needs `dev`, `qa`,
> `platform engineer`. The RBAC SaaS is a simple service (can be given to the client
> as part of their system as an API); it is an independent service that may have a
> console for onboarding the roles.

### 2.2 Constraints (owner-stated)

- **Self-hosted.**
- **Minimal operations and maintenance.**
- **Small-to-medium** RBAC model in scale.
- A **minimal console UI** is a must (needed to showcase/convince the client).

### 2.3 Interpretation (the reframe)

The ask is an **authorization** problem: manage roles/permissions *for the clients'
end-users* and answer `can user X do action Y?` over an API. It is **not** an
authentication/login problem — the clients' own systems authenticate their users
and then call this platform to check permissions. This reframe is the root
decision that shaped the solution.

> **Process note.** The design below was reached through a structured
> problem-first discussion: the owner stated the problem and constraints, then
> worked through each decision point one at a time, weighing the options
> presented before committing. Every decision in §4 was made by the owner.

---

## 3. Requirements Derived

| ID | Requirement | Source |
|---|---|---|
| R1 | Multi-tenant: one platform serves many independent client orgs | Ask |
| R2 | Each tenant defines its **own** role vocabulary | Ask (Parent/Child vs dev/qa/pe) |
| R3 | Consumable as an **API** by each client's system | Ask |
| R4 | Onboarding **console** for tenants + roles | Ask |
| R5 | **Self-hosted**, **minimal ops**, small-to-medium scale | Constraint |
| R6 | Minimal **console UI** for client demo | Constraint |
| R7 | Support classic RBAC; keep object-level permissions open | Discussion (uncertain need) |

---

## 4. Decision Log (ADR-style)

Each entry: **Context → Options → Decision → Rationale → Consequences**.

### ADR-0 — Treat this as authorization (AuthZ), not authentication (AuthN)

- **Context:** The word "RBAC" is often conflated with login/identity. Choosing the
  wrong category would pull in the wrong tools.
- **Options:** (a) Identity platform (Auth0 / Keycloak / WorkOS); (b) Dedicated
  authorization engine.
- **Decision:** Dedicated **authorization** engine. Authentication stays with each
  client's own system.
- **Rationale:** The ask is entirely about roles/permissions and "can user do X",
  with no login/SSO/password requirement. Identity platforms would add scope,
  operations, and cost we don't need.
- **Consequences:** The console still needs its *own* login (see ADR-6), but that is
  separate from the RBAC data the platform manages.

### ADR-1 — Classic RBAC now, object-level-capable later

- **Context:** The owner needs classic role→permission RBAC today but was **unsure**
  whether per-resource/object permissions ("Alice can edit Project X but not Y")
  would be needed later.
- **Options:** (a) Pure RBAC-only tool (simplest today); (b) An engine that does
  classic RBAC *and* fine-grained/object-level in the same model.
- **Decision:** Model **classic RBAC now**, but choose an engine where object-level
  is the **same model extended** — no re-platforming.
- **Rationale:** With uncertain future scope, the low-regret choice is the one that
  can't force a painful migration. Zanzibar-style engines treat classic RBAC as the
  simple case of a relationship graph, so there is no extra cost today.
- **Consequences:** The generated model checks against `resource:*` for tenant-wide
  (classic) permissions; a concrete `resource:<id>` enables object-level later with
  no schema migration.

### ADR-2 — Authorization engine: OpenFGA (over Permify)

- **Context:** Both OpenFGA and Permify are Apache-2.0, Zanzibar-inspired engines
  that fit the requirements (multi-tenant, per-tenant custom roles, single binary +
  Postgres, low ops).
- **Options:** (a) **Permify** — now *FusionAuth FGA by Permify* after FusionAuth's
  Nov-2025 acquisition (single-vendor governance); (b) **OpenFGA** — donated to CNCF
  by Auth0/Okta, promoted to **CNCF Incubating** (Oct 2025), multi-vendor maintainers
  (Okta + Grafana), no single commercial owner; (c) SpiceDB (single global schema —
  less clean per-tenant separation); (d) Casbin (embedded library — more glue to
  build).
- **Decision:** **OpenFGA.**
- **Rationale:** The owner explicitly raised longevity/lock-in as a concern. OpenFGA's
  **vendor-neutral CNCF governance** is the lower-regret bet; capabilities for our
  use case are equivalent to Permify. Permify would only win if we also adopted
  FusionAuth for authentication — which contradicts the "independent authz-only
  service" framing.
- **Consequences:** Per-tenant isolation uses OpenFGA "stores" (ADR-3) rather than
  Permify's explicit tenant primitive — a well-documented, equivalent pattern.

### ADR-3 — Tenancy model: one OpenFGA store per tenant

- **Context:** Each client org must be isolated and carry its own role vocabulary.
- **Options:** (a) One store per tenant; (b) A single shared store with tenant
  prefixing.
- **Decision:** **One store per tenant.**
- **Rationale:** A store is OpenFGA's natural isolation boundary and holds its own
  authorization model, so each tenant's role vocabulary (Parent/Child vs
  dev/qa/platform-engineer) lives independently. Onboarding a client = creating a
  store. Cleaner isolation and simpler mental model than prefixing.
- **Consequences:** The console's "create tenant" maps to `createStore`; tenant id =
  store id. Cross-tenant queries are intentionally not possible (a feature, not a bug).

### ADR-4 — Admin console stack: SvelteKit

- **Context:** A minimal but credible console UI is required for the client demo.
- **Options:** (a) Svelte SPA + separate API; (b) **SvelteKit** (UI + server routes
  in one app); (c) another framework.
- **Decision:** **SvelteKit** (owner's chosen direction), full app with server routes.
- **Rationale:** SvelteKit's server layer lets all OpenFGA calls run **server-side**,
  so the OpenFGA token never reaches the browser. One app to build, deploy, and demo.
- **Consequences:** Node runtime (adapter-node); the OpenFGA Node SDK is used from
  server routes only.

### ADR-5 — Client consumption: support both HTTP and SDK

- **Context:** Clients integrate differently; the owner wanted to allow both.
- **Options:** (a) Direct HTTP only; (b) SDK only; (c) Both.
- **Decision:** **Both.** Clients call OpenFGA's `check` API either as plain HTTP or
  via an official OpenFGA SDK (Go/Node/Python/Java/.NET).
- **Rationale:** Both modes hit the same endpoint, so supporting both costs nothing
  extra and maximizes client flexibility. HTTP keeps it stack-agnostic; SDK gives
  typed ergonomics.
- **Consequences:** Documented in `docs/CLIENT_INTEGRATION.md`. A future thin gateway
  can hide raw store ids and add rate-limiting/audit (noted as a next step).

### ADR-6 — Console authentication: PocketBase

- **Context:** The console itself needs a login gate (who may onboard tenants). This
  is separate from the RBAC data (ADR-0).
- **Options:** (a) Auth.js/Lucia inside SvelteKit (leanest, zero extra service);
  (b) **PocketBase** (one small Go binary, built-in auth + admin UI); (c) Supabase
  self-hosted (~10 services).
- **Decision:** **PocketBase.**
- **Rationale:** Best balance of "looks real in the demo" and "minimal ops." Supabase
  self-hosted is heavy (many services) for gating one console — it fights the core
  constraint. PocketBase is a single binary the owner already knows, and pairs with
  the "another minimal self-hostable service" story. (Auth.js/Lucia remains a valid
  even-leaner fallback if a zero-extra-service footprint is later preferred.)
- **Consequences:** A SvelteKit server hook validates the PocketBase session on every
  request. PocketBase gates the console; OpenFGA holds the clients' RBAC — no overlap.

### ADR-7 — Data store & packaging: PostgreSQL + Docker Compose

- **Context:** Need a production datastore and a low-friction self-hosted deploy.
- **Decision:** **PostgreSQL** for OpenFGA; **Docker Compose** for the whole stack.
- **Rationale:** Postgres is OpenFGA's supported production datastore; one DB keeps
  ops minimal. Compose gives a one-command self-hosted bring-up for demo and small
  deployments.
- **Consequences:** Four services (Postgres, OpenFGA, PocketBase, console). Scale path
  is documented but intentionally not over-engineered for small-to-medium use.

### ADR-8 — Package manager: pnpm (via corepack)

- **Context:** Aligning the repo to the standard developer machine (iMac M3), whose
  standard mandates pnpm over npm.
- **Options:** (a) npm (default, what the starter shipped with); (b) **pnpm** (via
  corepack); (c) yarn/bun.
- **Decision:** **pnpm**, pinned via `packageManager: "pnpm@10.27.0"` + corepack.
- **Rationale:** Machine standard (Guideline 5): pnpm's hard-linked global store
  eliminates duplicated `node_modules` and is faster. Pinning via corepack makes the
  version reproducible across the dev machine, Docker, and CI without a global install.
- **Consequences:** `package-lock.json` → `pnpm-lock.yaml`; Dockerfile uses
  `corepack enable` + `pnpm install --frozen-lockfile` + `pnpm build`; `esbuild`
  listed under `pnpm.onlyBuiltDependencies` so its install script runs reproducibly
  (tsx depends on it). Verified: build clean, `svelte-check` 0 errors, `verify:model`
  11/11 pass under pnpm.

### ADR-9 — Container engine: Podman (Docker Compose v2 CLI as the primary path)

- **Context:** The standard machine runs Podman with `docker` routed to it
  (`docker context use podman`); `podman-compose` 1.x has known gaps.
- **Options:** (a) Docker Desktop; (b) **Podman** with the Docker Compose v2 CLI
  routed to it; (c) Podman with `podman-compose`.
- **Decision:** **Podman as the engine; prefer the Docker Compose v2 CLI** (routed to
  Podman) for bring-up.
- **Rationale:** Machine standard (Guideline 3): Podman is daemonless/rootless/OSS.
  But `podman-compose` (v1.x) does not reliably honor
  `depends_on: condition: service_healthy` / `service_completed_successfully`
  (containers/podman-compose #1183/#1422/#1330), which our migrate→openfga→console
  chain relies on. The Docker Compose v2 CLI honors these gates and runs on Podman
  transparently.
- **Consequences:** `docker-compose.yml` keeps the `depends_on: condition:` blocks
  (correct for Compose v2) and adds `restart: unless-stopped` on OpenFGA so it
  self-heals if start-order races ahead under `podman-compose` — the stack converges
  either way. Documented in `docs/DEVELOPMENT_GUIDE.md`. (The OpenFGA image's
  `grpc_health_probe` healthcheck was verified present — no change needed there.)

### ADR-10 — Deployment direction: Fly.io (backends) + Vercel (console)

- **Context:** Aligning to the standard machine's deploy triad (Fly.io, Vercel,
  Supabase). Not yet wired — direction only.
- **Options:** (a) Fly.io for backends + Vercel for the console; (b) all-Vercel;
  (c) all-Fly; (d) other PaaS.
- **Decision:** **Fly.io** for OpenFGA + PocketBase (+ Postgres), **Vercel** for the
  SvelteKit console — recorded as direction, deferred to a deployment unit of work.
- **Rationale:** Matches the standard toolchain and prior operational experience
  (PocketBase-on-Fly). Fly suits always-on stateful backends; Vercel suits the web
  console. Keeps deployment consistent with the machine standard rather than ad hoc.
- **Consequences:** Console uses `adapter-node` today; may switch to
  `adapter-vercel` at deploy time. Before any non-local exposure: enable OpenFGA
  `preshared` key auth + TLS. Tracked in `POC-LOG.md` § Ideas until scheduled.

---

## 5. Final Architecture

```
   Admin/operator ──login──►┌──────────────────────────┐
                            │  SvelteKit Admin Console  │
                            │  server routes verify     │──► PocketBase (auth)
                            │  PocketBase session        │    single binary + SQLite
                            └────────────┬─────────────┘
                                         │ @openfga/sdk (server-side only)
                                         ▼
                                  ┌──────────────┐
   Client A app ─(a) HTTP check──►│   OpenFGA    │──► PostgreSQL
   Client B app ─(b) SDK check───►│ (per-tenant  │
                                  │   = store)   │
                                  └──────────────┘
```

| Service | Stack | Role |
|---|---|---|
| `postgres` | PostgreSQL 16 | OpenFGA datastore |
| `openfga` | OpenFGA (Go) | Authorization engine; one store per tenant |
| `pocketbase` | PocketBase (Go) | Console admin authentication |
| `console` | SvelteKit (Node) | Onboarding UI + server; tenants → roles → assign → test-check |

**How a role maps to the model:** a user is granted a role
(`user:<id> assignee role:<name>`); a role grants permissions on the tenant-wide
resource (`role:<name> role_<name> resource:*`); each permission is defined as
"assignee from any granting role", so `check(user, permission, resource:*)` is true
iff the user holds a role that grants it. The console generates this OpenFGA model
from a friendly role editor — clients never write the DSL.

---

## 6. What Was Built & Verified

**Built (committed starter):**
- OpenFGA integration layer (create/list tenants, publish per-tenant model,
  assign/unassign, check).
- Role→OpenFGA-model builder (turns a friendly role/permission list into valid
  OpenFGA schema-1.1 JSON).
- SvelteKit console: login, tenants list/create, per-tenant role editor, user→role
  assignment, and a live **"test a check"** panel.
- PocketBase auth guard (server hook).
- Docker Compose for all four services; demo seed for **Client A (parent/child)** and
  **Client B (dev/qa/platform_engineer)**.

**Verified:**
- ✅ Console **builds cleanly**; **type check = 0 errors**.
- ✅ Model builder emits **valid OpenFGA schema-1.1 JSON** (inspected).
- ✅ **RBAC decision logic proven offline** — an evaluator run against the generated
  model passes **all 11 allow/deny cases** (e.g. platform-engineer can `deploy`,
  developer cannot; QA can `test`, cannot `deploy`).

**Not yet verified (open item):**
- ⚠️ A **live end-to-end run** (console → OpenFGA HTTP round-trip against a running
  server + Postgres) was **not executed** in the build environment due to sandbox
  limits on long-running server processes. The path is designed to work and the SDK
  usage matches the documented API, but this hop should be confirmed by running
  `docker compose up` (routed to Podman) + `pnpm seed` on the dev machine before the
  client demo — see `docs/DEVELOPMENT_GUIDE.md`.

---

## 7. Open Items & Next Steps

1. **Live end-to-end verification** — run the full stack locally; confirm the console
   creates stores and checks resolve against a running OpenFGA + Postgres.
2. **Thin API gateway (recommended for production)** — front OpenFGA so clients use an
   API key mapped to their store id (never see raw store ids), plus rate-limiting and
   audit logging.
3. **Object-level permissions** — if/when required, extend the same model with
   concrete `resource:<id>` objects (no migration; enabled by ADR-1).
4. **AuthZ for the API itself** — enable OpenFGA `preshared` key auth + TLS before any
   non-local exposure.
5. **Role-definition persistence** — the starter keeps role labels in a small JSON
   store; move to PocketBase/Postgres for production (interface already abstracted).

---

## 8. Decision Summary Table (for quick reference)

| ADR | Decision | Alternatives rejected | Primary reason |
|---|---|---|---|
| 0 | Authorization, not authentication | Auth0/Keycloak/WorkOS | Ask is RBAC, not login |
| 1 | Classic RBAC, object-level-ready | RBAC-only tool | Uncertain future need → no-migration option |
| 2 | OpenFGA | Permify (FusionAuth), SpiceDB, Casbin | CNCF-neutral governance; no lock-in |
| 3 | One store per tenant | Shared store + prefixing | Clean isolation + per-tenant vocab |
| 4 | SvelteKit console | SPA + separate API | Owner's stack; token stays server-side |
| 5 | HTTP + SDK consumption | One mode only | Same endpoint; supports both free |
| 6 | PocketBase console auth | Supabase, Auth.js/Lucia | Single binary; minimal ops; demo-credible |
| 7 | Postgres + Docker Compose | — | Supported datastore; one-command self-host |
| 8 | pnpm (via corepack) | npm, yarn, bun | Machine standard; faster, hard-linked store; pinned/reproducible |
| 9 | Podman + Docker Compose v2 CLI | Docker Desktop; podman-compose | Machine standard; Compose v2 honors health gates podman-compose misses |
| 10 | Fly.io (backends) + Vercel (console) | all-Vercel; all-Fly | Matches machine deploy triad + prior Fly/PocketBase experience |
