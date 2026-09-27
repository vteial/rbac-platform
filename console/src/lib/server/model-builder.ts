/**
 * Converts a friendly per-tenant role/permission definition into an OpenFGA
 * JSON authorization model (schema 1.1).
 *
 * This is the platform's value-add: onboarding staff describe roles + the
 * permissions each role grants, and this builder generates the underlying
 * OpenFGA model — no DSL knowledge required.
 *
 * ── Classic RBAC (what we need now) ──────────────────────────────────────
 * We model:
 *   type user
 *   type role
 *     relations
 *       define assignee: [user]
 *   type resource
 *     relations
 *       define <permission>: assignee from <grantingRole>, ...
 *
 * A user gets a permission on a resource if they are the `assignee` of a role
 * that grants that permission. Roles are checked against `resource:*` for the
 * tenant-wide (classic) case.
 *
 * ── Object-level later (no migration needed) ─────────────────────────────
 * The same shape extends to per-object permissions: create concrete
 * `resource:<id>` objects and relate specific roles/users to them. The type
 * definitions below already support that because permissions are computed
 * from the `assignee` relation of granting roles.
 */

export interface RoleDefinition {
	/** Machine name, e.g. "dev", "qa", "platform_engineer", "parent", "child". */
	name: string;
	/** Human label for the console UI, e.g. "Platform Engineer". */
	label?: string;
	/** Permissions this role grants, e.g. ["read", "write", "deploy"]. */
	permissions: string[];
}

// OpenFGA JSON model types (minimal shape we need).
interface Userset {
	this?: Record<string, never>;
	computedUserset?: { object?: string; relation: string };
	tupleToUserset?: {
		tupleset: { object?: string; relation: string };
		computedUserset: { object?: string; relation: string };
	};
	union?: { child: Userset[] };
}

interface TypeDefinition {
	type: string;
	relations?: Record<string, Userset>;
	metadata?: {
		relations: Record<string, { directly_related_user_types: Array<{ type: string; relation?: string; wildcard?: Record<string, never> }> }>;
	};
}

export interface AuthorizationModel {
	schema_version: '1.1';
	type_definitions: TypeDefinition[];
}

/**
 * Build the OpenFGA authorization model for a tenant from its role list.
 */
export function buildRbacModel(roles: RoleDefinition[]): AuthorizationModel {
	// Collect the full set of distinct permissions across all roles.
	const allPermissions = new Set<string>();
	for (const role of roles) {
		for (const p of role.permissions) allPermissions.add(p);
	}

	// type user
	const userType: TypeDefinition = { type: 'user' };

	// type role: assignee: [user]
	const roleType: TypeDefinition = {
		type: 'role',
		relations: {
			assignee: { this: {} }
		},
		metadata: {
			relations: {
				assignee: { directly_related_user_types: [{ type: 'user' }] }
			}
		}
	};

	// type resource: for each permission, the union of "assignee from <role>"
	// for every role that grants that permission.
	const resourceRelations: Record<string, Userset> = {};
	const resourceMetadata: TypeDefinition['metadata'] = { relations: {} };

	// First declare a relation per role on the resource so we can attach a role
	// object to a resource (needed for tenant-wide `resource:*` and object-level).
	for (const role of roles) {
		const rel = `role_${role.name}`;
		resourceRelations[rel] = { this: {} };
		resourceMetadata!.relations[rel] = {
			directly_related_user_types: [{ type: 'role' }]
		};
	}

	// Then define each permission as: assignee-from any granting role.
	for (const permission of allPermissions) {
		const grantingRoles = roles.filter((r) => r.permissions.includes(permission));
		const children: Userset[] = grantingRoles.map((r) => ({
			tupleToUserset: {
				tupleset: { relation: `role_${r.name}` },
				computedUserset: { relation: 'assignee' }
			}
		}));

		resourceRelations[permission] =
			children.length === 1 ? children[0] : { union: { child: children } };
	}

	const resourceType: TypeDefinition = {
		type: 'resource',
		relations: resourceRelations,
		metadata: resourceMetadata
	};

	return {
		schema_version: '1.1',
		type_definitions: [userType, roleType, resourceType]
	};
}

/**
 * When publishing a model we also need to wire each role to the tenant-wide
 * resource `resource:*` so that a plain "does user have permission" check
 * works without per-object setup. Returns the tuples to write.
 */
export function tenantWideRoleBindings(
	roles: RoleDefinition[]
): Array<{ user: string; relation: string; object: string }> {
	return roles.map((r) => ({
		user: `role:${r.name}`,
		relation: `role_${r.name}`,
		object: 'resource:*'
	}));
}
