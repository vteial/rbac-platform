/**
 * Shared seeding core used by both entry points:
 *   - seed-local.ts       → a CLEAN state (minimal master data, driven by hand)
 *   - seed-local-demo.ts  → a DEMO state (the pre-baked Client A / Client B showcase)
 *
 * The seed always talks to OpenFGA over the HOST-facing URL. When run from the
 * host (not inside a container), OPENFGA_API_URL must point at localhost — the
 * compose-internal hostname `openfga:8080` is not resolvable from the host.
 * The `just` recipes export this for you; the default below is the host value.
 */
import { OpenFgaClient } from '@openfga/sdk';
import {
	buildRbacModel,
	tenantWideRoleBindings,
	TENANT_WIDE_RESOURCE_ID,
	type RoleDefinition
} from '../src/lib/server/model-builder';
import { setRoles } from '../src/lib/server/role-store';

const API_URL = process.env.OPENFGA_API_URL ?? 'http://localhost:8080';
const API_TOKEN = process.env.OPENFGA_API_TOKEN ?? '';

export const TENANT_RESOURCE = `resource:${TENANT_WIDE_RESOURCE_ID}`;

function creds() {
	return API_TOKEN
		? { credentials: { method: 'api_token' as never, config: { token: API_TOKEN } as never } }
		: {};
}

function base(): OpenFgaClient {
	return new OpenFgaClient({ apiUrl: API_URL, ...creds() });
}
function store(storeId: string): OpenFgaClient {
	return new OpenFgaClient({ apiUrl: API_URL, storeId, ...creds() });
}

export interface TenantSeed {
	name: string;
	roles: RoleDefinition[];
	/** Optional user→role assignments (a clean seed may have none). */
	assignments?: Array<{ user: string; role: string }>;
}

/** Create a store by name, or reuse an existing one with the same name. */
async function upsertStore(name: string): Promise<string> {
	const b = base();
	const existing = await b.listStores({});
	const found = (existing.stores ?? []).find((s) => s.name === name);
	if (found?.id) {
		console.log(`  · reusing existing store "${name}" (${found.id})`);
		return found.id;
	}
	const created = await b.createStore({ name });
	console.log(`  · created store "${name}" (${created.id})`);
	return created.id!;
}

/** Ignore OpenFGA "already exists / duplicate" write errors (idempotent re-runs). */
function ignoreDuplicate(err: unknown) {
	const msg = err instanceof Error ? err.message : String(err);
	if (!/already exists|duplicate/i.test(msg)) throw err;
}

/** Seed one tenant: store + model + role metadata + bindings + (optional) users. */
export async function seedTenant(s: TenantSeed): Promise<string> {
	console.log(`\n▶ ${s.name}`);
	const storeId = await upsertStore(s.name);
	const client = store(storeId);

	// Publish the authorization model for this tenant's role vocabulary.
	const model = buildRbacModel(s.roles);
	const modelRes = await client.writeAuthorizationModel(model);
	const modelId = modelRes.authorization_model_id!;
	console.log(`  · published model ${modelId}`);

	// Persist role-definition metadata so the console UI displays it.
	await setRoles(storeId, s.roles);

	// Bind each role to the tenant-wide resource `resource:_tenant`.
	const bindings = tenantWideRoleBindings(s.roles);
	try {
		await client.write({ writes: bindings }, { authorizationModelId: modelId });
	} catch (err) {
		ignoreDuplicate(err);
	}
	console.log(`  · bound ${bindings.length} roles to ${TENANT_RESOURCE}`);

	// Assign sample users to roles (demo state); clean state may skip this.
	const assignments = s.assignments ?? [];
	if (assignments.length > 0) {
		const writes = assignments.map((a) => ({
			user: `user:${a.user}`,
			relation: 'assignee',
			object: `role:${a.role}`
		}));
		try {
			await client.write({ writes }, { authorizationModelId: modelId });
		} catch (err) {
			ignoreDuplicate(err);
		}
		console.log(`  · assigned ${writes.length} users`);
	}

	return modelId;
}

/** Print a few allow/deny checks so a run visibly proves itself. */
export async function printSampleChecks(
	storeId: string,
	modelId: string,
	roles: RoleDefinition[],
	assignments: Array<{ user: string; role: string }>
): Promise<void> {
	const client = store(storeId);
	const allPerms = Array.from(new Set(roles.flatMap((r) => r.permissions)));
	console.log('  · sample checks:');
	for (const a of assignments) {
		const role = roles.find((r) => r.name === a.role)!;
		const has = role.permissions[0];
		const missing = allPerms.find((p) => !role.permissions.includes(p));
		for (const perm of [has, missing].filter(Boolean) as string[]) {
			const res = await client.check(
				{ user: `user:${a.user}`, relation: perm, object: TENANT_RESOURCE },
				{ authorizationModelId: modelId }
			);
			console.log(
				`      ${res.allowed ? '✅' : '⛔'} user:${a.user} can "${perm}" on ${TENANT_RESOURCE}`
			);
		}
	}
}

/** Resolve the store id for a tenant name (used to print checks after seeding). */
export async function storeIdByName(name: string): Promise<string> {
	const res = await base().listStores({});
	const found = (res.stores ?? []).find((s) => s.name === name);
	if (!found?.id) throw new Error(`store "${name}" not found`);
	return found.id;
}

export function banner(kind: string): void {
	console.log(`Seeding ${kind} against ${API_URL} …`);
}
