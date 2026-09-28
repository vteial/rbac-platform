# Mini-AIDLC — Improvement Proposal (from rbac-platform)

> **Status:** PROPOSAL — not yet part of the method. Captured from running the
> `rbac-platform` POC end-to-end. The owner will review and fold the good parts into
> `KICKSTART.md` / the scaffold later.
>
> **Why this exists.** Mini-AIDLC worked well on this POC, but three real gaps showed
> up — always the *same* ones every new POC hits: **environment control**, **audience
> legibility**, and **doc sprawl**. Each was solved here with a small, reusable
> convention. This proposal distills those into candidate additions, keeping the
> method's core principle intact: *every mini artifact is a forward-compatible subset
> of its standard form.*

---

## Table of Contents
1. [Summary of proposed additions](#1-summary-of-proposed-additions)
2. [Proposal A — a DX command layer (`just`)](#2-proposal-a--a-dx-command-layer-just)
3. [Proposal B — the living NARRATIVE doc](#3-proposal-b--the-living-narrative-doc)
4. [Proposal C — docs grouping + navigation](#4-proposal-c--docs-grouping--navigation)
5. [Proposal D — process refinements](#5-proposal-d--process-refinements)
6. [What NOT to add (keep it mini)](#6-what-not-to-add-keep-it-mini)
7. [Suggested changes to the scaffold](#7-suggested-changes-to-the-scaffold)

---

## 1. Summary of proposed additions

| # | Addition | Solves the recurring pain of… | Cost |
| :-- | :--- | :--- | :--- |
| A | **`just` DX command layer** (`justfile` + `scripts/`) | "how do I run this locally" tacit knowledge lost every POC | one file + a few scripts, copy-paste reusable |
| B | **Living `NARRATIVE.md`** (+ template) | POCs that don't *land* — problem/solution not made legible | one template, drafted at kickoff |
| C | **Docs grouping + hub + breadcrumbs** | flat `docs/` sprawl, broken navigation as docs grow | a folder convention + a hub index |
| D | **Process refinements** | small friction points in the loop itself | doc-only |

All four are **forward-compatible**: they don't conflict with graduation, and each has a
natural "grows into" at MVP scale.

## 2. Proposal A — a DX command layer (`just`)

**The pain.** Every new POC re-incurs the same "get it running locally" cost. Tacit
knowledge (is the container engine routed right? is the package manager pinned? which
URL does the seed use from the host vs a container?) lives in someone's head and
re-bites on the next project. On this POC it caused a real, time-wasting bug on the
first live run (a host-run seed hit a compose-internal hostname).

**The convention.** A repo-root `justfile` with thin recipes over `scripts/*.sh`, all
repo-specifics in a **variable header** so the file + `scripts/` copy to the next POC by
editing the top block. The command set that proved useful:

| Command | Job |
| :--- | :--- |
| `setup-local` | **First run:** install safe tools + deps, *detect-and-guide* the heavy ones (never auto-install a container engine), end by auditing. Conservative + idempotent. |
| `env-doctor` | Audit the **machine** — tools present + configured, ports free, env file present — *before* anything runs. Reports ✅/⚠️/❌, non-zero exit on ❌. |
| `validate-local` | Probe the **running services** — health endpoints — *after* start. |
| `start-local` / `stop-local` | Bring the stack up (bootstrap env + wait for healthy) / down (opt-in volume wipe). |
| `seed-local` / `seed-local-demo` | **Clean state** (minimal, drive by hand) vs **demo state** (pre-baked showcase). |
| `setup-console-user` (or per-POC auth bootstrap) | Collapse manual first-login setup into one idempotent command. |

**Principles that made it work (these are the transferable part, not the exact commands):**
- **`env-doctor` vs `validate-local` are two jobs** — auditing the machine ≠ probing live services. Keep them separate.
- **Encode the host-vs-container gotcha** in the scripts, not the docs.
- **`setup-local` is conservative:** auto-do only safe, reversible things; *detect-and-guide* for heavy/stateful installs. Idempotent — safe to run twice.
- **Two seeds, not one:** a clean state to learn/drive by hand, a demo state to show.
- **Reusable via a variable header**, not hard-coded paths.

**Grows into (MVP):** the same recipes wrap CI steps; `env-doctor` becomes a pre-flight
check in the pipeline.

**A `just` gotcha worth documenting:** on the CLI, `name=value` sets a *variable
override*, not a recipe *argument*. Use a positional arg for flags (`just stop-local wipe`),
not `wipe=true`.

## 3. Proposal B — the living NARRATIVE doc

**The pain.** POCs fail to *land* with an audience because the problem and the solution
aren't made legible. The slide-deck-after-the-fact drifts from reality.

**The convention.** A `NARRATIVE.md`, born at kickoff and **reconciled** to the
implementation at the end (a `Status: draft → building → reconciled` field tracks it).
It is the audience-facing **story spine** — problem → stakes → insight → solution →
visual model → running example → walkthrough-as-proof → is/isn't — and it **links** to
the Decision Journal and POC-LOG rather than restating them. Crucially, it doubles as a
**brief for a downstream animation/explainer agent**: diagrams are **Mermaid** (human-
viewable *and* machine-parseable), plus a scene list and "do-not-say" honesty guardrails.

**Why it fits the method:** it's the POC-scale form of "explain what you built and why"
— the same instinct as the Decision Journal, but audience-facing instead of
engineer-facing. Forward-compatible: at MVP it becomes the product one-pager / pitch.

**Suggested artifact:** `POC-NARRATIVE.template.md` in the scaffold (this repo has one).

## 4. Proposal C — docs grouping + navigation

**The pain.** A flat `docs/` sprawls as a POC grows; links break silently on moves;
newcomers can't find the entry point.

**The convention.**
- **Group by purpose:** `product/` (the story), `design/` (decisions + integration),
  `guides/` (how to run/demo), `specs/`, `reference/` (the method).
- **A `docs/README.md` hub** — a categorized index, the single "start here."
- **Breadcrumbs** on every doc (`README › Docs › Guides › Development Guide`).
- **TOCs** on anything long.
- **A link-checker pass** before commit (a ~15-line script that resolves every relative
  `.md` link) — this repo caught 0 dangling links across 45 files that way.
- **Consistent file naming:** lowercase kebab-case (`development-guide.md`, `demo-guide.md`).

**Grows into (MVP):** the same structure hosts generated API docs, ADR indexes, etc.

## 5. Proposal D — process refinements

Small friction points in the loop, all doc-only:

1. **"Verify by running it" catches what offline checks can't.** On this POC an offline
   logic verifier passed 11/11 while the *live* first run immediately failed on an engine
   constraint. Recommend the method state explicitly: **an offline/unit check is not a
   substitute for one real end-to-end run before "done."**
2. **Frozen history vs live nav.** `POC-LOG.md § Shipped` entries are *historical record*
   — when paths change later, **don't rewrite history entries**; only fix live navigation
   links. Worth saying in the method so agents don't "helpfully" edit the past.
3. **"Extends ADR-N" for follow-on work.** Not every shipped item needs a new ADR; small
   extensions of an existing decision can reference it. Keeps the journal signal high.
4. **Reconciliation is a real step.** Living docs (NARRATIVE) should be explicitly
   reconciled to reality at the end of a unit — add it to the loop's "log it" beat.

## 6. What NOT to add (keep it mini)

The whole point is to stay light. These would over-formalize the POC tier:
- No required CI (the `just` recipes are enough locally; CI is an MVP concern).
- No mandatory spec for every unit — inline asks still fine for small things.
- No enforced doc structure for tiny POCs — grouping earns its keep only once `docs/`
  has ~5+ files. A 2-file POC shouldn't need `product/design/guides/`.
- Keep NARRATIVE **optional** for internal-only POCs with no audience to convince.

## 7. Suggested changes to the scaffold

If the owner adopts these, the concrete edits to `docs/reference/aidlc/`:

- Add **`POC-NARRATIVE.template.md`** (done in this repo — promote it to the scaffold).
- Add a **`dx/`** starter: a generic `justfile` (variable header + the recipe set above)
  and `scripts/` stubs (`setup-local`, `env-doctor`, `validate-local`).
- Add a short **`DX.md`** and **`DOCS-LAYOUT.md`** to `KICKSTART.md`'s file list, or fold
  both as new sections in `KICKSTART.md` (§7 DX, §8 Docs layout).
- Extend the **bootstrap prompt** (§4) with two optional lines: "set up the `just` DX
  layer" and "draft a `NARRATIVE.md` at kickoff, reconcile it at the end."
- Add the **process refinements** (§5 above) to the non-negotiables/notes as appropriate
  (esp. "one real end-to-end run before done").

> Everything here stays a *forward-compatible subset*: none of it blocks `/graduate`,
> and each has a clear MVP-scale evolution. Adopt selectively.
