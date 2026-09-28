---
name: graduate
description: >-
  Migrates a Mini-AIDLC POC to the standard model (POC → MVP) when the human has approved the POC for real development. Executes the MIGRATION.md runbook: derives SPRINT_TRACKER.md + BACKLOG.md from POC-LOG.md, seeds CHANGELOG.md + DECISION-JOURNAL.md, expands POC-SPEC.md into full Kiro Spec(s), freezes POC-LOG.md as historical reference, and adds the deferred rigor (command suite, state machine, merge-first, validators, RFCs) — human-gated throughout. Use when the user runs /graduate after approving the POC. Generic + tech-stack-independent.
---

# Skill: Graduate (Mini AIDLC → Standard)

## Objective
Perform the **maturity transition POC → MVP**: turn a fast, light Mini-AIDLC POC into the standard, human-gated, full-lifecycle model — by **deriving** the standard artifacts from the single collapsed `POC-LOG.md`, **freezing** `POC-LOG.md` as a historical reference, and **adding the rigor** mini deliberately deferred. This is the executable form of `MIGRATION.md`. It **never** graduates un-approved work and **always** ends at a human gate.

> **Ships inside the `aidlc-mini/` scaffold** so every POC carries its own graduation path — self-contained, generic, no dependency on the standard-model repo being present (it references the standard blueprint as the *target* to adopt from).

## Trigger Patterns
- `/graduate`
- "graduate this POC", "migrate to the standard model", "promote POC → MVP"

## Steps

### 1. State guard (STOP unless the transition is valid)
- **POC approved?** The human must have declared the POC approved for real development. If not ⇒ **ALERT + HOLD:** "The POC isn't approved yet — graduate only once you've decided to take it forward." *(Missing trigger ⇒ HOLD, never assume approval.)*
- **`POC-LOG.md` present + sectioned?** If missing/unsectioned ⇒ HOLD with what's needed.
- **Already graduated?** If `POC-LOG.md` has the freeze header ⇒ **skip + report** "already on the standard model." *(Redundant ⇒ skip.)*
- **Clean working tree** before restructuring.

### 2. Derive the standard artifacts (per `MIGRATION.md` §2)
- **§ Now → `SPRINT_TRACKER.md`:** open items → the first real SPRINT; done items → the delivered archive.
- **§ Ideas → `BACKLOG.md`:** the `BK-` idea bucket.
- **§ Shipped → `CHANGELOG.md`:** seed history; cut the first version (e.g. `v0.1.0`).
- **§ Decisions → `DECISION-JOURNAL.md`:** append as the inaugural entries, same format.
- Preserve every id/decision — nothing lost in the lift (diff-verify).

### 3. Expand the Spec(s)
- Any `POC-SPEC.md` → full Kiro Spec under `.kiro/specs/<id>/`: `Goal`+`Acceptance` → `requirements.md` (EARS), `Approach` → `design.md`, `Steps` → `tasks.md`, `Human verification` → the §4b plan.

### 4. Freeze `POC-LOG.md`
- Append the freeze header (graduated date + pointers to the new artifacts). **Keep the file** — it's the POC's origin story. Stop writing to it.

### 5. Add the deferred rigor (per `MIGRATION.md` §3)
- Adopt from the standard blueprint, as applicable: the **command suite** (`/plan-*`, `/spec-run`, `/review-pr`, `/verification-done`, `/sprint-*`), the **state machine + guards**, **merge-first**, the **full verification loop**, **validators / lockstep**, **RFCs** (promote buried decisions), the **two-surface split**, and a proper **developer-guide**.
- The **non-negotiables** (phase shape, human gate, decision journal) are already present from the POC — carry them through unchanged.

### 6. Human gate — present + STOP (do NOT self-complete)
- Present the entire migration as a **reviewable PR/diff**; STOP-and-hold. Nothing is "graduated" until the human approves. Report what derived where, and the rigor added.

## Rules
- **Never graduate un-approved work** — approval is the trigger; absent it, HOLD.
- **Never delete `POC-LOG.md`** — freeze it as history.
- **Never skip the human gate** — the transition is presented for approval, not auto-applied.
- **Preserve everything** in the lift — no id/decision/shipped-item lost (verify against the pre-migration `POC-LOG.md`).
- **State-guard:** not-approved/missing-log ⇒ alert+HOLD; already-graduated ⇒ skip+report.
- **Generic + stack-independent** — make no assumptions about language/framework/datastore.
