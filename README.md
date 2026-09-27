# RBAC Platform — Self-Hosted Multi-Tenant RBAC-as-a-Service

A minimal, self-hosted **authorization (RBAC) platform** that can onboard many client
organizations, each with **their own custom role vocabulary**, and answer
`can user X do action Y?` over an API.

- **Client A** defines roles like `Parent`, `Child`.
- **Client B** defines roles like `dev`, `qa`, `platform-engineer`.
- One deployment, many tenants, each isolated.

> This is an **authorization** service, not a login/identity service. The clients'
> own systems authenticate their users and then call this platform to check
> permissions.

---

## The two "auths" — do not confuse them

| Concern | Handled by | What it protects |
|---|---|---|
| **Console admin login** (AuthN) | **PocketBase** | Who may log into *this* admin console (you / onboarding staff) |
| **Clients' end-user permissions** (AuthZ) | **OpenFGA** | The roles/permissions the platform manages *for the clients* |

They never overlap. PocketBase gates the console; OpenFGA holds the RBAC data.

---

## Architecture

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

- **Onboarding writes** (create tenant, define roles, assign users) go through the
  **SvelteKit console** using the OpenFGA Node SDK — server-side only, so the OpenFGA
  token never reaches the browser.
- **Runtime checks** are made by the clients directly against OpenFGA — either as
  plain **HTTP** *(mode a)* or via an **OpenFGA SDK** in their own stack *(mode b)*.
  Both hit the same `/check` API.

### Tenancy model

Each tenant (client organization) maps to **one OpenFGA store**. A store holds that
tenant's own **authorization model** (its role/permission schema) plus its
relationship tuples (which user has which role). This is what gives each client a
totally independent role vocabulary on a single shared platform.

---

## Components

| Service | Image / stack | Port | Purpose |
|---|---|---|---|
| `postgres` | `postgres:16` | 5432 | OpenFGA datastore |
| `openfga` | `openfga/openfga` | 8080 (HTTP), 8081 (gRPC), 3000 (playground) | Authorization engine |
| `pocketbase` | `ghcr.io/muchobien/pocketbase` | 8090 | Console admin auth |
| `console` | SvelteKit (Node 22) | 5173 (dev) / 3000 (prod) | Admin console UI + server |

---

## Quickstart

Requirements: Docker + Docker Compose.

```bash
# 1. Copy env template and review values
cp .env.example .env

# 2. Bring up the platform (Postgres, OpenFGA, PocketBase)
docker compose up -d postgres openfga pocketbase

# 3. Create the PocketBase admin (first run) — open the PB admin UI:
#    http://localhost:8090/_/   (create the first superuser)
#    Then create a console user (see docs/DEMO.md).

# 4. Seed the demo tenants (Client A: Parent/Child, Client B: dev/qa/platform-engineer)
cd console
npm install
npm run seed

# (optional) verify the RBAC decision logic offline — no server needed:
npm run verify:model

# 5. Start the console (dev)
npm run dev
#    Open http://localhost:5173 and log in with your PocketBase console user.
```

Or run everything (including the console) via Compose:

```bash
docker compose up -d --build
```

See **[docs/DEMO.md](docs/DEMO.md)** for the full client-facing demo walkthrough and
**[docs/CLIENT_INTEGRATION.md](docs/CLIENT_INTEGRATION.md)** for how a client calls the
`check` API (modes a & b).

---

## Repo layout

```
rbac-platform/
├── docker-compose.yml         # OpenFGA + Postgres + PocketBase + console
├── .env.example
├── docs/
│   ├── DEMO.md                # client demo walkthrough
│   └── CLIENT_INTEGRATION.md  # how clients consume the check API
└── console/                   # SvelteKit admin console
    ├── src/
    │   ├── lib/server/        # OpenFGA + PocketBase server-side integration
    │   └── routes/            # login, tenants, roles, assign, check
    └── scripts/
        ├── seed.ts            # demo seed (Client A + Client B)
        └── verify-model.ts    # offline RBAC decision-logic check
```

## License

Apache-2.0 (matches OpenFGA). See individual component licenses.
