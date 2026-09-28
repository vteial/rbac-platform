import { fail, redirect } from '@sveltejs/kit';
import { config } from '$lib/server/config';
import { login } from '$lib/server/pocketbase';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Expose demo affordance only when demo mode is on (never in real deployments).
	return {
		demo: config.demo.enabled
			? { email: config.demo.email, password: config.demo.password }
			: null
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { email, error: 'Email and password are required.' });
		}

		try {
			const user = await login(email, password);
			cookies.set(config.session.cookieName, user.token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: config.session.secret !== 'dev-only-insecure-secret' ? true : false,
				maxAge: 60 * 60 * 24 * 7
			});
		} catch {
			return fail(401, { email, error: 'Invalid credentials.' });
		}

		const redirectTo = url.searchParams.get('redirectTo') || '/tenants';
		throw redirect(303, redirectTo);
	}
};
