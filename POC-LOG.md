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
- **ADR-11** — Tenant-wide resource = concrete **`resource:_tenant`**, not a typed wildcard (`resource:*` is illegal in a tuple's object position).
- **ADR-12** — **Local DX layer via `just`** (reusable across POCs): `setup-local` · `env-doctor` · `validate-local` · `start-local` · `stop-local` · `seed-local` (clean) · `seed-local-demo` (demo) · `setup-console-user`.
- **ADR-13** — A **living `NARRATIVE.md`** (problem→solution story) that doubles as the brief for a downstream animation agent; supersedes `ONE_PAGER.md`.

Process decisions (POC-level, not in the ADR journal):
- **D-P1 — Adopt Mini-AIDLC** *(2026-09-27)* — Trigger: owner wants a repeatable, graduation-ready process · Options: (a) copy scaffold as-is / (b) adopt but reference existing docs · **Chose (b), scaffold at repo root, because we already have a richer `docs/DECISION_JOURNAL.md` and want one source of truth — mini `§ Decisions` points to it rather than duplicating.**
- **D-P2 — Align toolchain to iMac M3 standard** *(2026-09-28)* — Trigger: owner's personal-machine guide · Options: adopt into repo (A–D) vs machine-only awareness · **Chose adopt into repo: pnpm (ADR-8), Podman/Compose-v2 (ADR-9), Fly+Vercel direction (ADR-10), + `docs/DEVELOPMENT_GUIDE.md`.**

## § Now  → seeds `SPRINT_TRACKER.md` (migrate active work)
> What's being built right now. Simple states: `todo` / `doing` / `done`.

| Item | State | Note |
| :--- | :---: | :--- |
| POC foundation — `just` DX layer + living `NARRATIVE.md` convention | done | Approved by owner 2026-09-28. Six `just` recipes (env-doctor/validate/start/stop/seed-local/seed-local-demo), reusable across POCs; `NARRATIVE.md` + template feeding a downstream animation agent. Full lifecycle verified live. |
| Live end-to-end verification (`docker compose up` + `pnpm seed`, on Podman) | done | Approved by owner 2026-09-28. Ran on Podman via Compose v2 — caught & fixed a real bug (`resource:*` object → `resource:_tenant`, ADR-11); seed completes end-to-end, live HTTP checks resolve (`esha` deploy ✅, `chandra` ⛔, `divya` test ✅). Browser UI walkthrough left to owner-side validation. |
| Reorg repo so root talks about project+process (AGENTS.md + scaffold → docs/reference/aidlc) | done | Approved by owner 2026-09-28 (commit `bb77c1c`). |
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

- *(2026-09-28)* **`just setup-console-user` — one-command console login** (extends ADR-12) — collapses DEMO.md step 1 (two manual PocketBase UI steps) into one idempotent command: creates the **PB superuser** (`:8090/_/`) via the image's `superuser upsert`, and the **console user** (`:5173`) as a `users`-collection record via the PB API, then verifies a console-style login works. Demo-default creds live in `.env.example` (`PB_SUPERUSER_*` / `CONSOLE_USER_*`) and are surfaced in DEMO.md; the script also carries safe fallbacks so it works even if `.env` predates them. Verified: fresh run creates both + verifies login; re-run reports "already exists" (idempotent) · approved by owner (2026-09-28).
- *(2026-09-28)* **`just setup-local` — first-run onboarding** (extends ADR-12) — a conservative, idempotent onboarding command for a fresh machine/clone: auto-does the safe, reversible steps (`.env` bootstrap, install `just` via brew, corepack+pnpm pin, `pnpm install`), and **detect-and-guides** for Podman + its VM (prints exact commands, installs/starts nothing), ending with `env-doctor`. Surfaced the root cause of the recurring pnpm 11.1.3-vs-pinned-10.27.0 warning: this machine's Node is **pnpm-managed** (`~/Library/pnpm/node`), so corepack has no sibling to pin pnpm — the script now detects that and guides to `pnpm self-update` instead of a corepack command that can't work, without touching the global toolchain. Verified: `just setup-local` runs clean and idempotent, ends env-doctor 12 ok/0 fail · approved by owner (2026-09-28).
- *(2026-09-28)* **POC foundation — `just` DX layer + living Narrative doc** — two reusable-across-POCs conventions. **(1) DX layer (ADR-12):** a repo-root `justfile` + `scripts/` giving six self-documenting commands — `env-doctor` (audit the *machine*: tools, Podman routing, ports, `.env`), `validate-local` (probe *running services*), `start-local` (bootstrap `.env` + up + health-wait), `stop-local` (`wipe` to drop volumes), `seed-local` (clean state — one tenant, drive by hand), `seed-local-demo` (Client A/B showcase). Seed refactored into `seed-core.ts` + two entry points; encodes the host-vs-container URL trap so host-run seeds can't fail the ADR-11 way. **(2) Narrative (ADR-13):** `docs/NARRATIVE.md` (+ `POC-NARRATIVE.template.md`) — the living problem→solution story with Mermaid diagrams + a scene list that briefs a downstream animation agent; supersedes `ONE_PAGER.md` (now a stub); `DEMO.md` repointed as the literal click-path. Verified: full lifecycle runs green — `env-doctor` 0 failures, `start-local`→`seed-local`→`seed-local-demo`→`validate-local` (3 stores, checks resolve `esha` deploy ✅ / `chandra` ⛔)→`stop-local` (volumes preserved); `pnpm check` 0 errors. Spec: `docs/specs/poc-spec-local-dx.md` · approved by owner (2026-09-28).
- *(2026-09-28)* **Live end-to-end verification on Podman — and a real-bug fix** — brought the full stack up via **Docker Compose v2 routed to Podman** (Postgres + OpenFGA + PocketBase, all healthy; migrate exited clean, health-gate ordering honored), then ran `pnpm seed`. The live run **caught a bug the offline verifier could not**: roles were bound to the tenant-wide resource using the object `resource:*`, but OpenFGA rejects a typed wildcard in a tuple's *object* position. Fixed by switching to a concrete sentinel object `resource:_tenant` (exported `TENANT_WIDE_RESOURCE_ID`, threaded through `model-builder.ts` · `openfga.ts` · `seed.ts` · `verify-model.ts`) — **ADR-11**; ADR-1's object-level path stays open, no model migration. Verified: `pnpm seed` completes end-to-end (2 stores, models, bindings, assignments); **direct HTTP checks against the running engine** resolve `esha` deploy ✅ / `chandra` deploy ⛔ / `divya` test ✅; console dev server serves (`/health` ok, unauth `/` → `/login`); `pnpm check` **0 errors**; `verify:model` still **11/11**. Docs updated (`DECISION_JOURNAL.md`, `CLIENT_INTEGRATION.md`) · approved by owner (2026-09-28). ⚠️ Browser UI walkthrough left to owner-side validation.
- *(2026-09-28)* **Repo reorg — root talks about project + process** — added root **`AGENTS.md`** (industry-standard agent entry point) and removed the confusing `KIRO_KICKSTART.md`; moved the Mini-AIDLC scaffold (KICKSTART, MIGRATION, POC-SPEC.template, skills/graduate) → **`docs/reference/aidlc/`** via `git mv`. Root now = `AGENTS.md` · `README.md` · `POC-LOG.md`. Verified: git detected all moves as renames (history preserved), **zero dangling links** (re-grepped), all cross-links fixed · approved by owner (2026-09-28).
- *(2026-09-28)* **Toolchain aligned to iMac M3 standard** — console npm→**pnpm** (corepack-pinned `pnpm@10.27.0`, `pnpm-lock.yaml`, Dockerfile + docs updated); `docker-compose.yml` hardened for **Podman** (self-heal `restart` + Compose-v2-preferred note; health gates kept); new **`docs/DEVELOPMENT_GUIDE.md`**; **ADR-8/9/10** recorded. Verified: `pnpm build` clean, `pnpm check` 0 errors, `pnpm verify:model` **11/11** pass under pnpm; compose YAML validated · approved by owner (2026-09-28).
- *(2026-09-27)* **Decision Journal + One-Pager** (`docs/DECISION_JOURNAL.md`, `docs/ONE_PAGER.md`) — ADR-style record of all 8 decisions + slide summary. Verified: rendered/reviewed on GitHub · approved by owner.
- *(2026-09-27)* **RBAC platform starter** — OpenFGA integration (create/list tenants, per-tenant model publish, assign, check), SvelteKit console (login → tenants → roles → assign → live test-check), PocketBase auth guard, Docker Compose (Postgres + OpenFGA + PocketBase + console), demo seed (Client A parent/child, Client B dev/qa/platform_engineer). Verified: console **builds clean**, `svelte-check` **0 errors**, model-builder emits valid OpenFGA schema-1.1 JSON, **offline decision logic 11/11 allow/deny cases pass** (`pnpm verify:model`); ⚠️ live server round-trip NOT yet run · approved by owner.

## § Spec  → grows into full Kiro Spec(s) at graduation
> Pointer to the current spec (if a unit of work warranted one). Small asks stay inline. Template: `docs/reference/aidlc/POC-SPEC.template.md`; actual specs live under `docs/specs/`.

- [`docs/specs/poc-spec-local-dx.md`](docs/specs/poc-spec-local-dx.md) — Local DX command layer (`just`). Status: verified.

---

<!-- At graduation, /graduate appends a freeze header here:
## ⛔ FROZEN — graduated to standard on YYYY-MM-DD
This POC-LOG is now a historical reference. Active work → SPRINT_TRACKER.md; ideas → BACKLOG.md;
shipped history → CHANGELOG.md; decisions → DECISION-JOURNAL.md; specs → .kiro/specs/. Do not edit above.
-->
