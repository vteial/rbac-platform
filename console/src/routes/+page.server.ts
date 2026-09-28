import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Public landing page. Authenticated operators skip it and go straight to the
 * tenants dashboard; everyone else sees the hero + get-started CTA.
 */
export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/tenants');
	return {};
};
