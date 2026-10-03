# Design — Advanced RBAC/ReBAC: engagement-gated case access (vertical slice)

[README](../../README.md) › [Docs](../README.md) › Design › **Design: ReBAC slice**

> **Status:** design — drafting; brainstorm artifact, no code. This is the *modelling
> design* for the vertical slice of the Epic 2 healthcare tenant (requirements:
> [`epic-advanced-rbac.md`](./epic-advanced-rbac.md)). It proposes an OpenFGA
> authorization model, seed tuples, and `verify:model`-style check cases — **nothing is
> built, no store is created, no code is touched.** Implementation is a later, separately
> gated unit.

> **Tenant:** placeholder **"Client C — Healthcare (therapy services)"** (showcase; no real
> PII — Q1/Q7). **Slice:** prove the one thing classic RBAC cannot — *engagement-gated case
> access* (Q2), not the full bundle.

---

## Table of Contents
1. [Scope — what this slice proves](#1-scope--what-this-slice-proves)
2. [Decision trace table (locked decisions → requirements §/Q)](#2-decision-trace-table-locked-decisions--requirements-q)
3. [How this extends the Epic-1 model](#3-how-this-extends-the-epic-1-model)
4. [Proposed OpenFGA authorization model (`client-c` store)](#4-proposed-openfga-authorization-model-client-c-store)
5. [Seed tuples (Q3) — given facts](#5-seed-tuples-q3--given-facts)
6. [North-star checks + the revoke sequence (Q5/Q8)](#6-north-star-checks--the-revoke-sequence-q5q8)
7. [`verify:model`-style cases](#7-verifymodel-style-cases)
8. [Engine vs application scope line (§7, this slice)](#8-engine-vs-application-scope-line-7-this-slice)
9. [Deferred / documented-not-built](#9-deferred--documented-not-built)
10. [Acceptance criteria + proving command](#10-acceptance-criteria--proving-command)
11. [Gaps flagged — where Epic-1 code differs from requirements](#11-gaps-flagged--where-epic-1-code-differs-from-requirements)

---

## 1. Scope — what this slice proves

Epic 1 answers *"does user X hold a role that grants permission P, tenant-wide?"* — a single
tenant-wide resource (`resource:_tenant`, ADR-11), role-only. This slice answers the harder
question the requirements §1 pose, **narrowed to one provable contrast** (Q2 vertical slice):

> *May **this therapist** read an **observation on this specific case** — given an **ACTIVE,
> credential-verified role** scoped to their institution **and** an **active engagement** with
> that case backed by **consent** — and NOT otherwise?*

The north star (Q8, locked): the **same therapist** is **ALLOWED** on engaged case **C101** and
**DENIED** on un-engaged case **C202** — identical role, different relationship. That contrast
is ReBAC; no classic RBAC model can express it, because the deciding fact is a *relationship to
a specific object*, not a role in the abstract.

Everything in requirements steps 1–9 (registration/credentialing) is **seeded as given facts**
(Q3) — we demonstrate the **decision** (steps 12–17), not the workflow.

---

## 2. Decision trace table (locked decisions → requirements §/Q)

Every design decision below traces to a requirement section (§) or a resolved open question (Q)
from [`epic-advanced-rbac.md`](./epic-advanced-rbac.md).

| # | Locked decision | Traces to |
|---|---|---|
| D1 | Showcase tenant, no real PII; placeholder "Client C — Healthcare (therapy services)" | Q1, Q7, Epic §Anonymisation |
| D2 | Vertical slice = **engagement-gated case access** only (not the full bundle) | Q2, Epic §1 |
| D3 | Steps 1–9 **seeded as given tuples** via a future `seed-local-clinical`; demo the decision (steps 12–17) | Q3, Epic §6 |
| D4 | Role-**ACTIVE** + credential-**verified** pushed into the engine as **conditions / contextual tuples**; app-supplied context only as a documented fallback | Q4, Epic §3, §7 (grey zone) |
| D5 | Consent/authority modelled as **relationship tuples** (revocation = tuple delete; must demo ALLOW→revoke→DENY) | Q5, Epic §4 |
| D6 | **Minimum-permitted-data OUT of engine scope**: engine returns ALLOW/DENY; minimisation is an app-layer **obligation**, documented not built | Q6, Epic §5, §7 |
| D7 | Tenant "Client C — Healthcare (therapy services)", placeholder | Q7 |
| D8 | **North-star acceptance test**: same therapist ALLOW on C101, DENY on C202 — identical role, different relationship | Q8, Epic §6 |
| D9 | Prove via **direct `check` calls + `verify:model`-style cases** (same approach as Epic 1); client simulator is a later unit, not designed here | Q9, Epic §6 |
| D10 | **Service principals documented as a capability** (uniform subjects; `service:<id>` a later increment), not built | Q10, Epic §2, §8 |
| D11 | **No** Mini-AIDLC "epic" primitive; this stays a backlog cluster of per-unit specs — process note only | Q11 |
| D12 | **Object-level** case access (`case:C101`) uses concrete objects — ADR-1's deferred door, opened now with no model migration | Epic §8, ADR-1 |
| D13 | Tenant-wide sentinel stays `resource:_tenant`; this slice adds **new object types**, it does not disturb ADR-11 | ADR-11 |

---

## 3. How this extends the Epic-1 model

The Epic-1 model generated by
[`buildRbacModel`](../../console/src/lib/server/model-builder.ts) (schema 1.1 JSON) has exactly
three types:

- `type user`
- `type role` with `assignee: [user]`
- `type resource` with a `role_<name>: [role]` relation per role and a per-permission relation
  defined as `tupleToUserset { tupleset: role_<name>, computedUserset: assignee }` (union across
  granting roles). Tenant-wide bindings are written by
  [`tenantWideRoleBindings`](../../console/src/lib/server/model-builder.ts) against the concrete
  object `resource:_tenant` (`TENANT_WIDE_RESOURCE_ID = '_tenant'`, ADR-11).

That pattern — *"a permission is `assignee` reached through a granting-role relation on the
target object"* — is exactly the shape we extend. The slice keeps that spine and adds, **for the
`client-c` store only** (one store per tenant, ADR-3):

- a **scope** object (`institution` / `program`) so a role is meaningful *scoped*, not global
  (Epic §3, §8 gap "Scoping");
- **role lifecycle state** (`active`) and **credential verification** expressed as an OpenFGA
  **condition** on the role→subject edge — the ADR-1-friendly way to keep "only ACTIVE, verified
  counts" (D4, Epic §3);
- an **object-level `case`** type (`case:C101`), opening ADR-1's deferred object-level path (D12);
- an **`engagement`** relation binding a professional to a specific case (Epic §5);
- a **`consent`** relation on the case, as a deletable relationship tuple (D5, Epic §4);
- an **`observation`** resource whose read permission is the **conjunction** of *scoped-active-
  verified role* **and** *engaged* **and** *consented* on its parent case.

The classic Epic-1 `user`/`role`/`resource` tenant-wide path is untouched; `client-c` is simply a
store with a **richer authorization model** — "just another tenant", which is the whole point of
Epic 2 (Epic §1).

> **DSL vs JSON.** Epic 1 ships the model as **schema-1.1 JSON** (that is what
> `buildRbacModel` emits and `writeAuthorizationModel` publishes). The DSL below is the
> human-readable form of the *same* model; the implementation unit will emit the equivalent JSON
> (a `buildClinicalModel`, parallel to `buildRbacModel`) — this is a **hand-authored, static**
> model for one tenant, not generated from the friendly role editor.

---

## 4. Proposed OpenFGA authorization model (`client-c` store)

Authorization model for the `client-c` store, in OpenFGA DSL (schema 1.1), with a `condition`
for the ACTIVE + credential-verified gate (D4). This is an **actual model**, not a sketch — it
is the artifact the implementation unit renders to JSON.

```dsl
model
  schema 1.1

# Subjects are uniform: a human professional today, a service:<id> later (D10).
type user

# Scope: a role is only meaningful scoped to an institution/program (Epic §3).
type institution
  relations
    define member : [user]

type program
  relations
    define parent_institution : [institution]
    define member             : [user, institution#member]

# A scoped, state-bearing role. The `active_verified` condition carries
# role-ACTIVE + credential-verified (D4). Only a holder whose tuple satisfies
# the condition counts as a therapist.
type role_therapist
  relations
    # Edge is condition-gated: user holds therapist role ONLY while the
    # supplied context satisfies active_verified (role ACTIVE + cred verified).
    define holder    : [user with active_verified]
    define scoped_to : [institution, program]

# Object-level case (ADR-1 object-level door, D12). Engagement + consent are
# relationships ON the case — the part classic RBAC cannot express (Epic §4).
type case
  relations
    define institution : [institution]
    # An active professional↔case engagement (Epic §5, step 13).
    define engaged      : [role_therapist#holder]
    # Consent/authority as a deletable relationship tuple (D5). Revoke = delete.
    define consented    : [role_therapist#holder]
    # Derived: a therapist actively engaged AND consented on THIS case.
    define case_access  : engaged and consented

# The protected resource. Reading an observation requires case_access on its
# parent case. (Minimisation of the returned data is an app obligation — D6.)
type observation
  relations
    define parent : [case]
    define read   : case_access from parent

# A condition: the ACTIVE, credential-verified gate for the therapist edge (D4).
# `is_active` and `credential_verified` are supplied as context at check time
# (contextual) or carried on the stored tuple's condition — see §5 note.
condition active_verified(is_active: bool, credential_verified: bool) {
  is_active && credential_verified
}
```

**Why this shape proves ReBAC (Epic §1, §8):**

- `observation.read = case_access from parent`, and `case_access = engaged and consented`, so a
  read decision depends on **relationships to the specific case object**, not on a role alone.
- The therapist edge is `[user with active_verified]` — the role **does not count** unless the
  check's context satisfies ACTIVE + verified (D4). This is the "grey zone" in Epic §7 resolved
  toward the engine via a **condition**, with app-supplied context as the documented fallback.
- `engaged` and `consented` are plain relationship tuples on `case`; deleting the `consented`
  tuple flips the decision ALLOW→DENY with no model change (D5) — the revocation demo.

> **Note on `scoped_to`.** For this slice the north-star contrast (C101 vs C202) turns on
> *engagement*, so `role_therapist.scoped_to` + `case.institution` are modelled (Epic §3 scoping)
> but the deciding delta is the engagement/consent relationship. A later increment can tighten
> `case_access` to also require `institution` alignment between the role's scope and the case; it
> is left as a documented extension so this slice stays minimal (Q2).

---

## 5. Seed tuples (Q3) — given facts

Seeded by a future `seed-local-clinical` (D3) — the registration/credentialing steps 1–9 are
*given*, not performed. One therapist, two cases: **C101 engaged + consented**, **C202 neither**.

| # | user | relation | object | condition context |
|---|---|---|---|---|
| T1 | `institution:inst_a#member` | — | (membership) `user:thera_t1 member institution:inst_a` | — |
| T2 | `institution:inst_a` | `scoped_to` | `role_therapist:rt_t1` | — |
| T3 | `user:thera_t1` | `holder` | `role_therapist:rt_t1` | `active_verified{is_active:true, credential_verified:true}` |
| T4 | `institution:inst_a` | `institution` | `case:C101` | — |
| T5 | `institution:inst_a` | `institution` | `case:C202` | — |
| T6 | `role_therapist:rt_t1#holder` | `engaged` | `case:C101` | — |
| T7 | `role_therapist:rt_t1#holder` | `consented` | `case:C101` | — |
| T8 | `case:C101` | `parent` | `observation:obs_C101_1` | — |
| T9 | `case:C202` | `parent` | `observation:obs_C202_1` | — |

Written as OpenFGA tuples:

```jsonc
// therapist rt_t1, scoped to institution inst_a, held by thera_t1 (ACTIVE+verified)
{ "user": "institution:inst_a",            "relation": "scoped_to", "object": "role_therapist:rt_t1" }
{ "user": "user:thera_t1",                 "relation": "holder",    "object": "role_therapist:rt_t1",
  "condition": { "name": "active_verified", "context": { "is_active": true, "credential_verified": true } } }

// two cases under the same institution
{ "user": "institution:inst_a", "relation": "institution", "object": "case:C101" }
{ "user": "institution:inst_a", "relation": "institution", "object": "case:C202" }

// engagement + consent ONLY on C101 (none on C202 — that is the whole contrast)
{ "user": "role_therapist:rt_t1#holder", "relation": "engaged",   "object": "case:C101" }
{ "user": "role_therapist:rt_t1#holder", "relation": "consented", "object": "case:C101" }

// observations hang off their case
{ "user": "case:C101", "relation": "parent", "object": "observation:obs_C101_1" }
{ "user": "case:C202", "relation": "parent", "object": "observation:obs_C202_1" }
```

> **State as condition on the stored tuple vs context at check time (D4).** T3 pins
> `active_verified` context on the stored tuple, so the role is live only while that holds — a
> clean "role is ACTIVE and verified" fact. The **documented fallback** (Epic §7 grey zone) is to
> store the edge unconditioned and pass `{is_active, credential_verified}` as **contextual** input
> on each `check` — same model, app supplies the state. The slice picks the stored-condition form
> for the demo because it keeps the state *in the engine*; the implementation unit may expose the
> contextual form for callers that compute state app-side.

---

## 6. North-star checks + the revoke sequence (Q5/Q8)

The two checks that are the acceptance of the slice (D8). Object = the observation on each case;
the therapist and their role are identical — only the case relationship differs.

```bash
# ALLOW — thera_t1 is engaged + consented on C101
check user=user:thera_t1 relation=read object=observation:obs_C101_1
#   context: { is_active: true, credential_verified: true }   # if contextual fallback
# => { "allowed": true }

# DENY — same therapist, same role, but NO engagement/consent on C202
check user=user:thera_t1 relation=read object=observation:obs_C202_1
# => { "allowed": false }
```

**ALLOW → revoke → DENY (D5, consent revocation):**

```text
1. check read observation:obs_C101_1  => ALLOW        (engaged ∧ consented)
2. delete tuple { role_therapist:rt_t1#holder, consented, case:C101 }
3. check read observation:obs_C101_1  => DENY         (engaged ∧ ¬consented)
```

Step 2 is a single tuple delete — no model change — demonstrating that consent is a live
relationship whose withdrawal immediately removes access (Epic §4). Re-writing the `consented`
tuple restores ALLOW.

---

## 7. `verify:model`-style cases

Mapping to Epic 1's suite structure in
[`scripts/verify-model.ts`](../../console/scripts/verify-model.ts) (`CASES[]` →
`expect[{user, permission, allow}]`), extended for ReBAC: cases need `object` ids and a
`context`, because the decision is per-object and condition-gated. The implementation unit adds a
`scripts/verify-model-clinical.ts` (and a `pnpm verify:model:clinical`) shaped like this:

```ts
interface ClinicalCase {
  tenant: string;                 // "Client C — Healthcare (therapy services)"
  // seeded facts (the given steps 1–9) as tuples, incl. conditioned holder edge
  tuples: Tuple[];
  // each expectation names a concrete object + optional contextual state
  expect: Array<{
    user: string;                 // user:thera_t1
    relation: 'read';
    object: string;               // observation:obs_C101_1 | observation:obs_C202_1
    context?: { is_active: boolean; credential_verified: boolean };
    allow: boolean;
  }>;
}

const CASES: ClinicalCase[] = [{
  tenant: 'Client C — Healthcare (therapy services)',
  tuples: SEED_CLINICAL,          // T1..T9 from §5
  expect: [
    // north-star contrast (D8)
    { user: 'user:thera_t1', relation: 'read', object: 'observation:obs_C101_1', allow: true  },
    { user: 'user:thera_t1', relation: 'read', object: 'observation:obs_C202_1', allow: false },
    // state gate (D4): same engaged case, role NOT active/verified => DENY
    { user: 'user:thera_t1', relation: 'read', object: 'observation:obs_C101_1',
      context: { is_active: false, credential_verified: true },  allow: false },
    { user: 'user:thera_t1', relation: 'read', object: 'observation:obs_C101_1',
      context: { is_active: true,  credential_verified: false }, allow: false },
  ],
}];
```

> **The offline evaluator cannot do this (flagged — see §11).** Epic 1's `verify-model.ts` is a
> bespoke **in-memory** evaluator that only understands `assignee`-through-`role_*`; it models no
> conditions, no `and`, no object graph. The ReBAC slice's logic (conditions, `engaged and
> consented`, object-level) **must be proven against a running OpenFGA server** via real `check`
> calls — exactly the live path ADR-11 added to `seed-core.ts`
> ([`printSampleChecks`](../../console/scripts/seed-core.ts)). So `verify:model:clinical` is a
> **live** check runner, not an offline re-implementation; the structure above mirrors Epic 1's
> *case table* for readability, but it drives the engine.

---

## 8. Engine vs application scope line (§7, this slice)

Restating Epic §7 for **this slice only** — what the OpenFGA engine owns vs what stays app-layer:

| Concern (this slice) | Where it lives |
|---|---|
| Scoped role · role-ACTIVE + credential-verified (via condition) | **OpenFGA** — condition `active_verified` (D4) |
| Engagement with a specific case (`case:C101`) | **OpenFGA** — `engaged` relation, object-level (D12) |
| Consent/authority + revocation | **OpenFGA** — `consented` relation; delete = revoke (D5) |
| The ALLOW/DENY decision on `observation.read` | **OpenFGA** — `case_access from parent` |
| Registration/credentialing workflow (steps 1–9) | **App** — seeded as given facts, not built (D3) |
| **Minimum-permitted-data** shaping on ALLOW | **App obligation** — documented, not built (D6) |
| Obligations, reason strings, audit log | **App / PDP layer** — out of this slice |
| Authn / login / session | **App** (PocketBase-style) — not the engine |

The engine returns **ALLOW/DENY only**. Minimisation (Epic §5 "minimum permitted data") is
stated here as an **application-layer obligation** the PEP/ADB applies after an ALLOW — explicitly
**documented, not built** (D6).

---

## 9. Deferred / documented-not-built

Capabilities acknowledged by the requirements but **out of this slice** (listed so the slice does
not over-claim, Epic §7):

- **Service principals** (`service:<id>`) — the `type user` subject is uniform, so a service
  principal is a later increment that adds a subject type and reuses every relation unchanged
  (D10, Epic §2). *Documented as a capability; not built.*
- **Registration / credential-verification workflow** (steps 1–9) — seeded as given tuples via
  `seed-local-clinical`; the workflow itself is app territory and not in scope (D3).
- **Minimum-permitted-data / field-row minimisation** — an app-layer obligation after ALLOW; the
  engine never shapes data (D6, Epic §5).
- **Client simulator** (the clinical app that would drive this interactively) — a separate backlog
  unit; this slice proves the decision via direct `check` + the verify runner, not a UI (D9, Q9).
- **Obligations / reason strings / audit** — part of the richer PDP output in Epic §5; out of the
  engine slice.
- **Institution-scope tightening** of `case_access` — modelled (`scoped_to`, `case.institution`)
  but not yet required by the deciding contrast; a documented extension (§4 note).

---

## 10. Acceptance criteria + proving command

The slice is **accepted** when, against a running `client-c` store seeded with §5:

1. `check(user:thera_t1, read, observation:obs_C101_1)` → **ALLOW**.
2. `check(user:thera_t1, read, observation:obs_C202_1)` → **DENY** — same therapist, same role.
3. ALLOW → delete `consented` on `case:C101` → `check(... obs_C101_1)` → **DENY**; re-write →
   **ALLOW** again.
4. State gate: with `is_active:false` *or* `credential_verified:false`, `check(... obs_C101_1)` →
   **DENY**.
5. The Epic-1 tenant-wide suite still passes unchanged (no regression):
   `pnpm verify:model` → 11/11.

**Proving command (when implemented):**

```bash
# bring the stack up and seed the clinical tenant
just start-local
just seed-local-clinical        # NEW recipe (impl unit) — seeds the client-c store + §5 tuples

# prove the slice against the running engine (live checks, not offline)
cd console && pnpm verify:model:clinical   # NEW — asserts the §7 case table
# and the Epic-1 regression guard:
cd console && pnpm verify:model            # EXISTING — must stay 11/11
```

> `just`/`pnpm verify:model:clinical` and `seed-local-clinical` are **named here, not created**
> (this is the design doc). The implementation unit adds the recipe, the seed, and the live verify
> runner, mirroring Epic 1's `seed-core.ts` + `verify-model.ts`.

---

## 11. Gaps flagged — where Epic-1 code differs from requirements

Surfaced firsthand while reading the real codebase; **flagged, not papered over** (and none fixed
here — this is a design doc):

1. **The offline `verify:model` evaluator cannot validate ReBAC.**
   [`scripts/verify-model.ts`](../../console/scripts/verify-model.ts) is a bespoke in-memory
   evaluator hard-coded to the Epic-1 shape (`assignee` through `role_*`). It models **no
   conditions, no `and`/intersection, no object graph** — so it structurally cannot prove this
   slice. The slice's verification therefore **must** be live `check` calls (as ADR-11's
   `printSampleChecks` already does). *Impact:* the implementation unit needs a **live** verify
   runner, not an extension of the offline one. This matches the ADR-11 process lesson ("the
   offline verifier … does not call the real write/check API").

2. **Epic-1 model binds roles to `resource:_tenant` only (ADR-11); object-level is unexercised.**
   `buildRbacModel` + `tenantWideRoleBindings` only ever write `resource:_tenant`. ADR-1 promises
   object-level "with no migration", and that is *true for the type shape*, but **no code path,
   seed, or check exercises a concrete `resource:<id>` today** — it is a design promise, not a
   tested path. This slice is the first to actually model object-level (`case:<id>`,
   `observation:<id>`), so it is also the first real test of ADR-1's claim. *Flag:* treat ADR-1's
   "no migration" as validated only once this slice runs green against a live engine.

3. **Requirements want richer-than-boolean decisions; Epic-1 `checkPermission` returns `boolean`.**
   [`checkPermission`](../../console/src/lib/server/openfga.ts) returns `Boolean(res.allowed)`.
   Epic §5 wants **ALLOW/DENY + obligations + reason**. That is deliberately an **app/PDP** concern
   (D6, §8) and the engine will always return allow/deny — so this is a *scope boundary to honor*,
   not an engine change, but it is worth stating that the current return type is boolean-only by
   design and the obligation/reason enrichment is unbuilt.

No source was changed to record these — they are observations for the owner's decision.

---

<!-- Canonical self-path: docs/design/design-advanced-rbac-rebac-slice.md
     (repo: personal/rbac-platform; GitHub: vteial) -->
> **Doc:** `docs/design/design-advanced-rbac-rebac-slice.md` · **Status:** design — drafting
> (brainstorm artifact, no code) · **Last verified:** 2026-10-03 (requirements traced to
> `epic-advanced-rbac.md`; model extends Epic-1 `model-builder.ts` + ADR-1/ADR-11; no code,
> no store, nothing merged).
