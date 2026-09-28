# Epic — Advanced RBAC / ReBAC (healthcare tenant)

[README](../../README.md) › [Docs](../README.md) › Design › **Epic: Advanced RBAC**

> **Status:** requirements — drafting (no solutioning yet). This is a **requirements
> document** for a second showcase on the same platform. It captures *what* the advanced
> tenant needs; the *how* (OpenFGA modelling) comes in a later design doc, and code comes
> after that — each a separately gated unit.
>
> **Two showcases, one platform:**
> - **Epic 1 — Standard RBAC** *(shipped)* — Client A / Client B, classic tenant-wide roles.
>   Proves the baseline multi-tenant capability.
> - **Epic 2 — Advanced RBAC/ReBAC** *(this doc)* — a healthcare tenant whose access rules
>   depend on relationships, engagement, credentials, and consent — not role alone. Proves
>   the platform handles a hard, real-world authorization problem classic RBAC cannot.
>
> The advanced client is **just another tenant with a richer model** — not a fork of the
> platform. That is the point.
>
> **Anonymisation:** placeholder tenant **"Client C — Healthcare (therapy services)"**. Real
> client identity and any PII stay out of this repo (they live in the owner's private notes).

---

## Table of Contents
1. [Overview & relation to Epic 1](#1-overview--relation-to-epic-1)
2. [Actors & identity model](#2-actors--identity-model)
3. [The credentialing → authority chain](#3-the-credentialing--authority-chain)
4. [Relationships, authority & consent](#4-relationships-authority--consent)
5. [Resources & the access decision](#5-resources--the-access-decision)
6. [End-to-end validation scenario](#6-end-to-end-validation-scenario)
7. [Scope line — engine vs application](#7-scope-line--engine-vs-application)
8. [Gap analysis vs Epic 1](#8-gap-analysis-vs-epic-1)
9. [Open questions (to resolve before design)](#9-open-questions-to-resolve-before-design)
10. [Glossary](#10-glossary)

---

## 1. Overview & relation to Epic 1

Epic 1 answers *"does user X have role R, and does R grant permission P?"* — tenant-wide,
role-only. Epic 2's tenant answers a harder question:

> *"May **this professional** access **this specific patient's** data **right now** — given
> their verified credentials, their institution, an active engagement with the case, and the
> consent/authority in place — and if so, **what subset** of the data, with **what
> obligations**?"*

Access is gated by a **bundle** of conditions, not a single role. This is **relationship-
and context-based** authorization (ReBAC + ABAC touches), which is OpenFGA's home turf.
Modelled as a distinct tenant/store with its own authorization model.

## 2. Actors & identity model

- **Person** — the canonical human, identified by a stable **AP-ID**. One Person may hold
  multiple profiles/roles over time.
- Hanging off a Person:
  - **Account** → authentication (login). *(Out of the authz engine's scope — see §7.)*
  - **Profile** → one or more of:
    - **Parent**
    - **Professional** → specialisations: **Therapist**, **Doctor**, **Audiologist**.
- **Service / Application Principal (AP-ID / Client)** — non-human callers (systems,
  integrations) that also carry **Role / Permission / Scope**. The model must treat
  **both user and service principals** as first-class subjects.

## 3. The credentialing → authority chain

A professional profile alone grants nothing. A role becomes usable only through a chain:

```
Professional Profile
      │  (collect specialisation attributes; verify contact)
      ▼
Credential  ──verified──▶  Institution  ──▶  Membership  ──▶  Role Assignment  ──▶  Scope
                                                                (e.g. THERAPIST)     (Institution / Program)
                                                                      │
                                                                   ACTIVE?  ── only an ACTIVE, scoped role counts
```

Key facts:
- A role (e.g. `THERAPIST`) is only meaningful **scoped to an institution/program** — never
  globally.
- The role has **lifecycle state** (e.g. pending → **ACTIVE** → suspended/expired). Only
  ACTIVE counts.
- **Credentials must be verified** before the role activates.

## 4. Relationships, authority & consent

Person-to-person **Relationships** carry:
- **Authority / Delegation** — who may act on whose behalf.
- **Consent Context** — what a subject has consented to, for whom, for what.

This is the part **classic RBAC cannot express**. Access to a patient's data is justified
*because a relationship + engagement + consent exists for that specific case* — not because
someone holds a role in the abstract.

## 5. Resources & the access decision

**Resource chain:** `Case` (e.g. C101) → **Engagement** (a professional actively engaged
with that case) → **Resources** (e.g. Observations) → served via the **ADB** (data backend,
acting as the **PEP** — Policy Enforcement Point).

**The Policy Decision Point (PDP)** evaluates a bundle of inputs:
role · professional verification · institution · **case assignment** · **engagement** ·
**consent/authority** · resource + action.

**Decision output is richer than boolean:**
- **ALLOW / DENY** **+ obligations + reason**.
- On allow, the ADB returns the **minimum permitted data** (field/row-level minimisation).
- The **decision is audited**.

```
User/Service → Authn → Identity Context (AP-ID/Client) → Role+Attributes
   → Relationship+Authority → Institution/Program → Case/Resource
   → PDP  ⇒  ALLOW/DENY (+obligations/reason)  →  API/ADB (PEP)  →  Resource
                                                          ↳ audit
```

## 6. End-to-end validation scenario

The client's real-world acceptance test (anonymised), a therapist accessing a case:

1. User starts **Therapist Registration**
2. Resolve existing Person **or** create canonical **AP-ID**
3. Create **Professional Profile**
4. Collect therapist-specific attributes
5. Verify phone / email
6. **Validate professional credentials**
7. Associate **Institution**
8. Create **RoleAssignment** — `THERAPIST / Institution A`
9. Role becomes **ACTIVE**
10. Therapist logs in
11. Session carries **identity, not unrestricted patient access**
12. Therapist receives/initiates **engagement with Case C101**
13. Appropriate approval/authority establishes an **active engagement**
14. Therapist requests an **Observation**
15. **PDP evaluates:** role · professional verification · institution · case assignment ·
    engagement · consent/authority · resource/action
16. **ALLOW / DENY**
17. ADB returns the **minimum permitted data**
18. Decision is **audited**

This scenario is the north star for what the advanced tenant must be able to demonstrate.

## 7. Scope line — engine vs application

Critical to not over-claim. Much of the above is **platform**, not **authorization engine**:

| Concern | Where it lives |
| :--- | :--- |
| Relationship / engagement / consent / scope / role-active graph | **OpenFGA** (ReBAC — its strength) |
| Object-level case access (`case:C101`) | **OpenFGA** (object-level; ADR-1 path) |
| "Is this credential verified?" / "is the role ACTIVE?" state | **Grey zone** — OpenFGA contextual tuples/conditions *or* app-provided facts |
| Authn / login / session | **App** (PocketBase-style) — not the engine |
| Registration & credential-verification workflow (steps 1–9) | **App** — not the engine |
| Obligations, reason strings, **minimum-permitted-data** shaping | **App / PDP layer** — engine returns allow/deny; app applies minimisation |
| Audit log | **App** |

The **authorization slice** we'd model/prove: *scoped + active role → engagement with a
specific case → relationship/consent → allow/deny on a resource+action.* The rest is context
we acknowledge but don't necessarily build in the POC.

## 8. Gap analysis vs Epic 1 (current POC)

| Their need | Current POC (Epic 1) | Gap to close |
| :--- | :--- | :--- |
| Role scoped to institution/program | Roles are tenant-wide (`resource:_tenant`) | **Scoping** — a scope object, not a global resource |
| Access needs credential *verified* + role *ACTIVE* | No lifecycle/state on roles | **State/attribute gating** |
| Access needs an **engagement with a specific case** | `resource:_tenant` only | **Object-level** (`case:<id>`) — ADR-1's deferred path |
| Relationship / consent / authority between persons | Not modelled | **ReBAC** — relationship-based access |
| Decision returns **obligations + reason + min data** | Boolean allow/deny | **Richer decision + minimisation** (app layer) |
| **Service principals**, not just users | `user:<id>` only | **Non-human principals** |
| One canonical Person, many profiles/roles | Flat user ids | **Identity model** (Person / AP-ID) |

Good news: OpenFGA (Zanzibar/ReBAC) is *built* for the relationship/engagement/object-level
parts — this shows the engine at its best, and ADR-1 deliberately left the object-level door
open. The state-gating and minimisation parts lean into app/PDP territory (§7).

## 9. Open questions (to resolve before design)

**Scope & intent**
- Q1. Is this a **real client engagement** or a **design study / showcase**? (Affects rigor.)
- Q2. For the POC, do we prove the **full bundle** (steps 12–17) or a **vertical slice** first
  (e.g. engagement-gated case access) — the part classic RBAC can't do?
- Q3. Do we build the registration/credentialing workflow (steps 1–9), or **seed** those as
  given facts and focus the demo on the **decision** (steps 12–17)?

**Modelling**
- Q4. How far do we push **state** (credential-verified, role-ACTIVE) into OpenFGA (contextual
  tuples / conditions) vs treating it as app-supplied context at check time?
- Q5. **Consent/authority** — model as relationship tuples in OpenFGA, or as app-layer facts
  fed into the check? (Consent revocation semantics matter here.)
- Q6. Granularity of "minimum permitted data" — is field/row minimisation in scope for the
  POC, or do we demonstrate allow/deny + state the minimisation as an obligation?

**Product / demo**
- Q7. Tenant name & theme for the anonymised healthcare client (placeholder: "Client C").
- Q8. What's the single most convincing **demo moment**? (Candidate: same therapist ALLOWED on
  their engaged case C101 but DENIED on an un-engaged case C202 — identical role, different
  relationship.)
- Q9. Does the **client simulator** (backlog) become the vehicle for this demo, themed as the
  clinical app?

**Platform / process**
- Q10. Service-principal support — needed for the POC, or documented as a capability?
- Q11. Should Mini-AIDLC gain an explicit **"epic"** concept for POCs that grow multiple
  workstreams (this is the first)? *(Candidate method improvement — not decided here.)*

## 10. Glossary
- **AP-ID** — canonical Application Person ID; stable identity for a Person or service principal.
- **PDP** — Policy Decision Point (evaluates the access decision).
- **PEP** — Policy Enforcement Point (enforces it; here, the ADB / API).
- **ADB** — the data backend that serves resources and enforces the decision.
- **Engagement** — an active professional↔case association that (with consent/authority) licenses access.
- **ReBAC** — Relationship-Based Access Control (Zanzibar/OpenFGA style).
- **ABAC** — Attribute-Based Access Control (decisions using attributes/state).
