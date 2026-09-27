# Multi-Tenant RBAC-as-a-Service — One-Page Summary

*Companion to [`DECISION_JOURNAL.md`](./DECISION_JOURNAL.md). Designed to read as a single slide.*

---

### THE PROBLEM
A **platform-level RBAC service** — one self-hosted SaaS that onboards *any* client
org, each with **its own role vocabulary**, consumable **as an API**, with an
onboarding **console**. Constraints: **self-hosted · minimal ops · small-to-medium scale.**

> Client A → roles `Parent`, `Child`  ·  Client B → roles `dev`, `qa`, `platform-engineer`

---

### THE KEY INSIGHT
This is **authorization** ("can user X do action Y?"), **not authentication (login)**.
→ Ruled out identity platforms (Auth0/Keycloak); chose a dedicated authorization engine.

---

### THE SOLUTION (one platform, many tenants)

```
  Operator ─login→ [ SvelteKit Console ] ─auth→ PocketBase
                          │ (server-side)
                          ▼
  Client A ─HTTP→   [    OpenFGA    ] → PostgreSQL
  Client B ─SDK →   [ store/tenant  ]
```

| Layer | Choice |
|---|---|
| Authorization engine | **OpenFGA** (CNCF, vendor-neutral) |
| Tenant isolation | **One store per tenant** (own role vocabulary each) |
| Console UI + server | **SvelteKit** (keeps secrets server-side) |
| Console login | **PocketBase** (single binary) |
| Data / deploy | **PostgreSQL** + **Docker Compose** |

---

### DECISIONS AT A GLANCE

| Decision | Chosen | Why |
|---|---|---|
| AuthZ vs AuthN | **Authorization** | Ask is RBAC, not login |
| Granularity | **Classic RBAC, object-level-ready** | Future need uncertain → no-migration option |
| Engine | **OpenFGA** over Permify | Permify now single-vendor (FusionAuth); OpenFGA is CNCF-neutral |
| Console auth | **PocketBase** over Supabase | Single binary; minimal ops; demo-credible |
| Client access | **HTTP + SDK** | Both modes, same endpoint, zero extra cost |

---

### STATUS

- ✅ Starter built · console **builds clean** · **type-check 0 errors**
- ✅ RBAC decision logic **verified offline** — **11/11** allow/deny cases pass
- ⚠️ **Live end-to-end run pending** (run `docker compose up` + `npm run seed` to confirm)

### WHY IT FITS

- **No lock-in / no license fees** — all components Apache-2.0, self-hosted
- **Minimal ops** — Postgres + 2 small Go binaries + 1 Node app
- **Future-proof** — object-level permissions + API gateway available with no rework
- **Demo-ready** — console shows two tenants with totally different role sets, live checks

---

### NEXT STEPS
1. Live end-to-end verification (local run) → 2. Thin API gateway for production (hide store ids, rate-limit, audit) → 3. Enable API-key auth + TLS before exposure
