import { error, fail } from '@sveltejs/kit';
import {
	assignRole,
	checkPermission,
	listAssignments,
	listTenants,
	publishRoleModel,
	unassignRole
} from '$lib/server/openfga';
import { deleteRole, getRoles, upsertRole } from '$lib/server/role-store';
import type { RoleDefinition } from '$lib/server/model-builder';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const tenants = await listTenants();
	const tenant = tenants.find((t) => t.id === params.storeId);
	if (!tenant) throw error(404, 'Tenant not found');

	const [roles, assignments] = await Promise.all([
		getRoles(params.storeId),
		listAssignments(params.storeId).catch(() => [])
	]);

	return { tenant, roles, assignments };
};

function parsePermissions(raw: string): string[] {
	return raw
		.split(',')
		.map((p) => p.trim().toLowerCase().replace(/\s+/g, '_'))
		.filter(Boolean);
}

export const actions: Actions = {
	// Add or update a role in the tenant's vocabulary, then publish the model.
	saveRole: async ({ params, request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim().toLowerCase().replace(/\s+/g, '_');
		const label = String(form.get('label') ?? '').trim() || name;
		const permissions = parsePermissions(String(form.get('permissions') ?? ''));

		if (!name) return fail(400, { error: 'Role name is required.' });
		if (permissions.length === 0) return fail(400, { error: 'Add at least one permission.' });

		const role: RoleDefinition = { name, label, permissions };
		const roles = await upsertRole(params.storeId, role);
		try {
			await publishRoleModel(params.storeId, roles);
		} catch (err) {
			return fail(500, { error: err instanceof Error ? err.message : 'Publish failed.' });
		}
		return { saved: label };
	},

	removeRole: async ({ params, request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '');
		const roles = await deleteRole(params.storeId, name);
		try {
			if (roles.length > 0) await publishRoleModel(params.storeId, roles);
		} catch (err) {
			return fail(500, { error: err instanceof Error ? err.message : 'Publish failed.' });
		}
		return { removed: name };
	},

	assign: async ({ params, request }) => {
		const form = await request.formData();
		const userId = String(form.get('userId') ?? '').trim();
		const roleName = String(form.get('roleName') ?? '').trim();
		if (!userId || !roleName) return fail(400, { error: 'User and role are required.' });
		try {
			await assignRole(params.storeId, userId, roleName);
		} catch (err) {
			return fail(500, { error: err instanceof Error ? err.message : 'Assign failed.' });
		}
		return { assigned: `${userId} → ${roleName}` };
	},

	unassign: async ({ params, request }) => {
		const form = await request.formData();
		const userId = String(form.get('userId') ?? '');
		const roleName = String(form.get('roleName') ?? '');
		try {
			await unassignRole(params.storeId, userId, roleName);
		} catch (err) {
			return fail(500, { error: err instanceof Error ? err.message : 'Unassign failed.' });
		}
		return { unassigned: `${userId} ✕ ${roleName}` };
	},

	check: async ({ params, request }) => {
		const form = await request.formData();
		const userId = String(form.get('userId') ?? '').trim();
		const permission = String(form.get('permission') ?? '').trim();
		const resourceType = String(form.get('resourceType') ?? 'resource').trim() || 'resource';
		const resourceId = String(form.get('resourceId') ?? '').trim() || undefined;

		if (!userId || !permission) {
			return fail(400, { checkError: 'User and permission are required.' });
		}
		try {
			const allowed = await checkPermission(params.storeId, {
				userId,
				permission,
				resourceType,
				resourceId
			});
			return {
				check: { userId, permission, resourceType, resourceId: resourceId ?? '*', allowed }
			};
		} catch (err) {
			return fail(500, { checkError: err instanceof Error ? err.message : 'Check failed.' });
		}
	}
};
