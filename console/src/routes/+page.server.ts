import { fail } from '@sveltejs/kit';
import { createTenant, listTenants } from '$lib/server/openfga';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const tenants = await listTenants();
	return { tenants };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		if (!name) return fail(400, { error: 'Tenant name is required.' });
		try {
			const tenant = await createTenant(name);
			return { created: tenant.name };
		} catch (err) {
			return fail(500, { error: err instanceof Error ? err.message : 'Failed to create tenant.' });
		}
	}
};
