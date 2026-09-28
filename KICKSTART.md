# Mini AIDLC — POC Kickstarter

> **What this is.** A self-contained, tech-stack-independent kickstarter for running **AI-Driven Development (AIDLC)** at **POC speed** — the same *shape* as the full method, with far less ceremony. Copy this folder (`aidlc-mini/`) into a fresh POC repo and follow the prompt below. When the POC is approved, run **`/graduate`** to migrate to the standard model (see `MIGRATION.md`).
>
> **Origin:** distilled from the Cetana Labs (`LAB-000`) AIDLC blueprint. Generic by design — no assumptions about language, framework, or datastore.

---

## 0. The maturity ladder (why "mini" exists)

Process formality should scale with product maturity — **not** be full-blown from day one, and **not** be a throwaway you have to rewrite later.

```
POC (mini)            →   MVP (standard)          →   Product (extended)
fast, solo, light         human-gated, full           team-scale, culture-
ceremony                  lifecycle (LAB-000)         customized
   │                          │                           │
   └── same SHAPE ────────────┴───── add rigor ───────────┘
       (brainstorm→implement→verify→done, human-gated)
```

**Key principle:** every mini artifact is a **forward-compatible subset** of its standard form. Graduating = *adding rigor to the same artifacts*, never rewriting. That's what makes the ladder a ramp, not a cliff.

## 1. The non-negotiables (kept even at POC speed)

These are cheap and they are what make this *AIDLC* and not just fast coding. **Never drop them.**

1. **The phase shape:** `brainstorm → implement → verify → done`. Collapse/accelerate it, but keep the four beats.
2. **The human gate:** a human explicitly says "yes, good" before anything counts as *done* — even if it's just eyeballing the result. Nothing is "done" on the agent's say-so alone.
3. **The Decision Journal:** capture *why* for real decisions (stack choice, approach, pivots, dead-ends). At POC these are the formative bets — record them.

## 2. What's relaxed at POC (same artifact, less ceremony)

| Concern | Mini (POC) | Grows into (MVP) |
| :--- | :--- | :--- |
| **Contract** | one `POC-SPEC.md` per feature — or an inline ask for small things | full 3-file Kiro Spec (requirements EARS + design + tasks) |
| **Verification** | eyeball checklist ("does it work? y/n"), noted in the log | full human-verification loop + Verification Log |
| **Git flow** | commit freely; PR at meaningful milestones (or not at all early) | branch-per-feature, PR-per-Spec, merge-first, squash |
| **Tracking** | a few columns (todo / doing / done) in `POC-LOG.md` | `SPRINT_TRACKER.md` + state-machine statuses |
| **Changelog** | a running "what shipped" list in `POC-LOG.md` | Keep-a-Changelog + versions + tags |
| **Journal** | terse entries in `POC-LOG.md` | `DECISION-JOURNAL.md` (same format) |

At POC, **all five artifacts collapse into one file: `POC-LOG.md`** — sectioned along the graduation seams (see §4) so they split cleanly later.

## 3. What's deferred to standard (skip at POC)

Skip these now; `/graduate` adds them: **RFCs** (POC decisions go straight to the journal), **merge-first rule**, **state machine + phase-aware guards**, **validators / lockstep enforcement**, **the full command suite** (`/spec-run`, `/plan-*`, `/review-pr`, `/verification-done`), and the **two-surface (plan/execute) split**.

## 4. How to start a POC (the bootstrap prompt)

> Paste the following into your agent in the fresh POC repo. It is generic — fill the ⟨brackets⟩.

```
You are my AIDLC pair for a POC in ⟨repo/idea name⟩, tech stack ⟨language/framework/datastore, or "TBD">.
Run the MINI AIDLC model (see aidlc-mini/KICKSTART.md):

NON-NEGOTIABLE, even at POC speed:
  1. Follow the phase shape: brainstorm → implement → verify → done.
  2. Human gate: never mark anything "done" until I explicitly approve it. Stop and ask.
  3. Record real decisions (why, options, choice) in POC-LOG.md § Decisions.

SPEED RULES (keep it light):
  - No RFCs. Decisions go straight to POC-LOG.md § Decisions.
  - Contract = a short POC-SPEC.md per feature, or an inline ask for small things.
  - Verify by eyeballing ("does it work?") and note the result in POC-LOG.md § Shipped.
  - Commit freely; open a PR only at meaningful milestones.
  - No validators, no lockstep, no state machine.

ARTIFACTS (all in POC-LOG.md, sectioned; see the stub):
  - § Decisions   (why we chose things)
  - § Now         (what's being built — todo/doing/done)
  - § Ideas       (things for later)
  - § Shipped     (what works, with the eyeball-verify note)
  - § Spec        (pointer to the current POC-SPEC.md, if any)

LOOP for each unit of work:
  brainstorm with me → (optional) write/expand POC-SPEC.md → implement →
  show me + verify → I approve (human gate) → log it in § Shipped → repeat.

When I say the POC is approved for real development, run /graduate (see aidlc-mini/MIGRATION.md)
to migrate this into the standard model — do NOT do it before I approve.
```

## 5. Graduation (POC → MVP)

When the POC is **approved**, run **`/graduate`** (`skills/graduate/SKILL.md`). It executes `MIGRATION.md`: derives `SPRINT_TRACKER.md` + `BACKLOG.md` from `POC-LOG.md`, seeds `CHANGELOG.md` + `DECISION-JOURNAL.md`, **freezes `POC-LOG.md` as historical reference**, and adds the deferred rigor — human-gated throughout. See `MIGRATION.md` for the exact derivation map + checklist.

## 6. Files in this scaffold
- **`KICKSTART.md`** (this file) — the bootstrap prompt + the model.
- **`POC-LOG.md`** — the single collapsed artifact stub (sectioned along graduation seams).
- **`POC-SPEC.md`** — the lightweight, forward-compatible contract stub.
- **`MIGRATION.md`** — the graduation runbook (POC → standard).
- **`skills/graduate/SKILL.md`** — the `/graduate` command.
