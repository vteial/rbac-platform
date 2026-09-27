# Client Integration — Consuming the RBAC API

Each client organization is an OpenFGA **store**. Once you onboard them in the
console you give them:

- the **OpenFGA API URL** (e.g. `https://rbac.yourco.com`)
- their **store ID** (the tenant id shown in the console)
- an **API token** (if you enabled `preshared` auth) — see below
- their **authorization model ID** (optional; latest is used if omitted)

The one call their system makes at runtime is **Check**:
> "Can `user:<id>` do `<permission>` on `resource:<id>`?"

---

## Mode (a) — Direct HTTP (no SDK, any language)

```bash
curl -X POST "$OPENFGA_API_URL/stores/$STORE_ID/check" \
  -H "Authorization: Bearer $OPENFGA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tuple_key": {
      "user": "user:esha",
      "relation": "deploy",
      "object": "resource:*"
    }
  }'
# => { "allowed": true }
```

`resource:*` = the tenant-wide (classic RBAC) resource. For object-level checks
later, replace `*` with a concrete id, e.g. `resource:project-42`.

Authentication:
- If you run OpenFGA with `OPENFGA_AUTHN_METHOD=none` (local demo), omit the
  `Authorization` header.
- For anything exposed, set `OPENFGA_AUTHN_METHOD=preshared` and a key list; the
  client sends one of those keys as the bearer token. (Front it with TLS.)

---

## Mode (b) — OpenFGA SDK in the client's stack

OpenFGA ships official SDKs for **Go, Node.js/JS, Python, Java, .NET**.

**Node.js example:**
```ts
import { OpenFgaClient } from '@openfga/sdk';

const fga = new OpenFgaClient({
  apiUrl: process.env.OPENFGA_API_URL,
  storeId: process.env.STORE_ID,
  credentials: {
    method: 'api_token',
    config: { token: process.env.OPENFGA_API_TOKEN }
  }
});

const { allowed } = await fga.check({
  user: 'user:esha',
  relation: 'deploy',
  object: 'resource:*'
});
```

**Python example:**
```python
from openfga_sdk import OpenFgaClient, ClientConfiguration
from openfga_sdk.client.models import ClientCheckRequest

config = ClientConfiguration(
    api_url=os.environ["OPENFGA_API_URL"],
    store_id=os.environ["STORE_ID"],
)
async with OpenFgaClient(config) as fga:
    resp = await fga.check(ClientCheckRequest(
        user="user:esha", relation="deploy", object="resource:*",
    ))
    print(resp.allowed)
```

---

## Recommended production shape

Rather than exposing OpenFGA directly to every client, you can front it with a
**thin gateway** (e.g. an endpoint on this platform) that:
- maps an API key → the correct store id (so clients never see raw store ids),
- adds rate limiting / audit logging,
- keeps the OpenFGA token server-side.

For the demo and small deployments, direct access (mode a/b) is perfectly fine.

---

## How a permission maps to the model

- A user is granted a role: `user:<id>  assignee  role:<roleName>`
- A role grants permissions on the tenant-wide resource: the console binds
  `role:<roleName>  role_<roleName>  resource:*`
- A permission relation on `resource` is defined as "assignee from any granting
  role", so `check(user, permission, resource:*)` returns `true` iff the user
  holds a role that grants that permission.

This is generated for you by the console's role editor — clients never write the
OpenFGA DSL themselves.
