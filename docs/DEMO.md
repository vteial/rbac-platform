# Client Demo Walkthrough

Goal: convince the client that this one self-hosted service can onboard any
organization with **their own** role vocabulary and answer permission checks
over an API.

## 0. Start the platform

```bash
cp .env.example .env
docker compose up -d postgres openfga pocketbase
```

Wait until healthy (`docker compose ps`).

## 1. Create the console admin (one-time)

1. Open the PocketBase admin UI: **http://localhost:8090/_/**
2. Create the first **superuser** (this is the PB admin, not a console user).
3. In PocketBase, open the **`users`** collection → **New record** → set an email +
   password. This is your **console login**.

## 2. Seed the demo tenants

```bash
cd console
npm install
npm run seed
```

This creates:

| Tenant | Roles | Sample users |
|---|---|---|
| **Client A** | `parent` (read, write, manage_children), `child` (read) | anita→parent, bala→child |
| **Client B** | `dev` (read, write), `qa` (read, test), `platform_engineer` (read, write, test, deploy) | chandra→dev, divya→qa, esha→platform_engineer |

The seed also prints sample checks so you can see it working before touching the UI.

## 3. Run the console

```bash
npm run dev      # http://localhost:5173
```

Log in with the console user you created in step 1.

## 4. The demo script (what to show the client)

1. **Tenants page** — point out two tenants, *Client A* and *Client B*, on one platform.
2. **Open Client A** → show roles are **Parent / Child**.
3. **Open Client B** → show roles are **Dev / QA / Platform Engineer** — *completely
   different vocabulary, same platform, fully isolated*. This is the headline.
4. **Test a check** (Client B):
   - `esha` + `deploy` → ✅ ALLOWED (platform engineer can deploy)
   - `chandra` + `deploy` → ⛔ DENIED (dev cannot deploy)
   - `divya` + `test` → ✅ ALLOWED (qa can test)
5. **Add a role live** — create `viewer` with `read` on Client B, assign a user,
   check it. Shows self-service onboarding of arbitrary roles.
6. **Show the API** — see [CLIENT_INTEGRATION.md](./CLIENT_INTEGRATION.md): the same
   check the console runs is a plain HTTP call the client's own system makes.

## 5. Talking points

- **Self-hosted, minimal ops**: Postgres + one Go binary (OpenFGA) + one Go binary
  (PocketBase) + the console. No cloud dependency.
- **Onboard any client**: each tenant is an isolated OpenFGA store with its own model.
- **Consumed as an API**: clients call `/stores/{id}/check` directly (mode a) or via
  an OpenFGA SDK (mode b).
- **Grows to object-level**: classic RBAC now; per-resource permissions later with no
  migration (same model shape).
