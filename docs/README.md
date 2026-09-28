# Documentation

[README](../README.md) › **Docs**

The docs are grouped by **purpose**. Start here, then jump to what you need.

## 📣 Product — the story (audience-facing)
For understanding *what* this is and *why*, and for demos/explainers.

| Doc | What it is |
| :--- | :--- |
| [product/NARRATIVE.md](product/NARRATIVE.md) | The living problem→solution story, with visual model + walkthrough-as-proof. Doubles as the brief for the animation explainer. **Start here for the big picture.** |
| [product/ONE_PAGER.md](product/ONE_PAGER.md) | Superseded slide summary — now a pointer to the Narrative. |

## 🏗 Design — the technical *why* and integration
For understanding *how* it works and how clients consume it.

| Doc | What it is |
| :--- | :--- |
| [design/DECISION_JOURNAL.md](design/DECISION_JOURNAL.md) | ADR-style record of every decision (the source of truth for *why*). |
| [design/CLIENT_INTEGRATION.md](design/CLIENT_INTEGRATION.md) | How a client's system calls the `check` API (HTTP + SDK). |
| [design/epic-advanced-rbac.md](design/epic-advanced-rbac.md) | **Epic:** requirements for the advanced RBAC/ReBAC healthcare tenant (2nd showcase). |

## 🛠 Guides — operating it
For running the platform locally and demoing it.

| Doc | What it is |
| :--- | :--- |
| [guides/development-guide.md](guides/development-guide.md) | Local setup, the `just` DX commands, ports, deploy direction. |
| [guides/demo-guide.md](guides/demo-guide.md) | The literal click-path to run the demo end-to-end. |

## 📐 Specs — per-feature contracts
Lightweight contracts for units of work big enough to warrant one.

| Doc | What it is |
| :--- | :--- |
| [specs/](specs/) | Index of POC specs. |
| [specs/poc-spec-local-dx.md](specs/poc-spec-local-dx.md) | The `just` local DX command layer. |

## 📚 Reference — the method
The Mini-AIDLC process the repo follows.

| Doc | What it is |
| :--- | :--- |
| [reference/aidlc/](reference/aidlc/) | KICKSTART (the model), MIGRATION (graduation), and the POC-SPEC / POC-NARRATIVE templates. |

---

**Related (repo root):** [`AGENTS.md`](../AGENTS.md) (agent entry point) · [`POC-LOG.md`](../POC-LOG.md) (live state).
