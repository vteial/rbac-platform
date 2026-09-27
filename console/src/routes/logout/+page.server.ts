import { redirect } from '@sveltejs/kit';
import { config } from '$lib/server/config';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ cookies }) => {
		cookies.delete(config.session.cookieName, { path: '/' });
		throw redirect(303, '/login');
	}
};
