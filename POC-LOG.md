# POC Log — rbac-platform

> The **single, collapsed artifact** for this Mini-AIDLC POC. It folds the five standard artifacts (tracker · backlog · changelog · decision-journal · spec-pointer) into one file, **sectioned along the graduation seams** so `/graduate` can lift each section into its standard-model counterpart cleanly (see `MIGRATION.md`).
>
> **Keep it terse.** POC speed. At graduation this file is *derived from*, then **frozen as historical reference** — not deleted.

| Field | Value |
| :--- | :--- |
| **POC** | rbac-platform — self-hosted multi-tenant RBAC-as-a-Service |
| **Stack** | OpenFGA (authz engine) · PocketBase (console auth) · SvelteKit (console) · PostgreSQL · Docker Compose |
| **Started** | 2026-09-27 |
| **Status** | 🔬 POC in progress · (→ ✅ Approved → run `/graduate`) |
| **Model** | Mini AIDLC (`KICKSTART.md`) |

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

Process decisions (POC-level, not in the ADR journal):
- **D-P1 — Adopt Mini-AIDLC** *(2026-09-27)* — Trigger: owner wants a repeatable, graduation-ready process · Options: (a) copy scaffold as-is / (b) adopt but reference existing docs · **Chose (b), scaffold at repo root, because we already have a richer `docs/DECISION_JOURNAL.md` and want one source of truth — mini `§ Decisions` points to it rather than duplicating.**

## § Now  → seeds `SPRINT_TRACKER.md` (migrate active work)
> What's being built right now. Simple states: `todo` / `doing` / `done`.

| Item | State | Note |
| :--- | :---: | :--- |
| Live end-to-end verification (`docker compose up` + `npm run seed`) | todo | Not run in the build sandbox (long-running server SIGKILLed); confirm console→OpenFGA round-trip + checks resolve on a normal machine. This is the one open verification gap. |
| Adopt Mini-AIDLC process (KICKSTART + POC-LOG + MIGRATION + graduate skill) | doing | This change. |

## § Ideas  → seeds `BACKLOG.md` (migrate the idea bucket)
> Things for later — not committed. The shelf.

- Thin API gateway in front of OpenFGA — map API key → store id (clients never see raw store ids), rate-limiting, audit logging.
- Object-level / per-resource permissions (`resource:<id>`) — enabled by ADR-1 with no migration; build when a client needs it.
- Move role-definition persistence from the local JSON store to PocketBase/Postgres for production.
- Enable OpenFGA `preshared` key auth + TLS before any non-local exposure.

## § Shipped  → seeds `CHANGELOG.md` (carry forward as history)
> What works, newest first — with the **eyeball-verify** note (the human-gate record at POC speed).

- *(2026-09-27)* **Decision Journal + One-Pager** (`docs/DECISION_JOURNAL.md`, `docs/ONE_PAGER.md`) — ADR-style record of all 8 decisions + slide summary. Verified: rendered/reviewed on GitHub · approved by owner.
- *(2026-09-27)* **RBAC platform starter** — OpenFGA integration (create/list tenants, per-tenant model publish, assign, check), SvelteKit console (login → tenants → roles → assign → live test-check), PocketBase auth guard, Docker Compose (Postgres + OpenFGA + PocketBase + console), demo seed (Client A parent/child, Client B dev/qa/platform_engineer). Verified: console **builds clean**, `svelte-check` **0 errors**, model-builder emits valid OpenFGA schema-1.1 JSON, **offline decision logic 11/11 allow/deny cases pass** (`npm run verify:model`); ⚠️ live server round-trip NOT yet run · approved by owner.

## § Spec  → grows into full Kiro Spec(s) at graduation
> Pointer to the current spec (if a unit of work warranted one). Small asks stay inline. Template: `POC-SPEC.template.md`; actual specs live under `docs/specs/`.

- Current: none (inline asks so far).

---

<!-- At graduation, /graduate appends a freeze header here:
## ⛔ FROZEN — graduated to standard on YYYY-MM-DD
This POC-LOG is now a historical reference. Active work → SPRINT_TRACKER.md; ideas → BACKLOG.md;
shipped history → CHANGELOG.md; decisions → DECISION-JOURNAL.md; specs → .kiro/specs/. Do not edit above.
-->
