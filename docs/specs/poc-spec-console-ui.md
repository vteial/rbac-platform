# POC Spec — Console minimum UI standard

> The **lightweight contract** for one POC unit of work. Sections seed a standard Spec.
> **Keep it short.** POC speed.

| Field | Value |
| :--- | :--- |
| **Feature** | Console minimum UI standard (tokens · theming · layout · landing) |
| **POC** | rbac-platform |
| **Status** | draft |

---

## Goal  → seeds `requirements.md`
Bring the SvelteKit console up to a **minimum UI standard** — enough polish and structure
to be credible and maintainable — without a product-grade redesign (that stays deferred).
Five things: (1) a proper **design-token system**, (2) **light/dark/auto theming**,
(3) consistent **content-width layout** + **responsive**, (4) a **landing page** with a
hero + get-started CTA, (5) green-accent visual direction for the dark theme.

## Acceptance (how we'll know it works)  → seeds the EARS Definition of Done
- [ ] **Tokens:** `app.css` uses a layered system — *primitive* tokens (raw scales) + *semantic* tokens (intent). Components reference **semantic tokens only** (no raw hex in components).
- [ ] **Theming:** light, dark, and **auto** (follows OS) all render correctly; default = **auto**. A **3-way segmented switch** (auto/light/dark) in the header persists the choice (localStorage) and applies it **before first paint** (no flash of wrong theme).
- [ ] **Green accent:** the dark theme's primary accent is green; light theme uses an accessible green that meets WCAG AA contrast on light surfaces.
- [ ] **Layout:** header, main, and footer content all align to one shared **content-width** column; no more full-width header/footer vs centered body mismatch.
- [ ] **Responsive:** usable down to ~360px — form rows stack, tables don't break layout (scroll or reflow), header stays legible.
- [ ] **Landing:** unauthenticated `/` shows a hero (what this is, the two-clients story in a line) + **Get started → sign in** CTA; authenticated users are sent to the tenants dashboard.
- [ ] `pnpm check` 0 errors; existing flows (create tenant, roles, assign, check, login/logout) still work.

## Approach  → seeds `design.md`
- **Tokens (hand-rolled CSS, no framework):**
  - *Primitives:* color scales (incl. a green ramp), spacing scale, radii, font sizes, shadows.
  - *Semantic:* `--color-bg`, `--color-surface`, `--color-surface-2`, `--color-text`, `--color-muted`, `--color-accent`, `--color-accent-contrast`, `--color-danger`, `--color-border`, etc. — defined **twice** (light + dark value sets).
- **Theming mechanism:**
  - Default via `@media (prefers-color-scheme)` → the *auto* behavior.
  - Explicit override via `:root[data-theme="light"|"dark"]` beating the media query.
  - **No-FOUC:** a tiny inline script in `app.html` reads `localStorage.theme` and sets `data-theme` on `<html>` before CSS paints.
  - A small `theme` util + a `<ThemeSwitch>` component (segmented auto/light/dark) in the header.
- **Layout:** introduce `--content-max` and a `.container` wrapper used by header content, `main`, and footer so all three align. Replace scattered inline `style="margin..."` with utility classes / component styles where they block responsive.
- **Landing + routing:**
  - Move the tenants dashboard from `/` to **`/tenants`** (index route alongside existing `/tenants/[storeId]`).
  - `/` becomes the **public landing** (hero + CTA). Update `hooks.server.ts`: `/` is public; authenticated `/` → redirect to `/tenants`; unauthenticated protected routes still → `/login`.
  - Hero copy pulled from NARRATIVE §1/§4 so it stays consistent with the story.

## Steps  → seeds `tasks.md`
1. Rebuild `app.css`: primitive + semantic tokens (light+dark, green accent) + responsive layout + `.container`.
2. `app.html` no-FOUC inline script; `theme` util + `<ThemeSwitch>`; wire into header.
3. Landing route at `/`; move dashboard to `/tenants`; update the auth hook + any internal links.
4. Fix stale text (`npm run seed` → `just seed-local-demo`); de-inline styles where needed.
5. `pnpm check` + build; owner browser pass (all three themes + mobile width).

## Human verification (eyeball)  → seeds the §4b Human Verification Plan
- Toggle auto/light/dark → theme changes, persists across reload, no flash on load.
- Resize to phone width → forms stack, tables usable, header intact.
- Logged out → landing hero + Get started; click → login; log in → tenants dashboard.
- Run the demo flow (create/roles/assign/check) → still works, looks consistent.

## Out of scope (track 3 — deferred)
- Component library / framework (Tailwind, Skeleton, etc.).
- Full accessibility audit (we do the cheap wins: focus states, `aria-live` on results, not-color-only signals — but not a formal WCAG pass).
- Toasts/animations, empty-state illustrations, iconography beyond the essential.
- Delete-tenant, role-edit-prefill, object-level resource UI (functional gaps — separate unit).
- Component extraction/refactor of every page.
