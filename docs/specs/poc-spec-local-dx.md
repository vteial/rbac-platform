# POC Spec — Local DX command layer (`just`)

> The **lightweight contract** for one POC unit of work — a single file, not the full 3-file Kiro Spec. Its sections are the **seeds** of a standard Spec.
>
> **Keep it short.** POC speed — this is a napkin contract, not a document.

| Field | Value |
| :--- | :--- |
| **Feature** | Local developer-experience command layer (`just`) |
| **POC** | rbac-platform |
| **Status** | draft |

---

## Goal  → seeds `requirements.md`
Make "getting a POC running locally" a **one-command, self-diagnosing** experience,
via a small set of `just` recipes that are **reusable across future POCs** (copy the
`justfile` + `scripts/`, edit the variables at the top). Kills the recurring pain of
tacit setup knowledge (is Podman routed? is corepack on PATH? which URL does the seed
use?) by encoding it in scripts instead of people's heads.

Six commands:

| Command | One-liner |
| :--- | :--- |
| `just setup-local` | **First run:** install safe tools + deps, guide Podman, then audit. |
| `just env-doctor` | Audit the machine: are the **tools** present + configured? |
| `just validate-local` | Probe the **running services**: are they up + answering? |
| `just start-local` | Bring the backing services up (background) and wait for healthy. |
| `just stop-local` | Stop the services (opt-in volume wipe). |
| `just seed-local` | Seed a **clean state** — minimal master data, usable by hand. |
| `just seed-local-demo` | Seed a **demo state** — the pre-baked Client A / Client B showcase. |
| `just setup-console-user` | Create the console login (PB superuser + `users` record), demo creds. |

## Acceptance (how we'll know it works)  → seeds the EARS Definition of Done
- [ ] `just --list` shows all recipes with one-line help each.
- [ ] `just setup-local` is **conservative + idempotent**: auto-does the safe/reversible steps (install `just` via brew, `corepack enable` + pin pnpm, `pnpm install`, bootstrap `.env`); **detects-and-guides** for Podman + its VM (prints exact commands, installs/starts nothing); ends by running `env-doctor`. Safe to run twice.
- [ ] `just env-doctor` reports ✅/⚠️/❌ per check (podman routed, machine running, pnpm at pinned version, node ≥22, ports free, `.env` present) and exits non-zero if any ❌.
- [ ] `just start-local` copies `.env` from example if missing, brings up postgres+openfga+pocketbase, and returns only once all are healthy.
- [ ] `just validate-local` probes OpenFGA `/healthz`=SERVING, PocketBase `/api/health`, Postgres `pg_isready`, and (if running) console `/health`; reports live status, exits non-zero on any failure.
- [ ] `just seed-local` produces a **clean state**: the smallest data that lets an operator drive the whole app flow by hand (one tenant with a role vocabulary, no pre-baked users).
- [ ] `just seed-local-demo` produces the **demo state**: Client A (`parent`/`child`) + Client B (`dev`/`qa`/`platform_engineer`) with sample users, ready for a quick test-and-show.
- [ ] Both seeds work when run from the host (they resolve the **host-facing** OpenFGA URL, not the compose-internal hostname).
- [ ] `just stop-local` stops the stack; `just stop-local wipe` also removes volumes.

## Approach  → seeds `design.md`
- **Tool:** `just` (v1.58, installed via brew) — modern, self-documenting (`just --list`), language-agnostic. A repo-root `justfile` holds thin recipes; heavier logic lives in `scripts/*.sh` so recipes stay readable and the shell is reusable.
- **Reusability shape:** all repo-specific values (service list, ports, health URLs, compose file, console dir) are **variables at the top of the `justfile`**. Copying to a new POC = copy `justfile` + `scripts/`, edit the header block.
- **Host-vs-container URL (the trap we hit):** `.env` uses compose-internal hostnames (`openfga:8080`) for container-to-container traffic. Host-run scripts (seeds, validate) must hit `localhost`. Recipes export a **host override** (`OPENFGA_API_URL=http://localhost:8080`, `POCKETBASE_URL=http://localhost:8090`) so a host-run seed can't fail the way our first live seed did.
- **`env-doctor` vs `validate-local` boundary:** doctor = *is the machine set up* (tools, config, ports, before anything runs). validate = *are the services alive* (health probes, after `start-local`). Two jobs, two commands.
- **Clean vs demo seed:** refactor the current `console/scripts/seed.ts` into a shared core plus two entry points — `seed:local` (clean) and `seed:local:demo` (demo) — invoked by the `just` recipes. Clean = one tenant + role vocabulary, no users (operator adds them by hand to learn the flow). Demo = the full two-tenant showcase.
- **Scripts are idempotent-ish:** re-running `start-local` or a seed converges rather than errors (reuse store by name, ignore "already exists").

## Steps  → seeds `tasks.md`
1. Add repo-root `justfile` with the variable header + recipes (thin wrappers).
2. Add `scripts/env-doctor.sh`, `scripts/validate-local.sh`, `scripts/setup-local.sh`.
3. `start-local` / `stop-local` recipes wrap `docker compose` with health-wait + `.env` bootstrap.
4. Split `console/scripts/seed.ts` → shared core + `seed-local` (clean) + `seed-local-demo` (demo); add `seed:local` / `seed:local:demo` package scripts.
5. Wire the seed recipes to export the host-facing URLs.
6. `just --list` help text + a short "Local DX" section pointer in the dev guide.

## Human verification (eyeball)  → seeds the §4b Human Verification Plan
- Run `just env-doctor` on a clean shell → expect all ✅ (or a clear ❌ if e.g. a port is held).
- `just start-local` → `just validate-local` → expect all services green.
- `just seed-local` → open the console → expect one tenant present, drive the flow by hand.
- `just seed-local-demo` → expect Client A/B with the headline checks (`esha` deploy ✅, `chandra` ⛔).
- `just stop-local` → expect the stack down.

## Out of scope
- Cross-platform support (Linux/Windows) — macOS + Podman only for now.
- CI wiring / GitHub Actions — local only.
- Auto-installing **heavy/stateful** tools — `setup-local` installs only safe, reversible things (`just`, pnpm-via-corepack, deps); Podman + its VM are **detect-and-guide** only. `env-doctor` never installs.
- Production/deploy commands (Fly/Vercel) — separate future unit.
