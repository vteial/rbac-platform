/**
 * Server-side OpenFGA integration.
 *
 * Tenancy model: one OpenFGA *store* per tenant (client organization).
 * Each tenant has its own authorization model (its custom role vocabulary),
 * so Client A can use `parent`/`child` while Client B uses
 * `dev`/`qa`/`platform_engineer` on the same platform.
 *
 * This file is server-only. Do not import it from client code.
 */
import { OpenFgaClient, type TupleKey } from '@openfga/sdk';
import { config } from './config';
import {
	buildRbacModel,
	tenantWideRoleBindings,
	TENANT_WIDE_RESOURCE_ID,
	type RoleDefinition
} from './model-builder';

/** A base client with no store bound — used for store list/create. */
function baseClient(): OpenFgaClient {
	return new OpenFgaClient({
		apiUrl: config.openfga.apiUrl,
		...(config.openfga.apiToken
			? {
					credentials: {
						method: 'api_token' as never,
						config: { token: config.openfga.apiToken } as never
					}
				}
			: {})
	});
}

/** A client bound to a specific tenant's store. */
function storeClient(storeId: string): OpenFgaClient {
	return new OpenFgaClient({
		apiUrl: config.openfga.apiUrl,
		storeId,
		...(config.openfga.apiToken
			? {
					credentials: {
						method: 'api_token' as never,
						config: { token: config.openfga.apiToken } as never
					}
				}
			: {})
	});
}

export interface Tenant {
	id: string; // OpenFGA store id
	name: string;
	createdAt?: string;
}

/** List all tenants (= OpenFGA stores). */
export async function listTenants(): Promise<Tenant[]> {
	const client = baseClient();
	const stores: Tenant[] = [];
	let continuationToken: string | undefined;
	do {
		const res = await client.listStores(
			continuationToken ? { continuationToken } : {}
		);
		for (const s of res.stores ?? []) {
			stores.push({ id: s.id!, name: s.name!, createdAt: s.created_at as unknown as string });
		}
		continuationToken = res.continuation_token || undefined;
	} while (continuationToken);
	return stores;
}

/** Create a new tenant (store). Returns the new store id. */
export async function createTenant(name: string): Promise<Tenant> {
	const client = baseClient();
	const res = await client.createStore({ name });
	return { id: res.id!, name: res.name!, createdAt: res.created_at as unknown as string };
}

/** Delete a tenant (store) and all its data. */
export async function deleteTenant(storeId: string): Promise<void> {
	await storeClient(storeId).deleteStore();
}

/**
 * Publish a tenant's role vocabulary as a new authorization model.
 * Returns the new authorization model id.
 */
export async function publishRoleModel(
	storeId: string,
	roles: RoleDefinition[]
): Promise<string> {
	const client = storeClient(storeId);
	const model = buildRbacModel(roles);
	const res = await client.writeAuthorizationModel(model);
	const modelId = res.authorization_model_id!;

	// Bind each role to the tenant-wide resource `resource:_tenant` so a classic
	// "does user have permission" check works without per-object setup.
	// Writes are idempotent-ish: ignore "already exists" style errors.
	const bindings = tenantWideRoleBindings(roles);
	if (bindings.length > 0) {
		try {
			await client.write(
				{ writes: bindings },
				{ authorizationModelId: modelId }
			);
		} catch (err) {
			// A binding may already exist from a previous publish; that's fine.
			const msg = err instanceof Error ? err.message : String(err);
			if (!/already exists|duplicate/i.test(msg)) throw err;
		}
	}

	return modelId;
}

/** Return the latest authorization model for a tenant, if any. */
export async function getLatestModelId(storeId: string): Promise<string | undefined> {
	const client = storeClient(storeId);
	const res = await client.readAuthorizationModels({ pageSize: 1 });
	return res.authorization_models?.[0]?.id;
}

/**
 * Assign (or unassign) a role to a user within a tenant.
 * In RBAC terms: user  --assignee-->  role:<roleName>
 */
export async function assignRole(
	storeId: string,
	userId: string,
	roleName: string
): Promise<void> {
	const client = storeClient(storeId);
	await client.write({
		writes: [
			{
				user: `user:${userId}`,
				relation: 'assignee',
				object: `role:${roleName}`
			}
		]
	});
}

export async function unassignRole(
	storeId: string,
	userId: string,
	roleName: string
): Promise<void> {
	const client = storeClient(storeId);
	await client.write({
		deletes: [
			{
				user: `user:${userId}`,
				relation: 'assignee',
				object: `role:${roleName}`
			}
		]
	});
}

/** List (userId, roleName) assignments in a tenant. */
export async function listAssignments(
	storeId: string
): Promise<Array<{ userId: string; roleName: string }>> {
	const client = storeClient(storeId);
	const res = await client.read({ relation: 'assignee' });
	return (res.tuples ?? [])
		.map((t) => t.key as TupleKey)
		.filter((k) => k?.user?.startsWith('user:') && k?.object?.startsWith('role:'))
		.map((k) => ({
			userId: k.user.slice('user:'.length),
			roleName: k.object.slice('role:'.length)
		}));
}

/**
 * The core runtime question a client asks:
 *   "Can user <userId> perform <permission> on <resourceType>[:<resourceId>]?"
 *
 * For classic RBAC we check against the tenant-wide resource instance
 * `<resourceType>:_tenant`. When object-level permissions are later
 * introduced, callers pass a concrete resourceId.
 */
export async function checkPermission(
	storeId: string,
	params: {
		userId: string;
		permission: string;
		resourceType: string;
		resourceId?: string;
	}
): Promise<boolean> {
	const client = storeClient(storeId);
	const object = `${params.resourceType}:${params.resourceId ?? TENANT_WIDE_RESOURCE_ID}`;
	const res = await client.check({
		user: `user:${params.userId}`,
		relation: params.permission,
		object
	});
	return Boolean(res.allowed);
}
