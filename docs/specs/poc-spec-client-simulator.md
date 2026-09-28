# POC Spec — Client integration simulator

> The **lightweight contract** for one POC unit of work. Sections seed a standard Spec.
> **Keep it short.** POC speed.

| Field | Value |
| :--- | :--- |
| **Feature** | Simulated client app(s) that consume the RBAC `check` API for real |
| **POC** | rbac-platform |
| **Status** | **backlog** (spec drafted; not yet scheduled) |

---

## Goal  → seeds `requirements.md`
Prove the POC's core claim — *"a separate client system consumes this as an API"* — with
a **real integration simulation**, not the console's inline test. The console's "test a
check" is the **platform operator** poking its own system (same app, same SDK, secrets in
hand); it proves the engine, not the integration. A simulated client is a **different app**
holding only what a real client gets (store id, API endpoint, key), making the **same
network `check` call** a client's production system would — and **showing the raw request /
response inline** so an audience watches the integration happen. That is the real proof.

## Acceptance (how we'll know it works)  → seeds the EARS Definition of Done
- [ ] A **separate app** (own process/origin, not the console) represents a client's own system.
- [ ] Runnable as **Client A or Client B** from the same codebase (one app, two configs) — same client code, different store → different vocabulary → different answers (this *demonstrates* tenant isolation).
- [ ] Minimal flow: pick a **user**, pick an **action**, hit **"Can I?"** → allow/deny.
- [ ] Each check **shows the full API call inline**: request (method + `POST /stores/{storeId}/check`, the tuple `user`/`relation`/`object`, the tenant/store), response (`{ "allowed": … }`, HTTP status, latency), and a one-line narration ("Client B's own backend asked OpenFGA — the console/platform was not involved").
- [ ] The call goes through the **client's own thin backend** (store id / token stay server-side), mirroring the real integration shape in [`../design/CLIENT_INTEGRATION.md`](../design/CLIENT_INTEGRATION.md) — not a browser-direct call to OpenFGA.
- [ ] Wired into the stack: a `docker-compose` service (or `just` recipe) to run it; documented in the demo guide.
- [ ] Bare minimal: no auth on the sim, no persistence, no styling beyond the shared token system.

## Approach  → seeds `design.md`
- **Shape (ADR-decided direction):** *Option B — a separate tiny app, one-app-two-configs,
  thin backend, lightly themed per tenant.* (Rejected: a route inside the console — not a
  separate client; a browser-direct static client — exposes store id/token and teaches the
  wrong integration pattern.)
- **App:** a small SvelteKit app under `client-sim/` (reuses the console's design tokens /
  theme conventions). A `TENANT`/`STORE_ID` env selects Client A or B. Lightly themed per
  tenant (e.g. Client A = family-portal vibe with `read`/`manage_children`; Client B =
  deploy-dashboard with `deploy`/`test`) to sell "any client, their own vocabulary."
- **Thin backend:** one server endpoint (e.g. `POST /can-i`) that calls OpenFGA's `check`
  with the configured store id (+ token when preshared auth is on), and returns the
  decision **plus** the captured request/response/latency for inline display.
- **Config a real client would have, and nothing more:** `OPENFGA_API_URL`, `STORE_ID`,
  optional `OPENFGA_API_TOKEN`, `TENANT` label. No PocketBase, no console secrets.
- **Stack wiring:** add a `client-sim` service to `docker-compose.yml` (runnable twice with
  different `STORE_ID`/`TENANT`, or two named services `client-a` / `client-b`), and a
  `just` recipe (e.g. `just client-sim a` / `just client-sim b`) for host runs with the
  localhost URL override.
- **Forward-compat with the gateway idea (§ Ideas):** the sim calls via its own backend, so
  when the thin **API gateway** lands, the sim just repoints at the gateway (API key → store
  id) with no shape change — a natural next step.

## Steps  → seeds `tasks.md`
1. Scaffold `client-sim/` (minimal SvelteKit): tenant config + shared tokens.
2. Thin backend `POST /can-i` → OpenFGA `check`; capture request/response/latency.
3. Minimal UI: user + action pickers, "Can I?", inline API-call panel.
4. Per-tenant light theming + labels (A vs B) driven by config.
5. Compose service(s) + `just client-sim` recipe; host-run URL override.
6. Update the demo guide with the client-sim beat; verify both tenants; owner browser pass.

## Human verification (eyeball)  → seeds the §4b Human Verification Plan
- Run the sim as **Client B** → ask `esha` / `deploy` → ✅ + see the real `POST /stores/{B}/check` request/response inline; ask `chandra` / `deploy` → ⛔.
- Run the **same sim** as **Client A** → the vocabulary is Parent/Child; `anita` / `manage_children` → ✅. Same code, different store, different answer → isolation shown.
- Confirm the call is the **sim's own backend → OpenFGA**, with the console not running / not involved.

## Out of scope
- Auth/login on the simulator; persistence; multi-user sessions.
- Real client branding beyond a light per-tenant theme.
- SDK-mode demo in every language (the HTTP call is the proof; SDK parity is documented in `CLIENT_INTEGRATION.md`).
- The API gateway itself (separate § Ideas item — this sim is designed to repoint at it later).
