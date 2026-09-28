# Mini-AIDLC — Minimum UI Standard (Proposal)

> **Status:** PROPOSAL — not yet part of the method. Captured from the `rbac-platform`
> console UI upgrade. Companion to [`PROPOSAL-improvements.md`](./PROPOSAL-improvements.md).
> The owner will fold the good parts into the method later.
>
> **Why this exists.** POCs with any UI face a recurring question: *"is this good
> enough?"* Too little and it's not credible in front of an audience; too much and
> you've sunk product-grade effort into something that may not graduate. This defines a
> **minimum UI standard** — a small, checkable bar that makes a POC UI credible and
> maintainable **without** a product-grade redesign. It draws the line explicitly so
> agents and owners don't over- or under-invest.

---

## Table of Contents
1. [The three UI tiers](#1-the-three-ui-tiers)
2. [The minimum standard (the bar)](#2-the-minimum-standard-the-bar)
3. [Reference implementation notes](#3-reference-implementation-notes)
4. [Checklist](#4-checklist)
5. [What NOT to do at POC (the deferred tier)](#5-what-not-to-do-at-poc-the-deferred-tier)
6. [Suggested scaffold additions](#6-suggested-scaffold-additions)

---

## 1. The three UI tiers

Mirrors the method's maturity ladder — formality scales with product maturity.

| Tier | When | UI investment |
| :--- | :--- | :--- |
| **T1 — Throwaway** | internal spike, no audience | none; unstyled is fine |
| **T2 — Minimum standard** *(this doc)* | POC shown to an audience / stakeholder | the bar below — credible + maintainable, no redesign |
| **T3 — Product-grade** | approved MVP+ | component library, full a11y audit, design system, animation, responsive-perfect |

**Pick T2 the moment a POC has an audience to convince.** Don't jump to T3 pre-graduation.

## 2. The minimum standard (the bar)

Five requirements. Each is cheap, high-leverage, and forward-compatible with T3.

**a. Layered design tokens.**
Two layers: *primitive* tokens (raw scales — color ramps, spacing, radii, type) and
*semantic* tokens (intent — `--color-bg`, `--color-surface`, `--color-text`,
`--color-accent`, `--color-border`, `--color-danger`). **Components reference semantic
tokens only** — never raw hex. This is the single most important item: it's what makes
theming, consistency, and later a design system possible without rework.

**b. Theming: light / dark / auto.**
Support all three, **default auto** (follow the OS via `prefers-color-scheme`). Explicit
choice overrides via a `data-theme` attribute and persists (localStorage). **Apply before
first paint** via a tiny inline script to avoid the flash of wrong theme (FOUC) — the
standard gotcha. A visible switch (segmented auto/light/dark reads clearest). Design each
theme's values deliberately — a light theme is *not* an inverted dark theme (accents often
need to darken for AA contrast on light surfaces).

**c. Consistent layout: header / body / footer at one content width.**
All three regions align to a shared max-width container. Avoid the common mismatch where
the body is centered but header/footer span full width.

**d. Responsive (usable, not pixel-perfect).**
Usable down to ~360px: form rows stack, tables scroll or reflow (don't break layout),
header stays legible. A couple of breakpoints — no responsive framework.

**e. A landing/entry page with context.**
Even an internal tool benefits from a one-screen "what is this + how do I start." A hero
(the one-line value prop, pulled from the NARRATIVE), and a single clear primary action
(e.g. *Get started → sign in*). Authenticated users skip straight to the app.

**Plus the cheap a11y wins** (not a full audit — that's T3): visible focus states,
`aria-live` on async result banners, and never signal state by **color alone** (pair with
an icon/text, e.g. ✅ ALLOWED / ⛔ DENIED).

**f. Demo-mode affordances (flag-gated, config-fed).**
A POC exists to be *shown*. Presenters shouldn't fumble credentials or hand-type sample
data on stage. So provide **demo affordances** — but as first-class, honest features, not
hacks:
- **Gated by an explicit flag** (e.g. `DEMO_MODE=true`) so they can **never ship to
  a real deployment by accident**. Off by default; on for local/POC. *(Framework gotcha:
  in SvelteKit, don't prefix the flag `PUBLIC_` if you read it server-side —
  `$env/dynamic/private` strips `PUBLIC_`-prefixed vars; that silently makes the flag
  always-undefined.)*
- **Fed by config, not hardcoded** — the demo values live in env (the same ones the
  seed/setup uses), so it's consistent and reusable across POCs.
- **Visibly labelled** as demo (a "demo mode" badge), so nobody mistakes it for production.
- **Fill, don't skip** — prefer a *"Fill demo credentials"* button (populates the fields,
  you still see the real action happen) over a one-click auto-submit that hides the flow.
  The intent is to *showcase* the functionality, not bypass it.

This generalizes beyond login: "reset demo data," "load sample payload," seed buttons —
all the same pattern (*flag-gated, config-fed, labelled*). It's the reusable **demo
culture**: conveniences that make a POC presentable without ever leaking into a real
environment.

## 3. Reference implementation notes

From the rbac-platform console (SvelteKit, hand-rolled CSS — no framework):
- Tokens in one `app.css`: primitives, then semantic sets defined **three times** — base
  (dark), `@media (prefers-color-scheme: light)`, and `:root[data-theme=light|dark]`
  explicit overrides.
- No-FOUC: inline `<script>` in `app.html` reads `localStorage.theme` → sets `data-theme`
  before CSS loads. A `theme.ts` util + a `ThemeSwitch.svelte` segmented control keep it
  in sync at runtime.
- Layout: a single `.container` (max-width + inline padding) used by header, main, footer.
- Responsive: one `max-width: 640px` breakpoint — fields go full-width, container padding
  shrinks. Tables wrapped in an `overflow-x` `.table-wrap`.
- Landing: public route at `/`; authenticated users redirect to the app dashboard; the
  auth hook treats `/` as public (exact match).
- Stack-agnostic: the *shape* (token layers, theme mechanism, container, landing) ports to
  any framework; only the syntax changes.

## 4. Checklist

- [ ] Semantic tokens exist; components use no raw color values.
- [ ] Light, dark, and auto all render correctly; default is auto.
- [ ] Theme choice persists and applies with no flash on load.
- [ ] Header/body/footer share one content width.
- [ ] Usable at ~360px (fields stack, tables don't break).
- [ ] Landing page with value-prop hero + one primary CTA.
- [ ] Focus states visible; result state not signalled by color alone.
- [ ] Demo affordances (if any) are flag-gated, config-fed, and labelled — can't ship to prod.
- [ ] Build + type-check clean; existing flows still work.

## 5. What NOT to do at POC (the deferred tier)

Explicitly out of the minimum standard — these are T3, post-graduation:
- Component library / CSS framework (Tailwind, Skeleton, MUI, …).
- Formal WCAG audit / screen-reader testing beyond the cheap wins above.
- Toasts, animations, skeleton loaders, empty-state illustrations, custom iconography.
- Pixel-perfect responsive across every breakpoint / device.
- Full component extraction & refactor of every view.

If a POC "needs" these to land, that's a signal it's graduating — do them in the MVP tier.

## 6. Suggested scaffold additions

If adopted into Mini-AIDLC:
- Add a short **`UI.md`** to the scaffold (or a `§ UI` in `KICKSTART.md`) stating: *if the
  POC has a UI with an audience, meet the Minimum UI Standard (T2); defer T3 until
  graduation.* Include the §4 checklist.
- Optionally ship a **starter `app.css` token skeleton** (primitives + semantic + the
  three theme blocks) and a `ThemeSwitch` reference, framework-noted as examples.
- Cross-reference from the NARRATIVE convention: the hero copy should reuse the NARRATIVE's
  one-liner so the entry page and the story stay consistent.

> Like the other proposals, everything here is a **forward-compatible subset**: the token
> layers, theme mechanism, and layout container all grow into their T3 forms without a
> rewrite. Adopt selectively.
