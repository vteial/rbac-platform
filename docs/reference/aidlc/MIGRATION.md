# Graduation Runbook — Mini AIDLC → Standard (POC → MVP)

> The documented, human-gated migration from the **mini** model to the **standard** model, executed by **`/graduate`** (`skills/graduate/SKILL.md`). Triggered when a POC is **approved for real development**.
>
> **Core principle:** `POC-LOG.md` is the *seed crystal*. Graduation **derives** the standard artifacts from its sections, **seeds** the historical ones, then **freezes `POC-LOG.md` as a historical reference** (kept, never deleted). Because `POC-LOG.md` is pre-sectioned along these seams, this is a clean *lift*, not a rewrite.

---

## 1. Trigger (when to graduate)

Run `/graduate` only when **the human declares the POC approved** for real development (the maturity flip POC → MVP). Not before — an un-approved POC stays in mini mode. `/graduate` STOPs if the trigger isn't met.

## 2. Derivation map (what becomes what)

| `POC-LOG.md` section | → Standard artifact | Nature |
| :--- | :--- | :--- |
| **§ Now** (todo/doing/done) | **`SPRINT_TRACKER.md`** — open items become the first real SPRINT; done items go to the delivered archive | forward-looking → **migrate** |
| **§ Ideas** | **`BACKLOG.md`** — the idea bucket (`BK-` initiatives) | forward-looking → **migrate** |
| **§ Shipped** | **`CHANGELOG.md`** — seed the history; cut the first version (e.g. `v0.1.0`) | historical → **carry forward** |
| **§ Decisions** | **`DECISION-JOURNAL.md`** — same format, appended as the inaugural entries | historical → **carry forward** |
| **§ Spec** / `POC-SPEC.md` | **`.kiro/specs/<id>/`** — expand into full Kiro Spec(s): Goal+Acceptance→`requirements.md` (EARS), Approach→`design.md`, Steps→`tasks.md` | forward-looking → **expand** |
| **`POC-LOG.md`** (whole file) | **stays in place, frozen** as historical reference | archived |

## 3. Add the deferred rigor (unhide what mini skipped)

Graduation is also where the standard-model machinery is adopted (from the standard blueprint — e.g. `LAB-000`):

- [ ] **Command suite:** adopt `/plan-start`·`/plan-done`, `/spec-run`, `/review-pr`, `/verification-done`, `/sprint-start`·`/sprint-done`.
- [ ] **State machine + phase-aware guards:** `PLANNING → READY_TO_BUILD → IN_VERIFICATION → IN_REVIEW → RECORDED`.
- [ ] **Merge-first rule:** Specs merged before `/spec-run`; the one-liner DX.
- [ ] **Full human-verification loop:** Human Verification Plan + Verification Log (not just eyeball).
- [ ] **Governance:** validators / lockstep across CHANGELOG/BACKLOG/SPRINT_TRACKER; branching + PR policy.
- [ ] **RFCs:** promote any buried `§ Decisions` that deserve a citable decision-of-record into RFCs.
- [ ] **Two-surface split** (plan vs. execute), if the team/tooling now warrants it.
- [ ] **Dev guide:** carry the POC's setup notes into a proper `developer-guide`.

> Keep the **non-negotiables** intact throughout — they were already in the POC, so nothing to add: phase shape, human gate, decision journal.

## 4. Graduation checklist (the `/graduate` runbook)

1. **Precheck (STOP on fail):** POC approved (trigger); `POC-LOG.md` exists and is sectioned; working tree clean.
2. **Derive** the four standard artifacts per §2 (SPRINT_TRACKER, BACKLOG, CHANGELOG, DECISION-JOURNAL).
3. **Expand** any `POC-SPEC.md` into full Kiro Spec(s).
4. **Freeze** `POC-LOG.md` — append the freeze header (graduated date + pointers to the new artifacts); stop writing to it.
5. **Add rigor** per §3 (adopt the command suite / state machine / merge-first / validators / RFCs as applicable).
6. **Human gate:** present the whole migration as a reviewable PR/diff and **STOP** — nothing is "graduated" until the human approves. (Consistent with the non-negotiable gate.)

## 5. After graduation

The repo now runs the **standard** model. `POC-LOG.md` remains as the POC's origin story (frozen). Future work follows the standard lifecycle. The next maturity step (**Product / extended** — team-scale, culture-customized) is a later evolution of the standard model, not covered here.

---

### Guard semantics (for `/graduate`)
- **Not approved / no `POC-LOG.md` ⇒ alert + HOLD** (name the missing prerequisite).
- **Already graduated (freeze header present) ⇒ skip + report** ("already on the standard model").
- Never graduate un-approved work; never delete `POC-LOG.md`; never skip the human gate.
