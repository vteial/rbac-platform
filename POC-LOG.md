# POC Log — rbac-platform

> The **single, collapsed artifact** for this Mini-AIDLC POC. It folds the five standard artifacts (tracker · backlog · changelog · decision-journal · spec-pointer) into one file, **sectioned along the graduation seams** so `/graduate` can lift each section into its standard-model counterpart cleanly (see `docs/reference/aidlc/MIGRATION.md`).
>
> **Keep it terse.** POC speed. At graduation this file is *derived from*, then **frozen as historical reference** — not deleted.

| Field | Value |
| :--- | :--- |
| **POC** | rbac-platform — self-hosted multi-tenant RBAC-as-a-Service |
| **Stack** | OpenFGA (authz engine) · PocketBase (console auth) · SvelteKit (console) · PostgreSQL · Docker Compose |
| **Started** | 2026-09-27 |
| **Status** | 🔬 POC in progress · (→ ✅ Approved → run `/graduate`) |
| **Model** | Mini AIDLC (`docs/reference/aidlc/KICKSTART.md`) |

---

## § Decisions  → seeds `DECISION-JOURNAL.md` (carry forward at graduation)
> Real decisions only — the formative bets. **Full detail lives in [`docs/DECISION_JOURNAL.md`](docs/DECISION_JOURNAL.md)** (ADR-style, single source of truth). This section is a scannable index + any decisions not yet promoted there. At graduation, `docs/DECISION_JOURNAL.md` IS the seeded journal.

Index of decisions of record (details in `docs/DECISION_JOURNAL.md`):
- **ADR-0** — Treat as **authorization (AuthZ)**, not authentication.
- **ADR-1** — **Classic RBAC now, object-level-ready** (no future migration).
- **ADR-2** — Engine = **OpenFGA** (CNCF-neutral) over Permify (single-vendor).
- **ADR-3** — Tenancy = **one OpenFGA store per tenant**.
- **ADR-4** — Console stack = **SvelteKit** (server-side token handling).
- **ADR-5** — Client consumption = **HTTP + SDK** (both).
- **ADR-6** — Console auth = **PocketBase** (single binary, minimal ops).
- **ADR-7** — Data store + packaging = **PostgreSQL + Docker Compose**.
- **ADR-8** — Package manager = **pnpm** (via corepack) — machine standard.
- **ADR-9** — Container engine = **Podman**, prefer **Docker Compose v2 CLI** (honors health gates podman-compose misses).
- **ADR-10** — Deploy direction = **Fly.io** (backends) + **Vercel** (console).

Process decisions (POC-level, not in the ADR journal):
- **D-P1 — Adopt Mini-AIDLC** *(2026-09-27)* — Trigger: owner wants a repeatable, graduation-ready process · Options: (a) copy scaffold as-is / (b) adopt but reference existing docs · **Chose (b), scaffold at repo root, because we already have a richer `docs/DECISION_JOURNAL.md` and want one source of truth — mini `§ Decisions` points to it rather than duplicating.**
- **D-P2 — Align toolchain to iMac M3 standard** *(2026-09-28)* — Trigger: owner's personal-machine guide · Options: adopt into repo (A–D) vs machine-only awareness · **Chose adopt into repo: pnpm (ADR-8), Podman/Compose-v2 (ADR-9), Fly+Vercel direction (ADR-10), + `docs/DEVELOPMENT_GUIDE.md`.**

## § Now  → seeds `SPRINT_TRACKER.md` (migrate active work)
> What's being built right now. Simple states: `todo` / `doing` / `done`.

| Item | State | Note |
| :--- | :---: | :--- |
| Live end-to-end verification (`docker compose up` + `pnpm seed`, on Podman) | todo | Not run in the build sandbox (long-running server SIGKILLed); confirm console→OpenFGA round-trip + checks resolve on the dev machine. This is the one open verification gap. |
| Align toolchain to iMac M3 standard (pnpm · Podman · dev guide · ADRs) | done | Approved by owner 2026-09-28 (commits `48093bc`+`d693b97`). |
| Adopt Mini-AIDLC process (KICKSTART + POC-LOG + MIGRATION + graduate skill) | done | Landed in commit `fd326cd`. |

## § Ideas  → seeds `BACKLOG.md` (migrate the idea bucket)
> Things for later — not committed. The shelf.

- Thin API gateway in front of OpenFGA — map API key → store id (clients never see raw store ids), rate-limiting, audit logging.
- Object-level / per-resource permissions (`resource:<id>`) — enabled by ADR-1 with no migration; build when a client needs it.
- Move role-definition persistence from the local JSON store to PocketBase/Postgres for production.
- Enable OpenFGA `preshared` key auth + TLS before any non-local exposure.

## § Shipped  → seeds `CHANGELOG.md` (carry forward as history)
> What works, newest first — with the **eyeball-verify** note (the human-gate record at POC speed).

- *(2026-09-28)* **Toolchain aligned to iMac M3 standard** — console npm→**pnpm** (corepack-pinned `pnpm@10.27.0`, `pnpm-lock.yaml`, Dockerfile + docs updated); `docker-compose.yml` hardened for **Podman** (self-heal `restart` + Compose-v2-preferred note; health gates kept); new **`docs/DEVELOPMENT_GUIDE.md`**; **ADR-8/9/10** recorded. Verified: `pnpm build` clean, `pnpm check` 0 errors, `pnpm verify:model` **11/11** pass under pnpm; compose YAML validated · approved by owner (2026-09-28).
- *(2026-09-27)* **Decision Journal + One-Pager** (`docs/DECISION_JOURNAL.md`, `docs/ONE_PAGER.md`) — ADR-style record of all 8 decisions + slide summary. Verified: rendered/reviewed on GitHub · approved by owner.
- *(2026-09-27)* **RBAC platform starter** — OpenFGA integration (create/list tenants, per-tenant model publish, assign, check), SvelteKit console (login → tenants → roles → assign → live test-check), PocketBase auth guard, Docker Compose (Postgres + OpenFGA + PocketBase + console), demo seed (Client A parent/child, Client B dev/qa/platform_engineer). Verified: console **builds clean**, `svelte-check` **0 errors**, model-builder emits valid OpenFGA schema-1.1 JSON, **offline decision logic 11/11 allow/deny cases pass** (`npm run verify:model`); ⚠️ live server round-trip NOT yet run · approved by owner.

## § Spec  → grows into full Kiro Spec(s) at graduation
> Pointer to the current spec (if a unit of work warranted one). Small asks stay inline. Template: `docs/reference/aidlc/POC-SPEC.template.md`; actual specs live under `docs/specs/`.

- Current: none (inline asks so far).

---

<!-- At graduation, /graduate appends a freeze header here:
## ⛔ FROZEN — graduated to standard on YYYY-MM-DD
This POC-LOG is now a historical reference. Active work → SPRINT_TRACKER.md; ideas → BACKLOG.md;
shipped history → CHANGELOG.md; decisions → DECISION-JOURNAL.md; specs → .kiro/specs/. Do not edit above.
-->
