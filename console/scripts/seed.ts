/**
 * Demo seed: creates two tenants with completely different role vocabularies,
 * publishes each tenant's model, assigns sample users, and prints a few
 * checks so the demo works out of the box.
 *
 *   Client A  → roles: parent, child
 *   Client B  → roles: dev, qa, platform_engineer
 *
 * Run with:  npm run seed
 * Requires OpenFGA reachable at OPENFGA_API_URL (default http://localhost:8080).
 */
import { OpenFgaClient } from '@openfga/sdk';
import {
	buildRbacModel,
	tenantWideRoleBindings,
	TENANT_WIDE_RESOURCE_ID,
	type RoleDefinition
} from '../src/lib/server/model-builder';

const TENANT_RESOURCE = `resource:${TENANT_WIDE_RESOURCE_ID}`;

const API_URL = process.env.OPENFGA_API_URL ?? 'http://localhost:8080';
const API_TOKEN = process.env.OPENFGA_API_TOKEN ?? '';

// Note: the seed writes role-definition metadata to the same JSON file the
// console reads, so the seeded roles show up in the UI.
import { setRoles } from '../src/lib/server/role-store';

function base(): OpenFgaClient {
	return new OpenFgaClient({
		apiUrl: API_URL,
		...(API_TOKEN
			? { credentials: { method: 'api_token' as never, config: { token: API_TOKEN } as never } }
			: {})
	});
}
function store(storeId: string): OpenFgaClient {
	return new OpenFgaClient({
		apiUrl: API_URL,
		storeId,
		...(API_TOKEN
			? { credentials: { method: 'api_token' as never, config: { token: API_TOKEN } as never } }
			: {})
	});
}

interface Seed {
	name: string;
	roles: RoleDefinition[];
	assignments: Array<{ user: string; role: string }>;
}

const SEEDS: Seed[] = [
	{
		name: 'Client A',
		roles: [
			{ name: 'parent', label: 'Parent', permissions: ['read', 'write', 'manage_children'] },
			{ name: 'child', label: 'Child', permissions: ['read'] }
		],
		assignments: [
			{ user: 'anita', role: 'parent' },
			{ user: 'bala', role: 'child' }
		]
	},
	{
		name: 'Client B',
		roles: [
			{ name: 'dev', label: 'Developer', permissions: ['read', 'write'] },
			{ name: 'qa', label: 'QA', permissions: ['read', 'test'] },
			{
				name: 'platform_engineer',
				label: 'Platform Engineer',
				permissions: ['read', 'write', 'test', 'deploy']
			}
		],
		assignments: [
			{ user: 'chandra', role: 'dev' },
			{ user: 'divya', role: 'qa' },
			{ user: 'esha', role: 'platform_engineer' }
		]
	}
];

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

async function seedTenant(s: Seed) {
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
		const msg = err instanceof Error ? err.message : String(err);
		if (!/already exists|duplicate/i.test(msg)) throw err;
	}
	console.log(`  · bound ${bindings.length} roles to ${TENANT_RESOURCE}`);

	// Assign sample users to roles.
	const writes = s.assignments.map((a) => ({
		user: `user:${a.user}`,
		relation: 'assignee',
		object: `role:${a.role}`
	}));
	try {
		await client.write({ writes }, { authorizationModelId: modelId });
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (!/already exists|duplicate/i.test(msg)) throw err;
	}
	console.log(`  · assigned ${writes.length} users`);

	// Demonstrate a few checks.
	const samples: Array<[string, string, boolean]> = [];
	for (const a of s.assignments) {
		const role = s.roles.find((r) => r.name === a.role)!;
		// A permission the role has, and one it (likely) doesn't.
		const has = role.permissions[0];
		const allPerms = Array.from(new Set(s.roles.flatMap((r) => r.permissions)));
		const missing = allPerms.find((p) => !role.permissions.includes(p));
		for (const perm of [has, missing].filter(Boolean) as string[]) {
			const res = await client.check(
				{ user: `user:${a.user}`, relation: perm, object: TENANT_RESOURCE },
				{ authorizationModelId: modelId }
			);
			samples.push([`${a.user}`, perm, Boolean(res.allowed)]);
		}
	}
	console.log('  · sample checks:');
	for (const [user, perm, allowed] of samples) {
		console.log(`      ${allowed ? '✅' : '⛔'} user:${user} can "${perm}" on ${TENANT_RESOURCE}`);
	}
}

async function main() {
	console.log(`Seeding demo tenants against ${API_URL} …`);
	for (const s of SEEDS) await seedTenant(s);
	console.log('\n✔ Seed complete. Open the console to explore.');
}

main().catch((err) => {
	console.error('\n✖ Seed failed:', err instanceof Error ? err.message : err);
	process.exit(1);
});
