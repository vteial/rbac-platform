# POC Spec — ⟨feature⟩

> The **lightweight contract** for one POC unit of work — a single file, not the full 3-file Kiro Spec. Its sections are the **seeds** of a standard Spec: at graduation, `## Goal + Acceptance` → `requirements.md` (EARS), `## Approach` → `design.md`, `## Steps` → `tasks.md`. Use this only when a unit of work is big enough to warrant it; small asks stay inline in `POC-LOG.md`.
>
> **Keep it short.** POC speed — this is a napkin contract, not a document.

| Field | Value |
| :--- | :--- |
| **Feature** | ⟨name⟩ |
| **POC** | ⟨POC name⟩ |
| **Status** | draft / building / verified |

---

## Goal  → seeds `requirements.md`
⟨One or two sentences: what this unit of work delivers and why.⟩

## Acceptance (how we'll know it works)  → seeds the EARS Definition of Done
> Plain checklist now; becomes EARS "when X, the system shall Y" at graduation.
- [ ] ⟨observable behavior 1⟩
- [ ] ⟨observable behavior 2⟩

## Approach  → seeds `design.md`
⟨The rough technical plan: key pieces, interfaces, any trade-off worth noting. Bullet points fine.⟩

## Steps  → seeds `tasks.md`
1. ⟨step⟩
2. ⟨step⟩

## Human verification (eyeball)  → seeds the §4b Human Verification Plan
> How the human will confirm it works before approving (the POC-speed gate).
- ⟨run it / click it / check output⟩ → expect ⟨…⟩

## Out of scope
⟨What this deliberately does NOT do — keeps the POC focused.⟩
